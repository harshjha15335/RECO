import { useEffect, useState } from "react";
import { AppShell, ScreenHeader } from "../components/AppShell";
import { Loader2, AlertCircle } from "lucide-react";

export default function AuditTrail() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/audit")
      .then(res => {
        if (!res.ok) throw new Error("Failed to load audit trail");
        return res.json();
      })
      .then(setEvents)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="workspace-content">
        <ScreenHeader 
          eyebrow="LOGS" 
          title="Audit Trail" 
          detail="Global view of all AI decisions, overrides, and actions."
        />
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-md mb-8 flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div className="module-panel overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 text-sm">
                <th className="p-4 font-normal">Timestamp</th>
                <th className="p-4 font-normal">Customer</th>
                <th className="p-4 font-normal">Event</th>
                <th className="p-4 font-normal">Actor</th>
                <th className="p-4 font-normal">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                    Loading audit trail...
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">No audit events recorded yet.</td>
                </tr>
              ) : events.map((e) => {
                const timeStr = new Date(e.created_at).toLocaleTimeString("en-IN", { hour12: false });
                
                // Determine Actor based on event or message
                let actor = "System";
                if (e.message.includes("RECO AI") || e.event_type.includes("DIAGNOSIS")) actor = "RECO AI";
                if (e.message.includes("Policy Engine") || e.event_type.includes("GUARDRAIL")) actor = "POLICY ENGINE";
                if (e.event_type === "CUSTOMER PAID" || e.message.includes("Razorpay")) actor = "RAZORPAY";

                return (
                  <tr key={e.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-mono text-gray-400 whitespace-nowrap">{timeStr}</td>
                    <td className="p-4 font-medium text-white whitespace-nowrap">{e.customer_name}</td>
                    <td className="p-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-[10px] rounded uppercase tracking-wider ${
                        e.event_type.includes('FAIL') || e.event_type.includes('BLOCKED') || e.event_type.includes('OVERRIDE') ? 'bg-red-500/20 text-red-400' :
                        e.event_type.includes('RECOVERY') || e.event_type.includes('PAID') ? 'bg-green-500/20 text-green-400' :
                        e.event_type.includes('AI') ? 'bg-purple-500/20 text-purple-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {e.event_type}
                      </span>
                    </td>
                    <td className="p-4 text-gray-300 text-xs font-semibold whitespace-nowrap">{actor}</td>
                    <td className="p-4 text-gray-300">
                      <div className="truncate max-w-xl" title={e.message}>
                        {e.message.replace(/^(RECO AI:|Policy Engine:|System:)\s*/, '')}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
