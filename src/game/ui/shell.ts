export function buildShell(mount: HTMLElement): HTMLElement {
  mount.innerHTML = `
    <main class="site-shell">
      <div class="desktop-rail" aria-hidden="true">
        <div class="rail-top"><span class="rail-mark">SP<span>_</span></span><span class="rail-edition">ARCADE / 001</span></div>
        <div class="rail-content"><span class="overline">AN ORIGINAL MINI-GAME</span><h2>KEEP THE<br><em>SYSTEM</em><br>ALIVE.</h2><p>Route the rush.<br>Beat the heat.<br>Save the rack.</p></div>
        <div class="rail-bottom"><span class="rail-dot"></span> HUMAN OPERATED · 90 SEC</div>
      </div>
      <section class="game-shell" id="game-shell" aria-label="بازی نجات سرور">
        <header class="topbar">
          <div class="top-brand"><div class="brand-mark"><img src="./assets/icon.webp" width="38" height="38" alt=""/></div>
            <div class="top-brand-text"><strong>SERVER<span>PANIC</span></strong><small>نجات سرور · DATA CENTER ARCADE</small></div>
          </div>
          <button type="button" class="icon-btn sound-btn" data-action="mute" aria-label="قطع و وصل صدا"><span id="sound-icon">♫</span><span class="sr-only" id="sound-label">صدا روشن</span></button>
        </header>
        <div class="hud-line">
          <div class="metric score-metric"><span class="metric-title">امتیاز <i>›</i> SCORE</span><div id="hud-score" class="metric-value">0</div></div>
          <div class="metric time-metric"><span class="metric-title">زمان باقی‌مانده</span><div class="metric-value timer-value"><span id="hud-time">90</span><span class="seconds">s</span></div></div>
          <div class="metric combo-metric"><span class="metric-title">COMBO</span><div id="hud-combo" class="metric-value combo-value">×1</div></div>
        </div>
        <div class="time-track"><span id="timer-fill" class="time-fill" style="width:100%"></span></div>
        <div class="scene-overline"><span class="live-indicator"><i></i> LIVE DATA CENTER</span><span>WAVE <b id="hud-level">01</b> / 06</span></div>
        <div id="stage-container" class="stage-container">
          <div id="game-stage" class="game-stage"></div>
          <div class="scan-glow" aria-hidden="true"></div>
          <div class="stage-caption" id="stage-label">سروری را برای پردازش انتخاب کن</div>
        </div>
        <div class="rack-cards" aria-label="کنترل‌های دسترس‌پذیر سرورها">
          <button type="button" class="rack-card" data-rack="0" data-action="rack0"><span class="rack-name">01 / آلفا</span><span class="rack-heat"><span class="rack-heat-fill"></span></span><span class="rack-footer"><span class="rack-temp">30°</span><small class="rack-state">پایدار</small></span></button>
          <button type="button" class="rack-card" data-rack="1" data-action="rack1"><span class="rack-name">02 / بتا</span><span class="rack-heat"><span class="rack-heat-fill"></span></span><span class="rack-footer"><span class="rack-temp">30°</span><small class="rack-state">پایدار</small></span></button>
          <button type="button" class="rack-card" data-rack="2" data-action="rack2"><span class="rack-name">03 / گاما</span><span class="rack-heat"><span class="rack-heat-fill"></span></span><span class="rack-footer"><span class="rack-temp">30°</span><small class="rack-state">پایدار</small></span></button>
        </div>
        <div id="gameplay-actions" class="action-area" hidden>
          <div class="queue-top"><div class="queue-label"><span class="queue-dot"></span><span>صف درخواست‌های ورودی</span><small id="queue-warning" hidden>هشدار ازدحام!</small></div><b id="queue-count">0/9</b></div>
          <div class="queue-packets" id="queue-packets" aria-live="off"></div>
          <button type="button" class="cool-button" id="cool-button" data-action="cool">
            <span class="cool-symbol" id="cool-icon">❄</span><span class="cool-copy"><strong>اعزام پهپاد خنک‌کننده</strong><small id="cool-state">آمادهٔ اعزام</small></span><span class="cool-chevron">←</span><span id="cool-progress" class="cool-progress"></span>
          </button>
        </div>
        <footer class="bottom-status"><span class="status-indicator"></span><span id="status-message">SYSTEMS NOMINAL</span><span class="version-tag">v0.1</span></footer>
        <section id="panel-menu" class="overlay" aria-labelledby="menu-title">
          <div class="menu-top"><span class="eyebrow">WELCOME TO YOUR NIGHT SHIFT</span><span class="mini-chip">90 SEC CHALLENGE</span></div>
          <div class="menu-center"><div class="logo-hero"><img src="./assets/icon.webp" alt="" width="78" height="78"/></div>
            <div class="menu-logo" id="menu-title">SERVER<span>PANIC</span><span class="logo-alert">!</span></div>
            <div class="menu-persian">نجات سرور</div>
            <p>سه سرور. هزاران درخواست.<br>فقط <b>۹۰ ثانیه</b> تا فاجعه.</p>
            <div class="best-display"><span>بهترین امتیاز شما</span><strong id="best-menu">0</strong><span class="best-trophy">★</span></div>
          </div>
          <div class="menu-bottom"><button type="button" data-action="play" class="primary-btn"><span>شروع عملیات</span><span>←</span></button>
          <button type="button" data-action="tutorial" class="secondary-btn">چطور بازی کنم؟ <span>↗</span></button></div>
          <span class="overlay-accent overlay-accent-a"></span><span class="overlay-accent overlay-accent-b"></span>
        </section>
        <section id="panel-tutorial" class="overlay info-overlay" hidden aria-label="آموزش بازی">
          <div class="tutorial-heading"><span class="eyebrow">OPERATOR'S MANUAL / 001</span><h2>قبل از بحران،<br><em>قوانین رو یاد بگیر!</em></h2><p>چهار مرحله، یک مأموریت ساده.</p></div>
          <div class="tutorial-steps">
            <div class="tutorial-step"><span class="tutorial-icon">⌁</span><div><b>۱. درخواست‌ها رو بفرست</b><p>روی یکی از سرورها بزن تا اولین بستهٔ صف پردازش بشه.</p></div></div>
            <div class="tutorial-step"><span class="tutorial-icon warm">♨</span><div><b>۲. مراقب دما باش</b><p>وقتی بیش از حد گرم بشن، برای چند ثانیه خاموش می‌شن.</p></div></div>
            <div class="tutorial-step"><span class="tutorial-icon cool">❄</span><div><b>۳. پهپاد رو اعزام کن</b><p>اول دکمهٔ خنک‌سازی و بعد سرور هدف رو انتخاب کن.</p></div></div>
            <div class="tutorial-step"><span class="tutorial-icon safe">◷</span><div><b>۴. تا ثانیهٔ ۹۰ دوام بیار</b><p>نگذار صف پر بمونه یا همهٔ سرورها هم‌زمان از کار بیفتن.</p></div></div>
          </div>
          <div class="menu-bottom"><button type="button" data-action="play" class="primary-btn">فهمیدم، بریم! <span>←</span></button><button type="button" data-action="back" class="secondary-btn">بازگشت</button></div>
        </section>
        <section id="panel-results" class="overlay result-overlay" hidden aria-label="نتیجهٔ بازی">
          <div class="result-head"><span class="eyebrow" id="result-eyebrow">MISSION COMPLETED</span><div class="result-star">✦</div><h2 id="result-title">مرکز داده نجات پیدا کرد!</h2><p id="result-description">شب نجات پیدا کرد</p></div>
          <div class="result-score-area"><span class="result-caption">امتیاز نهایی شما</span><strong id="result-score">0</strong><span class="result-record" id="result-badge">رکورد جدید!</span></div>
          <div class="result-stats"><div><span>بهترین رکورد</span><b id="result-best">0</b></div><div><span>بسته‌های پردازش‌شده</span><b id="result-processed">0</b></div><div><span>سرورهای بازیابی‌شده</span><b id="result-recovered">0</b></div><div><span>بیشترین کمبو</span><b id="result-combo">×0</b></div></div>
          <div class="menu-bottom"><button type="button" data-action="play" class="primary-btn">یک بار دیگه! <span>←</span></button><button type="button" data-action="back" class="secondary-btn">صفحهٔ اصلی</button></div>
        </section>
      </section>
      <div class="desktop-aside" aria-hidden="true"><span>OPERATOR ID: 0001</span><span class="aside-line"></span><span>LOCAL HIGH SCORE ENABLED</span></div>
    </main>`;
  return mount;
}
