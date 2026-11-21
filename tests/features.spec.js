// Self-assessment, workshop keyboard control and the English edition.
const { test, expect } = require('@playwright/test');
const { watch, axe } = require('./helpers');

test('self-assessment places an answer set on the ladder', async ({ page }) => {
  await page.goto('index.html');
  const form = page.locator('.ax-form');
  for (const k of ['timing', 'mandat', 'resurser', 'aterkoppling']) {
    await form.locator(`input[name="${k}"][value="2"]`).check();
  }
  await form.locator('button[type="submit"]').click();
  const result = page.locator('.ax-result');
  await expect(result).toBeVisible();
  await expect(page.locator('.ax-verdict')).not.toBeEmpty();
  await expect(page.locator('.ax-error')).toBeHidden();
  expect(page.url()).toMatch(/#test=/);
  await page.waitForTimeout(1500); // let option and ladder transitions settle
  await axe(page);
});

test('self-assessment asks for all four answers', async ({ page }) => {
  await page.goto('index.html');
  await page.locator('.ax-form button[type="submit"]').click();
  await expect(page.locator('.ax-error')).toBeVisible();
  await expect(page.locator('.ax-result')).toBeHidden();
});

test('workshop slides follow the keyboard and Escape ends the show', async ({ page }) => {
  await page.goto('workshop.html');
  await page.locator('[data-ws-start]').click();
  await expect(page.locator('html')).toHaveClass(/is-presenting/);
  await expect(page).toHaveURL(/#bild-1$/);
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(/#bild-2$/);
  await page.keyboard.press('End');
  const total = await page.locator('[data-deck] .slide').count();
  await expect(page).toHaveURL(new RegExp(`#bild-${total}$`));
  await page.keyboard.press('Home');
  await expect(page).toHaveURL(/#bild-1$/);
  await page.keyboard.press('Escape');
  await expect(page.locator('html')).not.toHaveClass(/is-presenting/);
});

test('English edition is in English and its workshop works', async ({ page }) => {
  const problems = watch(page);
  await page.goto('en/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.goto('en/workshop.html');
  await page.locator('[data-ws-start]').click();
  await page.keyboard.press('ArrowRight');
  await expect(page).not.toHaveURL(/#bild-/);
  expect(problems).toEqual([]);
});
