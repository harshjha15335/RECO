const NAV_ITEMS = [
  { label: "Dashboard", icon: "grid", active: true },
  { label: "Recovery Cases", icon: "list" },
  { label: "Recoveries", icon: "check" },
  { label: "Payments", icon: "card" },
  { label: "Customers", icon: "users" },
  { label: "Rules & Guardrails", icon: "shield" },
  { label: "Audit Trail", icon: "clock" },
  { label: "System Health", icon: "pulse" },
  { label: "Settings", icon: "gear" },
];

const ICONS = {
  grid: (
    <path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z" />
  ),
  list: <path d="M4 6h16M4 12h16M4 18h10" />,
  check: <path d="M4 12l5 5L20 6" />,
  card: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6M16 6.5c1.8.3 3 1.8 3 3.5s-1.2 3.2-3 3.5M20 20c0-2.6-1.7-4.7-4-5.6" />
    </>
  ),
  shield: <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </>
  ),
  pulse: <path d="M3 12h4l2-7 4 14 2-7h6" />,
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.6 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" />
    </>
  ),
};

function Icon({ name }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {ICONS[name]}
    </svg>
  );
}

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">R</div>
        <div className="brand-text">
          <div className="brand-name">RECO</div>
          <div className="brand-sub">Revenue Recovery<br />Control Tower</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <div key={item.label} className={`nav-item${item.active ? " nav-item-active" : ""}`}>
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="footer-badge">
          <span className="dot dot-green" />
          Razorpay Payment Links — Live-ready
        </div>
      </div>
    </aside>
  );
}
