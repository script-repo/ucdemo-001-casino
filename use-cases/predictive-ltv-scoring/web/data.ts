/**
 * Seeded mock scoring store for the MVP. Replaces Postgres + nightly jobs until
 * the casino data platform is live. Deterministic so demos stay stable.
 */

import type {
  CalibrationDecile,
  CohortQuery,
  CohortResult,
  Driver,
  ModelInfo,
  PlayerScore,
  PortfolioSummary,
  ScoreFilters,
  ScoringRun,
  Tier,
  Trend,
} from "./types";

const PROPERTY = "Locals Pilot — Desert Springs";
const MODEL_VERSION = "mlflow:run:8f2c1d7a4b91";
const MODEL_LABEL = "Version 2.4";
const SCORED_AT = "2026-08-06T02:00:00-07:00";
const TRAINING_THROUGH = "2026-08-05";
const STALE_HOURS = 36;

function mulberry32(seed: number) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260806);

function pick<T>(items: T[]): T {
  return items[Math.floor(rand() * items.length)]!;
}

function daysAgo(n: number): string {
  const d = new Date("2026-08-06T12:00:00-07:00");
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

const TIERS: Tier[] = ["platinum", "gold", "silver", "bronze"];
const HOSTS = ["H-104", "H-118", "H-122", "H-131", "H-140", "unassigned"];

function buildDrivers(trend: Trend, tier: Tier): Driver[] {
  const poolUp: Driver[] = [
    {
      feature: "visit_frequency_6m",
      contribution: 420 + rand() * 400,
      text: "Visits increased over the last six months",
      direction: "up",
      period: "Last 6 months",
    },
    {
      feature: "non_gaming_spend",
      contribution: 180 + rand() * 320,
      text: "Hotel and dining spend rose versus the prior period",
      direction: "up",
      period: "Last 12 months",
    },
    {
      feature: "recency",
      contribution: 90 + rand() * 200,
      text: "Recent visit frequency improved",
      direction: "up",
      period: "Last 90 days",
    },
    {
      feature: "tier_migration",
      contribution: 150 + rand() * 250,
      text: "Loyalty tier improved during the observation window",
      direction: "up",
      period: "Last 12 months",
    },
    {
      feature: "trip_length",
      contribution: 80 + rand() * 160,
      text: "Average trip length lengthened",
      direction: "up",
      period: "Last 6 months",
    },
  ];
  const poolDown: Driver[] = [
    {
      feature: "theo_per_visit_trend",
      contribution: -(120 + rand() * 280),
      text: "Average expected gaming revenue per visit eased",
      direction: "down",
      period: "Last 6 months",
    },
    {
      feature: "game_mix",
      contribution: -(60 + rand() * 140),
      text: "Play concentrated in lower-hold products",
      direction: "down",
      period: "Last 90 days",
    },
    {
      feature: "gap_widening",
      contribution: -(100 + rand() * 200),
      text: "Gaps between visits widened versus personal baseline",
      direction: "down",
      period: "Last 6 months",
    },
    {
      feature: "fnb_softness",
      contribution: -(40 + rand() * 120),
      text: "Food-and-beverage spend softened",
      direction: "down",
      period: "Last 6 months",
    },
  ];

  const ups = [...poolUp].sort(() => rand() - 0.5).slice(0, trend === "declining" ? 1 : 2);
  const downs = [...poolDown]
    .sort(() => rand() - 0.5)
    .slice(0, trend === "rising" ? 1 : 2);

  if (tier === "platinum" && ups[0]) {
    ups[0] = {
      ...ups[0],
      contribution: ups[0].contribution * 1.4,
    };
  }

  return [...ups, ...downs].sort(
    (a, b) => Math.abs(b.contribution) - Math.abs(a.contribution),
  );
}

function buildPlayers(): PlayerScore[] {
  const players: PlayerScore[] = [];
  const n = 120;

  for (let i = 0; i < n; i++) {
    const playerId = 100100 + i;
    const visitCount = i % 17 === 0 ? 1 + Math.floor(rand() * 2) : 3 + Math.floor(rand() * 40);
    const insufficient = visitCount < 3;
    const tier = pick(TIERS);
    const hostId = pick(HOSTS);
    const activityRoll = rand();
    const activity =
      activityRoll > 0.85 ? "lapsed" : activityRoll > 0.92 ? "new" : "active";

    if (insufficient) {
      players.push({
        playerId,
        displayLabel: `Player ${playerId}`,
        tier,
        property: PROPERTY,
        hostId,
        ltv12m: null,
        percentile: null,
        intervalLow: null,
        intervalHigh: null,
        lastVisit: activity === "new" ? daysAgo(Math.floor(rand() * 20)) : daysAgo(Math.floor(rand() * 120)),
        trend: null,
        activity,
        visitCount,
        scoredAt: null,
        modelVersion: null,
        modelLabel: null,
        priorLtv12m: null,
        drivers: [],
        gamingShare: null,
        nonGamingShare: null,
      });
      continue;
    }

    // Long-tail value distribution
    const u = rand();
    const base = Math.pow(u, 2.4) * 240000 + 800;
    const tierBoost =
      tier === "platinum" ? 1.8 : tier === "gold" ? 1.35 : tier === "silver" ? 1.0 : 0.7;
    const ltv12m = Math.round(base * tierBoost);
    const priorFactor = 0.82 + rand() * 0.36;
    const priorLtv12m = Math.round(ltv12m * priorFactor);
    const delta = ltv12m - priorLtv12m;
    const trend: Trend =
      delta > ltv12m * 0.08 ? "rising" : delta < -ltv12m * 0.08 ? "declining" : "stable";
    const intervalWidth = 0.18 + rand() * 0.08;
    const drivers = buildDrivers(trend, tier);
    const gamingShare = 0.55 + rand() * 0.35;

    players.push({
      playerId,
      displayLabel: `Player ${playerId}`,
      tier,
      property: PROPERTY,
      hostId,
      ltv12m,
      percentile: 0, // filled after sort
      intervalLow: Math.round(ltv12m * (1 - intervalWidth)),
      intervalHigh: Math.round(ltv12m * (1 + intervalWidth)),
      lastVisit: daysAgo(
        activity === "lapsed"
          ? 45 + Math.floor(rand() * 80)
          : Math.floor(rand() * 40),
      ),
      trend,
      activity,
      visitCount,
      scoredAt: SCORED_AT,
      modelVersion: MODEL_VERSION,
      modelLabel: MODEL_LABEL,
      priorLtv12m,
      drivers,
      gamingShare,
      nonGamingShare: 1 - gamingShare,
    });
  }

  const scored = players
    .filter((p) => p.ltv12m != null)
    .sort((a, b) => (b.ltv12m ?? 0) - (a.ltv12m ?? 0));

  scored.forEach((p, idx) => {
    p.percentile = Math.max(
      1,
      Math.min(100, Math.round((1 - idx / (scored.length - 1)) * 100)),
    );
  });

  return players.sort((a, b) => a.playerId - b.playerId);
}

const PLAYERS = buildPlayers();

function buildCalibration(): CalibrationDecile[] {
  const deciles: CalibrationDecile[] = [];
  for (let d = 1; d <= 10; d++) {
    const predictedAvg = 400 + d * d * 380 + rand() * 120;
    // Mostly inside ±15%; deciles 1 and 9 slightly off for demo realism
    const bias =
      d === 1 ? 0.18 : d === 9 ? -0.17 : (rand() - 0.5) * 0.12;
    const actualAvg = predictedAvg * (1 + bias);
    const pctError = ((predictedAvg - actualAvg) / actualAvg) * 100;
    deciles.push({
      decile: d,
      predictedAvg: Math.round(predictedAvg),
      actualAvg: Math.round(actualAvg),
      nPlayers: 480 + Math.floor(rand() * 40),
      pctError: Math.round(pctError * 10) / 10,
      withinBand: Math.abs(pctError) <= 15,
    });
  }
  return deciles;
}

const CALIBRATION = buildCalibration();

export const CURRENT_RUN: ScoringRun = {
  runId: "ltv-score-20260806-0200",
  status: "healthy",
  startedAt: "2026-08-06T01:42:00-07:00",
  finishedAt: "2026-08-06T02:00:00-07:00",
  scoredAt: SCORED_AT,
  modelVersion: MODEL_VERSION,
  modelLabel: MODEL_LABEL,
  trainingThrough: TRAINING_THROUGH,
  recordsProcessed: PLAYERS.length,
  recordsScored: PLAYERS.filter((p) => p.ltv12m != null).length,
  recordsSkipped: PLAYERS.filter((p) => p.ltv12m == null).length,
  property: PROPERTY,
  supportOwner: "platform-data@example.com",
  stages: [
    { name: "Source extraction", status: "ok", detail: "cms_raw snapshots loaded" },
    { name: "Feature creation", status: "ok", detail: `${PLAYERS.length} feature rows` },
    { name: "Model loading", status: "ok", detail: MODEL_LABEL },
    { name: "Scoring", status: "ok", detail: "Full population rescore" },
    { name: "Database write", status: "ok", detail: "Atomic publish completed" },
    {
      name: "Calibration validation",
      status: CALIBRATION.every((d) => d.withinBand) ? "ok" : "warn",
      detail: `${CALIBRATION.filter((d) => d.withinBand).length}/10 deciles within ±15%`,
    },
  ],
};

export const CURRENT_MODEL: ModelInfo = {
  modelVersion: MODEL_VERSION,
  modelLabel: MODEL_LABEL,
  registeredAt: "2026-07-28T16:10:00-07:00",
  trainingRows: 48211,
  trainingThrough: TRAINING_THROUGH,
  evalPeriod: "2025-02-01 → 2025-07-31",
  weightedMape:
    Math.round(
      (CALIBRATION.reduce((s, d) => s + Math.abs(d.pctError) * d.nPlayers, 0) /
        CALIBRATION.reduce((s, d) => s + d.nPlayers, 0)) *
        10,
    ) / 10,
  decilesPassing: CALIBRATION.filter((d) => d.withinBand).length,
  decilesTotal: 10,
};

function matchesFilters(p: PlayerScore, f: ScoreFilters): boolean {
  const unscored = p.ltv12m == null;
  if (f.eligibility === "scored" && unscored) return false;
  if (f.eligibility === "unscored" && !unscored) return false;

  if (!unscored) {
    const pct = p.percentile ?? 0;
    if (pct < f.percentileMin || pct > f.percentileMax) return false;
  }

  if (f.tiers.length > 0 && !f.tiers.includes(p.tier)) return false;
  if (f.trend !== "any" && p.trend !== f.trend) return false;
  if (f.activity !== "any" && p.activity !== f.activity) return false;
  if (f.hostId !== "any" && p.hostId !== f.hostId) return false;

  if (f.lastVisitDays != null && p.lastVisit) {
    const last = new Date(`${p.lastVisit}T00:00:00`);
    const cutoff = new Date("2026-08-06T00:00:00");
    cutoff.setDate(cutoff.getDate() - f.lastVisitDays);
    if (last < cutoff) return false;
  }

  if (f.search.trim()) {
    const q = f.search.trim().toLowerCase();
    if (
      !String(p.playerId).includes(q) &&
      !p.displayLabel.toLowerCase().includes(q) &&
      !p.hostId.toLowerCase().includes(q)
    ) {
      return false;
    }
  }

  return true;
}

const TREND_RANK: Record<string, number> = {
  rising: 2,
  stable: 1,
  declining: 0,
};

const TIER_RANK: Record<Tier, number> = {
  platinum: 4,
  gold: 3,
  silver: 2,
  bronze: 1,
};

export function queryCohort(query: CohortQuery): CohortResult {
  const filtered = PLAYERS.filter((p) => matchesFilters(p, query.filters));
  const sorted = [...filtered].sort((a, b) => {
    const dir = query.sortDir === "asc" ? 1 : -1;
    switch (query.sort) {
      case "ltv12m":
        return dir * ((a.ltv12m ?? -1) - (b.ltv12m ?? -1));
      case "percentile":
        return dir * ((a.percentile ?? -1) - (b.percentile ?? -1));
      case "lastVisit":
        return dir * String(a.lastVisit ?? "").localeCompare(String(b.lastVisit ?? ""));
      case "trend":
        return (
          dir *
          ((TREND_RANK[a.trend ?? ""] ?? -1) - (TREND_RANK[b.trend ?? ""] ?? -1))
        );
      case "tier":
        return dir * (TIER_RANK[a.tier] - TIER_RANK[b.tier]);
      case "playerId":
      default:
        return dir * (a.playerId - b.playerId);
    }
  });

  const start = (query.page - 1) * query.pageSize;
  const results = sorted.slice(start, start + query.pageSize);

  return {
    results,
    total: sorted.length,
    page: query.page,
    pageSize: query.pageSize,
    asOf: TRAINING_THROUGH,
    modelVersion: MODEL_VERSION,
    modelLabel: MODEL_LABEL,
    property: PROPERTY,
    unscoredInScope: PLAYERS.filter((p) => p.ltv12m == null).length,
    scoredInScope: PLAYERS.filter((p) => p.ltv12m != null).length,
  };
}

export function getPlayer(playerId: number): PlayerScore | null {
  return PLAYERS.find((p) => p.playerId === playerId) ?? null;
}

export function getCalibration(): CalibrationDecile[] {
  return CALIBRATION;
}

export function getModel(): ModelInfo {
  return CURRENT_MODEL;
}

export function getRun(): ScoringRun {
  return CURRENT_RUN;
}

export function getSummary(): PortfolioSummary {
  const scored = PLAYERS.filter((p) => p.ltv12m != null);
  const total = scored.reduce((s, p) => s + (p.ltv12m ?? 0), 0);
  const prior = scored.reduce((s, p) => s + (p.priorLtv12m ?? 0), 0);
  return {
    totalPredictedValue: total,
    priorTotalPredictedValue: prior,
    topDecileCount: scored.filter((p) => (p.percentile ?? 0) >= 90).length,
    risingCount: scored.filter((p) => p.trend === "rising").length,
    unscoredCount: PLAYERS.filter((p) => p.ltv12m == null).length,
    scoredCount: scored.length,
    calibrationOk: CURRENT_MODEL.decilesPassing >= 8,
    decilesPassing: CURRENT_MODEL.decilesPassing,
    decilesTotal: CURRENT_MODEL.decilesTotal,
  };
}

export function getStaleHours(): number {
  return STALE_HOURS;
}

export function hoursSinceScore(scoredAt: string = SCORED_AT): number {
  const scored = new Date(scoredAt).getTime();
  const now = new Date("2026-08-06T14:30:00-07:00").getTime();
  return (now - scored) / (1000 * 60 * 60);
}

export function exportCohortCsv(filters: ScoreFilters): {
  csv: string;
  count: number;
  meta: {
    modelVersion: string;
    modelLabel: string;
    scoreDate: string;
    property: string;
    exportedAt: string;
  };
} {
  const { results, total } = queryCohort({
    filters,
    sort: "ltv12m",
    sortDir: "desc",
    page: 1,
    pageSize: 10_000,
  });

  const header = [
    "player_id",
    "tier",
    "property",
    "host_id",
    "expected_value_12m",
    "property_percentile",
    "interval_low",
    "interval_high",
    "trend",
    "activity",
    "last_visit",
    "visit_count",
    "model_version",
    "model_label",
    "scored_at",
    "score_date",
  ].join(",");

  const rows = results.map((p) =>
    [
      p.playerId,
      p.tier,
      JSON.stringify(p.property),
      p.hostId,
      p.ltv12m ?? "",
      p.percentile ?? "",
      p.intervalLow ?? "",
      p.intervalHigh ?? "",
      p.trend ?? "",
      p.activity,
      p.lastVisit ?? "",
      p.visitCount,
      p.modelVersion ?? "",
      p.modelLabel ?? "",
      p.scoredAt ?? "",
      TRAINING_THROUGH,
    ].join(","),
  );

  const metaLines = [
    `# classification: Internal — player analytics`,
    `# property: ${PROPERTY}`,
    `# model_label: ${MODEL_LABEL}`,
    `# model_version: ${MODEL_VERSION}`,
    `# score_date: ${TRAINING_THROUGH}`,
    `# scored_at: ${SCORED_AT}`,
    `# exported_at: 2026-08-06T14:30:00-07:00`,
    `# record_count: ${total}`,
    `# note: Expected value is a prediction, not an approved reinvestment amount.`,
  ];

  return {
    csv: [...metaLines, header, ...rows].join("\n"),
    count: total,
    meta: {
      modelVersion: MODEL_VERSION,
      modelLabel: MODEL_LABEL,
      scoreDate: TRAINING_THROUGH,
      property: PROPERTY,
      exportedAt: "2026-08-06T14:30:00-07:00",
    },
  };
}

export function buildNarrative(p: PlayerScore): string {
  if (p.ltv12m == null) {
    return `We cannot calculate a reliable estimate yet. This player has ${p.visitCount} recorded visit${p.visitCount === 1 ? "" : "s"}; at least three carded visits are required. Withholding an unreliable estimate is intentional.`;
  }

  const value = formatMoney(p.ltv12m);
  const rank = p.percentile ?? 0;
  const top = rank >= 90 ? `the top ${100 - rank}%` : `higher than ${rank}% of players`;
  const range =
    p.intervalLow != null && p.intervalHigh != null
      ? ` The likely range is ${formatMoney(p.intervalLow)}–${formatMoney(p.intervalHigh)}.`
      : "";

  const up = p.drivers.filter((d) => d.direction === "up").slice(0, 2);
  const down = p.drivers.filter((d) => d.direction === "down").slice(0, 1);
  const whyUp =
    up.length > 0
      ? ` The estimate is associated with higher value primarily because ${up.map((d) => d.text.toLowerCase()).join(" and ")}.`
      : "";
  const whyDown =
    down.length > 0 ? ` ${down[0]!.text}.` : "";

  return `This player is expected to generate approximately ${value} in gaming and non-gaming value over the next twelve months and ranks in ${top} at this property.${range}${whyUp}${whyDown} This is a prediction, not a guaranteed outcome or approved reinvestment amount.`;
}

export function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatCompact(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}
