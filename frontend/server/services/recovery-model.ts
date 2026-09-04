import { RecoveryCase, RecoveryAction } from "../../shared/types.js";

export function calculateRecoveryOptions(caseData: RecoveryCase) {
  // Base probability of recovery without any action
  let baseProbability = 0.5;
  
  // Adjust based on ontime payments
  if (caseData.prior_payments_ontime > 0) {
    baseProbability += Math.min(0.2, caseData.prior_payments_ontime * 0.05);
  }
  
  // Adjust based on prior failures
  if (caseData.prior_failures > 0) {
    baseProbability -= Math.min(0.3, caseData.prior_failures * 0.1);
  }

  // Adjust for disputes
  if (caseData.dispute_flag) {
    baseProbability -= 0.4;
  }

  // Clamp probability between 5% and 95%
  baseProbability = Math.max(0.05, Math.min(0.95, baseProbability));

  // Options evaluation
  const options = [
    {
      action: "STOP" as RecoveryAction,
      expected_recovery: 0,
      relationship_risk: "Low"
    },
    {
      action: "WAIT_AND_PAYMENT_LINK" as RecoveryAction,
      expected_recovery: calculateExpectedRecovery(caseData.invoice_amount, baseProbability + 0.1, 0, caseData.customer_value_tier),
      relationship_risk: "Low"
    },
    {
      action: "REMINDER" as RecoveryAction,
      expected_recovery: calculateExpectedRecovery(caseData.invoice_amount, baseProbability + 0.15, 0.1, caseData.customer_value_tier),
      relationship_risk: "Low"
    },
    {
      action: "ESCALATE" as RecoveryAction,
      expected_recovery: calculateExpectedRecovery(caseData.invoice_amount, baseProbability + 0.3, 0.4, caseData.customer_value_tier),
      relationship_risk: "High"
    }
  ];

  return options;
}

function calculateExpectedRecovery(amount: number, probability: number, relationshipRiskPenalty: number, tier: string) {
  let riskCost = 0;
  if (tier === "Strategic") riskCost = amount * 0.3;
  if (tier === "High") riskCost = amount * 0.15;
  if (tier === "Medium") riskCost = amount * 0.05;

  let expected = (amount * Math.max(0.05, Math.min(0.95, probability))) - (riskCost * relationshipRiskPenalty);
  return Math.max(0, Math.round(expected));
}
