// Motion is on by default, even in a browser that asks for reduced motion.
const { test, expect } = require('@playwright/test');

test.use({ contextOptions: { reducedMotion: 'reduce' } });

const toggle = 'header .ctl-motion';

test('moving by default, off after the button, remembered after reload', async ({ page }) => {
  await page.goto('./');
  const html = page.locator('html');
  const btn = page.locator(toggle);
  await expect(html).toHaveAttribute('data-motion', 'on');
  await expect(btn).toHaveAttribute('aria-pressed', 'true');
  await expect(btn).toHaveAttribute('aria-label', 'Pausa rörelse');
  // The ladder reveal is scroll-driven, so it only exists where view() timelines do.
  const scrollDriven = await page.evaluate(() => CSS.supports('animation-timeline: view()'));
  const ladder = () => page.locator('.ladder li').first().evaluate((el) => getComputedStyle(el).animationName);
  if (scrollDriven) expect(await ladder()).toBe('ladder-rise');
  await btn.click();
  await expect(html).toHaveAttribute('data-motion', 'off');
  await expect(btn).toHaveAttribute('aria-pressed', 'false');
  await expect(btn).toHaveAttribute('aria-label', 'Starta rörelse');
  expect(await ladder()).toBe('none');
  await page.reload();
  await expect(html).toHaveAttribute('data-motion', 'off');
  await expect(btn).toHaveAttribute('aria-pressed', 'false');
  await btn.click();
  await expect(html).toHaveAttribute('data-motion', 'on');
  await page.reload();
  await expect(html).toHaveAttribute('data-motion', 'on');
});

test('no reduced-motion notice, only the quiet button', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('.motion-notice')).toHaveCount(0);
  await expect(page.locator(toggle)).toHaveText('');
});

test('header controls are 34px icons named in the page language', async ({ page }) => {
  for (const [path, lang, name, motion] of [['./', 'en', 'Byt till engelska', 'Pausa rörelse'], ['./en/', 'sv', 'Switch to Swedish', 'Pause motion']]) {
    await page.goto(path);
    const link = page.locator('header .ctl-lang');
    await expect(link).toHaveAttribute('aria-label', `${name}, ${lang.toUpperCase()}`);
    await expect(link).toHaveAttribute('title', name);
    await expect(link).toHaveAttribute('hreflang', lang);
    await expect(link.locator('.ctl-code')).toHaveAttribute('lang', lang);
    await expect(link.locator('.ctl-code')).toHaveText(lang.toUpperCase());
    await expect(page.locator(toggle)).toHaveAttribute('aria-label', motion);
    for (const el of [link, page.locator(toggle)]) {
      const box = await el.boundingBox();
      expect(Math.round(box.height)).toBe(34);
    }
  }
});
