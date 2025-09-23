// @ts-check
import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title.
  await expect(page).toHaveTitle("Sign in [Jenkins]");
});
