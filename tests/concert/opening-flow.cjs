const assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const address = process.env.CONCERT_URL || 'http://127.0.0.1:8770/concert/';
const within = async (page, ...ids) => page.evaluate(selectors =>
  document.documentElement.scrollWidth <= innerWidth && selectors.every(selector => {
    const box = document.querySelector(selector).getBoundingClientRect();
    return box.width > 0 && box.top >= 0 && box.bottom <= innerHeight;
  }), ids);
const active = page => page.evaluate(() => document.activeElement.id);
const displayedClock = page => page.locator('#clock').textContent();

async function verify() {
  const browser = await chromium.launch({channel: 'chrome'});
  try {
    const fresh = await browser.newContext({viewport: {width: 360, height: 800}, isMobile: true, hasTouch: true});
    const page = await fresh.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(address);
    await page.locator('#opening-skip').waitFor();
    assert.equal(await active(page), 'opening-skip');
    assert.ok(await within(page, '#opening-skip', '#opening-title', '#opening-play'));
    assert.match(await page.locator('.opening-story').textContent(), /مسئول پخش زنده/);
    await page.waitForFunction(() => document.getElementById('opening-video').currentTime > .25);
    assert.equal(await page.locator('#opening-video').evaluate(video => video.muted), true);
    assert.equal(await displayedClock(page), '۰۷:۰۰');
    await page.locator('#opening-play').focus();
    await page.keyboard.press('Space');
    const paused = await page.locator('#opening-video').evaluate(video => video.currentTime);
    await page.waitForTimeout(300);
    assert.equal(await page.locator('#opening-video').evaluate(video => video.currentTime), paused);
    await page.keyboard.press('Space');
    await page.waitForFunction(() => document.getElementById('opening-caption').textContent.includes('ایستگاه‌ها'));
    await page.waitForFunction(() => document.getElementById('opening-video').ended);
    assert.equal(await displayedClock(page), '۰۷:۰۰');
    assert.ok(await within(page, '#opening-continue'));
    await page.locator('#opening-continue').tap();
    assert.equal(await active(page), 'first-signal');
    assert.equal(await page.locator('#route').isVisible(), false);
    assert.equal(await page.locator('.status').isVisible(), false);
    assert.ok(await within(page, '#first-title', '#first-signal'));
    await page.waitForTimeout(1200);
    assert.equal(await displayedClock(page), '۰۷:۰۰');
    await page.keyboard.press('Enter');
    assert.equal(await active(page), 'guide');
    assert.match(await page.locator('#guide').textContent(), /سیگنال.*سپهر/);
    await page.waitForFunction(() => document.getElementById('guide').textContent.includes('وارد شبکهٔ پخش شد'));
    assert.notEqual(await displayedClock(page), '۰۷:۰۰');
    await page.reload();
    await page.locator('#stage[data-phase=menu]').waitFor();
    assert.equal(await page.locator('#opening').isVisible(), false);
    await page.locator('#show-opening').tap();
    await page.locator('#opening-skip').tap();
    assert.equal(await active(page), 'first-signal');
    assert.deepEqual(errors, []);
    await fresh.close();
    console.log('Real eight-second video: muted play, keyboard pause, timed caption, end, touch continue, first result and returning visit');

    const reduced = await browser.newContext({viewport: {width: 320, height: 680}, reducedMotion:'reduce', hasTouch: true, isMobile: true});
    const quiet = await reduced.newPage();
    await quiet.goto(address);
    await quiet.locator('#opening-continue').waitFor();
    assert.ok(await within(quiet, '#opening-skip', '#opening-continue'));
    await quiet.waitForTimeout(350);
    assert.equal(await quiet.locator('#opening-video').evaluate(video => video.currentTime), 0);
    await quiet.locator('#opening-skip').tap();
    assert.equal(await active(quiet), 'first-signal');
    await reduced.close();

    for (const delayed of [false, true]) {
      const context = await browser.newContext();
      const fallback = await context.newPage();
      await fallback.route('**/intro-preview/opening.mp4', async route => {
        if (delayed) await new Promise(resolve => setTimeout(resolve, 3200));
        await route.fulfill({status: 404}).catch(() => {});
      });
      await fallback.goto(address);
      await fallback.locator('#opening-continue').waitFor({timeout: 3000});
      assert.equal(await fallback.locator('#opening-video').isVisible(), false);
      assert.equal(await fallback.locator('#opening-still').isVisible(), true);
      assert.match(await fallback.locator('#opening-caption').textContent(), /پهپاد.*پشتیبان/);
      assert.equal(await displayedClock(fallback), '۰۷:۰۰');
      await fallback.locator('#opening-continue').click();
      assert.equal(await active(fallback), 'first-signal');
      await context.close();
    }
    console.log('320px reduced motion, missing video, and slow video all offer a focused first action without starting the timer');
  } finally {
    await browser.close();
  }
}
verify().catch(error => { console.error(error); process.exitCode = 1; });
