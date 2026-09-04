import { useEffect, useState } from "react";
import { AppShell, ScreenHeader } from "../components/AppShell";
import { Loader2, Zap, AlertTriangle, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export default function SystemHealth() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchHealth = () => fetch("/api/system-health").then(res => res.json()).then(setHealth);
  
  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  const triggerIncident = async () => {
    setLoading(true);
    try {
      await fetch("/api/demo/systemic-incident", { method: "POST" });
      toast.error("Systemic incident injected");
      await fetchHealth();
    } catch (e: any) {
      toast.error("Failed to inject incident");
    } finally {
      setLoading(false);
    }
  };

  const clearIncident = async () => {
    setLoading(true);
    try {
      await fetch("/api/demo/clear-incident", { method: "POST" });
      toast.success("Incident cleared. Automation restored.");
      await fetchHealth();
    } catch (e: any) {
      toast.error("Failed to clear incident");
    } finally {
      setLoading(false);
    }
  };

  if (!health) return <AppShell><div className="p-8 text-white">Loading...</div></AppShell>;

  return (
    <AppShell>
      <div className="workspace-content">
        <ScreenHeader 
          eyebrow="STATUS" 
          title="System Health" 
          detail="Monitor API health and systemic payment degradation."
        />

        {health.incidents && health.incidents.length > 0 && (
          <div className="mb-8 border border-red-500/50 bg-red-500/10 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-500/20 rounded-full shrink-0">
                <ShieldAlert className="text-red-400 w-8 h-8" />
              </div>
              <div className="w-full">
                <h3 className="text-xl font-bold text-red-400 mb-1">SYSTEMIC INCIDENT ACTIVE</h3>
                <p className="text-white text-lg mb-4">
                  Automated recovery suppressed for: <span className="font-bold">{health.incidents[0].payment_rail}</span>
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-black/20 p-4 rounded-md border border-white/5">
                  <div>
                    <p className="text-gray-400">Affected Rail</p>
                    <p className="text-white font-medium">{health.incidents[0].payment_rail}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Incident Status</p>
                    <p className="text-red-400 font-medium uppercase">{health.incidents[0].status}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Reason</p>
                    <p className="text-white font-medium">{health.incidents[0].type || "PAYMENT_DEGRADATION"}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Automation State</p>
                    <p className="text-red-400 font-bold uppercase">SUPPRESSED</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
          <div className="lg:col-span-2 space-y-6">
            <div className="module-panel p-6">
              <h3 className="text-lg font-medium text-white mb-6">Operational Metrics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-white/10 p-4 rounded-md flex flex-col justify-between">
                  <p className="text-sm text-gray-400 mb-2">Automation Engine</p>
                  <p className={`text-xl font-medium ${health.isHealthy ? 'text-green-400' : 'text-amber-400'}`}>
                    {health.isHealthy ? 'OPERATIONAL' : 'DEGRADED'}
                  </p>
                </div>
                <div className="border border-white/10 p-4 rounded-md flex flex-col justify-between">
                  <p className="text-sm text-gray-400 mb-2">API Latency</p>
                  <p className="text-xl font-medium text-white">{health.stats?.avgLatency || '124ms'}</p>
                </div>
                <div className="border border-white/10 p-4 rounded-md flex flex-col justify-between">
                  <p className="text-sm text-gray-400 mb-2">AI Service (Claude)</p>
                  <p className="text-xl font-medium text-green-400">HEALTHY</p>
                </div>
                <div className="border border-white/10 p-4 rounded-md flex flex-col justify-between">
                  <p className="text-sm text-gray-400 mb-2">Database</p>
                  <p className="text-xl font-medium text-green-400">HEALTHY</p>
                </div>
                <div className="border border-white/10 p-4 rounded-md flex flex-col justify-between">
                  <p className="text-sm text-gray-400 mb-2">Execution Jobs</p>
                  <p className="text-xl font-medium text-white">{health.stats?.totalExecutions || 0}</p>
                </div>
                <div className="border border-white/10 p-4 rounded-md flex flex-col justify-between">
                  <p className="text-sm text-gray-400 mb-2">Failed Executions</p>
                  <p className="text-xl font-medium text-red-400">{health.stats?.failedExecutions || 0}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {health.incidents.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-md">
                <h3 className="text-red-400 font-medium flex items-center gap-2 mb-4">
                  <ShieldAlert size={18} /> ACTIVE INCIDENTS
                </h3>
                {health.incidents.map((inc: any) => (
                  <div key={inc.id} className="mb-4 last:mb-0">
                    <p className="text-sm font-medium text-white mb-1">INC-{inc.id.substring(0,6).toUpperCase()}</p>
                    <p className="text-sm text-red-200 mb-1">Type: {inc.type}</p>
                    <p className="text-sm text-red-200 mb-1">Rail: {inc.payment_rail}</p>
                    <p className="text-sm text-red-200 mb-2">Failure rate: {(inc.failure_rate * 100).toFixed(0)}% (Normal: &lt;5%)</p>
                    <p className="text-xs bg-red-500/20 text-red-300 p-2 rounded">
                      "RECO detected a systemic payment failure. Individual recovery attempts are temporarily suppressed to prevent unnecessary customer escalation."
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="module-panel p-6 border-amber-500/30 border">
              <h3 className="text-amber-400 font-medium flex items-center gap-2 mb-4">
                <Zap size={18} /> DEMO CONTROLS
              </h3>
              <p className="text-sm text-gray-400 mb-6">Use these controls to demonstrate RECO's deterministic fallbacks during the pitch.</p>
              
              <div className="space-y-3">
                <button 
                  onClick={triggerIncident}
                  disabled={loading || health.incidents.length > 0}
                  className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white px-4 py-3 rounded-md text-sm font-medium transition-colors disabled:opacity-50 text-left flex justify-between items-center"
                >
                  <span>Simulate Systemic Incident</span>
                  {loading && health.incidents.length === 0 ? <Loader2 size={14} className="animate-spin text-amber-400" /> : <AlertTriangle size={14} className="text-amber-400" />}
                </button>
                
                <button 
                  onClick={clearIncident}
                  disabled={loading || health.incidents.length === 0}
                  className="w-full bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 text-blue-400 px-4 py-3 rounded-md text-sm font-medium transition-colors disabled:opacity-50 text-left flex justify-between items-center"
                >
                  <span>Clear Incident (Restore)</span>
                  {loading && health.incidents.length > 0 ? <Loader2 size={14} className="animate-spin" /> : null}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
