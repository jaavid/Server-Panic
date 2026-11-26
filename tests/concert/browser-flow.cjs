const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {runInNewContext} = require('node:vm');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const address = process.env.CONCERT_URL || 'http://127.0.0.1:8769/concert/';
const real = process.argv.includes('--real');
const fa = '۰۱۲۳۴۵۶۷۸۹';
const digit = c => String(fa.indexOf(c));
const start = '#start';

function clockToSeconds(text) {
  const [minutes, seconds] = text.replace(/[۰-۹]/g, digit).split(':').map(Number);
  return minutes * 60 + seconds;
}

async function visit(context, options = {}) {
  const page = await context.newPage();
  if (options.touch) await page.emulateMedia({reducedMotion: 'reduce'});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  if (!real) {
    await page.addInitScript(() => {
      let pending;
      let now = 0;
      window.requestAnimationFrame = callback => { pending = callback; return 1; };
      window.missionFrames = (count, milliseconds) => {
        for (let i = 0; i < count; i++) {
          const next = pending;
          pending = null;
          now += milliseconds;
          next(now);
        }
      };
    });
  }
  if (options.noWebGL) await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      if (type.startsWith('webgl')) return null;
      return getContext.call(this, type, ...args);
    };
  });
  await page.goto(options.url || address);
  await page.locator('#stage[data-phase=menu]').waitFor();
  const frame = (count = 1, milliseconds = 1000) =>
    page.evaluate(([count, milliseconds]) => window.missionFrames(count, milliseconds), [count, milliseconds]);
  const click = selector => page.locator(selector).click({timeout: 2500});
  const phase = () => page.locator('#stage').getAttribute('data-phase');
  const elapsed = async () => 420 - clockToSeconds(await page.locator('#clock').textContent());
  const open = selector => click('[data-zone="' + selector + '"]');
  if (!real) await frame(1, 1);
  return {page, errors, frame, click, phase, elapsed, open};
}

async function play({page, errors, frame, click, phase, elapsed, open}, kind = 'win') {
  await click(start);
  assert.equal(await phase(), 'training');
  assert.equal(await elapsed(), 0);
  assert.ok(await page.locator('#route').isEnabled());
  if (!real) {
    await frame(10);
    assert.equal(await elapsed(), 0);
  }
  if (kind === 'idle') await click('#skip');
  else await click('#route');
  assert.equal(await phase(), 'playing');
  const started = Date.now();
  let didPause = false, sent = false, cooled = false, restored = false, briefed = false, protectedEntry = false;
  let last = -1;
  for (let iteration = 0; iteration < 1100 && await phase() === 'playing'; iteration++) {
    if (real) await page.waitForTimeout(500);
    else await frame();
    const time = await elapsed();
    if (await phase() !== 'playing') break;
    if (real && time !== last && time % 60 === 0) console.log('Normal-speed checkpoint', time);
    if (time === last) continue;
    last = time;
    if (kind === 'idle') continue;
    if (!didPause && time >= 10) {
      didPause = true;
      await click('#pause');
      const frozen = await elapsed();
      if (real) await page.waitForTimeout(2200);
      else await frame(8);
      assert.equal(await elapsed(), frozen);
      await click(start);
      assert.equal(await phase(), 'playing');
    }
    if (time >= 95 && time <= 107 && !sent) {
      if (await page.locator('#jump').isVisible()) await click('#jump');
      else {
        await open('data');
        await click('[data-node="1"]');
      }
      if (await page.locator('#drone').isEnabled()) {
        await click('#drone');
        sent = true;
        continue;
      }
    }
    if (time >= 231 && time <= 237 && !cooled) {
      await open('data');
      await click('[data-node="2"]');
      if (await page.locator('#drone').isEnabled()) {
        await click('#drone');
        cooled = true;
      }
    }
    if (await page.locator('#decision').isVisible()) {
      await click(time < 200 ? '#policy-entry' : '#policy-stream');
      protectedEntry = true;
    }
    if (time >= 302 && !restored && kind !== 'blackout') {
      if (await page.locator('#jump').isVisible()) await click('#jump');
      else await open('control');
      if (await page.locator('#backup').isEnabled()) {
        restored = true;
        await click('#backup');
        assert.equal(await page.locator('#stage').getAttribute('data-broadcast'), 'outage');
      }
    }
    if ((time === 31 || time === 305) && !briefed) {
      await open('venue');
      if (await page.locator('#audience').isEnabled()) {
        await click('#audience');
        assert.match(await page.locator('#alert').textContent(), /تماشاگران/);
        briefed = true;
      }
    }
    if (time % 6 === 0 || time % 3 === 0 && time >= 374 && time < 402) {
      await open('data');
      const free = page.locator('[data-node][data-status=free]').first();
      if (await free.count()) {
        await free.click();
        if (await page.locator('#route').isEnabled()) await click('#route');
      }
    }
  }
  assert.equal(await phase(), 'result');
  const elapsedTime = await elapsed();
  const result = await page.locator('#stage').getAttribute('data-result');
  assert.equal(result, kind === 'win' ? 'win' : 'loss');
  assert.ok(await page.locator('#summary').isVisible());
  assert.equal(await page.locator('#summary dd').count(), 4);
  assert.deepEqual(errors, []);
  if (kind === 'win') {
    assert.equal(elapsedTime, 420);
    assert.ok(sent && cooled && restored && briefed && protectedEntry);
  } else if (kind === 'blackout') {
    assert.equal(elapsedTime, 328);
    assert.match(await page.locator('#overlay-copy').textContent(), /مهلت قطع پخش/);
  } else {
    assert.ok(elapsedTime < 302);
    assert.match(await page.locator('#overlay-copy').textContent(), /اعتماد/);
  }
  console.log(kind, elapsedTime, 'mission seconds;', Math.round((Date.now() - started) / 1000),
    'wall seconds;', (await page.locator('#summary dd').allTextContents()).join(' | '));
  await click(start);
  assert.equal(await phase(), 'training');
  assert.equal(await elapsed(), 0);
  assert.ok(await page.locator('#route').isEnabled());
  assert.equal(await page.locator('#summary').isVisible(), false);
}

async function fits(page, selectors) {
  return page.evaluate(ids => {
    if (document.documentElement.scrollWidth > innerWidth) return false;
    return ids.every(id => {
      const box = document.querySelector(id).getBoundingClientRect();
      return box.width > 0 && box.top >= 0 && box.bottom <= innerHeight;
    });
  }, selectors);
}

async function mobileChecks(browser) {
  for (const [width, height] of [[360, 800], [390, 844], [768, 1024], [1440, 900]]) {
    const context = await browser.newContext({
      viewport: {width, height}, hasTouch: width < 1000, isMobile: width < 1000, deviceScaleFactor: 1,
    });
    const {page, frame, click, open} = await visit(context, {touch: true});
    await click(start);
    assert.ok(await fits(page, ['#clock', '#guide', '#detail', '#route', '#skip']), width + ' training layout');
    if (width === 360) {
      assert.equal(await page.locator('.fallback').count(), 0, 'touch test requires WebGL');
      const targets = {
        venue: [1, .13, 4.2], control: [5.7, 1.1, -2.0], data: [1.1, 1.1, -3.55],
      };
      const focus = {
        data: [-.76, 0, -.884], venue: [.38, 0, 1.088], control: [2.166, 0, -.748],
      };
      let previous = 'data';
      for (const [zone, point] of Object.entries(targets)) {
        await frame(1, 16);
        const coord = await page.evaluate(async ({pose, point}) => {
          const T = await import(new URL('vendor/three.module.min.js', location.href).href);
          const box = document.querySelector('#world').getBoundingClientRect();
          const ratio = box.width / box.height;
          const size = Math.max(7.7, 9.2 / ratio);
          const camera = new T.OrthographicCamera(-size * ratio, size * ratio, size, -size, .1, 100);
          const look = new T.Vector3(...pose);
          camera.position.copy(look).add(new T.Vector3(12, 16, 21));
          camera.lookAt(look);
          camera.updateMatrixWorld();
          const p = new T.Vector3(...point).project(camera);
          return {x: box.x + (p.x + 1) * box.width / 2, y: box.y + (1 - p.y) * box.height / 2};
        }, {pose: focus[previous], point});
        await page.touchscreen.tap(coord.x, coord.y);
        assert.equal(await page.locator('[data-zone="' + zone + '"]').getAttribute('aria-pressed'), 'true');
        previous = zone;
      }
      assert.equal(await page.locator('[data-node="2"]').getAttribute('aria-pressed'), 'true');
    }
    await open('data');
    if (width < 1000) await page.locator('#route').tap();
    else await click('#route');
    assert.ok(await fits(page, ['#clock', '#guide', '#detail', '#route', '#drone']), width + ' active layout');
    console.log(width + '×' + height, 'controls in view' + (width === 360 ? '; touch picked all three areas and a rack' : ''));
    await context.close();
  }
}

async function packageChecks(browser) {
  const offline = await browser.newContext({viewport: {width: 360, height: 800}, offline: true});
  let network = 0;
  offline.on('request', req => { if (/^https?:/.test(req.url())) network++; });
  const packaged = await visit(offline, {
    url: pathToFileURL(resolve('dist-offline/arvan-shahr-concert.html')).href, noWebGL: true,
  });
  assert.ok(await packaged.page.locator('.fallback').isVisible());
  await play(packaged);
  assert.equal(network, 0);
  console.log('offline file: full win and replay, WebGL disabled, zero HTTP requests');
  await offline.close();

  const edge = await browser.newContext({viewport: {width: 390, height: 844}});
  let handler;
  runInNewContext(readFileSync('dist-edge/arvan-shahr-concert.worker.js', 'utf8'), {
    addEventListener: (_, fn) => { handler = fn; }, Response, URL,
  });
  await edge.route('https://concert-edge.test/**', async route => {
    let response;
    handler({request: new Request(route.request().url()), respondWith: value => { response = value; }});
    await route.fulfill({status: response.status, headers: Object.fromEntries(response.headers), body: await response.text()});
  });
  const worker = await visit(edge, {url: 'https://concert-edge.test/'});
  await play(worker);
  console.log('built Edge worker: full win and replay from intercepted Worker responses');
  await edge.close();
}

async function main() {
  const browser = await chromium.launch({
    channel: 'chrome',
    args: ['--autoplay-policy=no-user-gesture-required'],
  });
  try {
    const desktop = await browser.newContext({viewport: {width: 1120, height: 850}});
    const first = await visit(desktop);
    await play(first);
    await first.page.close();
    if (!real) {
      for (const kind of ['idle', 'blackout']) {
        const other = await visit(desktop);
        await play(other, kind);
        await other.page.close();
      }
      await mobileChecks(browser);
      await packageChecks(browser);
    }
  } finally {
    await browser.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
