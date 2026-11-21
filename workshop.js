// Workshop mode: one slide at a time for a projector.
// Arrow keys, space, PageUp/PageDown, Home/End move; Esc ends the show.
// Without JS the slides read as a plain document.
// Slide transitions follow <html data-motion>, set by motion.js.
(() => {
  const deck = document.querySelector('[data-deck]');
  if (!deck) return;
  const slides = [...deck.querySelectorAll('.slide')];
  const bar = deck.querySelector('[data-deck-bar]');
  const count = deck.querySelector('[data-ws-count]');
  const clock = deck.querySelector('[data-ws-clock]');
  const stop = deck.querySelector('[data-ws-timer-stop]');
  const fullBtn = deck.querySelector('[data-ws-full]');
  const startBtn = document.querySelector('[data-ws-start]');
  const root = document.documentElement;
  // UI strings: Swedish defaults, overridden by window.YW_I18N.workshop.
  const T = Object.assign({
    count: (n, total) => `Bild ${n} av ${total}`,
    hash: 'bild',
    timeUp: 'Tiden är ute',
  }, (window.YW_I18N || {}).workshop);
  let at = 0;
  // Slide order: all slides, or the order from group mode (#ordning=10,12,9,11).
  let order = slides.map((_, i) => i);
  let ordered = false;
  let timer = 0;
  let ends = 0;

  document.querySelector('[data-ws-actions]').hidden = false;

  // Original slide labels and kickers ("Fyra kontrollfrågor · 1/4"), restored on close.
  const kicker = (s) => s.querySelector('.sl-kicker');
  const saved = slides.map((s) => ({ label: s.getAttribute('aria-label'), kicker: kicker(s) && kicker(s).textContent }));

  // In an ordered subset, number the slides by their place in that order.
  function relabel() {
    slides.forEach((s, j) => {
      const pos = order.indexOf(j);
      const k = kicker(s);
      if (ordered && pos >= 0) {
        s.setAttribute('aria-label', T.count(pos + 1, order.length));
        if (k) k.textContent = saved[j].kicker.replace(/\d+\/\d+$/, `${pos + 1}/${order.length}`);
      } else {
        s.setAttribute('aria-label', saved[j].label);
        if (k) k.textContent = saved[j].kicker;
      }
    });
  }

  function show(i) {
    at = Math.max(0, Math.min(order.length - 1, i));
    slides.forEach((s, j) => { s.hidden = j !== order[at]; });
    count.textContent = T.count(at + 1, order.length);
    if (!ordered) history.replaceState(null, '', `#${T.hash}-${order[at] + 1}`);
  }

  function open(i = 0) {
    root.classList.add('is-presenting');
    bar.hidden = false;
    show(i);
    deck.focus();
  }

  function close() {
    root.classList.remove('is-presenting');
    bar.hidden = true;
    slides.forEach((s) => { s.hidden = false; });
    order = slides.map((_, i) => i);
    ordered = false;
    relabel();
    stopTimer();
    if (document.fullscreenElement) document.exitFullscreen();
    history.replaceState(null, '', location.pathname);
    startBtn.focus();
  }

  function tick() {
    const left = Math.max(0, Math.round((ends - Date.now()) / 1000));
    const m = Math.floor(left / 60);
    const s = String(left % 60).padStart(2, '0');
    clock.textContent = left ? `${m}:${s}` : T.timeUp;
    clock.classList.toggle('is-done', !left);
    if (!left) { clearInterval(timer); timer = 0; }
  }

  function startTimer(min) {
    stopTimer();
    ends = Date.now() + min * 60000;
    stop.hidden = false;
    tick();
    timer = setInterval(tick, 250);
  }

  function stopTimer() {
    clearInterval(timer);
    timer = 0;
    clock.textContent = '';
    clock.classList.remove('is-done');
    stop.hidden = true;
  }

  deck.tabIndex = -1;
  startBtn.addEventListener('click', () => open(0));
  deck.querySelector('[data-ws-prev]').addEventListener('click', () => show(at - 1));
  deck.querySelector('[data-ws-next]').addEventListener('click', () => show(at + 1));
  deck.querySelector('[data-ws-exit]').addEventListener('click', close);
  deck.querySelectorAll('[data-ws-timer]').forEach((b) => {
    b.addEventListener('click', () => startTimer(Number(b.dataset.wsTimer)));
  });
  stop.addEventListener('click', stopTimer);
  if (!document.fullscreenEnabled) fullBtn.hidden = true;
  fullBtn.addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else root.requestFullscreen().catch(() => {});
  });

  document.addEventListener('keydown', (e) => {
    if (!root.classList.contains('is-presenting')) return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const onButton = e.target.closest && e.target.closest('button');
    const k = e.key;
    if (k === 'ArrowRight' || k === 'ArrowDown' || k === 'PageDown' || (k === ' ' && !onButton)) { e.preventDefault(); show(at + 1); }
    else if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp') { e.preventDefault(); show(at - 1); }
    else if (k === 'Home') { e.preventDefault(); show(0); }
    else if (k === 'End') { e.preventDefault(); show(order.length - 1); }
    else if (k === 'Escape' && !document.fullscreenElement) close();
  });

  const m = new RegExp(`^#${T.hash}-(\\d+)$`).exec(location.hash);
  if (m) open(Number(m[1]) - 1);
  const g = /^#(?:ordning|order)=([\d,]+)$/.exec(location.hash);
  if (g) {
    const list = [...new Set(g[1].split(',').map((n) => Number(n) - 1))].filter((n) => slides[n]);
    if (list.length) { order = list; ordered = true; relabel(); open(0); }
  }
})();
