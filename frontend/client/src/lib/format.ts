export function formatLakhs(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "—";
  return `₹${(amount / 100000).toFixed(2)}L`;
}

export function formatRupees(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "—";
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

export function formatCompact(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "—";
  if (amount >= 100000) return formatLakhs(amount);
  return formatRupees(amount);
}

export function formatTime(ts: string): string {
  try {
    return new Date(ts).toLocaleTimeString("en-IN", { hour12: false });
  } catch {
    return ts;
  }
}
