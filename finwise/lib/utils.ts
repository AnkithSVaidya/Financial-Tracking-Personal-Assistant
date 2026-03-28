import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getBudgetColor(spent: number, budget: number): string {
  if (budget === 0) return "text-gray-400";
  const pct = (spent / budget) * 100;
  if (pct >= 90) return "text-red-400";
  if (pct >= 70) return "text-yellow-400";
  return "text-emerald-400";
}

export function getBudgetBarColor(spent: number, budget: number): string {
  if (budget === 0) return "bg-gray-600";
  const pct = (spent / budget) * 100;
  if (pct >= 90) return "bg-red-500";
  if (pct >= 70) return "bg-yellow-500";
  return "bg-emerald-500";
}

export function getVerdictColor(verdict: string): string {
  if (verdict === "buy") return "text-emerald-400";
  if (verdict === "consider") return "text-yellow-400";
  return "text-red-400";
}

export function getVerdictBg(verdict: string): string {
  if (verdict === "buy") return "bg-emerald-500/20 border-emerald-500/40 text-emerald-300";
  if (verdict === "consider") return "bg-yellow-500/20 border-yellow-500/40 text-yellow-300";
  return "bg-red-500/20 border-red-500/40 text-red-300";
}

export function getVerdictLabel(verdict: string): string {
  if (verdict === "buy") return "✓ Good to Buy";
  if (verdict === "consider") return "~ Consider Carefully";
  return "✗ Don't Buy";
}

export const APPROVED_RETAILERS = [
  "amazon", "walmart", "wayfair", "target", "bestbuy",
  "best buy", "homedepot", "home depot", "costco", "macys",
  "macy's", "nordstrom", "kohls", "kohl's", "ebay",
];

export function isApprovedRetailer(source: string): boolean {
  const lower = source.toLowerCase();
  return APPROVED_RETAILERS.some((r) => lower.includes(r));
}
