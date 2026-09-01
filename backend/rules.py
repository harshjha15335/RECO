"""Deterministic rules: EV heuristic, option calculation, and hard guardrails.

Nothing here is probabilistic or LLM-driven. These are the checks that must
never be skipped, per the RECO architecture: the LLM proposes, rules dispose.
"""

MAX_ATTEMPTS = 2
UNECONOMICAL_AMOUNT_FLOOR = 5000
UNECONOMICAL_EV_FLOOR = 2000

TIER_WEIGHT = {"Low": 0.01, "Medium": 0.03, "High": 0.08}

ACTIONS = ["reminder_now", "wait_and_payment_link", "escalate", "stop"]

ACTION_LABELS = {
    "reminder_now": "Send Reminder Now",
    "wait_and_payment_link": "Wait 12h + Payment Link",
    "escalate": "Escalate to Human",
    "stop": "Stop Recovery",
}

INTERVENTION_COST = {
    "reminder_now": 200,
    "wait_and_payment_link": 500,
    "escalate": 5000,
    "stop": 0,
}


def p_recovery(case: dict, action: str) -> float:
    """Heuristic probability of recovery. NOT a trained model."""
    p = 0.5
    p += 0.15 * min(case["prior_payments_ontime"], 3)
    if case["prior_failures"] >= 2:
        p -= 0.25
    elif case["prior_failures"] == 1:
        p -= 0.1
    if case["dispute_flag"]:
        p -= 0.3

    if action == "wait_and_payment_link":
        p += 0.15 if case["communication_opened"] else 0.05
    elif action == "reminder_now":
        p += 0.05 if case["communication_opened"] else 0.0
    elif action == "escalate":
        p += 0.2
    elif action == "stop":
        return 0.0

    return max(0.0, min(0.95, p))


def relationship_risk(case: dict, action: str) -> float:
    tier_weight = TIER_WEIGHT.get(case["customer_value_tier"], 0.02)
    amount = case["invoice_amount"]
    if action == "escalate":
        return amount * tier_weight * 3
    if action == "wait_and_payment_link":
        return amount * tier_weight * 0.3
    if action == "reminder_now":
        return amount * tier_weight * 0.5
    return 0.0


def relationship_risk_label(case: dict, action: str) -> str:
    risk = relationship_risk(case, action)
    amount = case["invoice_amount"] or 1
    ratio = risk / amount
    if ratio >= 0.15:
        return "High"
    if ratio >= 0.05:
        return "Medium"
    return "Low"


def calc_options(case: dict) -> list[dict]:
    """Expected Recovery = P(recovery) x Amount - Relationship Risk - Intervention Cost."""
    options = []
    for action in ACTIONS:
        p = p_recovery(case, action)
        amount = case["invoice_amount"]
        risk = relationship_risk(case, action)
        cost = INTERVENTION_COST[action]
        ev = p * amount - risk - cost if action != "stop" else 0.0
        options.append({
            "action": action,
            "label": ACTION_LABELS[action],
            "p_recovery": round(p, 3),
            "expected_recovery": round(max(ev, 0.0), 2),
            "relationship_risk": relationship_risk_label(case, action),
            "intervention_cost": cost,
        })
    options.sort(key=lambda o: o["expected_recovery"], reverse=True)
    if options and options[0]["action"] != "stop":
        options[0]["recommended"] = True
    return options


def best_actionable_ev(options: list[dict]) -> float:
    non_stop = [o for o in options if o["action"] != "stop"]
    return max((o["expected_recovery"] for o in non_stop), default=0.0)


def guardrail_check(case: dict, proposed_action: str, options: list[dict]) -> dict:
    """Validates a proposed action against hard rules. Returns the final,
    guardrail-approved decision. This step can never be bypassed."""

    if case["already_paid_flag"]:
        return {
            "action": "stop",
            "final_status": "recovered",
            "should_escalate": False,
            "reason": "Payment already detected for this invoice. Duplicate-prevention rule halted the workflow.",
            "rule_triggered": "already_paid",
        }

    if case["dispute_flag"]:
        return {
            "action": "stop",
            "final_status": "escalated",
            "should_escalate": True,
            "reason": "Active dispute flagged on this invoice. Automatic recovery is blocked; routed to human review.",
            "rule_triggered": "active_dispute",
        }

    if case["attempts"] >= MAX_ATTEMPTS and proposed_action not in ("stop", "escalate"):
        return {
            "action": "escalate",
            "final_status": "escalated",
            "should_escalate": True,
            "reason": f"Maximum automated attempts ({MAX_ATTEMPTS}) reached. Escalating to a human instead of retrying blindly.",
            "rule_triggered": "max_attempts",
        }

    best_ev = best_actionable_ev(options)
    if case["invoice_amount"] < UNECONOMICAL_AMOUNT_FLOOR or best_ev < UNECONOMICAL_EV_FLOOR:
        return {
            "action": "stop",
            "final_status": "stopped",
            "should_escalate": False,
            "reason": "Expected recovery falls below the economic threshold once relationship risk and cost are subtracted. Not worth pursuing automatically.",
            "rule_triggered": "uneconomical",
        }

    status_map = {
        "reminder_now": "pending",
        "wait_and_payment_link": "pending",
        "escalate": "escalated",
        "stop": "stopped",
    }
    return {
        "action": proposed_action,
        "final_status": status_map.get(proposed_action, "recovering"),
        "should_escalate": proposed_action == "escalate",
        "reason": None,
        "rule_triggered": None,
    }
