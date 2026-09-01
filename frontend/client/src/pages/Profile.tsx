import { useState } from "react";
import { ChevronRight, CircleCheck, Settings2 } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { AppShell, ScreenHeader } from "@/components/AppShell";

/** Precision Ledger design: profile controls remain personal but structured like the rest of the financial workspace. */

export default function Profile() {
  const [, navigate] = useLocation(); const [name, setName] = useState("Mira Johnson"); const [email, setEmail] = useState("mira@finflex.example"); const [currency, setCurrency] = useState("USD — US Dollar");
  const saveProfile = (event: React.FormEvent) => { event.preventDefault(); toast("Profile saved", { description: "Your workspace details are up to date." }); };
  return <AppShell><ScreenHeader eyebrow="Personal workspace" title="Your FinFlex," accent="your way." detail="Control the preferences that shape your financial view."><button className="screen-action" type="button" onClick={() => navigate("/settings")}><Settings2 size={14} /> Settings</button></ScreenHeader><section className="profile-layout"><article className="profile-identity"><span className="profile-avatar">MJ</span><div><p className="drawer-eyebrow">Personal account</p><h2>{name}</h2><span>{email}</span></div><i><CircleCheck size={14} /> Verified</i></article><form className="screen-panel profile-form" onSubmit={saveProfile}><div className="screen-panel-head"><div><p>Profile details</p><span>Used across your private FinFlex workspace</span></div></div><div className="field-pair"><label className="field-label">Full name<input value={name} onChange={(event) => setName(event.target.value)} /></label><label className="field-label">Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label></div><label className="field-label">Preferred currency<select value={currency} onChange={(event) => setCurrency(event.target.value)}><option>USD — US Dollar</option><option>EUR — Euro</option><option>GBP — British Pound</option></select></label><div className="profile-form-footer"><button className="screen-secondary-action" type="button" onClick={() => navigate("/notifications")}>Review notifications <ChevronRight size={14} /></button><button className="screen-primary-action" type="submit">Save changes</button></div></form></section></AppShell>;
}
