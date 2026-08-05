const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const APP_PORT = 4198;
const HOST_TOKEN = 'browser-show-presenter';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

class CdpPage {
  constructor(webSocketUrl, name) {
    this.name = name;
    this.socket = new WebSocket(webSocketUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.javascriptErrors = [];
    this.socket.addEventListener('message', event => {
      const message = JSON.parse(String(event.data));
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject, method, detail } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(`${method}: ${message.error.message}${detail ? `\n${detail}` : ''}`));
        else resolve(message.result);
        return;
      }
      if (message.method === 'Runtime.exceptionThrown') {
        const detail = message.params.exceptionDetails;
        this.javascriptErrors.push(detail.exception?.description || detail.text || 'Unknown runtime exception');
      }
      if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
        const copy = message.params.args.map(item => item.value ?? item.description ?? '').join(' ');
        this.javascriptErrors.push(`console.error: ${copy}`);
      }
    });
  }

  async open() {
    if (this.socket.readyState !== WebSocket.OPEN) {
      await new Promise((resolve, reject) => {
        this.socket.addEventListener('open', resolve, { once: true });
        this.socket.addEventListener('error', reject, { once: true });
      });
    }
    await this.call('Page.enable');
    await this.call('Runtime.enable');
  }

  call(method, params = {}) {
    const id = this.nextId++;
    const detail = method === 'Runtime.evaluate' ? String(params.expression || '').slice(0, 500) : '';
    const promise = new Promise((resolve, reject) => this.pending.set(id, { resolve, reject, method, detail }));
    this.socket.send(JSON.stringify({ id, method, params }));
    return promise;
  }

  async evaluate(expression) {
    const response = await this.call('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true
    });
    if (response.exceptionDetails) {
      const detail = response.exceptionDetails.exception?.description || response.exceptionDetails.text;
      throw new Error(`Browser evaluation failed on ${this.name}: ${detail}\n${expression}`);
    }
    return response.result.value;
  }

  async viewport(width, height, mobile = false) {
    await this.call('Emulation.setDeviceMetricsOverride', {
      width, height, deviceScaleFactor: 1, mobile
    });
  }

  async screenshot(filePath) {
    const shot = await this.call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.writeFileSync(filePath, Buffer.from(shot.data, 'base64'));
  }

  close() {
    this.socket.close();
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitFor(check, message, timeout = 8000) {
  const started = Date.now();
  let last;
  while (Date.now() - started < timeout) {
    try {
      last = await check();
      if (last) return last;
    } catch (error) {
      last = error.message;
    }
    await delay(50);
  }
  throw new Error(`${message}. Last value: ${String(last)}`);
}

async function waitForServer(processUnderTest) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Show server did not start')), 5000);
    processUnderTest.stdout.on('data', chunk => {
      if (!String(chunk).includes('SIGNAL / 2045 stage')) return;
      clearTimeout(timer);
      resolve();
    });
    processUnderTest.once('error', reject);
    processUnderTest.once('exit', code => reject(new Error(`Show server exited early (${code})`)));
  });
}

async function waitForChrome(profileDir, chromeProcess) {
  const activePort = path.join(profileDir, 'DevToolsActivePort');
  await waitFor(() => fs.existsSync(activePort), 'Chrome did not publish a debugging port', 8000);
  const [port] = fs.readFileSync(activePort, 'utf8').split(/\r?\n/);
  if (!port) throw new Error('Chrome debugging port was empty');
  if (chromeProcess.exitCode !== null) throw new Error(`Chrome exited early (${chromeProcess.exitCode})`);
  return Number(port);
}

async function createPage(debugPort, url, width, height, mobile, name) {
  const target = await fetch(`http://127.0.0.1:${debugPort}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' }).then(response => response.json());
  const page = new CdpPage(target.webSocketDebuggerUrl, name);
  await page.open();
  await page.viewport(width, height, mobile);
  await waitFor(() => page.evaluate('document.readyState === "complete"'), `Page did not load: ${url}`);
  return page;
}

async function text(page, selector) {
  return page.evaluate(`document.querySelector(${JSON.stringify(selector)})?.textContent?.trim() || ''`);
}

async function exists(page, selector) {
  return page.evaluate(`Boolean(document.querySelector(${JSON.stringify(selector)}))`);
}

async function elementState(page, selector, scroll = true) {
  await page.call('Page.bringToFront');
  if (scroll) {
    await page.evaluate(`document.querySelector(${JSON.stringify(selector)})?.scrollIntoView({ block: 'center', inline: 'center' })`);
    await delay(20);
  }
  return page.evaluate(`(() => {
    const node = document.querySelector(${JSON.stringify(selector)});
    if (!node) return { exists: false };
    const rect = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    const x = Math.max(0, Math.min(innerWidth - 1, rect.left + rect.width / 2));
    const y = Math.max(0, Math.min(innerHeight - 1, rect.top + rect.height / 2));
    const hit = document.elementFromPoint(x, y);
    return {
      exists: true,
      x, y,
      width: rect.width,
      height: rect.height,
      disabled: Boolean(node.disabled),
      inert: Boolean(node.closest('[inert]')),
      visible: style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0,
      hit: Boolean(hit && (hit === node || node.contains(hit))),
      cursor: style.cursor,
      tag: node.tagName,
      role: node.getAttribute('role'),
      tabIndex: node.tabIndex,
      onclick: typeof node.onclick === 'function'
    };
  })()`);
}

async function mouseClickAt(page, x, y) {
  await page.call('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'none' });
  await page.call('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 });
  await page.call('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 });
}

async function realClick(page, selector, { allowDisabled = false } = {}) {
  const info = await elementState(page, selector);
  assert.equal(info.exists, true, `${page.name}: missing ${selector}`);
  assert.equal(info.visible, true, `${page.name}: ${selector} is not visible`);
  assert.equal(info.inert, false, `${page.name}: ${selector} is inside an inert subtree`);
  assert.equal(info.hit, true, `${page.name}: ${selector} fails center-point hit testing`);
  if (!allowDisabled) assert.equal(info.disabled, false, `${page.name}: ${selector} is disabled`);
  await mouseClickAt(page, info.x, info.y);
}

async function realClicks(page, selector, count) {
  const info = await elementState(page, selector);
  assert.equal(info.exists && info.visible && info.hit && !info.disabled && !info.inert, true, `${page.name}: ${selector} is not repeatedly clickable`);
  for (let index = 0; index < count; index += 1) await mouseClickAt(page, info.x, info.y);
}

const keys = {
  Enter: ['Enter', 13],
  ' ': ['Space', 32],
  Escape: ['Escape', 27],
  Home: ['Home', 36],
  End: ['End', 35],
  ArrowLeft: ['ArrowLeft', 37],
  ArrowUp: ['ArrowUp', 38],
  ArrowRight: ['ArrowRight', 39],
  ArrowDown: ['ArrowDown', 40],
  PageUp: ['PageUp', 33],
  PageDown: ['PageDown', 34],
  n: ['KeyN', 78],
  f: ['KeyF', 70],
  d: ['KeyD', 68],
  R: ['KeyR', 82]
};

async function pressKey(page, key, modifiers = 0) {
  const [code, virtualKey] = keys[key] || [`Key${key.toUpperCase()}`, key.toUpperCase().charCodeAt(0)];
  const params = { key, code, windowsVirtualKeyCode: virtualKey, modifiers };
  const keyText = !modifiers && key === 'Enter' ? '\r' : !modifiers && key === ' ' ? ' ' : '';
  await page.call('Page.bringToFront');
  await page.call('Input.dispatchKeyEvent', {
    ...params,
    type: keyText ? 'keyDown' : 'rawKeyDown',
    ...(keyText ? { text: keyText, unmodifiedText: keyText } : {})
  });
  await page.call('Input.dispatchKeyEvent', { ...params, type: 'keyUp' });
}

async function fillInput(page, selector, value) {
  await realClick(page, selector);
  await page.evaluate(`document.querySelector(${JSON.stringify(selector)}).select()`);
  await page.call('Input.insertText', { text: value });
  assert.equal(await page.evaluate(`document.querySelector(${JSON.stringify(selector)}).value`), value);
}

async function setRangeWithKeys(page, selector, target) {
  const bounds = await page.evaluate(`(() => { const node = document.querySelector(${JSON.stringify(selector)}); return node ? { min: Number(node.min), max: Number(node.max) } : null; })()`);
  assert.ok(bounds, `${page.name}: missing range ${selector}`);
  assert.ok(target >= bounds.min && target <= bounds.max, `${page.name}: range target ${target} is out of bounds`);
  await realClick(page, selector);
  const fromMin = target - bounds.min;
  const fromMax = bounds.max - target;
  if (fromMin <= fromMax) {
    await pressKey(page, 'Home');
    for (let index = 0; index < fromMin; index += 1) await pressKey(page, 'ArrowRight');
  } else {
    await pressKey(page, 'End');
    for (let index = 0; index < fromMax; index += 1) await pressKey(page, 'ArrowLeft');
  }
  assert.equal(await page.evaluate(`Number(document.querySelector(${JSON.stringify(selector)}).value)`), target, `${page.name}: ${selector} did not reach ${target}`);
}

async function blurControls(page) {
  await page.evaluate('document.activeElement?.blur()');
}

async function waitForScene(stage, phones, number) {
  await waitFor(() => stage.evaluate(`state.scene === ${number}`), `Stage did not enter scene ${number}`);
  await waitFor(async () => {
    const scenes = await Promise.all(phones.map(phone => phone.evaluate('state?.scene')));
    return scenes.every(scene => scene === number);
  }, `Not every phone entered scene ${number}`);
}

async function navigate(stage, phones, key, expected) {
  await blurControls(stage);
  await pressKey(stage, key);
  await delay(80);
  const current = await stage.evaluate(`({ scene: state.scene, active: document.activeElement?.tagName, key: ${JSON.stringify(key)} })`);
  if (current.scene !== expected) throw new Error(`Trusted navigation mismatch: ${JSON.stringify({ ...current, expected })}`);
  await waitForScene(stage, phones, expected);
}

async function assertNoHorizontalOverflow(page) {
  assert.equal(await page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), true, `${page.name} has horizontal overflow`);
}

async function listenerCount(page, selector) {
  const evaluated = await page.call('Runtime.evaluate', {
    expression: `document.querySelector(${JSON.stringify(selector)})`,
    returnByValue: false
  });
  const objectId = evaluated.result.objectId;
  assert.ok(objectId, `${page.name}: missing listener-audit node ${selector}`);
  const result = await page.call('DOMDebugger.getEventListeners', { objectId });
  await page.call('Runtime.releaseObject', { objectId });
  return result.listeners.filter(listener => ['click', 'pointerdown', 'pointerup', 'mousedown', 'mouseup'].includes(listener.type)).length;
}

async function assertPassive(page, selectors, label) {
  for (const selector of selectors) {
    const info = await elementState(page, selector, false);
    assert.equal(info.exists, true, `${label}: missing ${selector}`);
    assert.notEqual(info.tag, 'BUTTON', `${label}: ${selector} is a misleading button`);
    assert.equal(info.onclick, false, `${label}: ${selector} has an inline click handler`);
    assert.notEqual(info.cursor, 'pointer', `${label}: ${selector} uses a pointer cursor`);
    assert.equal(await listenerCount(page, selector), 0, `${label}: ${selector} has a pointer/click listener`);
  }
}

async function assertInactiveScenes(stage, activeIndex) {
  const state = await stage.evaluate(`[...document.querySelectorAll('.scene')].map((scene, index) => ({
    index,
    inert: scene.inert,
    ariaHidden: scene.getAttribute('aria-hidden'),
    active: scene.classList.contains('active')
  }))`);
  assert.equal(state.filter(item => item.active).length, 1, 'Exactly one stage scene must be active');
  for (const item of state) {
    assert.equal(item.active, item.index === activeIndex, `Wrong active state for scene ${item.index}`);
    assert.equal(item.inert, item.index !== activeIndex, `Wrong inert state for scene ${item.index}`);
    assert.equal(item.ariaHidden, String(item.index !== activeIndex), `Wrong aria-hidden state for scene ${item.index}`);
  }
}

async function takeOffline(page) {
  await page.call('Network.enable');
  await page.call('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
  await page.evaluate('(() => { socket.io.engine.close(); return true; })()');
  await waitFor(() => page.evaluate("document.querySelector('#connection-label').textContent === 'RECONNECTING…'"), `${page.name} did not show its offline state`);
}

async function restoreOnline(page) {
  await page.call('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await page.evaluate('(() => { socket.connect(); return true; })()');
  await waitFor(() => page.evaluate("socket.connected && document.querySelector('#connection-label').textContent === 'CONNECTED'"), `${page.name} did not reconnect`, 12000);
}

async function run() {
  assert.equal(fs.existsSync(CHROME), true, `Chrome is required at ${CHROME}`);
  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'signal-2045-browser-'));
  let serverStderr = '';
  const server = spawn(process.execPath, ['server.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: {
      ...process.env,
      PORT: String(APP_PORT),
      PUBLIC_URL: `http://127.0.0.1:${APP_PORT}/audience.html`,
      HOST_TOKEN
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  server.stderr.on('data', chunk => { serverStderr += String(chunk); });
  const chrome = spawn(CHROME, [
    '--headless=new',
    '--remote-debugging-port=0',
    `--user-data-dir=${profileDir}`,
    '--no-first-run',
    '--disable-default-apps',
    '--disable-background-networking',
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows',
    'about:blank'
  ], { stdio: 'ignore' });

  const pages = [];
  const screenshotDir = process.env.SHOW_SCREENSHOT_DIR;
  if (screenshotDir) fs.mkdirSync(screenshotDir, { recursive: true });
  const takeShot = async (page, name) => {
    if (!screenshotDir) return;
    await delay(300);
    await page.screenshot(path.join(screenshotDir, `${name}.png`));
  };

  try {
    await waitForServer(server);
    const debugPort = await waitForChrome(profileDir, chrome);

    // Presenter authentication: wrong code, visible failure, correct code, and session reload.
    const stage = await createPage(debugPort, `http://127.0.0.1:${APP_PORT}/`, 1920, 1080, false, 'stage');
    pages.push(stage);
    await waitFor(() => exists(stage, '#host-access-panel'), 'Presenter access panel did not appear');
    assert.equal(await text(stage, '#host-access-panel button[type="submit"]'), 'Unlock controls');
    await stage.evaluate(`window.__sawChecking = false; new MutationObserver(() => {
      const button = document.querySelector('#host-access-panel button[type="submit"]');
      if (button?.disabled && button.textContent.trim() === 'Checking…') window.__sawChecking = true;
    }).observe(document.querySelector('#host-access-panel'), { subtree: true, childList: true, attributes: true });`);
    await fillInput(stage, 'input[name="host-token"]', 'wrong-code');
    await realClick(stage, '#host-access-panel button[type="submit"]');
    await waitFor(() => text(stage, '.host-access-error').then(value => value.includes('not accepted')), 'Wrong presenter code did not show an error');
    assert.equal(await stage.evaluate('window.__sawChecking'), true, 'Presenter submit never showed its checking/disabled state');
    assert.equal(await stage.evaluate("document.querySelector('#host-access-panel button[type=submit]').disabled"), false);
    assert.equal(await text(stage, '#host-access-panel button[type="submit"]'), 'Unlock controls');
    await fillInput(stage, 'input[name="host-token"]', HOST_TOKEN);
    await realClick(stage, '#host-access-panel button[type="submit"]');
    await waitFor(() => stage.evaluate("socket.connected && !document.querySelector('#host-access-panel')"), 'Correct presenter code did not unlock the stage');
    assert.equal(await stage.evaluate("sessionStorage.getItem('signal2045-host-token')"), HOST_TOKEN);
    await stage.call('Page.reload', { ignoreCache: true });
    await waitFor(() => stage.evaluate("document.readyState === 'complete' && socket.connected"), 'Authenticated stage did not reconnect after reload');
    assert.equal(await exists(stage, '#host-access-panel'), false, 'Presenter overlay returned after authenticated reload');

    // Six isolated origins give six genuinely separate audience identities and localStorage ledgers.
    const phones = [];
    for (let index = 0; index < 6; index += 1) {
      const host = `phone-${index + 1}.localhost`;
      const phone = await createPage(debugPort, `http://${host}:${APP_PORT}/audience.html`, 390, 844, true, `phone-${index + 1}`);
      phones.push(phone);
      pages.push(phone);
    }
    await waitFor(() => stage.evaluate('state.participants === 6'), 'Six audience identities did not connect');
    await Promise.all(phones.map(assertNoHorizontalOverflow));

    // Lobby: disabled submit, wrong/correct branches, then six real sample submissions.
    const main = phones[0];
    assert.equal(await main.evaluate("document.querySelector('#submit-sample').disabled"), true);
    await realClick(main, '#submit-sample', { allowDisabled: true });
    assert.equal(await stage.evaluate('state.samples.length'), 0);
    const mainCorrect = await main.evaluate("assignedSample.hiddenTruth ? 'working' : 'changed'");
    const mainWrong = mainCorrect === 'working' ? 'changed' : 'working';
    await realClick(main, `[data-sample="${mainWrong}"]`);
    assert.equal(await main.evaluate(`document.querySelector('[data-sample="${mainWrong}"]').getAttribute('aria-checked')`), 'true');
    await realClick(main, '#submit-sample');
    assert.match(await text(main, '#sample-help'), /Check the rule again/);
    assert.equal(await stage.evaluate('state.samples.length'), 0);
    await realClick(main, `[data-sample="${mainCorrect}"]`);
    await realClick(main, '#submit-sample');
    await waitFor(() => stage.evaluate('state.samples.length === 1'), 'Main sample did not reach the stage');
    for (let index = 1; index < phones.length; index += 1) {
      const phone = phones[index];
      const answer = await phone.evaluate("assignedSample.hiddenTruth ? 'working' : 'changed'");
      await realClick(phone, `[data-sample="${answer}"]`);
      await realClick(phone, '#submit-sample');
      await waitFor(() => stage.evaluate(`state.samples.length === ${index + 1}`), `${phone.name} sample did not reach the stage`);
    }

    // Trusted presenter navigation shortcuts and fullscreen user gesture.
    await navigate(stage, phones, 'ArrowRight', 1);
    assert.match(await text(main, '#phone-content'), /no longer glowing green/i);
    await navigate(stage, phones, 'PageDown', 2);
    await navigate(stage, phones, 'PageUp', 1);
    await navigate(stage, phones, 'ArrowRight', 2);
    await blurControls(stage);
    await pressKey(stage, 'f');
    await waitFor(() => stage.evaluate('Boolean(document.fullscreenElement)'), 'F did not enter fullscreen');
    await stage.evaluate('document.exitFullscreen()');
    await waitFor(() => stage.evaluate('!document.fullscreenElement'), 'Fullscreen cleanup did not finish');
    await navigate(stage, phones, 'ArrowRight', 3);
    assert.match(await text(main, '#phone-content'), /green reporter light/i);
    await takeShot(stage, 'scene-03-genetics');

    // Microscope: an offline vote is rejected, reconnect restores the control, and both choices work.
    await navigate(stage, phones, 'ArrowRight', 4);
    await assertInactiveScenes(stage, 4);
    const hiddenPrimer = await elementState(stage, '#reveal-primer-button', false);
    assert.equal(hiddenPrimer.inert, true, 'An inactive-scene control was not inert');
    assert.equal(hiddenPrimer.hit, false, 'An inactive-scene control remained hit-testable');
    await takeOffline(main);
    await realClick(main, '[data-vote="no"]');
    assert.match(await text(main, '#phone-content'), /Reconnecting/i);
    assert.deepEqual(await stage.evaluate('state.polls.microscope'), { yes: 0, no: 0 });
    await restoreOnline(main);
    await waitFor(() => exists(main, '[data-vote="no"]'), 'Vote controls did not return after reconnect');
    await waitFor(() => stage.evaluate('state.participants === 6'), 'Reconnect changed the unique participant total');
    await realClick(main, '[data-vote="no"]');
    await realClick(phones[1], '[data-vote="yes"]');
    await waitFor(() => stage.evaluate('state.polls.microscope.no === 1 && state.polls.microscope.yes === 1'), 'Both microscope choices did not register');
    await realClick(stage, '#reveal-microscope-button');
    await waitFor(() => stage.evaluate('state.reveals.microscope === true'), 'Microscope reveal did not register');
    assert.equal(await stage.evaluate("document.querySelector('#reveal-microscope-button').disabled"), true);
    assert.equal(await text(stage, '#reveal-microscope-button'), 'Answer shown');
    await realClick(stage, '#reveal-microscope-button', { allowDisabled: true });
    await waitFor(() => text(main, '#phone-content').then(value => value.includes('Answer: no')), 'Microscope answer did not reach phones');

    // PCR phases, active-animation locks, Enter primary action, and room cap at 120.
    await navigate(stage, phones, 'ArrowRight', 5);
    const phaseCopy = [/heat separates/i, /primers bind to matching DNA bases/i, /an enzyme extends each primer/i];
    for (let phase = 0; phase < 3; phase += 1) {
      await realClick(stage, `[data-phase="${phase}"]`);
      assert.equal(await stage.evaluate(`document.querySelector('[data-phase="${phase}"]').getAttribute('aria-pressed')`), 'true');
      assert.match(await text(stage, '#pcr-phase-explanation'), phaseCopy[phase]);
    }
    await realClick(stage, '#pcr-cycle-button');
    await waitFor(() => stage.evaluate("document.querySelector('#pcr-cycle-button').disabled && [...document.querySelectorAll('.phase-row button')].every(button => button.disabled)"), 'PCR animation did not lock its controls');
    await realClick(stage, '#pcr-cycle-button', { allowDisabled: true });
    await waitFor(() => stage.evaluate("!document.querySelector('#pcr-cycle-button').disabled && [...document.querySelectorAll('.phase-row button')].every(button => !button.disabled) && localPcrCycle === 1"), 'PCR animation did not finish and unlock', 5000);
    await blurControls(stage);
    await pressKey(stage, 'Enter');
    await waitFor(() => stage.evaluate('localPcrCycle === 2 && !pcrDemoTimer'), 'Enter did not run the primary PCR action', 5000);

    await realClick(main, '#pcr-tap');
    await waitFor(() => stage.evaluate('state.pcrTaps === 1'), 'PCR mouse click did not register');
    await pressKey(main, 'Enter');
    await waitFor(() => stage.evaluate('state.pcrTaps === 2'), 'PCR Enter activation did not register exactly once');
    await pressKey(main, ' ');
    await waitFor(() => stage.evaluate('state.pcrTaps === 3'), 'PCR Space activation did not register exactly once');
    await realClicks(phones[1], '#pcr-tap', 24);
    await waitFor(() => phones[1].evaluate("document.querySelector('#pcr-tap').disabled"), 'Personal PCR cap did not disable the button');
    await realClicks(phones[2], '#pcr-tap', 24);
    await realClicks(phones[3], '#pcr-tap', 24);
    await realClicks(phones[4], '#pcr-tap', 24);
    await realClicks(phones[5], '#pcr-tap', 21);
    await waitFor(() => stage.evaluate('state.pcrTaps === 120 && state.reveals.pcrComplete'), 'Room PCR cap did not complete at 120', 12000);
    assert.equal(await main.evaluate('pcrTaps'), 3, 'The observer phone unexpectedly reached its personal cap');
    await waitFor(() => text(main, '#phone-content').then(value => value.includes('1.07 BILLION')), 'Unmaxed PCR phone did not switch to completion');
    assert.equal(await exists(main, '#pcr-tap'), false);
    assert.equal(await text(stage, '#pcr-copies'), '1.07B');
    assert.equal(await stage.evaluate("document.querySelector('#pcr-cycle-button').disabled && document.querySelector('#pcr-30-button').disabled"), true);

    // Every DNA option gets a fresh identity; stage result tiles remain passive.
    await navigate(stage, phones, 'ArrowRight', 6);
    const primerChoices = ['gacac', 'ctgtg', 'gtgtg', 'random'];
    for (let index = 0; index < primerChoices.length; index += 1) await realClick(phones[index], `[data-vote="${primerChoices[index]}"]`);
    await waitFor(() => stage.evaluate('Object.values(state.polls.primer).every(value => value === 1)'), 'All primer choices did not register');
    assert.deepEqual(await stage.evaluate("['gacac','ctgtg','gtgtg','random'].map(key => document.querySelector('#primer-'+key).textContent)"), ['25%', '25%', '25%', '25%']);
    await assertPassive(stage, primerChoices.map(choice => `#primer-options [data-choice="${choice}"]`), 'Primer results');
    await realClick(stage, '#reveal-primer-button');
    await waitFor(() => stage.evaluate('state.reveals.primer'), 'Primer reveal did not register');
    assert.equal(await text(stage, '#reveal-primer-button'), 'Match shown');
    assert.equal(await stage.evaluate("document.querySelector('#reveal-primer-button').disabled"), true);
    await realClick(stage, '#reveal-primer-button', { allowDisabled: true });
    await takeShot(stage, 'scene-06-dna-match');

    await navigate(stage, phones, 'ArrowRight', 7);
    assert.match(await text(main, '#phone-content'), /sensor measures the green light.*AI compares both scores/i);

    // Real keyboard-driven stage range plus both wrong nano branches and solved lock.
    await navigate(stage, phones, 'ArrowRight', 8);
    await realClick(stage, '#scale-slider');
    await pressKey(stage, 'Home');
    assert.equal(await stage.evaluate('state.scene'), 8, 'Focused range triggered a global stage shortcut');
    const scaleLabels = ['1 metre', '10 centimetres', '1 centimetre', '1 millimetre', '100 micrometres', '10 micrometres', '1 micrometre', '100 nanometres', '10 nanometres', '1 nanometre'];
    assert.equal(await text(stage, '#scale-label'), scaleLabels[0]);
    for (let value = 1; value <= 9; value += 1) {
      await pressKey(stage, 'ArrowRight');
      assert.equal(await text(stage, '#scale-label'), scaleLabels[value]);
      assert.equal(await stage.evaluate('state.scene'), 8, 'Range ArrowRight changed the scene');
    }
    await realClick(main, '[data-nano="wrong-metre"]');
    assert.match(await text(main, '#nano-answer'), /Try again/);
    await realClick(main, '[data-nano="wrong-fast"]');
    assert.match(await text(main, '#nano-answer'), /Try again/);
    await realClick(main, '[data-nano="right"]');
    assert.match(await text(main, '#nano-answer'), /Correct/);
    assert.equal(await main.evaluate("[...document.querySelectorAll('[data-nano]')].every(button => button.disabled)"), true);
    assert.deepEqual(await main.evaluate("[...document.querySelectorAll('[data-nano]')].filter(button => button.classList.contains('selected')).map(button => button.dataset.nano)"), ['right']);
    const nanoAnswer = await text(main, '#nano-answer');
    await realClick(main, '[data-nano="wrong-fast"]', { allowDisabled: true });
    assert.equal(await text(main, '#nano-answer'), nanoAnswer, 'Solved nano quiz changed after a disabled click');

    // UV click, Enter, Space, personal cap, room cap, then presenter completion.
    await blurControls(stage);
    await navigate(stage, phones, 'ArrowRight', 9);
    await realClick(main, '#photon-tap');
    await waitFor(() => stage.evaluate('state.photonCount === 1'), 'UV mouse click did not register');
    await pressKey(main, 'Enter');
    await waitFor(() => stage.evaluate('state.photonCount === 2'), 'UV Enter activation did not register exactly once');
    await pressKey(main, ' ');
    await waitFor(() => stage.evaluate('state.photonCount === 3'), 'UV Space activation did not register exactly once');
    await realClicks(phones[1], '#photon-tap', 24);
    await waitFor(() => phones[1].evaluate("document.querySelector('#photon-tap').disabled"), 'Personal UV cap did not disable the button');
    await realClicks(phones[2], '#photon-tap', 21);
    await waitFor(() => stage.evaluate('state.photonCount === 48'), 'Room UV cap did not stop at 48', 10000);
    assert.equal(await main.evaluate('photons'), 3, 'The observer phone unexpectedly reached its UV cap');
    await waitFor(() => text(main, '#phone-content').then(value => value.includes('UV EXPOSURE COMPLETE')), 'Unmaxed phone did not show shared UV completion');
    assert.deepEqual(await stage.evaluate("[...document.querySelectorAll('.litho-steps span')].map(node => node.classList.contains('on'))"), [true, true, false, false]);
    await realClick(stage, '#expose-chip-button');
    await waitFor(() => stage.evaluate('state.reveals.chip'), 'Presenter did not reveal the later chip steps');
    assert.deepEqual(await stage.evaluate("[...document.querySelectorAll('.litho-steps span')].map(node => node.classList.contains('on'))"), [true, true, true, true]);
    await waitFor(() => text(main, '#phone-content').then(value => value.includes('PATTERN COMPLETE')), 'Phone did not show presenter chip completion');
    assert.equal(await stage.evaluate("document.querySelector('#expose-chip-button').disabled"), true);
    const photonTotal = await stage.evaluate('state.photonCount');
    await realClick(stage, '#expose-chip-button', { allowDisabled: true });
    assert.equal(await stage.evaluate('state.photonCount'), photonTotal);

    await navigate(stage, phones, 'ArrowRight', 10);
    assert.match(await text(main, '#phone-content'), /sensor measures the light.*AI uses that score.*DNA-match score/i);

    // All model-size votes, passive result pills, and a presenter override.
    await navigate(stage, phones, 'ArrowRight', 11);
    for (const [index, choice] of ['two', 'four', 'eight'].entries()) await realClick(phones[index], `[data-vote="${choice}"]`);
    await waitFor(() => stage.evaluate('state.polls.architecture.two === 1 && state.polls.architecture.four === 1 && state.polls.architecture.eight === 1'), 'All architecture choices did not register');
    assert.match(await text(stage, '#architecture-choice'), /4 HIDDEN UNITS · AUDIENCE RESULT/);
    assert.equal(await stage.evaluate("document.querySelector('[data-hidden-units=\"audience\"]').getAttribute('aria-pressed')"), 'true');
    await assertPassive(stage, ['.architecture-results span:nth-child(1)', '.architecture-results span:nth-child(2)', '.architecture-results span:nth-child(3)'], 'Architecture results');
    await realClick(phones[3], '[data-vote="eight"]');
    await realClick(phones[4], '[data-vote="eight"]');
    await waitFor(() => stage.evaluate('state.polls.architecture.eight === 3'), 'The leading audience model size did not update');
    assert.match(await text(stage, '#architecture-choice'), /8 HIDDEN UNITS · AUDIENCE RESULT/);
    assert.equal(await stage.evaluate("document.querySelector('.architecture-results span:nth-child(3)').classList.contains('winner')"), true);
    await realClick(stage, '[data-hidden-units="2"]');
    assert.match(await text(stage, '#architecture-choice'), /2 HIDDEN UNITS · PRESENTER CHOICE/);
    assert.match(await text(stage, '#architecture-source'), /Audience result: 8.*presenter selected 2/i);
    assert.equal(await stage.evaluate("document.querySelector('[data-hidden-units=\"2\"]').getAttribute('aria-pressed')"), 'true');
    assert.equal(await stage.evaluate("document.querySelector('.architecture-results span:nth-child(3)').classList.contains('winner')"), true, 'Presenter override changed the displayed audience result');

    // Training controls: passive phone readouts, disabled repeats, reset, and Enter retrain.
    await navigate(stage, phones, 'ArrowRight', 12);
    assert.equal(await main.evaluate("document.querySelectorAll('#phone-content button').length"), 0, 'Training readouts still look interactive');
    assert.equal(await stage.evaluate("document.querySelector('#contaminate-button').disabled"), true);
    assert.equal(await text(stage, '#reset-model-button'), 'Model already reset');
    assert.equal(await stage.evaluate("document.querySelector('#reset-model-button').disabled"), true);
    await realClick(stage, '#train-model-button');
    await waitFor(() => stage.evaluate("trainingActive && document.querySelector('#train-model-button').disabled && document.querySelector('#train-model-button').textContent.includes('Training')"), 'Training did not visibly enter its busy state');
    assert.equal(await stage.evaluate("currentModel.hidden === 2 && currentModel.layers[0].w.length === 2 && [...document.querySelectorAll('[data-hidden-units]')].every(button => button.disabled)"), true, 'Training did not capture and lock the presenter’s 2-unit setting');
    await realClick(stage, '#train-model-button', { allowDisabled: true });
    await waitFor(() => stage.evaluate('state.training.epoch === 500 && Boolean(state.model)'), 'First training run did not finish', 12000);
    assert.equal(await stage.evaluate('state.model.hidden'), 2);
    assert.equal(await text(stage, '#epoch-value'), '500');
    assert.notEqual(await text(stage, '#loss-value'), '—');
    assert.match(await text(main, '#phone-training-title'), /Training complete/);
    assert.equal(await text(stage, '#train-model-button'), 'Train again');
    await realClick(stage, '#reset-model-button');
    await waitFor(() => stage.evaluate('!state.model && state.training.epoch === 0'), 'Model reset did not clear training');
    assert.equal(await stage.evaluate("document.querySelector('[data-hidden-units=\"2\"]').getAttribute('aria-pressed')"), 'true', 'Model reset did not retain the presenter setting');
    assert.equal(await stage.evaluate("[...document.querySelectorAll('[data-hidden-units]')].every(button => !button.disabled)"), true, 'Model reset did not unlock the hidden-unit controls');
    assert.equal(await text(stage, '#reset-model-button'), 'Model already reset');
    assert.equal(await stage.evaluate("document.querySelector('#reset-model-button').disabled"), true);
    await realClick(stage, '#reset-model-button', { allowDisabled: true });
    await blurControls(stage);
    await pressKey(stage, 'Enter');
    await waitFor(() => stage.evaluate('trainingActive'), 'Enter did not start the scene 12 primary action');
    await waitFor(() => stage.evaluate('state.training.epoch === 500 && Boolean(state.model)'), 'Second training run did not finish', 12000);
    assert.equal(await stage.evaluate('state.model.hidden'), 2);

    // Real challenge ranges, result lock/re-enable, update-in-place, and visible retraining feedback.
    await navigate(stage, phones, 'ArrowRight', 13);
    await setRangeWithKeys(main, '#challenge-water', 0);
    await setRangeWithKeys(main, '#challenge-carbon', 100);
    await realClick(main, '#predict-button');
    await waitFor(() => stage.evaluate('state.challenges.length === 1'), 'First AI challenge did not reach the stage');
    assert.match(await text(main, '#phone-prediction'), /PREDICTED: (WORKING|CHANGED)/);
    assert.equal(await main.evaluate("document.querySelector('#predict-button').disabled"), true);
    assert.equal(await text(main, '#predict-button'), 'Move a slider to test again');
    await realClick(main, '#predict-button', { allowDisabled: true });
    assert.equal(await stage.evaluate('state.challenges.length'), 1);
    await setRangeWithKeys(main, '#challenge-water', 86);
    await setRangeWithKeys(main, '#challenge-carbon', 78);
    assert.equal(await main.evaluate("document.querySelector('#predict-button').disabled"), false);
    assert.equal(await text(main, '#predict-button'), 'Test the updated sample');
    await realClick(main, '#predict-button');
    await waitFor(() => stage.evaluate('state.challenges.length === 1 && state.challenges[0].water === 86 && state.challenges[0].carbon === 78'), 'Second challenge did not update the existing phone point');
    await takeShot(main, 'phone-ai-challenge');
    const firstModelTime = await stage.evaluate('state.model.trainedAt');
    await realClick(stage, '#contaminate-button');
    await waitFor(() => text(stage, '#contaminate-button').then(value => value.includes('Retraining with 4 verified samples')), 'Retraining button did not explain the active work');
    assert.equal(await stage.evaluate("document.querySelector('#contaminate-button').disabled"), true);
    assert.equal(await stage.evaluate("state.samples.filter(sample => sample.source === 'radiation').length"), 4);
    await waitFor(() => stage.evaluate(`state.model?.trainedAt > ${firstModelTime}`), 'Retraining with checked samples did not finish', 12000);
    assert.equal(await stage.evaluate('state.model.hidden'), 2, 'Verified-sample retraining changed the selected model size');
    assert.equal(await text(stage, '#contaminate-button'), '4 verified samples added');
    assert.match(await text(stage, '#retraining-status'), /score for the same sample changed from \d+\/100 to \d+\/100/i);
    await realClick(stage, '#contaminate-button', { allowDisabled: true });
    assert.equal(await stage.evaluate("state.samples.filter(sample => sample.source === 'radiation').length"), 4);

    // Both trust choices and one-way reveal.
    await navigate(stage, phones, 'ArrowRight', 14);
    await realClick(phones[0], '[data-vote="deploy"]');
    await realClick(phones[1], '[data-vote="verify"]');
    await waitFor(() => stage.evaluate('state.polls.trust.deploy === 1 && state.polls.trust.verify === 1'), 'Both trust choices did not register');
    await realClick(stage, '#reveal-trust-button');
    await waitFor(() => stage.evaluate('state.reveals.trust'), 'Trust reveal did not register');
    assert.equal(await text(stage, '#reveal-trust-button'), 'Checks shown');
    assert.equal(await stage.evaluate("document.querySelector('#reveal-trust-button').disabled"), true);
    await realClick(stage, '#reveal-trust-button', { allowDisabled: true });
    await waitFor(() => text(main, '#phone-content').then(value => value.includes('A model score is one piece of evidence')), 'Trust answer did not reach phones');

    // Gravity locks after the right answer; every orbit preset has visible copy and survives revisit.
    await navigate(stage, phones, 'ArrowRight', 15);
    await realClick(main, '[data-gravity="wrong"]');
    assert.match(await text(main, '#gravity-answer'), /Gravity is still strong/);
    await realClick(main, '[data-gravity="right"]');
    assert.match(await text(main, '#gravity-answer'), /Correct/);
    assert.equal(await main.evaluate("[...document.querySelectorAll('[data-gravity]')].every(button => button.disabled)"), true);
    assert.deepEqual(await main.evaluate("[...document.querySelectorAll('[data-gravity]')].filter(button => button.classList.contains('selected')).map(button => button.dataset.gravity)"), ['right']);
    const orbitExpectations = {
      97: 'TOO SLOW: the spacecraft enters the atmosphere.',
      100: 'ORBIT: the spacecraft continues around Earth without entering the atmosphere.',
      142: 'ESCAPE SPEED: the spacecraft is moving fast enough to leave Earth.'
    };
    for (const [speed, copy] of Object.entries(orbitExpectations)) {
      await realClick(stage, `[data-orbit-speed="${speed}"]`);
      assert.equal(await stage.evaluate(`document.querySelector('[data-orbit-speed="${speed}"]').getAttribute('aria-pressed')`), 'true');
      assert.equal(await text(stage, '#orbit-concept-result'), copy);
    }
    await navigate(stage, phones, 'ArrowRight', 16);
    await navigate(stage, phones, 'ArrowLeft', 15);
    assert.equal(await stage.evaluate("document.querySelector('[data-orbit-speed=\"142\"]').getAttribute('aria-pressed')"), 'true');
    assert.equal(await text(stage, '#orbit-concept-result'), orbitExpectations[142]);
    await navigate(stage, phones, 'ArrowRight', 16);

    // No-data simulation branch, burn lock/revisit/update, and two animated outcomes.
    await realClick(stage, '#simulate-orbit-button');
    assert.match(await text(stage, '#flight-result'), /WAITING FOR AT LEAST ONE/);
    assert.equal(await text(main, '#lock-burn'), 'Send this speed');
    await setRangeWithKeys(main, '#burn-slider', 97);
    await realClick(main, '#lock-burn');
    await waitFor(() => stage.evaluate('state.burns.length === 1 && state.burns[0].value === 97'), 'First burn did not reach the stage');
    assert.equal(await text(main, '#lock-burn'), 'Speed sent');
    assert.equal(await main.evaluate("document.querySelector('#lock-burn').disabled"), true);
    assert.match(await text(main, '#burn-send-status'), /Speed sent\. Move the slider/);
    await realClick(main, '#lock-burn', { allowDisabled: true });
    assert.equal(await stage.evaluate('state.burns.length'), 1);
    await realClick(stage, '#simulate-orbit-button');
    await waitFor(() => stage.evaluate("orbitAnimating && document.querySelector('#simulate-orbit-button').disabled"), 'Orbit run did not lock its button');
    await realClick(stage, '#simulate-orbit-button', { allowDisabled: true });
    await waitFor(() => text(stage, '#flight-result').then(value => value.includes('TOO SLOW')), 'Crash branch did not finish', 7000);
    await navigate(stage, phones, 'ArrowLeft', 15);
    await navigate(stage, phones, 'ArrowRight', 16);
    assert.equal(await main.evaluate("Number(document.querySelector('#burn-slider').value)"), 97);
    assert.equal(await text(main, '#lock-burn'), 'Speed sent');
    assert.equal(await main.evaluate("document.querySelector('#lock-burn').disabled"), true);
    assert.equal(await text(main, '#burn-send-status'), 'This speed has been sent.');
    await setRangeWithKeys(main, '#burn-slider', 100);
    assert.equal(await text(main, '#lock-burn'), 'Send updated speed');
    assert.equal(await main.evaluate("document.querySelector('#lock-burn').disabled"), false);
    assert.equal(await text(main, '#burn-send-status'), 'New value not sent yet.');
    await realClick(main, '#lock-burn');
    await waitFor(() => stage.evaluate('state.burns.length === 1 && state.burns[0].value === 100'), 'Updated burn did not replace the phone entry');
    await waitFor(() => text(stage, '#flight-result').then(value => value.includes('SPEED CHANGED')), 'Changed speed did not reset the flight result');
    assert.equal(await text(stage, '#telemetry-alt'), 'START: 400 km');
    await realClick(stage, '#simulate-orbit-button');
    await waitFor(() => text(stage, '#flight-result').then(value => value.includes('NEAR-CIRCULAR ORBIT')), 'Orbit branch did not finish', 7000);
    await takeShot(stage, 'scene-16-orbit-result');

    // All responsibility choices, passive result cards, and passive finale readouts.
    await navigate(stage, phones, 'ArrowRight', 17);
    for (const [index, choice] of ['earth', 'orbit', 'remote'].entries()) await realClick(phones[index], `[data-vote="${choice}"]`);
    await waitFor(() => stage.evaluate('state.polls.return.earth === 1 && state.polls.return.orbit === 1 && state.polls.return.remote === 1'), 'All return choices did not register');
    assert.deepEqual(await stage.evaluate("['earth','orbit','remote'].map(key => document.querySelector('#return-'+key+'-n').textContent)"), ['33%', '33%', '33%']);
    await assertPassive(stage, ['.return-options article:nth-child(1)', '.return-options article:nth-child(2)', '.return-options article:nth-child(3)'], 'Return results');
    await navigate(stage, phones, 'ArrowRight', 18);
    assert.match(await text(main, '#phone-content'), /Thanks for taking part/);
    assert.equal(await main.evaluate("document.querySelectorAll('#phone-content button').length"), 0, 'Final recap still contains misleading buttons');
    assert.match(await text(stage, '#final-participants'), /PEOPLE RESPONDED/);
    await takeShot(stage, 'scene-18-finale');

    // Presenter notes and keyboard focus guards.
    await blurControls(stage);
    await pressKey(stage, 'n');
    assert.equal(await stage.evaluate("document.querySelector('#presenter-notes').classList.contains('shown') && !document.querySelector('#presenter-notes').inert"), true);
    await pressKey(stage, 'n');
    assert.equal(await stage.evaluate("!document.querySelector('#presenter-notes').classList.contains('shown') && document.querySelector('#presenter-notes').inert"), true);
    await stage.evaluate(`(() => { const input = document.createElement('input'); input.id = 'shortcut-test'; document.body.appendChild(input); input.focus(); })()`);
    await pressKey(stage, 'ArrowLeft');
    assert.equal(await stage.evaluate('state.scene'), 18, 'Focused input leaked into global navigation');

    // Real Shift+R dialog reset, lobby demo button, D shortcut, and the deferred pcr-30 control.
    await stage.evaluate("window.confirm = () => true; document.querySelector('#shortcut-test').remove(); document.activeElement?.blur()");
    await pressKey(stage, 'R', 8);
    await waitFor(() => stage.evaluate('state.scene === 0 && state.samples.length === 0 && state.burns.length === 0'), 'Shift+R did not reset the mission');
    assert.equal(await stage.evaluate("manualArchitecture === null && document.querySelector('[data-hidden-units=\"audience\"]').getAttribute('aria-pressed') === 'true'"), true, 'Full reset did not restore audience-following mode');
    assert.match(await text(stage, '#architecture-choice'), /4 HIDDEN UNITS · DEFAULT/);
    assert.equal(await text(stage, '#flight-result'), 'WAITING FOR SPEEDS');
    assert.equal(await text(stage, '#telemetry-alt'), 'START: 400 km');
    assert.equal(await text(stage, '#scale-label'), '1 metre');
    await realClick(stage, '#seed-demo');
    await waitFor(() => stage.evaluate('state.demoComplete === true'), 'Lobby demo button did not work');
    assert.equal(await stage.evaluate("document.querySelector('#seed-demo').disabled"), true);
    const demoSamples = await stage.evaluate('state.samples.length');
    await realClick(stage, '#seed-demo', { allowDisabled: true });
    assert.equal(await stage.evaluate('state.samples.length'), demoSamples);
    await blurControls(stage);
    await pressKey(stage, 'R', 8);
    await waitFor(() => stage.evaluate('state.scene === 0 && !state.demo'), 'Second reset did not clear demo mode');
    await blurControls(stage);
    await pressKey(stage, 'd');
    await waitFor(() => stage.evaluate('state.demoComplete === true'), 'D did not load demo fallback');
    await pressKey(stage, 'R', 8);
    await waitFor(() => stage.evaluate('state.scene === 0 && !state.demo'), 'Reset after D did not clear demo mode');
    for (let index = 1; index <= 5; index += 1) await navigate(stage, phones, 'ArrowRight', index);
    await realClick(stage, '#pcr-30-button');
    await waitFor(() => stage.evaluate('state.reveals.pcrComplete && localPcrCycle === 30'), 'Jump-to-30 control did not complete PCR');
    assert.equal(await stage.evaluate("document.querySelector('#pcr-30-button').disabled"), true);
    await blurControls(stage);
    await pressKey(stage, 'R', 8);
    await waitFor(() => stage.evaluate('state.scene === 0 && state.pcrTaps === 0 && !state.reveals.pcrComplete'), 'Final reset did not clear PCR');

    // 1280×720 projector bounds, active/inert invariants, and phone width on every scene.
    await stage.viewport(1280, 720);
    for (let index = 0; index <= 18; index += 1) {
      await stage.evaluate(`setScene(${index})`);
      await waitForScene(stage, phones, index);
      await assertInactiveScenes(stage, index);
      const clipped = await stage.evaluate(`(() => {
        const scene = document.querySelector('.scene.active');
        const deck = document.querySelector('.deck').getBoundingClientRect();
        const nodes = [...scene.children, ...scene.querySelectorAll('h1,h2,h3,button,input')];
        return nodes.filter(node => {
          const rect = node.getBoundingClientRect();
          if (!rect.width || !rect.height || getComputedStyle(node).visibility === 'hidden') return false;
          return rect.left < deck.left - 2 || rect.right > deck.right + 2 || rect.top < deck.top - 2 || rect.bottom > deck.bottom + 2;
        }).map(node => ({ tag: node.tagName, className: node.className, text: node.textContent.trim().slice(0, 45) }));
      })()`);
      assert.deepEqual(clipped, [], `Scene ${index} clips meaningful content at 1280×720`);
      await assertNoHorizontalOverflow(main);
    }

    assert.equal(serverStderr.trim(), '', `Server wrote to stderr:\n${serverStderr}`);
    const browserErrors = pages.flatMap(page => page.javascriptErrors.map(error => `${page.name}: ${error}`));
    assert.deepEqual(browserErrors, [], `Browser JavaScript errors:\n${browserErrors.join('\n')}`);

    console.log('PASS: trusted mouse/keyboard interactions, every option, completion lock, reconnect, retraining, orbit branches, passive affordances, responsive scenes, and reset were exercised.');
  } finally {
    pages.forEach(page => page.close());
    server.kill('SIGTERM');
    chrome.kill('SIGTERM');
    await Promise.race([
      new Promise(resolve => chrome.exitCode === null ? chrome.once('exit', resolve) : resolve()),
      delay(2000)
    ]);
    fs.rmSync(profileDir, { recursive: true, force: true, maxRetries: 8, retryDelay: 100 });
  }
}

run().catch(error => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
