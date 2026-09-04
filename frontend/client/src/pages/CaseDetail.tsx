import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { AppShell, ScreenHeader } from "../components/AppShell";
import CaseIntelligence from "../components/reco/CaseIntelligence";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function CaseDetail() {
  const [, params] = useRoute("/cases/:id");
  const caseId = params?.id;
  const [caseData, setCaseData] = useState<any>(null);

  useEffect(() => {
    if (caseId) {
      fetch(`/api/cases/${caseId}`).then(res => res.json()).then(setCaseData);
    }
  }, [caseId]);

  if (!caseData) return <AppShell><div className="p-8 text-white">Loading...</div></AppShell>;

  return (
    <AppShell>
      <div className="workspace-content">
        <Link href="/" className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-6">
          <ArrowLeft size={14} className="mr-2" /> Back to Dashboard
        </Link>
        <ScreenHeader 
          eyebrow="CASE DETAILS" 
          title={caseData.customer_name} 
          accent={`₹${caseData.invoice_amount.toLocaleString()}`}
          detail={`${caseData.days_overdue} days overdue (INV-${caseData.invoice_id.substring(0,6)})`}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
          <div className="space-y-6">
            <div className="module-panel p-6">
              <h3 className="text-lg font-medium text-white mb-4">Customer Profile</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-gray-400">Value Tier</span>
                  <span className="text-white">{caseData.customer_value_tier}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-gray-400">Prior On-Time Payments</span>
                  <span className="text-white">{caseData.prior_payments_ontime}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-gray-400">Prior Failures</span>
                  <span className="text-white">{caseData.prior_failures}</span>
                </div>
                <div className="flex justify-between pb-2">
                  <span className="text-gray-400">Payment Rail</span>
                  <span className="text-white">{caseData.payment_rail}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <CaseIntelligence caseData={caseData} onUpdate={() => {
              fetch(`/api/cases/${caseId}`).then(res => res.json()).then(setCaseData);
            }} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
