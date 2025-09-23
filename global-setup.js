import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const STORAGE_PATH = path.join(__dirname, '.auth', 'storageState.json');

export default async function globalSetup() {
  if (fs.existsSync(STORAGE_PATH)) {
    console.log('✅ storageState already exists, skipping creation.');
    return;
  }

  console.log('🔐 Creating storageState for authenticated user...');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(`http://${process.env.LOCAL_HOST}:${process.env.LOCAL_PORT}/`);
  await page.locator('#j_username').fill(process.env.LOCAL_USERNAME);
  await page.locator('input[name="j_password"]').fill(process.env.LOCAL_PASSWORD);
  await page.locator('button[name="Submit"]').click();

  await page.waitForLoadState('networkidle');
  await Promise.race([
    page.waitForURL(url => !url.includes('/login'), { timeout: 30000 }).catch(() => null),
    page.waitForSelector('#jenkins-head-icon', { timeout: 30000 }).catch(() => null),
  ]);

  console.log('Current URL after login:', page.url());

  await page.context().storageState({ path: STORAGE_PATH });
  console.log(`✅ storageState created at: ${STORAGE_PATH}`);

  await browser.close();
}