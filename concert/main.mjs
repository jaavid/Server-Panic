import {createMission,command,tick,DURATION,NODES} from './mission.mjs';
import {city} from './city.mjs';
const byId=id=>document.getElementById(id);
const ui=Object.fromEntries(['world','clock','stream','trust','scores','alert','selection','detail','route','drone','backup','decision','node-picks','policy-entry','policy-stream','overlay','overlay-title','overlay-kicker','overlay-copy','start','pause','mute','zoom'].map(k=>[k,byId(k)]));
const f=new Intl.NumberFormat('fa-IR',{useGrouping:false});
const timeFormat=new Intl.NumberFormat('fa-IR',{minimumIntegerDigits:2,useGrouping:false});
const clock=x=>timeFormat.format(Math.floor(x/60))+':'+timeFormat.format(x%60);
let s=createMission(), live=false, paused=false, muted=true, zoomed=false, selected=0, zone='data', remaining=0, frameTime=0, sound, animation=0;
const zones=[...document.querySelectorAll('[data-zone]')], nodes=[...document.querySelectorAll('[data-node]')];
const bootCopy=ui['overlay-copy'].textContent;
const view=city(ui.world,select);
function select(z,id){
  if(!live||paused||s.result)return;
  zone=z; if(Number.isInteger(id))selected=id;
  zones.forEach(n=>n.setAttribute('aria-pressed',String(n.dataset.zone===z)));
  nodes.forEach(n=>n.setAttribute('aria-pressed',String(Number(n.dataset.node)===selected)));
  view.focus(zone);
  update();
}
const set=(el,t)=>{if(el.textContent!==t)el.textContent=t;};
function update(){
  const playing=live&&!paused&&!s.result;
  const n=s.nodes[selected];
  const remainingDrone=Math.max(0,s.drone.ready-s.time);
  set(ui.clock,clock(DURATION-s.time));
  set(ui.stream,!live?'آماده':s.quality===0?'قطع شده':s.backup.active?'پشتیبان':s.quality<70?'ناپایدار':'برقرار');
  ui.stream.className=s.quality<70?'danger':'healthy';
  set(ui.trust,f.format(Math.ceil(s.trust))+'٪');
  set(ui.scores,f.format(s.queue.length)+' / '+f.format(s.score));
  set(ui.alert,live?s.alert:'آمادهٔ شروع مأموریت');
  set(ui.selection,zone==='data'?'رک '+NODES[selected]+' · '+(n.offline?'خارج از مدار':n.work?'مشغول':'آماده')+' · '+f.format(n.heat)+'°':zone==='control'?'مرکز کنترل · مسیرهای پخش':'محوطهٔ کنسرت · ظرفیت پخش '+f.format(s.quality)+'٪');
  set(ui.detail,s.drone.target>=0?'پهپاد در راه':remainingDrone?'پهپاد: '+f.format(remainingDrone)+' ثانیه تا شارژ':'پهپاد آماده');
  ui['node-picks'].hidden=zone!=='data';
  ui.route.disabled=!playing||zone!=='data'||!s.queue.length||n.offline||n.work>0;
  ui.drone.disabled=!playing||zone!=='data'||remainingDrone>0||(!n.offline&&n.heat<35);
  ui.backup.disabled=!playing||zone!=='control'||!s.outage||Boolean(s.backup.arrive)||s.backup.active;
  ui.decision.hidden=!playing||!s.decision;
  ui.pause.disabled=!live||Boolean(s.result);
  zones.forEach(node=>node.disabled=!playing);
  nodes.forEach(node=>node.disabled=!playing);
  document.querySelector('.stage').dataset.broadcast=s.quality===0?'outage':s.backup.active?'backup':'primary';
}
function audioTone(hz=480,length=.15,gain=.045){
  if(muted)return;
  try{
    sound??=new AudioContext();
    if(sound.state==='suspended')sound.resume().catch(()=>{});
    const t=sound.currentTime, osc=sound.createOscillator(), v=sound.createGain();
    osc.type='sine';osc.frequency.value=hz;
    v.gain.setValueAtTime(.0001,t);v.gain.exponentialRampToValueAtTime(gain,t+.018);v.gain.exponentialRampToValueAtTime(.0001,t+length);
    osc.connect(v).connect(sound.destination);osc.start(t);osc.stop(t+length);
  }catch{/* audio is optional */}
}
function finish(){
  let best=s.score;
  try{best=Math.max(best,Number(localStorage.getItem('arvan-concert-best'))||0);localStorage.setItem('arvan-concert-best',String(best));}catch{/* private storage can be disabled */}
  set(ui['overlay-kicker'],'نتیجهٔ مأموریت');
  set(ui['overlay-title'],s.result==='win'?'کنسرت به پایان رسید!':'پخش از دست رفت');
  set(ui['overlay-copy'],(s.result==='win'?'تماشاگران تا پایان همراهت ماندند.':s.trust<=0?'اعتماد تماشاگران به صفر رسید.':'پخش بیش از حد در وضعیت قطع ماند.')+' امتیاز: '+f.format(s.score)+' · رکورد: '+f.format(best)+' · بستهٔ پردازش‌شده: '+f.format(s.served));
  set(ui.start,'بازی دوباره');ui.overlay.hidden=false;ui.start.focus();
  audioTone(s.result==='win'?780:200,.7);
}
function start(){
  if(live&&!paused&&!s.result)return;
  if(paused){togglePause();return;}
  s=createMission(crypto.getRandomValues(new Uint32Array(1))[0]); live=true; paused=false; remaining=0;
  ui.overlay.hidden=true; set(ui.pause,'مکث');
  select('data',0); audioTone(480); zones[1].focus();
}
function togglePause(){
  if(!live||s.result)return;
  paused=!paused; remaining=0;
  ui.overlay.hidden=!paused; set(ui.pause,paused?'ادامه':'مکث');
  if(paused){set(ui['overlay-kicker'],'مأموریت متوقف است');set(ui['overlay-title'],'استراحت کوتاه');set(ui['overlay-copy'],bootCopy);set(ui.start,'ادامهٔ مأموریت');ui.start.focus();}
  else ui.pause.focus();
  update();
}
function run(action,arg){
  if(!live||paused||s.result)return;
  if(command(s,action,arg))audioTone(action==='backup'?680:410);
  update();
}
zones.forEach(n=>n.addEventListener('click',()=>select(n.dataset.zone)));
nodes.forEach(n=>n.addEventListener('click',()=>select('data',Number(n.dataset.node))));
ui.route.addEventListener('click',()=>run('route',selected));
ui.drone.addEventListener('click',()=>run('drone',selected));
ui.backup.addEventListener('click',()=>run('backup'));
ui['policy-entry'].addEventListener('click',()=>run('policy','entry'));
ui['policy-stream'].addEventListener('click',()=>run('policy','stream'));
ui.start.addEventListener('click',start);
ui.pause.addEventListener('click',togglePause);
ui.mute.addEventListener('click',()=>{muted=!muted;ui.mute.setAttribute('aria-pressed',String(muted));set(ui.mute,'صدا: '+(muted?'قطع':'روشن'));audioTone(580);});
ui.zoom.addEventListener('click',()=>{zoomed=!zoomed;ui.zoom.setAttribute('aria-pressed',String(zoomed));set(ui.zoom,zoomed?'زوم −':'زوم +');view.zoom(zoomed);});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&live&&!paused&&!s.result)togglePause();});
function frame(now){
  const dt=frameTime?Math.min(1000,now-frameTime):0; frameTime=now;
  if(!paused)animation+=dt/1000;
  if(live&&!paused&&!s.result){
    remaining+=dt;
    while(remaining>=1000&&!s.result){
      remaining-=1000;
      const outage=s.quality===0, event=s.event, warning=s.warned;
      tick(s);
      if(s.result)finish();
      else if(event!==s.event||warning!==s.warned||outage!==(s.quality===0))audioTone(s.quality===0?255:570,.32);
      else if(s.time%2===0)audioTone([164,196,220,196][Math.floor(s.time/2)%4],.36,.014);
      update();
    }
  }
  view.render(s,selected,zone,s.time+remaining/1000,animation);
  requestAnimationFrame(frame);
}
update();requestAnimationFrame(frame);
