import Phaser from 'phaser';
import type { GameEvent, GameSnapshot } from '../systems/GameSimulation.js';
import type { RenderPort } from './CanvasRenderer.js';

/** Phaser is the production renderer; simulation and UI never depend on Phaser. */
const POSITIONS = [{ x: 108, y: 76 }, { x: 211, y: 14 }, { x: 318, y: 76 }] as const;
class DataCenterScene extends Phaser.Scene {
  private owner: PhaserRenderer;
  private racks: Phaser.GameObjects.Image[] = [];
  private heatBars: Phaser.GameObjects.Graphics[] = [];
  private drone: Phaser.GameObjects.Image | null = null;
  private bloom: Phaser.GameObjects.Graphics | null = null;
  constructor(owner: PhaserRenderer) { super({ key: 'ServerPanicWorld' }); this.owner = owner; }
  preload(): void {
    this.load.atlas('characters', './assets/characters-atlas.png', './assets/characters-atlas.json');
    this.load.image('floor', './assets/floor.webp');
  }
  create(): void {
    const bg = this.add.graphics().setDepth(-20);
    bg.fillGradientStyle(0x162a43, 0x142138, 0x101827, 0x101827, 1);
    bg.fillRect(0, 0, 420, 460);
    this.add.image(210, 230, 'floor').setDisplaySize(420, 460).setDepth(-5);
    this.bloom = this.add.graphics().setDepth(4);
    for (const id of [0, 1, 2]) {
      const p = POSITIONS[id]!;
      const rack = this.add.image(p.x, p.y + 97, 'characters', `rack-${id}-idle`)
        .setDisplaySize(150, 194).setDepth(id === 1 ? 2 : 3);
      this.racks[id] = rack;
      const heat = this.add.graphics().setDepth(5);
      this.heatBars[id] = heat;
      const label = this.add.text(p.x, p.y + 207, ['ALPHA','BETA','GAMMA'][id]!, {
        fontFamily: 'Arial, sans-serif', fontStyle: 'bold', fontSize: '12px', color: '#d8e9fa',
      }).setOrigin(.5).setDepth(5);
      void label;
      this.add.zone(p.x, p.y + 109, 142, 185).setInteractive({ useHandCursor: true })
        .on(Phaser.Input.Events.POINTER_DOWN, () => this.owner.onRackTap?.(id))
        .setDepth(9);
    }
    this.drone = this.add.image(210, 48, 'characters', 'drone').setDisplaySize(86, 82)
      .setAlpha(0).setDepth(11);
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.racks = []; this.heatBars = [];
    });
    this.owner.sceneReady = true;
  }
  update(time: number): void {
    const frame = this.owner.frame;
    if (!frame) return;
    const wobble = time / 1000;
    for (let id=0;id<3;id++) {
      const rack = frame.racks[id]; const sprite = this.racks[id];const p=POSITIONS[id];
      const graphics=this.heatBars[id];if(!rack||!sprite||!p||!graphics)continue;
      const status=frame.phase==='ready'?'idle':rack.status;
      const frameName=`rack-${id}-${status}`;
      if(sprite.frame.name!==frameName){sprite.setFrame(frameName).setDisplaySize(150,194);}
      sprite.setY(p.y + 97 + Math.sin(wobble*2.7+id)*1.6 + (status==='offline'?6:0));
      sprite.setAlpha(status==='offline'?.7:1);
      graphics.clear();
      graphics.fillStyle(0x101b30).fillRoundedRect(p.x-48,p.y+182,96,8,4);
      const color=rack.temperature>=85?0xff4d6d:rack.temperature>=66?0xff8757:0x67e6b5;
      graphics.fillStyle(color).fillRoundedRect(p.x-47,p.y+183,Math.max(4,Math.min(94,rack.temperature*.94)),6,3);
    }
    if(this.drone?.visible && this.drone.alpha>0 && this.owner.droneActiveUntil>time){
      this.drone.setY(this.owner.droneY+Math.sin(wobble*13)*3);
    }
    if(frame.phase==='ready' && this.drone) this.drone.setAlpha(.92).setPosition(210,48+Math.sin(wobble*2)*4);
    else if(this.drone && this.owner.droneActiveUntil<time) this.drone.setAlpha(0);
    this.bloom?.clear();
    if(frame.phase==='playing' && frame.queue.length>=7){
      this.bloom?.lineStyle(2,0xff4d6d,.23+.18*Math.sin(wobble*9)).strokeRoundedRect(2,2,416,456,13);
    }
  }
  apply(event: GameEvent): void {
    if(!this.scene.isActive())return;
    if (event.type==='route') {
      const p=POSITIONS[event.rackId];if(!p)return;
      const particle=this.add.rectangle(210,416,14,9,event.packet.kind==='priority'?0xffc857:0x30d9e8)
        .setStrokeStyle(1,0xe5ffff).setDepth(13);
      this.tweens.add({targets:particle,x:p.x,y:p.y+105,angle:320,duration:450,ease:'Sine.easeInOut',onComplete:()=>particle.destroy()});
    } else if (event.type==='processed') {
      const p=POSITIONS[event.rackId];if(!p)return;
      this.floating(`+${event.points}`,p.x,p.y+44,event.kind==='priority'?'#ffc857':'#67e6b5');
      this.sparkle(p.x,p.y+110,0x67e6b5,9);
    } else if(event.type==='cool') {
      const p=POSITIONS[event.rackId];if(!p)return;
      this.sparkle(p.x,p.y+104,0x7ee9ff,17);
      this.owner.droneY=p.y-42; this.owner.droneActiveUntil=this.time.now+1250;
      this.drone?.setAlpha(1).setPosition(210,48);
      if(this.drone) this.tweens.add({targets:this.drone,x:p.x,y:p.y-42,duration:350,ease:'Sine.easeOut'});
    } else if(event.type==='fail') {
      const p=POSITIONS[event.rackId];if(!p)return;
      this.cameras.main.shake(260,.008);this.cameras.main.flash(100,255,77,109,false);
      this.sparkle(p.x,p.y+92,0xff4d6d,15);
      this.floating('OFFLINE!',p.x,p.y+48,'#ff7189');
    } else if(event.type==='recover') {
      const p=POSITIONS[event.rackId];if(p)this.floating('ONLINE!',p.x,p.y+38,'#67e6b5');
    } else if(event.type==='level')this.floating('TRAFFIC SURGE!',210,85,'#ffc857');
  }
  private floating(value:string,x:number,y:number,color:string):void {
    const label=this.add.text(x,y,value,{fontFamily:'Arial, sans-serif',fontStyle:'bold',fontSize:'17px',color})
      .setOrigin(.5).setDepth(15);
    this.tweens.add({targets:label,y:y-47,alpha:0,duration:1000,ease:'Cubic.easeOut',onComplete:()=>label.destroy()});
  }
  private sparkle(x:number,y:number,color:number,count:number):void {
    for(let i=0;i<count;i++){
      const angle=i*Math.PI*2/count;
      const particle=this.add.circle(x,y,2+(i%3),color,.92).setDepth(14);
      this.tweens.add({targets:particle,x:x+Math.cos(angle)*(20+i*2.3),y:y+Math.sin(angle)*(18+i*2),alpha:0,scale:0,duration:350+i*25,ease:'Cubic.easeOut',onComplete:()=>particle.destroy()});
    }
  }
}
export class PhaserRenderer implements RenderPort {
  onRackTap: ((id: number) => void) | null = null;
  frame: GameSnapshot | null = null;
  sceneReady = false;
  droneActiveUntil = 0;
  droneY = 0;
  private game: Phaser.Game;
  private world: DataCenterScene;
  private queued: GameEvent[] = [];
  constructor(host: HTMLElement) {
    this.world = new DataCenterScene(this);
    this.game = new Phaser.Game({
      type: Phaser.AUTO, parent: host, width: 420, height: 460,
      transparent: false, backgroundColor: '#101827',
      render: { pixelArt: false, antialias: true, roundPixels: false },
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      resolution: Math.min(window.devicePixelRatio||1,2),
      scene: [this.world],
      audio: { noAudio: true }, // WebAudio sound is managed by SoundManager after user gesture.
    });
  }
  render(frame:GameSnapshot,events:readonly GameEvent[]):void {
    this.frame=frame;
    if(this.sceneReady){
      for(const event of this.queued)this.world.apply(event);
      this.queued=[];
      for(const event of events)this.world.apply(event);
    } else this.queued.push(...events);
  }
  destroy():void {this.game.destroy(true);}
}
