import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('/Users/saksham/Downloads/PG EASE/tenant-web-app/node_modules/playwright-core');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'docs', 'redesign', 'round4');
const shotsDir = path.join(outDir, 'routes');
fs.mkdirSync(shotsDir, { recursive: true });

const appSrc = fs.readFileSync(path.join(root, 'src', 'App.tsx'), 'utf8');
const regSrc = fs.readFileSync(path.join(root, 'src', 'mobile', 'navRegistry.ts'), 'utf8');

const routeSet = new Set(['/', '/login', '/search', '/my-pg', '/profile']);
for (const m of appSrc.matchAll(/path="([^"]+)"/g)) {
  const p = m[1];
  if (p && !p.includes('*') && !p.includes(':')) {
    routeSet.add(p.startsWith('/') ? p : `/${p}`);
  }
}
for (const m of regSrc.matchAll(/route:\s*'([^']+)'/g)) {
  const p = m[1];
  if (p && !p.includes(':')) routeSet.add(p);
}
const routes = [...routeSet].sort();

const preview = spawn('npx', ['vite', 'preview', '--port', '4174', '--strictPort'], {
  cwd: root,
  stdio: 'ignore',
});

await new Promise((r) => setTimeout(r, 2000));

let browser;
const results = [];
try {
  browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox'],
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();

  for (const route of routes) {
    const errors = [];
    const onPageErr = (e) => errors.push(`pageerror: ${e.message}`);
    const onConsoleErr = (msg) => {
      if (msg.type() === 'error') {
        const txt = msg.text();
        if (/ReferenceError|is not defined|is not a function|Cannot read properties/i.test(txt)) {
          errors.push(`console.error: ${txt}`);
        }
      }
    };
    page.on('pageerror', onPageErr);
    page.on('console', onConsoleErr);

    await page.goto(`http://localhost:4174${route}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(800);

    const bodyText = await page.evaluate(() => document.body.innerText || '');
    const rootHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML || '');

    if (/Unable to load this page|Something went wrong on this page/i.test(bodyText)) {
      errors.push('ErrorBoundary rendered');
    }
    if (!rootHtml.trim()) {
      errors.push('Empty #root');
    }

    page.off('pageerror', onPageErr);
    page.off('console', onConsoleErr);

    results.push({
      route,
      status: errors.length === 0 ? 'PASS' : 'FAIL',
      errors,
    });
  }
} finally {
  if (browser) await browser.close();
  preview.kill();
}

fs.writeFileSync(path.join(outDir, 'A-routes.json'), JSON.stringify(results, null, 2));
const md = [
  '# Tenant Web Route Smoke Test (`verify:routes`)',
  '',
  '| Route | Status | Errors |',
  '| --- | --- | --- |',
  ...results.map((r) => `| \`${r.route}\` | **${r.status}** | ${r.errors.join('; ') || 'None'} |`),
].join('\n');
fs.writeFileSync(path.join(outDir, 'A-routes.md'), md);

const failed = results.filter((r) => r.status === 'FAIL');
console.log(`Checked ${results.length} tenant routes: ${results.length - failed.length} PASS, ${failed.length} FAIL.`);
if (failed.length > 0) {
  console.error(failed);
  process.exit(1);
}
