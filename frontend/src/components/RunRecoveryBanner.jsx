export default function RunRecoveryBanner({ stage, summary }) {
  if (!stage) return null;

  const steps = [
    { key: "analyzing", label: `Analyzing ${summary?.total ?? 20} cases` },
    { key: "breakdown", label: summary ? `${summary.recoverable} recoverable · ${summary.escalate} need review · ${summary.stopped} stopped` : "" },
    { key: "done", label: "Recovery pass complete" },
  ];

  return (
    <div className="run-banner">
      {steps.map((s, i) => (
        <div key={s.key} className={`run-step ${stageIndex(stage) >= i ? "run-step-active" : ""}`}>
          {s.label}
        </div>
      ))}
    </div>
  );
}

function stageIndex(stage) {
  return { analyzing: 0, breakdown: 1, done: 2 }[stage] ?? 0;
}
