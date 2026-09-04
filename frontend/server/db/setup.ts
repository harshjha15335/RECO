import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.resolve(process.cwd(), "data");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(path.join(dbDir, "reco.db"));
db.pragma("journal_mode = WAL");

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      value_tier TEXT NOT NULL,
      total_invoiced REAL NOT NULL,
      total_recovered REAL NOT NULL,
      average_payment_delay REAL NOT NULL,
      prior_payments_ontime INTEGER NOT NULL,
      prior_failures INTEGER NOT NULL,
      relationship_risk TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      amount REAL NOT NULL,
      due_date TEXT NOT NULL,
      status TEXT NOT NULL,
      payment_link TEXT,
      payment_rail TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS recovery_cases (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      invoice_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      invoice_amount REAL NOT NULL,
      days_overdue INTEGER NOT NULL,
      customer_value_tier TEXT NOT NULL,
      prior_payments_ontime INTEGER NOT NULL,
      prior_failures INTEGER NOT NULL,
      dispute_flag INTEGER NOT NULL,
      already_paid_flag INTEGER NOT NULL,
      payment_rail TEXT NOT NULL,
      communication_opened INTEGER NOT NULL,
      attempt_count INTEGER NOT NULL,
      status TEXT NOT NULL,
      ai_diagnosis TEXT,
      ai_confidence REAL,
      recommended_action TEXT,
      expected_recovery REAL,
      recovered_amount REAL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(customer_id) REFERENCES customers(id),
      FOREIGN KEY(invoice_id) REFERENCES invoices(id)
    );

    CREATE TABLE IF NOT EXISTS recovery_attempts (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL,
      action TEXT NOT NULL,
      attempt_number INTEGER NOT NULL,
      status TEXT NOT NULL,
      expected_recovery REAL NOT NULL,
      recovered_amount REAL,
      failure_reason TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(case_id) REFERENCES recovery_cases(id)
    );

    CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      message TEXT NOT NULL,
      metadata TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(case_id) REFERENCES recovery_cases(id)
    );

    CREATE TABLE IF NOT EXISTS system_incidents (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      payment_rail TEXT NOT NULL,
      failure_rate REAL NOT NULL,
      affected_cases INTEGER NOT NULL,
      status TEXT NOT NULL,
      started_at TEXT NOT NULL,
      resolved_at TEXT
    );
  `);
}
