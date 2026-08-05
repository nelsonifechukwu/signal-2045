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
  const submitButton = panel.querySelector('button[type="submit"]');
  input.focus();
  form.addEventListener('submit', event => {
    event.preventDefault();
    const token = input.value.trim();
    if (!token) return;
    errorLabel.textContent = 'Checking code…';
    submitButton.disabled = true;
    submitButton.textContent = 'Checking…';
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
        submitButton.disabled = false;
        submitButton.textContent = 'Unlock controls';
        input.select();
      }
    };
    socket.once('connect', handleConnect);
    socket.once('connect_error', handleError);
  });
}

const slides = [
  { act: 'PRE-SHOW', rail: 'sample', presenter: ['00', 'MISSION CONTROL'], time: 'Before start', title: 'Get the room connected', note: 'Ask people to scan the code. The starter-batch answer key is on each phone. If the Wi-Fi fails, click “Load demo audience”.' },
  { act: 'ANOMALY', rail: 'sample', presenter: ['01', 'STUDENT ONE'], time: '0:00–0:30', title: 'Start with the mystery', note: 'Pause, then say: “The DNA we added is still there, but its green status light has gone dark. We have fifteen minutes to work out what that means.”' },
  { act: 'MISSION MAP', rail: 'sample', presenter: ['ALL', 'THREE-STUDENT TEAM'], time: '0:30–1:05', title: 'Introduce the three jobs', note: 'Point to each role. Say: “I check the DNA. Student Two measures the glow and trains the AI. Student Three corrects the orbit.”' },
  { act: 'GENETIC ENGINEERING', rail: 'sample', presenter: ['01', 'GENETICS LEAD'], time: '1:05–1:50', title: 'Explain the gene circuit', note: 'Say: “We gave sealed yeast two added instructions: make a test protein, and glow green when the circuit is working.” This is a made-up classroom experiment, not medicine.' },
  { act: 'GENETICS', rail: 'amplify', presenter: ['01', 'GENETICS LEAD'], time: '1:50–2:30', title: 'Ask before revealing', note: 'Wait for the phone vote. Then reveal: a classroom microscope can show DNA material, but reading A, T, C and G needs other tests.' },
  { act: 'GENETICS', rail: 'amplify', presenter: ['01', 'GENETICS LEAD'], time: '2:30–3:30', title: 'Show one PCR cycle', note: 'Click unzip, primers stick, copy. Say: “An ideal cycle can roughly double our chosen DNA section. The phone taps only control this animation.” Then jump to cycle 30.' },
  { act: 'GENETICS', rail: 'amplify', presenter: ['01', 'GENETICS LEAD'], time: '3:30–4:20', title: 'Match the DNA bases', note: 'Reveal GACAC after the vote. This is a short complementary-strand puzzle. Real PCR uses two much longer primers, one on each side of the target.' },
  { act: 'HANDOFF', rail: 'amplify', presenter: ['01→02', 'GENETICS → CHIP'], time: '4:20–4:45', title: 'Pass on the clue', note: 'Say: “PCR found the DNA section. That still does not tell us why the green light stopped. Now we need to measure the glow.”' },
  { act: 'NANOTECH', rail: 'sense', presenter: ['02', 'CHIP + AI LEAD'], time: '4:45–5:25', title: 'Make a nanometre feel real', note: 'Move the slider from metres to nanometres. Say: “A fingernail grows about one nanometre each second.”' },
  { act: 'NANOTECH', rail: 'sense', presenter: ['02', 'CHIP + AI LEAD'], time: '5:25–6:20', title: 'Print a chip pattern with light', note: 'Ask the room to tap. Explain that their taps are symbolic. Real UV changes a light-sensitive coating; later developing and etching turn the pattern into chip structures.' },
  { act: 'NANO → AI', rail: 'sense', presenter: ['02', 'CHIP + AI LEAD'], time: '6:20–6:55', title: 'Follow the measurement', note: 'Point across the row: “UV light helped build the chip. A different light—the yeast’s green glow—is measured by a sensor and turned into a number.”' },
  { act: 'ARTIFICIAL INTELLIGENCE', rail: 'learn', presenter: ['02', 'CHIP + AI LEAD'], time: '6:55–7:40', title: 'Show what the dots mean', note: 'Say: “Each dot has two readings and a known answer. That is what supervised learning needs: examples with answers.” Explain that more hidden units can make a bendier dividing line.' },
  { act: 'ARTIFICIAL INTELLIGENCE', rail: 'learn', presenter: ['02', 'CHIP + AI LEAD'], time: '7:40–8:45', title: 'Train the model', note: 'Click Start training. One epoch is one practice round through the examples. Loss means how wrong the guesses are. Seen dots are training; new dots are the separate test.' },
  { act: 'AI CHECK', rail: 'learn', presenter: ['02', 'CHIP + AI LEAD'], time: '8:45–9:35', title: 'Test and retrain', note: 'Let phones make a new point. Then add the checked tricky samples. Say: “Another test says these are changed, even though their two readings look normal. New evidence moves the boundary.”' },
  { act: 'AI CHECK', rail: 'learn', presenter: ['02', 'CHIP + AI LEAD'], time: '9:35–10:20', title: 'Do not confuse a score with proof', note: 'Take the vote, then reveal. A model score is one clue. Scientists repeat the test and check it with another method.' },
  { act: 'ASTROPHYSICS', rail: 'fly', presenter: ['03', 'SPACEFLIGHT LEAD'], time: '10:20–11:10', title: 'Explain orbit in one sentence', note: 'Say: “Gravity pulls the spacecraft down, while sideways speed keeps making it miss Earth.” At 400 km, gravity is still about 90% as strong as at the surface.' },
  { act: 'ASTROPHYSICS', rail: 'fly', presenter: ['03', 'SPACEFLIGHT LEAD'], time: '11:10–12:30', title: 'Correct the orbit', note: 'The guidance system needs a correction. Wait for speed choices, then test the room’s middle choice. Below about 0.99× hits Earth; 1.00× circles; 1.42× escapes. Retry if needed.' },
  { act: 'RESPONSIBLE SCIENCE', rail: 'decide', presenter: ['03', 'SPACEFLIGHT LEAD'], time: '12:30–13:30', title: 'Let the room weigh the risk', note: 'Read the leading choice and one alternative. Say: “Science helps us predict each risk, but people still have to decide which risk is acceptable.”' },
  { act: 'MISSION COMPLETE', rail: 'decide', presenter: ['ALL', 'THREE STUDENTS'], time: '13:30–15:00', title: 'Close in your own voices', note: 'Student One: genetics checked the DNA. Student Two: the sensor measured light and the AI compared patterns. Student Three: physics tested the path. Together: “These subjects work better together.”' }
];

const defaultState = {
  runId: 0, scene: 0, participants: 0, contributorCount: 0, samples: [], challenges: [],
  polls: {
    microscope: { yes: 0, no: 0 }, primer: { gacac: 0, ctgtg: 0, gtgtg: 0, random: 0 },
    architecture: { two: 0, four: 0, eight: 0 }, trust: { deploy: 0, verify: 0 },
    return: { earth: 0, orbit: 0, remote: 0 }
  },
  pcrTaps: 0, photonCount: 0, burns: [], reveals: {},
  training: { epoch: 0, loss: null, accuracy: null, testAccuracy: null, active: false }, model: null,
  demo: false, demoComplete: false
};

const withheldControls = [
  { water: 21, carbon: 25, label: 0 }, { water: 38, carbon: 27, label: 0 },
  { water: 29, carbon: 69, label: 0 }, { water: 49, carbon: 75, label: 0 },
  { water: 61, carbon: 61, label: 1 }, { water: 69, carbon: 63, label: 1 },
  { water: 77, carbon: 75, label: 1 }, { water: 86, carbon: 85, label: 1 },
  { water: 90, carbon: 36, label: 0 }
];

let state = structuredClone(defaultState);
let localRunId = 0;
let localPcrCycle = 0;
let forcedExposure = false;
let currentModel = null;
let trainingTimer = null;
let pcrDemoTimer = null;
let trainingActive = false;
let pendingTraining = false;
let missionStartedAt = null;
let orbitAnimating = false;
let orbitRunToken = 0;
let activeOrbitSpeed = null;
let lastOrbitOutcome = null;
let lastOrbitSpeed = null;
let notesVisible = false;
let preRetrainScore = null;
let retrainSummary = '';

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
    const target = event.target;
    if (target?.closest?.('button, a, input, textarea, select, [role="button"], [contenteditable="true"]')) return;
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
    event.target.setAttribute('aria-valuetext', `${scaleObjects[index][2]} — ${scaleObjects[index][1].toLowerCase()}`);
    $('#scale-tunnel').classList.toggle('zoomed', index > 5);
    $('#scale-tunnel').style.transform = `scale(${1 + index * .018}) rotate(${index * .6}deg)`;
  });

  $$('.speed-presets button').forEach(button => button.addEventListener('click', () => {
    $$('.speed-presets button').forEach(item => {
      item.classList.toggle('selected', item === button);
      item.setAttribute('aria-pressed', String(item === button));
    });
    updateOrbitConcept(Number(button.dataset.orbitSpeed) / 100);
  }));
}

function setScene(index, broadcast = true) {
  const next = Math.max(0, Math.min(scenes.length - 1, Number(index) || 0));
  if (next >= 1 && !missionStartedAt) missionStartedAt = Date.now();
  state.scene = next;
  scenes.forEach((scene, i) => {
    const active = i === next;
    scene.classList.toggle('active', active);
    scene.inert = !active;
    scene.setAttribute('aria-hidden', String(!active));
  });
  updateChrome();
  if (next === 11) drawAI($('#dataset-canvas'), { model: null });
  if (next === 12) drawAI($('#training-canvas'), { model: currentModel, heatmap: true });
  if (next === 13) drawAI($('#challenge-canvas'), { model: currentModel, heatmap: true, challenges: true, mystery: true });
  if (next === 15) {
    const selected = $('.speed-presets button.selected') || $('.speed-presets button[data-orbit-speed="100"]');
    updateOrbitConcept(Number(selected.dataset.orbitSpeed) / 100);
  }
  if (next === 16 && !orbitAnimating) drawOrbit($('#mission-orbit-canvas'), medianBurn(), .01);
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
  $('#lobby-samples').textContent = state.samples.length;
  $('#final-participants').textContent = `${state.contributorCount || state.participants} CONTRIBUTORS`;
  renderPolls();
  renderPCR();
  renderPhotolithography();
  renderAIState();
  renderOrbitState();
  renderReveals();
  renderControlStates();
}

function setControlState(selector, disabled, label) {
  const button = $(selector);
  if (!button) return;
  button.disabled = Boolean(disabled);
  if (label) button.textContent = label;
}

function renderControlStates() {
  setControlState('#seed-demo', state.demoComplete, state.demoComplete ? 'Demo audience loaded' : 'Load demo audience');
  setControlState('#reveal-microscope-button', state.reveals.microscope, state.reveals.microscope ? 'Answer shown' : 'Show the answer');
  setControlState('#reveal-primer-button', state.reveals.primer, state.reveals.primer ? 'Match shown' : 'Show the match');
  setControlState('#reveal-trust-button', state.reveals.trust, state.reveals.trust ? 'Checks shown' : 'Show what scientists do next');
  setControlState('#expose-chip-button', forcedExposure || state.reveals.chip, forcedExposure || state.reveals.chip ? 'Later steps shown' : 'Show the later factory steps');

  const cycle = Math.max(localPcrCycle, crowdPcrCycle());
  const pcrComplete = cycle >= 30 || state.reveals.pcrComplete;
  setControlState('#pcr-cycle-button', pcrComplete || Boolean(pcrDemoTimer), pcrComplete ? 'Cycle 30 reached' : pcrDemoTimer ? 'Running one cycle…' : 'Show 1 full cycle');
  setControlState('#pcr-30-button', pcrComplete, pcrComplete ? 'Cycle 30 reached' : 'Jump to cycle 30');
  $$('.phase-row button').forEach(button => { button.disabled = Boolean(pcrDemoTimer); });

  const hasModel = Boolean(currentModel || state.model);
  setControlState('#train-model-button', trainingActive || pendingTraining, pendingTraining ? 'Loading practice samples…' : trainingActive ? 'Training…' : hasModel ? 'Train again' : 'Start training');
  setControlState('#reset-model-button', !trainingActive && !pendingTraining && !hasModel && !state.training.epoch, pendingTraining ? 'Cancel' : hasModel || trainingActive ? 'Start over' : 'Already reset');
  renderRetrainingState();
  setControlState('#simulate-orbit-button', orbitAnimating, orbitAnimating ? 'Testing path…' : lastOrbitOutcome ? 'Test again' : 'Test our speed');
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
  const archVotes = arch.two + arch.four + arch.eight;
  const hidden = currentModel?.hidden || chosenArchitecture();
  $('#architecture-choice').textContent = archVotes
    ? `${hidden} HIDDEN NEURONS ${currentModel ? 'USED BY THIS MODEL' : 'CHOSEN'}`
    : 'WAITING FOR VOTES';
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
  const microscopeShown = Boolean(state.reveals.microscope);
  const primerShown = Boolean(state.reveals.primer);
  const trustShown = Boolean(state.reveals.trust);
  $('#microscope-reveal').classList.toggle('shown', microscopeShown);
  $('#microscope-reveal').setAttribute('aria-hidden', String(!microscopeShown));
  $('#primer-reveal').classList.toggle('shown', primerShown);
  $('#primer-reveal').setAttribute('aria-hidden', String(!primerShown));
  $('#primer-answer').innerHTML = state.reveals.primer ? '<b>3′</b> — G A C A C — <b>5′</b>' : '<b>3′</b> — ? ? ? ? ? — <b>5′</b>';
  $('#primer-options [data-choice="gacac"]').classList.toggle('correct', Boolean(state.reveals.primer));
  $('#trust-reveal').classList.toggle('shown', trustShown);
  $('#trust-reveal').setAttribute('aria-hidden', String(!trustShown));
  if (state.reveals.chip) forcedExposure = true;
  renderControlStates();
}

function crowdPcrCycle() {
  return Math.min(30, Math.floor(state.pcrTaps / 4));
}

function renderPCR() {
  const cycle = Math.max(localPcrCycle, crowdPcrCycle());
  const copies = 2 ** cycle;
  $('#pcr-cycle').textContent = String(cycle).padStart(2, '0');
  $('#pcr-copies').textContent = formatCopies(copies);
  $('#pcr-tap-label').textContent = `${state.pcrTaps} audience taps`;
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
  renderControlStates();
}

function formatCopies(value) {
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(value >= 1e4 ? 0 : 2)}K`;
  return value.toLocaleString();
}

function selectPcrPhase(index, finished = false) {
  const explanations = [
    '95°C: heat unzips the two DNA strands.',
    '55°C: cooling lets short primers stick to their matching letters.',
    '72°C: an enzyme starts at each primer and builds a matching strand.'
  ];
  $$('.phase-row button').forEach((button, i) => {
    const active = i === index;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  $('#pcr-phase-explanation').textContent = index >= 0
    ? explanations[index]
    : finished
      ? 'One cycle complete: one target copy can become two.'
      : 'Choose a temperature step to see what it does.';
}

function demonstratePcrCycle() {
  if (pcrDemoTimer || Math.max(localPcrCycle, crowdPcrCycle()) >= 30) return;
  let phase = 0;
  selectPcrPhase(phase);
  pcrDemoTimer = window.setInterval(() => {
    phase += 1;
    if (phase < 3) selectPcrPhase(phase);
    else {
      window.clearInterval(pcrDemoTimer);
      pcrDemoTimer = null;
      localPcrCycle = Math.min(30, Math.max(localPcrCycle, crowdPcrCycle()) + 1);
      selectPcrPhase(-1, true);
      renderPCR();
    }
  }, 650);
  renderControlStates();
}

function renderPhotolithography() {
  const target = 48;
  const percent = forcedExposure ? 100 : Math.min(100, state.photonCount / target * 100);
  $('#photon-count').textContent = `${state.photonCount} TAPS`;
  $('#exposure-bar').style.width = `${percent}%`;
  $('#exposure-bar').parentElement.setAttribute('aria-valuenow', String(forcedExposure ? target : Math.min(state.photonCount, target)));
  $('#wafer').style.setProperty('--exposure', String(percent / 100));
  $$('.litho-steps span').forEach((step, index) => {
    const complete = forcedExposure ? true : index === 0 || (index === 1 && percent > 0);
    step.classList.toggle('on', complete);
  });
  renderControlStates();
}

function spawnPhoton(payload = {}) {
  const photon = document.createElement('i');
  photon.className = 'fired-photon';
  const suppliedX = Number(payload.x);
  const x = Number.isFinite(suppliedX) ? Math.max(0, Math.min(100, suppliedX)) : Math.random() * 100;
  photon.style.left = `${8 + x * .84}%`;
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
    renderControlStates();
    socket.emit('host', { type: 'demo', scope: 'samples' });
    return;
  }
  if (trainingTimer) window.clearInterval(trainingTimer);
  currentModel = createNetwork(chosenArchitecture());
  trainingActive = true;
  if (preRetrainScore !== null) retrainSummary = 'Retraining now: the AI is learning from the four newly checked samples.';
  let epoch = 0;
  let loss = null;
  renderTrainingMetrics(epoch, loss, 0, 0, true);
  renderControlStates();
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
      if (preRetrainScore !== null) {
        const nextScore = forwardNetwork(currentModel, [.86, .78]).out;
        retrainSummary = `The same sample moved from ${Math.round(preRetrainScore * 100)}/100 to ${Math.round(nextScore * 100)}/100 after the new evidence.`;
        preRetrainScore = null;
      }
      socket.emit('host', { type: 'model', model: currentModel });
      renderAIState();
      renderControlStates();
    }
  }, 34);
}

function resetModel() {
  if (trainingTimer) window.clearInterval(trainingTimer);
  trainingTimer = null;
  trainingActive = false;
  pendingTraining = false;
  preRetrainScore = null;
  retrainSummary = '';
  currentModel = null;
  state.model = null;
  state.training = { epoch: 0, loss: null, accuracy: null, testAccuracy: null, active: false };
  socket.emit('host', { type: 'clear-model' });
  renderTrainingMetrics(0, null, null, null, false);
  drawAI($('#training-canvas'), { model: null });
  renderControlStates();
}

function renderTrainingMetrics(epoch, loss, accuracy, testAccuracy, active) {
  $('#epoch-value').textContent = String(epoch || 0).padStart(3, '0');
  $('#loss-value').textContent = Number.isFinite(loss) ? loss.toFixed(4) : '—';
  $('#accuracy-value').textContent = Number.isFinite(accuracy) ? `${Math.round(accuracy * 100)}%` : '—';
  $('#test-accuracy-value').textContent = Number.isFinite(testAccuracy) ? `${Math.round(testAccuracy * 100)}%` : '—';
  $('#training-progress').style.width = `${Math.min(100, (epoch || 0) / 5)}%`;
  $('#training-progress').parentElement.setAttribute('aria-valuenow', String(epoch || 0));
  $('#training-progress').style.filter = active ? 'brightness(1.2)' : 'none';
  renderControlStates();
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
  const label = $('#helix-prediction');
  const scoreNode = $('#helix-score');
  if (currentModel) {
    const score = forwardNetwork(currentModel, [.86, .78]).out;
    label.textContent = score >= .5 ? 'LOOKS WORKING' : 'LOOKS CHANGED';
    scoreNode.textContent = `${Math.round(score * 100)}`;
    $('#model-confidence').textContent = `${Math.round(score * 100)}/100`;
    $('#trust-model-claim').textContent = `CURRENT AI ANSWER: ${score >= .5 ? 'LOOKS WORKING' : 'LOOKS CHANGED'} · ${Math.round(score * 100)}/100`;
  } else {
    label.textContent = 'MODEL NOT TRAINED';
    scoreNode.textContent = '—';
    $('#model-confidence').textContent = '—';
    $('#trust-model-claim').textContent = 'THE MODEL GIVES AN ANSWER — WOULD THAT BE ENOUGH?';
  }
  renderRetrainingState();
}

function renderRetrainingState() {
  const button = $('#contaminate-button');
  const status = $('#retraining-status');
  if (!button || !status) return;
  const hasCheckedSamples = state.samples.some(sample => sample.source === 'radiation');
  const hasModel = Boolean(currentModel || state.model);
  const retraining = hasCheckedSamples && (pendingTraining || trainingActive || state.training.active || !hasModel);

  if (retraining) {
    button.disabled = true;
    button.textContent = 'Retraining with 4 checked samples…';
    status.textContent = retrainSummary || 'The four checked samples are being added. Watch the boundary move.';
    return;
  }
  if (hasCheckedSamples) {
    button.disabled = true;
    button.textContent = '4 checked samples added';
    status.textContent = retrainSummary || 'The retrained model now includes the four samples checked by a second test.';
    return;
  }
  button.disabled = !hasModel || pendingTraining || trainingActive;
  button.textContent = hasModel ? 'Add 4 checked samples + retrain' : 'Train the first model first';
  status.textContent = 'A second lab test found four changed samples that the first model had never seen.';
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
  html += '<text x="45" y="150" text-anchor="middle">2 READINGS</text><text x="210" y="150" text-anchor="middle">PATTERN UNITS</text><text x="375" y="150" text-anchor="middle">1 SCORE</text>';
  svg.innerHTML = html;
}

/* Orbit simulation: starts 400 km above Earth; circular speed = 1. */
const EARTH_RADIUS_RATIO = 6371 / 6771;
const ATMOSPHERE_RADIUS_RATIO = 6471 / 6771;

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
    if (newRadius < ATMOSPHERE_RADIUS_RATIO) { outcome = 'CRASH'; break; }
    if (newRadius > 3.2) { outcome = speed >= Math.SQRT2 ? 'ESCAPE' : 'HIGH ORBIT'; break; }
  }
  if (speed >= Math.SQRT2 && outcome !== 'CRASH') outcome = 'ESCAPE';
  else if (outcome === 'ORBIT' && speed > 1.05) outcome = 'HIGH ORBIT';
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
  const earthRadius = scale * EARTH_RADIUS_RATIO;
  const gradient = context.createRadialGradient(centre.x - earthRadius * .3, centre.y - earthRadius * .3, 3, centre.x, centre.y, earthRadius);
  gradient.addColorStop(0, '#d0f6ef'); gradient.addColorStop(.15, '#7aa9b5'); gradient.addColorStop(.48, '#294a68'); gradient.addColorStop(1, '#07100f');
  context.beginPath(); context.arc(centre.x, centre.y, earthRadius, 0, Math.PI * 2); context.fillStyle = gradient; context.fill();
  context.beginPath(); context.arc(centre.x, centre.y, scale * ATMOSPHERE_RADIUS_RATIO, 0, Math.PI * 2);
  context.strokeStyle = 'rgba(103,232,249,.18)'; context.lineWidth = 2; context.stroke();
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

function updateOrbitConcept(speed) {
  const trajectory = drawOrbit($('#orbit-demo-canvas'), speed, 1);
  const messages = {
    CRASH: 'TOO SLOW: gravity pulls the path into the atmosphere.',
    ORBIT: 'ORBIT: gravity keeps bending the sideways motion around Earth.',
    'HIGH ORBIT': 'FASTER: the spacecraft stays in orbit, but follows a much larger ellipse.',
    ESCAPE: 'ESCAPE SPEED: the spacecraft is moving fast enough to leave Earth.'
  };
  $('#orbit-concept-result').textContent = messages[trajectory?.outcome] || 'Change the speed to see how the path changes.';
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
  const shownSpeed = activeOrbitSpeed ?? speed;
  $('#median-burn').textContent = state.burns.length ? `${shownSpeed.toFixed(2)}×` : '—';
  $('#burn-count').textContent = state.burns.length;
  $('#telemetry-vel').textContent = state.burns.length ? `${(7.67 * shownSpeed).toFixed(2)} km/s` : '—';
  if (!orbitAnimating) {
    const sameAsLastRun = lastOrbitOutcome && Math.abs((lastOrbitSpeed ?? -1) - speed) < .0001;
    drawOrbit($('#mission-orbit-canvas'), speed, sameAsLastRun ? 1 : .01);
    if (lastOrbitOutcome && !sameAsLastRun) {
      lastOrbitOutcome = null;
      lastOrbitSpeed = null;
      $('#flight-result').textContent = 'SPEED CHANGED — TEST THE NEW PATH';
      $('#telemetry-alt').textContent = 'START: 400 km';
      $('#telemetry-status').textContent = 'READY';
    }
  }
  renderControlStates();
}

function simulateOrbit() {
  if (orbitAnimating) return;
  if (!state.burns.length) {
    $('#flight-result').textContent = 'WAITING FOR AT LEAST ONE SPEED CHOICE';
    return;
  }
  orbitAnimating = true;
  const speed = medianBurn();
  activeOrbitSpeed = speed;
  const runToken = ++orbitRunToken;
  const trajectory = makeTrajectory(speed);
  const start = performance.now();
  const duration = 4200;
  $('#flight-result').textContent = `TESTING THE ROOM’S ${speed.toFixed(2)}× SPEED…`;
  $('#telemetry-status').textContent = 'BURN';
  renderControlStates();
  function frame(now) {
    if (runToken !== orbitRunToken) return;
    const progress = Math.min(1, (now - start) / duration);
    drawOrbit($('#mission-orbit-canvas'), speed, progress);
    $('#telemetry-status').textContent = progress < .15 ? 'BURN' : 'COAST';
    if (progress < 1) requestAnimationFrame(frame);
    else {
      orbitAnimating = false;
      activeOrbitSpeed = null;
      lastOrbitOutcome = trajectory.outcome;
      lastOrbitSpeed = speed;
      const messages = {
        CRASH: `AT ${speed.toFixed(2)}×: TOO SLOW — THE PATH HITS THE ATMOSPHERE`,
        ESCAPE: `AT ${speed.toFixed(2)}×: TOO FAST — THE SPACECRAFT ESCAPES`,
        'HIGH ORBIT': `AT ${speed.toFixed(2)}×: STILL ORBITING — BUT ON A LARGE ELLIPSE`,
        ORBIT: `AT ${speed.toFixed(2)}×: ORBIT — IT KEEPS MISSING EARTH`
      };
      $('#flight-result').textContent = messages[trajectory.outcome];
      $('#telemetry-status').textContent = trajectory.outcome;
      $('#telemetry-alt').textContent = trajectory.outcome === 'ORBIT' ? 'SAFE ORBIT' : trajectory.outcome === 'CRASH' ? '<100 km' : trajectory.outcome === 'HIGH ORBIT' ? 'LARGE ELLIPSE' : 'ESCAPE';
      renderOrbitState();
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
  if (action === 'reveal-microscope' && !state.reveals.microscope) socket.emit('host', { type: 'reveal', key: 'microscope', value: true });
  if (action === 'pcr-cycle') demonstratePcrCycle();
  if (action === 'pcr-30' && Math.max(localPcrCycle, crowdPcrCycle()) < 30) { localPcrCycle = 30; socket.emit('host', { type: 'reveal', key: 'pcrComplete', value: true }); renderPCR(); }
  if (action === 'reveal-primer' && !state.reveals.primer) socket.emit('host', { type: 'reveal', key: 'primer', value: true });
  if (action === 'expose-chip' && !forcedExposure && !state.reveals.chip) { forcedExposure = true; socket.emit('host', { type: 'reveal', key: 'chip', value: true }); renderPhotolithography(); }
  if (action === 'train-model') startTraining();
  if (action === 'reset-model') resetModel();
  if (action === 'contaminate-model' && !state.samples.some(sample => sample.source === 'radiation') && currentModel) {
    preRetrainScore = forwardNetwork(currentModel, [.86, .78]).out;
    retrainSummary = 'Adding four samples that a second lab test marked as changed…';
    pendingTraining = true;
    renderRetrainingState();
    socket.emit('host', { type: 'contaminate' });
  }
  if (action === 'reveal-trust' && !state.reveals.trust) socket.emit('host', { type: 'reveal', key: 'trust', value: true });
  if (action === 'simulate-orbit') simulateOrbit();
}

function toggleNotes() {
  notesVisible = !notesVisible;
  const notes = $('#presenter-notes');
  notes.classList.toggle('shown', notesVisible);
  notes.inert = !notesVisible;
  notes.setAttribute('aria-hidden', String(!notesVisible));
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
  preRetrainScore = null;
  retrainSummary = '';
  missionStartedAt = null;
  orbitAnimating = false;
  activeOrbitSpeed = null;
  lastOrbitOutcome = null;
  lastOrbitSpeed = null;
  orbitRunToken += 1;
  if (pcrDemoTimer) window.clearInterval(pcrDemoTimer);
  pcrDemoTimer = null;
  if (trainingTimer) window.clearInterval(trainingTimer);
  trainingTimer = null;
  selectPcrPhase(-1, false);
  const scaleSlider = $('#scale-slider');
  scaleSlider.value = 0;
  scaleSlider.dispatchEvent(new Event('input'));
  $$('.speed-presets button').forEach(button => {
    const selected = button.dataset.orbitSpeed === '100';
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  $('#flight-result').textContent = 'WAITING FOR SPEED CHOICES';
  $('#telemetry-alt').textContent = 'START: 400 km';
  $('#telemetry-vel').textContent = '—';
  $('#telemetry-status').textContent = 'READY';
  renderControlStates();
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
