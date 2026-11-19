import { describe, expect, it } from 'vitest';
import { GameSimulation } from '../../src/game/systems/GameSimulation.js';

function tick(game: GameSimulation, seconds: number): void {
  let left=seconds;
  while (left>1e-8) {const step=Math.min(.2,left);game.advance(step);left-=step;}
}

describe('deterministic Server Panic simulation', () => {
  it('starts with two FIFO packets and three online racks', () => {
    const g=new GameSimulation(3);g.start();
    expect(g.queue.map(p=>p.id)).toEqual([1,2]);
    expect(g.racks.every(r=>r.online)).toBe(true);
  });
  it('routes exactly the oldest request and marks rack busy', () => {
    const g=new GameSimulation(3);g.start();
    expect(g.route(1)).toBe(true);
    expect(g.racks[1]?.pending?.id).toBe(1);
    expect(g.queue[0]?.id).toBe(2);
    expect(g.route(1)).toBe(false);
  });
  it('rejects offline, unknown, and empty-queue targets', () => {
    const g=new GameSimulation(8);g.start();
    g.racks[0]!.online=false;
    expect(g.route(0)).toBe(false);
    expect(g.route(99)).toBe(false);
    expect(g.route(1)).toBe(true);
    expect(g.route(2)).toBe(true);
    expect(g.route(0)).toBe(false);
  });
  it('accumulates route and processing heat', () => {
    const g=new GameSimulation(8);g.start();
    const before=g.racks[0]!.temperature;
    g.route(0);
    expect(g.racks[0]!.temperature).toBeGreaterThan(before+10);
    const heat=g.racks[0]!.temperature;
    tick(g,.4);
    expect(g.racks[0]!.temperature).toBeGreaterThan(heat);
  });
  it('passively cools idle servers without dropping below floor', () => {
    const g=new GameSimulation(8);g.start();g.racks[0]!.temperature=60;
    tick(g,2);
    expect(g.racks[0]!.temperature).toBeCloseTo(60-2*g.config.idleCoolingPerSecond,1);
  });
  it('cooling works once, starts cooldown, and recharges', () => {
    const g=new GameSimulation(4);g.start();g.racks[0]!.temperature=95;
    expect(g.cool(0)).toBe(true);
    expect(g.racks[0]!.temperature).toBe(52);
    expect(g.cool(0)).toBe(false);
    g.coolingAvailableAt=g.elapsed+.01;
    tick(g,.03);
    expect(g.cool(0)).toBe(true);
  });
  it('rejects cooling on offline racks', () => {
    const g=new GameSimulation();g.start();g.racks[0]!.online=false;
    expect(g.cool(0)).toBe(false);
  });
  it('fails a critical rack and recovers it after a grace period', () => {
    const g=new GameSimulation(1);g.start();g.racks[0]!.temperature=98;
    g.route(0);
    expect(g.racks[0]!.online).toBe(false);
    expect(g.racks[0]!.status).toBe('offline');
    tick(g,5.3);
    expect(g.racks[0]!.online).toBe(true);
    expect(g.recovered).toBe(1);
    expect(g.racks[0]!.temperature).toBeLessThan(60);
  });
  it('scores completed packets and increases combo multiplier', () => {
    const g=new GameSimulation(10);g.start();
    let routed=0;
    while(routed<4){
      if(g.queue.length===0)tick(g,.5);
      const id=routed%3;
      expect(g.route(id)).toBe(true);
      tick(g,1.0);routed++;
    }
    expect(g.processed).toBe(4);
    expect(g.combo).toBe(4);
    expect(g.maxCombo).toBe(4);
    expect(g.score).toBeGreaterThanOrEqual(400);
  });
  it('resets combo after a long gap and upon rack failure', () => {
    const g=new GameSimulation(5);g.start();g.route(0);tick(g,1);
    expect(g.combo).toBe(1);
    tick(g,4.3);g.route(0);tick(g,1);
    expect(g.combo).toBe(1);
    g.racks[1]!.temperature=99;g.route(1);
    expect(g.combo).toBe(0);
  });
  it('wins on 90-second survival (short duration fixture)', () => {
    const g=new GameSimulation(7,{duration:1.1,initialSpawnInterval:100});g.start();tick(g,1.2);
    expect(g.phase).toBe('won');expect(g.snapshot().remaining).toBe(0);
  });
  it('fails if a full queue stays full beyond grace', () => {
    const g=new GameSimulation(7,{queueCapacity:2,queueOverloadGrace:.4});g.start();tick(g,.7);
    expect(g.phase).toBe('lost');expect(g.endedBecause).toContain('صف');
  });
  it('fails if all three servers are offline too long', () => {
    const g=new GameSimulation(4,{allOfflineGrace:.3});g.start();
    for(const rack of g.racks){rack.online=false;rack.recoveryUntil=99;}
    tick(g,.45);expect(g.phase).toBe('lost');
  });
  it('ramps difficulty at each configured 15s boundary', () => {
    const g=new GameSimulation(9,{queueCapacity:200});g.start();
    const start=g.spawnInterval;tick(g,15.1);
    expect(g.level).toBe(1);expect(g.spawnInterval).toBeLessThan(start);
  });
  it('repeats identical outcomes with equal RNG seed and actions', () => {
    const a=new GameSimulation(1234,{queueCapacity:35});const b=new GameSimulation(1234,{queueCapacity:35});
    a.start();b.start();
    for(let i=0;i<45;i++){
      for(const g of [a,b]){if(i%4===0)g.route((i/4)%3|0);if(i%14===0)g.cool(i%3);g.advance(.2);}
    }
    expect(JSON.parse(JSON.stringify(a.snapshot()))).toEqual(JSON.parse(JSON.stringify(b.snapshot())));
    expect(a.drainEvents()).toEqual(b.drainEvents());
  });
});
