import { useCallback, useEffect, useState } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import KpiRow from "./components/KpiRow";
import CasesTable from "./components/CasesTable";
import CaseDetail from "./components/CaseDetail";
import AuditTimeline from "./components/AuditTimeline";
import SystemicMonitor from "./components/SystemicMonitor";
import RunRecoveryBanner from "./components/RunRecoveryBanner";
import { api } from "./api/client";

export default function App() {
  const [cases, setCases] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [systemState, setSystemState] = useState({ active: false });
  const [selectedId, setSelectedId] = useState(null);
  const [auditEvents, setAuditEvents] = useState([]);
  const [busy, setBusy] = useState(false);
  const [execResult, setExecResult] = useState(null);
  const [runStage, setRunStage] = useState(null);
  const [runSummary, setRunSummary] = useState(null);

  const refreshCases = useCallback(async () => {
    const data = await api.listCases();
    setCases(data);
    return data;
  }, []);

  const refreshMetrics = useCallback(async () => {
    const data = await api.getMetrics();
    setMetrics(data);
  }, []);

  const refreshSystemStatus = useCallback(async () => {
    const data = await api.systemStatus();
    setSystemState(data.systemic_incident);
  }, []);

  const refreshAudit = useCallback(async (caseId) => {
    if (!caseId) return;
    const events = await api.getAudit(caseId);
    setAuditEvents(events);
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

  async function handleSelect(id) {
    setSelectedId(id);
  }

  async function handleAnalyze(id) {
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

  async function handleExecute(id) {
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

  async function handleInjectFailure(id, type) {
    setBusy(true);
    try {
      const res = await api.injectFailure(id, type);
      if (res.case?.decision) setExecResult(null);
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
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Header onRunRecovery={handleRunRecovery} running={runStage !== null} />
        <div className="app-content">
          <RunRecoveryBanner stage={runStage} summary={runSummary} />
          <KpiRow metrics={metrics} />

          <div className="workspace">
            <CasesTable cases={cases} selectedId={selectedId} onSelect={handleSelect} />
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

          <SystemicMonitor
            state={systemState}
            onTrigger={handleTriggerSystemic}
            onReset={handleResetSystemic}
            busy={busy}
          />
        </div>
      </div>
    </div>
  );
}
