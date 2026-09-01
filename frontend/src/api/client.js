const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(path, options = {}) {
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
  listCases: () => request("/cases"),
  getCase: (id) => request(`/cases/${id}`),
  analyzeCase: (id) => request(`/cases/${id}/analyze`, { method: "POST" }),
  executeCase: (id, body = {}) =>
    request(`/cases/${id}/execute`, { method: "POST", body: JSON.stringify(body) }),
  injectFailure: (id, type) =>
    request(`/cases/${id}/inject-failure`, { method: "POST", body: JSON.stringify({ type }) }),
  resetSystemic: () => request("/system/reset-systemic", { method: "POST" }),
  systemStatus: () => request("/system/status"),
  getAudit: (id) => request(`/audit/${id}`),
  getMetrics: () => request("/metrics"),
  runRecovery: () => request("/run-recovery", { method: "POST" }),
};
