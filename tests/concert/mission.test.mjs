import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createMission,tick,command,DURATION,EVENTS} from '../../concert/mission.mjs';
const advance=(s,to)=>{while(s.time<to&&!s.result)tick(s);};
test('FIFO route rejects a busy or offline rack without consuming queue',()=>{
 const s=createMission();advance(s,6);
 assert.ok(command(s,'route',0));advance(s,12);
 s.nodes[0].work=2;s.nodes[1].offline=true;
 const queued=s.queue[0].id;
 assert.equal(command(s,'route',0),false);assert.equal(command(s,'route',1),false);
 assert.equal(s.queue[0].id,queued);assert.ok(command(s,'route',2));assert.equal(s.queue.length,0);
});
test('heat warning, failure, drone travel and cooldown',()=>{
 const s=createMission();advance(s,86);assert.equal(EVENTS[s.warned].type,'heat');
 advance(s,96);assert.ok(s.nodes[1].offline);assert.ok(command(s,'drone',1));assert.equal(command(s,'drone',1),false);
 advance(s,100);assert.ok(s.nodes[1].offline);advance(s,101);assert.equal(s.nodes[1].offline,false);
 assert.equal(s.drone.target,-1);assert.ok(s.nodes[1].heat<35);assert.equal(s.drone.ready,122);
});
test('ingest outage gives a warning, and defaults to a real loss',()=>{
 const s=createMission();advance(s,292);assert.equal(EVENTS[s.warned].type,'outage');
 advance(s,302);assert.equal(s.quality,0);assert.equal(s.result,null);
 advance(s,328);assert.equal(s.result,'loss');
});
test('backup warms up, restores stream with lower capacity, and cannot be spammed',()=>{
 const s=createMission();advance(s,302);assert.ok(command(s,'backup'));assert.equal(command(s,'backup'),false);
 advance(s,306);assert.equal(s.quality,0);advance(s,307);
 assert.ok(s.quality>0&&s.quality<100);assert.ok(s.backup.active);
});
test('decisions change quality and routing throughput for a bounded interval',()=>{
 const a=createMission(),b=createMission();advance(a,145);advance(b,145);
 assert.ok(command(a,'policy','stream'));assert.ok(command(b,'policy','entry'));
 advance(a,157);advance(b,157);assert.ok(a.quality>b.quality);assert.ok(b.served>=a.served);
 advance(a,181);assert.equal(a.policy.mode,'balanced');
 advance(a,302);command(a,'backup');advance(a,354);assert.ok(a.decision);
});
test('same input is deterministic; complete 420-second wins reset cleanly',()=>{
 function run(){const a=createMission();for(let i=0;i<DURATION;i++){
   tick(a);
   if(a.outage)command(a,'backup');
   if(a.nodes[1].offline)command(a,'drone',1);
   if(a.decision)command(a,'policy','entry');
   if(a.queue.length)for(let n=0;n<3;n++)if(command(a,'route',n))break;
 } return a;}
 const a=run();assert.equal(a.result,'win');assert.equal(a.time,420);assert.ok(a.score>500);assert.equal(a.decisions,2);
 assert.deepEqual(a,run());assert.equal(createMission().time,0);
});
