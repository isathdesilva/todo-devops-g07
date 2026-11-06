// End-to-end acceptance test in a real browser.
// BASE_URL points at the running app (staging server in the pipeline).
const { test, expect } = require('@playwright/test');

test('user can add a task and tick it off', async ({ page }) => {
  const title = `E2E task ${Date.now()}`;
  await page.goto('/');
  await expect(page.locator('#heading')).toBeVisible();

  await page.fill('#task-input', title);
  await page.click('#add-btn');
  const item = page.locator('#task-list li', { hasText: title });
  await expect(item).toBeVisible();

  await item.click();
  await expect(item).toHaveClass(/done/);

  // Task is still there after a page refresh (saved in the database).
  await page.reload();
  await expect(page.locator('#task-list li', { hasText: title })).toHaveClass(/done/);
});

test('empty task shows an error', async ({ page }) => {
  await page.goto('/');
  await page.click('#add-btn');
  await expect(page.locator('#error')).toHaveText('Title cannot be empty');
});
