import { test as base } from "@playwright/test";
import { cleanData } from "./helpers/cleanData";

export const test = base.extend({
   
    page: async ({ page }, use) => {
    
        await cleanData();
        await page.goto('/');
        await page.locator('#j_username').fill(process.env.LOCAL_USERNAME);
        await page.locator('input[name="j_password"]').fill(process.env.LOCAL_PASSWORD);
        await page.locator('button[name="Submit"]').click();

        await use(page);
    },
})