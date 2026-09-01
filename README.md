# RECO — Revenue Recovery Control Tower

An AI-assisted control tower for B2B overdue-invoice recovery. RECO diagnoses
why a case is at risk, scores 3-4 possible actions by expected value, picks
one, runs it through hard-coded guardrails, executes it, and logs every step.

## Run it

**Backend** (FastAPI + SQLite):

```bash
cd backend
python -m venv venv
./venv/Scripts/activate   # or source venv/bin/activate on macOS/Linux
pip install -r requirements.txt
python seed.py            # seeds 20 demo cases
uvicorn main:app --reload --port 8000
```

**Frontend** (React + TypeScript + Vite, built on the FinFlex/Precision-Ledger
design system — shadcn/ui primitives, Tailwind v4, chartreuse-on-charcoal
theme):

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The app source lives in `frontend/client/src`
(Vite's root is `frontend/client`); `frontend/client/src/app-shell.css` holds
the design system, `pages/Dashboard.tsx` is the single control-tower screen.

## Optional: real Claude + Razorpay

- Set `ANTHROPIC_API_KEY` to have diagnosis/decision go through Claude instead
  of the built-in heuristic fallback (the app works fully without it).
- Set `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` to create real Razorpay
  Payment Links instead of simulated ones.

## Demo flow

1. Click **Run Recovery** — analyzes all 20 seeded cases (diagnosis → EV
   options → decision → guardrail check) in one pass.
2. Click **Acme Technologies** (the hero case) — a strong-history customer
   with a 2-day delay. RECO recommends "Wait + Payment Link" over an
   immediate reminder or escalation because the EV math accounts for
   relationship risk, not just recovery probability.
3. Click **Execute Recovery Action** to actually create a (simulated or
   real) Razorpay Payment Link.
4. Pick a `wait_and_payment_link` case and click **Inject Failure** — watch
   the audit trail show failure → fallback → recovery.
5. Click **Simulate Systemic Failure** in the bottom bar — RECO detects a
   failure spike on a payment rail and suppresses automated recovery for
   every pending case on that rail.
6. Click a disputed or already-paid case (e.g. Gamma Logistics, Epsilon Pvt
   Ltd) to see the hard-coded stopping rules fire — no LLM call decides
   these, a deterministic check does.

## Architecture

```
Case → Context → Diagnose (LLM) → Calculate options (rules + LLM)
     → Select action (LLM) → Guardrail check (rules)
     → Execute (tool) → success / fail → fallback/retry/escalate
     → Audit log at every step
```

The LLM never calls a tool directly — it returns structured JSON that
`rules.py` validates before `tools.py` executes anything. Probabilities in
the expected-value model (`rules.py`) are an explicit heuristic, not a
trained model.
