// Group mode check: codes, spreads, discussion order, workshop order, both languages,
// axe-core, reduced motion, print. Run: serve the repo on :8731 (python3 -m http.server 8731), then
// PLAYWRIGHT=<path to playwright/index.mjs> CHROME_PATH=<chrome> AXE=<path to axe.min.js> [SHOTS=<dir>] node tests/group.mjs
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const assert = (ok, msg) => { if (!ok) { console.error('FAIL', msg); process.exitCode = 1; } else console.log('ok', msg); };
const U = process.env.URL || 'http://localhost:8731/';
const SHOTS = process.env.SHOTS;
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH });
const ctx = await b.newContext({ reducedMotion: 'reduce' });
const p = await ctx.newPage();
const errors = [];
p.on('pageerror', (e) => errors.push(String(e)));

async function axe(label) {
  if (!process.env.AXE) return;
  await p.addScriptTag({ path: process.env.AXE });
  const v = await p.evaluate(async () => (await window.axe.run()).violations.map((x) => `${x.id} (${x.nodes.length})`));
  assert(v.length === 0, `axe: 0 violations on ${label} ${v.join(', ')}`);
}

// 1. A participant's code from the self-assessment round-trips.
await p.goto(U + 'index.html#test');
for (const [k, v] of [['timing', 2], ['mandat', 1], ['resurser', 0], ['aterkoppling', 1]]) {
  await p.check(`input[name="${k}"][value="${v}"]`);
}
await p.check('input[name="signal"][value="1"]');
await p.check('input[name="signal"][value="3"]');
await p.click('.ax-form button[type="submit"]');
const code = await p.textContent('.ax-code-value');
assert(code === '2101-13', `result shows the code 2101-13 (got ${code})`);
assert(await p.isVisible('.ax-code a[href="gruppen.html"]'), 'result links to the group view');
await axe('self-assessment result');
await p.goto(U + 'index.html#test=' + code);
await p.reload();
const back = await p.evaluate(() => ['timing', 'mandat', 'resurser', 'aterkoppling'].map((k) => document.querySelector(`input[name="${k}"]:checked`)?.value).join('') + '-' +
  [...document.querySelectorAll('input[name="signal"]:checked')].map((c) => c.value).join(''));
assert(back === code, 'the code restores the same answers in the self-assessment');

// 2. Five participants with roles.
const five = ['2222- styrelse', '2221- Styrelse', '0101-12 ung deltagare',
  'https://abdimannor.github.io/youthwashing/#test=0001-123-Föreningen ung deltagare', '1111-1 personal'].join('\n');
await p.goto(U + 'gruppen.html');
await p.fill('#gp-codes', five);
await p.click('.gp-form button[type="submit"]');
const g = await p.evaluate(() => window.YW_GROUP.analyse(window.YW_GROUP.parseAll(document.querySelector('#gp-codes').value).people));
const row = (k) => g.rows.find((r) => r.key === k);
const near = (a, x) => Math.abs(a - x) < 1e-9;
assert(g.n === 5 && g.roles.join('|') === 'styrelse|ung deltagare|personal', 'five participants, three roles (case folded)');
assert(row('timing').counts.join() === '2,1,2' && near(row('timing').spread, Math.sqrt(0.8)) && near(row('timing').gap, 2), 'timing: counts, spread and role gap');
assert(row('mandat').counts.join() === '1,2,2' && near(row('mandat').spread, Math.sqrt(0.56)) && near(row('mandat').gap, 1.5), 'mandat: counts, spread and role gap');
assert(near(row('aterkoppling').spread, 0.4) && near(row('aterkoppling').gap, 0.5), 'återkoppling: spread and role gap');
assert(g.signals.join() === '3,2,1', 'warning signals counted');
const order = await p.$$eval('.gp-order li', (li) => li.map((x) => x.dataset.key).join());
assert(order === 'timing,resurser,mandat,aterkoppling', `discussion order (got ${order})`);
const href = await p.getAttribute('[data-gp-workshop]', 'href');
assert(href === 'workshop.html#ordning=9,11,10,12', `workshop link follows the order (got ${href})`);
assert(await p.$eval('.gp-order li:first-child', (li) => li.textContent.includes('Störst oenighet')), 'largest disagreement flagged');
assert((await p.$$('.gp-q.is-top')).length === 1, 'one question card highlighted');
assert(await p.evaluate(() => document.documentElement.dataset.motion) === 'off', 'reduced motion: page is still');
await axe('group view (sv)');
await p.goto(U + 'gruppen.html?x#grupp=' + encodeURIComponent('2222-\n9999-1'));
assert(await p.isVisible('.gp-error') && (await p.textContent('.gp-error')).includes('rad 2'), 'a bad line is reported, not guessed');
await p.goto(U + 'gruppen.html');
await p.fill('#gp-codes', five);
await p.click('.gp-form button[type="submit"]');
assert(/#grupp=/.test(p.url()), 'group state kept in the URL hash');
if (SHOTS) {
  for (const w of [1440, 390]) {
    await p.setViewportSize({ width: w, height: 900 });
    await p.screenshot({ path: `${SHOTS}/gruppen-sv-${w}.png`, fullPage: true });
  }
  await p.emulateMedia({ media: 'print' });
  await p.pdf({ path: `${SHOTS}/gruppen-sv.pdf`, format: 'A4', printBackground: true });
  await p.screenshot({ path: `${SHOTS}/gruppen-print.png`, fullPage: true });
  await p.emulateMedia({ media: null });
  await p.setViewportSize({ width: 1280, height: 800 });
}
const pdf = await p.pdf({ format: 'A4' });
const pages = Number((/\/Count (\d+)/.exec(pdf.toString('latin1')) || [])[1]);
assert(pages === 1, `print summary fits one A4 page (got ${pages})`);

// 3. Workshop opens on the most disputed control questions in that order.
await p.goto(U + href);
const seen = [];
for (let i = 0; i < 4; i++) {
  seen.push(await p.$eval('.slide:not([hidden])', (s) => s.id));
  await p.keyboard.press('ArrowRight');
}
assert(seen.join() === 'bild-9,bild-11,bild-10,bild-12', `workshop walks the group order (got ${seen})`);
assert((await p.textContent('[data-ws-count]')) === 'Bild 4 av 4', 'counter counts the ordered slides');

// 4. English edition.
await p.goto(U + 'en/gruppen.html');
await p.fill('#gp-codes', five.replace(/styrelse|Styrelse/g, 'board').replace(/ung deltagare/g, 'young participant').replace('personal', 'staff'));
await p.click('.gp-form button[type="submit"]');
assert(await p.$eval('.gp-order li:first-child', (li) => li.textContent.includes('Most disagreement')), 'English strings');
assert((await p.textContent('.gp-meta')).startsWith('5 participants'), 'English participant count');
assert((await p.getAttribute('[data-gp-workshop]', 'href')) === 'workshop.html#ordning=9,11,10,12', 'English workshop link');
assert(/#group=/.test(p.url()), 'English hash name');
await axe('group view (en)');
if (SHOTS) await p.screenshot({ path: `${SHOTS}/gruppen-en-1280.png`, fullPage: true });
await p.goto(U + 'en/workshop.html#ordning=10,9');
assert((await p.textContent('[data-ws-count]')) === 'Slide 1 of 2', 'English workshop ordered');
await p.goto(U + 'en/index.html#test=2101-13');
assert((await p.textContent('.ax-code-value')) === '2101-13', 'English result shows the code');
await p.goto(U + 'arbetsblad.html');
assert(await p.isVisible('a[href="gruppen.html"]'), 'worksheet links to the group view');
assert(errors.length === 0, `no page errors ${errors.join(' | ')}`);
await b.close();
