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
let lastChallengeKey = '';
let lastModelVersion = null;
let lastRevealSignature = '';
let currentMode = '';

document.querySelector('#callsign').textContent = callsign;

socket.on('connect', () => {
  document.querySelector('#connection-label').textContent = 'LIVE';
  document.querySelector('.phone-status').classList.remove('offline');
  if (state) renderPhone();
});
socket.on('disconnect', () => {
  document.querySelector('#connection-label').textContent = 'RECONNECTING';
  document.querySelector('.phone-status').classList.add('offline');
});

socket.on('state', next => {
  const runChanged = localRunId !== null && localRunId !== next.runId;
  if (runChanged) resetLocal();
  if (localRunId !== next.runId) {
    localRunId = next.runId;
    restoreLocal();
  }
  state = next;
  const sceneChanged = next.scene !== lastScene;
  const modelVersion = next.model?.trainedAt || null;
  const modelChanged = modelVersion !== lastModelVersion;
  const revealSignature = JSON.stringify(next.reveals || {});
  const revealChanged = revealSignature !== lastRevealSignature;
  lastModelVersion = modelVersion;
  lastRevealSignature = revealSignature;
  lastScene = next.scene;
  updatePhoneChrome(next.scene);
  if (sceneChanged || runChanged || revealChanged || (next.scene === 13 && modelChanged)) renderPhone();
  else updateLiveElements();
});

socket.on('photon', () => {
  // The sender gets local feedback in the tap handler. Other phones update the shared meter silently.
});

function getCallsign() {
  let value = localStorage.getItem('signal2045-callsign');
  if (!value) {
    value = `HELIX-${String(Math.floor(Math.random() * 900000) + 100000)}`;
    localStorage.setItem('signal2045-callsign', value);
  }
  return value;
}

function makeAssignedSample(seed) {
  const working = seed % 3 !== 0;
  const offsetA = seed % 17;
  const offsetB = (seed * 7) % 19;
  if (working) return { water: 67 + offsetA, carbon: 61 + offsetB, hiddenTruth: 1 };
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
  lastChallengeKey = '';
  currentMode = '';
}

function restoreLocal() {
  submittedSample = localStorage.getItem(`signal2045-sample-${localRunId}`) === 'sent';
  try {
    votes = new Set(JSON.parse(localStorage.getItem(`signal2045-votes-${localRunId}`) || '[]'));
  } catch {
    votes = new Set();
  }
  pcrTaps = Number(localStorage.getItem(`signal2045-pcr-${localRunId}`)) || 0;
  photons = Number(localStorage.getItem(`signal2045-photons-${localRunId}`)) || 0;
}

function saveVotes() {
  localStorage.setItem(`signal2045-votes-${localRunId}`, JSON.stringify([...votes]));
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
  if (scene === 0) return waiting('You’re ready', 'Keep this page open. Each new activity will appear here.');
  if (scene === 1) return waiting('Something stopped glowing', 'The DNA test found the added gene, but the yeast’s green glow has gone dark. Look at the main screen.');
  if (scene === 2) return waiting('Three clues, one mission', 'First we check the DNA. Then we measure the glow and train the AI. Finally, we correct the spacecraft’s path.');
  if (scene === 3) return infoCard('THE GENE CIRCUIT', 'Instructions + a green status light', 'One added gene makes a test protein. Another makes green light when the instructions are working.');
  if (scene === 4) return renderVote('microscope', 'Can a microscope read DNA letters?', 'Vote before we show the answer.', [
    ['yes', 'YES', 'Zoom far enough'], ['no', 'NO', 'Use another method']
  ]);
  if (scene === 5) return state.reveals?.pcrComplete || state.pcrTaps >= 120
    ? metricScreen('1.07 BILLION', 'ideal copies after 30 PCR cycles', 'The class animation is complete. Real PCR does this with temperature changes and enzymes, not phone taps.')
    : renderPCRControl();
  if (scene === 6) return renderVote('primer', 'Complete this DNA pair', 'This is a short matching puzzle: A pairs with T, and C pairs with G.', [
    ['gacac', 'GACAC', 'Option A'], ['ctgtg', 'CTGTG', 'Option B'], ['gtgtg', 'GTGTG', 'Option C'], ['random', 'AACCT', 'Option D']
  ], 'two');
  if (scene === 7) return metricScreen('1.07 BILLION', 'ideal copies after 30 PCR cycles', 'PCR found the DNA section we chose. It did not prove that the whole circuit still works.');
  if (scene === 8) return renderNanoQuiz();
  if (scene === 9) {
    if (state.reveals?.chip) return infoCard('PATTERN COMPLETE', 'The later factory steps are shown', 'UV changed the coating. Developing and etching then turned that pattern into chip structures.');
    if (state.photonCount >= 48) return infoCard('UV EXPOSURE COMPLETE', 'The light step is full', 'Look up. The presenter will now show the later developing and etching steps.');
    return renderPhotonControl();
  }
  if (scene === 10) return infoCard('FROM GLOW TO A NUMBER', 'Glow → sensor → electrical number', 'The finished sensor measures the yeast’s green glow. The AI compares that number with the DNA reading.');
  if (scene === 11) {
    if (!submittedSample) return renderSampleCard();
    return renderVote('architecture', 'Choose the model size', 'A hidden neuron is one small pattern-finding unit. More units can learn a bendier dividing line.', [
      ['two', '2', 'simpler'], ['four', '4', 'middle'], ['eight', '8', 'more flexible']
    ], 'three');
  }
  if (scene === 12) return renderTrainingMonitor();
  if (scene === 13) return renderChallenge();
  if (scene === 14) return renderVote('trust', 'The AI gives a strong answer. Is that enough?', 'A high model score is still not proof.', [
    ['deploy', 'ACT ON IT', 'use this result'], ['verify', 'MORE TESTS', 'check another way']
  ]);
  if (scene === 15) return renderGravityQuiz();
  if (scene === 16) return renderBurnControl();
  if (scene === 17) return renderVote('return', 'Where should HELIX–7 go?', 'There is no perfect answer. Choose the risk you think is most reasonable.', [
    ['earth', 'EARTH', 'best lab tools'], ['orbit', 'ORBIT', 'keep it contained'], ['remote', 'REMOTE', 'test from far away']
  ], 'three');
  return renderFinale();
}

function renderSampleCard() {
  currentMode = 'sample';
  root.innerHTML = `
    <div class="phone-kicker">YOUR PRACTICE SAMPLE / ${callsign}</div>
    <h2>Label one sample<br>for the <mark>AI.</mark></h2>
    <p class="subhead">For this first batch, use the lab’s answer key: both readings at 60 or higher means WORKING. If either is below 60, choose CHANGED.</p>
    <div class="phone-card">
      <div class="sample-mini-plot"><i style="--x:${assignedSample.water}%;--y:${assignedSample.carbon}%"></i></div>
      <div class="phone-slider"><label>SIMULATED DNA MATCH <b>${assignedSample.water}/100</b></label><div class="phone-progress"><i style="--progress:${assignedSample.water}%"></i></div></div>
      <div class="phone-slider"><label>GREEN GLOW <b>${assignedSample.carbon}/100</b></label><div class="phone-progress"><i style="--progress:${assignedSample.carbon}%"></i></div></div>
      <div class="phone-choice two" role="radiogroup" aria-label="Choose the checked sample label"><button type="button" role="radio" aria-checked="false" data-sample="changed">CIRCUIT CHANGED</button><button type="button" role="radio" aria-checked="false" data-sample="working">CIRCUIT WORKING</button></div>
      <p class="subhead" id="sample-help" role="status" aria-live="polite" style="margin:12px 0 0"></p>
      <button class="phone-action" type="button" id="submit-sample" disabled>Send this label</button>
    </div>`;
  root.querySelectorAll('[data-sample]').forEach(button => button.addEventListener('click', () => {
    sampleChoice = button.dataset.sample;
    root.querySelectorAll('[data-sample]').forEach(item => {
      item.classList.toggle('selected', item === button);
      item.setAttribute('aria-checked', String(item === button));
    });
    document.querySelector('#sample-help').textContent = '';
    document.querySelector('#submit-sample').disabled = false;
  }));
  document.querySelector('#submit-sample').addEventListener('click', () => {
    if (!sampleChoice) return;
    if (!socket.connected) return waiting('Reconnecting…', 'Keep this page open, then try again when LIVE appears at the top.');
    const correctChoice = assignedSample.hiddenTruth ? 'working' : 'changed';
    if (sampleChoice !== correctChoice) {
      document.querySelector('#sample-help').textContent = 'Check the rule again: both readings must be 60 or higher for WORKING.';
      vibrate(30);
      return;
    }
    socket.emit('sample', { water: assignedSample.water, carbon: assignedSample.carbon, label: sampleChoice });
    submittedSample = true;
    localStorage.setItem(`signal2045-sample-${localRunId}`, 'sent');
    vibrate([20, 30, 20]);
    waiting('Label sent', 'Your dot is now on the graph. The AI will practise using the answer-key label you sent.');
    if (state.scene !== 0) window.setTimeout(renderPhone, 900);
  });
}

function renderVote(poll, title, copy, options, columns = 'two') {
  currentMode = `vote-${poll}`;
  if (state.reveals?.[poll]) {
    const answers = {
      microscope: ['Answer: no', 'A microscope can show DNA material, but other tests are needed to read A, T, C and G.'],
      primer: ['Match: GACAC', 'A pairs with T, and C pairs with G. Real PCR uses two much longer primers.'],
      trust: ['AI is one clue', 'Scientists repeat the test and check it with another method before acting.']
    };
    if (answers[poll]) return waiting(answers[poll][0], answers[poll][1]);
  }
  if (votes.has(poll)) return waiting('Vote sent', 'Look up to see how the room voted.');
  root.innerHTML = `
    <div class="phone-kicker">YOUR VOTE</div><h2>${title}</h2><p class="subhead">${copy}</p>
    <div class="phone-card"><div class="phone-choice ${columns}">${options.map(([value, label, detail]) => `<button type="button" data-vote="${value}"><b>${label}</b><small>${detail}</small></button>`).join('')}</div></div>`;
  root.querySelectorAll('[data-vote]').forEach(button => button.addEventListener('click', () => {
    if (!socket.connected) return waiting('Reconnecting…', 'Keep this page open. Your vote has not been sent yet.');
    votes.add(poll);
    saveVotes();
    socket.emit('vote', { poll, choice: button.dataset.vote });
    vibrate(18);
    waiting('Vote sent', 'Your answer is now part of the live result on the main screen.');
  }));
}

function renderPCRControl() {
  currentMode = 'pcr';
  root.innerHTML = `
    <div class="phone-kicker">PCR DEMO</div><h2>Tap to run<br><mark>more cycles.</mark></h2>
    <p class="subhead">These taps control the animation. Every 4 class taps advance it by one cycle. Real PCR uses temperature changes and an enzyme.</p>
    <button class="tap-orb" type="button" id="pcr-tap">ADD A CLASS TAP</button>
    <div class="phone-metric"><strong id="my-pcr-taps">${pcrTaps}</strong><span>YOUR DEMO TAPS · MAX 24</span></div>
    <p class="subhead" style="text-align:center;margin-top:18px" id="crowd-pcr">${state.pcrTaps} audience taps</p>`;
  document.querySelector('#pcr-tap').addEventListener('click', () => {
    if (!socket.connected) return waiting('Reconnecting…', 'Your tap was not sent. Try again when LIVE appears at the top.');
    if (pcrTaps >= 24 || state.pcrTaps >= 120) return;
    pcrTaps += 1;
    localStorage.setItem(`signal2045-pcr-${localRunId}`, pcrTaps);
    socket.emit('pcr-tap');
    document.querySelector('#my-pcr-taps').textContent = pcrTaps;
    if (pcrTaps >= 24) {
      document.querySelector('#pcr-tap').textContent = 'MAX TAPS REACHED';
      document.querySelector('#pcr-tap').disabled = true;
    }
    vibrate(8);
  });
  if (pcrTaps >= 24) {
    document.querySelector('#pcr-tap').textContent = 'MAX TAPS REACHED';
    document.querySelector('#pcr-tap').disabled = true;
  }
}

function renderNanoQuiz() {
  currentMode = 'nano-quiz';
  root.innerHTML = `
    <div class="phone-kicker">SCALE CHECK</div><h2>How small is<br><mark>one nanometre?</mark></h2>
    <p class="subhead">A fingernail grows roughly…</p>
    <div class="phone-card"><div class="phone-choice"><button type="button" data-nano="wrong-metre">1 metre each year</button><button type="button" data-nano="right">1 nanometre each second</button><button type="button" data-nano="wrong-fast">1 centimetre each second</button></div><div id="nano-answer" role="status" aria-live="polite"></div></div>`;
  root.querySelectorAll('[data-nano]').forEach(button => button.addEventListener('click', () => {
    root.querySelectorAll('[data-nano]').forEach(item => item.classList.toggle('selected', item === button));
    const correct = button.dataset.nano === 'right';
    document.querySelector('#nano-answer').innerHTML = correct
      ? '<p class="subhead" style="color:var(--accent);margin:14px 0 0">Exactly. That is roughly one nanometre per second.</p>'
      : '<p class="subhead" style="color:#ff7868;margin:14px 0 0">Try again—think one billionth of a metre.</p>';
    if (correct) {
      votes.add('nano');
      saveVotes();
      lockQuiz('[data-nano]', button);
    }
  }));
  if (votes.has('nano')) {
    const correct = root.querySelector('[data-nano="right"]');
    correct.classList.add('selected');
    lockQuiz('[data-nano]', correct);
    document.querySelector('#nano-answer').innerHTML = '<p class="subhead" style="color:var(--accent);margin:14px 0 0">Exactly. That is roughly one nanometre per second.</p>';
  }
}

function renderPhotonControl() {
  currentMode = 'photons';
  root.innerHTML = `
    <div class="phone-kicker">BUILD WITH LIGHT</div><h2>Add UV light<br>to the <mark>pattern.</mark></h2>
    <p class="subhead">Each tap adds pretend UV light to the class animation. Watch the shared exposure fill on the main screen.</p>
    <button class="tap-orb" type="button" id="photon-tap">ADD UV LIGHT</button>
    <div class="phone-metric"><strong id="my-photons">${photons}</strong><span>YOUR LIGHT TAPS · MAX 24</span></div>
    <p class="phone-progress-label">CLASS LIGHT <b id="class-light-count">${Math.min(state.photonCount, 48)} / 48</b></p>
    <div class="phone-progress" role="progressbar" aria-label="Class UV exposure" aria-valuemin="0" aria-valuemax="48" aria-valuenow="${Math.min(state.photonCount, 48)}"><i id="crowd-exposure" style="--progress:${exposurePercent()}%"></i></div>`;
  document.querySelector('#photon-tap').addEventListener('click', event => {
    if (!socket.connected) return waiting('Reconnecting…', 'Your light tap was not sent. Try again when LIVE appears at the top.');
    if (photons >= 24 || state.photonCount >= 48 || state.reveals?.chip) return;
    photons += 1;
    localStorage.setItem(`signal2045-photons-${localRunId}`, photons);
    socket.emit('photon', { x: event.clientX / window.innerWidth * 100 });
    document.querySelector('#my-photons').textContent = photons;
    if (photons >= 24) {
      document.querySelector('#photon-tap').textContent = 'MAX TAPS REACHED';
      document.querySelector('#photon-tap').disabled = true;
    }
    vibrate(7);
  });
  if (photons >= 24) {
    document.querySelector('#photon-tap').textContent = 'MAX TAPS REACHED';
    document.querySelector('#photon-tap').disabled = true;
  }
}

function exposurePercent() {
  return Math.min(100, state.photonCount / 48 * 100);
}

function renderTrainingMonitor() {
  currentMode = 'training';
  const training = state.training;
  const epoch = training.epoch || 0;
  root.innerHTML = `
    <div class="phone-kicker">AI TRAINING</div><h2 id="phone-training-title">${training.active ? 'The AI is practising.' : state.model ? 'Training complete.' : 'Ready to train.'}</h2>
    <div class="waiting-orb"></div>
    <div class="phone-card"><div class="phone-metric"><strong id="phone-epoch">${String(epoch).padStart(3,'0')}</strong><span>PRACTICE ROUND / 500</span></div><div class="phone-progress" role="progressbar" aria-label="AI training progress" aria-valuemin="0" aria-valuemax="500" aria-valuenow="${epoch}"><i id="phone-train-progress" style="--progress:${epoch/5}%"></i></div><dl class="phone-readouts three"><div><dt>ERROR<small>lower is better</small></dt><dd id="phone-loss">${numberOrDash(training.loss,4)}</dd></div><div><dt>PRACTICE ACCURACY<small>seen dots</small></dt><dd id="phone-accuracy">${training.accuracy == null ? '—' : Math.round(training.accuracy*100)+'%'}</dd></div><div><dt>NEW-SAMPLE ACCURACY<small>unseen dots</small></dt><dd id="phone-test-accuracy">${training.testAccuracy == null ? '—' : Math.round(training.testAccuracy*100)+'%'}</dd></div></dl></div>
    <p class="subhead" style="margin-top:18px">Look up. The coloured map moves as the AI checks its guesses and adjusts.</p>`;
}

function renderChallenge() {
  currentMode = 'challenge';
  if (!state.model) return waiting('The AI is still training', 'This activity will appear as soon as training finishes.');
  root.innerHTML = `
    <div class="phone-kicker">TEST THE AI / NEW SAMPLE</div><h2>Build a<br><mark>new sample.</mark></h2>
    <p class="subhead">Move the two readings. The AI will compare your dot with the examples it learned from.</p>
    <div class="phone-card">
      ${sliderMarkup('challenge-water','PCR target match',challenge.water)}
      ${sliderMarkup('challenge-carbon','Reporter light',challenge.carbon)}
      <div class="sample-mini-plot"><i id="challenge-dot" style="--x:${challenge.water}%;--y:${challenge.carbon}%"></i></div>
      <button class="phone-action" type="button" id="predict-button">Ask the AI</button>
      <div id="phone-prediction" role="status" aria-live="polite"></div>
    </div>`;
  ['water','carbon'].forEach(key => {
    document.querySelector(`#challenge-${key}`).addEventListener('input', event => {
      challenge[key] = Number(event.target.value);
      event.target.previousElementSibling.querySelector('b').textContent = challenge[key];
      const dot = document.querySelector('#challenge-dot');
      dot.style.setProperty('--x', `${challenge.water}%`);
      dot.style.setProperty('--y', `${challenge.carbon}%`);
      const button = document.querySelector('#predict-button');
      button.disabled = false;
      button.textContent = lastChallengeKey ? 'Ask about the changed point' : 'Ask the AI';
    });
  });
  document.querySelector('#predict-button').addEventListener('click', () => {
    if (!socket.connected) return waiting('Reconnecting…', 'Your sample has not been sent. Try again when LIVE appears at the top.');
    const output = forwardModel(state.model, [challenge.water / 100, challenge.carbon / 100]);
    socket.emit('challenge', { ...challenge, prediction: output });
    document.querySelector('#phone-prediction').innerHTML = `<div class="prediction-phone"><strong>${output >= .5 ? 'LOOKS WORKING' : 'LOOKS CHANGED'}</strong><span>${Math.round(output * 100)}</span><p class="subhead">AI score out of 100. It is a pattern score, not proof.</p></div>`;
    lastChallengeKey = `${state.model.trainedAt}:${challenge.water}:${challenge.carbon}`;
    document.querySelector('#predict-button').disabled = true;
    document.querySelector('#predict-button').textContent = 'Result shown — move a slider';
    vibrate([20,25,20]);
  });
}

function renderGravityQuiz() {
  currentMode = 'gravity';
  root.innerHTML = `
    <div class="phone-kicker">GUESS BEFORE THE DEMO</div><h2>At 400 km above Earth, gravity is…</h2>
    <div class="phone-card"><div class="phone-choice"><button type="button" data-gravity="wrong">Almost zero</button><button type="button" data-gravity="right">About 90% of surface gravity</button></div><div id="gravity-answer" role="status" aria-live="polite"></div></div>`;
  root.querySelectorAll('[data-gravity]').forEach(button => button.addEventListener('click', () => {
    root.querySelectorAll('[data-gravity]').forEach(item => item.classList.toggle('selected', item === button));
    document.querySelector('#gravity-answer').innerHTML = button.dataset.gravity === 'right'
      ? '<p class="subhead" style="color:var(--accent);margin:14px 0 0">Correct. Astronauts float because they and the spacecraft fall together.</p>'
      : '<p class="subhead" style="color:#ff7868;margin:14px 0 0">Gravity is still strong there. Try the other answer.</p>';
    if (button.dataset.gravity === 'right') {
      votes.add('gravity');
      saveVotes();
      lockQuiz('[data-gravity]', button);
    }
  }));
  if (votes.has('gravity')) {
    const correct = root.querySelector('[data-gravity="right"]');
    correct.classList.add('selected');
    lockQuiz('[data-gravity]', correct);
    document.querySelector('#gravity-answer').innerHTML = '<p class="subhead" style="color:var(--accent);margin:14px 0 0">Correct. Astronauts float because they and the spacecraft fall together.</p>';
  }
}

function renderBurnControl() {
  currentMode = 'burn';
  const stored = Number(localStorage.getItem(`signal2045-burn-${localRunId}`)) || 100;
  const saved = Math.max(96, Math.min(145, stored));
  const alreadySent = localStorage.getItem(`signal2045-burn-sent-${localRunId}`) === 'yes';
  let sent = alreadySent;
  root.innerHTML = `
    <div class="phone-kicker">CHOOSE THE SIDEWAYS SPEED</div><h2>Correct the<br><mark>orbit.</mark></h2>
    <p class="subhead">Move the slider. The middle choice from the whole room will control the class simulation.</p>
    <div class="phone-card">
      <div class="phone-metric"><strong id="burn-value">${(saved/100).toFixed(2)}×</strong><span>× THE SPEED NEEDED FOR A CIRCLE</span></div>
      <div class="phone-slider"><label for="burn-slider">TOO SLOW <b>ORBIT</b> ESCAPE</label><input id="burn-slider" type="range" min="96" max="145" value="${saved}" aria-valuetext="${burnLabel(saved)}"></div>
      <div id="burn-prediction" class="prediction-phone"><strong>${burnLabel(saved)}</strong></div>
      <p class="phone-send-status" id="burn-send-status" role="status" aria-live="polite">${alreadySent ? 'This speed has been sent.' : 'Move the slider, then send your speed.'}</p>
      <button class="phone-action" type="button" id="lock-burn" ${alreadySent ? 'disabled' : ''}>${alreadySent ? 'Speed sent' : 'Send this speed'}</button>
    </div>`;
  document.querySelector('#burn-slider').addEventListener('input', event => {
    const value = Number(event.target.value);
    document.querySelector('#burn-value').textContent = `${(value/100).toFixed(2)}×`;
    document.querySelector('#burn-prediction strong').textContent = burnLabel(value);
    event.target.setAttribute('aria-valuetext', burnLabel(value));
    document.querySelector('#lock-burn').disabled = false;
    document.querySelector('#lock-burn').textContent = sent ? 'Send updated speed' : 'Send this speed';
    document.querySelector('#burn-send-status').textContent = sent ? 'New value not sent yet.' : 'Ready to send.';
  });
  document.querySelector('#lock-burn').addEventListener('click', () => {
    if (!socket.connected) return waiting('Reconnecting…', 'Your speed has not been sent. Try again when LIVE appears at the top.');
    const value = Number(document.querySelector('#burn-slider').value);
    localStorage.setItem(`signal2045-burn-${localRunId}`, value);
    localStorage.setItem(`signal2045-burn-sent-${localRunId}`, 'yes');
    sent = true;
    socket.emit('burn', { value });
    document.querySelector('#lock-burn').textContent = 'Speed sent';
    document.querySelector('#lock-burn').disabled = true;
    document.querySelector('#burn-send-status').textContent = 'Speed sent. Move the slider if you want to change it.';
    vibrate([25,35,25]);
  });
}

function renderFinale() {
  currentMode = 'finale';
  const primer = votes.has('primer') ? 'submitted' : 'not submitted';
  const flight = localStorage.getItem(`signal2045-burn-${localRunId}`) ? 'locked' : 'observed';
  root.innerHTML = `
    <div class="phone-kicker">MISSION COMPLETE / ${callsign}</div><h1>You helped complete<br><mark>the mission.</mark></h1>
    <div class="phone-card"><dl class="phone-readouts two"><div><dt>SAMPLE LABEL</dt><dd>${submittedSample ? 'SENT' : 'NOT SENT'}</dd></div><div><dt>DNA VOTE</dt><dd>${primer.toUpperCase()}</dd></div><div><dt>UV TAPS</dt><dd>${photons}</dd></div><div><dt>FLIGHT SPEED</dt><dd>${flight === 'locked' ? 'SENT' : 'NOT SENT'}</dd></div></dl></div>
    <p class="subhead" style="text-align:center;margin-top:24px">Genetics, nanotech, AI and spaceflight worked together.</p>`;
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
  return `<div class="phone-slider"><label for="${id}">${label.toUpperCase()} <b>${value}</b></label><input id="${id}" type="range" min="0" max="100" value="${value}"></div>`;
}

function lockQuiz(selector, correctButton) {
  root.querySelectorAll(selector).forEach(button => {
    button.disabled = true;
    button.classList.toggle('selected', button === correctButton);
  });
}

function numberOrDash(value, places) { return Number.isFinite(value) ? value.toFixed(places) : '—'; }

function forwardModel(model, input) {
  let activation = input;
  for (const layer of model.layers) activation = layer.w.map((weights, index) => 1 / (1 + Math.exp(-weights.reduce((sum, weight, i) => sum + weight * activation[i], layer.b[index]))));
  return activation[0];
}

function burnLabel(value) {
  if (value < 99) return 'TOO SLOW — RE-ENTRY';
  if (value >= 142) return 'FAST ENOUGH TO ESCAPE';
  if (value >= 99 && value <= 102) return 'NEAR-CIRCULAR ORBIT';
  return 'LARGER ELLIPTICAL ORBIT';
}

function updateLiveElements() {
  if (!state) return;
  if (state.scene === 5 && currentMode === 'pcr' && (state.reveals?.pcrComplete || state.pcrTaps >= 120)) {
    renderPhone();
    return;
  }
  if (state.scene === 5 && document.querySelector('#crowd-pcr')) {
    document.querySelector('#crowd-pcr').textContent = `${state.pcrTaps} audience taps`;
  }
  if (state.scene === 9 && currentMode === 'photons' && (state.reveals?.chip || state.photonCount >= 48)) {
    renderPhone();
    return;
  }
  if (state.scene === 9 && document.querySelector('#crowd-exposure')) {
    const total = Math.min(state.photonCount, 48);
    const bar = document.querySelector('#crowd-exposure');
    bar.style.setProperty('--progress', `${exposurePercent()}%`);
    bar.parentElement?.setAttribute('aria-valuenow', String(total));
    if (document.querySelector('#class-light-count')) document.querySelector('#class-light-count').textContent = `${total} / 48`;
  }
  if (state.scene === 12 && currentMode === 'training') {
    const training = state.training;
    if (document.querySelector('#phone-training-title')) document.querySelector('#phone-training-title').textContent = training.active ? 'The AI is practising.' : state.model ? 'Training complete.' : 'Ready to train.';
    if (document.querySelector('#phone-epoch')) document.querySelector('#phone-epoch').textContent = String(training.epoch || 0).padStart(3,'0');
    if (document.querySelector('#phone-train-progress')) {
      const progress = Math.min(100, (training.epoch || 0) / 5);
      const bar = document.querySelector('#phone-train-progress');
      bar.style.setProperty('--progress', `${progress}%`);
      bar.parentElement?.setAttribute('aria-valuenow', String(training.epoch || 0));
    }
    if (document.querySelector('#phone-loss')) document.querySelector('#phone-loss').textContent = numberOrDash(training.loss,4);
    if (document.querySelector('#phone-accuracy')) document.querySelector('#phone-accuracy').textContent = training.accuracy == null ? '—' : `${Math.round(training.accuracy*100)}%`;
    if (document.querySelector('#phone-test-accuracy')) document.querySelector('#phone-test-accuracy').textContent = training.testAccuracy == null ? '—' : `${Math.round(training.testAccuracy*100)}%`;
  }
}

function vibrate(pattern) { if (navigator.vibrate) navigator.vibrate(pattern); }

waiting('Connecting to mission control', 'Keep this tab open. Your station is joining the live network.');
