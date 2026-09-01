"""Tools: the only things allowed to touch the outside world.
Real Razorpay Payment Link creation when credentials are configured,
otherwise a clearly-labelled simulated fallback. Communications are
always mocked (logged, never sent) per the MVP scope.
"""
import os
import random
import time
import uuid

import requests

RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET")
RAZORPAY_BASE_URL = "https://api.razorpay.com/v1"

LIVE_MODE = bool(RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET)


def create_payment_link(case: dict, force_fail: bool = False) -> dict:
    """Creates a Razorpay Payment Link for the case's outstanding amount.
    Returns {"success": bool, "mode": "live"|"simulated", "link": str|None, "error": str|None}.
    """
    if force_fail:
        return {
            "success": False,
            "mode": "live" if LIVE_MODE else "simulated",
            "link": None,
            "error": "Payment gateway timeout (injected failure)",
        }

    amount_paise = int(round(case["invoice_amount"] * 100))

    if LIVE_MODE:
        try:
            resp = requests.post(
                f"{RAZORPAY_BASE_URL}/payment_links",
                auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET),
                json={
                    "amount": amount_paise,
                    "currency": "INR",
                    "description": f"Overdue invoice {case['invoice_number']} - {case['customer_name']}",
                    "reference_id": f"{case['case_id']}-{uuid.uuid4().hex[:8]}",
                    "notes": {"case_id": case["case_id"]},
                },
                timeout=10,
            )
            if resp.status_code in (200, 201):
                data = resp.json()
                return {"success": True, "mode": "live", "link": data.get("short_url"), "error": None}
            return {"success": False, "mode": "live", "link": None, "error": f"Razorpay error {resp.status_code}: {resp.text[:200]}"}
        except requests.RequestException as exc:
            return {"success": False, "mode": "live", "link": None, "error": str(exc)}

    # Simulated mode: deterministic-ish success, never claims to be real.
    time.sleep(0.15)
    success = random.random() > 0.05
    if not success:
        return {"success": False, "mode": "simulated", "link": None, "error": "Simulated gateway error"}
    fake_id = uuid.uuid4().hex[:10]
    return {
        "success": True,
        "mode": "simulated",
        "link": f"https://rzp.io/l/{fake_id}",
        "error": None,
    }


def send_reminder(case: dict, channel: str = "email") -> dict:
    """Mocked communication. Always logged, never actually sent."""
    return {
        "success": True,
        "mode": "mocked",
        "channel": channel,
        "message": f"[MOCK] {channel} reminder logged for {case['customer_name']} regarding {case['invoice_number']}.",
    }


def escalate_to_human(case: dict, reason: str) -> dict:
    """Records a human-escalation task. No external system in the MVP."""
    return {
        "success": True,
        "mode": "logged",
        "message": f"[MOCK] Escalation task created for {case['customer_name']}: {reason}",
    }
