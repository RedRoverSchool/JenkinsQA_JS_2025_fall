import { test as base } from "@playwright/test";
import { cleanData } from "./helpers/cleanData.js";

export const test = base.extend({
  page: async ({ page, request }, use) => {
    await cleanData(request);

    await page.goto('/');

    await use(page);
  },
});

export const expect = base.expect;