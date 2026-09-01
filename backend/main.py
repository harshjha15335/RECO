import json
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import agent
import rules
import tools
from db import db_session, init_db, row_to_dict

app = FastAPI(title="RECO - Revenue Recovery Control Tower")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def log_audit(conn, case_id: str, event: str, detail: dict | None = None):
    conn.execute(
        "INSERT INTO audit_log (case_id, ts, event, detail) VALUES (?, ?, ?, ?)",
        (case_id, now(), event, json.dumps(detail or {})),
    )


def get_case_row(conn, case_id: str):
    row = conn.execute("SELECT * FROM cases WHERE case_id = ?", (case_id,)).fetchone()
    if row is None:
        raise HTTPException(404, f"Case {case_id} not found")
    return row_to_dict(row)


@app.on_event("startup")
def startup():
    init_db(reset=False)


# ---------------------------------------------------------------- cases ----

@app.get("/cases")
def list_cases():
    with db_session() as conn:
        rows = conn.execute("SELECT * FROM cases ORDER BY case_id").fetchall()
        return [row_to_dict(r) for r in rows]


@app.get("/cases/{case_id}")
def get_case(case_id: str):
    with db_session() as conn:
        return get_case_row(conn, case_id)


# -------------------------------------------------------------- analyze ----

@app.post("/cases/{case_id}/analyze")
def analyze_case(case_id: str):
    with db_session() as conn:
        case = get_case_row(conn, case_id)

        log_audit(conn, case_id, "Context loaded", {"message": "Customer + payment history retrieved."})

        diagnosis = agent.diagnose(case)
        log_audit(conn, case_id, "AI diagnosis complete", {"message": diagnosis["diagnosis"], "confidence": diagnosis["confidence"]})

        options = rules.calc_options(case)
        log_audit(conn, case_id, "Options calculated", {"message": f"{len(options)} recovery options evaluated."})

        decision = agent.select_action(case, diagnosis, options)
        log_audit(conn, case_id, "Decision selected", {"message": options and next(
            (o["label"] for o in options if o["action"] == decision["recommended_action"]), decision["recommended_action"]
        )})

        guardrail = rules.guardrail_check(case, decision["recommended_action"], options)
        log_audit(conn, case_id, "Guardrail check", {
            "message": "All rules passed." if not guardrail["rule_triggered"] else f"Rule triggered: {guardrail['rule_triggered']}",
            "reason": guardrail["reason"],
        })

        chosen_option = next((o for o in options if o["action"] == guardrail["action"]), None)
        expected_recovery = chosen_option["expected_recovery"] if chosen_option else 0.0

        decision_full = {**decision, **guardrail}
        if guardrail["reason"] is None:
            decision_full["reason"] = decision["reason"]

        status = guardrail["final_status"]
        recovered_amount = case["invoice_amount"] if status == "recovered" else None

        if status == "pending":
            log_audit(conn, case_id, "Ready to execute", {"message": "Awaiting confirmation."})
        elif status == "recovered":
            log_audit(conn, case_id, "Duplicate payment detected", {"message": guardrail["reason"]})
        elif status == "escalated":
            log_audit(conn, case_id, "Escalated to human", {"message": guardrail["reason"] or "Routed for manual review."})
        elif status == "stopped":
            log_audit(conn, case_id, "Recovery stopped", {"message": guardrail["reason"]})

        conn.execute(
            """UPDATE cases SET diagnosis=?, options=?, decision=?, chosen_action=?,
               expected_recovery=?, status=?, recovered_amount=? WHERE case_id=?""",
            (json.dumps(diagnosis), json.dumps(options), json.dumps(decision_full),
             guardrail["action"], expected_recovery, status, recovered_amount, case_id),
        )

        return get_case_row(conn, case_id)


# --------------------------------------------------------------- execute ----

class ExecuteRequest(BaseModel):
    force_fail: bool = False


@app.post("/cases/{case_id}/execute")
def execute_case(case_id: str, req: ExecuteRequest = ExecuteRequest()):
    with db_session() as conn:
        case = get_case_row(conn, case_id)

        if case["status"] not in ("pending",) or not case["chosen_action"]:
            return {"case": case, "message": "Nothing to execute for this case's current state."}

        if case["chosen_action"] not in ("reminder_now", "wait_and_payment_link"):
            return {"case": case, "message": "This action does not require tool execution."}

        attempts = case["attempts"] + 1
        conn.execute("UPDATE cases SET attempts=? WHERE case_id=?", (attempts, case_id))

        if case["chosen_action"] == "wait_and_payment_link":
            result = tools.create_payment_link(case, force_fail=req.force_fail)
        else:
            result = tools.send_reminder(case)

        if result["success"]:
            conn.execute(
                "UPDATE cases SET status='recovered', recovered_amount=? WHERE case_id=?",
                (case["invoice_amount"], case_id),
            )
            log_audit(conn, case_id, "Recovery action succeeded", result)
            log_audit(conn, case_id, "Case recovered", {"message": f"Payment recovered via {case['chosen_action']}."})
            return {"case": get_case_row(conn, case_id), "result": result}

        log_audit(conn, case_id, "Recovery action failed", result)

        if attempts < rules.MAX_ATTEMPTS:
            log_audit(conn, case_id, "Fallback strategy selected", {"message": "Retrying with alternate approach."})
            retry = tools.create_payment_link(case, force_fail=False)
            attempts += 1
            conn.execute("UPDATE cases SET attempts=? WHERE case_id=?", (attempts, case_id))
            if retry["success"]:
                conn.execute(
                    "UPDATE cases SET status='recovered', recovered_amount=? WHERE case_id=?",
                    (case["invoice_amount"], case_id),
                )
                log_audit(conn, case_id, "Fallback executed", retry)
                log_audit(conn, case_id, "Case recovered", {"message": "Recovered via fallback after initial failure."})
                return {"case": get_case_row(conn, case_id), "result": retry}
            log_audit(conn, case_id, "Fallback also failed", retry)

        conn.execute("UPDATE cases SET status='escalated' WHERE case_id=?", (case_id,))
        log_audit(conn, case_id, "Escalated to human", {"message": f"Automated recovery failed after {attempts} attempt(s)."})
        return {"case": get_case_row(conn, case_id), "result": result}


# --------------------------------------------------------- inject-failure ----

class InjectFailureRequest(BaseModel):
    type: str = "gateway"  # gateway | systemic | mid_payment


@app.post("/cases/{case_id}/inject-failure")
def inject_failure(case_id: str, req: InjectFailureRequest):
    with db_session() as conn:
        case = get_case_row(conn, case_id)

        if req.type == "gateway":
            result = execute_case(case_id, ExecuteRequest(force_fail=True))
            return result

        if req.type == "mid_payment":
            conn.execute(
                "UPDATE cases SET status='recovered', recovered_amount=? WHERE case_id=?",
                (case["invoice_amount"], case_id),
            )
            log_audit(conn, case_id, "Payment received", {"message": "Customer paid mid-workflow."})
            log_audit(conn, case_id, "Remaining actions cancelled", {"message": "Duplicate-prevention halted further recovery steps."})
            log_audit(conn, case_id, "Case recovered", {"message": "Marked recovered from live payment detection."})
            return {"case": get_case_row(conn, case_id)}

        if req.type == "systemic":
            rail = case["payment_rail"]
            affected = conn.execute(
                "SELECT * FROM cases WHERE payment_rail=? AND status='pending'", (rail,)
            ).fetchall()
            affected = [row_to_dict(r) for r in affected]
            for c in affected:
                conn.execute("UPDATE cases SET status='stopped' WHERE case_id=?", (c["case_id"],))
                log_audit(conn, c["case_id"], "Systemic issue detected", {
                    "message": f"Failure spike on {rail} rail. Automated recovery suppressed for this case."
                })
            conn.execute(
                "INSERT OR REPLACE INTO system_state (key, value) VALUES (?, ?)",
                ("systemic_incident", json.dumps({
                    "active": True,
                    "rail": rail,
                    "failure_rate": 0.28,
                    "affected_cases": len(affected),
                    "detected_at": now(),
                })),
            )
            return {
                "systemic_incident": {"active": True, "rail": rail, "affected_cases": len(affected)},
                "affected_case_ids": [c["case_id"] for c in affected],
            }

        raise HTTPException(400, f"Unknown failure type: {req.type}")


@app.post("/system/reset-systemic")
def reset_systemic():
    with db_session() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO system_state (key, value) VALUES (?, ?)",
            ("systemic_incident", json.dumps({"active": False})),
        )
    return {"systemic_incident": {"active": False}}


@app.get("/system/status")
def system_status():
    with db_session() as conn:
        row = conn.execute("SELECT value FROM system_state WHERE key='systemic_incident'").fetchone()
        state = json.loads(row["value"]) if row else {"active": False}
        return {"systemic_incident": state}


# ---------------------------------------------------------------- audit -----

@app.get("/audit/{case_id}")
def get_audit(case_id: str):
    with db_session() as conn:
        rows = conn.execute(
            "SELECT * FROM audit_log WHERE case_id=? ORDER BY id ASC", (case_id,)
        ).fetchall()
        events = []
        for r in rows:
            d = dict(r)
            if d.get("detail"):
                try:
                    d["detail"] = json.loads(d["detail"])
                except (TypeError, json.JSONDecodeError):
                    pass
            events.append(d)
        return events


# --------------------------------------------------------------- metrics ----

@app.get("/metrics")
def metrics():
    with db_session() as conn:
        rows = [row_to_dict(r) for r in conn.execute("SELECT * FROM cases").fetchall()]

        total_at_risk = sum(c["invoice_amount"] for c in rows)
        total_recovered = sum(c["recovered_amount"] or 0 for c in rows if c["status"] == "recovered")
        active_cases = sum(1 for c in rows if c["status"] in ("pending", "recovering"))
        escalated_cases = sum(1 for c in rows if c["status"] == "escalated")
        stopped_cases = sum(1 for c in rows if c["status"] == "stopped")
        recovered_cases = sum(1 for c in rows if c["status"] == "recovered")
        failed_actions = conn.execute(
            "SELECT COUNT(*) as n FROM audit_log WHERE event='Recovery action failed'"
        ).fetchone()["n"]

        recovery_rate = (total_recovered / total_at_risk * 100) if total_at_risk else 0.0

        return {
            "total_revenue_at_risk": round(total_at_risk, 2),
            "total_recovered": round(total_recovered, 2),
            "recovery_rate": round(recovery_rate, 2),
            "active_cases": active_cases,
            "escalated_cases": escalated_cases,
            "stopped_cases": stopped_cases,
            "recovered_cases": recovered_cases,
            "failed_actions": failed_actions,
            "total_cases": len(rows),
        }


# ------------------------------------------------------------ run-recovery --

@app.post("/run-recovery")
def run_recovery():
    """Analyzes every not-yet-analyzed case in sequence. Demo convenience endpoint."""
    with db_session() as conn:
        rows = conn.execute("SELECT case_id FROM cases WHERE decision IS NULL").fetchall()
        case_ids = [r["case_id"] for r in rows]

    results = []
    for cid in case_ids:
        results.append(analyze_case(cid))

    return {"analyzed": len(results), "case_ids": case_ids}
