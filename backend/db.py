import sqlite3
import json
import os
from contextlib import contextmanager

DB_PATH = os.path.join(os.path.dirname(__file__), "reco.db")

SCHEMA = """
CREATE TABLE IF NOT EXISTS cases (
    case_id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_value_tier TEXT NOT NULL,
    invoice_number TEXT NOT NULL,
    invoice_amount REAL NOT NULL,
    days_overdue INTEGER NOT NULL,
    prior_payments_ontime INTEGER NOT NULL,
    prior_failures INTEGER NOT NULL,
    dispute_flag INTEGER NOT NULL DEFAULT 0,
    already_paid_flag INTEGER NOT NULL DEFAULT 0,
    payment_rail TEXT NOT NULL,
    communication_opened INTEGER NOT NULL DEFAULT 0,
    expected_pattern TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    attempts INTEGER NOT NULL DEFAULT 0,
    diagnosis TEXT,
    options TEXT,
    decision TEXT,
    chosen_action TEXT,
    expected_recovery REAL,
    recovered_amount REAL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id TEXT NOT NULL,
    ts TEXT NOT NULL,
    event TEXT NOT NULL,
    detail TEXT
);

CREATE TABLE IF NOT EXISTS system_state (
    key TEXT PRIMARY KEY,
    value TEXT
);
"""


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


@contextmanager
def db_session():
    conn = get_conn()
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db(reset: bool = False):
    if reset and os.path.exists(DB_PATH):
        os.remove(DB_PATH)
    with db_session() as conn:
        conn.executescript(SCHEMA)


def row_to_dict(row: sqlite3.Row) -> dict:
    d = dict(row)
    for key in ("diagnosis", "options", "decision"):
        if d.get(key):
            try:
                d[key] = json.loads(d[key])
            except (TypeError, json.JSONDecodeError):
                pass
    for key in ("dispute_flag", "already_paid_flag", "communication_opened"):
        if key in d:
            d[key] = bool(d[key])
    return d
