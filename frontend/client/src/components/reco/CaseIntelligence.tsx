import { useState } from "react";
import { Loader2, Zap, AlertTriangle, CheckCircle2, XCircle, BrainCircuit } from "lucide-react";
import { toast } from "sonner";
import { RecoveryCase } from "../../../../shared/types";

export default function CaseIntelligence({ caseData, onUpdate }: { caseData: RecoveryCase, onUpdate: () => void }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [options, setOptions] = useState<{ action: string; expected_recovery: number; description: string; passGuardrails: boolean }[]>([]);
  const [activeCase, setActiveCase] = useState(caseData);

  // Update internal state when props change
  if (caseData.id !== activeCase.id) {
    setActiveCase(caseData);
    setOptions([]);
  }

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch(`/api/cases/${activeCase.id}/analyze`, { method: "POST" });
      if (!res.ok) throw new Error("Analysis failed");
      const data = await res.json();
      setActiveCase(data.case);
      setOptions(data.options || []);
      toast.success("AI Analysis complete");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleExecute = async () => {
    setExecuting(true);
    try {
      const res = await fetch(`/api/cases/${activeCase.id}/execute`, { method: "POST" });
      if (!res.ok) throw new Error("Execution failed");
      toast.success("Recovery action executed");
      onUpdate();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setExecuting(false);
    }
  };

  const handleFailureInjection = async () => {
    setExecuting(true);
    try {
      const res = await fetch(`/api/cases/${activeCase.id}/inject-failure`, { method: "POST" });
      if (!res.ok) throw new Error("Execution failed");
      toast.error("Execution failed and triggered fallback sequence");
      onUpdate();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setExecuting(false);
    }
  };

  const isStopped = activeCase.status === "STOPPED";
  const isRecovered = activeCase.status === "RECOVERED";

  return (
    <div className="module-panel overflow-hidden border border-blue-500/20">
      <div className="bg-blue-500/10 p-4 border-b border-blue-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2 text-blue-400 font-medium">
          <BrainCircuit size={16} /> RECO INTELLIGENCE
        </div>
        {activeCase.ai_confidence && (
          <div className="text-xs text-blue-400/70 bg-blue-500/10 px-2 py-1 rounded-full">
            Confidence: {(activeCase.ai_confidence * 100).toFixed(0)}%
          </div>
        )}
      </div>

      <div className="p-5 space-y-5">
        {/* Context summary */}
        <div className="grid grid-cols-2 gap-4 text-sm border-b border-white/5 pb-4">
          <div>
            <span className="text-gray-500 block mb-1">Customer Tier</span>
            <span className="text-white font-medium">{activeCase.customer_value_tier}</span>
          </div>
          <div>
            <span className="text-gray-500 block mb-1">Historical Reliability</span>
            <span className="text-white font-medium">
              {activeCase.prior_payments_ontime} on-time, {activeCase.prior_failures} failures
            </span>
          </div>
        </div>

        {/* Guardrail Status */}
        {isStopped ? (
          <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-md">
            <h4 className="flex items-center gap-2 text-red-400 font-medium mb-1 text-sm"><XCircle size={16} /> STOPPED</h4>
            <p className="text-xs text-red-200">Automated recovery blocked by deterministic guardrails.</p>
            {activeCase.dispute_flag && <p className="text-xs text-red-200 mt-1">Reason: Active dispute detected.</p>}
            {activeCase.already_paid_flag && <p className="text-xs text-red-200 mt-1">Reason: Already paid.</p>}
          </div>
        ) : isRecovered ? (
          <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-md">
            <h4 className="flex items-center gap-2 text-green-400 font-medium mb-1 text-sm"><CheckCircle2 size={16} /> RECOVERED</h4>
            <p className="text-xs text-green-200">This case has been successfully recovered.</p>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-green-400 text-xs font-medium">
            <CheckCircle2 size={14} /> GUARDRAILS PASSED
          </div>
        )}

        {/* Diagnosis & Options */}
        {!activeCase.ai_diagnosis ? (
           <div className="text-center py-6">
              <p className="text-gray-400 text-sm mb-4">Analyze context and predict optimal recovery path.</p>
              <button 
                onClick={handleAnalyze} 
                disabled={analyzing || isStopped || isRecovered}
                className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center w-full"
              >
                {analyzing ? <Loader2 className="animate-spin mr-2" size={16} /> : <Zap size={16} className="mr-2" />}
                Analyze Case
              </button>
           </div>
        ) : (
          <>
            <div>
              <h4 className="text-xs text-gray-500 font-semibold tracking-wider mb-2 uppercase flex justify-between">
                <span>AI Diagnosis</span>
                {activeCase.ai_diagnosis.includes("Fallback") && (
                  <span className="text-amber-400">DEMO FALLBACK</span>
                )}
              </h4>
              <p className="text-white text-sm">{activeCase.ai_diagnosis}</p>
            </div>

            {options && options.length > 0 && (
              <div>
                <h4 className="text-xs text-gray-500 font-semibold tracking-wider mb-2 uppercase">Candidate Options</h4>
                <div className="space-y-2 mb-6">
                  {options.map((opt, i: number) => (
                    <div key={i} className={`flex justify-between items-center p-2 rounded text-xs border ${opt.action === activeCase.recommended_action ? 'bg-blue-500/10 border-blue-500/30' : 'border-white/5'}`}>
                      <span className={opt.action === activeCase.recommended_action ? 'text-blue-300 font-medium' : 'text-gray-400'}>{opt.action.replace(/_/g, " ")}</span>
                      <span className="font-mono text-gray-300">₹{opt.expected_recovery.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="text-xs text-gray-500 font-semibold tracking-wider mb-2 uppercase">Recommended Action</h4>
              <div className="bg-blue-500/10 p-4 rounded-md border border-blue-500/20">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-blue-400 font-medium">{activeCase.recommended_action?.replace(/_/g, " ")}</span>
                  {activeCase.customer_name === "Acme Technologies" && activeCase.recommended_action === "WAIT_AND_PAYMENT_LINK" && (
                    <span className="text-[10px] bg-lime-400/20 text-lime-400 px-2 py-0.5 rounded-full border border-lime-400/30 font-medium">HIGHEST EXPECTED VALUE</span>
                  )}
                </div>
                <div className="text-xs text-gray-400 font-mono mb-2">Expected Value: ₹{activeCase.expected_recovery?.toLocaleString()}</div>
                {activeCase.customer_name === "Acme Technologies" && (
                  <p className="text-xs text-blue-200 mt-2 border-t border-blue-500/20 pt-2">
                    Policy Engine Override: Strategic customer protection limits automated escalation. Waiting and sending a payment link preserves relationship while maximizing expected value.
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button 
                onClick={handleExecute}
                disabled={executing || isStopped || isRecovered || activeCase.status !== "ACTIVE"}
                className="flex-1 bg-lime-400 text-black px-4 py-2.5 rounded-md text-sm font-medium hover:bg-lime-500 disabled:opacity-50 flex items-center justify-center transition-colors"
              >
                {executing ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                EXECUTE ACTION
              </button>
              
              <button 
                onClick={handleFailureInjection}
                disabled={executing || isStopped || isRecovered || activeCase.status !== "ACTIVE"}
                className="px-4 py-2.5 border border-white/20 text-white rounded-md text-sm font-medium hover:bg-white/5 flex items-center justify-center transition-colors"
                title="Inject Failure for Demo"
              >
                <AlertTriangle size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
