const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { setTimeout: delay } = require('node:timers/promises');
const { io } = require('socket.io-client');

const port = 4197;
const url = `http://127.0.0.1:${port}`;
const hostToken = 'integration-presenter-code';
let processUnderTest;

function waitForState(socket, predicate, timeout = 2500) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off('state', handler);
      reject(new Error('Timed out waiting for mission state'));
    }, timeout);
    const handler = state => {
      if (!predicate(state)) return;
      clearTimeout(timer);
      socket.off('state', handler);
      resolve(state);
    };
    socket.on('state', handler);
  });
}

async function connect(auth) {
  const socket = io(url, {
    auth,
    autoConnect: false,
    forceNew: true,
    reconnection: false
  });
  const connected = new Promise((resolve, reject) => {
    socket.once('connect', resolve);
    socket.once('connect_error', reject);
  });
  const initialState = waitForState(socket, () => true);
  socket.connect();
  const [, state] = await Promise.all([connected, initialState]);
  return { socket, state };
}

async function freshMission(t) {
  const connection = await connect({ role: 'host', token: hostToken });
  const { socket: host } = connection;
  t.after(() => host.close());
  const resetState = waitForState(host, state => state.runId > connection.state.runId && state.scene === 0);
  host.emit('host', { type: 'reset' });
  return { host, state: await resetState };
}

async function connectAudience(t, clientId) {
  const connection = await connect({ role: 'audience', clientId });
  t.after(async () => {
    connection.socket.close();
    await delay(30);
  });
  return connection;
}

async function setScene(host, scene) {
  const nextState = waitForState(host, state => state.scene === scene);
  host.emit('host', { type: 'scene', value: scene });
  return nextState;
}

function pollTotal(poll) {
  return Object.values(poll).reduce((sum, value) => sum + value, 0);
}

function allPollsEmpty(polls) {
  return Object.values(polls).every(poll => pollTotal(poll) === 0);
}

function validTestModel(trainedAt = 1) {
  return {
    hidden: 2,
    trainedAt,
    layers: [
      { w: [[1, 1], [-1, -1]], b: [0, 0] },
      { w: [[1, -1]], b: [0] }
    ]
  };
}

test.before(async () => {
  processUnderTest = spawn(process.execPath, ['server.js'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      PUBLIC_URL: `${url}/audience.html`,
      HOST_TOKEN: hostToken
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Server did not start')), 3000);
    processUnderTest.stdout.on('data', chunk => {
      if (!String(chunk).includes('SIGNAL / 2045 stage')) return;
      clearTimeout(timer);
      resolve();
    });
    processUnderTest.once('error', reject);
    processUnderTest.once('exit', code => {
      if (code == null || code === 0) return;
      clearTimeout(timer);
      reject(new Error(`Server exited before startup with code ${code}`));
    });
  });
});

test.after(() => {
  processUnderTest?.kill('SIGTERM');
});

test('serves stage, phone and QR configuration', async () => {
  const [stage, phone, config] = await Promise.all([
    fetch(`${url}/`),
    fetch(`${url}/audience.html`),
    fetch(`${url}/api/config`).then(response => response.json())
  ]);
  assert.equal(stage.status, 200);
  assert.equal(phone.status, 200);
  assert.equal(config.audienceUrl, `${url}/audience.html`);
  assert.match(config.qr, /^data:image\/png;base64,/);
});

test('rejects presenter connections without the access code', async () => {
  const socket = io(url, {
    auth: { role: 'host' },
    forceNew: true,
    reconnection: false
  });
  const error = await new Promise(resolve => socket.once('connect_error', resolve));
  assert.equal(error.data.code, 'HOST_AUTH_REQUIRED');
  socket.close();
});

test('accepts one sample per audience member with working and changed labels', async t => {
  const { host } = await freshMission(t);
  const working = await connectAudience(t, 'SAMPLE-WORKING');
  const changed = await connectAudience(t, 'SAMPLE-CHANGED');

  const workingState = waitForState(host, state => state.samples.some(sample => sample.id === 'SAMPLE-WORKING'));
  working.socket.emit('sample', { water: 82, carbon: 78, label: 'working' });
  await workingState;

  const changedState = waitForState(host, state => state.samples.some(sample => sample.id === 'SAMPLE-CHANGED'));
  changed.socket.emit('sample', { water: 84, carbon: 24, label: 'changed' });
  let state = await changedState;

  assert.equal(state.samples.find(sample => sample.id === 'SAMPLE-WORKING').label, 1);
  assert.equal(state.samples.find(sample => sample.id === 'SAMPLE-CHANGED').label, 0);
  assert.equal(state.contributorCount, 2);

  working.socket.emit('sample', { water: 1, carbon: 1, label: 'changed' });
  await delay(75);
  const duplicateCheck = waitForState(host, next => next.scene === 12);
  host.emit('host', { type: 'scene', value: 12 });
  state = await duplicateCheck;
  const workingSamples = state.samples.filter(sample => sample.id === 'SAMPLE-WORKING');
  assert.equal(workingSamples.length, 1);
  assert.equal(workingSamples[0].label, 1);
  assert.equal(workingSamples[0].water, 82);

  const late = await connectAudience(t, 'SAMPLE-TOO-LATE');
  late.socket.emit('sample', { water: 70, carbon: 70, label: 'working' });
  await delay(75);
  const finalCheck = await setScene(host, 0);
  assert.equal(finalCheck.samples.some(sample => sample.id === 'SAMPLE-TOO-LATE'), false);

  const audienceView = await waitForState(working.socket, next => next.scene === 0);
  assert.deepEqual(audienceView.samples, []);
  assert.equal(audienceView.sampleCount, 2);
});

test('accepts each vote only on its scene and blocks duplicate votes', async t => {
  const { host } = await freshMission(t);
  const { socket: audience } = await connectAudience(t, 'VOTE-LEDGER');
  const cases = [
    ['microscope', 4, 'no'],
    ['primer', 6, 'gacac'],
    ['architecture', 11, 'four'],
    ['trust', 14, 'verify'],
    ['return', 17, 'orbit']
  ];

  for (const [poll, scene, choice] of cases) {
    let state = await setScene(host, 0);
    audience.emit('vote', { poll, choice });
    await delay(60);
    state = await setScene(host, scene);
    assert.equal(pollTotal(state.polls[poll]), 0, `${poll} vote leaked in from the wrong scene`);

    const accepted = waitForState(host, next => next.polls[poll][choice] === 1);
    audience.emit('vote', { poll, choice });
    state = await accepted;
    assert.equal(pollTotal(state.polls[poll]), 1);

    const duplicateChoice = Object.keys(state.polls[poll]).find(key => key !== choice);
    audience.emit('vote', { poll, choice: duplicateChoice });
    await delay(60);
    state = await setScene(host, scene);
    assert.equal(state.polls[poll][choice], 1);
    assert.equal(state.polls[poll][duplicateChoice], 0);
    assert.equal(pollTotal(state.polls[poll]), 1);
  }
});

test('keeps PCR and UV input capped at 24 across reconnects', async t => {
  const { host } = await freshMission(t);
  let connection = await connectAudience(t, 'CAPS-PERSIST');

  await setScene(host, 5);
  let capped = waitForState(host, state => state.pcrTaps === 24);
  for (let index = 0; index < 30; index += 1) connection.socket.emit('pcr-tap');
  let state = await capped;
  assert.equal(state.pcrTaps, 24);

  await setScene(host, 9);
  capped = waitForState(host, next => next.photonCount === 24);
  for (let index = 0; index < 30; index += 1) connection.socket.emit('photon', { x: 50 });
  state = await capped;
  assert.equal(state.photonCount, 24);

  const participantsBeforeDisconnect = state.participants;
  const disconnected = waitForState(host, next => next.participants === participantsBeforeDisconnect - 1);
  connection.socket.close();
  await disconnected;
  connection = await connectAudience(t, 'CAPS-PERSIST');

  await setScene(host, 5);
  for (let index = 0; index < 10; index += 1) connection.socket.emit('pcr-tap');
  await delay(75);
  state = await setScene(host, 9);
  assert.equal(state.pcrTaps, 24);

  for (let index = 0; index < 10; index += 1) connection.socket.emit('photon', { x: 50 });
  await delay(75);
  state = await setScene(host, 9);
  assert.equal(state.photonCount, 24);
  assert.equal(state.contributorCount, 1);
});

test('closes room-wide PCR at 120 taps and UV exposure at 48 taps', async t => {
  const { host } = await freshMission(t);
  const audience = [];
  for (let index = 0; index < 6; index += 1) {
    audience.push(await connectAudience(t, `ROOM-LIMIT-${index + 1}`));
  }

  await setScene(host, 5);
  for (let index = 0; index < 5; index += 1) {
    const expected = (index + 1) * 24;
    const reached = waitForState(host, state => (
      state.pcrTaps === expected && (expected < 120 || state.reveals.pcrComplete === true)
    ));
    for (let tap = 0; tap < 24; tap += 1) audience[index].socket.emit('pcr-tap');
    await reached;
  }

  let state = await setScene(host, 5);
  assert.equal(state.pcrTaps, 120);
  assert.equal(state.reveals.pcrComplete, true);

  for (let tap = 0; tap < 24; tap += 1) audience[5].socket.emit('pcr-tap');
  await delay(75);
  state = await setScene(host, 5);
  assert.equal(state.pcrTaps, 120, 'an unused client must not tap after room completion');

  await setScene(host, 9);
  for (let index = 0; index < 2; index += 1) {
    const expected = (index + 1) * 24;
    const reached = waitForState(host, next => next.photonCount === expected);
    for (let tap = 0; tap < 24; tap += 1) audience[index].socket.emit('photon', { x: 50 });
    await reached;
  }

  state = await setScene(host, 9);
  assert.equal(state.photonCount, 48);

  for (let tap = 0; tap < 24; tap += 1) audience[5].socket.emit('photon', { x: 50 });
  await delay(75);
  state = await setScene(host, 9);
  assert.equal(state.photonCount, 48, 'an unused client must not add light after room exposure completes');
});

test('presenter completion reveals stop later PCR and UV input', async t => {
  const { host } = await freshMission(t);
  const first = await connectAudience(t, 'PRESENTER-GATE-FIRST');
  const later = await connectAudience(t, 'PRESENTER-GATE-LATER');

  await setScene(host, 5);
  let nextState = waitForState(host, state => state.pcrTaps === 1);
  first.socket.emit('pcr-tap');
  await nextState;

  nextState = waitForState(host, state => state.reveals.pcrComplete === true);
  host.emit('host', { type: 'reveal', key: 'pcrComplete', value: true });
  await nextState;
  for (let tap = 0; tap < 24; tap += 1) later.socket.emit('pcr-tap');
  await delay(75);
  let state = await setScene(host, 5);
  assert.equal(state.pcrTaps, 1);
  assert.equal(state.reveals.pcrComplete, true);

  await setScene(host, 9);
  nextState = waitForState(host, next => next.photonCount === 1);
  first.socket.emit('photon', { x: 50 });
  await nextState;

  nextState = waitForState(host, next => next.reveals.chip === true);
  host.emit('host', { type: 'reveal', key: 'chip', value: true });
  await nextState;
  for (let tap = 0; tap < 24; tap += 1) later.socket.emit('photon', { x: 50 });
  await delay(75);
  state = await setScene(host, 9);
  assert.equal(state.photonCount, 1);
  assert.equal(state.reveals.chip, true);
});

test('accepts challenges only in scene 13 when a model exists', async t => {
  const { host } = await freshMission(t);
  const { socket: audience } = await connectAudience(t, 'MODEL-CHALLENGE');

  let state = await setScene(host, 13);
  audience.emit('challenge', { water: 70, carbon: 65, prediction: 0.8 });
  await delay(60);
  state = await setScene(host, 13);
  assert.equal(state.challenges.length, 0);

  const modelState = waitForState(host, next => Boolean(next.model));
  host.emit('host', { type: 'model', model: validTestModel() });
  await modelState;

  await setScene(host, 12);
  audience.emit('challenge', { water: 70, carbon: 65, prediction: 0.8 });
  await delay(60);
  state = await setScene(host, 13);
  assert.equal(state.challenges.length, 0);

  const accepted = waitForState(host, next => next.challenges.some(challenge => challenge.id === 'MODEL-CHALLENGE'));
  audience.emit('challenge', { water: 70, carbon: 65, prediction: 0.8 });
  state = await accepted;
  assert.equal(state.challenges.length, 1);
  assert.deepEqual(
    { water: state.challenges[0].water, carbon: state.challenges[0].carbon, prediction: state.challenges[0].prediction },
    { water: 70, carbon: 65, prediction: 0.8 }
  );
});

test('clamps and updates one burn per audience member in scene 16', async t => {
  const { host } = await freshMission(t);
  const { socket: audience } = await connectAudience(t, 'BURN-UPDATE');

  await setScene(host, 15);
  audience.emit('burn', { value: 50 });
  await delay(60);
  let state = await setScene(host, 16);
  assert.equal(state.burns.length, 0);

  let burnState = waitForState(host, next => next.burns.some(burn => burn.id === 'BURN-UPDATE'));
  audience.emit('burn', { value: 50 });
  state = await burnState;
  assert.equal(state.burns[0].value, 96);

  burnState = waitForState(host, next => next.burns[0]?.value === 145);
  audience.emit('burn', { value: 200 });
  state = await burnState;
  assert.equal(state.burns.length, 1);
  assert.equal(state.burns[0].value, 145);

  burnState = waitForState(host, next => next.burns[0]?.value === 103);
  audience.emit('burn', { value: 103 });
  state = await burnState;
  assert.equal(state.burns.length, 1);
  assert.equal(state.burns[0].value, 103);
});

test('sample-only demo data does not preload later votes or burns', async t => {
  const { host } = await freshMission(t);
  const demoState = waitForState(host, state => state.demo && state.samples.some(sample => sample.source === 'demo'));
  host.emit('host', { type: 'demo', scope: 'samples' });
  const state = await demoState;

  assert.equal(state.samples.filter(sample => sample.source === 'demo').length, 21);
  assert.equal(state.samples.filter(sample => sample.source === 'demo').every(sample => (
    sample.label === Number(sample.water >= 60 && sample.carbon >= 60)
  )), true, 'Every starter demo label should follow the answer key shown on phones');
  assert.equal(allPollsEmpty(state.polls), true);
  assert.deepEqual(state.burns, []);
  assert.equal(state.demoComplete, false);
});

test('full demo fallback preserves real samples, votes and burns', async t => {
  const { host } = await freshMission(t);
  const { socket: audience } = await connectAudience(t, 'DEMO-PRESERVE');

  let nextState = waitForState(host, state => state.samples.some(sample => sample.id === 'DEMO-PRESERVE'));
  audience.emit('sample', { water: 80, carbon: 76, label: 'working' });
  await nextState;

  await setScene(host, 4);
  nextState = waitForState(host, state => state.polls.microscope.no === 1);
  audience.emit('vote', { poll: 'microscope', choice: 'no' });
  await nextState;

  await setScene(host, 16);
  nextState = waitForState(host, state => state.burns.some(burn => burn.id === 'DEMO-PRESERVE'));
  audience.emit('burn', { value: 104 });
  await nextState;

  const demoState = waitForState(host, state => state.demoComplete && state.samples.some(sample => sample.source === 'demo'));
  host.emit('host', { type: 'demo' });
  const state = await demoState;

  assert.equal(state.samples.filter(sample => sample.id === 'DEMO-PRESERVE').length, 1);
  assert.ok(state.samples.some(sample => sample.source === 'demo'));
  assert.deepEqual(state.polls.microscope, { yes: 0, no: 1 });
  assert.deepEqual(state.burns, [{ id: 'DEMO-PRESERVE', value: 104 }]);
  assert.equal(state.demoComplete, true);

  const resetState = waitForState(host, next => next.runId > state.runId && next.scene === 0);
  host.emit('host', { type: 'reset' });
  const reset = await resetState;
  assert.equal(reset.demo, false);
  assert.equal(reset.demoComplete, false);
});

test('radiation controls are idempotent and use sample-only fallback', async t => {
  const { host } = await freshMission(t);

  let contaminated = waitForState(host, state => state.samples.filter(sample => sample.source === 'radiation').length === 4);
  host.emit('host', { type: 'contaminate' });
  let state = await contaminated;
  assert.equal(state.samples.filter(sample => sample.source === 'demo').length, 21);
  assert.equal(state.samples.filter(sample => sample.source === 'radiation').length, 4);
  assert.equal(allPollsEmpty(state.polls), true);
  assert.deepEqual(state.burns, []);

  contaminated = waitForState(host, next => next.samples.filter(sample => sample.source === 'radiation').length === 4);
  host.emit('host', { type: 'contaminate' });
  state = await contaminated;
  assert.equal(state.samples.filter(sample => sample.source === 'radiation').length, 4);
  assert.equal(state.samples.length, 25);
});

test('contributor count persists after disconnect and deduplicates reconnects', async t => {
  const { host } = await freshMission(t);
  let connection = await connectAudience(t, 'CONTRIBUTOR-ONE');

  const contributed = waitForState(host, state => state.contributorCount === 1);
  connection.socket.emit('sample', { water: 75, carbon: 70, label: 'working' });
  await contributed;

  const beforeDisconnect = connection.state.participants;
  const disconnected = waitForState(host, state => state.participants === beforeDisconnect - 1);
  connection.socket.close();
  let state = await disconnected;
  assert.equal(state.contributorCount, 1);

  connection = await connectAudience(t, 'CONTRIBUTOR-ONE');
  state = connection.state;
  assert.ok(state.participants >= 1);
  assert.equal(state.contributorCount, 1);
});

test('mission reset clears state and every per-client ledger', async t => {
  const { host, state: initial } = await freshMission(t);
  const { socket: audience } = await connectAudience(t, 'RESET-LEDGERS');

  let nextState = waitForState(host, state => state.samples.some(sample => sample.id === 'RESET-LEDGERS'));
  audience.emit('sample', { water: 77, carbon: 72, label: 'working' });
  await nextState;

  await setScene(host, 4);
  nextState = waitForState(host, state => state.polls.microscope.no === 1);
  audience.emit('vote', { poll: 'microscope', choice: 'no' });
  await nextState;

  await setScene(host, 5);
  nextState = waitForState(host, state => state.pcrTaps === 24);
  for (let index = 0; index < 24; index += 1) audience.emit('pcr-tap');
  await nextState;

  await setScene(host, 9);
  nextState = waitForState(host, state => state.photonCount === 24);
  for (let index = 0; index < 24; index += 1) audience.emit('photon', { x: 50 });
  await nextState;

  await setScene(host, 16);
  nextState = waitForState(host, state => state.burns.length === 1);
  audience.emit('burn', { value: 105 });
  await nextState;

  const modelState = waitForState(host, state => Boolean(state.model));
  host.emit('host', { type: 'model', model: validTestModel(2) });
  await modelState;
  await setScene(host, 13);
  nextState = waitForState(host, state => state.challenges.length === 1);
  audience.emit('challenge', { water: 60, carbon: 60, prediction: 0.6 });
  await nextState;

  const revealed = waitForState(host, state => state.reveals.microscope === true);
  host.emit('host', { type: 'reveal', key: 'microscope', value: true });
  await revealed;

  const resetState = waitForState(host, state => state.runId > initial.runId && state.scene === 0);
  host.emit('host', { type: 'reset' });
  let state = await resetState;

  assert.ok(state.participants >= 1);
  assert.equal(state.contributorCount, 0);
  assert.deepEqual(state.samples, []);
  assert.deepEqual(state.challenges, []);
  assert.equal(allPollsEmpty(state.polls), true);
  assert.equal(state.pcrTaps, 0);
  assert.equal(state.photonCount, 0);
  assert.deepEqual(state.burns, []);
  assert.deepEqual(state.reveals, {});
  assert.deepEqual(state.training, { epoch: 0, loss: null, accuracy: null, testAccuracy: null, active: false });
  assert.equal(state.model, null);
  assert.equal(state.demo, false);
  assert.equal(state.demoComplete, false);

  nextState = waitForState(host, next => next.samples.some(sample => sample.id === 'RESET-LEDGERS'));
  audience.emit('sample', { water: 65, carbon: 62, label: 'changed' });
  state = await nextState;
  assert.equal(state.samples[0].label, 0);

  await setScene(host, 4);
  nextState = waitForState(host, next => next.polls.microscope.no === 1);
  audience.emit('vote', { poll: 'microscope', choice: 'no' });
  await nextState;

  await setScene(host, 5);
  nextState = waitForState(host, next => next.pcrTaps === 1);
  audience.emit('pcr-tap');
  await nextState;

  await setScene(host, 9);
  nextState = waitForState(host, next => next.photonCount === 1);
  audience.emit('photon', { x: 50 });
  await nextState;

  await setScene(host, 16);
  nextState = waitForState(host, next => next.burns.length === 1);
  audience.emit('burn', { value: 100 });
  state = await nextState;

  assert.equal(state.polls.microscope.no, 1);
  assert.equal(state.pcrTaps, 1);
  assert.equal(state.photonCount, 1);
  assert.deepEqual(state.burns, [{ id: 'RESET-LEDGERS', value: 100 }]);
  assert.equal(state.contributorCount, 1);
});
