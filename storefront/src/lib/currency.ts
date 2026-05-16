/**
 * Currency helpers. Admin stores money as integer minor units (paise).
 * Display in PKR: `Rs 4,500`. No decimals for retail in Pakistan.
 *
 * Conversion rule: PKR amounts are stored as paise (1 PKR = 100 paise).
 * If a future amount is already whole PKR, pass `{ minor: false }`.
 */

const fmt = new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 });

export function formatPKR(amount: number, opts?: { minor?: boolean }): string {
  const minor = opts?.minor ?? true;
  const rupees = minor ? Math.round(amount / 100) : amount;
  return `Rs ${fmt.format(rupees)}`;
}

export function formatPKRRange(min: number, max: number): string {
  if (min === max) return formatPKR(min);
  return `${formatPKR(min)} – ${formatPKR(max)}`;
}

export function discountPercent(originalMinor: number, currentMinor: number): number {
  if (!originalMinor || originalMinor <= currentMinor) return 0;
  return Math.round(((originalMinor - currentMinor) / originalMinor) * 100);
}
