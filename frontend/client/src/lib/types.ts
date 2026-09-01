export type CaseStatus = "pending" | "recovering" | "recovered" | "escalated" | "stopped" | "failed";

export type ActionKey = "reminder_now" | "wait_and_payment_link" | "escalate" | "stop";

export interface RecoveryOption {
  action: ActionKey;
  label: string;
  p_recovery: number;
  expected_recovery: number;
  relationship_risk: "Low" | "Medium" | "High";
  intervention_cost: number;
  recommended?: boolean;
}

export interface Diagnosis {
  diagnosis: string;
  confidence: number;
  signals: string[];
  source: "llm" | "heuristic_fallback";
}

export interface Decision {
  recommended_action: ActionKey;
  reason: string | null;
  source: "llm" | "heuristic_fallback";
  action: ActionKey;
  final_status: CaseStatus;
  should_escalate: boolean;
  rule_triggered: string | null;
}

export interface RecoveryCase {
  case_id: string;
  customer_name: string;
  customer_value_tier: "Low" | "Medium" | "High";
  invoice_number: string;
  invoice_amount: number;
  days_overdue: number;
  prior_payments_ontime: number;
  prior_failures: number;
  dispute_flag: boolean;
  already_paid_flag: boolean;
  payment_rail: string;
  communication_opened: boolean;
  expected_pattern: string | null;
  status: CaseStatus;
  attempts: number;
  diagnosis: Diagnosis | null;
  options: RecoveryOption[] | null;
  decision: Decision | null;
  chosen_action: ActionKey | null;
  expected_recovery: number | null;
  recovered_amount: number | null;
  created_at: string;
}

export interface AuditEvent {
  id: number;
  case_id: string;
  ts: string;
  event: string;
  detail: { message?: string; [key: string]: unknown } | null;
}

export interface Metrics {
  total_revenue_at_risk: number;
  total_recovered: number;
  recovery_rate: number;
  active_cases: number;
  escalated_cases: number;
  stopped_cases: number;
  recovered_cases: number;
  failed_actions: number;
  total_cases: number;
}

export interface SystemicIncident {
  active: boolean;
  rail?: string;
  failure_rate?: number;
  affected_cases?: number;
  detected_at?: string;
}

export interface ExecuteResult {
  success: boolean;
  mode: string;
  link?: string | null;
  error?: string | null;
  message?: string;
  channel?: string;
}
