"""Create an accelerated QA page from the self-contained offline game."""
from pathlib import Path

source = Path('dist-offline/arvan-shahr-concert.html')
inject = """<script>
let pending, now=0;
window.requestAnimationFrame=callback=>{pending=callback;return 1;};
const errors=[];
window.addEventListener('error',event=>errors.push(event.message));
setTimeout(()=>{
 const get=id=>document.getElementById(id);
 const stage=get('stage');
 const press=id=>get(id).click();
 const rack=id=>document.querySelector('[data-node="'+id+'"]');
 const frame=ms=>{const callback=pending;pending=null;callback(now+=ms);};
 const check=(value,label)=>{if(!value)throw Error(label);};
 try {
  frame(1);
  check(document.documentElement.scrollWidth<=innerWidth,'horizontal overflow');
  check(stage.dataset.phase==='intro'&&!get('opening-continue').hidden,'story fallback');
  press('opening-continue');
  press('venue');
  check(get('clock').textContent==='۰۷:۰۰','unarmed clock');
  rack(2).click();
  for(let time=1;time<=420;time++) {
   frame(1000);
   if(stage.dataset.phase==='result')break;
   if(time===10){
    press('pause');frame(1000);
    check(get('clock').textContent==='۰۶:۵۰','pause');
    press('start');
   }
   if(time===96){press('drone');rack(1).click();}
   if(time===101)check(get('guide').textContent.includes('پهپاد برگشت'),'repair');
   if(time===231&&!get('drone').hidden){press('drone');rack(2).click();}
   if(!get('decision').hidden)press(time<200?'policy-entry':'policy-stream');
   if(time===302){
    check(stage.dataset.broadcast==='outage','outage');
    press('control');
   }
   if(time===307)check(stage.dataset.broadcast==='backup','backup');
   if(time===31||time===305)press('venue');
   const urgent=get('queue').textContent.includes('فوری');
   if(time%6===0||urgent||time>=374&&time<402&&time%3===0){
    const target=(urgent?[0,1,2]:[2,1,0]).map(rack)
      .find(el=>el.getAttribute('aria-disabled')==='false'&&el.dataset.status!=='hot');
    if(target)target.click();
   }
  }
  check(stage.dataset.result==='win'&&!get('summary').hidden,'victory and summary');
  press('start');
  check(stage.dataset.phase==='training'&&!get('venue').hidden&&get('clock').textContent==='۰۷:۰۰','replay');
  check(errors.length===0,'page errors: '+errors.join(', '));
  document.body.dataset.qa='pass';
 } catch (error) { document.body.dataset.qa='fail: '+error.message; }
},500);
</script>"""
html = source.read_text()
Path('dist-offline/concert-smoke.html').write_text(
    html.replace('<script type="module">', inject + '<script type="module">', 1), encoding='utf-8')
