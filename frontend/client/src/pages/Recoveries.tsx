import { useEffect, useState } from "react";
import { AppShell, ScreenHeader } from "../components/AppShell";
import { Loader2, AlertCircle } from "lucide-react";

export default function Recoveries() {
  const [recoveries, setRecoveries] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/recoveries").then(r => r.ok ? r.json() : Promise.reject(new Error("Failed to load recoveries"))),
      fetch("/api/metrics").then(r => r.ok ? r.json() : Promise.reject(new Error("Failed to load metrics")))
    ])
    .then(([recoveriesData, metricsData]) => {
      setRecoveries(recoveriesData);
      setMetrics(metricsData);
    })
    .catch(e => setError(e.message))
    .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="workspace-content">
        <ScreenHeader 
          eyebrow="SUCCESS" 
          title="Recoveries" 
          detail="Completed recovery operations and revenue."
        />
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-md mb-8 flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {metrics && (
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="module-panel p-6">
              <p className="text-sm text-gray-400 mb-2">Total Recovered</p>
              <h2 className="text-4xl text-green-400">₹{(metrics.revenueRecovered / 100000).toFixed(1)}L</h2>
            </div>
            <div className="module-panel p-6">
              <p className="text-sm text-gray-400 mb-2">Recovered This Week</p>
              <h2 className="text-4xl text-lime-400">₹{(metrics.revenueRecovered / 100000).toFixed(1)}L</h2>
            </div>
            <div className="module-panel p-6">
              <p className="text-sm text-gray-400 mb-2">Average Recovery</p>
              <h2 className="text-4xl text-blue-400">₹{(metrics.recoveredCases > 0 ? metrics.revenueRecovered / metrics.recoveredCases / 100000 : 0).toFixed(2)}L</h2>
            </div>
            <div className="module-panel p-6">
              <p className="text-sm text-gray-400 mb-2">AI Forecast Accuracy</p>
              <h2 className="text-4xl text-purple-400">
                {recoveries.length > 0 
                  ? Math.round(100 - (recoveries.reduce((acc, r) => {
                      const expected = r.expected_recovery || r.ai_forecast || 0;
                      if (expected === 0) return acc;
                      const diff = Math.abs(r.recovered_amount - expected);
                      return acc + (diff / expected);
                    }, 0) / recoveries.length * 100))
                  : "-"}
              </h2>
            </div>
          </div>
        )}

        <div className="module-panel overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 text-sm">
                <th className="p-4 font-normal">Date</th>
                <th className="p-4 font-normal">Customer</th>
                <th className="p-4 font-normal">Invoice</th>
                <th className="p-4 font-normal text-right">Original</th>
                <th className="p-4 font-normal text-right">Recovered</th>
                <th className="p-4 font-normal">Method</th>
                <th className="p-4 font-normal text-right">Attempts</th>
                <th className="p-4 font-normal text-right">Expected</th>
                <th className="p-4 font-normal text-right">Variance</th>
                <th className="p-4 font-normal">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-gray-500">
                    <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                    Loading recoveries...
                  </td>
                </tr>
              ) : recoveries.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-gray-500">No recoveries recorded yet.</td>
                </tr>
              ) : recoveries.map((r, idx) => {
                const aiExpected = r.ai_forecast || r.expected_recovery || 0;
                const variance = r.attempt_recovery > 0 ? (r.attempt_recovery - aiExpected) : (r.recovered_amount - aiExpected);
                const dateStr = new Date(r.updated_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
                return (
                  <tr key={r.id || idx} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 text-gray-400">{dateStr}</td>
                    <td className="p-4 font-medium text-white">{r.customer_name}</td>
                    <td className="p-4 text-gray-400">INV-{r.invoice_id.substring(0, 6)}</td>
                    <td className="p-4 text-right">₹{r.invoice_amount.toLocaleString()}</td>
                    <td className="p-4 text-right text-lime-400">₹{r.recovered_amount.toLocaleString()}</td>
                    <td className="p-4 text-gray-300">{(r.method || r.recommended_action || "Manual").replace(/_/g, " ")}</td>
                    <td className="p-4 text-right">{r.attempt_count}</td>
                    <td className="p-4 text-right text-gray-400">₹{aiExpected.toLocaleString()}</td>
                    <td className="p-4 text-right">
                      <span className={variance >= 0 ? "text-green-400" : "text-red-400"}>
                        {variance > 0 ? "+" : ""}₹{variance.toLocaleString()}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="bg-green-400/10 text-green-400 px-2 py-1 text-[10px] uppercase tracking-wider rounded-full">Recovered</span>
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

