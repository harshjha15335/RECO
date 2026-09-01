import { useMemo, useState } from "react";
import type { RecoveryCase } from "@/lib/types";
import { formatCompact } from "@/lib/format";

const STATUS_FILTERS = ["all", "pending", "recovered", "escalated", "stopped"] as const;

const DECISION_LABELS: Record<string, string> = {
  reminder_now: "Reminder",
  wait_and_payment_link: "Wait + Link",
  escalate: "Escalate",
  stop: "Stop",
};

const STATUS_META: Record<string, { color: string; label: string }> = {
  pending: { color: "blue", label: "Pending" },
  recovering: { color: "blue", label: "Recovering" },
  recovered: { color: "green", label: "Recovered" },
  escalated: { color: "amber", label: "Escalated" },
  stopped: { color: "red", label: "Stopped" },
  failed: { color: "red", label: "Failed" },
};

export function CasesTable({
  cases,
  selectedId,
  onSelect,
}: {
  cases: RecoveryCase[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("all");

  const filtered = useMemo(() => {
    return cases.filter((c) => {
      const matchesQuery =
        c.customer_name.toLowerCase().includes(query.toLowerCase()) ||
        c.invoice_number.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [cases, query, statusFilter]);

  return (
    <div className="panel cases-panel">
      <div className="panel-head">
        <p className="panel-label">Recovery Cases</p>
        <span className="panel-count mono">{cases.length}</span>
      </div>
      <div className="panel-controls">
        <input
          className="search-input"
          placeholder="Search customer or invoice…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select className="status-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
          {STATUS_FILTERS.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All statuses" : s}
            </option>
          ))}
        </select>
      </div>

      <div className="table-scroll">
        <table className="cases-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Amount</th>
              <th>Overdue</th>
              <th>AI Decision</th>
              <th>Expected</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const meta = STATUS_META[c.status] || { color: "neutral", label: c.status };
              return (
                <tr key={c.case_id} className={c.case_id === selectedId ? "row-selected" : ""} onClick={() => onSelect(c.case_id)}>
                  <td>
                    <div className="cell-customer">{c.customer_name}</div>
                    <div className="cell-sub mono">{c.invoice_number}</div>
                  </td>
                  <td className="mono">{formatCompact(c.invoice_amount)}</td>
                  <td>{c.days_overdue}d</td>
                  <td>
                    {c.decision && c.chosen_action ? (
                      <span className="decision-pill">{DECISION_LABELS[c.chosen_action] || c.chosen_action}</span>
                    ) : (
                      <span className="decision-pill decision-pending">Not analyzed</span>
                    )}
                  </td>
                  <td className="mono">{c.expected_recovery ? formatCompact(c.expected_recovery) : "—"}</td>
                  <td>
                    <span className="status-tag">
                      <span className={`dot dot-${meta.color}`} />
                      {meta.label}
                    </span>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-row">
                  No cases match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
