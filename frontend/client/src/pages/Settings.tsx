import { useState } from "react";
import { ArrowLeft, Bell, ShieldCheck, Smartphone, WalletCards } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { AppShell, ScreenHeader } from "@/components/AppShell";

/** Precision Ledger design: settings use low-noise rows and clear binary control states. */

type Setting = { id: "push" | "payment" | "weekly"; title: string; detail: string; icon: typeof Bell };
const SETTINGS: Setting[] = [{ id: "push", title: "Push notifications", detail: "Get important account and transfer updates.", icon: Smartphone }, { id: "payment", title: "Payment alerts", detail: "Be notified when a card transaction clears.", icon: WalletCards }, { id: "weekly", title: "Weekly money review", detail: "Receive a concise Sunday financial signal.", icon: Bell }];

export default function Settings() {
  const [, navigate] = useLocation(); const [settings, setSettings] = useState<Record<Setting["id"], boolean>>({ push: true, payment: true, weekly: false });
  const toggle = (id: Setting["id"]) => setSettings((current) => ({ ...current, [id]: !current[id] }));
  return <AppShell><ScreenHeader eyebrow="Workspace controls" title="Fine-tune your" accent="signal." detail="Set clear preferences for alerts, security, and account visibility."><button className="screen-action" type="button" onClick={() => navigate("/profile")}><ArrowLeft size={14} /> Back to profile</button></ScreenHeader><section className="settings-layout"><article className="screen-panel settings-panel"><div className="screen-panel-head"><div><p>Notifications</p><span>Choose when FinFlex should ask for your attention.</span></div></div>{SETTINGS.map(({ id, title, detail, icon: Icon }) => <div className="setting-row" key={id}><span className="setting-icon"><Icon size={17} /></span><span><strong>{title}</strong><small>{detail}</small></span><button type="button" className={`toggle-control ${settings[id] ? "is-on" : ""}`} aria-pressed={settings[id]} aria-label={`Toggle ${title}`} onClick={() => toggle(id)}><i /></button></div>)}</article><aside className="screen-panel security-card"><ShieldCheck size={23} /><p className="drawer-eyebrow">Security check</p><h2>Your account protections are current.</h2><p>Two-step verification is active and the latest device session is recognized.</p><button className="screen-primary-action" type="button" onClick={() => toast("Security review", { description: "No immediate action is required for this workspace." })}>Review security</button></aside></section><div className="settings-save"><button className="screen-primary-action" type="button" onClick={() => toast("Preferences saved", { description: "Your FinFlex notification settings are now active." })}>Save preferences</button></div></AppShell>;
}
