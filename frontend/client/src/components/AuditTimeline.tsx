import type { AuditEvent } from "@/lib/types";
import { formatTime } from "@/lib/format";

export function AuditTimeline({ events, caseId }: { events: AuditEvent[]; caseId: string | null }) {
  return (
    <div className="panel audit-panel">
      <div className="panel-head">
        <p className="panel-label">Audit Timeline</p>
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
              {e.detail?.message ? <div className="audit-detail">{String(e.detail.message)}</div> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
