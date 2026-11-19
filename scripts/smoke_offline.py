#!/usr/bin/env python3
"""Headless browser E2E smoke using Playwright Python and set_content.
Works where external URLs/localhost and file:// navigation are prohibited.
Replays the real simulation and generates screenshots; no mock HTTP/game API.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'dist-offline/play.html').read_text()
OUT=ROOT/'screenshots';OUT.mkdir(exist_ok=True)
VIEWPORTS=[(360,800),(390,844),(768,1024),(1440,900)]

def put(page,name):
    page.screenshot(path=str(OUT/name),full_page=True)

def start(page):
    page.locator('#panel-menu [data-action="play"]').click()
    assert page.locator('#panel-menu').is_hidden(), 'play button did not start game'
    assert page.locator('canvas').count()==1

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'])
    total=0
    for width,height in VIEWPORTS:
        page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1,is_mobile=width<=390,has_touch=width<=390)
        failures=[]
        page.on('pageerror',lambda error:failures.append(str(error)))
        page.set_content(HTML,wait_until='load',timeout=15000)
        page.wait_for_timeout(160)
        assert page.locator('#panel-menu').is_visible(), 'menu not visible'
        assert page.locator('body').evaluate('(el) => el.scrollWidth <= innerWidth + 2'), 'horizontal overflow'
        if width==390:
            put(page,'menu-mobile.png')
            page.locator('#panel-menu [data-action="tutorial"]').click()
            assert page.locator('#panel-tutorial').is_visible()
            put(page,'tutorial-mobile.png')
            page.locator('#panel-tutorial [data-action="back"]').click()
        start(page)
        page.wait_for_timeout(220)
        assert page.locator('#hud-time').inner_text() in ('89','90')
        assert page.locator('#queue-count').inner_text()=='2/9'
        # Actual user flow: route, completion, cooling drone, cooldown restriction.
        page.locator('[data-action="rack0"]').click()
        page.wait_for_timeout(980)
        assert int(page.locator('#hud-score').inner_text().replace(',',''))>=100, 'request did not score'
        page.locator('[data-action="cool"]').click()
        assert 'حالت خنک' in page.locator('#stage-label').inner_text()
        page.locator('[data-action="rack0"]').click()
        page.wait_for_timeout(100)
        assert page.locator('#cool-button').is_disabled(), 'cooldown not applied'
        # Also test the actual canvas rack target (not just the alternate status button).
        stage=page.locator('canvas')
        rect=stage.bounding_box()
        assert rect is not None
        point={'x':round(rect['width']*.757), 'y':round(rect['height']*.38)}
        if width<=390: stage.tap(position=point)
        else: stage.click(position=point)
        page.wait_for_timeout(1050)
        assert int(page.locator('#hud-score').inner_text().replace(',',''))>=200, 'canvas rack tap did not route and score'
        if width==390: put(page,'gameplay-mobile.png')
        if width==360: put(page,'gameplay-360.png')
        if width==768: put(page,'gameplay-tablet.png')
        if width==1440: put(page,'gameplay-desktop.png')
        assert page.locator('body').evaluate('(el) => el.scrollWidth <= innerWidth + 2'), 'horizontal overflow during gameplay'
        assert not failures, f'Browser script error(s): {failures}'
        print(f'PASS {width}x{height} menu/route/score/cool/cooldown/overflow/no-errors')
        total+=1
        page.close()
    # Real critical state and actual loss are reached by advancing simulation
    # through deterministic simulation time rather than faking API or results.
    page=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True)
    page.set_content(HTML,wait_until='load',timeout=15000)
    # About:blank disables native localStorage. Provide a same-page Storage-compatible
    # store so screenshots can validate the score persistence display semantics.
    page.evaluate('''() => {const values = new Map(); Object.defineProperty(window,'localStorage', {configurable:true, value: {getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v))}})}''')
    start(page)
    page.locator('[data-action="rack0"]').click()
    page.evaluate('''() => {for(let i=0;i<6;i++)serverPanic.simulation.advance(.2);serverPanic.handleEvents(serverPanic.simulation.drainEvents());}''')
    page.evaluate('''() => {
      serverPanic.simulation.racks[0].temperature = 91;
      serverPanic.simulation.racks[2].temperature = 96;
      for(let i=0;i<5;i++)serverPanic.simulation.queue.push({id:100+i,kind:'priority',points:160,heat:1.38});
      serverPanic.simulation.advance(.06);
      serverPanic.refresh();
    }''')
    page.wait_for_timeout(140)
    put(page,'critical-mobile.png')
    page.evaluate('''() => {
      for(let i=0;i<250&&serverPanic.simulation.phase==='playing';i++) serverPanic.simulation.advance(.2);
      serverPanic.handleEvents(serverPanic.simulation.drainEvents());
    }''')
    page.wait_for_timeout(140)
    assert page.locator('#panel-results').is_visible(), 'game over/results not shown'
    assert page.locator('#result-title').inner_text(), 'result title empty'
    assert page.locator('#result-score').inner_text() != '0', 'result should include actual processed score'
    assert page.locator('#result-best').inner_text() != '0', 'best score store was not updated'
    put(page,'results-mobile.png')
    page.locator('#panel-results [data-action="play"]').click()
    assert page.locator('#panel-results').is_hidden(), 'replay did not reset'
    assert page.locator('#hud-score').inner_text()=='0', 'replay score not reset'
    print('PASS critical failure/results/replay flow')
    page.close()
    browser.close()
print('Browser smoke passed:',total,'viewports plus critical/results/replay.')
