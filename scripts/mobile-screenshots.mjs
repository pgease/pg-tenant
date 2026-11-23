/**
 * Mobile audit screenshots. Uses mocked API responses only — never writes production data.
 *
 * Usage: node scripts/mobile-screenshots.mjs before|after
 * Requires the Vite dev server on http://127.0.0.1:5174
 */
import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const phase = process.argv[2] === 'after' ? 'after' : 'before';
const base = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:5174';
const outRoot = path.resolve('docs/mobile-audit', phase);

const today = new Date();
const day = today.getDay();

const tenancy = {
  isAddedToProperty: true,
  tenant: {
    id: 'ten_mock_01',
    name: 'Ananya Sharma',
    phone: '9810098100',
    email: 'ananya.sharma@example.com',
    bedNumber: 'B2',
  },
  property: {
    id: 'prop_mock_01',
    name: 'Satya Heights Residency Satya Niketan',
    address: '42, Satya Niketan Marg, Near Venkateshwara College, New Delhi 110021',
    cityName: 'Delhi',
    contactNumber: '9811112233',
    ownerName: 'Rajesh Malhotra',
    googleMapsUrl: 'https://maps.google.com/?q=Satya+Niketan',
  },
  room: {
    id: 'room_12',
    roomNumber: '204',
    floorNumber: 2,
    sharingType: 'double',
    monthlyRent: 14500,
    securityDeposit: 20000,
  },
  bed: { id: 'bed_2', bedNumber: 'B2', status: 'occupied' },
  roomTenant: {
    id: 'rt_01',
    rentAmount: 14500,
    securityDeposit: 20000,
    bedNumber: 'B2',
    isSecurityPaid: false,
    status: 'active',
  },
  owner: { name: 'Rajesh Malhotra', phone: '9811112233' },
  staff: [
    { name: 'Meena Devi', designation: 'Caretaker', mobileContactNumber: '9822223344', isMainOwner: false },
  ],
  wifi: { ssid: 'SatyaHeights_5G_Resident', password: 'EaseStay#204B2' },
  amenities: ['High-speed Wi-Fi', 'Daily housekeeping', 'RO drinking water', 'Washing machine', 'Power backup', 'CCTV'],
  facilities: ['Study room', 'Common TV lounge'],
  restrictions: ['No loud music after 10 PM', 'Visitors allowed until 8 PM with a guest pass'],
  isRentDue: true,
};

const profile = {
  id: 'ten_mock_01',
  name: 'Ananya Sharma',
  phone: '9810098100',
  email: 'ananya.sharma@example.com',
};

const dues = {
  rentCollectionId: 'rc_mock_01',
  status: 'pending',
  period: { month: today.getMonth() + 1, year: today.getFullYear(), label: 'November 2026' },
  totalPayable: 17350,
  payable: 17350,
  nextDueDate: '2026-11-05',
  lineItems: {
    rent: { title: 'Monthly Room Rent', amount: 14500, isPaid: false, dueDay: 5 },
    securityDeposit: { title: 'Security Deposit', amount: 20000, isPaid: false },
    miscellaneous: {
      title: 'Utilities & Maintenance',
      amount: 2850,
      otherDuesAmount: 2850,
      description: 'Electricity, Wi-Fi and laundry',
      isPaid: false,
      otherDues: [
        { id: 'due_wifi', title: 'High-speed Wi-Fi', amount: 500, balance: 500, dueType: 'WiFi', description: 'Monthly fibre plan', isPaid: false },
        { id: 'due_laundry', title: 'Laundry service', amount: 850, balance: 850, dueType: 'Laundry', description: 'Weekly wash and iron', isPaid: false },
        { id: 'due_power', title: 'Electricity submeter', amount: 1500, balance: 1500, dueType: 'Electricity', description: 'October units', isPaid: false },
      ],
    },
  },
  summary: {
    totalBilled: 37350,
    amountPaid: 0,
    balanceDue: 37350,
    rentDue: 14500,
    totalPayable: 37350,
    status: 'pending',
  },
  settlement: {
    upiId: 'satyaheights@okhdfcbank',
    accountHolderName: 'Rajesh Malhotra',
    accountNumberMasked: 'XXXXXX4821',
    ifscCode: 'HDFC0001234',
    bankName: 'HDFC Bank',
  },
  owner: { name: 'Rajesh Malhotra', contactNumber: '9811112233' },
  tenant: { id: 'ten_mock_01', name: 'Ananya Sharma', phone: '9810098100', roomNumber: '204' },
  property: { id: 'prop_mock_01', name: tenancy.property.name, address: tenancy.property.address },
  room: { id: 'room_12', roomNumber: '204', bedNumber: 2 },
};

const history = {
  transactions: [
    {
      id: 'tx_1',
      title: 'October room rent',
      amount: 14500,
      status: 'SUCCESS',
      date: '2026-10-04',
      paymentMethod: 'UPI',
      receiptUrl: 'https://example.com/receipt/tx_1',
    },
  ],
  totalPaid: 14500,
};

const properties = {
  data: [
    {
      id: 'prop_public_1',
      slug: 'satya-heights',
      name: 'Satya Heights Residency Satya Niketan',
      address: '42, Satya Niketan Marg, New Delhi',
      city: 'Delhi',
      startingRent: 8500,
      singleSharingPrice: 18000,
      doubleSharingPrice: 12000,
      tripleSharingPrice: 8500,
      averageRating: 4.6,
      noOfRatings: 38,
      gender: 'girls',
      photos: [],
      amenities: ['Wi-Fi', 'Food', 'AC', 'Laundry'],
      foodAvailable: true,
      acAvailable: true,
      mobileContactNumber: '9811112233',
      latitude: 28.589,
      longitude: 77.167,
    },
    {
      id: 'prop_public_2',
      slug: 'green-park-stay',
      name: 'Green Park Stay',
      address: 'H Block, Green Park, Delhi',
      city: 'Delhi',
      startingRent: 9500,
      doubleSharingPrice: 11000,
      averageRating: 4.2,
      noOfRatings: 12,
      gender: 'co-ed',
      amenities: ['Wi-Fi', 'Power backup'],
      mobileContactNumber: '9800001111',
    },
  ],
  total: 2,
};

const propertyDetail = {
  id: 'prop_public_1',
  slug: 'satya-heights',
  name: 'Satya Heights Residency Satya Niketan',
  address: '42, Satya Niketan Marg, Near Venkateshwara College, New Delhi 110021',
  city: 'Delhi',
  gender: 'Girls',
  description: 'A verified girls PG with meals, Wi-Fi and AC rooms, a short walk from Venkateshwara College.',
  photos: [],
  amenities: ['High-speed Wi-Fi', 'Meals', 'AC rooms', 'Laundry', 'Housekeeping', 'Power backup'],
  facilities: ['Study room'],
  restrictions: ['Gate closes at 10:30 PM'],
  mobileContactNumber: '9811112233',
  latitude: 28.589,
  longitude: 77.167,
  singleSharingPrice: 18000,
  doubleSharingPrice: 12000,
  tripleSharingPrice: 8500,
  averageRating: 4.6,
  noOfRatings: 38,
  foodAvailable: true,
  isBookmarked: false,
};

function json(route, body, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

async function handleApi(route, mode) {
  const req = route.request();
  const url = new URL(req.url());
  const pathname = url.pathname.replace(/\/$/, '');
  const method = req.method();

  if (mode === 'unlinked' && pathname.endsWith('/tenants/get-property-details')) {
    return json(route, { isAddedToProperty: false, tenant: profile, message: 'Not linked' });
  }
  if (pathname.endsWith('/tenants/get-property-details')) return json(route, tenancy);
  if (pathname.endsWith('/tenants/profile') && method === 'GET') return json(route, profile);
  if (pathname.endsWith('/tenants/profile') && method === 'PATCH') return json(route, profile);
  if (pathname.endsWith('/tenants/rent-collections/my-dues')) return json(route, dues);
  if (pathname.endsWith('/tenants/rent-collections/history')) return json(route, history);
  if (pathname.endsWith('/tenants/notices')) {
    return json(route, [
      {
        id: 'n1',
        title: 'Water supply maintenance on Sunday morning',
        message: 'Water will be off from 8 AM to 11 AM for tank cleaning. Please store drinking water.',
        priority: 'urgent',
        createdAt: '2026-11-20T08:00:00.000Z',
      },
    ]);
  }
  if (pathname.endsWith('/tenants/agreements/my-agreements')) {
    return json(route, [
      { id: 'ag1', title: 'Tenancy agreement', status: 'signed', signedAt: '2026-08-01', url: 'https://example.com/agreement.pdf' },
    ]);
  }
  if (pathname.endsWith('/tenants/kyc')) {
    return json(route, {
      kyc: {
        isKycVerified: false,
        status: 'ACTION_REQUIRED',
        directLink: 'https://example.com/kyc',
      },
    });
  }
  if (pathname.endsWith('/tenants/dining-schedule')) {
    return json(route, {
      schedule: [
        {
          dayOfWeek: day,
          breakfast: { items: ['Poha', 'Banana', 'Tea'], startTime: '08:00', endTime: '09:30' },
          lunch: { items: ['Dal tadka', 'Rice', 'Roti', 'Seasonal sabzi'], startTime: '13:00', endTime: '14:30' },
          dinner: { items: ['Paneer curry', 'Roti', 'Salad'], startTime: '20:00', endTime: '21:30' },
        },
      ],
    });
  }
  if (pathname.endsWith('/tenants/complaints')) {
    return json(route, [
      {
        id: 'c1',
        ticketNumber: 'TCK-2041',
        subject: 'Bathroom tap leaking in room 204',
        description: 'The left tap drips through the night.',
        category: 'Plumbing',
        priority: 'high',
        status: 'in_progress',
        createdAt: '2026-11-18T10:00:00.000Z',
      },
    ]);
  }
  if (pathname.endsWith('/tenants/guest-requests')) {
    return json(route, [
      {
        id: 'g1',
        guestName: 'Priya Sharma',
        guestPhone: '9876500011',
        relationship: 'Sister',
        expectedArrival: '2026-11-24T16:00:00.000Z',
        expectedDeparture: '2026-11-24T20:00:00.000Z',
        numberOfGuests: 1,
        status: 'pending',
        purpose: 'Family visit',
        createdAt: '2026-11-21T09:00:00.000Z',
      },
    ]);
  }
  if (pathname.endsWith('/tenants/night-out-requests')) {
    return json(route, [
      {
        id: 'no1',
        leaveDate: '2026-11-28T18:00:00.000Z',
        returnDate: '2026-11-29T09:00:00.000Z',
        reason: 'Family function in Noida',
        destinationAddress: 'Sector 18, Noida',
        status: 'approved',
        createdAt: '2026-11-15T12:00:00.000Z',
      },
    ]);
  }
  if (pathname.endsWith('/tenants/notice-period')) {
    return json(route, { isOnNotice: false, noticePeriodDays: 30 });
  }
  if (pathname.endsWith('/tenants/payments/easebuzz/config')) {
    return json(route, { available: true, checkoutMode: 'hosted' });
  }
  if (pathname.endsWith('/tenants/payments/options')) {
    return json(route, { upi: true, cash: true, gateway: true });
  }
  if (pathname.includes('/tenants/payments/easebuzz/') && pathname.endsWith('/status')) {
    return json(route, {
      txnid: 'MOCKTXN1',
      status: 'SUCCESS',
      amount: '14500.00',
      currency: 'INR',
      easepayid: 'EPAY123',
      bankRefNum: '429182749102',
      utr: '429182749102',
      mode: 'UPI',
      paidAt: '2026-11-22T10:15:00.000Z',
    });
  }
  if (pathname.includes('/properties/public/search')) return json(route, properties);
  if (pathname.includes('/properties/public/')) return json(route, propertyDetail);
  if (pathname.endsWith('/tenants/bookmarks') && method === 'GET') {
    return json(route, [
      {
        id: 'prop_public_2',
        name: 'Green Park Stay',
        slug: 'green-park-stay',
        address: 'H Block, Green Park, Delhi',
        city: 'Delhi',
        minPrice: 9500,
        startingRent: 9500,
        photos: [],
        isBookmarked: true,
      },
    ]);
  }
  if (pathname.includes('/inventory')) return json(route, { items: [], status: 'empty' });
  if (method !== 'GET') return json(route, { success: true });
  return json(route, {});
}

async function measure(page) {
  return page.evaluate(() => {
    const vw = window.innerWidth;
    const docOverflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    const offenders = [];
    const nodes = document.querySelectorAll('body *');
    for (const el of nodes) {
      const rect = el.getBoundingClientRect();
      if (rect.width < 8 || rect.height < 8) continue;
      if (rect.right > vw + 4 || rect.left < -4) {
        const style = getComputedStyle(el);
        if (style.position === 'fixed') continue;
        offenders.push({
          tag: el.tagName.toLowerCase(),
          className: String(el.className || '').slice(0, 90),
          text: (el.innerText || '').trim().slice(0, 60),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        });
      }
      if (offenders.length >= 8) break;
    }
    const tinyTaps = [];
    document.querySelectorAll('button, a').forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      if (rect.height < 40 || rect.width < 40) {
        const text = (el.innerText || el.getAttribute('aria-label') || el.getAttribute('title') || '').trim().slice(0, 40);
        if (!text && rect.width >= 32) return;
        tinyTaps.push({ text, w: Math.round(rect.width), h: Math.round(rect.height) });
      }
    });
    return {
      docOverflow,
      offenders,
      tinyTapCount: tinyTaps.length,
      tinyTaps: tinyTaps.slice(0, 8),
    };
  });
}

const viewports = [
  { name: '360x800', width: 360, height: 800 },
  { name: '412x915', width: 412, height: 915 },
];

const linkedRoutes = [
  ['home', '/'],
  ['search', '/search'],
  ['my-pg', '/my-pg'],
  ['payments', '/payments'],
  ['transactions', '/transactions'],
  ['complaints', '/complaints'],
  ['guests', '/guests'],
  ['night-out', '/night-out'],
  ['food', '/food'],
  ['wifi', '/wifi'],
  ['notice', '/notice'],
  ['announcements', '/announcements'],
  ['documents', '/documents'],
  ['notifications', '/notifications'],
  ['saved', '/saved'],
  ['menu', '/profile'],
  ['pg-detail', '/pg/satya-heights'],
  ['payment-result', '/payments/result?txnid=MOCKTXN1&status=success'],
];

async function prepare(page, mode) {
  await page.addInitScript((m) => {
    if (m === 'guest') {
      localStorage.removeItem('pgease_tenant_token');
      localStorage.removeItem('pgease_tenant_refresh_token');
      sessionStorage.setItem('pgease_guest_mode', 'true');
    } else if (m === 'logged-out') {
      localStorage.removeItem('pgease_tenant_token');
      localStorage.removeItem('pgease_tenant_refresh_token');
      sessionStorage.removeItem('pgease_guest_mode');
    } else {
      localStorage.setItem('pgease_tenant_token', 'mock-access-token');
      localStorage.setItem('pgease_tenant_refresh_token', 'mock-refresh-token');
      sessionStorage.removeItem('pgease_guest_mode');
    }
  }, mode);
  await page.route('**/*execute-api*', (route) => handleApi(route, mode));
  await page.route('**/api/**', (route) => handleApi(route, mode));
  await page.route('**/qrserver.com/**', (route) => route.abort());
  page.on('dialog', (dialog) => dialog.dismiss());
}

async function shoot(page, file) {
  await page.waitForTimeout(700);
  await page.screenshot({ path: file, fullPage: false });
  return measure(page);
}

async function main() {
  await mkdir(outRoot, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome-stable',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });
  const report = [];

  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
      userAgent:
        'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 PGEaseApp',
    });
    const page = await context.newPage();
    await prepare(page, 'linked');

    for (const [name, route] of linkedRoutes) {
      await page.goto(base + route, { waitUntil: 'domcontentloaded', timeout: 20000 });
      const file = path.join(outRoot, `${vp.name}-${name}.png`);
      const metrics = await shoot(page, file);
      report.push({ viewport: vp.name, screen: name, route, file, ...metrics });
      console.log('shot', vp.name, name, 'overflow', metrics.docOverflow, 'tiny', metrics.tinyTapCount);
    }

    if (vp.width === 360) {
      await page.goto(base + '/payments', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(600);
      const pay = page.getByRole('button', { name: /Pay ₹|Pay Dues|Make Advance|Pay Rent/ }).first();
      if (await pay.count()) {
        await pay.click();
        await page.waitForTimeout(500);
        const file = path.join(outRoot, `${vp.name}-modal-pay-gateway.png`);
        const metrics = await shoot(page, file);
        report.push({ viewport: vp.name, screen: 'modal-pay-gateway', route: '/payments#pay', file, ...metrics });
        const upi = page.getByRole('button', { name: /Direct UPI/ }).first();
        if (await upi.count()) {
          await upi.click();
          await page.waitForTimeout(400);
          const file2 = path.join(outRoot, `${vp.name}-modal-pay-upi.png`);
          const metrics2 = await shoot(page, file2);
          report.push({ viewport: vp.name, screen: 'modal-pay-upi', route: '/payments#upi', file: file2, ...metrics2 });
        }
      }

      await page.goto(base + '/search', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
      const filters = page.getByRole('button', { name: 'Filters' }).first();
      if (await filters.count()) {
        await filters.click();
        await page.waitForTimeout(400);
        const file = path.join(outRoot, `${vp.name}-modal-filters.png`);
        const metrics = await shoot(page, file);
        report.push({ viewport: vp.name, screen: 'modal-filters', route: '/search#filters', file, ...metrics });
      }

      await page.goto(base + '/profile', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(400);
      const edit = page.getByRole('button', { name: 'Edit Profile' }).first();
      if (await edit.count()) {
        await edit.click();
        await page.waitForTimeout(400);
        const file = path.join(outRoot, `${vp.name}-modal-edit-profile.png`);
        const metrics = await shoot(page, file);
        report.push({ viewport: vp.name, screen: 'modal-edit-profile', route: '/profile#edit', file, ...metrics });
      }

      const menuBtn = page.getByRole('button', { name: /Open menu|All services/i }).first();
      if (await menuBtn.count()) {
        await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(400);
        const opener = page.getByRole('button', { name: /Open menu|All services/i }).first();
        if (await opener.count()) {
          await opener.click();
          await page.waitForTimeout(400);
          const file = path.join(outRoot, `${vp.name}-drawer.png`);
          const metrics = await shoot(page, file);
          report.push({ viewport: vp.name, screen: 'drawer', route: '/#drawer', file, ...metrics });
        }
      }
    }

    await context.close();

    const guestContext = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
    });
    const guest = await guestContext.newPage();
    await prepare(guest, 'guest');
    await guest.goto(base + '/', { waitUntil: 'domcontentloaded' });
    const gfile = path.join(outRoot, `${vp.name}-guest-home.png`);
    const gmetrics = await shoot(guest, gfile);
    report.push({ viewport: vp.name, screen: 'guest-home', route: '/?guest', file: gfile, ...gmetrics });
    await guestContext.close();

    if (vp.width === 360) {
      const outContext = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        isMobile: true,
        hasTouch: true,
      });
      const loggedOut = await outContext.newPage();
      await prepare(loggedOut, 'logged-out');
      await loggedOut.goto(base + '/login', { waitUntil: 'domcontentloaded' });
      const lfile = path.join(outRoot, `${vp.name}-login.png`);
      const lmetrics = await shoot(loggedOut, lfile);
      report.push({ viewport: vp.name, screen: 'login', route: '/login', file: lfile, ...lmetrics });

      const unlinkedContext = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        isMobile: true,
        hasTouch: true,
      });
      const unlinked = await unlinkedContext.newPage();
      await prepare(unlinked, 'unlinked');
      await unlinked.goto(base + '/my-pg', { waitUntil: 'domcontentloaded' });
      const ufile = path.join(outRoot, `${vp.name}-unlinked-my-pg.png`);
      const umetrics = await shoot(unlinked, ufile);
      report.push({ viewport: vp.name, screen: 'unlinked-my-pg', route: '/my-pg?unlinked', file: ufile, ...umetrics });
      await unlinked.goto(base + '/', { waitUntil: 'domcontentloaded' });
      const hfile = path.join(outRoot, `${vp.name}-unlinked-home.png`);
      const hmetrics = await shoot(unlinked, hfile);
      report.push({ viewport: vp.name, screen: 'unlinked-home', route: '/?unlinked', file: hfile, ...hmetrics });
      await unlinkedContext.close();
      await outContext.close();
    }
  }

  await writeFile(path.join(outRoot, 'metrics.json'), JSON.stringify(report, null, 2));
  await browser.close();
  console.log('wrote', report.length, 'shots to', outRoot);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
