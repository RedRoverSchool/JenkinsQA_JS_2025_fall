import { expect } from "@playwright/test";
import { test } from "../base.js";

test('has title', async ({ page }) => {
  // Expect a title.
  await expect(page).toHaveTitle('Dashboard [Jenkins]');
});
