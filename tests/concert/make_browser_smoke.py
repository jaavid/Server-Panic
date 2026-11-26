"""Create a self-contained, accelerated offline browser QA page."""
from pathlib import Path

source = Path('dist-offline/arvan-shahr-concert.html')
inject = """<script>
let pending, now=0;
window.requestAnimationFrame=callback=>{pending=callback;return 1;};
const errors=[];
window.addEventListener('error',event=>errors.push(event.message));
setTimeout(()=>{
 const read=id=>document.getElementById(id);
 const stage=read('stage');
 const press=id=>{
   const button=read(id);
   if(button.hidden||button.disabled)return false;
   button.click();
   return true;
 };
 const rack=index=>document.querySelector('[data-node="'+index+'"]').click();
 const focus=zone=>document.querySelector('[data-zone="'+zone+'"]').click();
 const frame=ms=>{const callback=pending;pending=null;callback(now+=ms);};
 const check=(value,label)=>{if(!value)throw Error(label);};
 try {
  frame(1);
  check(document.documentElement.scrollWidth<=innerWidth,'horizontal overflow');
  press('start');
  check(stage.dataset.phase==='training'&&press('route'),'start with a real packet');
  let sent=false, backed=false;
  for(let time=1;time<=420;time++) {
   frame(1000);
   if(stage.dataset.phase==='result')break;
   if(time===10){
    press('pause');frame(1000);
    check(read('clock').textContent==='۰۶:۵۰','pause');
    press('start');
   }
   if(time===96){focus('data');rack(1);sent=press('drone');}
   if(time===231){focus('data');rack(2);press('drone');}
   if(!read('decision').hidden)press(time<200?'policy-entry':'policy-stream');
   if(time===302){
    check(stage.dataset.broadcast==='outage','outage');
    focus('control');backed=press('backup');
   }
   if(time===307)check(stage.dataset.broadcast==='backup','backup');
   if(time===31||time===305){focus('venue');press('audience');}
   if(time%6===0||time%3===0&&time>=374&&time<402){
    focus('data');
    const available=document.querySelector('[data-node][data-status=free]');
    if(available){available.click();press('route');}
   }
  }
  check(sent&&backed,'drone and backup');
  check(stage.dataset.result==='win'&&!read('summary').hidden,'victory and summary');
  press('start');
  check(stage.dataset.phase==='training'&&read('clock').textContent==='۰۷:۰۰','replay');
  check(errors.length===0,'page errors: '+errors.join(', '));
  document.body.dataset.qa='pass';
 } catch (error) { document.body.dataset.qa='fail: '+error.message; }
},500);
</script>"""
html = source.read_text()
Path('dist-offline/concert-smoke.html').write_text(
    html.replace('<script type="module">', inject + '<script type="module">', 1), encoding='utf-8')
