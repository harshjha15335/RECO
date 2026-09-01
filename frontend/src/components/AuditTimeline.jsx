function formatTime(ts) {
  try {
    return new Date(ts).toLocaleTimeString("en-IN", { hour12: false });
  } catch {
    return ts;
  }
}

export default function AuditTimeline({ events, caseId }) {
  return (
    <div className="panel audit-panel">
      <div className="panel-header">
        <h2 className="panel-title">Audit Timeline</h2>
      </div>
      <div className="audit-scroll">
        {!caseId && <p className="audit-empty">Select a case to see its trail.</p>}
        {caseId && events.length === 0 && <p className="audit-empty">No events yet.</p>}
        {events.map((e, i) => (
          <div className="audit-item" key={e.id ?? i}>
            <div className="audit-line">
              <span className="audit-dot" />
              {i < events.length - 1 && <span className="audit-connector" />}
            </div>
            <div className="audit-content">
              <div className="audit-time mono">{formatTime(e.ts)}</div>
              <div className="audit-event">{e.event}</div>
              {e.detail?.message && <div className="audit-detail">{e.detail.message}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
