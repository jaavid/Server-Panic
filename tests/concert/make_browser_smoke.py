"""Generate an offline browser-only QA copy; the shipped HTML stays unchanged."""
from pathlib import Path
s=Path('dist-offline/arvan-shahr-concert.html').read_text()
inject="""<script>
let pending,now=0,errors=[];
window.addEventListener('error',e=>errors.push(e.message));
window.requestAnimationFrame=cb=>{pending=cb;return 1;};
const frame=(delta)=>{now+=delta;const next=pending;pending=null;next(now);};
setTimeout(()=>{
 const stage=document.querySelector('.stage'), txt=s=>document.querySelector(s).textContent;
 const press=s=>{const x=document.querySelector(s);if(!x || x.disabled || x.hidden)throw Error('inactive '+s);x.click();};
 const advance=n=>{for(let i=0;i<n;i++)frame(1000);};
 const check=(value,msg)=>{if(!value)throw Error(msg);};
 try {
  frame(1);
  check(!document.querySelector('.fallback'),'WebGL2 not rendered');
  check(document.documentElement.scrollWidth<=innerWidth,'horizontal overflow');
  press('#start');advance(6);press('#route');check(txt('#alert').includes('منتقل'),'route');
  press('#pause');advance(6);check(txt('#clock')==='۰۶:۵۴','pause');press('#start');
  advance(90);press('[data-node="1"]');press('#drone');advance(5);
  check(txt('#alert').includes('بازیابی'),'drone');
  advance(44);press('#policy-entry');advance(157);
  check(stage.dataset.broadcast==='outage','outage');press('[data-zone="control"]');press('#backup');advance(5);
  check(stage.dataset.broadcast==='backup','backup');advance(47);press('#policy-stream');advance(66);
  check(txt('#overlay-title').includes('به پایان رسید'),'victory');
  press('#start');check(txt('#clock')==='۰۷:۰۰','retry');check(errors.length===0,'page errors: '+errors.join(', '));
  document.body.dataset.qa='pass';
 } catch (e) { document.body.dataset.qa='fail: '+e.message; }
},500);
</script>"""
Path('dist-offline/concert-smoke.html').write_text(s.replace('<script type="module">',inject+'<script type="module">',1), encoding='utf-8')
