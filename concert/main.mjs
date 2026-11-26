import {
  availableRack, BLACKOUT_LIMIT, canBackup, canDrone, canNotify, canRoute, command,
  createMission, DURATION, EVENTS, NODES, tick,
} from './mission.mjs';
import {city} from './city.mjs';

const ids = [
  'world', 'stage', 'clock', 'stream', 'trust', 'queue', 'guide', 'alert', 'jump',
  'selection', 'detail', 'route', 'drone', 'backup', 'audience', 'first-step', 'first-signal', 'decision',
  'decision-time', 'node-picks', 'policy-entry', 'policy-stream', 'overlay',
  'overlay-title', 'overlay-kicker', 'overlay-copy', 'summary', 'start', 'pause', 'mute', 'zoom',
  'opening', 'opening-skip', 'opening-media', 'opening-video', 'opening-play', 'opening-sound',
  'opening-continue', 'opening-caption', 'opening-still', 'opening-video-actions', 'show-opening',
];
const ui = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
const numbers = new Intl.NumberFormat('fa-IR', {useGrouping: false});
const padded = new Intl.NumberFormat('fa-IR', {minimumIntegerDigits: 2, useGrouping: false});
const num = value => numbers.format(value);
const clock = seconds => padded.format(Math.floor(seconds / 60)) + ':' + padded.format(seconds % 60);
const zones = [...document.querySelectorAll('[data-zone]')];
const nodes = [...document.querySelectorAll('[data-node]')];

let state = createMission();
let phase = 'menu';
let selected = 0;
let zone = 'data';
let recommendation;
let remaining = 0;
let frameTime;
let animation = 0;
let sound;
let muted = true;
let zoomed = false;
const view = city(ui.world, select);

function select(target, id) {
  if (phase !== 'playing' && phase !== 'training') return;
  zone = target;
  if (Number.isInteger(id)) selected = id;
  zones.forEach(el => el.setAttribute('aria-pressed', String(el.dataset.zone === zone)));
  nodes.forEach(el => el.setAttribute('aria-pressed', String(Number(el.dataset.node) === selected)));
  view.focus(zone);
  update();
}

function set(el, text) {
  if (el.textContent !== text) el.textContent = text;
}

function seconds(value) {
  return num(Math.max(0, value)) + ' ثانیه';
}

function guide() {
  if (phase !== 'playing') return {text: phase === 'paused' ? 'زمان و رویدادها در مکث متوقف‌اند.' :
    phase === 'result' ? 'نتیجهٔ این اجرا در گزارش مأموریت است.' : 'یک بسته برای شروع آماده است.'};
  if (state.time < 6) return {text: state.manualServed ?
    'سیگنال کنسرت وارد شبکهٔ پخش شد. پخش را تا پایان هفت دقیقه سرپا نگه دار.' :
    'سیگنال روی مسیر روشن به ایستگاه سپهر می‌رود.'};
  if (canBackup(state)) return {
    text: 'قطع پخش · ' + seconds(BLACKOUT_LIMIT - state.blackSeconds) + ' تا پایان مهلت. پشتیبان را روشن کن.',
    urgent: true, target: 'control', label: 'رفتن به کنترل',
  };
  if (state.outage && !state.backup.active) return {
    text: 'پشتیبان تا ' + seconds(state.backup.arrive - state.time) + ' دیگر راه می‌افتد.',
    urgent: true,
  };
  if (state.drone.target >= 0) return {
    text: 'پهپاد در راه «' + NODES[state.drone.target] + '» · ' + seconds(state.drone.arrive - state.time) + ' تا رسیدن.',
  };
  const repair = state.nodes.findIndex((node, id) => node.offline && canDrone(state, id));
  if (repair !== -1) return {
    text: 'رک «' + NODES[repair] + '» قطع است. پهپاد را برای بازیابی بفرست.',
    urgent: true, target: 'data', node: repair, label: 'انتخاب ' + NODES[repair],
  };
  if (state.decision) return {text: 'اولویت را برای ' + seconds(36) + ' آینده انتخاب کن. گزینه‌ها پایین‌اند.'};
  const event = EVENTS[state.event];
  if (event && state.warned === state.event) {
    return {
      text: event.label + ' · ' + seconds(event.t - state.time) + ' دیگر',
      urgent: event.type === 'outage', target: event.type === 'outage' ? 'control' : undefined,
      label: 'رفتن به کنترل',
    };
  }
  const rack = availableRack(state);
  if (rack !== -1 && (state.queue.length >= 2 || (state.queue.length && state.time < 20))) {
    const target = zone === 'data' && canRoute(state, selected) && state.nodes[selected].heat < 82 ? selected : rack;
    return {
      text: num(state.queue.length) + ' بسته در صف · به رک «' + NODES[target] + '» بفرست.',
      urgent: state.queue.length >= 5, target: 'data', node: target, label: 'انتخاب ' + NODES[target],
    };
  }
  const hot = state.nodes.findIndex((node, id) => node.heat >= 75 && canDrone(state, id));
  if (hot !== -1) return {
    text: 'رک «' + NODES[hot] + '» داغ است. با پهپاد خنکش کن یا از رک دیگر استفاده کن.',
    target: 'data', node: hot, label: 'انتخاب ' + NODES[hot],
  };
  if (canNotify(state)) return {
    text: 'پخش ناپایدار است. از محوطهٔ کنسرت به تماشاگران خبر بده.',
    target: 'venue', label: 'رفتن به کنسرت',
  };
  if (state.queue.length && rack === -1) return {text: 'برای ارسال بسته، منتظر آزاد شدن یکی از رک‌ها بمان.'};
  if (state.backup.active) return {text: 'پخش پشتیبان برقرار است. صف را کوتاه نگه دار تا کنسرت تمام شود.'};
  return {text: 'پخش برقرار است. وضعیت صف و دمای رک‌ها را زیر نظر بگیر.'};
}

function rackStatus(node) {
  return node.offline ? 'قطع' : node.heat >= 75 ? 'داغ' : node.work ? 'مشغول' : 'آزاد';
}

function zoneStatus() {
  if (zone === 'data') {
    const node = state.nodes[selected];
    return 'رک ' + NODES[selected] + ' · ' + rackStatus(node) + ' · ' + num(node.heat) + '°';
  }
  if (zone === 'venue') {
    if (state.audience.until > state.time) return 'خبررسانی فعال · ' + seconds(state.audience.until - state.time);
    if (state.audience.ready > state.time) return 'خبررسانی دوباره تا ' + seconds(state.audience.ready - state.time);
    return 'کنسرت · کیفیت پخش ' + num(state.quality) + '٪';
  }
  return state.backup.active ? 'مرکز کنترل · پشتیبان فعال' :
    state.backup.arrive ? 'مرکز کنترل · پشتیبان در حال راه‌اندازی' : 'مرکز کنترل · آمادهٔ پشتیبانی';
}

function update() {
  const playing = phase === 'playing';
  const interactive = playing;
  const readyIn = state.drone.ready - state.time;
  set(ui.clock, clock(DURATION - state.time));
  set(ui.stream, phase === 'menu' || phase === 'training' ? 'آماده' : state.quality === 0 ? 'قطع شده' :
    state.quality < 70 ? 'ناپایدار' : state.backup.active ? 'پشتیبان' : 'برقرار');
  ui.stream.className = state.quality < 70 ? 'danger' : 'healthy';
  set(ui.trust, num(Math.ceil(state.trust)) + '٪');
  set(ui.queue, num(state.queue.length) + ' بسته');
  set(ui.alert, phase === 'menu' ? 'آمادهٔ شروع مأموریت' : state.alert);
  ui['first-step'].hidden = phase !== 'training';
  ui['show-opening'].hidden = phase !== 'menu';
  document.body.dataset.phase = phase;
  recommendation = guide();
  set(ui.guide, recommendation.text);
  ui.guide.classList.toggle('danger', Boolean(recommendation.urgent));
  ui.jump.hidden = !interactive || !recommendation.target ||
    (zone === recommendation.target && (recommendation.node === undefined || selected === recommendation.node));
  if (!ui.jump.hidden) set(ui.jump, recommendation.label);
  set(ui.selection, zoneStatus());
  set(ui.detail, state.drone.target >= 0 ? 'پهپاد در راه' : readyIn > 0 ?
    'شارژ پهپاد · ' + seconds(readyIn) : 'پهپاد آماده');
  ui['node-picks'].hidden = zone !== 'data';
  nodes.forEach((el, id) => {
    const node = state.nodes[id];
    el.disabled = !interactive;
    el.dataset.status = node.offline ? 'offline' : node.heat >= 75 ? 'hot' : node.work ? 'busy' : 'free';
    set(el, NODES[id] + ' · ' + rackStatus(node));
  });
  for (const id of ['route', 'drone', 'backup', 'audience']) {
    ui[id].hidden = zone !== (id === 'backup' ? 'control' : id === 'audience' ? 'venue' : 'data');
  }
  ui.route.disabled = !interactive || !canRoute(state, selected);
  ui.drone.disabled = !playing || !canDrone(state, selected);
  ui.backup.disabled = !playing || !canBackup(state);
  ui.audience.disabled = !playing || !canNotify(state);
  ui.decision.hidden = !playing || !state.decision;
  if (!ui.decision.hidden) set(ui['decision-time'], 'اولویت · ' + seconds(state.decision.until - state.time));
  ui.pause.disabled = !playing && phase !== 'paused';
  zones.forEach(el => { el.disabled = !interactive; });
  ui.stage.dataset.broadcast = state.quality === 0 ? 'outage' : state.backup.active ? 'backup' : 'primary';
  ui.stage.dataset.phase = phase;
  ui.stage.dataset.result = state.result ?? '';
}

function audioTone(hz = 480, length = .15, gain = .045) {
  if (muted) return;
  try {
    sound ??= new AudioContext();
    if (sound.state === 'suspended') sound.resume().catch(() => {});
    const time = sound.currentTime;
    const oscillator = sound.createOscillator(), volume = sound.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = hz;
    volume.gain.setValueAtTime(.0001, time);
    volume.gain.exponentialRampToValueAtTime(gain, time + .018);
    volume.gain.exponentialRampToValueAtTime(.0001, time + length);
    oscillator.connect(volume).connect(sound.destination);
    oscillator.start(time);
    oscillator.stop(time + length);
  } catch { /* Audio is optional. */ }
}

function finish() {
  phase = 'result';
  let best = state.score;
  try {
    best = Math.max(best, Number(localStorage.getItem('arvan-concert-best-v2')) || 0);
    localStorage.setItem('arvan-concert-best-v2', String(best));
  } catch { /* Storage is optional. */ }
  const won = state.result === 'win';
  set(ui['overlay-kicker'], 'گزارش مأموریت');
  set(ui['overlay-title'], won ? 'کنسرت به پایان رسید!' : 'مأموریت ناتمام ماند');
  set(ui['overlay-copy'], won ? 'پخش تا پایان هفت دقیقه ادامه پیدا کرد.' : state.reason === 'trust' ?
    'اعتماد تماشاگران به صفر رسید. صف را کوتاه نگه دار و هنگام اختلال خبر بده.' :
    'مهلت قطع پخش تمام شد. در اجرای بعدی زودتر مسیر پشتیبان را روشن کن.');
  const stats = [
    ['امتیاز / رکورد', num(state.score) + ' / ' + num(best)],
    ['بستهٔ تکمیل / از دست رفته', num(state.served) + ' / ' + num(state.lost)],
    ['ارسال دستی / بازیابی پهپاد', num(state.manualServed) + ' / ' + num(state.repairs)],
    ['زمان قطع پخش', seconds(state.blackoutTotal)],
  ];
  ui.summary.replaceChildren(...stats.flatMap(([label, value]) => {
    const term = document.createElement('dt'), detail = document.createElement('dd');
    set(term, label);
    set(detail, value);
    return [term, detail];
  }));
  ui.summary.hidden = false;
  set(ui.start, 'بازی دوباره');
  ui.overlay.hidden = false;
  ui.start.focus();
  audioTone(won ? 780 : 200, .7);
}

function start() {
  if (phase === 'paused') { togglePause(); return; }
  if (phase !== 'menu' && phase !== 'result') return;
  state = createMission(crypto.getRandomValues(new Uint32Array(1))[0]);
  remaining = 0;
  phase = 'training';
  ui.overlay.hidden = true;
  ui.summary.hidden = true;
  select('data', 0);
  audioTone();
  ui['first-signal'].focus({preventScroll: true});
}

function startClock() {
  phase = 'playing';
  remaining = 0;
  update();
}

function togglePause() {
  if (phase !== 'playing' && phase !== 'paused') return;
  const paused = phase === 'playing';
  phase = paused ? 'paused' : 'playing';
  ui.overlay.hidden = !paused;
  set(ui.pause, paused ? 'ادامه' : 'مکث');
  if (paused) {
    set(ui['overlay-kicker'], 'مأموریت متوقف است');
    set(ui['overlay-title'], 'استراحت کوتاه');
    set(ui['overlay-copy'], 'با ادامهٔ مأموریت، از همین لحظه به کنسرت برمی‌گردی.');
    set(ui.start, 'ادامهٔ مأموریت');
    ui.start.focus();
  } else ui.pause.focus({preventScroll: true});
  update();
}

function run(action, argument) {
  if (phase !== 'playing') return;
  if (command(state, action, argument)) audioTone(action === 'backup' ? 680 : 410);
  update();
}

zones.forEach(el => el.addEventListener('click', () => select(el.dataset.zone)));
nodes.forEach(el => el.addEventListener('click', () => select('data', Number(el.dataset.node))));
ui.jump.addEventListener('click', () => {
  const {target, node} = recommendation;
  select(target, node);
  const button = target === 'control' ? ui.backup : target === 'venue' ? ui.audience :
    ui.drone.disabled ? ui.route : ui.drone;
  if (!button.disabled && !button.hidden) button.focus({preventScroll: true});
  else zones.find(el => el.dataset.zone === target)?.focus({preventScroll: true});
});
ui.route.addEventListener('click', () => run('route', selected));
ui.drone.addEventListener('click', () => run('drone', selected));
ui.backup.addEventListener('click', () => run('backup'));
ui.audience.addEventListener('click', () => run('audience'));
ui['policy-entry'].addEventListener('click', () => run('policy', 'entry'));
ui['policy-stream'].addEventListener('click', () => run('policy', 'stream'));
ui['first-signal'].addEventListener('click', () => {
  if (phase !== 'training' || !command(state, 'route', 0)) return;
  set(ui.alert, 'سیگنال کنسرت به ایستگاه سپهر فرستاده شد.');
  state.alert = ui.alert.textContent;
  audioTone(520);
  startClock();
  ui.guide.focus({preventScroll: true});
});
ui.start.addEventListener('click', start);
ui.pause.addEventListener('click', togglePause);
ui.mute.addEventListener('click', () => {
  muted = !muted;
  ui.mute.setAttribute('aria-pressed', String(muted));
  set(ui.mute, 'صدا: ' + (muted ? 'قطع' : 'روشن'));
  audioTone(580);
});
ui.zoom.addEventListener('click', () => {
  zoomed = !zoomed;
  ui.zoom.setAttribute('aria-pressed', String(zoomed));
  set(ui.zoom, zoomed ? 'زوم −' : 'زوم +');
  view.zoom(zoomed);
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && phase === 'playing') togglePause();
});

function frame(now) {
  const delta = frameTime === undefined ? 0 : Math.min(1000, now - frameTime);
  frameTime = now;
  if (phase !== 'paused') animation += delta / 1000;
  if (phase === 'playing') {
    remaining += delta;
    while (remaining >= 1000 && !state.result) {
      remaining -= 1000;
      const event = state.event, warning = state.warned, blackout = state.quality === 0;
      tick(state);
      if (state.result) finish();
      else if (event !== state.event || warning !== state.warned || blackout !== (state.quality === 0)) {
        audioTone(state.quality === 0 ? 255 : 570, .32);
      } else if (state.time % 2 === 0) {
        audioTone([164, 196, 220, 196][Math.floor(state.time / 2) % 4], .36, .014);
      }
      update();
    }
  }
  view.render(state, selected, zone, state.time + remaining / 1000, animation,
    phase === 'training' || ((phase === 'playing' || phase === 'paused') && state.time < 6));
  requestAnimationFrame(frame);
}

const storyKey = 'arvan-concert-story-seen';
const video = ui['opening-video'];
const mediaQuery = matchMedia('(prefers-reduced-motion: reduce)');
const captions = [
  'این مسیر روشن، سیگنال کنسرت را به شهر می‌رساند.',
  'سیگنال را بین ایستگاه‌ها بفرست؛ اگر یکی از کار افتاد، پهپاد را اعزام کن.',
  'اگر پخش قطع شد، مسیر پشتیبان را روشن کن تا تماشاگران همراه بمانند.',
];
const completeStory = 'سیگنال را بفرست و هفت دقیقه پخش زنده را حفظ کن. اگر ایستگاهی از کار افتاد، پهپاد را بفرست؛ اگر پخش قطع شد، پشتیبان را روشن کن.';
let loadDeadline;
let inStory = false;
let mediaConfigured = false;
const videoUrl = document.documentElement.dataset.openingVideo;
const posterUrl = document.documentElement.dataset.openingPoster;

function saveStory() {
  try { localStorage.setItem(storyKey, '1'); } catch { /* Sessions without storage still work. */ }
}

function fallbackStory() {
  clearTimeout(loadDeadline);
  video.pause();
  video.removeAttribute('src');
  video.load();
  video.hidden = true;
  ui['opening-video-actions'].hidden = true;
  const still = ui['opening-still'];
  still.hidden = !posterUrl;
  if (posterUrl) still.src = posterUrl;
  ui['opening-media'].hidden = !posterUrl;
  set(ui['opening-caption'], completeStory);
  ui['opening-continue'].hidden = false;
}

function playPauseLabel() {
  set(ui['opening-play'], video.ended ? 'بازپخش ویدیو' : video.paused ? 'پخش ویدیو' : 'مکث ویدیو');
}

function watchMedia() {
  clearTimeout(loadDeadline);
  loadDeadline = setTimeout(() => {
    if (inStory && video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) fallbackStory();
  }, 2200);
}

function requestVideo() {
  if (!inStory || !mediaConfigured) return;
  watchMedia();
  video.play().catch(error => {
    if (!inStory || video.hidden) return;
    if (error.name === 'NotSupportedError') fallbackStory();
    else {
      playPauseLabel();
      set(ui['opening-caption'], completeStory);
      ui['opening-continue'].hidden = false;
    }
  });
}

function openStory() {
  inStory = true;
  phase = 'intro';
  ui.opening.hidden = false;
  document.querySelector('.shell').hidden = true;
  ui['opening-continue'].hidden = true;
  set(ui['opening-caption'], captions[0]);
  update();
  mediaConfigured = Boolean(videoUrl);
  if (mediaConfigured) {
    video.hidden = false;
    ui['opening-still'].hidden = true;
    ui['opening-video-actions'].hidden = false;
    video.muted = true;
    ui['opening-sound'].setAttribute('aria-pressed', 'false');
    set(ui['opening-sound'], 'روشن کردن صدا');
    if (posterUrl) video.poster = posterUrl;
    ui['opening-media'].hidden = false;
    set(ui['opening-play'], 'پخش ویدیو');
    video.src = videoUrl;
    if (mediaQuery.matches) {
      ui['opening-continue'].hidden = false;
      set(ui['opening-caption'], completeStory);
    } else requestVideo();
  } else fallbackStory();
  ui['opening-skip'].focus({preventScroll: true});
}

function leaveStory() {
  if (!inStory) return;
  inStory = false;
  clearTimeout(loadDeadline);
  saveStory();
  video.pause();
  video.removeAttribute('src');
  video.load();
  ui.opening.hidden = true;
  document.querySelector('.shell').hidden = false;
  phase = 'menu';
  start();
}

ui['opening-skip'].addEventListener('click', leaveStory);
ui['opening-continue'].addEventListener('click', leaveStory);
ui['show-opening'].addEventListener('click', openStory);
ui['opening-play'].addEventListener('click', () => {
  if (video.paused || video.ended) requestVideo();
  else video.pause();
});
ui['opening-sound'].addEventListener('click', () => {
  video.muted = !video.muted;
  ui['opening-sound'].setAttribute('aria-pressed', String(!video.muted));
  set(ui['opening-sound'], video.muted ? 'روشن کردن صدا' : 'قطع کردن صدا');
});
video.addEventListener('playing', () => {
  clearTimeout(loadDeadline);
  ui['opening-continue'].hidden = true;
  playPauseLabel();
});
video.addEventListener('pause', () => { clearTimeout(loadDeadline); playPauseLabel(); });
video.addEventListener('waiting', () => { if (inStory && !video.paused) watchMedia(); });
ui['opening-still'].addEventListener('error', () => {
  if (video.hidden) ui['opening-media'].hidden = true;
});
video.addEventListener('error', () => {
  if (inStory && video.hasAttribute('src')) fallbackStory();
});
video.addEventListener('timeupdate', () => {
  if (!inStory || ui['opening-media'].hidden) return;
  set(ui['opening-caption'], captions[video.currentTime < 2.3 ? 0 : video.currentTime < 5.1 ? 1 : 2]);
});
video.addEventListener('ended', () => {
  if (!inStory) return;
  saveStory();
  set(ui['opening-caption'], completeStory);
  ui['opening-continue'].hidden = false;
  playPauseLabel();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && inStory) video.pause();
});

let returning = false;
try { returning = localStorage.getItem(storyKey) === '1'; } catch { /* Start with the story. */ }
if (!returning) openStory();

update();
requestAnimationFrame(frame);
