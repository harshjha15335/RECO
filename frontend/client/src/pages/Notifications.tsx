import { useState } from "react";
import { BellRing, Check, ChevronRight, CreditCard, Landmark, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { AppShell, ScreenHeader } from "@/components/AppShell";

/** Precision Ledger design: notifications are compact signals that always lead to a meaningful next step. */

const ALERTS = [
  { id: "budget", title: "Dining is nearing its monthly line", detail: "You have $18 remaining in this category at the current pace.", time: "12 min ago", icon: Sparkles, path: "/analytics" },
  { id: "deposit", title: "Freelance deposit received", detail: "$1,240.00 reached FinFlex Checking.", time: "Yesterday", icon: Landmark, path: "/payments" },
  { id: "card", title: "Card payment confirmed", detail: "Adobe Creative Cloud cleared on your Visa ending 8967.", time: "Yesterday", icon: CreditCard, path: "/payments" },
];

export default function Notifications() {
  const [, navigate] = useLocation(); const [read, setRead] = useState<string[]>([]);
  const markAll = () => setRead(ALERTS.map((alert) => alert.id));
  return <AppShell><ScreenHeader eyebrow="Activity inbox" title="The signals that" accent="need you." detail="Financial updates are kept concise, timely, and easy to act on."><button className="screen-action" type="button" onClick={markAll}><Check size={14} /> Mark all read</button></ScreenHeader><section className="notification-layout"><article className="screen-panel notifications-list">{ALERTS.map(({ id, title, detail, time, icon: Icon, path }) => <button className={`notification-row ${read.includes(id) ? "is-read" : ""}`} type="button" key={id} onClick={() => { setRead((items) => items.includes(id) ? items : [...items, id]); navigate(path); }}><span className="notification-icon"><Icon size={17} /></span><span><strong>{title}</strong><small>{detail}</small><em>{time}</em></span><ChevronRight size={17} /></button>)}</article><aside className="notification-aside"><BellRing size={22} /><h2>You're in a good rhythm.</h2><p>Your accounts are synced, and no urgent payment or security alert needs action.</p><button className="screen-primary-action" type="button" onClick={() => navigate("/settings")}>Tune alerts <ChevronRight size={14} /></button></aside></section></AppShell>;
}
