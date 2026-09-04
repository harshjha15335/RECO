import { useEffect, useState } from "react";
import { AppShell, ScreenHeader } from "../components/AppShell";
import { Loader2, AlertCircle } from "lucide-react";

export default function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/customers")
      .then(res => {
        if (!res.ok) throw new Error("Failed to load customers");
        return res.json();
      })
      .then(setCustomers)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="workspace-content">
        <ScreenHeader 
          eyebrow="DIRECTORY" 
          title="Customers" 
          detail="Customer profiles and risk assessment."
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
                <th className="p-4 font-normal">Customer</th>
                <th className="p-4 font-normal">Segment</th>
                <th className="p-4 font-normal text-right">Open Invoices</th>
                <th className="p-4 font-normal text-right">Outstanding</th>
                <th className="p-4 font-normal text-right">Recovered</th>
                <th className="p-4 font-normal">Reliability</th>
                <th className="p-4 font-normal">Risk Level</th>
                <th className="p-4 font-normal">Recovery State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">
                    <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                    Loading customers...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">No customers found.</td>
                </tr>
              ) : customers.map((c) => {
                const reliability = (c.prior_payments_ontime / (c.prior_payments_ontime + c.prior_failures) * 100).toFixed(0);
                return (
                  <tr key={c.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-medium text-white">{c.name}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        c.value_tier === 'Strategic' ? 'bg-purple-500/20 text-purple-400' :
                        c.value_tier === 'High' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>{c.value_tier}</span>
                    </td>
                    <td className="p-4 text-right">{c.open_invoices}</td>
                    <td className="p-4 text-right">₹{c.total_outstanding ? c.total_outstanding.toLocaleString() : "0"}</td>
                    <td className="p-4 text-right text-lime-400">₹{c.total_recovered.toLocaleString()}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="text-gray-400">{reliability}%</div>
                        <div className="text-xs text-gray-500">({c.prior_payments_ontime}/{c.prior_payments_ontime + c.prior_failures})</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={c.relationship_risk === "High" ? "text-amber-400" : "text-green-400"}>{c.relationship_risk}</span>
                    </td>
                    <td className="p-4 text-gray-300">{c.recovery_state ? c.recovery_state.replace(/_/g, " ") : "No active case"}</td>
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
