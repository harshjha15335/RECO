import { useState } from "react";
import { formatCompact, formatRupees } from "../utils";

const ACTION_LABELS = {
  reminder_now: "Send Reminder Now",
  wait_and_payment_link: "Wait 12h + Payment Link",
  escalate: "Escalate to Human",
  stop: "Stop Recovery",
};

export default function CaseDetail({ caseData, onAnalyze, onExecute, onInjectFailure, busy, execResult }) {
  const [showSignals, setShowSignals] = useState(false);

  if (!caseData) {
    return (
      <div className="panel detail-panel detail-empty">
        <p>Select a case to see RECO's analysis.</p>
      </div>
    );
  }

  const { diagnosis, options, decision, chosen_action, status } = caseData;
  const maxEv = options ? Math.max(...options.map((o) => o.expected_recovery), 1) : 1;
  const canExecute = status === "pending" && ["reminder_now", "wait_and_payment_link"].includes(chosen_action);

  return (
    <div className="panel detail-panel">
      <div className="detail-header">
        <div>
          <h2 className="detail-name">{caseData.customer_name}</h2>
          <div className="detail-meta mono">{caseData.invoice_number} · {formatRupees(caseData.invoice_amount)} · {caseData.days_overdue} days overdue</div>
        </div>
        <StatusBadge status={status} />
      </div>

      {!diagnosis && (
        <div className="analyze-prompt">
          <p>RECO hasn't analyzed this case yet.</p>
          <button className="primary-btn" onClick={() => onAnalyze(caseData.case_id)} disabled={busy}>
            {busy ? "Analyzing…" : "Run Analysis"}
          </button>
        </div>
      )}

      {diagnosis && (
        <>
          <section className="detail-section">
            <div className="section-label">AI Diagnosis</div>
            <div className="diagnosis-headline">{diagnosis.diagnosis}</div>
            <div className="diagnosis-row">
              <span className="confidence-chip">Confidence: {Math.round(diagnosis.confidence * 100)}%</span>
              <button className="link-btn" onClick={() => setShowSignals((s) => !s)}>
                {diagnosis.signals?.length || 0} signals analyzed — {showSignals ? "Hide" : "View signals"}
              </button>
            </div>
            {showSignals && (
              <ul className="signals-list">
                {diagnosis.signals?.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            )}
          </section>

          <section className="detail-section">
            <div className="section-label">Options Considered</div>
            <div className="options-list">
              {options.map((o) => (
                <div key={o.action} className={`option-row ${o.action === chosen_action ? "option-chosen" : ""}`}>
                  <div className="option-top">
                    <span className="option-label">{o.label}</span>
                    {o.recommended && <span className="badge-recommended">RECOMMENDED</span>}
                  </div>
                  <div className="option-bar-track">
                    <div
                      className={`option-bar option-bar-${o.action}`}
                      style={{ width: `${maxEv ? (o.expected_recovery / maxEv) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="option-bottom">
                    <span className="option-ev mono">{formatCompact(o.expected_recovery)}</span>
                    {o.action !== "stop" && (
                      <span className="option-risk">Relationship risk: {o.relationship_risk}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="detail-section">
            <div className="section-label">Why RECO chose this</div>
            <p className="reasoning-text">{decision?.reason}</p>
            {decision?.rule_triggered && (
              <div className="rule-note">
                <span className="dot dot-amber" /> Guardrail: {decision.rule_triggered.replace(/_/g, " ")}
              </div>
            )}
          </section>

          <div className="detail-actions">
            <button
              className="primary-btn execute-btn"
              onClick={() => onExecute(caseData.case_id)}
              disabled={!canExecute || busy}
            >
              {busy ? "Executing…" : "Execute Recovery Action"}
            </button>
            {canExecute && (
              <button
                className="ghost-btn"
                onClick={() => onInjectFailure(caseData.case_id, "gateway")}
                disabled={busy}
                title="Demo: force this action to fail once"
              >
                Inject Failure
              </button>
            )}
          </div>

          {execResult && (
            <div className={`exec-result ${execResult.success ? "exec-success" : "exec-fail"}`}>
              {execResult.success
                ? `Success (${execResult.mode}) — ${execResult.link || execResult.message}`
                : `Failed — ${execResult.error}`}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const colorMap = {
    pending: "blue",
    recovering: "blue",
    recovered: "green",
    escalated: "amber",
    stopped: "red",
    failed: "red",
  };
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return <span className={`status-badge status-badge-${colorMap[status] || "neutral"}`}>{label}</span>;
}
