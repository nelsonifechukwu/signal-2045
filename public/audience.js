const callsign = getCallsign();
const socket = io({ auth: { role: 'audience', clientId: callsign }, reconnection: true });
const root = document.querySelector('#phone-content');
const stationNumber = Number(callsign.split('-')[1]);
const assignedSample = makeAssignedSample(stationNumber);

let state = null;
let lastScene = -1;
let localRunId = null;
let submittedSample = false;
let votes = new Set();
let sampleChoice = null;
let pcrTaps = 0;
let photons = 0;
let challenge = { water: 72, carbon: 66 };
let lastModelVersion = null;
let currentMode = '';

document.querySelector('#callsign').textContent = callsign;

socket.on('connect', () => {
  document.querySelector('#connection-label').textContent = 'LIVE';
  document.querySelector('.phone-status').classList.remove('offline');
});
socket.on('disconnect', () => {
  document.querySelector('#connection-label').textContent = 'RECONNECTING';
  document.querySelector('.phone-status').classList.add('offline');
});

socket.on('state', next => {
  const runChanged = localRunId !== null && localRunId !== next.runId;
  if (runChanged) resetLocal();
  localRunId = next.runId;
  state = next;
  const sceneChanged = next.scene !== lastScene;
  const modelVersion = next.model?.trainedAt || null;
  const modelChanged = modelVersion !== lastModelVersion;
  lastModelVersion = modelVersion;
  lastScene = next.scene;
  updatePhoneChrome(next.scene);
  if (sceneChanged || runChanged || (next.scene === 13 && modelChanged)) renderPhone();
  else updateLiveElements();
});

socket.on('photon', () => {
  if (state?.scene === 9 && navigator.vibrate) navigator.vibrate(7);
});

function getCallsign() {
  let value = localStorage.getItem('signal2045-callsign');
  if (!value) {
    value = `HELIX-${String(Math.floor(Math.random() * 900) + 100)}`;
    localStorage.setItem('signal2045-callsign', value);
  }
  return value;
}

function makeAssignedSample(seed) {
  const intact = seed % 3 !== 0;
  const offsetA = seed % 17;
  const offsetB = (seed * 7) % 19;
  if (intact) return { water: 67 + offsetA, carbon: 61 + offsetB, hiddenTruth: 1 };
  return seed % 2
    ? { water: 72 + offsetA, carbon: 18 + offsetB, hiddenTruth: 0 }
    : { water: 24 + offsetA, carbon: 58 + offsetB, hiddenTruth: 0 };
}

function resetLocal() {
  submittedSample = false;
  votes = new Set();
  sampleChoice = null;
  pcrTaps = 0;
  photons = 0;
  challenge = { water: 72, carbon: 66 };
  currentMode = '';
}

function updatePhoneChrome(scene) {
  const labels = ['PRE-SHOW','ALERT','MISSION','GENETICS','GENETICS','PCR','PRIMERS','HANDOFF','NANOSCALE','LITHOGRAPHY','CHIP','DATA','TRAIN','TEST','AUDIT','ORBIT','FLIGHT','DECIDE','COMPLETE'];
  document.querySelector('#phone-scene').textContent = labels[scene] || 'MISSION';
  const accents = ['#baff66','#baff66','#baff66','#ff8cba','#ff8cba','#ff8cba','#ff8cba','#ff8cba','#67e8f9','#67e8f9','#67e8f9','#baff66','#baff66','#baff66','#baff66','#9fa8ff','#9fa8ff','#9fa8ff','#ffe06b'];
  document.body.style.setProperty('--accent', accents[scene] || '#baff66');
}

function renderPhone() {
  if (!state) return;
  const scene = state.scene;
  if ((!submittedSample && [0, 2, 3, 8, 10, 11].includes(scene)) || (scene === 0 && !submittedSample)) return renderSampleCard();
  if (scene === 0) return waiting('Station calibrated', 'Your labelled control is already on the stage. Keep this tab open—the next command will arrive here.');
  if (scene === 1) return waiting('Radiation alert received', 'HELIX–7 has produced conflicting DNA and light readings. Watch the main screen.');
  if (scene === 2) return waiting('You are mission control', 'Three students will connect genetics, nanotechnology, AI and orbital physics. You will change each system.');
  if (scene === 3) return infoCard('ENGINEERED CIRCUIT', 'Instruction + status light', 'The yeast contains a model-protein gene and a fluorescent reporter. If the circuit is read correctly, the reporter should glow.');
  if (scene === 4) return renderVote('microscope', 'Can a microscope read DNA letters?', 'Commit before the answer appears.', [
    ['yes', 'YES', 'Zoom far enough'], ['no', 'NO', 'Use another method']
  ]);
  if (scene === 5) return renderPCRControl();
  if (scene === 6) return renderVote('primer', 'Complete the DNA pair', 'Target: C T G T G. A pairs with T; C pairs with G.', [
    ['gacac', 'GACAC', 'Option A'], ['ctgtg', 'CTGTG', 'Option B'], ['gtgtg', 'GTGTG', 'Option C'], ['random', 'AACCT', 'Option D']
  ], 'two');
  if (scene === 7) return metricScreen('1.07 BILLION', 'ideal target copies after 30 PCR cycles', 'PCR found the selected DNA paragraph. It did not prove the entire circuit still works.');
  if (scene === 8) return renderNanoQuiz();
  if (scene === 9) return renderPhotonControl();
  if (scene === 10) return infoCard('YOU ARE PART OF THE CHIP', 'Photon → switch → number', 'The nanochip converts reporter light into electrical values. Those values become inputs for the AI.');
  if (scene === 11) {
    if (!submittedSample) return renderSampleCard();
    return renderVote('architecture', 'Choose the AI brain', 'More neurons can learn more flexible boundaries—but can also learn noise.', [
      ['two', '2', 'simple'], ['four', '4', 'balanced'], ['eight', '8', 'flexible']
    ], 'three');
  }
  if (scene === 12) return renderTrainingMonitor();
  if (scene === 13) return renderChallenge();
  if (scene === 14) return renderVote('trust', 'The model says “intact.” Act now?', 'A strong model score is still not independent proof.', [
    ['deploy', 'AUTHORISE', 'recover now'], ['verify', 'VERIFY', 'test again']
  ]);
  if (scene === 15) return renderGravityQuiz();
  if (scene === 16) return renderBurnControl();
  if (scene === 17) return renderVote('return', 'Where should HELIX–7 go?', 'Choose the trade-off you would defend.', [
    ['earth', 'EARTH', 'full lab'], ['orbit', 'ORBIT', 'quarantine'], ['remote', 'REMOTE', 'leave sealed']
  ], 'three');
  return renderFinale();
}

function renderSampleCard() {
  currentMode = 'sample';
  root.innerHTML = `
    <div class="phone-kicker">YOUR SYNTHETIC CONTROL / ${callsign}</div>
    <h2>Teach the<br><mark>machine.</mark></h2>
    <p class="subhead">Inspect this simulated known-control measurement, then label the circuit.</p>
    <div class="phone-card">
      <div class="sample-mini-plot"><i style="--x:${assignedSample.water}%;--y:${assignedSample.carbon}%"></i></div>
      <div class="phone-slider"><label>PCR TARGET MATCH <b>${assignedSample.water}/100</b></label><div class="phone-progress"><i style="--progress:${assignedSample.water}%"></i></div></div>
      <div class="phone-slider"><label>REPORTER LIGHT <b>${assignedSample.carbon}/100</b></label><div class="phone-progress"><i style="--progress:${assignedSample.carbon}%"></i></div></div>
      <div class="phone-choice two"><button data-sample="geology">ALTERED / NOISE</button><button data-sample="life">CIRCUIT INTACT</button></div>
      <button class="phone-action" id="submit-sample" disabled>Send labelled control</button>
    </div>`;
  root.querySelectorAll('[data-sample]').forEach(button => button.addEventListener('click', () => {
    sampleChoice = button.dataset.sample;
    root.querySelectorAll('[data-sample]').forEach(item => item.classList.toggle('selected', item === button));
    document.querySelector('#submit-sample').disabled = false;
  }));
  document.querySelector('#submit-sample').addEventListener('click', () => {
    if (!sampleChoice) return;
    socket.emit('sample', { water: assignedSample.water, carbon: assignedSample.carbon, label: sampleChoice });
    submittedSample = true;
    vibrate([20, 30, 20]);
    waiting('Control accepted', 'Your dot is now part of the live training dataset. Human labels become machine-learning targets.');
  });
}

function renderVote(poll, title, copy, options, columns = 'two') {
  currentMode = `vote-${poll}`;
  if (votes.has(poll)) return waiting('Answer locked', 'Your decision is on the main screen. Look up to see how the room voted.');
  root.innerHTML = `
    <div class="phone-kicker">LIVE COMMITMENT</div><h2>${title}</h2><p class="subhead">${copy}</p>
    <div class="phone-card"><div class="phone-choice ${columns}">${options.map(([value, label, detail]) => `<button data-vote="${value}"><b>${label}</b><small>${detail}</small></button>`).join('')}</div></div>`;
  root.querySelectorAll('[data-vote]').forEach(button => button.addEventListener('click', () => {
    votes.add(poll);
    socket.emit('vote', { poll, choice: button.dataset.vote });
    vibrate(18);
    waiting('Answer locked', 'Your decision is now changing the live result on the main screen.');
  }));
}

function renderPCRControl() {
  currentMode = 'pcr';
  root.innerHTML = `
    <div class="phone-kicker">CROWD THERMOCYCLER</div><h2>Power the<br><mark>amplification.</mark></h2>
    <p class="subhead">Each complete lab cycle uses heat, cooling and heat-stable polymerase. Your pulses accelerate the shared machine.</p>
    <button class="tap-orb" id="pcr-tap">TAP / PCR</button>
    <div class="phone-metric"><strong id="my-pcr-taps">${pcrTaps}</strong><span>YOUR ENERGY PULSES · MAX 24</span></div>
    <p class="subhead" style="text-align:center;margin-top:18px" id="crowd-pcr">${state.pcrTaps} crowd pulses received</p>`;
  document.querySelector('#pcr-tap').addEventListener('pointerdown', () => {
    if (pcrTaps >= 24) return;
    pcrTaps += 1;
    socket.emit('pcr-tap');
    document.querySelector('#my-pcr-taps').textContent = pcrTaps;
    vibrate(8);
  });
}

function renderNanoQuiz() {
  currentMode = 'nano-quiz';
  root.innerHTML = `
    <div class="phone-kicker">SCALE CHECK</div><h2>How small is<br><mark>one nanometre?</mark></h2>
    <p class="subhead">A fingernail grows approximately…</p>
    <div class="phone-card"><div class="phone-choice"><button data-nano="wrong">1 metre each year</button><button data-nano="right">1 nanometre each second</button><button data-nano="wrong">1 atom each minute</button></div><div id="nano-answer"></div></div>`;
  root.querySelectorAll('[data-nano]').forEach(button => button.addEventListener('click', () => {
    root.querySelectorAll('[data-nano]').forEach(item => item.classList.toggle('selected', item === button));
    document.querySelector('#nano-answer').innerHTML = button.dataset.nano === 'right'
      ? '<p class="subhead" style="color:var(--accent);margin:14px 0 0">Exactly. That is roughly one nanometre per second.</p>'
      : '<p class="subhead" style="color:#ff7868;margin:14px 0 0">Try again—think one billionth of a metre.</p>';
  }));
}

function renderPhotonControl() {
  currentMode = 'photons';
  root.innerHTML = `
    <div class="phone-kicker">PHOTOLITHOGRAPHY ARRAY</div><h2>Expose the<br><mark>wafer.</mark></h2>
    <p class="subhead">Each tap emits one symbolic ultraviolet photon toward the shared photomask.</p>
    <button class="tap-orb" id="photon-tap">EMIT PHOTON</button>
    <div class="phone-metric"><strong id="my-photons">${photons}</strong><span>YOUR PHOTONS · MAX 24</span></div>
    <div class="phone-progress"><i id="crowd-exposure" style="--progress:${exposurePercent()}%"></i></div>`;
  document.querySelector('#photon-tap').addEventListener('pointerdown', event => {
    if (photons >= 24) return;
    photons += 1;
    socket.emit('photon', { x: event.clientX / window.innerWidth * 100 });
    document.querySelector('#my-photons').textContent = photons;
    vibrate(7);
  });
}

function exposurePercent() {
  return Math.min(100, state.photonCount / Math.max(24, state.participants * 6) * 100);
}

function renderTrainingMonitor() {
  currentMode = 'training';
  const training = state.training;
  const epoch = training.epoch || 0;
  root.innerHTML = `
    <div class="phone-kicker">LIVE NEURAL NETWORK</div><h2>${training.active ? 'The model is learning.' : state.model ? 'Training complete.' : 'Ready to train.'}</h2>
    <div class="waiting-orb"></div>
    <div class="phone-card"><div class="phone-metric"><strong id="phone-epoch">${String(epoch).padStart(3,'0')}</strong><span>EPOCH / 500</span></div><div class="phone-progress"><i id="phone-train-progress" style="--progress:${epoch/5}%"></i></div><div class="phone-choice three"><button>LOSS<br><b id="phone-loss">${numberOrDash(training.loss,4)}</b></button><button>TRAIN<br><b id="phone-accuracy">${training.accuracy == null ? '—' : Math.round(training.accuracy*100)+'%'}</b></button><button>TEST<br><b id="phone-test-accuracy">${training.testAccuracy == null ? '—' : Math.round(training.testAccuracy*100)+'%'}</b></button></div></div>
    <p class="subhead" style="margin-top:18px">Look up: the decision heatmap is the model’s actual output changing as its weights update.</p>`;
}

function renderChallenge() {
  currentMode = 'challenge';
  if (!state.model) return waiting('Model unavailable', 'The presenter is training or retraining it now. This control will unlock when weights arrive.');
  root.innerHTML = `
    <div class="phone-kicker">MODEL CHALLENGE / UNSEEN POINT</div><h2>Try to<br><mark>fool it.</mark></h2>
    <div class="phone-card">
      ${sliderMarkup('challenge-water','PCR target match',challenge.water)}
      ${sliderMarkup('challenge-carbon','Reporter light',challenge.carbon)}
      <div class="sample-mini-plot"><i id="challenge-dot" style="--x:${challenge.water}%;--y:${challenge.carbon}%"></i></div>
      <button class="phone-action" id="predict-button">Ask the neural network</button>
      <div id="phone-prediction"></div>
    </div>`;
  ['water','carbon'].forEach(key => {
    document.querySelector(`#challenge-${key}`).addEventListener('input', event => {
      challenge[key] = Number(event.target.value);
      event.target.previousElementSibling.querySelector('b').textContent = challenge[key];
      const dot = document.querySelector('#challenge-dot');
      dot.style.setProperty('--x', `${challenge.water}%`);
      dot.style.setProperty('--y', `${challenge.carbon}%`);
    });
  });
  document.querySelector('#predict-button').addEventListener('click', () => {
    const output = forwardModel(state.model, [challenge.water / 100, challenge.carbon / 100]);
    socket.emit('challenge', { ...challenge, prediction: output });
    document.querySelector('#phone-prediction').innerHTML = `<div class="prediction-phone"><strong>${output >= .5 ? 'INTACT–LIKE' : 'ALTERED / NOISE'}</strong><span>${Math.round(output * 100)}</span><p class="subhead">model score / 100 — not proof</p></div>`;
    vibrate([20,25,20]);
  });
}

function renderGravityQuiz() {
  currentMode = 'gravity';
  root.innerHTML = `
    <div class="phone-kicker">PREDICT BEFORE THE DEMO</div><h2>At 400 km altitude, gravity is…</h2>
    <div class="phone-card"><div class="phone-choice"><button data-gravity="wrong">Almost zero</button><button data-gravity="right">About 90% of surface gravity</button></div><div id="gravity-answer"></div></div>`;
  root.querySelectorAll('[data-gravity]').forEach(button => button.addEventListener('click', () => {
    root.querySelectorAll('[data-gravity]').forEach(item => item.classList.toggle('selected', item === button));
    document.querySelector('#gravity-answer').innerHTML = button.dataset.gravity === 'right'
      ? '<p class="subhead" style="color:var(--accent);margin:14px 0 0">Correct. Astronauts float because everything is falling together.</p>'
      : '<p class="subhead" style="color:#ff7868;margin:14px 0 0">Gravity is still strong. Weightlessness comes from shared freefall.</p>';
  }));
}

function renderBurnControl() {
  currentMode = 'burn';
  const saved = Number(localStorage.getItem(`signal2045-burn-${localRunId}`)) || 100;
  root.innerHTML = `
    <div class="phone-kicker">FLIGHT DYNAMICS / SET SIDEWAYS SPEED</div><h2>Choose the<br><mark>trajectory.</mark></h2>
    <p class="subhead">Your command joins the room. The median—not the average—will become the spacecraft’s real initial velocity.</p>
    <div class="phone-card">
      <div class="phone-metric"><strong id="burn-value">${(saved/100).toFixed(2)}×</strong><span>CIRCULAR ORBIT SPEED</span></div>
      <div class="phone-slider"><label>CRASH <b>ORBIT</b> ESCAPE</label><input id="burn-slider" type="range" min="50" max="150" value="${saved}"></div>
      <div id="burn-prediction" class="prediction-phone"><strong>${burnLabel(saved)}</strong></div>
      <button class="phone-action" id="lock-burn">Lock / update command</button>
    </div>`;
  document.querySelector('#burn-slider').addEventListener('input', event => {
    const value = Number(event.target.value);
    document.querySelector('#burn-value').textContent = `${(value/100).toFixed(2)}×`;
    document.querySelector('#burn-prediction strong').textContent = burnLabel(value);
  });
  document.querySelector('#lock-burn').addEventListener('click', () => {
    const value = Number(document.querySelector('#burn-slider').value);
    localStorage.setItem(`signal2045-burn-${localRunId}`, value);
    socket.emit('burn', { value });
    document.querySelector('#lock-burn').textContent = 'Command received — update anytime';
    vibrate([25,35,25]);
  });
}

function renderFinale() {
  currentMode = 'finale';
  const primer = votes.has('primer') ? 'submitted' : 'not submitted';
  const flight = localStorage.getItem(`signal2045-burn-${localRunId}`) ? 'locked' : 'observed';
  root.innerHTML = `
    <div class="phone-kicker">MISSION COMPLETE / ${callsign}</div><h1>Your station<br><mark>made the chain.</mark></h1>
    <div class="phone-card"><div class="phone-choice"><button>CONTROL LABEL<br><b>${submittedSample ? 'ACCEPTED' : 'OBSERVED'}</b></button><button>PRIMER<br><b>${primer.toUpperCase()}</b></button><button>PHOTONS<br><b>${photons}</b></button><button>FLIGHT<br><b>${flight.toUpperCase()}</b></button></div></div>
    <p class="subhead" style="text-align:center;margin-top:24px">The future is not one science.<br>It is what happens between them.</p>`;
}

function waiting(title, copy) {
  currentMode = 'waiting';
  root.innerHTML = `<div class="phone-kicker">${callsign} / CONNECTED</div><h2>${title}</h2><div class="waiting-orb"></div><p class="subhead" style="text-align:center">${copy}</p>`;
}

function infoCard(kicker, title, copy) {
  currentMode = 'info';
  root.innerHTML = `<div class="phone-kicker">${kicker}</div><h2>${title}</h2><div class="phone-card"><p class="subhead" style="margin:0">${copy}</p></div><div class="waiting-orb"></div><p class="subhead" style="text-align:center">Follow the main screen.</p>`;
}

function metricScreen(value, label, copy) {
  currentMode = 'metric';
  root.innerHTML = `<div class="phone-kicker">AMPLIFICATION COMPLETE</div><div class="phone-metric" style="margin-top:14vh"><strong>${value}</strong><span>${label}</span></div><p class="subhead" style="text-align:center;margin-top:30px">${copy}</p>`;
}

function sliderMarkup(id, label, value) {
  return `<div class="phone-slider"><label>${label.toUpperCase()} <b>${value}</b></label><input id="${id}" type="range" min="0" max="100" value="${value}"></div>`;
}

function numberOrDash(value, places) { return Number.isFinite(value) ? value.toFixed(places) : '—'; }

function forwardModel(model, input) {
  let activation = input;
  for (const layer of model.layers) activation = layer.w.map((weights, index) => 1 / (1 + Math.exp(-weights.reduce((sum, weight, i) => sum + weight * activation[i], layer.b[index]))));
  return activation[0];
}

function burnLabel(value) {
  if (value < 78) return 'LIKELY CRASH';
  if (value >= 141) return 'LIKELY ESCAPE';
  if (value > 93 && value < 108) return 'NEAR-CIRCULAR ORBIT';
  return 'ELLIPTICAL ORBIT';
}

function updateLiveElements() {
  if (!state) return;
  if (state.scene === 5 && document.querySelector('#crowd-pcr')) document.querySelector('#crowd-pcr').textContent = `${state.pcrTaps} crowd pulses received`;
  if (state.scene === 9 && document.querySelector('#crowd-exposure')) document.querySelector('#crowd-exposure').style.setProperty('--progress', `${exposurePercent()}%`);
  if (state.scene === 12 && currentMode === 'training') {
    const training = state.training;
    if (document.querySelector('#phone-epoch')) document.querySelector('#phone-epoch').textContent = String(training.epoch || 0).padStart(3,'0');
    if (document.querySelector('#phone-train-progress')) document.querySelector('#phone-train-progress').style.setProperty('--progress', `${(training.epoch || 0)/5}%`);
    if (document.querySelector('#phone-loss')) document.querySelector('#phone-loss').textContent = numberOrDash(training.loss,4);
    if (document.querySelector('#phone-accuracy')) document.querySelector('#phone-accuracy').textContent = training.accuracy == null ? '—' : `${Math.round(training.accuracy*100)}%`;
    if (document.querySelector('#phone-test-accuracy')) document.querySelector('#phone-test-accuracy').textContent = training.testAccuracy == null ? '—' : `${Math.round(training.testAccuracy*100)}%`;
  }
}

function vibrate(pattern) { if (navigator.vibrate) navigator.vibrate(pattern); }

waiting('Connecting to mission control', 'Keep this tab open. Your station is joining the live network.');
