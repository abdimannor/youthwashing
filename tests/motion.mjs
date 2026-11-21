// Motion check in a reduced-motion browser: moving by default, the button pauses it.
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
assert(m === 'on' && a === 'ladder-rise', 'moving by default even when the OS asks for reduced motion');
assert((await p.locator('.motion-notice').count()) === 0, 'no reduced-motion notice');
await p.click('header .ctl-motion');
[m, a] = await state();
assert(m === 'off' && a === 'none', 'still after the pause button');
await p.reload();
[m, a] = await state();
assert(m === 'off' && a === 'none', 'choice survives reload');
await b.close();
