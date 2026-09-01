export default function SystemicMonitor({ state, onTrigger, onReset, busy }) {
  const active = state?.active;

  return (
    <div className={`systemic-bar ${active ? "systemic-alert" : ""}`}>
      <div className="systemic-left">
        <span className={`dot ${active ? "dot-red" : "dot-green"}`} />
        <div>
          <div className="systemic-title">
            {active ? "SYSTEMIC PAYMENT DEGRADATION" : "Systemic Monitor — All systems normal"}
          </div>
          {active && (
            <div className="systemic-sub">
              Automated recovery suppressed for affected cases
            </div>
          )}
        </div>
      </div>

      <div className="systemic-stats">
        <div className="systemic-stat">
          <span className="stat-label">Failure Rate</span>
          <span className={`stat-value mono ${active ? "stat-danger" : ""}`}>
            {active ? "28%" : "3.2%"}
          </span>
        </div>
        <div className="systemic-stat">
          <span className="stat-label">Normal Threshold</span>
          <span className="stat-value mono">&lt; 5%</span>
        </div>
        <div className="systemic-stat">
          <span className="stat-label">Affected Rail</span>
          <span className="stat-value mono">{active ? state.rail : "—"}</span>
        </div>
        <div className="systemic-stat">
          <span className="stat-label">Affected Cases</span>
          <span className="stat-value mono">{active ? state.affected_cases : 0}</span>
        </div>
      </div>

      <div className="systemic-actions">
        {!active ? (
          <button className="ghost-btn" onClick={onTrigger} disabled={busy}>
            Simulate Systemic Failure
          </button>
        ) : (
          <button className="ghost-btn" onClick={onReset} disabled={busy}>
            Clear Incident
          </button>
        )}
      </div>
    </div>
  );
}
