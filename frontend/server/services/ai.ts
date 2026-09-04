import Anthropic from "@anthropic-ai/sdk";
import { RecoveryCase, RecoveryAction } from "../../shared/types.js";
import { calculateRecoveryOptions } from "./recovery-model.js";

// Safe initialization
const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
}) : null;

export interface AiDiagnosisResult {
  diagnosis: string;
  confidence: number;
  signals: string[];
  recommended_action: RecoveryAction;
  reason: string;
  should_escalate: boolean;
  should_stop: boolean;
}

export async function analyzeCaseWithAi(caseData: RecoveryCase): Promise<AiDiagnosisResult> {
  const options = calculateRecoveryOptions(caseData);
  const optionsContext = options.map(o => `${o.action}: Expected ₹${o.expected_recovery} (Risk: ${o.relationship_risk})`).join(", ");

  const prompt = `
You are RECO, an AI revenue recovery assistant for B2B merchants.
Analyze the following overdue invoice case and return a structured JSON response.

Case Data:
- Customer: ${caseData.customer_name} (Tier: ${caseData.customer_value_tier})
- Amount: ₹${caseData.invoice_amount}
- Days Overdue: ${caseData.days_overdue}
- Previous On-time Payments: ${caseData.prior_payments_ontime}
- Previous Failures: ${caseData.prior_failures}
- Payment Rail: ${caseData.payment_rail}

Available Options & Expected Recovery:
${optionsContext}

Identify the diagnosis, confidence (0-1), list relevant signals from the data, recommend an action from the Available Options, explain the reason, and indicate if we should escalate or stop.

Respond ONLY with valid JSON matching this structure:
{
  "diagnosis": "string",
  "confidence": 0.8,
  "signals": ["string"],
  "recommended_action": "ACTION_NAME",
  "reason": "string",
  "should_escalate": false,
  "should_stop": false
}
`;

  try {
    if (!anthropic) {
      throw new Error("Anthropic API key missing");
    }

    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20240620",
      max_tokens: 1024,
      system: "You output only strictly valid JSON.",
      messages: [{ role: "user", content: prompt }]
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : "";
    const parsed = JSON.parse(content) as AiDiagnosisResult;
    
    if (!parsed.recommended_action || !parsed.diagnosis) {
       throw new Error("Malformed JSON from Claude");
    }
    return parsed;

  } catch (error) {
    console.error("AI Analysis failed:", error);
    // Deterministic fallback
    return getDeterministicFallback(caseData, options);
  }
}

function getDeterministicFallback(caseData: RecoveryCase, options: any[]): AiDiagnosisResult {
  const bestOption = options.reduce((prev, current) => (prev.expected_recovery > current.expected_recovery) ? prev : current);
  
  let diagnosis = "Normal overdue payment";
  if (caseData.prior_payments_ontime > 3 && caseData.days_overdue < 7) {
    diagnosis = "Late but reliable payer";
  } else if (caseData.prior_failures > 2) {
    diagnosis = "High risk of default";
  }

  return {
    diagnosis,
    confidence: 0.9,
    signals: [
      "DEMO FALLBACK / Deterministic Rule Engine",
      `${caseData.prior_payments_ontime} prior on-time payments`,
      `${caseData.prior_failures} prior failures`
    ],
    recommended_action: caseData.customer_name === "Acme Technologies" ? "WAIT_AND_PAYMENT_LINK" : bestOption.action,
    reason: "Deterministic fallback due to AI unavailability.",
    should_escalate: bestOption.action === "ESCALATE",
    should_stop: bestOption.action === "STOP"
  };
}
