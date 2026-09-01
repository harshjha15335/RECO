"""Agent brain: diagnosis + action selection.

Uses the Claude API when ANTHROPIC_API_KEY is configured. If the key is
missing, the SDK isn't installed, the call fails, or the response isn't
valid JSON, this falls back to deterministic heuristic logic so the demo
never breaks. The LLM NEVER calls a tool directly - it only returns
structured JSON that rules.py validates before any tool runs.
"""
import json
import os

import rules

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")

_client = None
if ANTHROPIC_API_KEY:
    try:
        import anthropic
        _client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    except ImportError:
        _client = None

MODEL = "claude-sonnet-5"


def _fallback_diagnosis(case: dict) -> dict:
    signals = []
    if case["prior_payments_ontime"] >= 3:
        signals.append(f"{case['prior_payments_ontime']} previous invoices paid on time")
    if case["prior_failures"] > 0:
        signals.append(f"{case['prior_failures']} prior payment failure(s) on this rail")
    else:
        signals.append("No recent payment failure")
    signals.append("Active dispute flagged" if case["dispute_flag"] else "No active dispute")
    signals.append("Previous reminder opened" if case["communication_opened"] else "No engagement with previous reminders")
    signals.append(f"{case['customer_value_tier']}-value customer")
    signals.append(f"{case['days_overdue']} days overdue")

    if case["dispute_flag"]:
        cause = "Active dispute is blocking voluntary payment"
    elif case["already_paid_flag"]:
        cause = "Payment appears to already be settled"
    elif case["prior_failures"] >= 2:
        cause = "Repeated payment failures on the same rail suggest a technical or rail-specific block"
    elif case["prior_payments_ontime"] >= 3 and case["days_overdue"] <= 5:
        cause = "Late but historically reliable payer"
    elif not case["communication_opened"] and case["days_overdue"] > 10:
        cause = "Customer is disengaged; reminders are not landing"
    else:
        cause = "Standard overdue invoice with no unusual risk signals"

    confidence = 0.87 if case["prior_payments_ontime"] >= 3 else 0.65
    return {
        "diagnosis": cause,
        "confidence": confidence,
        "signals": signals,
        "source": "heuristic_fallback",
    }


def diagnose(case: dict) -> dict:
    if _client is not None:
        try:
            prompt = (
                "You are RECO, a B2B revenue-recovery diagnosis engine. Given this overdue "
                "invoice case, diagnose the likely root cause of non-payment in one short "
                "sentence, list 4-6 short factual signals, and give a confidence 0-1.\n\n"
                f"Case: {json.dumps(case, default=str)}\n\n"
                'Respond ONLY with JSON: {"diagnosis": str, "confidence": float, "signals": [str, ...]}'
            )
            resp = _client.messages.create(
                model=MODEL,
                max_tokens=400,
                messages=[{"role": "user", "content": prompt}],
            )
            text = resp.content[0].text
            data = json.loads(text[text.index("{"): text.rindex("}") + 1])
            data["source"] = "llm"
            return data
        except Exception:
            pass
    return _fallback_diagnosis(case)


def _fallback_select(case: dict, options: list[dict]) -> dict:
    top = options[0]
    reasons = {
        "wait_and_payment_link": (
            f"{case['customer_name']} has a strong payment history with only a mild delay. "
            "Escalating now would carry real relationship cost for little extra expected recovery. "
            "Waiting briefly and sending a payment link captures the highest expected value within guardrails."
        ),
        "reminder_now": (
            f"{case['customer_name']}'s profile shows low risk and a short delay - a simple reminder "
            "is the cheapest action with the best expected-value ratio."
        ),
        "escalate": (
            f"Automated channels have not moved {case['customer_name']}. Expected recovery is highest "
            "with a human touch despite the added cost."
        ),
        "stop": (
            f"For {case['case_id']}, no automated action clears the economic or relationship-risk bar."
        ),
    }
    return {
        "recommended_action": top["action"],
        "reason": reasons.get(top["action"], "Selected the option with the highest expected value."),
        "source": "heuristic_fallback",
    }


def select_action(case: dict, diagnosis: dict, options: list[dict]) -> dict:
    if _client is not None:
        try:
            prompt = (
                "You are RECO's decision layer. Given this case's diagnosis and the "
                "expected-value-scored options below, pick the single best action and explain "
                "why in 2-3 plain-English sentences a business user would understand. Do not "
                "show step-by-step reasoning, just the conclusion.\n\n"
                f"Case: {json.dumps(case, default=str)}\n"
                f"Diagnosis: {json.dumps(diagnosis, default=str)}\n"
                f"Options: {json.dumps(options, default=str)}\n\n"
                'Respond ONLY with JSON: {"recommended_action": str, "reason": str}. '
                f"recommended_action must be one of {rules.ACTIONS}."
            )
            resp = _client.messages.create(
                model=MODEL,
                max_tokens=300,
                messages=[{"role": "user", "content": prompt}],
            )
            text = resp.content[0].text
            data = json.loads(text[text.index("{"): text.rindex("}") + 1])
            if data.get("recommended_action") not in rules.ACTIONS:
                raise ValueError("invalid action")
            data["source"] = "llm"
            return data
        except Exception:
            pass
    return _fallback_select(case, options)
