/**
 * Admin-side currency display helpers.
 * Currency is read from Store.currency. PKR shows no decimals (no paise).
 */

/**
 * All money is stored in DB as integer minor units (paise/cents) — always × 100.
 * Display rules vary by currency: PKR shows whole rupees (no decimals); USD shows cents.
 */
const NO_DECIMAL = new Set(["PKR", "JPY", "KRW", "VND", "IDR"]);

export function currencyConfig(code: string) {
  const noDecimal = NO_DECIMAL.has(code.toUpperCase());
  const symbol =
    code === "PKR" ? "Rs" :
    code === "USD" ? "$" :
    code === "EUR" ? "€" :
    code === "GBP" ? "£" :
    code === "INR" ? "₹" :
    code === "AED" ? "د.إ" :
    code;
  return { symbol, decimals: noDecimal ? 0 : 2 };
}

/** Convert UI-entered major amount (rupees/dollars) to integer minor units (always × 100). */
export function toMinor(uiAmount: number, _currency: string): number {
  return Math.round(uiAmount * 100);
}

/** Convert DB integer minor units back to a number for UI inputs. */
export function toMajor(minor: number, _currency: string): number {
  return minor / 100;
}

/** Format a minor-unit amount for display (e.g. "Rs 4,500" or "$45.00"). */
export function formatMinor(minor: number, currency: string): string {
  const { symbol, decimals } = currencyConfig(currency);
  const amount = minor / 100;
  const formatted = amount.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${symbol} ${formatted}`;
}

/** Calculate compareAtPrice from basePrice + discount percentage. */
export function compareAtFromDiscount(basePriceMinor: number, percentOff: number): number {
  if (percentOff <= 0 || percentOff >= 100) return 0;
  return Math.round(basePriceMinor / (1 - percentOff / 100));
}

/** Calculate discount percentage from compareAt + base. */
export function discountFromCompareAt(basePriceMinor: number, compareAtMinor: number): number {
  if (!compareAtMinor || compareAtMinor <= basePriceMinor) return 0;
  return Math.round(((compareAtMinor - basePriceMinor) / compareAtMinor) * 100);
}
