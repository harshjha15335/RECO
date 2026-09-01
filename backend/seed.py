"""Seeds the SQLite database with 20 representative recovery cases."""
import json
from datetime import datetime, timezone

from db import db_session, init_db

NOW = datetime.now(timezone.utc).isoformat()

# fields: case_id, customer_name, tier, invoice_no, amount, days_overdue,
#         ontime, failures, dispute, already_paid, rail, opened, pattern, attempts
CASES = [
    ("CASE-01", "Acme Technologies", "High", "INV-83221", 240000, 2, 5, 0, 0, 0, "UPI", 1, "late_but_reliable", 0),
    ("CASE-02", "Beta Corp", "Low", "INV-11042", 15000, 3, 4, 0, 0, 0, "UPI", 1, "easy_recovery", 0),
    ("CASE-03", "Gamma Logistics", "Medium", "INV-55391", 85000, 10, 2, 1, 1, 0, "NEFT", 0, "active_dispute", 0),
    ("CASE-04", "Delta Industries", "Medium", "INV-70218", 120000, 15, 1, 3, 0, 0, "UPI", 0, "repeat_failure", 2),
    ("CASE-05", "Epsilon Pvt Ltd", "High", "INV-90065", 300000, 1, 5, 0, 0, 1, "UPI", 1, "already_paid", 0),
    ("CASE-06", "Zeta Solutions", "Medium", "INV-33187", 60000, 4, 3, 2, 0, 0, "UPI", 0, "systemic_candidate", 0),
    ("CASE-07", "Eta Enterprises", "Medium", "INV-48120", 95000, 20, 2, 0, 0, 0, "NEFT", 0, "ignored_comms", 0),
    ("CASE-08", "Theta Systems", "Low", "INV-10099", 3000, 30, 0, 1, 0, 0, "UPI", 0, "uneconomical", 0),
    ("CASE-09", "Iota Ventures", "Medium", "INV-62204", 150000, 3, 4, 0, 0, 0, "UPI", 1, "late_but_reliable", 0),
    ("CASE-10", "Kappa Global", "High", "INV-77310", 220000, 1, 5, 0, 0, 0, "UPI", 1, "late_but_reliable", 0),
    ("CASE-11", "Lambda Traders", "Low", "INV-20456", 25000, 6, 3, 0, 0, 0, "UPI", 1, "easy_recovery", 0),
    ("CASE-12", "Mu Manufacturing", "Medium", "INV-38812", 110000, 8, 1, 0, 1, 0, "NEFT", 0, "active_dispute", 0),
    ("CASE-13", "Nu Textiles", "Medium", "INV-59901", 70000, 2, 3, 0, 0, 1, "UPI", 1, "already_paid", 0),
    ("CASE-14", "Xi Freight", "Medium", "INV-41277", 55000, 5, 2, 3, 0, 0, "UPI", 0, "systemic_candidate", 0),
    ("CASE-15", "Omicron Retail", "Low", "INV-15683", 40000, 18, 1, 2, 0, 0, "UPI", 0, "repeat_failure", 2),
    ("CASE-16", "Pi Analytics", "High", "INV-92034", 180000, 25, 3, 0, 0, 0, "NEFT", 0, "ignored_comms", 0),
    ("CASE-17", "Rho Chemicals", "Low", "INV-27710", 2000, 40, 0, 2, 0, 0, "UPI", 0, "uneconomical", 0),
    ("CASE-18", "Sigma Pharma", "Medium", "INV-64455", 50000, 3, 4, 0, 0, 0, "UPI", 1, "easy_recovery", 0),
    ("CASE-19", "Tau Electronics", "High", "INV-81190", 200000, 2, 5, 0, 0, 0, "UPI", 1, "late_but_reliable", 0),
    ("CASE-20", "Upsilon Foods", "Medium", "INV-53367", 65000, 4, 2, 3, 0, 0, "UPI", 0, "systemic_candidate", 0),
]

COLUMNS = [
    "case_id", "customer_name", "customer_value_tier", "invoice_number",
    "invoice_amount", "days_overdue", "prior_payments_ontime", "prior_failures",
    "dispute_flag", "already_paid_flag", "payment_rail", "communication_opened",
    "expected_pattern", "attempts",
]


def seed(reset: bool = True):
    init_db(reset=reset)
    with db_session() as conn:
        for row in CASES:
            values = dict(zip(COLUMNS, row))
            conn.execute(
                f"""INSERT INTO cases ({", ".join(COLUMNS)}, status, created_at)
                    VALUES ({", ".join("?" for _ in COLUMNS)}, ?, ?)""",
                [*[values[c] for c in COLUMNS], "pending", NOW],
            )
            conn.execute(
                "INSERT INTO audit_log (case_id, ts, event, detail) VALUES (?, ?, ?, ?)",
                (values["case_id"], NOW, "Case detected", json.dumps(
                    {"message": f"Invoice {values['invoice_number']} is {values['days_overdue']} days overdue."}
                )),
            )
        conn.execute("INSERT OR REPLACE INTO system_state (key, value) VALUES (?, ?)",
                      ("systemic_incident", json.dumps({"active": False})))
    print(f"Seeded {len(CASES)} cases.")


if __name__ == "__main__":
    seed(reset=True)
