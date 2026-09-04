import { db, initDb } from "./setup.js";
import { nanoid } from "nanoid";

export function seedDatabase() {
  initDb();

  const count = db.prepare("SELECT COUNT(*) as count FROM customers").get() as { count: number };
  if (count.count > 0) {
    console.log("Database already seeded");
    return;
  }

  console.log("Seeding database with EXACT 20 canonical cases...");

  const insertCustomer = db.prepare(`
    INSERT INTO customers (id, name, value_tier, total_invoiced, total_recovered, average_payment_delay, prior_payments_ontime, prior_failures, relationship_risk)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertInvoice = db.prepare(`
    INSERT INTO invoices (id, customer_id, amount, due_date, status, payment_link, payment_rail, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertCase = db.prepare(`
    INSERT INTO recovery_cases (id, customer_id, invoice_id, customer_name, invoice_amount, days_overdue, customer_value_tier, prior_payments_ontime, prior_failures, dispute_flag, already_paid_flag, payment_rail, communication_opened, attempt_count, status, ai_diagnosis, ai_confidence, recommended_action, expected_recovery, recovered_amount, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertAttempt = db.prepare(`
    INSERT INTO recovery_attempts (id, case_id, action, attempt_number, status, expected_recovery, recovered_amount, failure_reason, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertAudit = db.prepare(`
    INSERT INTO audit_events (id, case_id, event_type, message, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  db.transaction(() => {
    const baseTime = new Date("2026-09-02T10:00:00Z");

    const generateCase = (data: {
      customerName: string;
      invoice: string;
      amount: number;
      daysOverdue: number;
      valueTier: string;
      priorOntime: number;
      priorFailures: number;
      dispute: boolean;
      lastComm: string;
      rail: string;
      aiDiagnosis: string;
      decision: string;
      expectedRecovery: number;
      status: string;
      recoveredAmount: number;
      attempts: number;
      confidence: number;
    }, index: number) => {
      const customerId = nanoid();

      // Normalize rails
      let normalizedRail = data.rail;
      if (normalizedRail === "UPI / Payment Link" || normalizedRail === "Payment Link") normalizedRail = "PAYMENT_LINK";
      if (normalizedRail === "Card") normalizedRail = "CARD";
      if (normalizedRail === "Bank Transfer") normalizedRail = "BANK_TRANSFER";

      const relationshipRisk = data.priorFailures > 2 ? "High" : (data.priorFailures > 0 ? "Medium" : "Low");

      // Insert customer with 0 totals initially, we will update them via SQL later
      insertCustomer.run(
        customerId, data.customerName, data.valueTier, 0, 0, 
        3, data.priorOntime, data.priorFailures, relationshipRisk
      );

      // History: Ontime payments
      for (let i = 0; i < data.priorOntime; i++) {
        // Deterministic explicitly typed historical amount based on loop index to avoid multipliers
        const histAmt = 50000 + (i * 10000);
        const pastDate = new Date(baseTime);
        pastDate.setDate(pastDate.getDate() - 30 * (i + 1));
        insertInvoice.run(nanoid(), customerId, histAmt, pastDate.toISOString(), "PAID", null, normalizedRail, pastDate.toISOString());
      }

      // History: Prior failures that were eventually recovered
      for (let i = 0; i < data.priorFailures; i++) {
        const histAmt = 60000 + (i * 15000);
        const pastDate = new Date(baseTime);
        pastDate.setDate(pastDate.getDate() - 45 * (i + 1));
        insertInvoice.run(nanoid(), customerId, histAmt, pastDate.toISOString(), "PAID", null, normalizedRail, pastDate.toISOString());
      }
      
      const invoiceId = data.invoice;
      const dueDate = new Date(baseTime);
      dueDate.setDate(dueDate.getDate() - data.daysOverdue);
      
      insertInvoice.run(
        invoiceId,
        customerId,
        data.amount,
        dueDate.toISOString(),
        data.status === "RECOVERED" ? "PAID" : "OVERDUE",
        null,
        normalizedRail,
        dueDate.toISOString()
      );

      const caseId = nanoid();
      const caseCreationDate = new Date(baseTime);
      caseCreationDate.setHours(caseCreationDate.getHours() - (index * 2)); 

      insertCase.run(
        caseId,
        customerId,
        invoiceId,
        data.customerName,
        data.amount,
        data.daysOverdue,
        data.valueTier,
        data.priorOntime,
        data.priorFailures,
        data.dispute ? 1 : 0,
        0, 
        normalizedRail,
        data.lastComm === "Opened" ? 1 : 0,
        data.attempts,
        data.status,
        data.aiDiagnosis,
        data.confidence,
        data.decision,
        data.expectedRecovery,
        data.recoveredAmount,
        caseCreationDate.toISOString(),
        baseTime.toISOString()
      );

      // Generate audit events
      const auditBaseTime = new Date(caseCreationDate);
      
      const addAudit = (eventType: string, message: string, offsetSeconds: number) => {
        auditBaseTime.setSeconds(auditBaseTime.getSeconds() + offsetSeconds);
        insertAudit.run(nanoid(), caseId, eventType, message, null, auditBaseTime.toISOString());
      };

      addAudit("CASE DETECTED", "System: Case triggered from overdue invoice", 0);
      addAudit("CONTEXT LOADED", "System: Customer and invoice history loaded", 1);
      
      if (data.status !== "STOPPED" || data.decision.includes("STOP")) {
         addAudit("AI DIAGNOSIS", `RECO AI: ${data.aiDiagnosis}`, 2);
         addAudit("OPTIONS CALCULATED", "Policy Engine: Candidate recovery options calculated", 1);
         addAudit("AI RECOMMENDATION", `RECO AI: ${data.decision}`, 1);
         addAudit("GUARDRAIL CHECK", "Policy Engine: PASSED deterministic guardrails", 1);
         addAudit("FINAL DECISION", `Policy Engine: Authorized ${data.decision}`, 1);
      }

      if (data.attempts > 0) {
        addAudit("EXECUTION START", `System: Triggering ${normalizedRail} action`, 1);
        
        insertAttempt.run(
          nanoid(),
          caseId,
          data.decision,
          1,
          data.status === "RECOVERED" ? "Success" : "Failed",
          data.expectedRecovery,
          data.recoveredAmount > 0 ? data.recoveredAmount : null,
          data.status === "RECOVERED" ? null : "Customer did not respond",
          auditBaseTime.toISOString()
        );

        if (data.status === "RECOVERED") {
          addAudit("CUSTOMER PAID", "Razorpay: Payment received via webhook", 1800); 
          addAudit("RECOVERY CONFIRMED", "System: Case marked RECOVERED", 1);
        } else if (data.attempts > 1) {
          addAudit("RETRY INITIATED", "System: Initiating retry sequence", 86400); 
        }
      }
    };

    const cases = [
      { customerName: "Acme Technologies", invoice: "INV-2026-1042", amount: 240000, daysOverdue: 2, valueTier: "Strategic", priorOntime: 5, priorFailures: 0, dispute: false, lastComm: "Opened", rail: "PAYMENT_LINK", aiDiagnosis: "Reliable customer with an unusual short-term delay", decision: "WAIT_AND_PAYMENT_LINK", expectedRecovery: 173000, status: "ACTIVE", recoveredAmount: 0, attempts: 0, confidence: 0.92 },
      { customerName: "Northstar Logistics", invoice: "INV-2026-1037", amount: 140000, daysOverdue: 6, valueTier: "Strategic", priorOntime: 4, priorFailures: 1, dispute: false, lastComm: "Opened", rail: "CARD", aiDiagnosis: "Customer has historically paid reliably but current payment rail shows elevated failure risk", decision: "RETRY_AND_PAYMENT_LINK", expectedRecovery: 102000, status: "RECOVERED", recoveredAmount: 140000, attempts: 1, confidence: 0.88 },
      { customerName: "Vertex Commerce", invoice: "INV-2026-1019", amount: 95000, daysOverdue: 4, valueTier: "Growth", priorOntime: 3, priorFailures: 1, dispute: false, lastComm: "Opened", rail: "UPI", aiDiagnosis: "Moderate delay with reasonable payment intent", decision: "REMINDER", expectedRecovery: 61000, status: "RECOVERED", recoveredAmount: 95000, attempts: 1, confidence: 0.85 },
      { customerName: "Meridian Labs", invoice: "INV-2026-1028", amount: 60000, daysOverdue: 3, valueTier: "Growth", priorOntime: 4, priorFailures: 0, dispute: false, lastComm: "Opened", rail: "CARD", aiDiagnosis: "Low-risk temporary delay", decision: "REMINDER", expectedRecovery: 39000, status: "RECOVERED", recoveredAmount: 60000, attempts: 1, confidence: 0.95 },
      { customerName: "BluePeak Retail", invoice: "INV-2026-0998", amount: 50000, daysOverdue: 11, valueTier: "Strategic", priorOntime: 6, priorFailures: 2, dispute: false, lastComm: "Ignored", rail: "CARD", aiDiagnosis: "Strong historical relationship but repeated payment failures require a different path", decision: "ESCALATE_TO_HUMAN", expectedRecovery: 31000, status: "HUMAN_REVIEW", recoveredAmount: 0, attempts: 2, confidence: 0.78 },
      { customerName: "Orbit Systems", invoice: "INV-2026-1051", amount: 80000, daysOverdue: 7, valueTier: "Standard", priorOntime: 2, priorFailures: 1, dispute: false, lastComm: "Opened", rail: "UPI", aiDiagnosis: "Customer appears engaged; low-cost reminder remains appropriate", decision: "REMINDER", expectedRecovery: 48000, status: "RECOVERED", recoveredAmount: 80000, attempts: 1, confidence: 0.86 },
      { customerName: "Greenfield Foods", invoice: "INV-2026-1047", amount: 120000, daysOverdue: 14, valueTier: "Strategic", priorOntime: 5, priorFailures: 2, dispute: false, lastComm: "Ignored", rail: "BANK_TRANSFER", aiDiagnosis: "High-value account with persistent non-response", decision: "ESCALATE_TO_HUMAN", expectedRecovery: 73000, status: "RECOVERED", recoveredAmount: 120000, attempts: 2, confidence: 0.81 },
      { customerName: "PixelWorks Studio", invoice: "INV-2026-1058", amount: 45000, daysOverdue: 2, valueTier: "Standard", priorOntime: 3, priorFailures: 0, dispute: false, lastComm: "Opened", rail: "UPI", aiDiagnosis: "Small invoice with high probability of immediate payment", decision: "REMINDER", expectedRecovery: 30000, status: "RECOVERED", recoveredAmount: 45000, attempts: 1, confidence: 0.96 },
      { customerName: "Summit Infrastructure", invoice: "INV-2026-0987", amount: 130000, daysOverdue: 19, valueTier: "Strategic", priorOntime: 7, priorFailures: 1, dispute: false, lastComm: "Ignored", rail: "BANK_TRANSFER", aiDiagnosis: "Long overdue strategic account; human intervention now has higher expected value", decision: "HUMAN_REVIEW", expectedRecovery: 82000, status: "RECOVERED", recoveredAmount: 130000, attempts: 2, confidence: 0.89 },
      { customerName: "Nova Health Systems", invoice: "INV-2026-1049", amount: 70000, daysOverdue: 5, valueTier: "Growth", priorOntime: 2, priorFailures: 2, dispute: false, lastComm: "Opened", rail: "CARD", aiDiagnosis: "Repeated rail-specific failures indicate alternate payment path", decision: "ALTERNATE_PAYMENT_PATH", expectedRecovery: 43000, status: "RECOVERED", recoveredAmount: 70000, attempts: 2, confidence: 0.84 },
      { customerName: "Atlas Manufacturing", invoice: "INV-2026-1061", amount: 35000, daysOverdue: 21, valueTier: "Low", priorOntime: 1, priorFailures: 3, dispute: false, lastComm: "Ignored", rail: "CARD", aiDiagnosis: "Expected recovery is below the cost and relationship risk of further automated intervention", decision: "STOP", expectedRecovery: 8000, status: "STOPPED", recoveredAmount: 0, attempts: 2, confidence: 0.91 },
      { customerName: "Cedar Consulting", invoice: "INV-2026-1032", amount: 60000, daysOverdue: 8, valueTier: "Growth", priorOntime: 4, priorFailures: 0, dispute: true, lastComm: "Opened", rail: "UPI", aiDiagnosis: "Active dispute blocks automated recovery", decision: "STOP", expectedRecovery: 0, status: "HUMAN_REVIEW", recoveredAmount: 0, attempts: 0, confidence: 0.98 },
      { customerName: "RapidCart", invoice: "INV-2026-1055", amount: 55000, daysOverdue: 3, valueTier: "Standard", priorOntime: 3, priorFailures: 0, dispute: false, lastComm: "Opened", rail: "UPI", aiDiagnosis: "High engagement and low invoice risk", decision: "REMINDER", expectedRecovery: 37000, status: "RECOVERED", recoveredAmount: 50000, attempts: 1, confidence: 0.94 },
      { customerName: "IronBridge Energy", invoice: "INV-2026-1004", amount: 65000, daysOverdue: 9, valueTier: "Strategic", priorOntime: 5, priorFailures: 1, dispute: false, lastComm: "Ignored", rail: "BANK_TRANSFER", aiDiagnosis: "Meaningful overdue balance with diminishing response to automated communication", decision: "HUMAN_REVIEW", expectedRecovery: 39000, status: "HUMAN_REVIEW", recoveredAmount: 0, attempts: 2, confidence: 0.82 },
      { customerName: "CloudHarbor", invoice: "INV-2026-1014", amount: 110000, daysOverdue: 6, valueTier: "Growth", priorOntime: 5, priorFailures: 0, dispute: false, lastComm: "Opened", rail: "PAYMENT_LINK", aiDiagnosis: "Reliable customer with strong payment intent", decision: "WAIT_AND_PAYMENT_LINK", expectedRecovery: 78000, status: "RECOVERED", recoveredAmount: 110000, attempts: 1, confidence: 0.93 },
      { customerName: "Bloom Hospitality", invoice: "INV-2026-1064", amount: 40000, daysOverdue: 13, valueTier: "Low", priorOntime: 1, priorFailures: 2, dispute: false, lastComm: "Ignored", rail: "CARD", aiDiagnosis: "Low expected recovery relative to intervention cost", decision: "STOP", expectedRecovery: 6000, status: "STOPPED", recoveredAmount: 0, attempts: 2, confidence: 0.87 },
      { customerName: "DataForge Analytics", invoice: "INV-2026-1040", amount: 240000, daysOverdue: 4, valueTier: "Growth", priorOntime: 4, priorFailures: 0, dispute: false, lastComm: "Opened", rail: "UPI", aiDiagnosis: "Strong historical payment behavior and low delay", decision: "REMINDER", expectedRecovery: 173000, status: "RECOVERED", recoveredAmount: 240000, attempts: 1, confidence: 0.90 },
      { customerName: "Silverline Media", invoice: "INV-2026-1021", amount: 95000, daysOverdue: 10, valueTier: "Standard", priorOntime: 2, priorFailures: 1, dispute: false, lastComm: "Ignored", rail: "CARD", aiDiagnosis: "Repeated non-response makes another automated reminder low value", decision: "HUMAN_REVIEW", expectedRecovery: 51000, status: "HUMAN_REVIEW", recoveredAmount: 0, attempts: 2, confidence: 0.79 },
      { customerName: "FinCore Services", invoice: "INV-2026-1050", amount: 65000, daysOverdue: 1, valueTier: "Standard", priorOntime: 5, priorFailures: 0, dispute: false, lastComm: "Not contacted", rail: "PAYMENT_LINK", aiDiagnosis: "Very recent overdue event; intervention now would be premature", decision: "WAIT", expectedRecovery: 42000, status: "ACTIVE", recoveredAmount: 0, attempts: 0, confidence: 0.97 },
      { customerName: "Westbridge Enterprises", invoice: "INV-2026-1039", amount: 65000, daysOverdue: 16, valueTier: "Standard", priorOntime: 2, priorFailures: 2, dispute: false, lastComm: "Opened", rail: "CARD", aiDiagnosis: "Repeated rail failures justify an alternate payment method", decision: "ALTERNATE_PAYMENT_PATH", expectedRecovery: 36000, status: "STOPPED", recoveredAmount: 0, attempts: 2, confidence: 0.83 }
    ];

    cases.forEach((c, index) => generateCase(c, index));

    // After all invoices are inserted, run the UPDATE to strictly derive total_invoiced and total_recovered from actual invoice records
    db.prepare(`
      UPDATE customers 
      SET 
        total_invoiced = (SELECT COALESCE(SUM(amount), 0) FROM invoices WHERE customer_id = customers.id),
        total_recovered = (SELECT COALESCE(SUM(amount), 0) FROM invoices WHERE customer_id = customers.id AND status = 'PAID')
    `).run();

  })();

  console.log("Database seeded successfully with exact mock dataset.");
}
