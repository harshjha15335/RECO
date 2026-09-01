import { useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Activity,
  Bell,
  ClipboardList,
  Command,
  CreditCard,
  LayoutDashboard,
  Menu,
  Search,
  Settings2,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

/**
 * RECO command rail: same restrained charcoal-and-chartreuse workspace
 * pattern as the FinFlex reference, adapted for a revenue-recovery
 * operations console instead of a personal finance dashboard.
 */

const NAV_ITEMS = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Cases", path: "/", icon: ClipboardList },
  { label: "Guardrails", path: "/", icon: ShieldCheck },
  { label: "Customers", path: "/", icon: Users },
  { label: "System Health", path: "/", icon: Activity },
];

const COMMANDS = [
  { label: "Run Recovery", detail: "Analyze every pending case", path: "/", icon: LayoutDashboard },
  { label: "Review guardrails", detail: "Stopping rules and thresholds", path: "/", icon: ShieldCheck },
  { label: "Simulate systemic failure", detail: "Trigger the demo incident", path: "/", icon: Activity },
  { label: "Open settings", detail: "Preferences and alerts", path: "/", icon: Settings2 },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [location, navigate] = useLocation();
  const [commandOpen, setCommandOpen] = useState(false);
  const [query, setQuery] = useState("");
  const matchedCommands = COMMANDS.filter((command) =>
    `${command.label} ${command.detail}`.toLowerCase().includes(query.toLowerCase())
  );

  const runCommand = (path: string) => {
    navigate(path);
    setCommandOpen(false);
    setQuery("");
  };

  return (
    <main className="finance-page">
      <div className="finflex-shell">
        <header className="command-rail" aria-label="RECO workspace navigation">
          <Link href="/" className="brand-lockup" aria-label="Go to RECO dashboard">
            <div className="brand-mark" aria-hidden="true">R</div>
            <div className="brand-name">
              RE<span>CO</span>
            </div>
          </Link>
          <nav className="nav-cluster" aria-label="Primary navigation">
            {NAV_ITEMS.map(({ label, path, icon: Icon }, i) => (
              <Link
                key={label}
                href={path}
                className={`nav-item ${i === 0 && location === path ? "is-active" : ""}`}
                aria-current={i === 0 && location === path ? "page" : undefined}
              >
                <Icon size={14} strokeWidth={1.8} />
                <span className="nav-label">{label}</span>
              </Link>
            ))}
          </nav>
          <div className="utility-actions">
            <button className="icon-button" type="button" aria-label="Open command menu" onClick={() => setCommandOpen(true)}>
              <Menu size={16} />
            </button>
            <button className="icon-button" type="button" aria-label="Notifications">
              <Bell size={16} />
            </button>
            <div className="profile-disc" aria-label="Harsh Jha">
              HJ
            </div>
          </div>
        </header>
        {children}
      </div>

      <Dialog open={commandOpen} onOpenChange={setCommandOpen}>
        <DialogContent className="command-dialog" showCloseButton={false}>
          <div className="command-dialog-head">
            <div>
              <p className="drawer-eyebrow">
                <Command size={12} /> Command menu
              </p>
              <DialogTitle className="command-dialog-title">Find your next action</DialogTitle>
              <DialogDescription className="drawer-description">Search RECO's tools and workflows.</DialogDescription>
            </div>
            <button className="drawer-close" type="button" onClick={() => setCommandOpen(false)} aria-label="Close command menu">
              <X size={17} />
            </button>
          </div>
          <label className="command-search">
            <Search size={16} />
            <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search screens and actions" />
          </label>
          <div className="command-results">
            {matchedCommands.map(({ label, detail, path, icon: Icon }) => (
              <button key={label} type="button" onClick={() => runCommand(path)}>
                <span className="command-result-icon">
                  <Icon size={16} />
                </span>
                <span>
                  <strong>{label}</strong>
                  <small>{detail}</small>
                </span>
                <span className="command-key">↵</span>
              </button>
            ))}
            {!matchedCommands.length && <p className="command-empty">No RECO actions match that search.</p>}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

export function ScreenHeader({
  eyebrow,
  title,
  accent,
  detail,
  children,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  detail: string;
  children?: ReactNode;
}) {
  return (
    <section className="screen-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="screen-title">
          {title} {accent && <span>{accent}</span>}
        </h1>
        <p className="screen-detail">{detail}</p>
      </div>
      {children && <div className="screen-header-actions">{children}</div>}
    </section>
  );
}
