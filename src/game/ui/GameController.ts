import { GameSimulation } from '../systems/GameSimulation.js';
import type { GameEvent } from '../systems/GameSimulation.js';
import type { RenderPort } from '../renderers/CanvasRenderer.js';
import { LocalScoreStore } from '../../services/ScoreStorage.js';
import { SoundManager } from '../../services/SoundManager.js';

const store = new LocalScoreStore();
const formatInt = (n: number): string => Math.round(n).toLocaleString('en-US');
export class GameController {
  private simulation: GameSimulation;
  private renderer: RenderPort;
  private sound = new SoundManager();
  private root: HTMLElement;
  private mode: 'menu' | 'tutorial' | 'playing' | 'results' = 'menu';
  private coolingMode = false;
  private lastTime = 0;
  private raf = 0;
  private lastHudAt = 0;
  private resultShown = false;
  constructor(root: HTMLElement, renderer: RenderPort) {
    this.root = root;
    this.renderer = renderer;
    this.simulation = new GameSimulation();
    renderer.onRackTap = id => this.handleRackTap(id);
    root.addEventListener('click', event => {
      const target = event.target as Element;
      const element = target.closest<HTMLElement>('[data-action]');
      if (!element) return;
      const action = element.dataset.action;
      if (action === 'play') this.play();
      else if (action === 'tutorial') this.showTutorial();
      else if (action === 'back') this.showMenu();
      else if (action === 'cool') this.armCooling();
      else if (action === 'mute') { this.sound.toggle();this.syncSound(); }
      else if (action?.startsWith('rack')) this.handleRackTap(Number(action.slice(4))); 
    });
    this.showMenu();
    this.loop = this.loop.bind(this);
    this.raf=requestAnimationFrame(this.loop);

  }
  destroy():void { cancelAnimationFrame(this.raf);this.renderer.destroy(); }
  private $(id: string): HTMLElement { const el=this.root.querySelector<HTMLElement>(`#${id}`);if(!el) throw new Error(`Missing #${id}`);return el; }
  private showMenu(): void {
    this.mode='menu';this.$('panel-menu').hidden=false;this.$('panel-tutorial').hidden=true;
    this.$('panel-results').hidden=true;this.$('gameplay-actions').hidden=true;
    this.$('status-message').textContent='SYSTEMS NOMINAL';
    this.$('best-menu').textContent=formatInt(store.getBest());this.refresh();
  }
  private showTutorial():void {
    this.mode='tutorial';this.$('panel-menu').hidden=true;this.$('panel-tutorial').hidden=false;
    this.$('panel-results').hidden=true;
  }
  private play():void {
    this.simulation = new GameSimulation((Date.now() ^ (Math.random()*0x7fffffff))>>>0);
    this.simulation.start();
    this.simulation.drainEvents();
    this.mode='playing';this.coolingMode=false;this.resultShown=false;
    this.$('panel-menu').hidden=true;this.$('panel-tutorial').hidden=true;this.$('panel-results').hidden=true;
    this.$('gameplay-actions').hidden=false;
    this.$('status-message').textContent='تمام سرورها آنلاین هستند';
    this.sound.play('tap');this.refresh();
  }
  private armCooling():void {
    if(this.mode!=='playing')return;
    if(this.simulation.snapshot().coolingReadyIn>0)return;
    this.coolingMode=!this.coolingMode;
    this.sound.play('tap');this.refresh();
  }
  private handleRackTap(id:number):void {
    if(this.mode!=='playing')return;
    if(this.coolingMode) {
      if(this.simulation.cool(id)) {this.sound.play('cool');this.coolingMode=false;this.$('status-message').textContent='خنک‌سازی موفق!';}
      else {this.$('status-message').textContent='سرور خاموش است یا پهپاد آماده نیست';this.sound.play('fail');}
    } else if(this.simulation.route(id)) {this.sound.play('tap');this.$('status-message').textContent='درخواست در حال پردازش…';}
    else {this.$('status-message').textContent='سرور مشغول/آفلاین است یا صف خالی است';this.sound.play('fail');}
    this.refresh();
  }
  private onEnd():void {
    if(this.resultShown)return;
    this.resultShown=true;
    const s=this.simulation.snapshot();const best=store.save(s.score);
    this.mode='results';this.coolingMode=false;
    this.$('panel-results').hidden=false;this.$('gameplay-actions').hidden=true;
    this.$('result-eyebrow').textContent=s.phase==='won'?'MISSION COMPLETED':'SYSTEM FAILURE';
    this.$('result-title').textContent=s.phase==='won'?'مرکز داده نجات پیدا کرد!':'اوه نه! سرورها تسلیم شدند';
    this.$('result-description').textContent=s.endedBecause;
    this.$('result-score').textContent=formatInt(s.score);this.$('result-best').textContent=formatInt(best);
    this.$('result-processed').textContent=formatInt(s.processed);
    this.$('result-recovered').textContent=formatInt(s.recovered);
    this.$('result-combo').textContent=`×${s.maxCombo}`;
    this.$('result-badge').textContent=s.score>=best&&s.score>0?'رکورد جدید!':'RUN COMPLETE';
    this.sound.play(s.phase==='won'?'win':'fail');
    this.refresh();
  }
  private handleEvents(events: readonly GameEvent[]): void {
    for(const e of events) {
      if(e.type==='processed') {this.sound.play('success');this.$('status-message').textContent=`درخواست تحویل شد! +${e.points}`;}
      else if(e.type==='fail') {this.sound.play('fail');this.$('status-message').textContent='هشدار! یک سرور از کار افتاد';}
      else if(e.type==='recover') {this.sound.play('success');this.$('status-message').textContent='سرور بازیابی شد';}
      else if(e.type==='level') {this.sound.play('level');this.$('status-message').textContent='افزایش ترافیک شبکه!';}
      else if(e.type==='end') this.onEnd();
    }
  }
  private syncSound():void {this.$('sound-label').textContent=this.sound.isMuted?'صدا خاموش':'صدا روشن';this.$('sound-icon').textContent=this.sound.isMuted?'◌':'♫';}
  private refresh():void {
    const s=this.simulation.snapshot();
    this.$('hud-score').textContent=formatInt(s.score);
    this.$('hud-time').textContent=String(Math.ceil(s.remaining)).padStart(2,'0');
    this.$('hud-combo').textContent=`×${Math.max(1,s.combo)}`;
    this.$('hud-level').textContent=String(s.level+1).padStart(2,'0');
    this.$('timer-fill').style.width=`${Math.max(0,100*s.remaining/this.simulation.config.duration)}%`;
    const queue=this.$('queue-packets');queue.replaceChildren();
    for(let i=0;i<this.simulation.config.queueCapacity;i++) {
      const packet=s.queue[i];const el=document.createElement('span');
      el.className=`queue-packet ${packet?'is-ready '+(packet.kind==='priority'?'is-priority':''):''}`;
      el.textContent=packet?(packet.kind==='priority'?'◆':'▪'):'·';
      el.setAttribute('aria-label',packet?(packet.kind==='priority'?'درخواست ویژه':'درخواست عادی'):'جای خالی');
      queue.appendChild(el);
    }
    this.$('queue-count').textContent=`${s.queue.length}/${this.simulation.config.queueCapacity}`;
    this.$('queue-warning').hidden=s.queue.length<this.simulation.config.queueCapacity-2;
    const available=s.coolingReadyIn<=0;
    const cool=this.$('cool-button') as HTMLButtonElement;
    cool.disabled=!available;cool.classList.toggle('is-armed',this.coolingMode);
    this.$('cool-state').textContent=available?(this.coolingMode?'سرور هدف را انتخاب کن':'آمادهٔ اعزام'):`${s.coolingReadyIn.toFixed(1)}s تا شارژ`;
    this.$('cool-icon').textContent=this.coolingMode?'◎':'❄';
    this.$('cool-progress').style.width=`${available?100:100*(1-s.coolingReadyIn/this.simulation.config.coolingCooldown)}%`;
    this.$('stage-label').textContent=this.coolingMode?'حالت خنک‌سازی: سرور را لمس کن':'سروری را برای پردازش انتخاب کن';
    this.$('stage-label').classList.toggle('is-cooling',this.coolingMode);
    const rackCards=this.root.querySelectorAll<HTMLElement>('[data-rack]');
    rackCards.forEach((el,i)=>{
      const r=s.racks[i];if(!r)return;
      const val=Math.round(r.temperature);
      el.querySelector<HTMLElement>('.rack-temp')!.textContent=`${val}°`;
      el.querySelector<HTMLElement>('.rack-heat-fill')!.style.width=`${Math.min(100,val)}%`;
      el.classList.toggle('is-hot',r.temperature>=this.simulation.config.warnTemperature);
      el.classList.toggle('is-offline',!r.online);
      el.querySelector<HTMLElement>('.rack-state')!.textContent=!r.online?'آفلاین':r.pending?'پردازش':r.temperature>=66?'داغ':'پایدار';
    });
  }
  private loop(time:number):void {
    const dt=this.lastTime?Math.min(.2,(time-this.lastTime)/1000):0;this.lastTime=time;
    if(this.mode==='playing')this.simulation.advance(dt);
    const events=this.simulation.drainEvents();
    if(events.length)this.handleEvents(events);
    if(time-this.lastHudAt>85){this.refresh();this.lastHudAt=time;}
    this.renderer.render(this.simulation.snapshot(),events);
    this.raf=requestAnimationFrame(this.loop);
  }
}
