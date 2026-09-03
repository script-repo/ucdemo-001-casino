export type OfferId = "FP25" | "FP50" | "FP100";

export type WinBackCandidate = {
  playerId: number;
  label: string;
  churnRisk: number;
  ltvPercentile: number;
  lastVisit: string;
  expectedDaysToVisit: number;
  daysSinceVisit: number;
  host: string;
  drivers: string[];
};

export type OfferDefinition = {
  id: OfferId;
  name: string;
  expectedCost: number;
  minPercentile: number;
};

function mulberry32(seed: number) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(2026090323);
const DEMO_NOW = new Date("2026-09-03T12:00:00Z");
const HOSTS = ["H-104", "H-118", "H-127", "H-131", "Unassigned"];

export const OFFERS: OfferDefinition[] = [
  { id: "FP25", name: "$25 Dining or Entertainment Credit", expectedCost: 18, minPercentile: 40 },
  { id: "FP50", name: "$50 Property Experience Credit", expectedCost: 35, minPercentile: 60 },
  { id: "FP100", name: "$100 Premium Experience Credit", expectedCost: 68, minPercentile: 85 },
];

export function offerFor(percentile: number): OfferDefinition {
  return [...OFFERS]
    .reverse()
    .find((offer) => percentile >= offer.minPercentile) ?? OFFERS[0]!;
}

export const CANDIDATES: WinBackCandidate[] = Array.from({ length: 480 }, (_, index) => {
  const expectedDaysToVisit = Math.round(9 + rand() * 74);
  const overage = Math.round(5 + rand() * 105);
  const daysSinceVisit = expectedDaysToVisit + overage;
  const lastVisit = new Date(DEMO_NOW);
  lastVisit.setUTCDate(lastVisit.getUTCDate() - daysSinceVisit);
  const churnRisk = Math.min(
    0.97,
    0.32 + (overage / Math.max(expectedDaysToVisit, 14)) * 0.22 + rand() * 0.21,
  );
  const ltvPercentile = 30 + Math.floor(rand() * 70);
  return {
    playerId: 410000 + index * 2,
    label: `Player ${410000 + index * 2}`,
    churnRisk,
    ltvPercentile,
    lastVisit: lastVisit.toISOString().slice(0, 10),
    expectedDaysToVisit,
    daysSinceVisit,
    host: HOSTS[index % HOSTS.length]!,
    drivers: [
      `${daysSinceVisit} days since visit versus ${expectedDaysToVisit}-day expected cadence`,
      ltvPercentile >= 85 ? "High expected player value" : ltvPercentile >= 60 ? "Mid-high expected player value" : "Moderate expected player value",
      index % 3 === 0 ? "Recent visit frequency declined" : "Return window has been exceeded",
    ],
  };
}).sort(
  (a, b) =>
    b.ltvPercentile * b.churnRisk - a.ltvPercentile * a.churnRisk,
);

export const SUPPRESSED_COUNT = 47;
export const RECENCY_EXCLUDED_COUNT = 63;
export const SCORES_AS_OF = "2026-09-03";
export const CHURN_MODEL = "churn-cadence-v1.7";
export const VALUE_MODEL = "epv-gbm-v2.3";
