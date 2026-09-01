import { useMemo, useState } from "react";
import { formatCompact } from "../utils";

const STATUS_FILTERS = ["all", "pending", "recovered", "escalated", "stopped"];

export default function CasesTable({ cases, selectedId, onSelect }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    return cases.filter((c) => {
      const matchesQuery = c.customer_name.toLowerCase().includes(query.toLowerCase()) ||
        c.invoice_number.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [cases, query, statusFilter]);

  return (
    <div className="panel cases-panel">
      <div className="panel-header">
        <div className="panel-title-row">
          <h2 className="panel-title">Recovery Cases</h2>
          <span className="panel-count mono">{cases.length}</span>
        </div>
        <div className="panel-controls">
          <input
            className="search-input"
            placeholder="Search customer or invoice…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            className="status-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>{s === "all" ? "All statuses" : s}</option>
            ))}
          </select>
        </div>
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
            {filtered.map((c) => (
              <tr
                key={c.case_id}
                className={c.case_id === selectedId ? "row-selected" : ""}
                onClick={() => onSelect(c.case_id)}
              >
                <td>
                  <div className="cell-customer">{c.customer_name}</div>
                  <div className="cell-sub mono">{c.invoice_number}</div>
                </td>
                <td className="mono">{formatCompact(c.invoice_amount)}</td>
                <td>{c.days_overdue}d</td>
                <td>
                  {c.decision ? (
                    <span className="decision-pill">{decisionLabel(c.chosen_action)}</span>
                  ) : (
                    <span className="decision-pill decision-pending">Not analyzed</span>
                  )}
                </td>
                <td className="mono">{c.expected_recovery ? formatCompact(c.expected_recovery) : "—"}</td>
                <td>
                  <StatusDot status={c.status} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-row">No cases match your filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function decisionLabel(action) {
  const map = {
    reminder_now: "Reminder",
    wait_and_payment_link: "Wait + Link",
    escalate: "Escalate",
    stop: "Stop",
  };
  return map[action] || action;
}

function StatusDot({ status }) {
  const colorMap = {
    pending: "blue",
    recovering: "blue",
    recovered: "green",
    escalated: "amber",
    stopped: "red",
    failed: "red",
  };
  const labelMap = {
    pending: "Pending",
    recovering: "Recovering",
    recovered: "Recovered",
    escalated: "Escalated",
    stopped: "Stopped",
    failed: "Failed",
  };
  const color = colorMap[status] || "neutral";
  return (
    <span className="status-tag">
      <span className={`dot dot-${color}`} />
      {labelMap[status] || status}
    </span>
  );
}
