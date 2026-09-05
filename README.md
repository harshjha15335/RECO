# RECO — Revenue Recovery Control Tower

An AI-assisted control tower for B2B overdue-invoice recovery. RECO diagnoses
why a case is at risk, scores 3–4 possible recovery actions by expected value,
picks one, runs it through hard-coded guardrails, executes it, and logs every
step to an audit trail.

**Core idea:** don't chase every rupee — chase the right one, the right way,
and know when to stop.

---

## Architecture

```
Case → Context → Diagnose (LLM) → Calculate options (rules + LLM)
     → Select action (LLM) → Guardrail check (rules)
     → Execute (tool) → success / fail → fallback / retry / escalate
     → Audit log at every step
```

The LLM never calls a tool directly. It returns structured JSON, which
`rules.py` validates before `tools.py` executes anything. Probabilities in
the expected-value model are an explicit **heuristic**, not a trained model —
labeled as such throughout the app.

---

## Run it

### Backend (FastAPI + SQLite)

```bash
cd backend
python -m venv venv
./venv/Scripts/activate   # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
python seed.py             # seeds 20 demo cases
uvicorn main:app --reload --port 8000
```

### Frontend (React + TypeScript + Vite)

Built on the Precision Ledger design system — shadcn/ui primitives,
Tailwind v4, chartreuse-on-charcoal theme.

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**.

- App source: `frontend/client/src`
- Design system: `frontend/client/src/app-shell.css`
- Main screen: `frontend/client/src/pages/Dashboard.tsx`

### Optional: live Claude + Razorpay

The app runs fully without either of these — set them only if you want the
real integrations instead of built-in fallbacks:

| Variable | Effect if set | Behavior if unset |
|---|---|---|
| `ANTHROPIC_API_KEY` | Diagnosis/decision run through Claude | Falls back to deterministic heuristic — app never breaks mid-demo |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Creates real Razorpay Payment Links | Payment links are simulated |

---

## Demo flow

1. **Run Recovery** — analyzes all 20 seeded cases (diagnosis → EV options →
   decision → guardrail check) in one pass.
2. **Click Acme Technologies** (hero case) — a strong-history customer with a
   2-day delay. RECO recommends *Wait + Payment Link* over an immediate
   reminder or escalation, because the EV calculation weighs relationship
   risk, not just raw recovery probability.
3. **Execute Recovery Action** — creates a (simulated or real) Razorpay
   Payment Link.
4. **Inject Failure** on a `wait_and_payment_link` case — watch the audit
   trail show failure → fallback → recovery.
5. **Simulate Systemic Failure** — RECO detects a failure spike on one
   payment rail and suppresses automated recovery for every pending case on
   that rail.
6. **Click a disputed or already-paid case** (e.g. Gamma Logistics, Epsilon
   Pvt Ltd) — the hard-coded stopping rules fire. No LLM call decides these;
   a deterministic check does, and the audit trail shows which actor (rule
   engine vs. AI) made the call.

---

## What's real vs. simulated

| Component | Status |
|---|---|
| Diagnosis / decision reasoning | Real (Claude) if `ANTHROPIC_API_KEY` set, else deterministic fallback |
| Expected-value math | Real, transparent heuristic (see `rules.py`) — not ML |
| Payment Link creation | Real Razorpay API if credentials set, else simulated |
| Customer communication (reminders, etc.) | Simulated / logged only |
| Systemic incident detection | Deterministic threshold rule, seeded for demo |
