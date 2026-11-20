// Motion switch. The OS setting (prefers-reduced-motion) is the default;
// a visible switch overrides it and the choice is kept in localStorage.
// The result lives on <html data-motion="on|off"> for CSS and scripts,
// and a "motionchange" event tells scripts when it flips.
(() => {
  const KEY = 'motion';
  const root = document.documentElement;
  const os = matchMedia('(prefers-reduced-motion: reduce)');
  const stored = () => {
    try { return localStorage.getItem(KEY); } catch { return null; }
  };
  const current = () => stored() || (os.matches ? 'off' : 'on');
  const apply = () => {
    root.dataset.motion = current();
    document.dispatchEvent(new CustomEvent('motionchange', { detail: root.dataset.motion }));
  };
  apply();
  os.addEventListener('change', apply);

  function set(value) {
    try { localStorage.setItem(KEY, value); } catch { /* private mode */ }
    apply();
    render();
  }

  let button, notice;
  function render() {
    if (!button) return;
    const on = root.dataset.motion === 'on';
    button.setAttribute('aria-pressed', String(on));
    button.querySelector('span').textContent = on ? 'på' : 'av';
    if (notice) notice.hidden = !(os.matches && !stored());
  }

  function build() {
    button = document.createElement('button');
    button.type = 'button';
    button.className = 'motion-toggle';
    button.append('Animationer: ', document.createElement('span'));
    button.addEventListener('click', () => set(root.dataset.motion === 'on' ? 'off' : 'on'));

    notice = document.createElement('div');
    notice.className = 'motion-notice';
    notice.setAttribute('role', 'region');
    notice.setAttribute('aria-label', 'Animationer');
    const text = document.createElement('p');
    text.textContent = 'Din enhet ber om minskad rörelse, så animationerna står still.';
    const play = document.createElement('button');
    play.type = 'button';
    play.className = 'motion-play';
    play.textContent = '▶ Spela animationerna';
    play.addEventListener('click', () => set('on'));
    const keep = document.createElement('button');
    keep.type = 'button';
    keep.className = 'motion-keep';
    keep.textContent = 'Behåll stilla';
    keep.addEventListener('click', () => set('off'));
    notice.append(text, play, keep);

    const nav = document.querySelector('header nav');
    (nav || document.body).append(button);
    const main = document.querySelector('main');
    if (main) main.before(notice); else document.body.prepend(notice);
    os.addEventListener('change', render);
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
