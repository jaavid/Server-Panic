export const DURATION = 420;
export const NODES = ['سپهر', 'باران', 'تابان'];
export const EVENTS = [
  { t: 28, type: 'rush', label: 'موج ورود تماشاگرها' },
  { t: 96, type: 'heat', label: 'اختلال خنک‌کنندهٔ رک' },
  { t: 171, type: 'rush', label: 'شروع اجرای اصلی' },
  { t: 302, type: 'outage', label: 'قطع مسیر اصلی پخش' },
  { t: 374, type: 'rush', label: 'موج پایانی تماشاگرها' },
];
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
export function createMission(seed = 1) {
  return {
    seed: seed >>> 0, time: 0, trust: 100, quality: 100, result: null, score: 0,
    queue: [], sequence: 0, generated: 0, served: 0, lost: 0,
    nodes: [25, 24, 26].map(heat => ({ heat, work: 0, offline: false })),
    drone: { target: -1, arrive: 0, ready: 0 },
    backup: { arrive: 0, active: false }, outage: false, blackSeconds: 0,
    policy: { mode: 'balanced', until: 0 }, event: 0, warned: -1,
    rushUntil: 0, decision: null, decisions: 0, alert: 'بسته‌های صف را به یکی از رک‌های آماده بفرست.',
  };
}
function assign(s, id) {
  const n = s.nodes[id];
  if (!n || n.offline || n.work > 0 || !s.queue.length) return false;
  s.queue.shift();
  n.work = 3;
  return true;
}
function decide(s, mode) {
  if (!s.decision || !['stream', 'entry'].includes(mode)) return false;
  s.policy = { mode, until: s.time + 36 };
  s.decisions++;
  s.decision = null;
  s.alert = mode === 'stream' ? 'پخش در اولویت است؛ صف ورودی کندتر می‌شود.' : 'ورودی در اولویت است؛ حاشیهٔ پایداری پخش کمتر می‌شود.';
  return true;
}
export function command(s, action, arg) {
  if (s.result) return false;
  if (action === 'route') {
    const ok = assign(s, arg);
    s.alert = ok ? 'بسته به رک انتخابی منتقل شد.' : 'رک باید آزاد و آنلاین باشد و صف خالی نباشد.';
    return ok;
  }
  if (action === 'drone') {
    if (!s.nodes[arg] || s.time < s.drone.ready || (!s.nodes[arg].offline && s.nodes[arg].heat < 35)) return false;
    s.drone = { target: arg, arrive: s.time + 5, ready: s.time + 26 };
    s.alert = 'پهپاد اعزام شد.';
    return true;
  }
  if (action === 'backup') {
    if (!s.outage || s.backup.arrive || s.backup.active) return false;
    s.backup.arrive = s.time + 5;
    s.alert = 'مسیر پشتیبان در حال راه‌اندازی است…';
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
}
export function tick(s) {
  if (s.result) return s;
  s.time++;
  const event = EVENTS[s.event];
  if (event && s.time === event.t - 10) {
    s.warned = s.event;
    s.alert = 'هشدار پیش رو: ' + event.label;
  }
  if (event && s.time === event.t) {
    s.event++;
    s.alert = event.label;
    if (event.type === 'rush') { s.rushUntil = s.time + 26; enqueue(s, 3 + ((Math.imul(s.seed ^ s.event, 0x9e3779b1) >>> 22) % 3)); }
    if (event.type === 'heat') {
      s.nodes[1].heat = 100; s.nodes[1].offline = true;
      s.alert = 'رک باران از مدار خارج شد. پهپاد را اعزام کن.';
    }
    if (event.type === 'outage') { s.outage = true; s.alert = 'پخش قطع شد! مسیر پشتیبان را از مرکز کنترل فعال کن.'; }
  }
  if (s.time === 145 || s.time === 354) {
    s.decision = { until: s.time + 20 };
    s.alert = 'اولویت موقت را انتخاب کن: پخش یا ورودی.';
  }
  if (s.decision && s.time >= s.decision.until) s.decision = null;
  if (s.time >= s.policy.until) s.policy.mode = 'balanced';
  const p = s.policy.mode;
  if (s.time % (s.time < s.rushUntil ? 3 : 6) === 0) enqueue(s, 1);
  while (s.queue[0] && s.time - s.queue[0].since >= 16) { s.queue.shift(); s.lost++; }
  for (const n of s.nodes) {
    if (!n.offline && n.work > 0) {
      n.heat += 3;
      if (--n.work === 0) s.served++;
    } else if (!n.offline) n.heat = Math.max(22, n.heat - 1);
    if (!n.offline && n.heat >= 100) {
      n.heat = 100; n.offline = true; n.work = 0;
      s.alert = 'یک رک داغ از مدار خارج شد.';
    }
  }
  if (s.drone.target >= 0 && s.time === s.drone.arrive) {
    const n = s.nodes[s.drone.target];
    n.heat = 26; n.offline = false; n.work = 0;
    s.drone.target = -1;
    s.alert = 'پهپاد رک را بازیابی کرد.';
  }
  if (s.backup.arrive && s.time === s.backup.arrive) {
    s.backup.active = true;
    s.alert = 'پخش از مسیر پشتیبان برگشت؛ ظرفیت کمتر است.';
  }
  const autoCycle = p === 'entry' ? 3 : p === 'stream' ? 7 : s.backup.active ? 7 : 5;
  if (s.time % autoCycle === 0) {
    const id = s.nodes.reduce((best, n, i) => !n.offline && n.work === 0
      && (best === -1 || n.heat < s.nodes[best].heat) ? i : best, -1);
    if (id !== -1) assign(s, id);
  }
  const online = s.nodes.filter(n => !n.offline).length;
  const failed = (s.outage && !s.backup.active) || online === 0;
  s.quality = failed ? 0 : clamp(100 - (3 - online) * 13 - s.queue.length * 6 - (s.backup.active ? 9 : 0) + (p === 'stream' ? 15 : p === 'entry' ? -12 : 0), 0, 100);
  s.blackSeconds = failed ? s.blackSeconds + 1 : 0;
  s.trust = clamp(s.trust + (failed ? -2 : s.quality < 70 ? -0.7 : 0.35), 0, 100);
  s.score = Math.round(Math.max(0, s.served * 12 - s.lost * 5 + s.trust * 2 + s.decisions * 15));
  if (s.blackSeconds >= 27 || s.trust <= 0) s.result = 'loss';
  else if (s.time >= DURATION) s.result = 'win';
  return s;
}
