export function formatLakhs(amount) {
  if (amount === null || amount === undefined) return "—";
  const lakhs = amount / 100000;
  return `₹${lakhs.toFixed(2)}L`;
}

export function formatRupees(amount) {
  if (amount === null || amount === undefined) return "—";
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

export function formatCompact(amount) {
  if (amount === null || amount === undefined) return "—";
  if (amount >= 100000) return formatLakhs(amount);
  return formatRupees(amount);
}

export const STATUS_META = {
  pending: { label: "Pending", color: "blue" },
  recovering: { label: "Recovering", color: "blue" },
  recovered: { label: "Recovered", color: "green" },
  escalated: { label: "Escalated", color: "amber" },
  stopped: { label: "Stopped", color: "red" },
  failed: { label: "Failed", color: "red" },
};
