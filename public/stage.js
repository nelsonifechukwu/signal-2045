const hostTokenFromUrl = new URLSearchParams(window.location.search).get('host');
if (hostTokenFromUrl) {
  window.sessionStorage.setItem('signal2045-host-token', hostTokenFromUrl);
  window.history.replaceState({}, '', `${window.location.pathname}${window.location.hash}`);
}
const socket = io({
  auth: {
    role: 'host',
    token: hostTokenFromUrl || window.sessionStorage.getItem('signal2045-host-token') || ''
  }
});

socket.on('connect_error', error => {
  if (error?.data?.code !== 'HOST_AUTH_REQUIRED') return;
  showHostAccessPanel();
});

function showHostAccessPanel() {
  if (document.querySelector('#host-access-panel')) return;
  const panel = document.createElement('div');
  panel.id = 'host-access-panel';
  panel.className = 'host-access-overlay';
  panel.innerHTML = `
    <form class="host-access-card glass">
      <div class="kicker"><span>PRESENTER ACCESS</span><em>SECURE CONTROL</em></div>
      <h2>Enter the presenter code</h2>
      <p>This is the private <code>HOST_TOKEN</code> you chose in Render. Audience members do not need it.</p>
      <input name="host-token" type="password" autocomplete="current-password" placeholder="Presenter access code" required>
      <p class="host-access-error" aria-live="polite"></p>
      <button class="action-button" type="submit">Unlock controls</button>
    </form>`;
  document.body.appendChild(panel);

  const form = panel.querySelector('form');
  const input = panel.querySelector('input');
  const errorLabel = panel.querySelector('.host-access-error');
  input.focus();
  form.addEventListener('submit', event => {
    event.preventDefault();
    const token = input.value.trim();
    if (!token) return;
    errorLabel.textContent = 'Checking code…';
    socket.auth.token = token;
    socket.connect();
    const handleConnect = () => {
      socket.off('connect_error', handleError);
      window.sessionStorage.setItem('signal2045-host-token', token);
      panel.remove();
    };
    const handleError = nextError => {
      socket.off('connect', handleConnect);
      if (nextError?.data?.code === 'HOST_AUTH_REQUIRED') {
        errorLabel.textContent = 'That code was not accepted. Check the HOST_TOKEN in Render.';
        input.select();
      }
    };
    socket.once('connect', handleConnect);
    socket.once('connect_error', handleError);
  });
}

const slides = [
  { act: 'PRE-SHOW', rail: 'sample', presenter: ['00', 'MISSION CONTROL'], time: 'Before start', title: 'Recruit the room', note: 'Leave this screen up as people arrive. Ask everyone to scan and label one synthetic control. If phones cannot connect, press D or use the fallback button.' },
  { act: 'ANOMALY', rail: 'sample', presenter: ['01', 'STUDENT ONE'], time: '0:00–0:30', title: 'Cold open', note: 'Pause for the alert. Say: “At 08:17, a laboratory the size of a shoebox gave two answers to one question. Its DNA test looked normal. Its light signal did not.”' },
  { act: 'MISSION MAP', rail: 'sample', presenter: ['ALL', 'THREE-STUDENT TEAM'], time: '0:30–1:05', title: 'Establish the three leads', note: 'Each student takes one step forward when their role appears. The promise: this is not four mini-talks; each system needs the result of the one before it.' },
  { act: 'GENETIC ENGINEERING', rail: 'sample', presenter: ['01', 'MOLECULAR SYSTEMS'], time: '1:05–1:50', title: 'What we engineered', note: 'Explain the gene circuit as an instruction plus a status light. This is a fictional, sealed yeast experiment producing a model protein—not a human medicine.' },
  { act: 'GENETICS', rail: 'amplify', presenter: ['01', 'MOLECULAR SYSTEMS'], time: '1:50–2:30', title: 'The visibility problem', note: 'Take the phone poll before revealing. Use the video’s hook: seeing stringy DNA is not reading its code—like seeing a whole library without reading one sentence.' },
  { act: 'GENETICS', rail: 'amplify', presenter: ['01', 'MOLECULAR SYSTEMS'], time: '2:30–3:30', title: 'PCR amplification', note: 'Demonstrate exactly one full cycle: 95°C denature, about 55–65°C anneal, 72°C extend. Then let the crowd power the remaining cycles. 2³⁰ is an ideal maximum; real PCR eventually plateaus.' },
  { act: 'GENETICS', rail: 'amplify', presenter: ['01', 'MOLECULAR SYSTEMS'], time: '3:30–4:20', title: 'Primer puzzle', note: 'A–T and C–G. The complement of CTGTG is GACAC. Primers define the paragraph that PCR copies; PCR does not verify the whole genome.' },
  { act: 'HANDOFF', rail: 'amplify', presenter: ['01→02', 'MOLECULAR → NANO'], time: '4:20–4:45', title: 'Evidence, not function', note: 'Handoff line: “The page is in the book. I still cannot tell whether the cell read it. Turn biology into a signal.”' },
  { act: 'NANOTECH', rail: 'sense', presenter: ['02', 'NANO + INTELLIGENCE'], time: '4:45–5:25', title: 'Dive to the nanoscale', note: 'Move the scale slider. A nanometre is one-billionth of a metre. A fingernail grows roughly a nanometre each second—a memorable scale anchor.' },
  { act: 'NANOTECH', rail: 'sense', presenter: ['02', 'NANO + INTELLIGENCE'], time: '5:25–6:20', title: 'Photolithography', note: 'Invite everyone to fire photons. Clarify: light changes photoresist; developing, etching and deposition turn that transferred pattern into structures. Shorter wavelength helps resolution, but optics and processing matter too.' },
  { act: 'NANO → AI', rail: 'sense', presenter: ['02', 'NANO + INTELLIGENCE'], time: '6:20–6:55', title: 'Photon to number', note: 'Trace the causal chain slowly: light pattern → transistor → matrix multiplication → prediction. The chip counts; it does not understand.' },
  { act: 'ARTIFICIAL INTELLIGENCE', rail: 'learn', presenter: ['02', 'NANO + INTELLIGENCE'], time: '6:55–7:40', title: 'Build the dataset', note: 'Every audience label becomes a dot. Say explicitly: supervised learning needs examples and labels. Human judgement enters before the machine learns anything.' },
  { act: 'ARTIFICIAL INTELLIGENCE', rail: 'learn', presenter: ['02', 'NANO + INTELLIGENCE'], time: '7:40–8:45', title: 'Train in public', note: 'Start training and narrate: random weights → prediction → error → weight adjustment. One pass over all points is an epoch. Loss should fall as the real heatmap changes.' },
  { act: 'AI AUDIT', rail: 'learn', presenter: ['02', 'NANO + INTELLIGENCE'], time: '8:45–9:35', title: 'Challenge and break the model', note: 'Let phones test the boundary. Then inject radiation-damaged controls and retrain. Memorable line: “The satellite did not change. The dataset did.” The output is a model score, not proof or a calibrated probability.' },
  { act: 'AI GOVERNANCE', rail: 'learn', presenter: ['02', 'NANO + INTELLIGENCE'], time: '9:35–10:20', title: 'Evidence has limits', note: 'Ask for the vote, then reveal protocol. Strong science tries to disprove itself: independent controls, contamination checks, sequencing and repetition.' },
  { act: 'ASTROPHYSICS', rail: 'fly', presenter: ['03', 'FLIGHT DYNAMICS'], time: '10:20–11:10', title: 'How orbit works', note: 'Do not say there is no gravity. At low orbit, gravity is still strong. Crew and spacecraft feel weightless because they fall together. Click slow, orbit and escape.' },
  { act: 'ASTROPHYSICS', rail: 'fly', presenter: ['03', 'FLIGHT DYNAMICS'], time: '11:10–12:30', title: 'Collective orbital burn', note: 'The room chooses sideways speed; the median drives a real two-body simulation. Let the first attempt fail if it fails, then invite one correction. There is no universal “burn is correct”—the outcome depends on speed and direction.' },
  { act: 'RESPONSIBLE SCIENCE', rail: 'decide', presenter: ['03', 'FLIGHT DYNAMICS'], time: '12:30–13:30', title: 'The human decision', note: 'No option is cost-free. Ask one person to defend the leading option and one to defend the runner-up. Science constrains choices; society still decides acceptable risk.' },
  { act: 'MISSION COMPLETE', rail: 'decide', presenter: ['ALL', 'THREE-STUDENT TEAM'], time: '13:30–15:00', title: 'The handoff is the future', note: 'Each student owns one closing line. Finish together: “The future is not one science. It is what happens between them.” Hold the final screen for applause.' }
];

const defaultState = {
  runId: 0, scene: 0, participants: 0, samples: [], challenges: [],
  polls: {
    microscope: { yes: 0, no: 0 }, primer: { gacac: 0, ctgtg: 0, gtgtg: 0, random: 0 },
    architecture: { two: 0, four: 0, eight: 0 }, trust: { deploy: 0, verify: 0 },
    return: { earth: 0, orbit: 0, remote: 0 }
  },
  pcrTaps: 0, photonCount: 0, burns: [], reveals: {},
  training: { epoch: 0, loss: null, accuracy: null, testAccuracy: null, active: false }, model: null
};

const withheldControls = [
  { water: 21, carbon: 25, label: 0 }, { water: 38, carbon: 27, label: 0 },
  { water: 29, carbon: 69, label: 0 }, { water: 49, carbon: 75, label: 0 },
  { water: 61, carbon: 56, label: 1 }, { water: 69, carbon: 63, label: 1 },
  { water: 77, carbon: 75, label: 1 }, { water: 86, carbon: 85, label: 1 },
  { water: 90, carbon: 36, label: 0 }
];

let state = structuredClone(defaultState);
let localRunId = 0;
let localPcrCycle = 0;
let forcedExposure = false;
let currentModel = null;
let trainingTimer = null;
let trainingActive = false;
let pendingTraining = false;
let missionStartedAt = null;
let orbitAnimating = false;
let notesVisible = false;

const scenes = [...document.querySelectorAll('.scene')];
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

setupProgress();
applyShowConfig();
setupInputs();
setupSignalAnimation();

fetch('/api/config')
  .then(response => response.json())
  .then(config => {
    $('#qr').src = config.qr;
    $('#join-url').textContent = config.audienceUrl.replace(/^https?:\/\//, '');
  })
  .catch(() => { $('#join-url').textContent = 'QR unavailable — use demo mode'; });

socket.on('state', next => {
  if (localRunId && next.runId !== localRunId) resetLocalState();
  localRunId = next.runId;
  state = next;
  if (next.model && !trainingActive) currentModel = next.model;
  if (!next.model && !trainingActive && !pendingTraining) currentModel = null;
  setScene(next.scene, false);
  renderAll();
  if (pendingTraining && state.samples.length >= 6) {
    pendingTraining = false;
    window.setTimeout(startTraining, 180);
  }
});

socket.on('photon', photon => {
  spawnPhoton(photon);
  if (navigator.vibrate) navigator.vibrate(8);
});

function setupProgress() {
  const rail = $('#slide-progress');
  const nodes = [
    ['sample', 'SAMPLE', 0, 3], ['amplify', 'AMPLIFY', 4, 7], ['sense', 'SENSE', 8, 10],
    ['learn', 'LEARN', 11, 14], ['fly', 'FLY', 15, 16], ['decide', 'DECIDE', 17, 18]
  ];
  nodes.forEach(([key, label, start, end]) => {
    const node = document.createElement('span');
    node.dataset.key = key;
    node.dataset.start = start;
    node.dataset.end = end;
    node.innerHTML = `<i></i><b>${label}</b>`;
    rail.appendChild(node);
  });
}

function applyShowConfig() {
  const presenters = window.SHOW_CONFIG?.presenters || [];
  presenters.forEach((presenter, index) => {
    const name = document.querySelector(`[data-presenter-name="${index}"]`);
    const role = document.querySelector(`[data-presenter-role="${index}"]`);
    if (name && presenter.name) name.textContent = presenter.name;
    if (role && presenter.role) role.textContent = presenter.role;
  });
}

function setupInputs() {
  document.addEventListener('keydown', event => {
    if (['ArrowRight', 'PageDown'].includes(event.key)) setScene(state.scene + 1);
    if (['ArrowLeft', 'PageUp'].includes(event.key)) setScene(state.scene - 1);
    if (event.key === 'Enter') runPrimaryAction();
    if (event.key.toLowerCase() === 'n') toggleNotes();
    if (event.key.toLowerCase() === 'f') document.documentElement.requestFullscreen?.();
    if (event.key.toLowerCase() === 'd') socket.emit('host', { type: 'demo' });
    if (event.key.toLowerCase() === 'r' && event.shiftKey && confirm('Reset the complete mission and all audience responses?')) {
      socket.emit('host', { type: 'reset' });
    }
  });

  $$('[data-action]').forEach(button => button.addEventListener('click', () => runAction(button.dataset.action)));
  $('#seed-demo').addEventListener('click', () => socket.emit('host', { type: 'demo' }));

  $$('.phase-row button').forEach(button => button.addEventListener('click', () => selectPcrPhase(Number(button.dataset.phase))));

  const scaleObjects = [
    ['10⁰ m', 'HUMAN SCALE', '1 metre'], ['10⁻¹ m', 'A HAND', '10 centimetres'],
    ['10⁻² m', 'A FINGERNAIL', '1 centimetre'], ['10⁻³ m', 'A GRAIN OF SAND', '1 millimetre'],
    ['10⁻⁴ m', 'HUMAN HAIR WIDTH', '100 micrometres'], ['10⁻⁵ m', 'A HUMAN CELL', '10 micrometres'],
    ['10⁻⁶ m', 'A BACTERIUM', '1 micrometre'], ['10⁻⁷ m', 'A VIRUS', '100 nanometres'],
    ['10⁻⁸ m', 'DNA HELIX WIDTH IS SMALLER', '10 nanometres'], ['10⁻⁹ m', 'THE NANOSCALE', '1 nanometre']
  ];
  $('#scale-slider').addEventListener('input', event => {
    const index = Number(event.target.value);
    $('#scale-power').textContent = scaleObjects[index][0];
    $('#scale-object').textContent = scaleObjects[index][1];
    $('#scale-label').textContent = scaleObjects[index][2];
    $('#scale-tunnel').classList.toggle('zoomed', index > 5);
    $('#scale-tunnel').style.transform = `scale(${1 + index * .018}) rotate(${index * .6}deg)`;
  });

  $$('.speed-presets button').forEach(button => button.addEventListener('click', () => {
    $$('.speed-presets button').forEach(item => item.classList.toggle('selected', item === button));
    drawOrbit($('#orbit-demo-canvas'), Number(button.dataset.orbitSpeed) / 100, 1);
  }));
}

function setScene(index, broadcast = true) {
  const next = Math.max(0, Math.min(scenes.length - 1, Number(index) || 0));
  if (next >= 1 && !missionStartedAt) missionStartedAt = Date.now();
  state.scene = next;
  scenes.forEach((scene, i) => scene.classList.toggle('active', i === next));
  updateChrome();
  if (next === 11) drawAI($('#dataset-canvas'), { model: null });
  if (next === 12) drawAI($('#training-canvas'), { model: currentModel, heatmap: true });
  if (next === 13) drawAI($('#challenge-canvas'), { model: currentModel, heatmap: true, challenges: true, mystery: true });
  if (next === 15) drawOrbit($('#orbit-demo-canvas'), 1, 1);
  if (next === 16 && !orbitAnimating) drawOrbit($('#mission-orbit-canvas'), medianBurn(), 1);
  if (broadcast) socket.emit('host', { type: 'scene', value: next });
  flashScene();
}

function updateChrome() {
  const slide = slides[state.scene] || slides[0];
  $('#act-label').textContent = slide.act;
  $('#presenter-number').textContent = slide.presenter[0];
  const configured = window.SHOW_CONFIG?.presenters || [];
  const personIndex = { '01': 0, '02': 1, '03': 2 }[slide.presenter[0]];
  $('#presenter-name').textContent = personIndex !== undefined && configured[personIndex]?.name
    ? configured[personIndex].name.toUpperCase()
    : slide.presenter[1];
  $('#scene-count').textContent = `${String(state.scene).padStart(2, '0')} / 18`;
  $('#note-title').textContent = slide.title;
  $('#note-body').textContent = slide.note;
  $('#note-time').textContent = slide.time;
  $('#note-next').textContent = state.scene < 18 ? `NEXT: ${slides[state.scene + 1].title.toUpperCase()}` : 'FINAL SLIDE';
  $$('#slide-progress span').forEach(node => {
    const start = Number(node.dataset.start);
    const end = Number(node.dataset.end);
    node.classList.toggle('done', state.scene > end);
    node.classList.toggle('active', state.scene >= start && state.scene <= end);
  });
}

function renderAll() {
  $('#online-count').textContent = `${state.participants} LINKED`;
  $('#lobby-people').textContent = state.participants;
  $('#lobby-samples').textContent = state.samples.filter(sample => sample.source === 'audience').length;
  $('#final-participants').textContent = `${state.participants} SCIENTISTS`;
  renderPolls();
  renderPCR();
  renderPhotolithography();
  renderAIState();
  renderOrbitState();
  renderReveals();
}

function renderPolls() {
  setPairBars('micro', state.polls.microscope.yes, state.polls.microscope.no, 'yes', 'no');
  const primer = state.polls.primer;
  const primerTotal = Object.values(primer).reduce((sum, value) => sum + value, 0) || 1;
  Object.entries(primer).forEach(([key, value]) => {
    $(`#primer-${key}`).textContent = `${Math.round(value / primerTotal * 100)}%`;
  });
  const arch = state.polls.architecture;
  $('#arch-two').textContent = arch.two;
  $('#arch-four').textContent = arch.four;
  $('#arch-eight').textContent = arch.eight;
  const hidden = chosenArchitecture();
  $('#architecture-choice').textContent = `${hidden}-NEURON HIDDEN LAYER SELECTED`;
  $$('.architecture-vote span').forEach((node, index) => node.classList.toggle('winner', [2, 4, 8][index] === hidden));
  drawNetwork(hidden);
  setPairBars('trust', state.polls.trust.deploy, state.polls.trust.verify, 'deploy', 'verify');

  const returns = state.polls.return;
  const total = Object.values(returns).reduce((sum, value) => sum + value, 0) || 1;
  Object.entries(returns).forEach(([key, value]) => {
    const percent = Math.round(value / total * 100);
    $(`#return-${key}`).style.width = `${percent}%`;
    $(`#return-${key}-n`).textContent = `${percent}%`;
  });
}

function setPairBars(prefix, a, b, aKey, bKey) {
  const total = a + b || 1;
  $(`#${prefix}-${aKey}`).style.width = `${a / total * 100}%`;
  $(`#${prefix}-${bKey}`).style.width = `${b / total * 100}%`;
  $(`#${prefix}-${aKey}-n`).textContent = a;
  $(`#${prefix}-${bKey}-n`).textContent = b;
}

function renderReveals() {
  $('#microscope-reveal').classList.toggle('shown', Boolean(state.reveals.microscope));
  $('#primer-reveal').classList.toggle('shown', Boolean(state.reveals.primer));
  $('#primer-answer').innerHTML = state.reveals.primer ? '<b>3′</b> — G A C A C — <b>5′</b>' : '<b>3′</b> — ? ? ? ? ? — <b>5′</b>';
  $('#primer-options [data-choice="gacac"]').classList.toggle('correct', Boolean(state.reveals.primer));
  $('#trust-reveal').classList.toggle('shown', Boolean(state.reveals.trust));
  if (state.reveals.chip) forcedExposure = true;
}

function crowdPcrCycle() {
  const tapsPerCycle = Math.max(3, Math.ceil(Math.max(1, state.participants) * .45));
  return Math.min(30, Math.floor(state.pcrTaps / tapsPerCycle));
}

function renderPCR() {
  const cycle = Math.max(localPcrCycle, crowdPcrCycle());
  const copies = 2 ** cycle;
  $('#pcr-cycle').textContent = String(cycle).padStart(2, '0');
  $('#pcr-copies').textContent = formatCopies(copies);
  $('#pcr-tap-label').textContent = `${state.pcrTaps} crowd pulses received`;
  $('#pcr-power').style.width = `${Math.min(100, cycle / 30 * 100)}%`;
  const lanes = $('#dna-lanes');
  lanes.innerHTML = '';
  for (let index = 0; index < 30; index += 1) {
    const bar = document.createElement('i');
    const completed = index < cycle;
    bar.style.setProperty('--height', completed ? `${18 + (index / 29) * 82}%` : '3%');
    bar.style.opacity = completed ? String(.3 + index / 43) : '.12';
    lanes.appendChild(bar);
  }
}

function formatCopies(value) {
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(value >= 1e4 ? 0 : 2)}K`;
  return value.toLocaleString();
}

function selectPcrPhase(index) {
  $$('.phase-row button').forEach((button, i) => button.classList.toggle('active', i === index));
}

function demonstratePcrCycle() {
  let phase = 0;
  selectPcrPhase(phase);
  const timer = window.setInterval(() => {
    phase += 1;
    if (phase < 3) selectPcrPhase(phase);
    else {
      window.clearInterval(timer);
      localPcrCycle = Math.min(30, Math.max(localPcrCycle, crowdPcrCycle()) + 1);
      selectPcrPhase(-1);
      renderPCR();
    }
  }, 650);
}

function renderPhotolithography() {
  const target = Math.max(24, state.participants * 6);
  const percent = forcedExposure ? 100 : Math.min(100, state.photonCount / target * 100);
  $('#photon-count').textContent = `${state.photonCount} PHOTONS`;
  $('#exposure-bar').style.width = `${percent}%`;
  $('#wafer').style.setProperty('--exposure', String(percent / 100));
  $$('.litho-steps span').forEach((step, index) => step.classList.toggle('on', percent >= [0, 25, 70, 96][index]));
}

function spawnPhoton(payload = {}) {
  const photon = document.createElement('i');
  photon.className = 'fired-photon';
  photon.style.left = `${8 + (Number(payload.x) || Math.random() * 84)}%`;
  photon.style.setProperty('--drift', `${(Math.random() - .5) * 80}px`);
  if (payload.color === 'violet') photon.style.background = 'var(--violet)';
  if (payload.color === 'gold') photon.style.background = 'var(--gold)';
  $('#photon-field').appendChild(photon);
  window.setTimeout(() => photon.remove(), 1300);
}

/* Tiny neural network adapted from the classifier-lab interaction pattern. */
function sigmoid(value) { return 1 / (1 + Math.exp(-Math.max(-12, Math.min(12, value)))); }

function seededRandom(seed = 2045) {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let result = value;
    result = Math.imul(result ^ result >>> 15, result | 1);
    result ^= result + Math.imul(result ^ result >>> 7, result | 61);
    return ((result ^ result >>> 14) >>> 0) / 4294967296;
  };
}

function createNetwork(hidden) {
  const random = seededRandom(2045 + hidden + state.runId);
  const layer = (inputs, outputs) => ({
    w: Array.from({ length: outputs }, () => Array.from({ length: inputs }, () => (random() * 2 - 1) * Math.sqrt(2 / inputs))),
    b: Array.from({ length: outputs }, () => (random() - .5) * .2)
  });
  return { hidden, layers: [layer(2, hidden), layer(hidden, 1)] };
}

function forwardNetwork(model, input) {
  let activation = input;
  const activations = [activation];
  for (const layer of model.layers) {
    activation = layer.w.map((weights, index) => sigmoid(weights.reduce((sum, weight, i) => sum + weight * activation[i], layer.b[index])));
    activations.push(activation);
  }
  return { out: activation[0], activations };
}

function trainBatch(model, data, learningRate = 1.8) {
  let loss = 0;
  for (const point of data) {
    const input = [point.water / 100, point.carbon / 100];
    const { out, activations } = forwardNetwork(model, input);
    const error = point.label - out;
    loss += error * error;
    const deltas = [];
    deltas[1] = [error * out * (1 - out)];
    deltas[0] = activations[1].map((activation, node) => deltas[1][0] * model.layers[1].w[0][node] * activation * (1 - activation));
    for (let layerIndex = 0; layerIndex < model.layers.length; layerIndex += 1) {
      const layer = model.layers[layerIndex];
      for (let node = 0; node < layer.w.length; node += 1) {
        for (let inputIndex = 0; inputIndex < layer.w[node].length; inputIndex += 1) {
          layer.w[node][inputIndex] += learningRate * deltas[layerIndex][node] * activations[layerIndex][inputIndex];
        }
        layer.b[node] += learningRate * deltas[layerIndex][node];
      }
    }
  }
  return loss / Math.max(1, data.length);
}

function modelAccuracy(model, data) {
  if (!data.length) return 0;
  const correct = data.filter(point => (forwardNetwork(model, [point.water / 100, point.carbon / 100]).out >= .5) === Boolean(point.label)).length;
  return correct / data.length;
}

function chosenArchitecture() {
  const values = [[2, state.polls.architecture.two], [4, state.polls.architecture.four], [8, state.polls.architecture.eight]];
  values.sort((a, b) => b[1] - a[1] || (a[0] === 4 ? -1 : 1));
  return values[0][1] === 0 ? 4 : values[0][0];
}

function startTraining() {
  if (trainingActive) return;
  if (state.samples.length < 6) {
    pendingTraining = true;
    socket.emit('host', { type: 'demo' });
    return;
  }
  if (trainingTimer) window.clearInterval(trainingTimer);
  currentModel = createNetwork(chosenArchitecture());
  trainingActive = true;
  let epoch = 0;
  let loss = null;
  renderTrainingMetrics(epoch, loss, 0, 0, true);
  trainingTimer = window.setInterval(() => {
    for (let step = 0; step < 5; step += 1) loss = trainBatch(currentModel, state.samples);
    epoch += 5;
    const accuracy = modelAccuracy(currentModel, state.samples);
    const testAccuracy = modelAccuracy(currentModel, withheldControls);
    renderTrainingMetrics(epoch, loss, accuracy, testAccuracy, epoch < 500);
    drawAI($('#training-canvas'), { model: currentModel, heatmap: true });
    drawAI($('#challenge-canvas'), { model: currentModel, heatmap: true, challenges: true, mystery: true });
    if (epoch % 25 === 0) socket.emit('host', { type: 'training', epoch, loss, accuracy, testAccuracy, active: epoch < 500 });
    if (epoch >= 500) {
      window.clearInterval(trainingTimer);
      trainingTimer = null;
      trainingActive = false;
      currentModel.trainedAt = Date.now();
      socket.emit('host', { type: 'model', model: currentModel });
      renderAIState();
    }
  }, 34);
}

function resetModel() {
  if (trainingTimer) window.clearInterval(trainingTimer);
  trainingTimer = null;
  trainingActive = false;
  currentModel = null;
  socket.emit('host', { type: 'clear-model' });
  renderTrainingMetrics(0, null, null, null, false);
  drawAI($('#training-canvas'), { model: null });
}

function renderTrainingMetrics(epoch, loss, accuracy, testAccuracy, active) {
  $('#epoch-value').textContent = String(epoch || 0).padStart(3, '0');
  $('#loss-value').textContent = Number.isFinite(loss) ? loss.toFixed(4) : '—';
  $('#accuracy-value').textContent = Number.isFinite(accuracy) ? `${Math.round(accuracy * 100)}%` : '—';
  $('#test-accuracy-value').textContent = Number.isFinite(testAccuracy) ? `${Math.round(testAccuracy * 100)}%` : '—';
  $('#training-progress').style.width = `${Math.min(100, (epoch || 0) / 5)}%`;
  $('#training-progress').style.filter = active ? 'brightness(1.2)' : 'none';
}

function renderAIState() {
  $('#dataset-count').textContent = `${state.samples.length} TRAINING POINTS`;
  $('#challenge-count').textContent = state.challenges.length;
  if (!trainingActive) {
    renderTrainingMetrics(state.training.epoch, state.training.loss, state.training.accuracy, state.training.testAccuracy, state.training.active);
    drawAI($('#training-canvas'), { model: currentModel, heatmap: Boolean(currentModel) });
  }
  drawAI($('#dataset-canvas'), { model: null });
  drawAI($('#challenge-canvas'), { model: currentModel, heatmap: Boolean(currentModel), challenges: true, mystery: true });
  const label = $('#europa-prediction');
  const scoreNode = $('#europa-probability');
  if (currentModel) {
    const score = forwardNetwork(currentModel, [.86, .78]).out;
    label.textContent = score >= .5 ? 'CIRCUIT INTACT–LIKE' : 'ALTERED / REVIEW';
    scoreNode.textContent = `${Math.round(score * 100)}`;
    $('#model-confidence').textContent = `${Math.round(score * 100)}/100`;
  } else {
    label.textContent = 'MODEL NOT TRAINED';
    scoreNode.textContent = '—';
    $('#model-confidence').textContent = '—';
  }
}

function drawAI(canvas, options = {}) {
  if (!canvas) return;
  const context = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  context.clearRect(0, 0, width, height);
  context.fillStyle = '#07110f';
  context.fillRect(0, 0, width, height);

  if (options.heatmap && options.model) {
    const columns = 42;
    const rows = 33;
    const cellWidth = width / columns;
    const cellHeight = height / rows;
    for (let column = 0; column < columns; column += 1) {
      for (let row = 0; row < rows; row += 1) {
        const output = forwardNetwork(options.model, [(column + .5) / columns, 1 - (row + .5) / rows]).out;
        const distance = Math.abs(output - .5) * 2;
        context.fillStyle = output >= .5
          ? `rgba(186,255,102,${.035 + distance * .22})`
          : `rgba(255,120,104,${.035 + distance * .20})`;
        context.fillRect(column * cellWidth, row * cellHeight, cellWidth + 1, cellHeight + 1);
      }
    }
  }

  context.strokeStyle = 'rgba(170,230,215,.08)';
  context.lineWidth = 1;
  for (let index = 0; index <= 10; index += 1) {
    const x = index / 10 * width;
    const y = index / 10 * height;
    context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke();
    context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke();
  }

  state.samples.forEach(point => {
    const x = point.water / 100 * width;
    const y = (1 - point.carbon / 100) * height;
    context.beginPath();
    if (point.label) context.arc(x, y, point.source === 'demo' ? 5 : 7, 0, Math.PI * 2);
    else context.rect(x - 5.5, y - 5.5, 11, 11);
    context.fillStyle = point.label ? '#baff66' : '#ff7868';
    context.fill();
    context.strokeStyle = point.source === 'radiation' ? '#ffe06b' : '#07110f';
    context.lineWidth = point.source === 'radiation' ? 3 : 2;
    context.stroke();
    if (point.source === 'radiation') {
      context.strokeStyle = 'rgba(255,224,107,.7)';
      context.beginPath(); context.arc(x, y, 11, 0, Math.PI * 2); context.stroke();
    }
  });

  if (options.challenges) {
    state.challenges.forEach(point => {
      const x = point.water / 100 * width;
      const y = (1 - point.carbon / 100) * height;
      context.strokeStyle = '#f1faf7'; context.lineWidth = 2;
      context.beginPath(); context.arc(x, y, 9, 0, Math.PI * 2); context.stroke();
      context.beginPath(); context.moveTo(x - 13, y); context.lineTo(x + 13, y); context.moveTo(x, y - 13); context.lineTo(x, y + 13); context.stroke();
    });
  }

  if (options.mystery) {
    const x = .86 * width;
    const y = (1 - .78) * height;
    context.fillStyle = '#ffe06b'; context.strokeStyle = '#07110f'; context.lineWidth = 2;
    drawStar(context, x, y, 5, 13, 6);
  }
}

function drawStar(context, x, y, points, outer, inner) {
  context.beginPath();
  for (let index = 0; index < points * 2; index += 1) {
    const radius = index % 2 ? inner : outer;
    const angle = -Math.PI / 2 + index * Math.PI / points;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (!index) context.moveTo(px, py); else context.lineTo(px, py);
  }
  context.closePath(); context.fill(); context.stroke();
}

function drawNetwork(hidden) {
  const svg = $('#network-svg');
  if (!svg) return;
  const input = [{ x: 45, y: 55 }, { x: 45, y: 110 }];
  const middle = Array.from({ length: hidden }, (_, index) => ({ x: 210, y: 20 + index * (120 / Math.max(1, hidden - 1)) }));
  const output = [{ x: 375, y: 82 }];
  let html = '';
  input.forEach(a => middle.forEach(b => { html += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" />`; }));
  middle.forEach(a => output.forEach(b => { html += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" />`; }));
  [...input, ...middle, ...output].forEach(node => { html += `<circle cx="${node.x}" cy="${node.y}" r="7" />`; });
  html += '<text x="45" y="150" text-anchor="middle">2 INPUTS</text><text x="210" y="150" text-anchor="middle">HIDDEN LAYER</text><text x="375" y="150" text-anchor="middle">1 SCORE</text>';
  svg.innerHTML = html;
}

/* Orbit simulation: dimensionless two-body dynamics, circular speed = 1. */
function makeTrajectory(speed) {
  let position = { x: 1, y: 0 };
  let velocity = { x: 0, y: speed };
  const points = [{ ...position }];
  const dt = .012;
  let outcome = 'ORBIT';
  for (let step = 0; step < 2400; step += 1) {
    const radius = Math.hypot(position.x, position.y);
    const factor = -1 / (radius ** 3);
    velocity.x += position.x * factor * dt;
    velocity.y += position.y * factor * dt;
    position = { x: position.x + velocity.x * dt, y: position.y + velocity.y * dt };
    if (step % 2 === 0) points.push({ ...position });
    const newRadius = Math.hypot(position.x, position.y);
    if (newRadius < .43) { outcome = 'CRASH'; break; }
    if (newRadius > 3.2) { outcome = speed >= Math.SQRT2 ? 'ESCAPE' : 'HIGH ORBIT'; break; }
  }
  if (speed > 1.405 && outcome !== 'CRASH') outcome = 'ESCAPE';
  return { points, outcome, speed };
}

function drawOrbit(canvas, speed = 1, progress = 1) {
  if (!canvas) return null;
  const trajectory = makeTrajectory(speed);
  const context = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const centre = { x: width * .5, y: height * .5 };
  const scale = Math.min(width, height) * .29;
  context.clearRect(0, 0, width, height);
  context.fillStyle = '#07100f'; context.fillRect(0, 0, width, height);
  for (let index = 0; index < 70; index += 1) {
    const x = (index * 97) % width;
    const y = (index * 53) % height;
    context.fillStyle = `rgba(220,235,255,${.1 + (index % 5) * .04})`;
    context.fillRect(x, y, 1, 1);
  }
  const gradient = context.createRadialGradient(centre.x - scale * .13, centre.y - scale * .13, 3, centre.x, centre.y, scale * .43);
  gradient.addColorStop(0, '#d0f6ef'); gradient.addColorStop(.15, '#7aa9b5'); gradient.addColorStop(.48, '#294a68'); gradient.addColorStop(1, '#07100f');
  context.beginPath(); context.arc(centre.x, centre.y, scale * .43, 0, Math.PI * 2); context.fillStyle = gradient; context.fill();
  context.strokeStyle = 'rgba(159,168,255,.12)'; context.lineWidth = 1;
  context.beginPath(); context.arc(centre.x, centre.y, scale, 0, Math.PI * 2); context.stroke();
  const count = Math.max(2, Math.floor(trajectory.points.length * progress));
  context.beginPath();
  trajectory.points.slice(0, count).forEach((point, index) => {
    const x = centre.x + point.x * scale;
    const y = centre.y - point.y * scale;
    if (!index) context.moveTo(x, y); else context.lineTo(x, y);
  });
  context.strokeStyle = trajectory.outcome === 'CRASH' ? '#ff7868' : ['ESCAPE', 'HIGH ORBIT'].includes(trajectory.outcome) ? '#9fa8ff' : '#baff66';
  context.lineWidth = 2.4; context.shadowColor = context.strokeStyle; context.shadowBlur = 12; context.stroke(); context.shadowBlur = 0;
  const point = trajectory.points[Math.min(count - 1, trajectory.points.length - 1)];
  context.beginPath(); context.arc(centre.x + point.x * scale, centre.y - point.y * scale, 5, 0, Math.PI * 2); context.fillStyle = '#ffe06b'; context.fill();
  return trajectory;
}

function medianBurn() {
  if (!state.burns.length) return 1;
  const values = state.burns.map(item => item.value).sort((a, b) => a - b);
  const middle = Math.floor(values.length / 2);
  const median = values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2;
  return median / 100;
}

function renderOrbitState() {
  const speed = medianBurn();
  $('#median-burn').textContent = `${speed.toFixed(2)}×`;
  $('#burn-count').textContent = state.burns.length;
  $('#telemetry-vel').textContent = `${(7.67 * speed).toFixed(2)} km/s`;
  if (!orbitAnimating) drawOrbit($('#mission-orbit-canvas'), speed, 1);
}

function simulateOrbit() {
  if (orbitAnimating) return;
  orbitAnimating = true;
  const speed = medianBurn();
  const trajectory = makeTrajectory(speed);
  const start = performance.now();
  const duration = 4200;
  $('#flight-result').textContent = 'EXECUTING CLASS TRAJECTORY…';
  $('#telemetry-status').textContent = 'BURN';
  function frame(now) {
    const progress = Math.min(1, (now - start) / duration);
    drawOrbit($('#mission-orbit-canvas'), speed, progress);
    $('#telemetry-status').textContent = progress < .15 ? 'BURN' : 'COAST';
    if (progress < 1) requestAnimationFrame(frame);
    else {
      orbitAnimating = false;
      const messages = {
        CRASH: 'TRAJECTORY INTERSECTS ATMOSPHERE — SPEED TOO LOW',
        ESCAPE: 'SPACECRAFT ESCAPES — SPEED EXCEEDS LOCAL ESCAPE WINDOW',
        'HIGH ORBIT': 'BOUND ELLIPTICAL ORBIT — SAFE, BUT FAR FROM THE TARGET PATH',
        ORBIT: 'STABLE ORBIT ACQUIRED — EVIDENCE LINK PRESERVED'
      };
      $('#flight-result').textContent = messages[trajectory.outcome];
      $('#telemetry-status').textContent = trajectory.outcome;
      $('#telemetry-alt').textContent = trajectory.outcome === 'ORBIT' ? '400 km' : trajectory.outcome === 'CRASH' ? '<80 km' : trajectory.outcome === 'HIGH ORBIT' ? '>2,000 km' : 'ESCAPE';
    }
  }
  requestAnimationFrame(frame);
}

function runPrimaryAction() {
  const primaryByScene = {
    4: 'reveal-microscope', 5: 'pcr-cycle', 6: 'reveal-primer', 9: 'expose-chip',
    12: 'train-model', 13: 'contaminate-model', 14: 'reveal-trust', 16: 'simulate-orbit'
  };
  if (primaryByScene[state.scene]) runAction(primaryByScene[state.scene]);
}

function runAction(action) {
  if (action === 'reveal-microscope') socket.emit('host', { type: 'reveal', key: 'microscope', value: true });
  if (action === 'pcr-cycle') demonstratePcrCycle();
  if (action === 'pcr-30') { localPcrCycle = 30; renderPCR(); }
  if (action === 'reveal-primer') socket.emit('host', { type: 'reveal', key: 'primer', value: true });
  if (action === 'expose-chip') { forcedExposure = true; socket.emit('host', { type: 'reveal', key: 'chip', value: true }); renderPhotolithography(); }
  if (action === 'train-model') startTraining();
  if (action === 'reset-model') resetModel();
  if (action === 'contaminate-model') { pendingTraining = true; socket.emit('host', { type: 'contaminate' }); }
  if (action === 'reveal-trust') socket.emit('host', { type: 'reveal', key: 'trust', value: true });
  if (action === 'simulate-orbit') simulateOrbit();
}

function toggleNotes() {
  notesVisible = !notesVisible;
  $('#presenter-notes').classList.toggle('shown', notesVisible);
}

function flashScene() {
  const flash = $('#scene-flash');
  flash.classList.remove('flash');
  void flash.offsetWidth;
  flash.classList.add('flash');
}

function resetLocalState() {
  localPcrCycle = 0;
  forcedExposure = false;
  currentModel = null;
  trainingActive = false;
  pendingTraining = false;
  missionStartedAt = null;
  orbitAnimating = false;
  if (trainingTimer) window.clearInterval(trainingTimer);
  trainingTimer = null;
}

function setupSignalAnimation() {
  const canvas = $('#signal-canvas');
  const context = canvas.getContext('2d');
  function draw(time) {
    const width = canvas.width;
    const height = canvas.height;
    context.clearRect(0, 0, width, height);
    context.strokeStyle = 'rgba(186,255,102,.12)'; context.lineWidth = 1;
    context.beginPath(); context.moveTo(0, height / 2); context.lineTo(width, height / 2); context.stroke();
    context.beginPath();
    for (let x = 0; x <= width; x += 2) {
      const burst = Math.exp(-((x - width * .63) ** 2) / 5500);
      const y = height / 2 + Math.sin(x * .074 + time * .004) * 7 + Math.sin(x * .31 - time * .007) * 22 * burst;
      if (!x) context.moveTo(x, y); else context.lineTo(x, y);
    }
    context.strokeStyle = '#baff66'; context.lineWidth = 1.5; context.shadowColor = '#baff66'; context.shadowBlur = 8; context.stroke(); context.shadowBlur = 0;
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}

window.setInterval(() => {
  if (!missionStartedAt) { $('#mission-clock').textContent = '15:00'; return; }
  const remaining = Math.max(0, 900 - Math.floor((Date.now() - missionStartedAt) / 1000));
  $('#mission-clock').textContent = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;
}, 250);

renderAll();
setScene(0, false);
