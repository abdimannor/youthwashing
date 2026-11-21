// Motion is on by default for every visitor. The pause button in the header
// turns it off, and the choice is kept in localStorage. This script runs in
// <head>, so <html data-motion="on|off"> is set before first paint; CSS and
// scripts read only that attribute, and a "motionchange" event tells scripts
// when it flips.
(() => {
  const KEY = 'motion';
  // UI strings: Swedish defaults, overridden by window.YW_I18N.motion.
  const T = Object.assign({ pause: 'Pausa rörelse', play: 'Starta rörelse' }, (window.YW_I18N || {}).motion);
  const root = document.documentElement;
  const stored = () => {
    try { return localStorage.getItem(KEY); } catch { return null; }
  };
  const apply = () => {
    root.dataset.motion = stored() === 'off' ? 'off' : 'on';
    document.dispatchEvent(new CustomEvent('motionchange', { detail: root.dataset.motion }));
  };
  apply();

  function render() {
    const on = root.dataset.motion === 'on';
    document.querySelectorAll('.ctl-motion').forEach((button) => {
      button.setAttribute('aria-pressed', String(on));
      const label = on ? T.pause : T.play;
      button.setAttribute('aria-label', label);
      button.title = label;
    });
  }

  function set(value) {
    try { localStorage.setItem(KEY, value); } catch { /* private mode */ }
    apply();
    render();
  }

  function wire() {
    document.querySelectorAll('.ctl-motion').forEach((button) => {
      button.addEventListener('click', () => set(root.dataset.motion === 'on' ? 'off' : 'on'));
    });
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();
})();
