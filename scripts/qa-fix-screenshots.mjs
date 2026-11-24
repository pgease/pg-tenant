import { chromium } from 'playwright-core';
import { mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';

const base = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:5174';
const outDir = path.resolve('docs/qa-fixes');
const artifactDir = '/Users/saksham/.gemini/antigravity/brain/7f4a84dc-3326-4781-b137-f24a2316825c';

const viewports = [
  { name: 'android-360', device: 'Android (360px)', width: 360, height: 800 },
  { name: 'iphone-se', device: 'iPhone SE (375px)', width: 375, height: 667 },
];

const mockTenancy = {
  isAddedToProperty: true,
  tenant: {
    id: 'ten_mock_01',
    name: 'Ananya Sharma',
    phone: '9810098100',
    email: 'ananya.sharma@example.com',
  },
  property: {
    id: 'prop_mock_01',
    name: 'Satya Heights Residency',
    address: '42, Satya Niketan Marg, New Delhi',
    cityName: 'Delhi',
  },
  room: { id: 'room_12', roomNumber: '204' },
  bed: { id: 'bed_2', bedNumber: 'B2' },
  roomTenant: {
    id: 'rt_01',
    rentAmount: 14500,
    noticePeriodDays: 30,
    status: 'ACTIVE',
    isOnNotice: false,
  },
};

const mockProperties = {
  data: [
    {
      id: 'prop_1',
      name: 'Satya Heights Residency',
      address: '42 Satya Niketan, Delhi',
      city: 'Delhi',
      startingRent: 8500,
      amenities: ['Wi-Fi', 'Food', 'AC'],
      foodAvailable: true,
      acAvailable: true,
      photos: [],
    },
  ],
};

async function handleApi(route) {
  const url = new URL(route.request().url());
  const path = url.pathname;
  if (path.includes('/get-property-details')) {
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockTenancy) });
  }
  if (path.includes('/properties/public')) {
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockProperties) });
  }
  if (path.includes('/notice')) {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ isUnderNotice: false, notice: null }),
    });
  }
  return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
}

async function run() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  for (const vp of viewports) {
    console.log(`Taking QA screenshots for ${vp.device}...`);
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    const page = await ctx.newPage();

    await page.addInitScript(() => {
      localStorage.setItem('pgease_tenant_token', 'mock_token');
      localStorage.setItem('pgease_tenant_refresh_token', 'mock_refresh');
    });

    await page.route('**/*', (route) => {
      const u = route.request().url();
      if (u.includes('/api/')) return handleApi(route);
      return route.continue();
    });

    // 1. Issue 1: Explore PG Banner
    await page.goto(`${base}/search`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    const searchFile = path.join(outDir, `${vp.name}-issue1-explore-banner.png`);
    await page.screenshot({ path: searchFile });
    await copyFile(searchFile, path.join(artifactDir, `${vp.name}-issue1-explore-banner.png`));
    console.log(`Saved Issue 1 screenshot to ${searchFile}`);

    // 2. Issue 2: Notice Period Date Format (Empty / dd/mm/yyyy placeholder)
    await page.goto(`${base}/notice`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    const noticeEmptyFile = path.join(outDir, `${vp.name}-issue2-notice-placeholder.png`);
    await page.screenshot({ path: noticeEmptyFile });
    await copyFile(noticeEmptyFile, path.join(artifactDir, `${vp.name}-issue2-notice-placeholder.png`));
    console.log(`Saved Issue 2 empty placeholder screenshot to ${noticeEmptyFile}`);

    // 3. Issue 2: Notice Period with Selected Date formatted as dd/mm/yyyy
    const dateInput = page.locator('input[type="date"]').first();
    if (await dateInput.count()) {
      await dateInput.fill('2026-12-25');
      await page.waitForTimeout(400);
      const noticeSelectedFile = path.join(outDir, `${vp.name}-issue2-notice-selected-date.png`);
      await page.screenshot({ path: noticeSelectedFile });
      await copyFile(noticeSelectedFile, path.join(artifactDir, `${vp.name}-issue2-notice-selected-date.png`));
      console.log(`Saved Issue 2 selected date screenshot to ${noticeSelectedFile}`);
    }

    await ctx.close();
  }

  await browser.close();
  console.log('All QA screenshots captured successfully!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
