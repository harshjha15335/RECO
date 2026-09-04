import express from "express";
import { db } from "./db/setup.js";
import { processCase, triggerSystemicIncident, markCustomerPaid, analyzeCase, clearSystemicIncident } from "./services/recovery-engine.js";

export const router = express.Router();

// GET /api/cases
router.get("/cases", (req, res) => {
  const cases = db.prepare("SELECT * FROM recovery_cases ORDER BY updated_at DESC").all();
  const formatted = cases.map((c: any) => ({
    ...c,
    dispute_flag: Boolean(c.dispute_flag),
    already_paid_flag: Boolean(c.already_paid_flag),
    communication_opened: Boolean(c.communication_opened)
  }));
  res.json(formatted);
});

// GET /api/cases/:id
router.get("/cases/:id", (req, res) => {
  const caseData = db.prepare("SELECT * FROM recovery_cases WHERE id = ?").get(req.params.id);
  if (!caseData) return res.status(404).json({ error: "Not found" });
  
  const formatted = {
    ...caseData as any,
    dispute_flag: Boolean((caseData as any).dispute_flag),
    already_paid_flag: Boolean((caseData as any).already_paid_flag),
    communication_opened: Boolean((caseData as any).communication_opened)
  };
  res.json(formatted);
});

// POST /api/cases/:id/analyze
router.post("/cases/:id/analyze", async (req, res) => {
  try {
    const result = await analyzeCase(req.params.id);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/cases/:id/execute
router.post("/cases/:id/execute", async (req, res) => {
  try {
    await processCase(req.params.id, false);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/cases/:id/inject-failure
router.post("/cases/:id/inject-failure", async (req, res) => {
  try {
    await processCase(req.params.id, true);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/cases/:id/audit
router.get("/cases/:id/audit", (req, res) => {
  const events = db.prepare("SELECT * FROM audit_events WHERE case_id = ? ORDER BY created_at ASC").all(req.params.id);
  res.json(events);
});

// GET /api/metrics
router.get("/metrics", (req, res) => {
  const allCases = db.prepare("SELECT status, invoice_amount, recovered_amount FROM recovery_cases").all() as any[];
  
  let revenueAtRisk = 0;
  let revenueRecovered = 0;
  let activeCases = 0;
  let humanReview = 0;
  let stopped = 0;
  let recoveredCases = 0;

  for (const c of allCases) {
    revenueAtRisk += c.invoice_amount;
    revenueRecovered += (c.recovered_amount || 0);

    if (c.status === "ACTIVE") activeCases++;
    if (c.status === "HUMAN_REVIEW") humanReview++;
    if (c.status === "STOPPED") stopped++;
    if (c.status === "RECOVERED") recoveredCases++;
  }

  const recoveryRate = (revenueAtRisk > 0) 
    ? (revenueRecovered / revenueAtRisk) * 100 
    : 0;

  res.json({
    revenueAtRisk,
    revenueRecovered,
    recoveryRate,
    activeCases,
    humanReview,
    stoppedCases: stopped,
    recoveredCases,
    totalCases: allCases.length
  });
});

// GET /api/customers
router.get("/customers", (req, res) => {
  const customers = db.prepare(`
    SELECT c.*, 
      (SELECT COUNT(*) FROM recovery_cases rc WHERE rc.customer_id = c.id AND rc.status != 'RECOVERED') as open_invoices,
      (SELECT SUM(invoice_amount) FROM recovery_cases rc WHERE rc.customer_id = c.id AND rc.status != 'RECOVERED') as total_outstanding,
      (SELECT status FROM recovery_cases rc WHERE rc.customer_id = c.id ORDER BY updated_at DESC LIMIT 1) as recovery_state
    FROM customers c
  `).all();
  res.json(customers);
});

// GET /api/recoveries
router.get("/recoveries", (req, res) => {
  const recoveries = db.prepare(`
    SELECT rc.*, ra.expected_recovery as ai_forecast, ra.recovered_amount as attempt_recovery, ra.created_at as recovery_date, ra.action as method, rc.attempt_count
    FROM recovery_cases rc
    LEFT JOIN recovery_attempts ra ON rc.id = ra.case_id AND ra.status = 'Success'
    WHERE rc.status = 'RECOVERED'
    ORDER BY rc.updated_at DESC
  `).all();
  res.json(recoveries);
});

// GET /api/audit
router.get("/audit", (req, res) => {
  const events = db.prepare(`
    SELECT ae.*, rc.customer_name
    FROM audit_events ae
    JOIN recovery_cases rc ON ae.case_id = rc.id
    ORDER BY ae.created_at DESC
    LIMIT 100
  `).all();
  res.json(events);
});

// GET /api/system-health
router.get("/system-health", (req, res) => {
  const incidents = db.prepare("SELECT * FROM system_incidents WHERE status = 'Active'").all();
  const execStats = db.prepare("SELECT COUNT(*) as count FROM recovery_attempts").get() as {count: number};
  const failedExecs = db.prepare("SELECT COUNT(*) as count FROM recovery_attempts WHERE status = 'Failed'").get() as {count: number};
  
  res.json({
    incidents,
    isHealthy: incidents.length === 0,
    stats: {
      totalExecutions: execStats.count,
      failedExecutions: failedExecs.count,
      successExecutions: execStats.count - failedExecs.count,
      avgLatency: "124ms" // Static for demo aesthetics
    }
  });
});

// POST /api/demo/systemic-incident
router.post("/demo/systemic-incident", (req, res) => {
  const id = triggerSystemicIncident("CARD", 0.31, 7);
  res.json({ success: true, incidentId: id });
});

// POST /api/demo/clear-incident
router.post("/demo/clear-incident", (req, res) => {
  clearSystemicIncident();
  res.json({ success: true });
});

// POST /api/demo/customer-paid
router.post("/demo/customer-paid", (req, res) => {
  const { caseId } = req.body;
  if (!caseId) return res.status(400).json({ error: "caseId required" });
  markCustomerPaid(caseId);
  res.json({ success: true });
});
