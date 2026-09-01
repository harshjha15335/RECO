import type { AuditEvent, ExecuteResult, Metrics, RecoveryCase, SystemicIncident } from "./types";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return res.json();
}

export const api = {
  listCases: () => request<RecoveryCase[]>("/cases"),
  getCase: (id: string) => request<RecoveryCase>(`/cases/${id}`),
  analyzeCase: (id: string) => request<RecoveryCase>(`/cases/${id}/analyze`, { method: "POST" }),
  executeCase: (id: string) =>
    request<{ case: RecoveryCase; result?: ExecuteResult; message?: string }>(`/cases/${id}/execute`, {
      method: "POST",
      body: JSON.stringify({}),
    }),
  injectFailure: (id: string, type: "gateway" | "systemic" | "mid_payment") =>
    request<any>(`/cases/${id}/inject-failure`, { method: "POST", body: JSON.stringify({ type }) }),
  resetSystemic: () => request<{ systemic_incident: SystemicIncident }>("/system/reset-systemic", { method: "POST" }),
  systemStatus: () => request<{ systemic_incident: SystemicIncident }>("/system/status"),
  getAudit: (id: string) => request<AuditEvent[]>(`/audit/${id}`),
  getMetrics: () => request<Metrics>("/metrics"),
};
