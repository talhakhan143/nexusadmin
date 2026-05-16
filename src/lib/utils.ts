import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const NO_DECIMAL_CURRENCIES = new Set(["PKR", "JPY", "KRW", "VND", "IDR"]);
const CURRENCY_SYMBOLS: Record<string, string> = {
  PKR: "Rs", USD: "$", EUR: "€", GBP: "£", INR: "₹", AED: "د.إ",
};

export function formatCurrency(
  amountInMinorUnits: number,
  currency = "USD",
  locale = "en-US"
): string {
  const noDecimal = NO_DECIMAL_CURRENCIES.has(currency.toUpperCase());
  const amount = amountInMinorUnits / 100;
  const symbol = CURRENCY_SYMBOLS[currency.toUpperCase()] ?? currency;
  const formatted = amount.toLocaleString(locale, {
    minimumFractionDigits: noDecimal ? 0 : 2,
    maximumFractionDigits: noDecimal ? 0 : 2,
  });
  return `${symbol} ${formatted}`;
}

export function formatDate(date: Date | string, locale = "en-US"): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string, locale = "en-US"): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 100000).toString().padStart(5, "0");
  return `NX-${year}-${rand}`;
}

export function truncate(str: string, length = 50): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "…";
}
