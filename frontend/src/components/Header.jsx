export default function Header({ onRunRecovery, running }) {
  const today = new Date();
  const dateLabel = today.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <header className="header">
      <div>
        <h1 className="header-title">Revenue Recovery Control Tower</h1>
        <p className="header-subtitle">Intelligent decisions. Responsible recovery.</p>
      </div>
      <div className="header-right">
        <div className="header-date mono">{dateLabel}</div>
        <button className="icon-btn" title="Notifications">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 01-3.4 0" />
          </svg>
        </button>
        <button className="run-recovery-btn" onClick={onRunRecovery} disabled={running}>
          {running ? "Running…" : "Run Recovery"}
        </button>
        <div className="profile-chip mono">HJ</div>
      </div>
    </header>
  );
}
