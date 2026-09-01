import type { Metrics } from "@/lib/types";
import { formatLakhs } from "@/lib/format";

export function KpiRow({ metrics }: { metrics: Metrics | null }) {
  if (!metrics) return null;

  const cards = [
    { label: "Revenue at Risk", value: formatLakhs(metrics.total_revenue_at_risk), sub: `${metrics.total_cases} cases`, variant: "hero" },
    { label: "Revenue Recovered", value: formatLakhs(metrics.total_recovered), sub: `${metrics.recovered_cases} cases recovered`, variant: "green" },
    { label: "Recovery Rate", value: `${metrics.recovery_rate.toFixed(1)}%`, sub: "of total at-risk revenue", variant: "blue" },
    { label: "Active Cases", value: String(metrics.active_cases), sub: "running recovery", variant: "neutral" },
    { label: "Human Escalations", value: String(metrics.escalated_cases), sub: "requires attention", variant: "amber" },
    { label: "Stopped Cases", value: String(metrics.stopped_cases), sub: "intentionally stopped", variant: "red" },
  ];

  return (
    <div className="kpi-row">
      {cards.map((c) => (
        <div key={c.label} className={`kpi-card kpi-${c.variant}`}>
          <div className="kpi-label">{c.label}</div>
          <div className="kpi-value mono">{c.value}</div>
          <div className="kpi-sub">{c.sub}</div>
        </div>
      ))}
    </div>
  );
}
