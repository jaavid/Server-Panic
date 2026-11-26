import {
  BLACKOUT_LIMIT, canBackup, canDrone, canNotify, canRoute, command,
  createMission, DURATION, EVENTS, NODES, ROUTES, tick,
} from './mission.mjs';
import {city} from './city.mjs';

const ids = [
  'world', 'stage', 'clock', 'stream', 'trust', 'queue', 'goal', 'meter', 'guide', 'alert',
  'map-controls', 'dock', 'venue', 'control', 'drone', 'decision', 'decision-time',
  'policy-entry', 'policy-stream', 'overlay', 'overlay-title', 'overlay-kicker',
  'overlay-copy', 'summary', 'start', 'pause', 'mute', 'opening', 'opening-skip',
  'opening-media', 'opening-video', 'opening-play', 'opening-sound', 'opening-continue',
  'opening-caption', 'opening-still', 'opening-video-actions', 'show-opening',
];
const ui = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
const racks = [...document.querySelectorAll('[data-node]')];
const markers = [...document.querySelectorAll('[data-mark]')];
const numbers = new Intl.NumberFormat('fa-IR', {useGrouping: false});
const padded = new Intl.NumberFormat('fa-IR', {minimumIntegerDigits: 2, useGrouping: false});
const num = value => numbers.format(value);
const clock = seconds => padded.format(Math.floor(seconds / 60)) + ':' + padded.format(seconds % 60);
const seconds = value => num(Math.max(0, value)) + ' ثانیه';
const set = (el, text) => { if (el.textContent !== text) el.textContent = text; };
let state = createMission(), phase = 'menu', armed = false, pilot = false;
let route = null, repairNote = null, selected = -1, remaining = 0, frameTime, animation = 0, sound, muted = true;
const view = city(ui.world, markers, (area, id) => {
  if (area === 'venue') chooseVenue();
  if (area === 'control') chooseControl();
  if (area === 'data' && Number.isInteger(id)) chooseRack(id);
});

function brief() {
  if (phase === 'training') return armed ?
    'سریع یا خنک؟ مقصد را بزن.' :
    'روی «کنسرت» بزن.';
  if (canBackup(state)) return 'پخش قطع شد · ' + seconds(BLACKOUT_LIMIT - state.blackSeconds) + ' مهلت. روی «کنترل» بزن.';
  if (state.outage && !state.backup.active) return 'پشتیبان تا ' + seconds(state.backup.arrive - state.time) + ' دیگر بالا می‌آید.';
  if (pilot) return 'مقصد پهپاد را بزن.';
  if (state.drone.target >= 0) return 'پهپاد در راه «' + NODES[state.drone.target] + '» · ' + seconds(state.drone.arrive - state.time);
  const offline = state.nodes.findIndex((node, id) => node.offline && canDrone(state, id));
  if (offline !== -1) return '«' + NODES[offline] + '» قطع است. پهپاد را بفرست.';
  if (repairNote && state.time < repairNote.until) return repairNote.text;
  const due = state.queue[0]?.due;
  if (due != null) return 'سیگنال فوری · ' + seconds(due - state.time) + ' مهلت.';
  if (route && state.time - route.start < route.duration + 2) {
    const node = state.nodes[route.id], name = NODES[route.id];
    if (node.packet?.id === route.packetId) return 'سیگنال در راه «' + name + '» · ' + seconds(node.work) + ' تا رسیدن';
    if (node.lastDelivery?.id === route.packetId && !node.lastDelivery.timely) {
      return node.offline ? 'ایستگاه «' + name + '» قطع شد.' : 'سیگنال دیر رسید · مسیر سریع‌تر بگیر.';
    }
    return 'سیگنال از مسیر «' + name + '» وارد پخش شد.';
  }
  const event = EVENTS[state.event];
  if (event && state.warned === state.event) return event.label + ' · ' + seconds(event.t - state.time) + ' دیگر';
  if (state.queue.length) {
    if (state.time < 32) return 'سیگنال تازه · مقصد را بزن.';
    return num(state.queue.length) + ' سیگنال در صف.';
  }
  if (canNotify(state)) return 'به تماشاگران خبر بده.';
  return '';
}

function rackHint(node, id, training) {
  if (pilot) return canDrone(state, id) ? (node.offline ? 'بازیابی' : 'خنک‌کردن') : '';
  if (node.offline) return 'قطع';
  if (node.work) return 'در انتقال';
  if (training || state.time < 32 && state.queue.length) return num(ROUTES[id].duration) + 'ث · ' + ROUTES[id].label.split(' · ').at(-1);
  if (node.heat >= 75) return 'داغ · ' + num(node.heat) + '°';
  return state.queue.length ? num(ROUTES[id].duration) + 'ث' : '';
}

function update() {
  const training = phase === 'training', playing = phase === 'playing';
  const openMap = training || playing;
  if (pilot && !state.nodes.some((_, id) => canDrone(state, id))) pilot = false;
  set(ui.clock, clock(DURATION - state.time));
  set(ui.stream, training || phase === 'menu' ? 'آماده' : state.quality === 0 ? 'پخش قطع' :
    state.backup.active ? 'پشتیبان' : state.quality < 70 ? 'ناپایدار' : 'زنده');
  ui.stream.classList.toggle('danger', state.quality < 70);
  set(ui.trust, 'اعتماد ' + num(Math.ceil(state.trust)) + '٪');
  ui.queue.dataset.urgent = state.queue[0]?.due != null ? 'true' : 'false';
  set(ui.queue, state.queue.length ? 'صف ' + num(state.queue.length) : '');
  ui.meter.hidden = !playing;
  ui.dock.hidden = !openMap;
  ui['map-controls'].hidden = !openMap;
  ui.pause.disabled = !playing;
  ui.mute.disabled = !playing;
  ui['show-opening'].hidden = phase !== 'menu';
  set(ui.guide, brief());
  set(ui.alert, state.alert);
  ui.dock.classList.toggle('urgent', state.outage && !state.backup.active || state.queue[0]?.due != null);
  ui.venue.hidden = training && armed;
  const venueReady = training || playing && canNotify(state);
  ui.venue.classList.toggle('actionable', venueReady);
  ui.venue.setAttribute('aria-disabled', String(!venueReady));
  set(ui.venue.lastElementChild, training ? 'گرفتن سیگنال' : canNotify(state) ? 'خبر به تماشاگران' : '');
  ui.control.hidden = training;
  const controlReady = playing && canBackup(state);
  ui.control.classList.toggle('actionable', controlReady);
  ui.control.setAttribute('aria-disabled', String(!controlReady));
  set(ui.control.lastElementChild, canBackup(state) ? 'روشن‌کردن پشتیبان' : state.backup.active ? 'پشتیبان فعال' : '');
  racks.forEach((button, id) => {
    const node = state.nodes[id];
    const available = pilot ? canDrone(state, id) : canRoute(state, id);
    button.hidden = training && (!armed || id === 1);
    button.disabled = !openMap || training && !armed;
    button.classList.toggle('actionable', available);
    button.setAttribute('aria-disabled', String(!available));
    button.dataset.status = node.offline ? 'offline' : node.heat >= 75 ? 'hot' : node.work ? 'busy' : 'free';
    set(button.lastElementChild, rackHint(node, id, training));
  });
  ui.drone.hidden = !playing || !state.nodes.some((_, id) => canDrone(state, id));
  ui.drone.setAttribute('aria-pressed', String(pilot));
  set(ui.drone, pilot ? 'لغو انتخاب مقصد' : 'پهپاد · انتخاب مقصد');
  ui.decision.hidden = !playing || !state.decision;
  if (!ui.decision.hidden) set(ui['decision-time'], 'اولویت · ' + seconds(state.decision.until - state.time));
  document.body.dataset.phase = phase;
  ui.stage.dataset.phase = phase;
  ui.stage.dataset.broadcast = state.quality === 0 ? 'outage' : state.backup.active ? 'backup' : 'primary';
  ui.stage.dataset.result = state.result ?? '';
}

function chooseVenue() {
  if (phase === 'training' && !armed) {
    armed = true;
    audioTone(520);
    update();
    racks[0].focus({preventScroll: true});
  } else if (phase === 'playing' && command(state, 'audience')) {
    audioTone();
    update();
  }
}

function chooseControl() {
  if (phase === 'playing' && command(state, 'backup')) {
    audioTone(680);
    update();
  }
}

function chooseRack(id) {
  if (phase === 'training' && (!armed || id === 1)) return;
  if (phase !== 'training' && phase !== 'playing') return;
  selected = id;
  if (pilot) {
    if (command(state, 'drone', id)) {
      pilot = false;
      audioTone(720);
    }
  } else if (command(state, 'route', id)) {
    route = {id, packetId: state.nodes[id].packet.id, start: state.time, duration: ROUTES[id].duration};
    if (phase === 'training') {
      phase = 'playing';
      remaining = 0;
    }
    audioTone(410);
  }
  update();
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
  pilot = false;
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
  phase = 'training';
  armed = pilot = false;
  route = repairNote = null;
  selected = -1;
  remaining = 0;
  ui.overlay.hidden = true;
  ui.summary.hidden = true;
  update();
  ui.venue.focus({preventScroll: true});
}

function togglePause() {
  if (phase !== 'playing' && phase !== 'paused') return;
  const paused = phase === 'playing';
  phase = paused ? 'paused' : 'playing';
  ui.overlay.hidden = !paused;
  ui.pause.setAttribute('aria-label', paused ? 'ادامه' : 'مکث');
  if (paused) {
    set(ui['overlay-kicker'], 'مأموریت متوقف است');
    set(ui['overlay-title'], 'مکث');
    set(ui['overlay-copy'], 'از همین لحظه به کنسرت برمی‌گردی.');
    set(ui.start, 'ادامه');
    ui.start.focus();
  } else ui.pause.focus({preventScroll: true});
  update();
}

ui.venue.addEventListener('click', chooseVenue);
ui.control.addEventListener('click', chooseControl);
racks.forEach((button, id) => button.addEventListener('click', () => chooseRack(id)));
ui.drone.addEventListener('click', () => {
  if (phase !== 'playing') return;
  pilot = !pilot;
  update();
  if (pilot) {
    const target = state.nodes.findIndex((node, id) => node.offline && canDrone(state, id));
    const available = target === -1 ? state.nodes.findIndex((_, id) => canDrone(state, id)) : target;
    if (available >= 0) racks[available].focus({preventScroll: true});
  }
});
ui['policy-entry'].addEventListener('click', () => { if (command(state, 'policy', 'entry')) update(); });
ui['policy-stream'].addEventListener('click', () => { if (command(state, 'policy', 'stream')) update(); });
ui.start.addEventListener('click', start);
ui.pause.addEventListener('click', togglePause);
ui.mute.addEventListener('click', () => {
  muted = !muted;
  ui.mute.setAttribute('aria-pressed', String(muted));
  ui.mute.setAttribute('aria-label', muted ? 'صدا: قطع' : 'صدا: روشن');
  audioTone(580);
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
      const target = state.drone.target;
      tick(state);
      if (target >= 0 && state.drone.target < 0) {
        repairNote = {text: 'پهپاد برگشت · «' + NODES[target] + '» آمادهٔ انتقال سیگنال است.', until: state.time + 4};
      }
      if (state.result) finish();
      else if (event !== state.event || warning !== state.warned || blackout !== (state.quality === 0)) {
        audioTone(state.quality === 0 ? 255 : 570, .32);
      }
      update();
    }
  }
  view.render(state, selected, state.time + remaining / 1000, animation, route, phase === 'training' && armed);
  requestAnimationFrame(frame);
}

const storyKey = 'arvan-concert-story-seen';
const video = ui['opening-video'];
const mediaQuery = matchMedia('(prefers-reduced-motion: reduce)');
const captions = [
  'سیگنال را به شهر برسان.',
  'ایستگاه قطع شد؟ پهپاد را بفرست.',
  'پخش قطع شد؟ پشتیبان را روشن کن.',
];
const completeStory = '۷ دقیقه پخش زنده. ایستگاه قطع شد؟ پهپاد. پخش قطع شد؟ پشتیبان.';
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
