import {test} from 'node:test';
import assert from 'node:assert/strict';
import {
  availableRack, canDrone, canNotify, canRoute, createMission, command, DURATION, EVENTS, tick,
} from '../../concert/mission.mjs';

function operate(s, {backup = true, audience = true, drone = true} = {}) {
  if (backup) command(s, 'backup');
  const hot = s.nodes.findIndex((_, id) => canDrone(s, id));
  if (drone && hot >= 0) command(s, 'drone', hot);
  if (s.decision) command(s, 'policy', s.time < 200 ? 'entry' : 'stream');
  if (audience && canNotify(s)) command(s, 'audience');
  if (s.time % 6 === 0 || s.queue.length >= 3) command(s, 'route', availableRack(s));
}

function advance(s, to, driver = () => {}) {
  while (s.time < to && !s.result) {
    driver(s);
    tick(s);
  }
  return s;
}

test('a real first packet can be routed at time zero and routing preserves FIFO', () => {
  const s = createMission();
  assert.equal(s.queue[0].id, 1);
  assert.equal(s.time, 0);
  assert.ok(command(s, 'route', 0));
  assert.equal(s.nodes[0].packet.id, 1);
  assert.equal(s.queue.length, 0);
  advance(s, 3);
  assert.equal(s.manualServed, 1);
  advance(s, 6);
  s.nodes[0].work = 2;
  s.nodes[1].offline = true;
  const queued = s.queue[0].id;
  assert.equal(command(s, 'route', 0), false);
  assert.equal(command(s, 'route', 1), false);
  assert.equal(s.queue[0].id, queued);
  assert.ok(command(s, 'route', 2));
  assert.equal(s.nodes[2].packet.id, queued);
});

test('rack warning, repair travel and cooldown retain the targeted rack', () => {
  const driver = s => operate(s, {drone: false});
  const s = advance(createMission(), 86, driver);
  assert.equal(EVENTS[s.warned].type, 'heat');
  advance(s, 96, driver);
  assert.ok(s.nodes[1].offline);
  assert.ok(command(s, 'drone', 1));
  assert.equal(command(s, 'drone', 1), false);
  advance(s, 100);
  assert.ok(s.nodes[1].offline);
  advance(s, 101);
  assert.equal(s.nodes[1].offline, false);
  assert.equal(s.drone.target, -1);
  assert.ok(s.nodes[1].heat < 35);
  assert.equal(s.drone.ready, 122);
  assert.equal(s.repairs, 1);
});

test('a preventive cooling arrival does not drop an in-flight packet', () => {
  const s = createMission();
  s.nodes[0].heat = 68;
  assert.ok(command(s, 'drone', 0));
  advance(s, 3);
  assert.ok(command(s, 'route', 0));
  advance(s, 6);
  assert.equal(s.served, 1);
  assert.equal(s.manualServed, 1);
  assert.equal(s.lost, 0);
  assert.equal(s.repairs, 1);
});

test('queue pressure can lose audience trust, independently of an ingest blackout', () => {
  const s = advance(createMission(), DURATION);
  assert.equal(s.result, 'loss');
  assert.equal(s.reason, 'trust');
  assert.ok(s.time < 302);
  assert.equal(s.blackoutTotal, 0);
  assert.equal(s.trust, 0);
});

test('ingest outage telegraphs and has a hard deadline when no backup is chosen', () => {
  const driver = s => operate(s, {backup: false});
  const s = advance(createMission(), 292, driver);
  assert.equal(EVENTS[s.warned].type, 'outage');
  advance(s, 302, driver);
  assert.equal(s.quality, 0);
  assert.equal(s.result, null);
  advance(s, 328, driver);
  assert.equal(s.result, 'loss');
  assert.equal(s.reason, 'blackout');
  assert.equal(s.blackoutTotal, 27);
});

test('backup takes five seconds and restores reduced service without repeat dispatch', () => {
  const s = advance(createMission(), 302, operate);
  assert.ok(command(s, 'backup'));
  assert.equal(command(s, 'backup'), false);
  advance(s, 306);
  assert.equal(s.quality, 0);
  advance(s, 307);
  assert.ok(s.quality > 0 && s.quality < 100);
  assert.ok(s.backup.active);
  assert.equal(s.blackoutTotal, 5);
});

test('audience comms reduce trust loss for a bounded period without stopping the outage clock', () => {
  const s = advance(createMission(4), 302, operate), control = structuredClone(s);
  assert.ok(command(s, 'audience'));
  assert.equal(command(s, 'audience'), false);
  assert.equal(s.audience.until - s.time, 15);
  assert.equal(s.audience.ready - s.time, 60);
  advance(s, 307);
  advance(control, 307);
  assert.ok(s.trust > control.trust);
  assert.equal(s.blackSeconds, control.blackSeconds);
  assert.equal(s.notices, control.notices + 1);
});

test('both decisions arrive, affect quality and throughput, and expire', () => {
  const a = advance(createMission(), 145, operate), b = structuredClone(a);
  assert.ok(command(a, 'policy', 'stream'));
  assert.ok(command(b, 'policy', 'entry'));
  advance(a, 157);
  advance(b, 157);
  assert.ok(a.quality > b.quality);
  assert.ok(b.served >= a.served);
  advance(a, 181);
  assert.equal(a.policy.mode, 'balanced');
  const second = advance(createMission(), 354, operate);
  assert.ok(second.decision);
  assert.equal(second.decisions, 1);
});

test('seven-minute wins are repeatable across seeds and account for every packet', () => {
  function run(seed) {
    const state = createMission(seed);
    while (!state.result) {
      operate(state);
      tick(state);
      const packetsInFlight = state.nodes.filter(node => node.packet).length;
      assert.equal(state.generated, state.queue.length + packetsInFlight + state.lost + state.served);
    }
    return state;
  }
  for (let seed = 0; seed < 32; seed++) {
    const s = run(seed);
    assert.equal(s.result, 'win', 'seed ' + seed);
    assert.equal(s.time, 420);
    assert.ok(s.score > 1000);
    assert.ok(s.manualServed > 0 && s.repairs > 0);
    assert.equal(s.decisions, 2);
    assert.ok(s.backup.active);
  }
  assert.deepEqual(run(7), run(7));
  assert.equal(createMission().time, 0);
});


test('the first live deadline rewards express routing and slower routing produces less heat', () => {
  const standard = advance(createMission(), 6);
  const urgent = standard.queue.find(packet => packet.due != null);
  assert.ok(urgent);
  standard.queue = [urgent];
  const express = structuredClone(standard), cool = structuredClone(standard);
  assert.equal(express.queue[0].due, 9);
  const startingFast = express.nodes[0].heat, startingCool = cool.nodes[2].heat;
  assert.ok(command(express, 'route', 0));
  assert.ok(command(cool, 'route', 2));
  advance(express, 8);
  assert.equal(express.priorityServed, 1);
  assert.equal(express.nodes[0].heat - startingFast, 18);
  advance(cool, 10);
  assert.equal(cool.priorityServed, 0);
  assert.equal(cool.nodes[2].heat - startingCool, 8);
  assert.equal(cool.nodes[2].lastDelivery.timely, false);
});

test('both express-heavy thermal rotation and cooling-heavy play win with different route mixes', () => {
  function run(seed, coolFirst) {
    const state = createMission(seed), use = [0, 0, 0];
    while (!state.result) {
      command(state, 'backup');
      const repair = state.nodes.findIndex((_, id) => canDrone(state, id));
      if (repair >= 0) command(state, 'drone', repair);
      if (state.decision) command(state, 'policy', state.time < 200 ? 'entry' : 'stream');
      command(state, 'audience');
      const urgent = state.queue[0]?.due != null;
      if (state.time % 6 === 0 || state.queue.length > 2 || urgent) {
        const preference = urgent || !coolFirst ? [0, 1, 2] : [2, 1, 0];
        const target = preference.find(id => canRoute(state, id) && state.nodes[id].heat <= (coolFirst ? 74 : 58));
        if (target !== undefined && command(state, 'route', target)) use[target]++;
      }
      tick(state);
    }
    return {state, use};
  }
  for (let seed = 0; seed < 16; seed++) {
    const express = run(seed, false), cool = run(seed, true);
    assert.equal(express.state.result, 'win');
    assert.equal(cool.state.result, 'win');
    assert.ok(express.use[0] > express.use[2] && cool.use[2] > cool.use[0]);
  }
});


test('simultaneous manual arrivals retain separate outcomes on their map targets', () => {
  const s = createMission();
  s.queue = [{id: 1, since: 0, due: 3}, {id: 2, since: 0}];
  assert.ok(command(s, 'route', 2));
  advance(s, 2);
  assert.ok(command(s, 'route', 0));
  advance(s, 4);
  assert.deepEqual(s.nodes[0].lastDelivery, {id: 2, timely: true});
  assert.deepEqual(s.nodes[2].lastDelivery, {id: 1, timely: false});
});
