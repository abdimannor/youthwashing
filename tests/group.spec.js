// Group mode: codes, spreads, discussion order, workshop order, both languages, print.
const { test, expect } = require('@playwright/test');
const { watch, axe } = require('./helpers');

test.use({ contextOptions: { reducedMotion: 'reduce' } });

const five = ['2222- styrelse', '2221- Styrelse', '0101-12 ung deltagare',
  'https://abdimannor.github.io/youthwashing/#test=0001-123-Föreningen ung deltagare', '1111-1 personal'].join('\n');
const fiveEn = five.replace(/styrelse|Styrelse/g, 'board').replace(/ung deltagare/g, 'young participant').replace('personal', 'staff');

async function submit(page, file, codes) {
  await page.goto(file);
  await page.fill('#gp-codes', codes);
  await page.click('.gp-form button[type="submit"]');
}

test('a participant code round-trips through the self-assessment', async ({ page }) => {
  await page.goto('index.html#test');
  for (const [k, v] of [['timing', 2], ['mandat', 1], ['resurser', 0], ['aterkoppling', 1]]) {
    await page.check(`input[name="${k}"][value="${v}"]`);
  }
  await page.check('input[name="signal"][value="1"]');
  await page.check('input[name="signal"][value="3"]');
  await page.click('.ax-form button[type="submit"]');
  await expect(page.locator('.ax-code-value')).toHaveText('2101-13');
  await expect(page.locator('.ax-code a[href="gruppen.html"]')).toBeVisible();
  await page.goto('index.html#test=2101-13');
  await page.reload();
  const back = await page.evaluate(() => ['timing', 'mandat', 'resurser', 'aterkoppling']
    .map((k) => document.querySelector(`input[name="${k}"]:checked`)?.value).join('') + '-' +
    [...document.querySelectorAll('input[name="signal"]:checked')].map((c) => c.value).join(''));
  expect(back).toBe('2101-13');
});

test('five participants with roles give the expected spreads, gaps and order (sv)', async ({ page }) => {
  const problems = watch(page);
  await submit(page, 'gruppen.html', five);
  const g = await page.evaluate(() => window.YW_GROUP.analyse(window.YW_GROUP.parseAll(document.querySelector('#gp-codes').value).people));
  const row = (k) => g.rows.find((r) => r.key === k);
  expect(g.n).toBe(5);
  expect(g.roles).toEqual(['styrelse', 'ung deltagare', 'personal']);
  expect(row('timing').counts).toEqual([2, 1, 2]);
  expect(row('timing').spread).toBeCloseTo(Math.sqrt(0.8), 9);
  expect(row('timing').gap).toBeCloseTo(2, 9);
  expect(row('mandat').counts).toEqual([1, 2, 2]);
  expect(row('mandat').spread).toBeCloseTo(Math.sqrt(0.56), 9);
  expect(row('mandat').gap).toBeCloseTo(1.5, 9);
  expect(row('aterkoppling').spread).toBeCloseTo(0.4, 9);
  expect(row('aterkoppling').gap).toBeCloseTo(0.5, 9);
  expect(g.signals).toEqual([3, 2, 1]);
  const order = await page.$$eval('.gp-order li', (li) => li.map((x) => x.dataset.key));
  expect(order).toEqual(['timing', 'resurser', 'mandat', 'aterkoppling']);
  await expect(page.locator('[data-gp-workshop]')).toHaveAttribute('href', 'workshop.html#ordning=9,11,10,12');
  await expect(page.locator('.gp-order li').first()).toContainText('Störst oenighet');
  await expect(page.locator('.gp-q.is-top')).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.dataset.motion)).toBe('off');
  expect(page.url()).toMatch(/#grupp=/);
  await axe(page);
  expect(problems).toEqual([]);
});

test('a bad line is reported with its line number, not guessed', async ({ page }) => {
  await page.goto('gruppen.html#grupp=' + encodeURIComponent('2222-\n9999-1'));
  await expect(page.locator('.gp-error')).toBeVisible();
  await expect(page.locator('.gp-error')).toContainText('rad 2');
  await expect(page.locator('.gp-result')).toBeHidden();
});

test('two codes on one line are rejected, not read as one participant with a code as role', async ({ page }) => {
  await submit(page, 'gruppen.html', '2222- styrelse\n2101-13 2200-1\n1111-1 personal');
  await expect(page.locator('.gp-error')).toBeVisible();
  await expect(page.locator('.gp-error')).toContainText('rad 2');
  await expect(page.locator('.gp-result')).toBeHidden();
  const p = await page.evaluate(() => window.YW_GROUP.parseLine('2101-13 2200-1'));
  expect(p).toBeNull();
  const ok = await page.evaluate(() => window.YW_GROUP.parseLine('2101-13 ung deltagare'));
  expect(ok.role).toBe('ung deltagare');
});

test('the print summary fits one A4 page', async ({ page, browserName }) => {
  await submit(page, 'gruppen.html', five);
  await page.emulateMedia({ media: 'print' });
  // Portable check in every engine: lay the print styles out at the A4 content
  // box (210 x 297 mm minus the 12 mm @page margins in group.css, at 96 px/in).
  const mm = 96 / 25.4;
  await page.setViewportSize({ width: Math.floor(186 * mm), height: Math.floor(273 * mm) });
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  expect(height).toBeLessThanOrEqual(Math.ceil(273 * mm));
  // page.pdf() exists only in Chromium; there, count the real PDF pages as well.
  if (browserName === 'chromium') {
    const pdf = await page.pdf({ format: 'A4' });
    const pages = Number((/\/Count (\d+)/.exec(pdf.toString('latin1')) || [])[1]);
    expect(pages).toBe(1);
  }
});

test('workshop walks the group order and labels slides by that order (sv)', async ({ page }) => {
  await page.goto('workshop.html#ordning=9,11,10,12');
  const seen = [];
  for (let i = 0; i < 4; i++) {
    const s = page.locator('.slide:not([hidden])');
    seen.push(await s.getAttribute('id'));
    await expect(s).toHaveAttribute('aria-label', `Bild ${i + 1} av 4`);
    await expect(s.locator('.sl-kicker')).toHaveText(new RegExp(` ${i + 1}/4$`));
    await expect(page.locator('[data-ws-count]')).toHaveText(`Bild ${i + 1} av 4`);
    await page.keyboard.press('ArrowRight');
  }
  expect(seen).toEqual(['bild-9', 'bild-11', 'bild-10', 'bild-12']);
  await page.keyboard.press('Escape');
  await expect(page.locator('#bild-11')).toHaveAttribute('aria-label', 'Bild 11 av 12');
  await expect(page.locator('#bild-11 .sl-kicker')).toHaveText(/ 3\/4$/);
});

test('English group view and workshop order', async ({ page }) => {
  const problems = watch(page);
  await submit(page, 'en/gruppen.html', fiveEn);
  await expect(page.locator('.gp-order li').first()).toContainText('Most disagreement');
  await expect(page.locator('.gp-meta')).toHaveText(/^5 participants/);
  await expect(page.locator('[data-gp-workshop]')).toHaveAttribute('href', 'workshop.html#ordning=9,11,10,12');
  expect(page.url()).toMatch(/#group=/);
  await axe(page);
  await submit(page, 'en/gruppen.html', '2101-13 2200-1');
  await expect(page.locator('.gp-error')).toContainText('2');
  await page.goto('en/workshop.html#ordning=10,9');
  await expect(page.locator('[data-ws-count]')).toHaveText('Slide 1 of 2');
  await expect(page.locator('.slide:not([hidden])')).toHaveAttribute('id', 'slide-10');
  await expect(page.locator('.slide:not([hidden])')).toHaveAttribute('aria-label', 'Slide 1 of 2');
  await expect(page.locator('#slide-9 .sl-kicker')).toHaveText(/ 2\/2$/);
  await page.goto('en/index.html#test=2101-13');
  await expect(page.locator('.ax-code-value')).toHaveText('2101-13');
  expect(problems).toEqual([]);
});

test('the worksheet links to the group view', async ({ page }) => {
  await page.goto('arbetsblad.html');
  await expect(page.locator('a[href="gruppen.html"]')).toBeVisible();
});
