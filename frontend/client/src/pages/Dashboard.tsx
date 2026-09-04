import { AppShell, ScreenHeader } from "../components/AppShell";
import { useEffect, useState } from "react";
import CaseIntelligence from "../components/reco/CaseIntelligence";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function Dashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [metricsRes, casesRes, healthRes] = await Promise.all([
        fetch("/api/metrics"),
        fetch("/api/cases"),
        fetch("/api/system-health")
      ]);
      if (!metricsRes.ok || !casesRes.ok || !healthRes.ok) throw new Error("Failed to fetch data");
      
      const metricsData = await metricsRes.json();
      const casesData = await casesRes.json();
      const healthData = await healthRes.json();

      setMetrics(metricsData);
      
      const priorityCases = casesData.filter((c: any) => 
        c.status === "ACTIVE" || c.status === "HUMAN_REVIEW" || c.status === "FAILED"
      ).slice(0, 10);
      setCases(priorityCases);
      setHealth(healthData);

      if (priorityCases.length > 0 && !selectedCase) {
        setSelectedCase(priorityCases[0]);
      } else if (selectedCase) {
        const updated = priorityCases.find((c: any) => c.id === selectedCase.id);
        if (updated) setSelectedCase(updated);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <AppShell>
      <div className="workspace-content">
        <ScreenHeader 
          eyebrow="OVERVIEW" 
          title="Revenue Recovery Control Tower" 
          detail="Intelligent decisions. Responsible recovery."
        />
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-md mb-8 flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {loading && !metrics && (
          <div className="text-gray-400 p-8 text-center border border-white/5 rounded-md mb-8">
            Loading dashboard data...
          </div>
        )}

        {metrics && (
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="module-panel p-6">
              <p className="text-sm text-gray-400 mb-2">Revenue at Risk</p>
              <h2 className="text-4xl text-lime-400">₹{(metrics.revenueAtRisk / 100000).toFixed(1)}L</h2>
              <p className="text-sm mt-2">{metrics.activeCases} active cases</p>
            </div>
            <div className="module-panel p-6">
              <p className="text-sm text-gray-400 mb-2">Revenue Recovered</p>
              <h2 className="text-4xl text-green-400">₹{(metrics.revenueRecovered / 100000).toFixed(1)}L</h2>
              <p className="text-sm mt-2">{metrics.recoveryRate.toFixed(1)}% recovery</p>
            </div>
            <div className="module-panel p-6">
              <p className="text-sm text-gray-400 mb-2">Human Review</p>
              <h2 className="text-4xl text-amber-400">{metrics.humanReview}</h2>
              <p className="text-sm mt-2">Cases needing attention</p>
            </div>
            <div className="module-panel p-6">
              <p className="text-sm text-gray-400 mb-2">Stopped</p>
              <h2 className="text-4xl text-red-400">{metrics.stoppedCases}</h2>
              <p className="text-sm mt-2">Blocked by guardrails</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-medium text-white mb-4">Priority Cases</h3>
            <div className="module-panel overflow-hidden">
              {cases.length === 0 && !loading ? (
                 <div className="p-8 text-center text-gray-400">No priority cases currently require action.</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400 text-sm">
                      <th className="p-4 font-normal">Customer</th>
                      <th className="p-4 font-normal text-right">Amount</th>
                      <th className="p-4 font-normal">Overdue</th>
                      <th className="p-4 font-normal">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {cases.map((c) => (
                      <tr 
                        key={c.id} 
                        onClick={() => setSelectedCase(c)}
                        className={`transition-colors cursor-pointer ${selectedCase?.id === c.id ? 'bg-blue-500/10' : 'hover:bg-white/5'}`}
                      >
                        <td className="p-4">
                          <div className="font-medium text-white">{c.customer_name}</div>
                          <div className="text-xs text-gray-500">INV-{c.invoice_id.substring(0,6)}</div>
                        </td>
                        <td className="p-4 text-right font-mono">₹{c.invoice_amount.toLocaleString()}</td>
                        <td className="p-4 text-amber-400">{c.days_overdue} days</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            c.status === 'HUMAN_REVIEW' ? 'bg-amber-400/10 text-amber-400' :
                            c.status === 'FAILED' ? 'bg-red-400/10 text-red-400' :
                            c.status === 'STOPPED' ? 'bg-red-500/20 text-red-500' :
                            c.status === 'RECOVERED' ? 'bg-green-500/20 text-green-500' :
                            'bg-blue-400/10 text-blue-400'
                          }`}>
                            {c.status.replace(/_/g, " ")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-white mb-4">RECO Intelligence</h3>
              {selectedCase ? (
                <CaseIntelligence caseData={selectedCase} onUpdate={fetchData} />
              ) : (
                <div className="module-panel p-6 text-center text-gray-400 text-sm">
                  Select a case to view intelligence
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-4">System Health</h3>
              <div className="module-panel p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-400">Automation</span>
                  {health && !health.isHealthy ? (
                    <span className="text-red-400 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></div>
                      Suppressed
                    </span>
                  ) : (
                    <span className="text-green-400 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      Operational
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-400">API Latency</span>
                  <span className="text-white">124ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Active Incidents</span>
                  <span className="text-white">{health ? health.incidents.length : 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
