import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'data', 'reco.db');
const db = new Database(dbPath);

console.log("=== RECO DB VALIDATION ===");

const cases = db.prepare("SELECT * FROM recovery_cases").all();

let revenueAtRisk = 0;
let revenueRecovered = 0;
let active = 0;
let recovered = 0;
let stopped = 0;
let review = 0;
let failed = 0;

for (const c of cases) {
  revenueAtRisk += c.invoice_amount;
  revenueRecovered += (c.recovered_amount || 0);
  
  const s = c.status;
  if (s === "ACTIVE") active++;
  else if (s === "RECOVERED") recovered++;
  else if (s === "STOPPED") stopped++;
  else if (s === "HUMAN_REVIEW") review++;
  else if (s === "FAILED") failed++;
  else console.log("Unknown status:", s);
}

const recoveryRate = (revenueRecovered / revenueAtRisk) * 100;

console.log(`Total Cases: ${cases.length} (Expected: 20)`);
console.log(`Revenue at Risk: ${revenueAtRisk} (Expected: 1860000)`);
console.log(`Revenue Recovered: ${revenueRecovered} (Expected: 1140000)`);
console.log(`Recovery Rate: ${recoveryRate.toFixed(2)}% (Expected: 61.29%)`);

console.log(`\nStatuses:`);
console.log(`RECOVERED: ${recovered} (Expected: 11)`);
console.log(`ACTIVE: ${active} (Expected: 2)`);
console.log(`HUMAN_REVIEW: ${review} (Expected: 4)`);
console.log(`STOPPED: ${stopped} (Expected: 3)`);
console.log(`FAILED: ${failed}`);

if (cases.length === 20 && revenueAtRisk === 1860000 && revenueRecovered === 1140000 && recovered === 11 && active === 2 && review === 4 && stopped === 3) {
  console.log("\n✅ ALL VALIDATIONS PASSED.");
} else {
  console.log("\n❌ VALIDATION FAILED.");
}

db.close();
