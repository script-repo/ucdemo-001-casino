import type { ActivityStatus, Tier, Trend } from "./types";

export function money(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function moneyCompact(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

export function pct(n: number): string {
  return `${n}%`;
}

export function tierLabel(t: Tier): string {
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function trendLabel(t: Trend | null): string {
  if (!t) return "—";
  if (t === "rising") return "Rising";
  if (t === "declining") return "Declining";
  return "Stable";
}

export function activityLabel(a: ActivityStatus): string {
  if (a === "active") return "Active";
  if (a === "lapsed") return "Lapsed";
  return "New";
}

export function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "America/Los_Angeles",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatDate(isoDate: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeZone: "UTC",
    }).format(new Date(`${isoDate}T12:00:00Z`));
  } catch {
    return isoDate;
  }
}

export function rankPhrase(percentile: number): string {
  if (percentile >= 99) return "top 1%";
  if (percentile >= 90) return `top ${100 - percentile}%`;
  return `higher than ${percentile}% of players`;
}
