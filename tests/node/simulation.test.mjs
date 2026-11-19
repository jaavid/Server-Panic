import assert from 'node:assert/strict';
import { test } from 'node:test';
import { GameSimulation } from '../../dist-offline/game/systems/GameSimulation.js';
function tick(g,seconds) {while(seconds>1e-9){const dt=Math.min(.2,seconds);g.advance(dt);seconds-=dt;}}
test('FIFO and routing to one rack',()=>{const g=new GameSimulation(3);g.start();assert.deepEqual(g.queue.map(p=>p.id),[1,2]);assert.equal(g.route(0),true);assert.equal(g.racks[0].pending.id,1);assert.equal(g.queue[0].id,2)});
test('cannot route to busy/offline/unknown racks',()=>{const g=new GameSimulation(3);g.start();assert.equal(g.route(0),true);assert.equal(g.route(0),false);g.racks[1].online=false;assert.equal(g.route(1),false);assert.equal(g.route(42),false)});
test('route and work heat; passive cooling',()=>{const g=new GameSimulation();g.start();g.route(0);const temp=g.racks[0].temperature;tick(g,.4);assert.ok(g.racks[0].temperature>temp);g.racks[1].temperature=60;tick(g,1);assert.ok(g.racks[1].temperature<60)});
test('cooling resets temperature and enforces cooldown',()=>{const g=new GameSimulation();g.start();g.racks[0].temperature=95;assert.equal(g.cool(0),true);assert.equal(g.racks[0].temperature,52);assert.equal(g.cool(0),false);g.coolingAvailableAt=.1;tick(g,.2);assert.equal(g.cool(0),true)});
test('offline cooling and routing rejected',()=>{const g=new GameSimulation();g.start();g.racks[0].online=false;assert.equal(g.cool(0),false);assert.equal(g.route(0),false)});
test('critical failure and recovery',()=>{const g=new GameSimulation();g.start();g.racks[0].temperature=99;g.route(0);assert.equal(g.racks[0].online,false);tick(g,5.3);assert.equal(g.racks[0].online,true);assert.equal(g.recovered,1)});
test('score, completed packet, combo and expiration',()=>{const g=new GameSimulation(3);g.start();g.route(0);tick(g,1.1);assert.equal(g.score,100);assert.equal(g.processed,1);g.route(1);tick(g,1.1);assert.equal(g.combo,2);tick(g,4.5);g.route(0);tick(g,1.1);assert.equal(g.combo,1)});
test('combo resets on rack burnout',()=>{const g=new GameSimulation();g.start();g.route(1);tick(g,1);g.racks[0].temperature=99;g.route(0);assert.equal(g.combo,0)});
test('win at session end',()=>{const g=new GameSimulation(1,{duration:1,initialSpawnInterval:100});g.start();tick(g,1.2);assert.equal(g.phase,'won');assert.equal(g.snapshot().remaining,0)});
test('lose on queue pressure',()=>{const g=new GameSimulation(1,{queueCapacity:2,queueOverloadGrace:.4});g.start();tick(g,.7);assert.equal(g.phase,'lost')});
test('lose if all racks are offline',()=>{const g=new GameSimulation(1,{allOfflineGrace:.2});g.start();for(const r of g.racks){r.online=false;r.recoveryUntil=100;}tick(g,.3);assert.equal(g.phase,'lost')});
test('difficulty advances at fifteen seconds',()=>{const g=new GameSimulation(1,{queueCapacity:100});g.start();tick(g,15.2);assert.equal(g.level,1);assert.ok(g.spawnInterval<1.7)});
test('fixed seeds produce identical events and state',()=>{const a=new GameSimulation(123),b=new GameSimulation(123);a.start();b.start();for(let i=0;i<45;i++){for(const g of [a,b]){if(i%4===0)g.route(i%3);g.advance(.2)}}assert.deepEqual(a.snapshot(),b.snapshot());assert.deepEqual(a.drainEvents(),b.drainEvents())});
test('personal best persists through localStorage interface',async()=>{
  const {LocalScoreStore}=await import('../../dist-offline/services/ScoreStorage.js');
  const values=new Map();
  globalThis.localStorage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
  const a=new LocalScoreStore();
  assert.equal(a.getBest(),0);assert.equal(a.save(140),140);
  const b=new LocalScoreStore();
  assert.equal(b.getBest(),140);assert.equal(b.save(100),140);assert.equal(b.save(220),220);
  delete globalThis.localStorage;
});
