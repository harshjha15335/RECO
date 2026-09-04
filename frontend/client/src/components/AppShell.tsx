import { useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { BarChart3, Bell, Command, CreditCard, Home, Landmark, Menu, Search, Settings2, UserRound, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

/**
 * Precision Ledger design system: a compact command rail anchors every screen,
 * preserving the restrained charcoal panels and decisive chartreuse signal.
 */

const NAV_ITEMS = [
  { label: "Dashboard", path: "/", icon: Home },
  { label: "Recovery Cases", path: "/cases", icon: Landmark },
  { label: "Recoveries", path: "/recoveries", icon: CreditCard },
  { label: "Customers", path: "/customers", icon: UserRound },
  { label: "System Health", path: "/system", icon: BarChart3 },
  { label: "Audit Trail", path: "/audit", icon: Search },
  { label: "Rules", path: "/rules", icon: Settings2 },
];

const COMMANDS = [
  { label: "Dashboard", detail: "Control Tower overview", path: "/", icon: Home },
  { label: "Recovery Cases", detail: "Active overdue accounts", path: "/cases", icon: Landmark },
  { label: "Recoveries", detail: "Completed recovery actions", path: "/recoveries", icon: CreditCard },
  { label: "Customers", detail: "Customer payment reliability", path: "/customers", icon: UserRound },
  { label: "System Health", detail: "Incident and degradation status", path: "/system", icon: BarChart3 },
  { label: "Audit Trail", detail: "Recovery event log", path: "/audit", icon: Search },
  { label: "Rules", detail: "Deterministic guardrails", path: "/rules", icon: Settings2 },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [location, navigate] = useLocation();
  const [commandOpen, setCommandOpen] = useState(false);
  const [query, setQuery] = useState("");
  const matchedCommands = COMMANDS.filter((command) => `${command.label} ${command.detail}`.toLowerCase().includes(query.toLowerCase()));

  const runCommand = (path: string) => {
    navigate(path);
    setCommandOpen(false);
    setQuery("");
  };

  return (
    <main className="finance-page">
      <div className="finflex-shell">
        <header className="command-rail" aria-label="RECO workspace navigation">
          <Link href="/" className="brand-lockup" aria-label="Go to RECO home">
            <div className="brand-name">RECO</div>
          </Link>
          <nav className="nav-cluster" aria-label="Primary navigation">
            {NAV_ITEMS.map(({ label, path, icon: Icon }) => (
              <Link key={path} href={path} className={`nav-item ${location === path ? "is-active" : ""}`} aria-current={location === path ? "page" : undefined}>
                <Icon size={14} strokeWidth={1.8} /><span className="nav-label">{label}</span>
              </Link>
            ))}
          </nav>
          <div className="utility-actions">
            <button className="icon-button" type="button" aria-label="Open command menu" onClick={() => setCommandOpen(true)}><Menu size={16} /></button>
            <Link href="/system" className={`icon-button ${location === "/system" ? "is-current" : ""}`} aria-label="System Health"><Bell size={16} /></Link>
            <Link href="/" className={`profile-disc ${location === "/" ? "is-current" : ""}`} aria-label="Profile">RE</Link>
          </div>
        </header>
        {children}
      </div>

      <Dialog open={commandOpen} onOpenChange={setCommandOpen}>
        <DialogContent className="command-dialog" showCloseButton={false}>
          <div className="command-dialog-head"><div><p className="drawer-eyebrow"><Command size={12} /> Command menu</p><DialogTitle className="command-dialog-title">Find your next action</DialogTitle><DialogDescription className="drawer-description">Choose a RECO workspace or search its tools.</DialogDescription></div><button className="drawer-close" type="button" onClick={() => setCommandOpen(false)} aria-label="Close command menu"><X size={17} /></button></div>
          <label className="command-search"><Search size={16} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search screens and actions" /></label>
          <div className="command-results">
            {matchedCommands.map(({ label, detail, path, icon: Icon }) => <button key={path} type="button" onClick={() => runCommand(path)}><span className="command-result-icon"><Icon size={16} /></span><span><strong>{label}</strong><small>{detail}</small></span><span className="command-key">↵</span></button>)}
            {!matchedCommands.length && <p className="command-empty">No RECO actions match that search.</p>}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

export function ScreenHeader({ eyebrow, title, accent, detail, children }: { eyebrow: string; title: string; accent?: string; detail: string; children?: ReactNode }) {
  return <section className="screen-header"><div><p className="eyebrow">{eyebrow}</p><h1 className="screen-title">{title} {accent && <span>{accent}</span>}</h1><p className="screen-detail">{detail}</p></div>{children && <div className="screen-header-actions">{children}</div>}</section>;
}
