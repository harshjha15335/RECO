import { db } from "../db/setup.js";
import { RecoveryCase, AuditEvent, RecoveryAction, SystemIncident } from "../../shared/types.js";
import { nanoid } from "nanoid";
import { analyzeCaseWithAi } from "./ai.js";
import { evaluateGuardrails, validateAiDecision } from "./guardrails.js";
import { createPaymentLink } from "./razorpay.js";
import { calculateRecoveryOptions } from "./recovery-model.js";

export function getCase(id: string): RecoveryCase | null {
  const row = db.prepare("SELECT * FROM recovery_cases WHERE id = ?").get(id);
  if (!row) return null;
  return {
    ...row as any,
    dispute_flag: Boolean((row as any).dispute_flag),
    already_paid_flag: Boolean((row as any).already_paid_flag),
    communication_opened: Boolean((row as any).communication_opened)
  } as RecoveryCase;
}

export function logAudit(caseId: string, eventType: string, message: string, metadata?: string) {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO audit_events (id, case_id, event_type, message, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(nanoid(), caseId, eventType, message, metadata, now);
}

export async function analyzeCase(caseId: string) {
  const caseData = getCase(caseId);
  if (!caseData) throw new Error("Case not found");

  logAudit(caseId, "CONTEXT LOADED", "System: Case and customer context loaded for analysis");

  // Check Invoice Status for ALREADY PAID
  const invoice = db.prepare("SELECT status FROM invoices WHERE id = ?").get(caseData.invoice_id) as any;
  if (invoice && invoice.status === 'PAID') {
    db.prepare("UPDATE recovery_cases SET status = 'RECOVERED', recovered_amount = invoice_amount WHERE id = ?").run(caseId);
    logAudit(caseId, "ALREADY PAID DETECTED", "System: Invoice is already paid. Halting workflow.");
    return { case: getCase(caseId), options: [] };
  }

  // Pre-flight guardrails
  const preGuard = evaluateGuardrails(caseData);
  if (preGuard.blocked) {
    db.prepare("UPDATE recovery_cases SET status = 'STOPPED' WHERE id = ?").run(caseId);
    logAudit(caseId, "GUARDRAIL CHECK", `Policy Engine: Pre-flight blocked: ${preGuard.reason}`, JSON.stringify({ forcedAction: preGuard.forcedAction }));
    return { case: getCase(caseId), options: [] };
  }

  // Calculate options deterministically
  const options = calculateRecoveryOptions(caseData);
  logAudit(caseId, "OPTIONS CALCULATED", "Policy Engine: Candidate recovery options calculated");

  // AI Diagnosis
  const aiResult = await analyzeCaseWithAi(caseData);
  
  // Guardrail Validation
  const validation = validateAiDecision(caseData, aiResult.recommended_action);
  const finalAction = validation.action;

  let finalExpected = 0;
  const matchOption = options.find(o => o.action === finalAction);
  if (matchOption) finalExpected = matchOption.expected_recovery;

  db.prepare(`
    UPDATE recovery_cases 
    SET ai_diagnosis = ?, ai_confidence = ?, recommended_action = ?, expected_recovery = ?, updated_at = ?
    WHERE id = ?
  `).run(aiResult.diagnosis, aiResult.confidence, finalAction, finalExpected, new Date().toISOString(), caseId);

  logAudit(caseId, "AI DIAGNOSIS", `${aiResult.signals.includes("DEMO FALLBACK / Deterministic Rule Engine") ? "System Fallback" : "RECO AI"}: ${aiResult.diagnosis}`, JSON.stringify({ confidence: aiResult.confidence }));
  logAudit(caseId, "AI RECOMMENDATION", `RECO AI: Recommended ${aiResult.recommended_action}`);

  if (!validation.valid) {
    logAudit(caseId, "POLICY OVERRIDE", `Policy Engine: ${validation.overrideReason}`, JSON.stringify({ original: aiResult.recommended_action, new: finalAction }));
  }
  
  logAudit(caseId, "FINAL DECISION", `Policy Engine: Authorized ${finalAction}`);

  return { case: getCase(caseId), options };
}

export async function processCase(caseId: string, forceFailure: boolean = false) {
  const caseData = getCase(caseId);
  if (!caseData) throw new Error("Case not found");

  // Re-check invoice just in case
  const invoice = db.prepare("SELECT status FROM invoices WHERE id = ?").get(caseData.invoice_id) as any;
  if (invoice && invoice.status === 'PAID') {
    db.prepare("UPDATE recovery_cases SET status = 'RECOVERED', recovered_amount = invoice_amount WHERE id = ?").run(caseId);
    logAudit(caseId, "CUSTOMER PAID", "Customer paid before execution. Workflow halted.");
    return;
  }

  // Check systemic incident
  const activeIncident = db.prepare("SELECT * FROM system_incidents WHERE status = 'Active' AND payment_rail = ?").get(caseData.payment_rail) as SystemIncident;
  if (activeIncident) {
    db.prepare("UPDATE recovery_cases SET status = 'STOPPED' WHERE id = ?").run(caseId);
    logAudit(caseId, "SYSTEMIC INCIDENT", "Automated recovery suppressed due to active systemic incident on " + caseData.payment_rail);
    return;
  }

  const finalAction = caseData.recommended_action || "HUMAN_REVIEW";
  const expectedRecovery = caseData.expected_recovery || 0;

  const attemptId = nanoid();
  const attemptNum = caseData.attempt_count + 1;
  
  db.prepare(`
    INSERT INTO recovery_attempts (id, case_id, action, attempt_number, status, expected_recovery, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(attemptId, caseId, finalAction, attemptNum, "Pending", expectedRecovery, new Date().toISOString());

  db.prepare("UPDATE recovery_cases SET attempt_count = attempt_count + 1 WHERE id = ?").run(caseId);
  logAudit(caseId, "EXECUTION START", `System: Executing action: ${finalAction}`);

  let success = false;
  if (finalAction === "WAIT_AND_PAYMENT_LINK") {
    const linkResult = forceFailure ? { success: false, url: "", isDemo: true } : await createPaymentLink(caseData.invoice_amount, caseData.customer_name, caseData.invoice_id);
    
    if (linkResult.success) {
      logAudit(caseId, "PAYMENT LINK CREATED", `Payment link created${linkResult.isDemo ? " (DEMO MODE)" : ""}`);
      success = true;
    } else {
      logAudit(caseId, "EXECUTION FAILED", "Failed to create payment link");
      success = false;
    }
  } else if (finalAction === "REMINDER" || finalAction === "ESCALATE") {
    logAudit(caseId, "COMMUNICATION SENT", `Simulated ${finalAction.toLowerCase()} sent`);
    success = true;
  } else if (finalAction === "HUMAN_REVIEW") {
    db.prepare("UPDATE recovery_cases SET status = 'HUMAN_REVIEW' WHERE id = ?").run(caseId);
    logAudit(caseId, "HUMAN REVIEW REQUIRED", "Case routed to human review queue");
    success = true;
  } else if (finalAction === "STOP") {
    db.prepare("UPDATE recovery_cases SET status = 'STOPPED' WHERE id = ?").run(caseId);
    logAudit(caseId, "STOP REQUIRED", "Case routed to stopped queue");
    success = true;
  } else {
    // Other actions
    success = !forceFailure;
  }

  if (success) {
    db.prepare("UPDATE recovery_attempts SET status = 'Success' WHERE id = ?").run(attemptId);
    // DO NOT mark case as RECOVERED just because a payment link was successfully sent.
    // Case remains ACTIVE until payment is actually received.
    // Do not allow generic success block to overwrite STOPPED or HUMAN_REVIEW.
    if (finalAction !== "STOP" && finalAction !== "HUMAN_REVIEW") {
      db.prepare("UPDATE recovery_cases SET status = 'ACTIVE' WHERE id = ?").run(caseId);
    }
  } else {
    db.prepare("UPDATE recovery_attempts SET status = 'Failed', failure_reason = 'Execution failed' WHERE id = ?").run(attemptId);
    
    if (attemptNum < 2) {
      logAudit(caseId, "RETRY INITIATED", "Attempting retry for failed action");
      
      // Attempt 2
      const retryAttemptId = nanoid();
      db.prepare(`
        INSERT INTO recovery_attempts (id, case_id, action, attempt_number, status, expected_recovery, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(retryAttemptId, caseId, finalAction, attemptNum + 1, "Failed", expectedRecovery, new Date().toISOString());
      db.prepare("UPDATE recovery_cases SET attempt_count = attempt_count + 1 WHERE id = ?").run(caseId);

      logAudit(caseId, "RETRY FAILED", "Retry failed. Falling back to human review.");
      db.prepare("UPDATE recovery_cases SET status = 'HUMAN_REVIEW' WHERE id = ?").run(caseId);
    } else {
      logAudit(caseId, "EXECUTION FAILED", "Max attempts reached. Falling back to human review.");
      db.prepare("UPDATE recovery_cases SET status = 'HUMAN_REVIEW' WHERE id = ?").run(caseId);
    }
  }
}

export function triggerSystemicIncident(rail: string, failureRate: number, affectedCount: number) {
  const incidentId = nanoid();
  db.prepare(`
    INSERT INTO system_incidents (id, type, payment_rail, failure_rate, affected_cases, status, started_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(incidentId, "PAYMENT_DEGRADATION", rail, failureRate, affectedCount, "Active", new Date().toISOString());
  return incidentId;
}

export function clearSystemicIncident() {
  db.prepare("UPDATE system_incidents SET status = 'Resolved' WHERE status = 'Active'").run();
}

export function markCustomerPaid(caseId: string) {
  db.transaction(() => {
    const caseData = getCase(caseId);
    if (!caseData) return;

    db.prepare("UPDATE invoices SET status = 'PAID' WHERE id = ?").run(caseData.invoice_id);
    db.prepare("UPDATE recovery_cases SET status = 'RECOVERED', recovered_amount = invoice_amount, updated_at = ? WHERE id = ?").run(new Date().toISOString(), caseId);
    
    // Also mark active attempts as Success if they exist
    db.prepare("UPDATE recovery_attempts SET status = 'Success', recovered_amount = ? WHERE case_id = ? AND status = 'Pending'").run(caseData.invoice_amount, caseId);

    logAudit(caseId, "CUSTOMER PAID", "Customer paid. Workflow halted.");
    logAudit(caseId, "RECOVERY CONFIRMED", "Case marked as RECOVERED");
  })();
}
