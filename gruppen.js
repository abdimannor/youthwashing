// Group mode: "Samla gruppen". Each participant does the self-assessment on
// their own phone and reads out a short code (e.g. 2101-13: four answers
// 0 nej / 1 delvis / 2 ja, then the ticked warning signals). The facilitator
// pastes the codes here, one per line, optionally followed by a role.
// Everything is computed in this browser; nothing is sent anywhere.
(() => {
  const root = document.querySelector('[data-group]');
  if (!root) return;
  root.hidden = false;
  const form = root.querySelector('.gp-form');
  const box = form.querySelector('textarea');
  const error = root.querySelector('.gp-error');
  const result = root.querySelector('.gp-result');
  const keys = ['timing', 'mandat', 'resurser', 'aterkoppling'];
  // Slide numbers of the control questions in workshop.html.
  const slideOf = { timing: 9, mandat: 10, resurser: 11, aterkoppling: 12 };
  // UI strings: Swedish defaults, overridden by window.YW_I18N.group (en/i18n.js).
  const T = Object.assign({
    labels: { timing: 'Timing', mandat: 'Mandat', resurser: 'Resurser', aterkoppling: 'Återkoppling' },
    questions: {
      timing: 'Var unga med innan problemet, målet och lösningen bestämdes?',
      mandat: 'Finns det beslut som unga faktiskt kan påverka, eller får de bara ge synpunkter?',
      resurser: 'Får unga ersättning, kunskap, tid och stöd för att delta på rimliga villkor?',
      aterkoppling: 'Visar organisationen vad som ändrades efter ungas input, och vad som inte ändrades?',
    },
    signals: ['Unga får synas men inte bestämma', 'Radikalt språk, oförändrad struktur', 'Engagemang blir varumärke'],
    words: ['Nej', 'Delvis', 'Ja'],
    meta: (n, roles) => `${n} deltagare${roles ? ` · ${roles}` : ''}`,
    spread: 'Spridning',
    gap: 'Skillnad mellan roller',
    mostSpread: 'Störst oenighet',
    mostGap: 'Störst skillnad mellan roller',
    gapBetween: (hi, lo) => `${hi} svarar högre än ${lo}`,
    agree: 'Alla svarade lika',
    roleMean: 'Snitt per roll',
    ticked: (n, total) => `${n} av ${total} kryssade i`,
    bad: (lines) => `Kunde inte läsa rad ${lines.join(', ')}. En kod ser ut så här: 2101-13.`,
    empty: 'Klistra in minst en kod.',
    copied: 'Länken är kopierad',
    hash: 'grupp',
  }, (window.YW_I18N || {}).group);

  const fmt = (x) => x.toLocaleString(document.documentElement.lang, { maximumFractionDigits: 1, minimumFractionDigits: 1 });

  // A code is the self-assessment's own hash without the organisation name:
  // four digits 0-2, a dash, then 0-3 signal digits 1-3. Full share links
  // (…#test=2101-13-Org) are accepted too.
  function parseLine(line) {
    const m = /(?:^|[#=\s])([0-2]{4})-([1-3]{0,3})(?:-\S*)?(?=\s|$)(.*)$/.exec(' ' + line);
    if (!m) return null;
    const a = {};
    keys.forEach((k, i) => { a[k] = Number(m[1][i]); });
    const role = m[3].trim().replace(/\s+/g, ' ').slice(0, 40);
    // A second code on the same line is not a role: report the line instead
    // of silently dropping a participant.
    if (/(?:^|[#=\s])\d{4}-\d*(?=[\s-]|$)/.test(' ' + role)) return null;
    return { a, signals: [...new Set(m[2])].sort().map(Number), role: role.toLowerCase() };
  }

  function parseAll(text) {
    const people = [], bad = [];
    text.split('\n').forEach((line, i) => {
      if (!line.trim()) return;
      const p = parseLine(line.trim());
      if (p) people.push(p); else bad.push(i + 1);
    });
    return { people, bad };
  }

  const mean = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;
  const sd = (xs) => { const m = mean(xs); return Math.sqrt(mean(xs.map((x) => (x - m) ** 2))); };

  // Per question: counts of nej/delvis/ja, spread (standard deviation on the
  // 0-2 scale), and the largest gap between role averages (tagged roles only).
  function analyse(people) {
    const roles = [...new Set(people.map((p) => p.role).filter(Boolean))];
    const rows = keys.map((k) => {
      const vals = people.map((p) => p.a[k]);
      const counts = [0, 1, 2].map((v) => vals.filter((x) => x === v).length);
      const byRole = roles.map((r) => {
        const xs = people.filter((p) => p.role === r).map((p) => p.a[k]);
        return { role: r, mean: mean(xs), n: xs.length };
      });
      let gap = 0, hi = null, lo = null;
      if (byRole.length > 1) {
        const sorted = [...byRole].sort((x, y) => y.mean - x.mean);
        hi = sorted[0]; lo = sorted[sorted.length - 1];
        gap = hi.mean - lo.mean;
      }
      return { key: k, counts, spread: sd(vals), gap, hi, lo, byRole, score: sd(vals) + gap };
    });
    const order = [...rows].sort((x, y) => y.score - x.score || y.spread - x.spread || keys.indexOf(x.key) - keys.indexOf(y.key));
    const signals = [1, 2, 3].map((s) => people.filter((p) => p.signals.includes(s)).length);
    return { rows, order, roles, signals, n: people.length };
  }

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  };

  function bar(counts, n) {
    const wrap = el('div', 'gp-bar');
    const label = [0, 1, 2].map((v) => `${T.words[v]}: ${counts[v]}`).join(', ');
    wrap.setAttribute('role', 'img');
    wrap.setAttribute('aria-label', label);
    [0, 1, 2].forEach((v) => {
      if (!counts[v]) return;
      const seg = el('span', `gp-seg gp-seg--${v}`, `${T.words[v]} ${counts[v]}`);
      seg.style.flexGrow = counts[v];
      seg.setAttribute('aria-hidden', 'true');
      wrap.append(seg);
    });
    wrap.dataset.total = n;
    return wrap;
  }

  function render(g) {
    const topSpread = g.order.reduce((b, r) => (r.spread > b.spread ? r : b));
    const topGap = g.order.reduce((b, r) => (r.gap > b.gap ? r : b));
    root.querySelector('.gp-meta').textContent = T.meta(g.n, g.roles.join(', '));

    const list = root.querySelector('.gp-order');
    list.replaceChildren(...g.order.map((r) => {
      const li = el('li');
      li.dataset.key = r.key;
      li.append(el('strong', '', T.labels[r.key]), ' ');
      const facts = [`${T.spread} ${fmt(r.spread)}`];
      if (g.roles.length > 1) facts.push(`${T.gap} ${fmt(r.gap)}`);
      li.append(el('span', 'gp-facts', facts.join(' · ')));
      if (r === topSpread && r.spread > 0) li.append(' ', el('span', 'gp-flag', T.mostSpread));
      if (r === topGap && r.gap > 0) li.append(' ', el('span', 'gp-flag gp-flag--gap', T.mostGap));
      if (r.gap > 0) li.append(el('span', 'gp-why', T.gapBetween(r.hi.role, r.lo.role)));
      return li;
    }));

    const qs = root.querySelector('.gp-questions');
    qs.replaceChildren(...g.rows.map((r) => {
      const art = el('article', 'gp-q');
      art.dataset.key = r.key;
      if (r === topSpread && r.spread > 0) art.classList.add('is-top');
      if (r === topGap && r.gap > 0) art.classList.add('is-gap');
      const h = el('h4');
      h.append(el('strong', '', T.labels[r.key]), ' ', el('span', '', T.questions[r.key]));
      art.append(h, bar(r.counts, g.n));
      const p = el('p', 'gp-facts', r.spread === 0 ? T.agree : `${T.spread} ${fmt(r.spread)}${g.roles.length > 1 ? ` · ${T.gap} ${fmt(r.gap)}` : ''}`);
      art.append(p);
      if (r.byRole.length > 1) {
        const dl = el('dl', 'gp-roles');
        dl.setAttribute('aria-label', T.roleMean);
        r.byRole.forEach((b) => {
          const d = el('div');
          d.append(el('dt', '', `${b.role} (${b.n})`), el('dd', '', fmt(b.mean)));
          dl.append(d);
        });
        art.append(dl);
      }
      return art;
    }));

    const sig = root.querySelector('.gp-signals');
    sig.replaceChildren(...T.signals.map((s, i) => {
      const li = el('li');
      li.append(el('span', '', s), ' ', el('strong', '', T.ticked(g.signals[i], g.n)));
      return li;
    }));

    const ws = root.querySelector('[data-gp-workshop]');
    ws.href = 'workshop.html#ordning=' + g.order.map((r) => slideOf[r.key]).join(',');
    result.hidden = false;
  }

  function run(updateHash) {
    const { people, bad } = parseAll(box.value);
    error.hidden = !bad.length && people.length > 0;
    if (bad.length) error.textContent = T.bad(bad);
    else if (!people.length) error.textContent = T.empty;
    if (!people.length || bad.length) { result.hidden = true; return null; }
    const g = analyse(people);
    render(g);
    if (updateHash) history.replaceState(null, '', `#${T.hash}=` + encodeURIComponent(box.value.trim()));
    return g;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (run(true)) result.focus({ preventScroll: false });
  });
  root.addEventListener('click', async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.matches('[data-gp-print]')) window.print();
    if (b.matches('[data-gp-copy]')) {
      try { await navigator.clipboard.writeText(location.href); b.textContent = T.copied; } catch { /* blocked */ }
    }
  });

  const m = new RegExp(`^#${T.hash}=(.+)$`).exec(location.hash);
  if (m) {
    try { box.value = decodeURIComponent(m[1]); run(false); } catch { /* bad hash */ }
  }
  // Exposed for tests.
  window.YW_GROUP = { parseLine, parseAll, analyse };
})();
