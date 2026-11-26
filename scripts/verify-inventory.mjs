import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const inventoryPath = path.join(root, 'docs', 'redesign', 'inventory.json');
const registryPath = path.join(root, 'src', 'mobile', 'navRegistry.ts');

const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
const registrySrc = fs.readFileSync(registryPath, 'utf8');

const registryIds = new Set(
  [...registrySrc.matchAll(/id:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]),
);

let missing = 0;
for (const row of inventory) {
  if (!row.registryId || !registryIds.has(row.registryId) || !row.newLocation) {
    console.error(`❌ Invalid inventory row: ${JSON.stringify(row)}`);
    missing++;
  }
}

if (missing > 0) {
  process.exit(1);
}
console.log(`✅ Verified ${inventory.length} tenant inventory rows against ${registryIds.size} navRegistry entries.`);
