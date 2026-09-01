type Stage = "analyzing" | "breakdown" | "done" | null;

export function RunRecoveryBanner({
  stage,
  summary,
}: {
  stage: Stage;
  summary: { total: number; recoverable: number; escalate: number; stopped: number } | null;
}) {
  if (!stage) return null;

  const order: Record<string, number> = { analyzing: 0, breakdown: 1, done: 2 };
  const steps = [
    { key: "analyzing", label: `Analyzing ${summary?.total ?? 20} cases` },
    {
      key: "breakdown",
      label: summary ? `${summary.recoverable} recoverable · ${summary.escalate} need review · ${summary.stopped} stopped` : "",
    },
    { key: "done", label: "Recovery pass complete" },
  ];

  return (
    <div className="run-banner">
      {steps.map((s, i) => (
        <div key={s.key} className={`run-step ${order[stage] >= i ? "run-step-active" : ""}`}>
          {s.label}
        </div>
      ))}
    </div>
  );
}
