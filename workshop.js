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
  let at = 0;
  let timer = 0;
  let ends = 0;

  document.querySelector('[data-ws-actions]').hidden = false;

  function show(i) {
    at = Math.max(0, Math.min(slides.length - 1, i));
    slides.forEach((s, j) => { s.hidden = j !== at; });
    count.textContent = `Bild ${at + 1} av ${slides.length}`;
    history.replaceState(null, '', `#bild-${at + 1}`);
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
    stopTimer();
    if (document.fullscreenElement) document.exitFullscreen();
    history.replaceState(null, '', location.pathname);
    startBtn.focus();
  }

  function tick() {
    const left = Math.max(0, Math.round((ends - Date.now()) / 1000));
    const m = Math.floor(left / 60);
    const s = String(left % 60).padStart(2, '0');
    clock.textContent = left ? `${m}:${s}` : 'Tiden är ute';
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
    else if (k === 'End') { e.preventDefault(); show(slides.length - 1); }
    else if (k === 'Escape' && !document.fullscreenElement) close();
  });

  const m = /^#bild-(\d+)$/.exec(location.hash);
  if (m) open(Number(m[1]) - 1);
})();
