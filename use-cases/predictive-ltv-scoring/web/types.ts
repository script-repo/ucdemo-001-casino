export type Tier = "platinum" | "gold" | "silver" | "bronze";
export type Trend = "rising" | "stable" | "declining";
export type ActivityStatus = "active" | "lapsed" | "new";
export type HealthStatus = "healthy" | "stale" | "failed" | "running";
export type TaskId = "host" | "prioritize" | "quality" | "health";

export interface Driver {
  feature: string;
  contribution: number;
  text: string;
  direction: "up" | "down";
  period: string;
}

export interface PlayerScore {
  playerId: number;
  /** Display alias only — not a real name from CMS */
  displayLabel: string;
  tier: Tier;
  property: string;
  hostId: string;
  ltv12m: number | null;
  percentile: number | null;
  intervalLow: number | null;
  intervalHigh: number | null;
  lastVisit: string | null;
  trend: Trend | null;
  activity: ActivityStatus;
  visitCount: number;
  scoredAt: string | null;
  modelVersion: string | null;
  modelLabel: string | null;
  priorLtv12m: number | null;
  drivers: Driver[];
  gamingShare: number | null;
  nonGamingShare: number | null;
}

export interface CalibrationDecile {
  decile: number;
  predictedAvg: number;
  actualAvg: number;
  nPlayers: number;
  pctError: number;
  withinBand: boolean;
}

export interface ModelInfo {
  modelVersion: string;
  modelLabel: string;
  registeredAt: string;
  trainingRows: number;
  trainingThrough: string;
  evalPeriod: string;
  weightedMape: number;
  decilesPassing: number;
  decilesTotal: number;
}

export interface ScoringRun {
  runId: string;
  status: HealthStatus;
  startedAt: string;
  finishedAt: string | null;
  scoredAt: string;
  modelVersion: string;
  modelLabel: string;
  trainingThrough: string;
  recordsProcessed: number;
  recordsScored: number;
  recordsSkipped: number;
  property: string;
  supportOwner: string;
  stages: { name: string; status: "ok" | "warn" | "fail" | "skip"; detail: string }[];
}

export interface PortfolioSummary {
  totalPredictedValue: number;
  priorTotalPredictedValue: number;
  topDecileCount: number;
  risingCount: number;
  unscoredCount: number;
  scoredCount: number;
  calibrationOk: boolean;
  decilesPassing: number;
  decilesTotal: number;
}

export interface ScoreFilters {
  percentileMin: number;
  percentileMax: number;
  tiers: Tier[];
  trend: Trend | "any";
  activity: ActivityStatus | "any";
  lastVisitDays: number | null;
  search: string;
  /** scored = has estimate; unscored = refused; all = both */
  eligibility: "scored" | "unscored" | "all";
  hostId: string | "any";
}

export type SortKey =
  | "ltv12m"
  | "percentile"
  | "lastVisit"
  | "trend"
  | "playerId"
  | "tier";

export interface CohortQuery {
  filters: ScoreFilters;
  sort: SortKey;
  sortDir: "asc" | "desc";
  page: number;
  pageSize: number;
}

export interface CohortResult {
  results: PlayerScore[];
  total: number;
  page: number;
  pageSize: number;
  asOf: string;
  modelVersion: string;
  modelLabel: string;
  property: string;
  unscoredInScope: number;
  scoredInScope: number;
}

export const DEFAULT_FILTERS: ScoreFilters = {
  percentileMin: 0,
  percentileMax: 100,
  tiers: [],
  trend: "any",
  activity: "any",
  lastVisitDays: null,
  search: "",
  eligibility: "scored",
  hostId: "any",
};

export const PRESETS: {
  id: string;
  label: string;
  description: string;
  filters: Partial<ScoreFilters>;
  sort?: SortKey;
  sortDir?: "asc" | "desc";
}[] = [
  {
    id: "top10",
    label: "Top 10% by expected value",
    description: "Highest predicted twelve-month value at this property",
    filters: {
      percentileMin: 90,
      percentileMax: 100,
      eligibility: "scored",
    },
    sort: "ltv12m",
    sortDir: "desc",
  },
  {
    id: "rising",
    label: "Rising players",
    description: "Expected value increasing versus the prior score",
    filters: { trend: "rising", percentileMin: 50, eligibility: "scored" },
    sort: "ltv12m",
    sortDir: "desc",
  },
  {
    id: "active-hv",
    label: "Recently active high-value",
    description: "Top quartile, visited in the last 30 days",
    filters: {
      percentileMin: 75,
      lastVisitDays: 30,
      activity: "active",
      eligibility: "scored",
    },
    sort: "lastVisit",
    sortDir: "desc",
  },
  {
    id: "declining",
    label: "Declining established",
    description: "Gold/platinum players whose expected value is falling",
    filters: {
      tiers: ["platinum", "gold"],
      trend: "declining",
      eligibility: "scored",
    },
    sort: "ltv12m",
    sortDir: "desc",
  },
  {
    id: "unscored",
    label: "Insufficient history",
    description: "Fewer than three carded visits — intentionally not scored",
    filters: {
      eligibility: "unscored",
      percentileMin: 0,
      percentileMax: 100,
      trend: "any",
      activity: "any",
      tiers: [],
    },
    sort: "playerId",
    sortDir: "asc",
  },
];
