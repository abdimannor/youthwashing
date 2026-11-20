// Motion switch check in a reduced-motion browser.
// Run: serve the repo on :8731 (python3 -m http.server 8731), then
// PLAYWRIGHT=<path to playwright/index.mjs> CHROME_PATH=<chrome> node tests/motion.mjs
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const assert = (ok, msg) => { if (!ok) { console.error('FAIL', msg); process.exitCode = 1; } else console.log('ok', msg); };
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH });
const ctx = await b.newContext({ reducedMotion: 'reduce' });
const p = await ctx.newPage();
const U = process.env.URL || 'http://localhost:8731/';
const state = () => p.evaluate(() => [document.documentElement.dataset.motion,
  getComputedStyle(document.querySelector('.ladder li')).animationName]);
await p.goto(U);
let [m, a] = await state();
assert(m === 'off' && a === 'none', 'still by default when the OS asks for reduced motion');
assert(await p.isVisible('.motion-notice'), 'notice with a play button is shown');
await p.click('.motion-play');
[m, a] = await state();
assert(m === 'on' && a === 'ladder-rise', 'animating after the switch');
await p.reload();
[m, a] = await state();
assert(m === 'on' && a === 'ladder-rise', 'choice survives reload');
assert(!(await p.isVisible('.motion-notice')), 'notice stays away once a choice is made');
await b.close();
