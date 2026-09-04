import { AppShell, ScreenHeader } from "../components/AppShell";
import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";

export default function Rules() {
  const rules = [
    {
      id: "RULE-001",
      name: "Active Dispute Protection",
      priority: "CRITICAL",
      condition: "dispute_flag = true",
      action: "STOP AUTOMATED RECOVERY",
      owner: "Policy Engine"
    },
    {
      id: "RULE-002",
      name: "Already Paid Protection",
      priority: "CRITICAL",
      condition: "already_paid_flag = true",
      action: "STOP WORKFLOW",
      owner: "Policy Engine"
    },
    {
      id: "RULE-003",
      name: "Maximum Automated Attempts",
      priority: "HIGH",
      condition: "attempt_count >= 2",
      action: "HUMAN REVIEW",
      owner: "Policy Engine"
    },
    {
      id: "RULE-004",
      name: "Uneconomical Recovery",
      priority: "HIGH",
      condition: "Expected Recovery < Intervention Cost + Relationship Risk",
      action: "STOP / HUMAN REVIEW",
      owner: "Policy Engine"
    },
    {
      id: "RULE-005",
      name: "Systemic Incident Suppression",
      priority: "CRITICAL",
      condition: "failure spike exceeds threshold",
      action: "SUPPRESS AUTOMATED RECOVERY",
      owner: "System"
    },
    {
      id: "RULE-006",
      name: "Reliable Customer Delay",
      priority: "MEDIUM",
      condition: "4+ successful prior payments AND <= 3 days overdue AND no dispute",
      action: "WAIT + PAYMENT LINK",
      owner: "Policy Engine"
    }
  ];

  return (
    <AppShell>
      <div className="workspace-content">
        <ScreenHeader 
          eyebrow="POLICY" 
          title="Guardrails" 
          detail="Deterministic rules bounding the AI to guarantee safe execution."
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {rules.map(rule => (
            <div key={rule.id} className="module-panel p-6 border border-white/5 hover:border-lime-400/30 transition-colors">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-gray-500 font-mono">{rule.id}</span>
                    <span className={`px-2 py-0.5 text-[10px] rounded-full uppercase tracking-wider ${
                      rule.priority === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                      rule.priority === 'HIGH' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {rule.priority}
                    </span>
                  </div>
                  <h3 className="text-lg font-medium text-white">{rule.name}</h3>
                </div>
                <div className="text-lime-400 flex items-center text-sm font-medium bg-lime-400/10 px-3 py-1 rounded-full">
                  <ShieldCheck size={14} className="mr-2" /> ACTIVE
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-black/30 p-4 rounded border border-white/5">
                  <p className="text-xs text-gray-500 font-semibold tracking-wider uppercase mb-1">Condition</p>
                  <p className="text-sm font-mono text-gray-300">{rule.condition}</p>
                </div>
                <div className="bg-blue-500/5 p-4 rounded border border-blue-500/20">
                  <p className="text-xs text-blue-400/70 font-semibold tracking-wider uppercase mb-1">Action</p>
                  <p className="text-sm font-mono text-blue-300">{rule.action}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
