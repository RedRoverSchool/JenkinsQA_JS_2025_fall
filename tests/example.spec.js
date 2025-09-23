// @ts-check
import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto(`http://${process.env.LOCAL_HOST}:${process.env.LOCAL_PORT}/login`);

  // Expect a title.
  await expect(page).toHaveTitle("Sign in [Jenkins]");
});
