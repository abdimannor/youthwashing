// Self-assessment: "Hur verkligt är inflytandet?"
// Uses only the site's own criteria: the four control questions (om.html),
// the three warning signals and the four levels (index.html). Runs fully
// client-side; the section stays hidden without JavaScript.
(() => {
  const section = document.getElementById('test');
  if (!section) return;
  section.hidden = false;

  const form = section.querySelector('.ax-form');
  const result = section.querySelector('.ax-result');
  const verdict = section.querySelector('.ax-verdict');
  const error = section.querySelector('.ax-error');
  const steps = [...section.querySelectorAll('.ax-ladder li')];
  const canvas = section.querySelector('.ax-card');
  const keys = ['timing', 'mandat', 'resurser', 'aterkoppling'];
  const labels = { timing: 'Timing', mandat: 'Mandat', resurser: 'Resurser', aterkoppling: 'Återkoppling' };
  const words = ['Nej', 'Delvis', 'Ja'];
  const still = () => document.documentElement.dataset.motion === 'off';

  // Level names and descriptions are read from the page's own ladder.
  const levels = [...document.querySelectorAll('.ladder li')].map((li) => ({
    name: li.querySelector('strong').textContent.trim(),
    text: li.querySelector('span').textContent.trim(),
  }));

  // Placement rules (also explained in the "Så räknas placeringen" box).
  function place(a, signals) {
    let level = 0;
    if (a.mandat === 2 && a.resurser === 2) level = 3;
    else if (a.timing === 2 && a.mandat >= 1) level = 2;
    else if (a.mandat >= 1 || a.timing >= 1 || a.aterkoppling >= 1) level = 1;
    return Math.max(0, level - signals.length);
  }

  function read() {
    const data = new FormData(form);
    const a = {};
    for (const k of keys) {
      const v = data.get(k);
      if (v === null) return null;
      a[k] = Number(v);
    }
    return { a, signals: data.getAll('signal'), org: String(data.get('org') || '').trim() };
  }

  function encode(s) {
    return keys.map((k) => s.a[k]).join('') + '-' + s.signals.join('') +
      (s.org ? '-' + encodeURIComponent(s.org) : '');
  }

  function restore(hash) {
    const m = /^#test=([0-2]{4})-([1-3]{0,3})(?:-(.*))?$/.exec(hash);
    if (!m) return false;
    keys.forEach((k, i) => {
      const input = form.querySelector(`input[name="${k}"][value="${m[1][i]}"]`);
      if (input) input.checked = true;
    });
    form.querySelectorAll('input[name="signal"]').forEach((cb) => {
      cb.checked = m[2].includes(cb.value);
    });
    try { form.org.value = m[3] ? decodeURIComponent(m[3]).slice(0, 60) : ''; } catch { /* ignore bad input */ }
    return true;
  }

  let timers = [];

  function climb(level) {
    // Cancel a climb still in progress so quick resubmits never interleave.
    timers.forEach(clearTimeout);
    timers = [];
    steps.forEach((li) => li.classList.remove('is-on', 'is-here'));
    const light = (i) => {
      steps[i].classList.add('is-on');
      if (i === level) steps[i].classList.add('is-here');
    };
    if (still()) {
      for (let i = 0; i <= level; i++) light(i);
      return;
    }
    for (let i = 0; i <= level; i++) timers.push(setTimeout(() => light(i), 120 + i * 320));
  }

  function wrap(ctx, text, x, y, max, lh) {
    let line = '';
    for (const word of text.split(' ')) {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > max && line) {
        ctx.fillText(line, x, y);
        line = word;
        y += lh;
      } else line = test;
    }
    ctx.fillText(line, x, y);
    return y;
  }

  function draw(s, level) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const serif = 'Iowan Old Style, Charter, Georgia, serif';
    const sans = 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
    const ramp = ['#ff9a80', '#d9b38c', '#a9c99a', '#7fd6ad'];
    ctx.fillStyle = '#0f3b2e';
    ctx.fillRect(0, 0, W, H);
    // Ladder bars on the right
    for (let i = 0; i < 4; i++) {
      const h = 90 + i * 90;
      const x = 780 + i * 100;
      ctx.fillStyle = i <= level ? ramp[i] : '#2f5a4b';
      ctx.fillRect(x, H - 70 - h, 78, h);
      if (i === level) {
        ctx.fillStyle = '#eef7f1';
        ctx.beginPath();
        ctx.arc(x + 39, H - 100 - h, 16, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.fillStyle = '#ff9a80';
    ctx.font = `600 26px ${sans}`;
    ctx.fillText('HUR VERKLIGT ÄR INFLYTANDET?', 70, 90);
    ctx.fillStyle = '#b5cdbf';
    ctx.font = `28px ${sans}`;
    if (s.org) ctx.fillText(s.org, 70, 140);
    ctx.fillStyle = '#eef7f1';
    ctx.font = `700 92px ${serif}`;
    ctx.fillText(levels[level].name, 70, 250);
    ctx.font = `30px ${sans}`;
    ctx.fillStyle = '#eef7f1';
    const y = wrap(ctx, levels[level].text, 70, 310, 660, 40);
    ctx.font = `24px ${sans}`;
    ctx.fillStyle = '#b5cdbf';
    keys.forEach((k, i) => ctx.fillText(`${labels[k]}: ${words[s.a[k]]}`, 70, y + 70 + i * 34));
    ctx.fillText(`Varningssignaler: ${s.signals.length} av 3`, 70, y + 70 + 4 * 34);
    ctx.fillStyle = '#7fd6ad';
    ctx.font = `22px ${sans}`;
    ctx.fillText('abdimannor.github.io/youthwashing', 70, H - 40);
  }

  let last = null;

  function show(s, focus) {
    const level = place(s.a, s.signals);
    last = { s, level };
    result.hidden = false;
    verdict.innerHTML = '';
    const p = document.createElement('p');
    p.className = 'ax-level';
    p.textContent = levels[level].name;
    const t = document.createElement('p');
    t.textContent = levels[level].text;
    verdict.append(p, t);
    draw(s, level);
    canvas.setAttribute('aria-label', `Resultatkort: ${levels[level].name}. ${levels[level].text}`);
    climb(level);
    history.replaceState(null, '', '#test=' + encode(s));
    if (focus) result.focus({ preventScroll: true }), result.scrollIntoView({ behavior: still() ? 'auto' : 'smooth', block: 'start' });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const s = read();
    error.hidden = !!s;
    if (!s) {
      form.querySelector(`fieldset:has(input:invalid) input`)?.focus();
      return;
    }
    show(s, true);
  });

  section.addEventListener('click', async (e) => {
    const action = e.target.closest('[data-ax]')?.dataset.ax;
    if (!action || !last) return;
    const name = `inflytande-${levels[last.level].name.toLowerCase()}.png`;
    if (action === 'print') window.print();
    if (action === 'reset') {
      form.reset();
      result.hidden = true;
      history.replaceState(null, '', location.pathname + '#test');
      form.querySelector('input').focus();
    }
    if (action === 'download') {
      const a = document.createElement('a');
      a.download = name;
      a.href = canvas.toDataURL('image/png');
      a.click();
    }
    if (action === 'share') {
      const url = location.href;
      const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'));
      const file = blob && new File([blob], name, { type: 'image/png' });
      try {
        if (file && navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Hur verkligt är inflytandet?', url });
        } else if (navigator.share) {
          await navigator.share({ title: 'Hur verkligt är inflytandet?', url });
        } else {
          await navigator.clipboard.writeText(url);
          e.target.textContent = 'Länken är kopierad';
        }
      } catch { /* user cancelled */ }
    }
  });

  if (restore(location.hash)) {
    const s = read();
    if (s) show(s, false);
  }
})();
