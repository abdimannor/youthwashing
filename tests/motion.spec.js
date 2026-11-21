// Motion switch in a browser that asks for reduced motion.
const { test, expect } = require('@playwright/test');

test.use({ contextOptions: { reducedMotion: 'reduce' } });

const toggle = '.motion-toggle, [data-motion-toggle], #motion-switch';

test('still by default, on after the switch, remembered after reload', async ({ page }) => {
  await page.goto('./');
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-motion', 'off');
  await page.locator(toggle).first().click();
  await expect(html).toHaveAttribute('data-motion', 'on');
  await page.reload();
  await expect(html).toHaveAttribute('data-motion', 'on');
  await page.locator(toggle).first().click();
  await expect(html).toHaveAttribute('data-motion', 'off');
  await page.reload();
  await expect(html).toHaveAttribute('data-motion', 'off');
});
