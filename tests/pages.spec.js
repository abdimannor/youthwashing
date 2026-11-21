// Every page loads cleanly and passes axe-core.
const { test, expect } = require('@playwright/test');
const { watch, axe } = require('./helpers');

const pages = ['arbetsblad.html','en/arbetsblad.html','en/fall.html','en/gruppen.html','en/index.html','en/kontakt.html','en/om.html','en/workshop.html','fall.html','gruppen.html','index.html','kontakt.html','om.html','workshop.html'];

for (const file of pages) {
  test(`${file} loads without console errors or failed requests`, async ({ page }) => {
    const problems = watch(page);
    await page.goto(file, { waitUntil: 'networkidle' });
    await expect(page.locator('h1').first()).toBeVisible();
    expect(problems).toEqual([]);
  });

  test(`${file} has no axe violations`, async ({ page }) => {
    await page.goto(file, { waitUntil: 'networkidle' });
    await axe(page);
  });
}
