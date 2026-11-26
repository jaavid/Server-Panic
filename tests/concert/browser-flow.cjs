const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {runInNewContext} = require('node:vm');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const address = process.env.CONCERT_URL || 'http://127.0.0.1:8771/concert/';
const fa = '۰۱۲۳۴۵۶۷۸۹';
const rack = id => '[data-node="' + id + '"]';

async function visit(context, options = {}) {
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(flat => {
    let callback, now = 0;
    window.requestAnimationFrame = next => { callback = next; return 1; };
    window.missionFrames = (count, ms) => {
      for (let i = 0; i < count; i++) {
        const pending = callback;
        callback = null;
        pending(now += ms);
      }
    };
    if (!flat) return;
    const get = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
      return kind.startsWith('webgl') ? null : get.call(this, kind, ...args);
    };
  }, Boolean(options.flat));
  await page.goto(options.url || address);
  await page.locator('#stage:is([data-phase=intro],[data-phase=menu])').waitFor({state: 'attached'});
  const phase = () => page.locator('#stage').getAttribute('data-phase');
  const step = (count = 1, ms = 1000) => page.evaluate(([count, ms]) => window.missionFrames(count, ms), [count, ms]);
  const click = selector => options.touch ? page.locator(selector).tap({timeout: 3000}) :
    page.locator(selector).click({timeout: 3000});
  const ready = async selector => await page.locator(selector).getAttribute('aria-disabled') === 'false';
  const elapsed = async () => {
    const [minutes, seconds] = (await page.locator('#clock').textContent()).replace(/[۰-۹]/g, c => fa.indexOf(c)).split(':').map(Number);
    return 420 - minutes * 60 - seconds;
  };
  await step(1, 1);
  if (await phase() === 'intro') {
    if (options.noMedia) {
      assert.ok(await page.locator('#opening-continue').isVisible());
      assert.equal(await page.locator('#opening-video').getAttribute('src'), null);
    }
    await click('#opening-skip');
  } else await click('#start');
  await step(1, 16);
  return {page, errors, phase, step, click, ready, elapsed};
}

async function start(run, id) {
  const {page, phase, step, click, elapsed} = run;
  assert.equal(await phase(), 'training');
  assert.equal(await page.locator('#map-controls button:visible').count(), 1);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'venue');
  assert.match(await page.locator('#goal').textContent(), /۷ دقیقه/);
  await step(8);
  assert.equal(await elapsed(), 0);
  await click('#venue');
  assert.equal(await page.locator('#map-controls button:visible').count(), 2);
  assert.match(await page.locator(rack(0)).textContent(), /۲ث.*داغ‌تر/);
  assert.match(await page.locator(rack(2)).textContent(), /۴ث.*خنک‌تر/);
  await step(8);
  assert.equal(await elapsed(), 0);
  await click(rack(id));
  assert.equal(await phase(), 'playing');
  assert.match(await page.locator('#guide').textContent(), /در راه/);
}

async function play(run, kind = 'win', first = 2) {
  const {page, errors, phase, step, click, ready, elapsed} = run;
  await start(run, first);
  let repaired = false, backup = false, informed = false;
  for (let i = 1; i <= 420; i++) {
    await step();
    if (await phase() === 'result') break;
    if (kind === 'idle') continue;
    const time = await elapsed();
    if (time === 10) {
      await click('#pause');
      const frozen = await elapsed();
      await step(8);
      assert.equal(await elapsed(), frozen);
      await click('#start');
    }
    if (time === 96 && await page.locator('#drone').isVisible()) {
      await click('#drone');
      await click(rack(1));
      assert.match(await page.locator('#guide').textContent(), /پهپاد در راه.*باران/);
      repaired = true;
    }
    if (time === 101 && repaired) assert.match(await page.locator('#guide').textContent(), /پهپاد برگشت/);
    if (time === 231 && await page.locator('#drone').isVisible()) {
      await click('#drone');
      if (await ready(rack(2))) await click(rack(2));
      else await click('#drone');
    }
    if (await page.locator('#decision').isVisible()) await click(time < 200 ? '#policy-entry' : '#policy-stream');
    if (time === 302) {
      assert.equal(await page.locator('#stage').getAttribute('data-broadcast'), 'outage');
      if (kind !== 'blackout') {
        assert.ok(await ready('#control'));
        await click('#control');
        backup = true;
      }
    }
    if (time === 307 && backup) assert.equal(await page.locator('#stage').getAttribute('data-broadcast'), 'backup');
    if (!informed && (time === 31 || time === 305) && await ready('#venue')) {
      await click('#venue');
      informed = true;
    }
    const urgent = (await page.locator('#queue').textContent()).includes('فوری');
    if (time % 6 === 0 || urgent || time >= 374 && time < 402 && time % 3 === 0) {
      for (const target of urgent ? [0, 1, 2] : [2, 1, 0]) {
        const marker = page.locator(rack(target));
        if (await ready(rack(target)) && await marker.getAttribute('data-status') !== 'hot') {
          await click(rack(target));
          break;
        }
      }
    }
  }
  assert.equal(await phase(), 'result');
  assert.equal(await page.locator('#stage').getAttribute('data-result'), kind === 'win' ? 'win' : 'loss');
  assert.ok(await page.locator('#summary').isVisible());
  assert.deepEqual(errors, []);
  if (kind === 'win') {
    assert.equal(await elapsed(), 420);
    assert.ok(repaired && backup && informed);
  } else if (kind === 'blackout') {
    assert.equal(await elapsed(), 328);
    assert.match(await page.locator('#overlay-copy').textContent(), /مهلت قطع پخش/);
  } else assert.match(await page.locator('#overlay-copy').textContent(), /اعتماد/);
  console.log(kind, await elapsed(), 'mission seconds');
  await click('#start');
  assert.equal(await phase(), 'training');
  assert.equal(await elapsed(), 0);
  assert.equal(await page.locator('#opening').isVisible(), false);
  assert.ok(await page.locator('#venue').isVisible());
}

async function layouts(browser) {
  for (const [width, height] of [[360, 800], [1440, 900]]) {
    const context = await browser.newContext({
      viewport: {width, height}, hasTouch: width < 500, isMobile: width < 500, deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    });
    const {page, step, phase, elapsed} = await visit(context);
    assert.equal(await page.locator('.fallback').count(), 0);
    const geometry = async selector => page.evaluate(selector => {
      const canvas = document.getElementById('world').getBoundingClientRect();
      const target = document.querySelector(selector).getBoundingClientRect();
      return {canvasArea: canvas.width * canvas.height / (innerWidth * innerHeight), scroll: document.documentElement.scrollWidth,
        width: innerWidth, onCanvas: target.x >= 0 && target.right <= innerWidth && target.y > innerHeight * .13 &&
        target.bottom <= innerHeight * .85, tappable: target.height >= 44};
    }, selector);
    const boxes = await geometry('#venue');
    assert.ok(boxes.canvasArea >= .98 && boxes.onCanvas && boxes.tappable && boxes.scroll <= boxes.width);
    if (width < 500) await page.locator('#venue').tap();
    else await page.keyboard.press('Enter');
    for (const id of [0, 2]) {
      const target = await geometry(rack(id));
      assert.ok(target.onCanvas && target.tappable);
    }
    const [fast,cool] = await Promise.all([page.locator(rack(0)).boundingBox(),page.locator(rack(2)).boundingBox()]);
    assert.ok(fast.x + fast.width < cool.x || cool.x + cool.width < fast.x);
    if (width < 500) await page.locator(rack(0)).tap();
    else await page.keyboard.press('Enter');
    assert.equal(await phase(), 'playing');
    assert.equal(await elapsed(), 0);
    await step(6);
    assert.match(await page.locator('#guide').textContent(), /فوری.*۳ ثانیه/);
    if (width < 500) await page.locator(rack(0)).tap();
    else {
      await page.locator(rack(2)).focus();
      await page.keyboard.press('Enter');
    }
    await step(width < 500 ? 2 : 4);
    assert.match(await page.locator('#guide').textContent(), width < 500 ? /وارد پخش/ : /دیر رسید/);
    console.log(width + '×' + height, 'full-viewport map with distinct visible controls;',
      width < 500 ? 'touch chose the express route on time' : 'keyboard chose the cooler route and missed the live deadline');
    await context.close();
  }
}

async function packages(browser) {
  const offline = await browser.newContext({viewport:{width:360,height:800}, offline:true});
  let requests = 0;
  offline.on('request', req => { if (/^https?:/.test(req.url())) requests++; });
  const flat = await visit(offline, {
    url:pathToFileURL(resolve('dist-offline/arvan-shahr-concert.html')).href, flat:true, noMedia:true,
  });
  assert.ok(await flat.page.locator('#stage[data-flat]').isVisible());
  await play(flat);
  assert.equal(requests, 0);
  await offline.close();
  console.log('Standalone file completed flat-map win and replay with zero HTTP requests.');

  const edge = await browser.newContext({viewport:{width:390,height:844}});
  let handler;
  runInNewContext(readFileSync('dist-edge/arvan-shahr-concert.worker.js','utf8'), {
    addEventListener: (_, fn) => { handler = fn; }, Response, URL,
  });
  await edge.route('https://concert-edge.test/**', async route => {
    let response;
    handler({request:new Request(route.request().url()),respondWith:value=>{response=value;}});
    await route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:await response.text()});
  });
  await play(await visit(edge,{url:'https://concert-edge.test/',noMedia:true}));
  console.log('Built Edge worker completed local win and replay.');
  await edge.close();
}

(async () => {
  const browser = await chromium.launch({channel:'chrome'});
  try {
    const context = await browser.newContext({viewport:{width:1060,height:820}});
    for (const kind of ['win','idle','blackout']) {
      const run = await visit(context);
      await play(run,kind);
      await run.page.close();
    }
    await context.close();
    await layouts(browser);
    const mobile = await browser.newContext({
      viewport:{width:360,height:800}, hasTouch:true, isMobile:true, deviceScaleFactor:1,
    });
    await play(await visit(mobile,{touch:true}));
    await mobile.close();
    console.log('360×800: complete WebGL mission with touch dispatch, drone targeting, backup and replay.');
    await packages(browser);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
