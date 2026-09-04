export type CustomerValueTier = "Strategic" | "High" | "Medium" | "Low";

export interface Customer {
  id: string;
  name: string;
  value_tier: CustomerValueTier;
  total_invoiced: number;
  total_recovered: number;
  average_payment_delay: number;
  prior_payments_ontime: number;
  prior_failures: number;
  relationship_risk: "High" | "Medium" | "Low";
}

export interface Invoice {
  id: string;
  customer_id: string;
  amount: number;
  due_date: string;
  status: "OVERDUE" | "PAID" | "DISPUTED";
  payment_link?: string;
  payment_rail: "UPI" | "CARD" | "BANK_TRANSFER" | "PAYMENT_LINK";
  created_at: string;
}

export interface RecoveryCase {
  id: string;
  customer_id: string;
  invoice_id: string;
  customer_name: string;
  invoice_amount: number;
  days_overdue: number;
  customer_value_tier: CustomerValueTier;
  prior_payments_ontime: number;
  prior_failures: number;
  dispute_flag: boolean;
  already_paid_flag: boolean;
  payment_rail: "UPI" | "CARD" | "BANK_TRANSFER" | "PAYMENT_LINK";
  communication_opened: boolean;
  attempt_count: number;
  status: "ACTIVE" | "HUMAN_REVIEW" | "STOPPED" | "FAILED" | "RECOVERED";
  ai_diagnosis?: string;
  ai_confidence?: number;
  recommended_action?: string;
  expected_recovery?: number;
  recovered_amount?: number;
  created_at: string;
  updated_at: string;
}

export interface RecoveryAttempt {
  id: string;
  case_id: string;
  action: string;
  attempt_number: number;
  status: "Pending" | "Success" | "Failed";
  expected_recovery: number;
  recovered_amount?: number;
  failure_reason?: string;
  created_at: string;
}

export interface AuditEvent {
  id: string;
  case_id: string;
  event_type: string;
  message: string;
  metadata?: string;
  created_at: string;
}

export interface SystemIncident {
  id: string;
  type: string;
  payment_rail: string;
  failure_rate: number;
  affected_cases: number;
  status: "Active" | "Resolved";
  started_at: string;
  resolved_at?: string;
}

export type RecoveryAction = 
  | "WAIT_AND_PAYMENT_LINK"
  | "REMINDER"
  | "ESCALATE"
  | "STOP"
  | "HUMAN_REVIEW";
