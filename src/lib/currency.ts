/**
 * Format a numeric value as Indian Rupees (INR).
 * formatINR(499)   -> "₹499"
 * formatINR(2499)  -> "₹2,499"
 * formatINR(0)     -> "Free"
 */
export function formatINR(value: number | null | undefined, opts: { freeLabel?: string | null } = {}): string {
  const n = Number(value || 0);
  if (!n || n <= 0) return opts.freeLabel ?? "Free";
  return "₹" + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
}

export const CURRENCY_CODE = "INR";
export const CURRENCY_SYMBOL = "₹";