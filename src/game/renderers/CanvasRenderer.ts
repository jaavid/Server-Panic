import type { GameEvent, GameSnapshot, RackStatus } from '../systems/GameSimulation.js';

export interface RenderPort {
  onRackTap: ((id: number) => void) | null;
  render(frame: GameSnapshot, events: readonly GameEvent[]): void;
  destroy(): void;
}
interface FloatingEffect {
  x: number; y: number; born: number; ttl: number; text?: string; color: string;
  vx: number; vy: number; radius: number; type: 'orb' | 'text' | 'spark';
}
interface PacketFlight { fromX: number; fromY: number; toX: number; toY: number; born: number; duration: number; kind: string; }
const POSITIONS = [{ x: 108, y: 76 }, { x: 211, y: 14 }, { x: 318, y: 76 }];
const BG = '#101827';
export class CanvasRenderer implements RenderPort {
  onRackTap: ((id: number) => void) | null = null;
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private images = new Map<string, HTMLImageElement>();
  private effects: FloatingEffect[] = [];
  private flights: PacketFlight[] = [];
  private born = performance.now();
  private droneUntil = 0;
  private droneTarget = 1;
  private flashUntil = 0;
  private shakeUntil = 0;
  private pointer: ((e: PointerEvent) => void);
  constructor(host: HTMLElement) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'game-canvas';
    this.canvas.setAttribute('aria-label', 'سه سرور؛ برای هدایت درخواست روی سرور لمس کنید');
    this.canvas.setAttribute('role', 'button');
    this.canvas.width = 840; this.canvas.height = 920;
    host.appendChild(this.canvas);
    const ctx = this.canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Canvas2D unavailable');
    this.ctx = ctx;
    for (const name of ['floor', 'drone', ...POSITIONS.flatMap((_, i) =>
      ['idle', 'processing', 'overheating', 'critical', 'offline', 'recovery'].map(s => `rack-${i}-${s}`))]) {
      const img = new Image();
      img.src = `./assets/${name}.webp`;
      this.images.set(name, img);
    }
    this.pointer = event => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width * 420;
      const y = (event.clientY - rect.top) / rect.height * 460;
      // In front-to-back order, taps near the server body choose the nearest rack.
      const candidates = POSITIONS.map((p, id) => ({ id, distance: ((x - p.x) / 69) ** 2 + ((y - (p.y + 98)) / 100) ** 2 }));
      candidates.sort((a,b) => a.distance - b.distance);
      if (candidates[0] && candidates[0].distance <= 1.35) this.onRackTap?.(candidates[0].id);
    };
    this.canvas.addEventListener('pointerdown', this.pointer);
  }
  destroy(): void { this.canvas.removeEventListener('pointerdown', this.pointer); this.canvas.remove(); }
  private sprite(name: string, x: number, y: number, w: number, h: number): void {
    const image = this.images.get(name);
    if (image?.complete && image.naturalWidth) this.ctx.drawImage(image, x, y, w, h);
  }
  private text(value: string, x: number, y: number, font: string, color: string, align: CanvasTextAlign = 'center'): void {
    this.ctx.fillStyle = color; this.ctx.textAlign = align; this.ctx.font = font;
    this.ctx.fillText(value, x, y);
  }
  private effect(x: number,y: number,color: string,ttl: number, vx: number,vy: number,type:'orb'|'text'|'spark', text?: string): void {
    this.effects.push({ x,y,color,born:performance.now(),ttl,vx,vy,type,text,radius:2.5 });
  }
  render(frame: GameSnapshot, events: readonly GameEvent[]): void {
    const now = performance.now();
    for (const e of events) {
      if (e.type === 'route') {
        const p = POSITIONS[e.rackId];
        if (p) this.flights.push({fromX:210,fromY:423,toX:p.x,toY:p.y+110,born:now,duration:440,kind:e.packet.kind});
      } else if (e.type === 'processed') {
        const p=POSITIONS[e.rackId];
        if (p) {
          this.effect(p.x,p.y+35,e.kind==='priority'?'#FFC857':'#67E6B5',850,0,-42,'text',`+${e.points}`);
          for(let i=0;i<9;i++) {
            const a=i*2.4;this.effect(p.x+Math.cos(a)*16,p.y+115+Math.sin(a)*12,'#67E6B5',400+i*45,Math.cos(a)*32,Math.sin(a)*35,'orb');
          }
        }
      } else if (e.type === 'cool') {
        this.droneTarget=e.rackId;this.droneUntil=now+1300;
        const p=POSITIONS[e.rackId];if(p) for(let i=0;i<17;i++) {
          const a=i*2.4;this.effect(p.x,p.y+82,'#7EE9FF',450+i*37,Math.cos(a)*38,Math.sin(a)*24+29,'spark');
        }
      } else if (e.type === 'fail') {
        this.shakeUntil=now+350;this.flashUntil=now+260;
        const p=POSITIONS[e.rackId];if(p) for(let i=0;i<16;i++) {
          const a=i*2.4;this.effect(p.x,p.y+110,i%3===0?'#FFC857':'#FF4D6D',500+i*25,Math.cos(a)*60,Math.sin(a)*70,'spark');
        }
      } else if (e.type === 'recover') {
        const p=POSITIONS[e.rackId];if(p) this.effect(p.x,p.y+30,'#67E6B5',1100,0,-30,'text','ONLINE!');
      } else if (e.type === 'level') this.effect(210,60,'#FFC857',1500,0,-18,'text','TRAFFIC SURGE!');
    }
    if (this.flights.length > 50) this.flights.splice(0,this.flights.length-50);
    if (this.effects.length>150) this.effects.splice(0,this.effects.length-150);
    const c=this.ctx;
    c.setTransform(2,0,0,2,0,0);
    c.clearRect(0,0,420,460);
    c.fillStyle=BG;c.fillRect(0,0,420,460);
    const glow=c.createRadialGradient(210,220,30,210,240,330);
    glow.addColorStop(0,'#274A63');glow.addColorStop(1,'#101827');
    c.fillStyle=glow;c.fillRect(0,0,420,460);
    const t=(now-this.born)/1000;
    c.save();
    if(now<this.shakeUntil) c.translate(Math.sin(t*160)*2.5,Math.cos(t*130)*2);
    this.sprite('floor',0,0,420,460);
    // Luminous decorative traffic flows along the diorama floor.
    for(let i=0;i<7;i++) {
      const x=75+(i*53+t*22)%290;
      const y=320+Math.sin(i*2.4+t*.6)*10;
      c.globalAlpha=.17+.12*Math.sin(t*2+i);
      c.fillStyle=i%3===0?'#FFC857':'#30D9E8';c.beginPath();c.arc(x,y,2.4,0,Math.PI*2);c.fill();
    }
    c.globalAlpha=1;
    // Center rack behind the two foreground racks.
    for(const id of [1,0,2]) {
      const p=POSITIONS[id]; const rack=frame.racks[id];if(!p||!rack)continue;
      const status: RackStatus=frame.phase==='ready'?'idle':rack.status;
      const wobble=status==='critical'?Math.sin(t*27+id)*1.7:Math.sin(t*2.7+id)*1.8;
      const levitate=status==='offline'?6:0;
      c.save();
      if(status==='offline')c.globalAlpha=.76;
      this.sprite(`rack-${id}-${status}`,p.x-75,p.y+wobble+levitate,150,194);
      c.restore();
      // Temperature bars anchored underneath each individual rack.
      c.fillStyle='#101B30'; this.rounded(p.x-48,p.y+182,96,8,4);c.fill();
      c.fillStyle=rack.temperature>=85?'#FF4D6D':rack.temperature>=66?'#FF8757':'#67E6B5';
      const pct=Math.max(.04,Math.min(1,rack.temperature/100));this.rounded(p.x-47,p.y+183,94*pct,6,3);c.fill();
      c.fillStyle='#D8E9FA'; c.font='700 12px sans-serif';c.textAlign='center';
      c.fillText(['ALPHA','BETA','GAMMA'][id]??'',p.x,p.y+207);
      if(rack.status==='offline')this.text('OFFLINE',p.x,p.y+25,'700 13px sans-serif','#FF7189');
      else if(rack.status==='critical')this.text('!',p.x+60,p.y+24,'900 25px sans-serif','#FF4D6D');
      else if(rack.status==='overheating')this.text('!',p.x+60,p.y+24,'900 24px sans-serif','#FFC857');
    }
    for (const flight of this.flights) {
      const progress=(now-flight.born)/flight.duration;if(progress<0||progress>1)continue;
      const x=flight.fromX+(flight.toX-flight.fromX)*progress;
      const y=flight.fromY+(flight.toY-flight.fromY)*progress-66*Math.sin(Math.PI*progress);
      c.save();c.shadowColor=flight.kind==='priority'?'#FFC857':'#30D9E8';c.shadowBlur=15;
      c.fillStyle=flight.kind==='priority'?'#FFC857':'#30D9E8';
      c.translate(x,y);c.rotate(progress*4);this.rounded(-7,-5,14,10,3);c.fill();c.restore();
    }
    this.flights=this.flights.filter(f=>now-f.born<f.duration);
    for(const effect of this.effects) {
      const progress=(now-effect.born)/effect.ttl; if(progress<0||progress>1)continue;
      c.save(); c.globalAlpha=1-progress;
      const x=effect.x+effect.vx*progress;const y=effect.y+effect.vy*progress;
      if(effect.type==='text') {
        c.shadowBlur=9;c.shadowColor=effect.color;
        this.text(effect.text??'',x,y,`900 ${effect.text?.startsWith('+')?'19':'15'}px sans-serif`,effect.color);
      } else {
        c.fillStyle=effect.color;c.shadowColor=effect.color;c.shadowBlur=9;
        if(effect.type==='spark'){c.translate(x,y);c.rotate(progress*6);c.fillRect(-1.2,-5,2.4,10);} else {c.beginPath();c.arc(x,y,3*(1-progress)+.5,0,Math.PI*2);c.fill();}
      }
      c.restore();
    }
    this.effects=this.effects.filter(f=>now-f.born<f.ttl);
    if(now<this.droneUntil) {
      const target=POSITIONS[this.droneTarget];if(target) {
        const progress=1-(this.droneUntil-now)/1300;
        const x=210+(target.x-210)*Math.min(1,progress*2.5);
        const y=progress<.35?14:target.y-50+Math.sin(t*14)*5;
        this.sprite('drone',x-48,y,96,91);
        if(progress>.37) {
          c.strokeStyle='#7EE9FF';c.globalAlpha=.5;c.lineWidth=2;c.setLineDash([3,8]);c.beginPath();c.moveTo(x,y+79);c.lineTo(target.x,target.y+150);c.stroke();c.setLineDash([]);c.globalAlpha=1;
        }
      }
    } else if(frame.phase==='ready') this.sprite('drone',169,18+Math.sin(t*2)*5,80,76);
    if(now<this.flashUntil){c.fillStyle='#FF4D6D';c.globalAlpha=.1*(this.flashUntil-now)/260;c.fillRect(0,0,420,460);c.globalAlpha=1;}
    c.restore();
  }
  private rounded(x:number,y:number,w:number,h:number,r:number):void {
    this.ctx.beginPath();this.ctx.roundRect(x,y,Math.max(0,w),h,r);
  }
}
