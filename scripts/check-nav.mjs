import fs from 'node:fs';

const app = fs.readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const menu = fs.readFileSync(new URL('../src/navigation/appMenu.ts', import.meta.url), 'utf8');
const layout = fs.readFileSync(new URL('../src/components/layout/AppLayout.tsx', import.meta.url), 'utf8');

const aliases = {
  'payments/history': '/transactions',
  transactions: '/transactions',
  'guest-entry': '/guests',
  dining: '/food',
  'notice-period': '/notice',
  notices: '/announcements',
  menu: '/profile',
  search: '/search',
  payments: '/payments',
  complaints: '/complaints',
  guests: '/guests',
  'night-out': '/night-out',
  food: '/food',
  wifi: '/wifi',
  notice: '/notice',
  announcements: '/announcements',
  documents: '/documents',
  notifications: '/notifications',
  saved: '/saved',
  'my-pg': '/my-pg',
  profile: '/profile',
};

const missing = [];
for (const [route, target] of Object.entries(aliases)) {
  if (!app.includes(`path="${route}"`) && !app.includes(`path="${route.split('/')[0]}"`)) {
    missing.push(`route ${route} not declared`);
  }
  if (!menu.includes(`'${target}'`)) {
    missing.push(`${target} missing from app menu`);
  }
}

if (!layout.includes('MobileDrawer') || !layout.includes('showBack')) {
  missing.push('app bar is missing the drawer or back control');
}

const manifest = JSON.parse(fs.readFileSync(new URL('../public/manifest.json', import.meta.url), 'utf8'));
if (manifest.display !== 'standalone' || manifest.theme_color !== '#008080') {
  missing.push('manifest display or theme colour changed');
}
if (!manifest.icons.some((icon) => icon.sizes === '192x192' && icon.purpose === 'any')) {
  missing.push('manifest is missing a 192 icon');
}
if (!manifest.icons.some((icon) => icon.purpose === 'maskable')) {
  missing.push('manifest is missing a maskable icon');
}

if (missing.length) {
  console.error(missing.join('\n'));
  process.exit(1);
}

console.log(`nav check ok (${Object.keys(aliases).length} destinations)`);
