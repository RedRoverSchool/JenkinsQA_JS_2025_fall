import { expect } from "@playwright/test";
import { test } from "../base.js";

test.describe("Verifycation elements on Home Page", () => {
  test('page title', async ({ page }) => {
    // Expect a title.
    await expect(page).toHaveTitle('Dashboard - Jenkins');
  });

  test('page header', async ({ page }) => {
    // Expect a header.
    await expect(page.locator('#jenkins-head-icon')).toBeVisible();
  });
})
