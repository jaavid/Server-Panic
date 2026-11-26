export const DURATION = 420;
export const BLACKOUT_LIMIT = 27;
export const NODES = ['سپهر', 'باران', 'تابان'];
export const EVENTS = [
  { t: 28, type: 'rush', label: 'موج ورود تماشاگرها' },
  { t: 96, type: 'heat', node: 1, label: 'اختلال خنک‌کنندهٔ باران' },
  { t: 171, type: 'rush', label: 'شروع اجرای اصلی' },
  { t: 231, type: 'pressure', node: 2, label: 'فشار گرمایی روی تابان' },
  { t: 302, type: 'outage', label: 'قطع مسیر اصلی پخش' },
  { t: 374, type: 'rush', label: 'موج پایانی تماشاگرها' },
];
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

export function createMission(seed = 1) {
  return {
    seed: seed >>> 0, time: 0, trust: 100, quality: 100, result: null, reason: null, score: 200,
    queue: [{ id: 1, since: 0 }], sequence: 1, generated: 1, served: 0, lost: 0, peakQueue: 1,
    nodes: [25, 24, 26].map(heat => ({ heat, work: 0, packet: null, offline: false })),
    manualServed: 0, repairs: 0, notices: 0, blackoutTotal: 0,
    drone: { target: -1, arrive: 0, ready: 0 },
    backup: { arrive: 0, active: false }, outage: false, blackSeconds: 0,
    audience: { until: 0, ready: 0 },
    policy: { mode: 'balanced', until: 0 }, event: 0, warned: -1,
    rushUntil: 0, decision: null, decisions: 0, alert: 'یک بسته آمادهٔ ارسال است.',
  };
}

export function canRoute(s, id) {
  const node = s.nodes[id];
  return Boolean(node && !node.offline && node.work === 0 && s.queue.length);
}

export function canDrone(s, id) {
  const node = s.nodes[id];
  return Boolean(node && s.drone.target < 0 && s.time >= s.drone.ready && (node.offline || node.heat >= 65));
}

export function canBackup(s) {
  return s.outage && !s.backup.arrive && !s.backup.active;
}

export function canNotify(s) {
  return s.time >= s.audience.ready && s.quality < 85;
}

export function availableRack(s) {
  return s.nodes.reduce((best, node, id) => canRoute(s, id) &&
    (best === -1 || node.heat < s.nodes[best].heat) ? id : best, -1);
}

function assign(s, id, manual) {
  if (!canRoute(s, id)) return false;
  const node = s.nodes[id];
  node.packet = { ...s.queue.shift(), manual };
  node.work = 3;
  return true;
}

function decide(s, mode) {
  if (!s.decision || !['stream', 'entry'].includes(mode)) return false;
  s.policy = { mode, until: s.time + 36 };
  s.decisions++;
  s.decision = null;
  s.alert = mode === 'stream' ? 'پخش در اولویت است؛ رسیدگی خودکار به صف کندتر می‌شود.' : 'ورودی در اولویت است؛ رسیدگی به صف سریع‌تر شد.';
  return true;
}

export function command(s, action, arg) {
  if (s.result) return false;
  if (action === 'route') {
    if (!assign(s, arg, true)) return false;
    s.alert = 'بسته به رک «' + NODES[arg] + '» منتقل شد.';
    return true;
  }
  if (action === 'drone') {
    if (!canDrone(s, arg)) return false;
    s.drone = { target: arg, arrive: s.time + 5, ready: s.time + 26 };
    s.alert = 'پهپاد به سوی «' + NODES[arg] + '» اعزام شد.';
    return true;
  }
  if (action === 'backup') {
    if (!canBackup(s)) return false;
    s.backup.arrive = s.time + 5;
    s.alert = 'مسیر پشتیبان در حال راه‌اندازی است…';
    return true;
  }
  if (action === 'audience') {
    if (!canNotify(s)) return false;
    s.audience = { until: s.time + 15, ready: s.time + 60 };
    s.notices++;
    s.alert = 'پیام وضعیت به تماشاگران رسید؛ افت اعتماد موقتاً کمتر می‌شود.';
    return true;
  }
  if (action === 'policy') return decide(s, arg);
  return false;
}

function enqueue(s, count) {
  for (let i = 0; i < count; i++) {
    s.generated++;
    if (s.queue.length >= 11) { s.lost++; continue; }
    s.queue.push({ id: ++s.sequence, since: s.time });
  }
  s.peakQueue = Math.max(s.peakQueue, s.queue.length);
}

function failRack(s, id) {
  const node = s.nodes[id];
  if (node.packet) s.lost++;
  Object.assign(node, { heat: 100, offline: true, work: 0, packet: null });
  s.alert = 'رک «' + NODES[id] + '» از مدار خارج شد. پهپاد را اعزام کن.';
}

function handleEvent(s, event) {
  s.event++;
  s.alert = event.label;
  if (event.type === 'rush') {
    s.rushUntil = s.time + 26;
    enqueue(s, 3 + ((Math.imul(s.seed ^ s.event, 0x9e3779b1) >>> 22) % 3));
  }
  if (event.type === 'heat') failRack(s, event.node);
  if (event.type === 'pressure' && !s.nodes[event.node].offline) {
    s.nodes[event.node].heat = Math.max(s.nodes[event.node].heat, 86);
  }
  if (event.type === 'outage') {
    s.outage = true;
    s.alert = 'پخش قطع شد! از مرکز کنترل مسیر پشتیبان را فعال کن.';
  }
}

function updateRacks(s) {
  for (const [id, node] of s.nodes.entries()) {
    if (node.offline) continue;
    if (node.work === 0) {
      node.heat = Math.max(22, node.heat - 1);
      continue;
    }
    node.heat += 5;
    if (node.heat >= 100) {
      failRack(s, id);
    } else if (--node.work === 0) {
      s.served++;
      if (node.packet?.manual) s.manualServed++;
      node.packet = null;
    }
  }
}

function updateServices(s) {
  if (s.drone.target >= 0 && s.time === s.drone.arrive) {
    const node = s.nodes[s.drone.target];
    const offline = node.offline;
    node.heat = 26;
    node.offline = false;
    s.drone.target = -1;
    s.repairs++;
    s.alert = offline ? 'پهپاد رک را بازیابی کرد.' : 'پهپاد دمای رک را پایین آورد.';
  }
  if (s.backup.arrive && s.time === s.backup.arrive) {
    s.backup.active = true;
    s.alert = 'پخش از مسیر پشتیبان برگشت؛ ظرفیت کمتر است.';
  }
}

export function tick(s) {
  if (s.result) return s;
  s.time++;
  const event = EVENTS[s.event];
  if (event && s.time === event.t - 10) {
    s.warned = s.event;
    s.alert = 'هشدار پیش رو: ' + event.label;
  }
  if (event && s.time === event.t) handleEvent(s, event);
  if (s.time === 145 || s.time === 354) {
    s.decision = { until: s.time + 20 };
    s.alert = 'اولویت موقت را انتخاب کن: پخش یا ورودی.';
  }
  if (s.decision && s.time >= s.decision.until) s.decision = null;
  if (s.time >= s.policy.until) s.policy.mode = 'balanced';
  const policy = s.policy.mode;
  const rush = s.time < s.rushUntil;
  const arrivals = rush ? (s.time >= 374 ? 2 : 3) : 6;
  if (s.time % arrivals === 0) enqueue(s, 1);
  while (s.queue[0] && s.time - s.queue[0].since >= 16) { s.queue.shift(); s.lost++; }
  updateServices(s);
  updateRacks(s);
  const autoCycle = policy === 'entry' ? 5 : policy === 'stream' ? 12 : (s.backup.active || rush ? 11 : 8);
  if (s.time % autoCycle === 0) {
    const id = availableRack(s);
    if (id !== -1 && s.nodes[id].heat < 85) assign(s, id, false);
  }
  const online = s.nodes.filter(node => !node.offline).length;
  const failed = (s.outage && !s.backup.active) || online === 0;
  s.quality = failed ? 0 : clamp(100 - (3 - online) * 17 - s.queue.length * 7 -
    (s.backup.active ? 10 : 0) + (policy === 'stream' ? 15 : policy === 'entry' ? -9 : 0), 12, 100);
  s.blackSeconds = failed ? s.blackSeconds + 1 : 0;
  if (failed) s.blackoutTotal++;
  const notice = s.time <= s.audience.until;
  const trustChange = failed ? (notice ? -1.35 : -2) :
    s.quality < 70 ? (notice ? -.35 : -.95) : s.quality < 84 ? -.12 : .55;
  s.trust = clamp(s.trust + trustChange, 0, 100);
  s.score = Math.max(0, Math.round(s.served * 12 + s.manualServed * 5 - s.lost * 5 +
    s.trust * 2 + s.decisions * 15 + s.repairs * 20));
  if (s.blackSeconds >= BLACKOUT_LIMIT || s.trust <= 0) {
    s.result = 'loss';
    s.reason = s.blackSeconds >= BLACKOUT_LIMIT ? 'blackout' : 'trust';
  } else if (s.time >= DURATION) {
    s.result = 'win';
    s.reason = 'finished';
  }
  return s;
}
