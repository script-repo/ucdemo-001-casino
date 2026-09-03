/**
 * Placeholder content for the dashboard's activity, insight, and headline
 * metric panels.
 *
 * None of this is measured. It exists so the dashboard reads as a working
 * surface while the use cases are still scaffolds, and it is isolated in one
 * file so there is exactly one place to delete when real telemetry lands.
 *
 * Everything genuinely derived from the system — the application catalogue and
 * shared-resource readiness — is read from the registry and the environment
 * instead, and is not in this file.
 */
import type { IconName } from "@/components/icons";

export interface HeadlineMetric {
  label: string;
  value: string;
  delta: string;
  icon: IconName;
}

export const HEADLINE_METRICS: HeadlineMetric[] = [
  { label: "Active users", value: "4,782", delta: "+12%", icon: "users" },
  { label: "Saved hours", value: "12,540", delta: "+18%", icon: "clock" },
  { label: "AI workflows run", value: "92", delta: "+15%", icon: "checkShield" },
  { label: "Business impact", value: "$1.24M", delta: "+16%", icon: "trendingUp" },
];

export interface ActivityItem {
  text: string;
  when: string;
  icon: IconName;
}

export const RECENT_ACTIVITY: ActivityItem[] = [
  { text: "Ran Dynamic Offer Engine", when: "2m ago", icon: "zap" },
  { text: "Viewed Churn-Risk Modeling", when: "11m ago", icon: "eye" },
  { text: "Ran Slot & Table Performance", when: "21m ago", icon: "dice" },
  { text: "Favourited Predictive LTV Scoring", when: "3h ago", icon: "star" },
  { text: "Exported the revenue dashboard", when: "5h ago", icon: "chart" },
];

export interface InsightItem {
  title: string;
  when: string;
}

export const FEATURED_INSIGHTS: InsightItem[] = [
  { title: "Q2 gaming performance brief", when: "Updated 1 day ago" },
  { title: "Weekend occupancy forecast", when: "Updated 6 hours ago" },
  { title: "High-value player trends", when: "Updated 2 days ago" },
];

export const DEMO_USER = {
  name: "Alexandra Lee",
  role: "Global Strategy",
  initials: "AL",
};
