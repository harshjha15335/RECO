import { useEffect, useState } from "react";
import { AppShell, ScreenHeader } from "../components/AppShell";
import { Link } from "wouter";
import { Search, Loader2, AlertCircle } from "lucide-react";

export default function RecoveryCases() {
  const [cases, setCases] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/cases")
      .then(res => {
        if (!res.ok) throw new Error("Failed to load cases");
        return res.json();
      })
      .then(setCases)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredCases = cases.filter(c => 
    c.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    c.invoice_id.toLowerCase().includes(search.toLowerCase()) ||
    c.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <div className="workspace-content">
        <ScreenHeader 
          eyebrow="CASES" 
          title="Recovery Cases" 
          detail="All active and pending recovery operations."
        />
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-md mb-8 flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input 
              type="text" 
              placeholder="Search cases..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-md py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="text-sm text-gray-400">
            Showing {filteredCases.length} cases
          </div>
        </div>

        <div className="module-panel overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 text-sm">
                <th className="p-4 font-normal">Customer</th>
                <th className="p-4 font-normal text-right">Amount</th>
                <th className="p-4 font-normal text-right">Overdue</th>
                <th className="p-4 font-normal">Rail</th>
                <th className="p-4 font-normal">AI Decision</th>
                <th className="p-4 font-normal text-right">Expected</th>
                <th className="p-4 font-normal">Status</th>
                <th className="p-4 font-normal"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">
                    <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                    Loading cases...
                  </td>
                </tr>
              ) : filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">No cases found matching your search.</td>
                </tr>
              ) : filteredCases.map((c) => (
                <tr key={c.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-white">{c.customer_name}</div>
                    <div className="text-xs text-gray-500">{c.invoice_id}</div>
                  </td>
                  <td className="p-4 text-right">₹{c.invoice_amount.toLocaleString()}</td>
                  <td className="p-4 text-right text-amber-400">{c.days_overdue} days</td>
                  <td className="p-4 text-gray-300">{c.payment_rail}</td>
                  <td className="p-4 text-blue-400">{c.recommended_action?.replace(/_/g, " ")}</td>
                  <td className="p-4 text-right text-gray-300">₹{c.expected_recovery?.toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-[10px] uppercase tracking-wider rounded-full ${
                      c.status === 'HUMAN_REVIEW' ? 'bg-amber-400/10 text-amber-400' :
                      c.status === 'FAILED' || c.status === 'STOPPED' ? 'bg-red-400/10 text-red-400' :
                      c.status === 'RECOVERED' ? 'bg-green-400/10 text-green-400' :
                      'bg-blue-400/10 text-blue-400'
                    }`}>
                      {c.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Link href={`/cases/${c.id}`} className="text-lime-400 hover:underline text-sm font-medium">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
