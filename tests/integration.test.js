const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { io } = require('socket.io-client');

const port = 4197;
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

test.before(async () => {
  processUnderTest = spawn(process.execPath, ['server.js'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      PUBLIC_URL: `http://127.0.0.1:${port}/audience.html`,
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
  });
});

test.after(() => {
  processUnderTest?.kill('SIGTERM');
});

test('serves stage, phone and QR configuration', async () => {
  const [stage, phone, config] = await Promise.all([
    fetch(`http://127.0.0.1:${port}/`),
    fetch(`http://127.0.0.1:${port}/audience.html`),
    fetch(`http://127.0.0.1:${port}/api/config`).then(response => response.json())
  ]);
  assert.equal(stage.status, 200);
  assert.equal(phone.status, 200);
  assert.equal(config.audienceUrl, `http://127.0.0.1:${port}/audience.html`);
  assert.match(config.qr, /^data:image\/png;base64,/);
});

test('rejects presenter connections without the access code', async () => {
  const socket = io(`http://127.0.0.1:${port}`, {
    auth: { role: 'host' },
    reconnection: false
  });
  const error = await new Promise(resolve => socket.once('connect_error', resolve));
  assert.equal(error.data.code, 'HOST_AUTH_REQUIRED');
  socket.close();
});

test('synchronises persistent audience input through the full mission', async () => {
  const url = `http://127.0.0.1:${port}`;
  const host = io(url, { auth: { role: 'host', token: hostToken } });
  const audience = io(url, { auth: { role: 'audience', clientId: 'TEST-101' } });
  await Promise.all([
    new Promise(resolve => host.once('connect', resolve)),
    new Promise(resolve => audience.once('connect', resolve))
  ]);

  const sampleState = waitForState(host, state => state.samples.some(sample => sample.id === 'TEST-101'));
  const privateAudienceState = waitForState(audience, state => state.sampleCount === 1);
  audience.emit('sample', { water: 78, carbon: 74, label: 'life' });
  let state = await sampleState;
  const audienceView = await privateAudienceState;
  assert.equal(state.samples.filter(sample => sample.id === 'TEST-101').length, 1);
  assert.deepEqual(audienceView.samples, []);

  audience.emit('sample', { water: 10, carbon: 10, label: 'geology' });
  await new Promise(resolve => setTimeout(resolve, 80));

  const voteState = waitForState(host, next => next.polls.primer.gacac === 1);
  audience.emit('vote', { poll: 'primer', choice: 'gacac' });
  state = await voteState;
  assert.equal(state.polls.primer.gacac, 1);

  audience.emit('vote', { poll: 'primer', choice: 'ctgtg' });
  await new Promise(resolve => setTimeout(resolve, 80));

  const burnState = waitForState(host, next => next.burns.some(burn => burn.id === 'TEST-101' && burn.value === 103));
  audience.emit('burn', { value: 103 });
  state = await burnState;
  assert.equal(state.burns.find(burn => burn.id === 'TEST-101').value, 103);

  const finalState = waitForState(audience, next => next.scene === 18);
  host.emit('host', { type: 'scene', value: 18 });
  state = await finalState;
  assert.equal(state.scene, 18);

  const demoState = waitForState(host, next => next.demo && next.samples.length >= 20);
  host.emit('host', { type: 'demo' });
  state = await demoState;
  assert.ok(state.samples.some(sample => sample.source === 'audience'));
  assert.ok(state.samples.some(sample => sample.source === 'demo'));

  const resetState = waitForState(audience, next => next.runId > state.runId && next.scene === 0);
  host.emit('host', { type: 'reset' });
  const reset = await resetState;
  assert.equal(reset.samples.length, 0);
  assert.equal(reset.burns.length, 0);

  host.close();
  audience.close();
});
