const express = require('express');
const http = require('http');
const os = require('os');
const path = require('path');
const QRCode = require('qrcode');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { pingTimeout: 20000 });
const PORT = Number(process.env.PORT) || 4173;
const HOST_TOKEN = process.env.HOST_TOKEN || '';
const LAST_SCENE = 18;

function emptyPolls() {
  return {
    microscope: { yes: 0, no: 0 },
    primer: { gacac: 0, ctgtg: 0, gtgtg: 0, random: 0 },
    architecture: { two: 0, four: 0, eight: 0 },
    trust: { deploy: 0, verify: 0 },
    return: { earth: 0, orbit: 0, remote: 0 }
  };
}

const state = {
  runId: 1,
  scene: 0,
  participants: 0,
  samples: [],
  challenges: [],
  polls: emptyPolls(),
  pcrTaps: 0,
  photonCount: 0,
  burns: [],
  reveals: {},
  training: { epoch: 0, loss: null, accuracy: null, testAccuracy: null, active: false },
  model: null,
  demo: false
};
const audienceConnections = new Map();
const voteLedger = Object.fromEntries(Object.keys(emptyPolls()).map(key => [key, new Set()]));

function localAddress() {
  const interfaces = os.networkInterfaces();
  const ordered = [
    ...(interfaces.en0 || []),
    ...Object.entries(interfaces)
      .filter(([name]) => name !== 'en0')
      .flatMap(([, entries]) => entries || [])
  ];
  return ordered.find(entry => entry.family === 'IPv4' && !entry.internal)?.address || 'localhost';
}

function audienceUrl(req) {
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL;

  const requestHost = req?.get('host');
  const hostname = requestHost?.replace(/^\[|\]$/g, '').split(':')[0];
  if (requestHost && !['localhost', '127.0.0.1', '::1'].includes(hostname)) {
    const forwardedProtocol = String(req.get('x-forwarded-proto') || '').split(',')[0].trim();
    return `${forwardedProtocol || req.protocol}://${requestHost}/audience.html`;
  }

  return `http://${localAddress()}:${PORT}/audience.html`;
}

function audienceSnapshot() {
  return {
    ...state,
    samples: [],
    challenges: [],
    burns: [],
    sampleCount: state.samples.length,
    challengeCount: state.challenges.length,
    burnCount: state.burns.length
  };
}

function emitState(target) {
  if (target) {
    target.emit('state', target.data.role === 'host' ? state : audienceSnapshot());
    return;
  }
  for (const connected of io.sockets.sockets.values()) {
    connected.emit('state', connected.data.role === 'host' ? state : audienceSnapshot());
  }
}

app.use(express.static(path.join(__dirname, 'public')));
app.get('/favicon.ico', (_req, res) => res.status(204).end());
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.get('/api/config', async (req, res) => {
  const url = audienceUrl(req);
  res.json({
    audienceUrl: url,
    qr: await QRCode.toDataURL(url, {
      margin: 1,
      width: 420,
      color: { dark: '#07110f', light: '#f3fff9' }
    })
  });
});

io.use((socket, next) => {
  if (socket.handshake.auth?.role !== 'host' || !HOST_TOKEN) return next();
  if (socket.handshake.auth?.token === HOST_TOKEN) return next();
  const error = new Error('Presenter access code required');
  error.data = { code: 'HOST_AUTH_REQUIRED' };
  return next(error);
});

io.on('connection', socket => {
  const role = socket.handshake.auth?.role === 'host' ? 'host' : 'audience';
  const claimedId = String(socket.handshake.auth?.clientId || socket.id).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48);
  const clientId = role === 'audience' && claimedId ? claimedId : socket.id;
  socket.data.role = role;
  socket.data.clientId = clientId;
  socket.data.votes = {};
  socket.data.pcrTaps = 0;
  socket.data.photons = 0;

  if (role === 'audience') {
    audienceConnections.set(clientId, (audienceConnections.get(clientId) || 0) + 1);
    state.participants = audienceConnections.size;
  }
  emitState(socket);
  emitState();

  socket.on('disconnect', () => {
    if (socket.data.role === 'audience') {
      const remaining = (audienceConnections.get(clientId) || 1) - 1;
      if (remaining <= 0) audienceConnections.delete(clientId);
      else audienceConnections.set(clientId, remaining);
      state.participants = audienceConnections.size;
      emitState();
    }
  });

  socket.on('sample', payload => {
    if (role !== 'audience' || state.samples.some(sample => sample.id === clientId)) return;
    const sample = {
      id: clientId,
      water: clamp(payload?.water),
      carbon: clamp(payload?.carbon),
      label: payload?.label === 'life' ? 1 : 0,
      source: 'audience'
    };
    state.samples.push(sample);
    emitState();
  });

  socket.on('vote', payload => {
    if (role !== 'audience') return;
    const poll = payload?.poll;
    const choice = payload?.choice;
    if (!state.polls[poll] || !(choice in state.polls[poll]) || voteLedger[poll].has(clientId)) return;
    socket.data.votes[poll] = choice;
    voteLedger[poll].add(clientId);
    state.polls[poll][choice] += 1;
    emitState();
  });

  socket.on('pcr-tap', () => {
    if (role !== 'audience' || socket.data.pcrTaps >= 24) return;
    socket.data.pcrTaps += 1;
    state.pcrTaps += 1;
    emitState();
  });

  socket.on('photon', payload => {
    if (role !== 'audience' || socket.data.photons >= 24) return;
    socket.data.photons += 1;
    state.photonCount += 1;
    io.emit('photon', {
      x: clamp(payload?.x),
      color: ['cyan', 'violet', 'gold'][state.photonCount % 3],
      count: state.photonCount
    });
    emitState();
  });

  socket.on('burn', payload => {
    if (role !== 'audience') return;
    const value = Math.max(50, Math.min(150, Number(payload?.value) || 100));
    const previous = state.burns.find(item => item.id === clientId);
    if (previous) previous.value = value;
    else state.burns.push({ id: clientId, value });
    emitState();
  });

  socket.on('challenge', payload => {
    if (role !== 'audience' || !state.model) return;
    const challenge = {
      id: clientId,
      water: clamp(payload?.water),
      carbon: clamp(payload?.carbon),
      prediction: Math.max(0, Math.min(1, Number(payload?.prediction) || 0))
    };
    const previous = state.challenges.find(item => item.id === clientId);
    if (previous) Object.assign(previous, challenge);
    else state.challenges.push(challenge);
    emitState();
  });

  socket.on('host', command => {
    if (role !== 'host' || !command) return;
    switch (command.type) {
      case 'scene':
        state.scene = Math.max(0, Math.min(LAST_SCENE, Number(command.value) || 0));
        break;
      case 'reveal':
        state.reveals[String(command.key)] = Boolean(command.value);
        break;
      case 'training':
        state.training = {
          epoch: Math.max(0, Number(command.epoch) || 0),
          loss: Number.isFinite(command.loss) ? command.loss : null,
          accuracy: Number.isFinite(command.accuracy) ? command.accuracy : null,
          testAccuracy: Number.isFinite(command.testAccuracy) ? command.testAccuracy : null,
          active: Boolean(command.active)
        };
        break;
      case 'model':
        if (validModel(command.model)) state.model = command.model;
        break;
      case 'clear-model':
        state.model = null;
        state.training = { epoch: 0, loss: null, accuracy: null, testAccuracy: null, active: false };
        state.challenges = [];
        break;
      case 'demo':
        seedDemoData();
        break;
      case 'contaminate':
        injectRadiationControls();
        state.model = null;
        state.training = { epoch: 0, loss: null, accuracy: null, testAccuracy: null, active: false };
        break;
      case 'reset':
        resetMission();
        break;
      default:
        return;
    }
    emitState();
  });
});

function clamp(value) {
  return Math.max(0, Math.min(100, Number(value) || 0));
}

function validModel(model) {
  return Boolean(model && Array.isArray(model.layers) && model.layers.length && model.layers.length <= 3);
}

function seedDemoData() {
  if (state.samples.filter(sample => sample.source === 'demo').length) return;
  const demo = [
    [18, 22, 0], [26, 31, 0], [34, 18, 0], [41, 29, 0], [52, 22, 0],
    [20, 62, 0], [33, 73, 0], [46, 68, 0], [58, 79, 0],
    [59, 52, 1], [64, 64, 1], [70, 58, 1], [73, 72, 1], [78, 67, 1],
    [82, 81, 1], [88, 72, 1], [67, 86, 1], [91, 89, 1],
    [83, 31, 0], [92, 44, 0], [72, 24, 0]
  ];
  demo.forEach((row, index) => state.samples.push({
    id: `demo-${index}`,
    water: row[0],
    carbon: row[1],
    label: row[2],
    source: 'demo'
  }));
  state.polls.microscope = { yes: 7, no: 13 };
  state.polls.primer = { gacac: 14, ctgtg: 3, gtgtg: 2, random: 1 };
  state.polls.architecture = { two: 3, four: 9, eight: 8 };
  state.polls.trust = { deploy: 5, verify: 15 };
  state.polls.return = { earth: 4, orbit: 10, remote: 6 };
  state.burns = [72, 84, 91, 96, 99, 100, 103, 106, 112, 121, 128].map((value, index) => ({ id: `demo-${index}`, value }));
  state.demo = true;
}

function injectRadiationControls() {
  if (state.samples.some(sample => sample.source === 'radiation')) return;
  [[82, 74, 0], [87, 79, 0], [91, 83, 0], [77, 70, 0]].forEach((row, index) => {
    state.samples.push({
      id: `radiation-${index}`,
      water: row[0],
      carbon: row[1],
      label: row[2],
      source: 'radiation'
    });
  });
}

function resetMission() {
  state.runId += 1;
  state.scene = 0;
  state.samples = [];
  state.challenges = [];
  state.polls = emptyPolls();
  state.pcrTaps = 0;
  state.photonCount = 0;
  state.burns = [];
  state.reveals = {};
  state.training = { epoch: 0, loss: null, accuracy: null, testAccuracy: null, active: false };
  state.model = null;
  state.demo = false;
  Object.values(voteLedger).forEach(ledger => ledger.clear());
  for (const connected of io.sockets.sockets.values()) {
    connected.data.votes = {};
    connected.data.pcrTaps = 0;
    connected.data.photons = 0;
  }
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`SIGNAL / 2045 stage: http://localhost:${PORT}`);
  console.log(`Audience link: ${audienceUrl()}`);
});
