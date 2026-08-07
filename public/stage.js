const launchParams = new URLSearchParams(window.location.search);
const hostTokenFromUrl = launchParams.get('host');
// ?keep survives the tidy-up of the presenter code so a rehearsal can be reloaded without a reset.
const keepRunOnLoad = launchParams.has('keep');
if (hostTokenFromUrl) {
  window.sessionStorage.setItem('signal2045-host-token', hostTokenFromUrl);
  window.history.replaceState({}, '', `${window.location.pathname}${keepRunOnLoad ? '?keep' : ''}${window.location.hash}`);
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

// Loading the stage page starts a fresh run: the presentation returns to the QR lobby and every
// audience response is deleted, so a reload can never leave phones holding activities from an
// earlier rehearsal. Only the first connection of a page load resets; later ones are network
// reconnections and must keep the live run. Open the stage with ?keep to reload without wiping.
let requestedFreshRun = false;
socket.on('connect', () => {
  if (keepRunOnLoad || requestedFreshRun) return;
  requestedFreshRun = true;
  socket.emit('host', { type: 'reset' });
});

function showHostAccessPanel() {
  if (document.querySelector('#host-access-panel')) return;
  const panel = document.createElement('div');
  panel.id = 'host-access-panel';
  panel.className = 'host-access-overlay';
  panel.innerHTML = `
    <form class="host-access-card glass">
      <div class="kicker"><span>PRESENTER ACCESS</span><em>PRIVATE</em></div>
      <h2>Enter the presenter code</h2>
      <p>Enter the <code>HOST_TOKEN</code> set in Render. Audience members do not need a code.</p>
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
  { act: 'BEFORE START', rail: 'sample', presenter: ['00', 'PRESENTER'], time: 'Before start', title: 'Connect the audience', note: 'Ask everyone to scan the QR code. Their phones show a welcome message until scene 1 opens the sample task. If Wi-Fi fails, select “Load demo audience”.' },
  { act: 'PROBLEM', rail: 'sample', presenter: ['01', 'STUDENT ONE'], time: '0:00–0:30', title: 'Explain the problem', note: 'Pause, then say: “PCR found one section of the added control gene, but the GFP light is low. We have 15 minutes to find out why.” Every phone can now tap its graph to choose one sample and label it. Ask people to spread out across the graph.' },
  { act: 'PLAN', rail: 'sample', presenter: ['ALL', 'THREE PRESENTERS'], time: '0:30–1:05', title: 'Explain the three tasks', note: 'Say: “First we use PCR to check one section of the control gene. Then we measure GFP’s green light and train a model to compare both scores. Finally, we test the possible orbits. The final decision uses the biological evidence and the orbital options.”' },
  { act: 'GENETIC ENGINEERING', rail: 'sample', presenter: ['01', 'GENETICS LEAD'], time: '1:05–1:50', title: 'Explain the two added genes', note: 'Say: “A gene is a long DNA sequence made from A, T, G and C. We inserted two new genes. The control gene makes a regulatory protein. That protein switches on the GFP reporter gene. The reporter gene makes GFP, a fluorescent protein that gives off green light.” This is a fictional classroom circuit.' },
  { act: 'GENETICS', rail: 'amplify', presenter: ['01', 'GENETICS LEAD'], time: '1:50–2:30', title: 'Ask the microscope question', note: 'Wait for the phone votes, then show the answer. A classroom microscope can show DNA in a sample, but it cannot identify the A, T, C and G sequence. That requires other tests.' },
  { act: 'PCR', rail: 'amplify', presenter: ['01', 'GENETICS LEAD'], time: '2:30–3:30', title: 'Demonstrate one PCR cycle', note: 'Show the three steps in order. Say: “Our primers target one short section of the control gene. Under ideal conditions, each cycle doubles that section. The phone taps only control this animation.” Then jump to cycle 30.' },
  { act: 'DNA MATCHING', rail: 'amplify', presenter: ['01', 'GENETICS LEAD'], time: '3:30–4:20', title: 'Choose the matching DNA strand', note: 'After the vote, show GACAC. This short exercise uses complementary DNA bases. Real PCR uses two longer primers, one at each end of the target.' },
  { act: 'NEXT STEP', rail: 'amplify', presenter: ['01→02', 'GENETICS → CHIP'], time: '4:20–4:45', title: 'Explain what PCR tells us', note: 'Student One: “PCR found its target inside the control gene. It does not prove that the complete control gene, the GFP reporter gene or either protein works.” Student Two: “I will measure GFP’s green light, then compare the GFP-light score with the control-gene PCR score using an AI model.”' },
  { act: 'NANOTECHNOLOGY', rail: 'sense', presenter: ['02', 'CHIP AND AI LEAD'], time: '4:45–5:25', title: 'Explain one nanometre', note: 'Move the slider from metres to nanometres. Say: “A fingernail grows about one nanometre each second.”' },
  { act: 'CHIP MAKING', rail: 'sense', presenter: ['02', 'CHIP AND AI LEAD'], time: '5:25–6:20', title: 'Show how UV light makes a chip pattern', note: 'Ask the audience to tap. Explain that the taps only control the animation. In chip production, UV light changes a light-sensitive coating. Developing and etching then form the chip structures.' },
  { act: 'SENSOR AND AI', rail: 'sense', presenter: ['02', 'CHIP AND AI LEAD'], time: '6:20–6:55', title: 'Explain how light becomes data', note: 'Point to each step: “The sensor—not the AI—measures green light from GFP and records a GFP-light score. For every sample, the model receives that score and the control-gene PCR score.” UV was used earlier to make the chip; it is not the green light being measured.' },
  { act: 'AI TRAINING', rail: 'learn', presenter: ['02', 'CHIP AND AI LEAD'], time: '6:55–7:40', title: 'Explain the inputs and target', note: 'Say: “The horizontal axis is the control-gene PCR score. The vertical axis is the GFP-light score from the sensor. The chart only plots those measurements. Each dot’s colour is its known label: WORKING or CHANGED.” The hidden-neuron counter starts at the leading audience vote. Use minus or plus to choose 1–8 neurons before training.' },
  { act: 'AI TRAINING', rail: 'learn', presenter: ['02', 'CHIP AND AI LEAD'], time: '7:40–8:45', title: 'Train the model', note: 'Select Start training. Say: “For each sample, the model predicts WORKING or CHANGED, compares that prediction with the known label and adjusts its weights.” One epoch is one pass through all training examples. Loss measures error. Test accuracy uses separate examples.' },
  { act: 'TEST THE AI', rail: 'learn', presenter: ['02', 'CHIP AND AI LEAD'], time: '8:45–9:35', title: 'Test, add evidence and retrain', note: 'Let the audience choose values for a new sample. Then add four samples verified by another test. Say: “Their control-gene PCR and GFP-light scores look normal, but an independent test found that their circuits changed. Adding them changes how the model separates the groups.”' },
  { act: 'CHECK THE RESULT', rail: 'learn', presenter: ['02', 'CHIP AND AI LEAD'], time: '9:35–10:20', title: 'Explain that a model score is not proof', note: 'Take the vote, then show the checks. Student Two: “The AI result adds evidence, but it does not settle the decision. We still need independent biological tests.” Student Three: “The decision also depends on where the laboratory can travel. I will use orbital physics to test the possible paths.”' },
  { act: 'ORBIT', rail: 'fly', presenter: ['03', 'SPACEFLIGHT LEAD'], time: '10:20–11:10', title: 'Explain orbit', note: 'Say: “The biological tests tell us about the sample. Orbital physics tells us which paths the laboratory can take. A spacecraft stays in orbit because it moves sideways while gravity pulls it towards Earth.” At 400 km, gravity is still about 90% as strong as it is at Earth’s surface.' },
  { act: 'ORBIT TEST', rail: 'fly', presenter: ['03', 'SPACEFLIGHT LEAD'], time: '11:10–12:30', title: 'Test the chosen orbital speed', note: 'Wait for the audience’s choices, then test the median. Below about 0.99× circular-orbit speed, the spacecraft enters the atmosphere; 1.00× produces a circular orbit; 1.42× or above escapes Earth. Test again if needed.' },
  { act: 'DECISION', rail: 'decide', presenter: ['03', 'SPACEFLIGHT LEAD'], time: '12:30–13:30', title: 'Discuss the risks', note: 'Read the most popular choice and one alternative. Say: “Science can help us estimate the risks, but people must decide which risks are acceptable.”' },
  { act: 'FINISHED', rail: 'decide', presenter: ['ALL', 'THREE PRESENTERS'], time: '13:30–15:00', title: 'Summarise the activity', note: 'Student One: “We used PCR to check one section of the control gene.” Student Two: “We measured GFP light and used an AI model to compare the two scores.” Student Three: “We used physics to test the spacecraft’s path.” Together: “These subjects helped us investigate the full problem.”' }
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
let manualArchitecture = null;
let pendingHiddenUnits = null;
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
setupHelixAnimation();
$('#scale-slider').dispatchEvent(new Event('input'));

fetch('/api/config')
  .then(response => response.json())
  .then(config => {
    $('#qr').src = config.qr;
    $('#join-url').textContent = config.audienceUrl.replace(/^https?:\/\//, '');
  })
  .catch(() => { $('#join-url').textContent = 'Could not load the QR code. Use the demo audience.'; });

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
    ['sample', 'SAMPLES', 0, 3], ['amplify', 'PCR', 4, 7], ['sense', 'SENSOR', 8, 10],
    ['learn', 'AI', 11, 14], ['fly', 'ORBIT', 15, 16], ['decide', 'DECISION', 17, 18]
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

const INTERACTIVE = 'button, a, input, textarea, select, [role="button"], [contenteditable="true"]';
const isInteractive = target => Boolean(target?.closest?.(INTERACTIVE));

function setupInputs() {
  document.addEventListener('keydown', event => {
    if (isInteractive(event.target)) return;
    if (['ArrowRight', 'PageDown'].includes(event.key)) setScene(state.scene + 1);
    if (['ArrowLeft', 'PageUp'].includes(event.key)) setScene(state.scene - 1);
    if (event.key === 'Enter') runPrimaryAction();
    if (event.key.toLowerCase() === 'n') toggleNotes();
    if (event.key.toLowerCase() === 'f') document.documentElement.requestFullscreen?.();
    if (event.key.toLowerCase() === 'd') socket.emit('host', { type: 'demo' });
    if (event.key.toLowerCase() === 'r' && event.shiftKey && confirm('Reset the presentation and delete all audience responses?')) {
      socket.emit('host', { type: 'reset' });
    }
  });

  $$('[data-action]').forEach(button => button.addEventListener('click', () => runAction(button.dataset.action)));
  $('#seed-demo').addEventListener('click', () => socket.emit('host', { type: 'demo' }));

  $$('.phase-row button').forEach(button => button.addEventListener('click', () => selectPcrPhase(Number(button.dataset.phase))));

  $$('[data-hidden-units]').forEach(button => button.addEventListener('click', () => {
    if (button.disabled) return;
    manualArchitecture = null;
    renderPolls();
    renderControlStates();
  }));

  $$('[data-neuron-step]').forEach(button => button.addEventListener('click', () => {
    if (button.disabled) return;
    const step = Number(button.dataset.neuronStep);
    manualArchitecture = Math.max(1, Math.min(8, chosenArchitecture() + step));
    renderPolls();
    renderControlStates();
  }));

  // Power of ten, what lives at that size, the size in words, how many of them span a metre, and a
  // short name for the step above. The count is the point of the scene: it makes a nanometre
  // concrete in a way a zooming diagram cannot.
  const scaleObjects = [
    ['10⁰ m', 'ABOUT ONE METRE', '1 metre', '1', 'one metre'],
    ['10⁻¹ m', 'A HAND', '10 centimetres', '10', 'a hand'],
    ['10⁻² m', 'A FINGERNAIL', '1 centimetre', '100', 'a fingernail'],
    ['10⁻³ m', 'A GRAIN OF SAND', '1 millimetre', '1,000', 'a grain of sand'],
    ['10⁻⁴ m', 'HUMAN HAIR WIDTH', '100 micrometres', '10,000', 'a hair’s width'],
    ['10⁻⁵ m', 'A HUMAN CELL', '10 micrometres', '100,000', 'a human cell'],
    ['10⁻⁶ m', 'A BACTERIUM', '1 micrometre', '1,000,000', 'a bacterium'],
    ['10⁻⁷ m', 'A VIRUS', '100 nanometres', '10,000,000', 'a virus'],
    ['10⁻⁸ m', 'DNA IS ABOUT 2 NANOMETRES WIDE', '10 nanometres', '100,000,000', 'the width of DNA'],
    ['10⁻⁹ m', 'ONE NANOMETRE', '1 nanometre', '1,000,000,000', 'one nanometre']
  ];
  const scaleRungs = $$('#scale-ladder li');
  $('#scale-slider').addEventListener('input', event => {
    const index = Number(event.target.value);
    const [power, object, size, count] = scaleObjects[index];
    $('#scale-power').textContent = power;
    $('#scale-object').textContent = object;
    $('#scale-label').textContent = size;
    $('#scale-count').textContent = count;
    $('#scale-note').textContent = index ? `Ten times smaller than ${scaleObjects[index - 1][4]}` : 'The starting size';
    $('#scale-fit-label').textContent = index ? 'of these fit across one metre' : 'metre — the starting size';
    event.target.setAttribute('aria-valuetext', `${size} — ${object.toLowerCase()}`);
    scaleRungs.forEach((rung, step) => {
      rung.classList.toggle('active', step === index);
      rung.classList.toggle('passed', step < index);
    });
    // The focus panel shows the rung's own symbol, so the two never drift apart.
    const symbol = scaleRungs[index]?.querySelector('svg');
    if (symbol) $('#scale-symbol').innerHTML = symbol.outerHTML;
  });

  $$('.speed-presets button').forEach(button => button.addEventListener('click', () => {
    $$('.speed-presets button').forEach(item => {
      item.classList.toggle('selected', item === button);
      item.setAttribute('aria-pressed', String(item === button));
    });
    updateOrbitConcept(Number(button.dataset.orbitSpeed) / 100);
  }));

  setupTouchNav();
}

// Tap and swipe on a touchscreen do exactly what the arrow keys do on a laptop.
// Tap the left fifth of the deck to go back, tap anywhere else to go forward;
// swiping left or right works too, which is what most people try first.
function setupTouchNav() {
  const BACK_ZONE = .2;   // fraction of the width that counts as "go back"
  const SWIPE_MIN = 45;   // px of sideways travel that counts as a swipe
  const TAP_MAX_MOVE = 12;// px of travel still forgiving enough to be a tap
  const TAP_MAX_MS = 700; // anything slower is a long press, not a tap
  const deck = $('#deck');
  let start = null;

  deck.addEventListener('pointerdown', event => {
    // Mouse clicks stay inert: a presenter clicking to focus the window
    // should never lose their place in the deck.
    const touching = event.pointerType === 'touch' || event.pointerType === 'pen';
    start = touching && event.isPrimary && !isInteractive(event.target)
      ? { x: event.clientX, y: event.clientY, at: Date.now() }
      : null;
  }, { passive: true });

  deck.addEventListener('pointercancel', () => { start = null; });

  deck.addEventListener('pointerup', event => {
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    const elapsed = Date.now() - start.at;
    const startX = start.x;
    start = null;

    if (Math.abs(dx) >= SWIPE_MIN && Math.abs(dx) > Math.abs(dy)) {
      setScene(state.scene + (dx < 0 ? 1 : -1));   // drag the slide leftwards to advance
      return;
    }
    // A vertical drag is someone scrolling a tall scene on a small screen.
    if (Math.hypot(dx, dy) > TAP_MAX_MOVE || elapsed > TAP_MAX_MS) return;
    setScene(state.scene + (startX < deck.clientWidth * BACK_ZONE ? -1 : 1));
  }, { passive: true });
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
  $('#online-count').textContent = `${state.participants} CONNECTED`;
  $('#lobby-people').textContent = state.participants;
  $('#lobby-samples').textContent = state.samples.length;
  $('#final-participants').textContent = `${state.contributorCount || state.participants} PEOPLE RESPONDED`;
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
  setControlState('#reveal-trust-button', state.reveals.trust, state.reveals.trust ? 'Checks shown' : 'Show the verification steps');
  setControlState('#expose-chip-button', forcedExposure || state.reveals.chip, forcedExposure || state.reveals.chip ? 'Manufacturing steps shown' : 'Show the next manufacturing steps');

  const cycle = Math.max(localPcrCycle, crowdPcrCycle());
  const pcrComplete = cycle >= 30 || state.reveals.pcrComplete;
  setControlState('#pcr-cycle-button', pcrComplete || Boolean(pcrDemoTimer), pcrComplete ? 'Cycle 30 reached' : pcrDemoTimer ? 'Running one cycle…' : 'Run 1 full cycle');
  setControlState('#pcr-30-button', pcrComplete, pcrComplete ? 'Cycle 30 reached' : 'Jump to cycle 30');
  $$('.phase-row button').forEach(button => { button.disabled = Boolean(pcrDemoTimer); });

  const hasModel = Boolean(currentModel || state.model);
  setControlState('#train-model-button', trainingActive || pendingTraining, pendingTraining ? 'Loading training samples…' : trainingActive ? 'Training…' : hasModel ? 'Train again' : 'Start training');
  setControlState('#reset-model-button', !trainingActive && !pendingTraining && !hasModel && !state.training.epoch, pendingTraining ? 'Cancel' : hasModel || trainingActive ? 'Reset model' : 'Model already reset');
  const hidden = validArchitecture(currentModel?.hidden || state.model?.hidden)
    || validArchitecture(pendingHiddenUnits)
    || chosenArchitecture();
  const architectureLocked = trainingActive || pendingTraining || hasModel;
  $$('[data-hidden-units]').forEach(button => { button.disabled = architectureLocked; });
  $$('[data-neuron-step]').forEach(button => {
    const step = Number(button.dataset.neuronStep);
    button.disabled = architectureLocked || (step < 0 && hidden <= 1) || (step > 0 && hidden >= 8);
  });
  renderRetrainingState();
  setControlState('#simulate-orbit-button', orbitAnimating, orbitAnimating ? 'Simulating orbit…' : lastOrbitOutcome ? 'Simulate again' : 'Simulate this speed');
}

function renderPolls() {
  setTally('micro', Object.entries(state.polls.microscope));
  const primer = state.polls.primer;
  const primerTotal = Object.values(primer).reduce((sum, value) => sum + value, 0);
  const primerBest = Math.max(...Object.values(primer));
  Object.entries(primer).forEach(([key, value]) => {
    const share = primerTotal ? value / primerTotal * 100 : 0;
    $(`#primer-${key}`).textContent = `${Math.round(share)}%`;
    const card = $(`#primer-options [data-choice="${key}"]`);
    card.querySelector('.choice-track').style.setProperty('--fill', barWidth(share));
    card.classList.toggle('leading', primerTotal > 0 && value === primerBest);
  });
  $('#primer-total').textContent = primerTotal;
  const arch = state.polls.architecture;
  $('#arch-two').textContent = arch.two;
  $('#arch-four').textContent = arch.four;
  $('#arch-eight').textContent = arch.eight;
  const archVotes = arch.two + arch.four + arch.eight;
  const archPeak = Math.max(arch.two, arch.four, arch.eight);
  $$('.architecture-results span').forEach((node, index) => {
    const value = [arch.two, arch.four, arch.eight][index];
    node.querySelector('i').style.setProperty('--fill', archPeak ? barWidth(value / archPeak * 100) : '0%');
  });
  const audienceHidden = audienceArchitecture();
  const modelHidden = validArchitecture(currentModel?.hidden || state.model?.hidden);
  const hidden = modelHidden || pendingHiddenUnits || chosenArchitecture();
  const tiedLeaders = archVotes
    ? [2, 4, 8].filter(value => architectureVotes(value) === Math.max(arch.two, arch.four, arch.eight))
    : [];
  $('#hidden-neuron-count').textContent = hidden;
  $('#architecture-choice').textContent = modelHidden
    ? 'CURRENT MODEL'
    : manualArchitecture !== null
      ? 'PRESENTER SETTING'
      : archVotes
        ? 'STARTING FROM AUDIENCE RESULT'
        : 'DEFAULT · NO VOTES YET';
  $('#architecture-source').textContent = modelHidden
    ? `This model uses ${hiddenNeuronLabel(modelHidden)}. Reset the model before choosing another size.`
    : manualArchitecture !== null
      ? `${archVotes ? `Audience result: ${audienceHidden}. ` : ''}The presenter selected ${hiddenNeuronLabel(manualArchitecture)} for the next training run.`
      : !archVotes
        ? 'No audience votes yet, so the counter starts at 4 hidden neurons.'
        : tiedLeaders.length > 1
          ? `The audience vote is tied. The counter starts at ${hiddenNeuronLabel(audienceHidden)}.`
          : `The counter starts at the audience’s leading choice: ${hiddenNeuronLabel(audienceHidden)}.`;
  $$('.architecture-results span').forEach((node, index) => node.classList.toggle('winner', [2, 4, 8][index] === audienceHidden && archVotes > 0));
  $$('[data-hidden-units]').forEach(button => {
    button.setAttribute('aria-pressed', String(manualArchitecture === null));
  });
  drawNetwork(hidden);
  setTally('trust', Object.entries(state.polls.trust));

  const returns = state.polls.return;
  const total = Object.values(returns).reduce((sum, value) => sum + value, 0);
  const best = Math.max(...Object.values(returns));
  Object.entries(returns).forEach(([key, value]) => {
    const percent = total ? Math.round(value / total * 100) : 0;
    $(`#return-${key}`).style.width = `${percent}%`;
    $(`#return-${key}-n`).textContent = `${percent}%`;
    $(`#return-${key}`).closest('article').classList.toggle('leading', total > 0 && value === best);
  });
  $('#return-total').textContent = total;
}

// Every poll on the stage reads the same way: a bar per option in the act's accent, a count big
// enough for the back row, the share beside it, and full-strength ink on whatever is leading.
function barWidth(share) {
  return `${Math.round(share * 10) / 10}%`;
}

function setTally(prefix, entries) {
  const total = entries.reduce((sum, [, value]) => sum + value, 0);
  const best = Math.max(...entries.map(([, value]) => value));
  entries.forEach(([key, value]) => {
    const share = total ? value / total * 100 : 0;
    $(`#${prefix}-${key}`).style.width = barWidth(share);
    $(`#${prefix}-${key}-n`).textContent = value;
    $(`#${prefix}-${key}-p`).textContent = total ? `${Math.round(share)}%` : '—';
    $(`#${prefix}-${key}-row`).classList.toggle('leading', total > 0 && value === best);
  });
  $(`#${prefix}-total`).textContent = total;
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
  $('#pcr-tap-label').textContent = `${state.pcrTaps} audience ${state.pcrTaps === 1 ? 'tap' : 'taps'}`;
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
    '95°C: heat separates the two DNA strands.',
    '55°C: primers bind to matching DNA bases.',
    '72°C: an enzyme extends each primer to copy the DNA.'
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
  $('#photon-count').textContent = `${state.photonCount} ${state.photonCount === 1 ? 'TAP' : 'TAPS'}`;
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

function validArchitecture(value) {
  const hidden = Number(value);
  return Number.isInteger(hidden) && hidden >= 1 && hidden <= 8 ? hidden : null;
}

function hiddenNeuronLabel(hidden) {
  return `${hidden} hidden ${hidden === 1 ? 'neuron' : 'neurons'}`;
}

function architectureVotes(hidden) {
  return state.polls.architecture[{ 2: 'two', 4: 'four', 8: 'eight' }[hidden]] || 0;
}

function audienceArchitecture() {
  return [4, 2, 8].reduce((leader, hidden) => (
    architectureVotes(hidden) > architectureVotes(leader) ? hidden : leader
  ), 4);
}

function chosenArchitecture() {
  return manualArchitecture !== null
    ? validArchitecture(manualArchitecture) || audienceArchitecture()
    : audienceArchitecture();
}

function startTraining() {
  if (trainingActive) return;
  pendingHiddenUnits = validArchitecture(pendingHiddenUnits)
    || validArchitecture(currentModel?.hidden)
    || chosenArchitecture();
  if (state.samples.length < 6) {
    pendingTraining = true;
    renderControlStates();
    socket.emit('host', { type: 'demo', scope: 'samples' });
    return;
  }
  if (trainingTimer) window.clearInterval(trainingTimer);
  const hiddenUnits = pendingHiddenUnits;
  pendingHiddenUnits = null;
  currentModel = createNetwork(hiddenUnits);
  trainingActive = true;
  if (preRetrainScore !== null) retrainSummary = 'Retraining the model with the four newly verified samples.';
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
        retrainSummary = `The model’s score for the same sample changed from ${Math.round(preRetrainScore * 100)}/100 to ${Math.round(nextScore * 100)}/100 after retraining.`;
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
  pendingHiddenUnits = null;
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
  $('#dataset-count').textContent = `${state.samples.length} TRAINING SAMPLES`;
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
    label.textContent = score >= .5 ? 'MODEL OUTPUT: WORKING' : 'MODEL OUTPUT: CHANGED';
    scoreNode.textContent = `${Math.round(score * 100)}`;
    $('#trust-model-claim').textContent = `CURRENT MODEL PREDICTION: ${score >= .5 ? 'WORKING' : 'CHANGED'} · ${Math.round(score * 100)}/100`;
  } else {
    label.textContent = 'MODEL NOT TRAINED';
    scoreNode.textContent = '—';
    $('#trust-model-claim').textContent = 'IF THE MODEL GIVES A HIGH SCORE, IS THAT ENOUGH EVIDENCE?';
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
    button.textContent = 'Retraining with 4 verified samples…';
    status.textContent = retrainSummary || 'The four verified samples are being added. Watch how the line between the two groups changes.';
    return;
  }
  if (hasCheckedSamples) {
    button.disabled = true;
    button.textContent = '4 verified samples added';
    status.textContent = retrainSummary || 'The retrained model includes the four samples verified by a second test.';
    return;
  }
  button.disabled = !hasModel || pendingTraining || trainingActive;
  button.textContent = hasModel ? 'Add 4 verified samples and retrain' : 'Train the first model first';
  status.textContent = 'A second test marked four samples as changed. The first model was not trained on them.';
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
  const middle = hidden === 1
    ? [{ x: 210, y: 82 }]
    : Array.from({ length: hidden }, (_, index) => ({ x: 210, y: 20 + index * (120 / (hidden - 1)) }));
  const output = [{ x: 375, y: 82 }];
  let html = '';
  input.forEach(a => middle.forEach(b => { html += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" />`; }));
  middle.forEach(a => output.forEach(b => { html += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" />`; }));
  [...input, ...middle, ...output].forEach(node => { html += `<circle cx="${node.x}" cy="${node.y}" r="7" />`; });
  html += `<text x="45" y="150" text-anchor="middle">TWO INPUT SCORES</text><text x="210" y="150" text-anchor="middle">${hidden} HIDDEN ${hidden === 1 ? 'NEURON' : 'NEURONS'}</text><text x="375" y="150" text-anchor="middle">PREDICTED LABEL</text>`;
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
  drawSatellite(context, centre.x + point.x * scale, centre.y - point.y * scale, centre, scale);
  return trajectory;
}

// HELIX–7 is a laboratory, so it is drawn as one: a body with two solar wings and a dish. The
// craft is turned to keep its dish facing Earth, which puts the wings along the path and keeps
// the whole glyph inside the narrow gap between Earth's surface and the orbit.
function drawSatellite(context, x, y, centre, scale) {
  const unit = Math.max(4, scale * .055);
  const wing = [-unit * .38, unit * .76, unit * 1.4];
  context.save();
  context.translate(x, y);
  context.rotate(Math.atan2(centre.y - y, centre.x - x));
  context.shadowColor = 'rgba(255,224,107,.7)';
  context.shadowBlur = 14;
  // A dark ring keeps every part of the craft legible where it crosses Earth's bright limb.
  context.strokeStyle = '#07100f';
  context.lineWidth = 2;
  context.fillStyle = '#9fa8ff';
  [-unit * 2.5, unit * 1.1].forEach(top => {
    context.fillRect(wing[0], top, wing[1], wing[2]);
    context.shadowBlur = 0;
    context.strokeRect(wing[0], top, wing[1], wing[2]);
  });
  context.strokeStyle = 'rgba(241,250,247,.75)';
  context.lineWidth = Math.max(1, unit * .16);
  context.beginPath();
  context.moveTo(0, -unit * 1.1); context.lineTo(0, -unit * .55);
  context.moveTo(0, unit * 1.1); context.lineTo(0, unit * .55);
  context.stroke();
  context.fillStyle = '#ffe06b';
  context.fillRect(-unit * .55, -unit * .55, unit * 1.1, unit * 1.1);
  context.strokeStyle = '#07100f';
  context.lineWidth = 2;
  context.strokeRect(-unit * .55, -unit * .55, unit * 1.1, unit * 1.1);
  context.beginPath();
  context.arc(unit * .88, 0, unit * .36, 0, Math.PI * 2);
  context.fillStyle = '#f1faf7';
  context.fill();
  context.stroke();
  context.restore();
}

function updateOrbitConcept(speed) {
  const trajectory = drawOrbit($('#orbit-demo-canvas'), speed, 1);
  const messages = {
    CRASH: 'TOO SLOW: the spacecraft enters the atmosphere.',
    ORBIT: 'ORBIT: the spacecraft continues around Earth without entering the atmosphere.',
    'HIGH ORBIT': 'FASTER: the spacecraft remains in orbit on a larger ellipse.',
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

// Ten 0.05× bins from 0.96× to 1.45×, the full range a phone can send.
const BURN_BIN_COUNT = 10;
const BURN_BIN_WIDTH = 5;

function burnBin(value) {
  return Math.max(0, Math.min(BURN_BIN_COUNT - 1, Math.floor((value - 96) / BURN_BIN_WIDTH)));
}

function renderBurnHistogram() {
  const host = $('#hist-bins');
  if (!host) return;
  while (host.children.length < BURN_BIN_COUNT) {
    const column = document.createElement('i');
    column.appendChild(document.createElement('b'));
    host.appendChild(column);
  }
  const counts = new Array(BURN_BIN_COUNT).fill(0);
  state.burns.forEach(item => { counts[burnBin(item.value)] += 1; });
  const peak = Math.max(1, ...counts);
  const medianColumn = state.burns.length ? burnBin(medianBurn() * 100) : -1;
  [...host.children].forEach((column, index) => {
    column.style.setProperty('--h', `${counts[index] / peak * 100}%`);
    column.classList.toggle('empty', counts[index] === 0);
    column.classList.toggle('median', index === medianColumn);
    // Only the bins that hold a choice are labelled; a zero on every empty bin reads as noise.
    column.querySelector('b').textContent = counts[index] || '';
  });
}

function renderOrbitState() {
  const speed = medianBurn();
  const shownSpeed = activeOrbitSpeed ?? speed;
  $('#median-burn').textContent = state.burns.length ? `${shownSpeed.toFixed(2)}×` : '—';
  $('#burn-count').textContent = state.burns.length;
  renderBurnHistogram();
  $('#telemetry-vel').textContent = state.burns.length ? `${(7.67 * shownSpeed).toFixed(2)} km/s` : '—';
  if (!orbitAnimating) {
    const sameAsLastRun = lastOrbitOutcome && Math.abs((lastOrbitSpeed ?? -1) - speed) < .0001;
    drawOrbit($('#mission-orbit-canvas'), speed, sameAsLastRun ? 1 : .01);
    if (lastOrbitOutcome && !sameAsLastRun) {
      lastOrbitOutcome = null;
      lastOrbitSpeed = null;
      $('#flight-result').textContent = 'THE SPEED CHANGED — SIMULATE IT AGAIN';
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
  $('#flight-result').textContent = `SIMULATING THE MEDIAN AUDIENCE SPEED: ${speed.toFixed(2)}×…`;
  $('#telemetry-status').textContent = 'ENGINE ON';
  renderControlStates();
  function frame(now) {
    if (runToken !== orbitRunToken) return;
    const progress = Math.min(1, (now - start) / duration);
    drawOrbit($('#mission-orbit-canvas'), speed, progress);
    $('#telemetry-status').textContent = progress < .15 ? 'ENGINE ON' : 'ENGINE OFF';
    if (progress < 1) requestAnimationFrame(frame);
    else {
      orbitAnimating = false;
      activeOrbitSpeed = null;
      lastOrbitOutcome = trajectory.outcome;
      lastOrbitSpeed = speed;
      const messages = {
        CRASH: `AT ${speed.toFixed(2)}×: TOO SLOW — THE SPACECRAFT ENTERS THE ATMOSPHERE`,
        ESCAPE: `AT ${speed.toFixed(2)}×: THE SPACECRAFT ESCAPES EARTH`,
        'HIGH ORBIT': `AT ${speed.toFixed(2)}×: THE SPACECRAFT ENTERS A LARGE ELLIPTICAL ORBIT`,
        ORBIT: `AT ${speed.toFixed(2)}×: THE SPACECRAFT ENTERS A NEAR-CIRCULAR ORBIT`
      };
      $('#flight-result').textContent = messages[trajectory.outcome];
      $('#telemetry-status').textContent = trajectory.outcome === 'CRASH' ? 'ENTERED ATMOSPHERE' : trajectory.outcome;
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
    pendingHiddenUnits = validArchitecture(currentModel.hidden);
    retrainSummary = 'Adding four samples that a second test verified as changed…';
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
  manualArchitecture = null;
  pendingHiddenUnits = null;
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
  $('#flight-result').textContent = 'WAITING FOR SPEEDS';
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

// Scene 4 asks whether a microscope can read a sequence, so what it shows has to look like a real
// specimen rather than a diagram: a double helix turning under the lens. Depth comes from shading
// each base pair by how far round the turn it sits, so one strand passes in front of the other.
function setupHelixAnimation() {
  const canvas = $('#helix-canvas');
  if (!canvas) return;
  const context = canvas.getContext('2d');
  const scene = document.querySelector('.scene[data-scene="4"]');
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const width = canvas.width;
  const height = canvas.height;
  const centre = width / 2;
  const amplitude = width * .27;
  const turns = Math.PI * 4.4;
  const strandPath = (phase, flip) => {
    context.beginPath();
    for (let step = 0; step <= 120; step += 1) {
      const t = step / 120;
      const y = height * (-.08 + 1.16 * t);
      const x = centre + Math.sin(t * turns + phase) * amplitude * flip;
      if (!step) context.moveTo(x, y); else context.lineTo(x, y);
    }
    context.stroke();
  };

  function draw(time) {
    requestAnimationFrame(draw);
    // Nothing to show while another scene is up, and no reason to spend frames on it.
    if (!scene.classList.contains('active')) return;
    const phase = still ? .6 : time * .0013;
    context.clearRect(0, 0, width, height);
    context.save();
    context.beginPath();
    context.arc(centre, height / 2, width / 2 - 2, 0, Math.PI * 2);
    context.clip();
    const glow = context.createRadialGradient(centre, height * .38, 10, centre, height / 2, width * .55);
    glow.addColorStop(0, '#1b2b26');
    glow.addColorStop(1, '#07100e');
    context.fillStyle = glow;
    context.fillRect(0, 0, width, height);

    // Base pairs first: they sit between the two strands.
    const rungs = 30;
    for (let index = 0; index <= rungs; index += 1) {
      const t = index / rungs;
      const y = height * (-.08 + 1.16 * t);
      const angle = t * turns + phase;
      const offset = Math.sin(angle) * amplitude;
      const depth = (Math.cos(angle) + 1) / 2;
      context.strokeStyle = `rgba(241,250,247,${.07 + .17 * Math.abs(Math.sin(angle))})`;
      context.lineWidth = 1.6;
      context.beginPath();
      context.moveTo(centre + offset, y);
      context.lineTo(centre - offset, y);
      context.stroke();
      [[centre + offset, '#ff8cba', depth], [centre - offset, '#70f2c5', 1 - depth]].forEach(([x, colour, near]) => {
        context.beginPath();
        context.arc(x, y, 2.1 + near * 2.2, 0, Math.PI * 2);
        context.fillStyle = colour;
        context.globalAlpha = .45 + near * .55;
        context.fill();
        context.globalAlpha = 1;
      });
    }

    context.lineWidth = 3.2;
    context.shadowBlur = 12;
    context.strokeStyle = '#ff8cba'; context.shadowColor = '#ff8cba';
    strandPath(phase, 1);
    context.strokeStyle = '#70f2c5'; context.shadowColor = '#70f2c5';
    strandPath(phase, -1);
    context.shadowBlur = 0;
    context.restore();
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
