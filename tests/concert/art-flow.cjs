const assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const address = process.env.CONCERT_URL || 'http://127.0.0.1:8772/concert/';

async function run() {
  const browser = await chromium.launch({channel:'chrome'});
  try {
    for (const [scenario,width,height] of [
      ['rich',360,800],['rich',1440,900],['blocked',360,800],['blocked',1440,900],
      ['corrupt',360,800],['slow',360,800],['opt-out',1440,900],['no-webgl',360,800],
    ]) {
      const context = await browser.newContext({
        viewport:{width,height},hasTouch:width===360,isMobile:width===360,deviceScaleFactor:1,
        reducedMotion:'reduce',
      });
      const page = await context.newPage();
      const requests = [], errors = [];
      page.on('request', req => requests.push(new URL(req.url())));
      page.on('pageerror', err => errors.push(err.message));
      if (scenario === 'no-webgl') await page.addInitScript(() => {
        const get=HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext=function(kind,...args){
          return kind.startsWith('webgl')?null:get.call(this,kind,...args);
        };
      });
      if (['blocked','corrupt','slow'].includes(scenario)) {
        await page.route('**/art-preview/audience.glb', async route => {
          if (scenario === 'blocked') return route.abort();
          if (scenario === 'slow') {
            await new Promise(resolve=>setTimeout(resolve,4300));
            return route.abort().catch(()=>{});
          }
          return route.fulfill({contentType:'model/gltf-binary',body:'broken'});
        });
      }
      await page.goto(address+(scenario==='opt-out'?'?art=off':''));
      await page.locator('#opening-skip').click();
      if (scenario === 'rich') await page.locator('#world[data-art=blender]').waitFor();
      else if (['blocked','corrupt','slow'].includes(scenario)) {
        const reason=scenario==='slow'?'timeout':'invalid-or-missing';
        await page.locator('#world[data-art=fallback][data-art-failure="'+reason+'"]').waitFor();
      } else assert.equal(await page.locator('#world').getAttribute('data-art'),'fallback');
      const next = selector => width===360 ? page.locator(selector).tap() : page.locator(selector).click();
      await next('#venue');
      await next('[data-node="0"]');
      await page.waitForFunction(()=>document.getElementById('guide').textContent.includes('وارد پخش شد'));
      const verify = await page.evaluate(async () => {
        const faces = await document.fonts.load('750 16px "Noto Sans Arabic"', 'شب کنسرت');
        return {
          models:document.getElementById('world').dataset.models ?? '',
          weights:['#goal','#guide','.marker small'].map(selector=>getComputedStyle(document.querySelector(selector)).fontWeight),
          font:faces.some(face=>face.status==='loaded'&&face.weight==='400 800'),
          scroll:document.documentElement.scrollWidth,
        };
      });
      assert.ok(verify.font);
      assert.deepEqual(verify.weights,['750','650','450']);
      assert.equal(Boolean(verify.models),scenario==='rich');
      assert.ok(verify.scroll<=width);
      assert.ok(requests.every(req=>req.origin===new URL(address).origin || req.protocol==='data:'));
      if (['opt-out','no-webgl'].includes(scenario)) assert.ok(requests.every(req=>!req.pathname.includes('/art-preview/')));
      assert.deepEqual(errors,[]);
      console.log(scenario,width+'×'+height,'verified first route, local variable font and asset guard');
      await context.close();
    }
  } finally { await browser.close(); }
}
run().catch(error=>{console.error(error);process.exitCode=1;});
