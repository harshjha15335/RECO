import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { KpiRow } from "@/components/KpiRow";
import { CasesTable } from "@/components/CasesTable";
import { CaseDetail } from "@/components/CaseDetail";
import { AuditTimeline } from "@/components/AuditTimeline";
import { SystemicMonitor } from "@/components/SystemicMonitor";
import { RunRecoveryBanner } from "@/components/RunRecoveryBanner";
import { api } from "@/lib/api";
import type { AuditEvent, ExecuteResult, Metrics, RecoveryCase, SystemicIncident } from "@/lib/types";

type RunStage = "analyzing" | "breakdown" | "done" | null;

export default function Dashboard() {
  const [cases, setCases] = useState<RecoveryCase[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [systemState, setSystemState] = useState<SystemicIncident>({ active: false });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [busy, setBusy] = useState(false);
  const [execResult, setExecResult] = useState<ExecuteResult | null>(null);
  const [runStage, setRunStage] = useState<RunStage>(null);
  const [runSummary, setRunSummary] = useState<{ total: number; recoverable: number; escalate: number; stopped: number } | null>(null);

  const refreshCases = useCallback(async () => {
    const data = await api.listCases();
    setCases(data);
    return data;
  }, []);

  const refreshMetrics = useCallback(async () => {
    setMetrics(await api.getMetrics());
  }, []);

  const refreshSystemStatus = useCallback(async () => {
    const data = await api.systemStatus();
    setSystemState(data.systemic_incident);
  }, []);

  const refreshAudit = useCallback(async (caseId: string | null) => {
    if (!caseId) return;
    setAuditEvents(await api.getAudit(caseId));
  }, []);

  const refreshAll = useCallback(async () => {
    const data = await refreshCases();
    await refreshMetrics();
    await refreshSystemStatus();
    return data;
  }, [refreshCases, refreshMetrics, refreshSystemStatus]);

  useEffect(() => {
    refreshAll().then((data) => {
      if (data.length) setSelectedId(data[0].case_id);
    });
  }, [refreshAll]);

  useEffect(() => {
    setExecResult(null);
    refreshAudit(selectedId);
  }, [selectedId, refreshAudit]);

  const selectedCase = cases.find((c) => c.case_id === selectedId) || null;

  async function handleAnalyze(id: string) {
    setBusy(true);
    try {
      await api.analyzeCase(id);
      await refreshCases();
      await refreshMetrics();
      await refreshAudit(id);
    } finally {
      setBusy(false);
    }
  }

  async function handleExecute(id: string) {
    setBusy(true);
    setExecResult(null);
    try {
      const res = await api.executeCase(id);
      setExecResult(res.result || null);
      await refreshCases();
      await refreshMetrics();
      await refreshAudit(id);
    } finally {
      setBusy(false);
    }
  }

  async function handleInjectFailure(id: string, type: "gateway") {
    setBusy(true);
    try {
      await api.injectFailure(id, type);
      await refreshCases();
      await refreshMetrics();
      await refreshAudit(id);
      await refreshSystemStatus();
    } finally {
      setBusy(false);
    }
  }

  async function handleTriggerSystemic() {
    if (!selectedCase) return;
    setBusy(true);
    try {
      await api.injectFailure(selectedCase.case_id, "systemic");
      await refreshAll();
      await refreshAudit(selectedId);
    } finally {
      setBusy(false);
    }
  }

  async function handleResetSystemic() {
    setBusy(true);
    try {
      await api.resetSystemic();
      await refreshSystemStatus();
    } finally {
      setBusy(false);
    }
  }

  async function handleRunRecovery() {
    setRunStage("analyzing");
    setRunSummary(null);
    const before = await refreshCases();
    const unanalyzed = before.filter((c) => !c.decision);

    for (const c of unanalyzed) {
      await api.analyzeCase(c.case_id);
    }

    const after = await refreshCases();
    const recoverable = after.filter((c) => ["pending", "recovering", "recovered"].includes(c.status)).length;
    const escalate = after.filter((c) => c.status === "escalated").length;
    const stopped = after.filter((c) => c.status === "stopped").length;

    setRunSummary({ total: after.length, recoverable, escalate, stopped });
    setRunStage("breakdown");

    await new Promise((r) => setTimeout(r, 900));
    setRunStage("done");
    await refreshMetrics();
    await refreshAudit(selectedId);

    await new Promise((r) => setTimeout(r, 1400));
    setRunStage(null);
  }

  return (
    <AppShell>
      <section className="dashboard-topline" aria-labelledby="dashboard-heading">
        <div>
          <p className="eyebrow">Revenue Recovery Control Tower</p>
          <h1 id="dashboard-heading" className="dashboard-title">
            Intelligent decisions. <span className="signal">Responsible recovery.</span>
          </h1>
          <p className="synced-copy">
            <strong>●</strong> {cases.length} cases loaded
          </p>
        </div>
        <button className="run-recovery-btn" onClick={handleRunRecovery} disabled={runStage !== null}>
          {runStage !== null ? "Running…" : "Run Recovery"}
        </button>
      </section>

      <RunRecoveryBanner stage={runStage} summary={runSummary} />
      <KpiRow metrics={metrics} />

      <div className="workspace">
        <CasesTable cases={cases} selectedId={selectedId} onSelect={setSelectedId} />
        <CaseDetail
          caseData={selectedCase}
          onAnalyze={handleAnalyze}
          onExecute={handleExecute}
          onInjectFailure={handleInjectFailure}
          busy={busy}
          execResult={execResult}
        />
        <AuditTimeline events={auditEvents} caseId={selectedId} />
      </div>

      <SystemicMonitor state={systemState} onTrigger={handleTriggerSystemic} onReset={handleResetSystemic} busy={busy} />
    </AppShell>
  );
}
