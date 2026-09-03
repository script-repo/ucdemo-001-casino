export type Offer = {
  id: string;
  name: string;
  kind: "freeplay" | "food" | "hotel" | "event";
  faceValue: number;
  expectedCost: number;
  minPercentile: number;
};

export type Proposal = {
  proposalId: number;
  playerId: number;
  playerLabel: string;
  tier: "platinum" | "gold" | "silver" | "bronze";
  ltvPercentile: number;
  churnBand: "high" | "medium" | "low";
  triggerType: "card_in" | "trip_start" | "coin_in_milestone" | "session_end";
  triggerZone: string;
  triggeredAt: string;
  offer: Offer;
  rationale: string;
  rationaleKind: "template" | "model";
  overBudget: boolean;
};

export const OFFER_CATALOGUE: Offer[] = [
  { id: "FP25", name: "$25 Free Play", kind: "freeplay", faceValue: 25, expectedCost: 15, minPercentile: 40 },
  { id: "FP50", name: "$50 Free Play", kind: "freeplay", faceValue: 50, expectedCost: 30, minPercentile: 70 },
  { id: "FP100", name: "$100 Free Play", kind: "freeplay", faceValue: 100, expectedCost: 60, minPercentile: 90 },
  { id: "FB30", name: "$30 Dining Credit", kind: "food", faceValue: 30, expectedCost: 21, minPercentile: 35 },
  { id: "FB75", name: "$75 Dining Credit", kind: "food", faceValue: 75, expectedCost: 52, minPercentile: 75 },
  { id: "HTL1", name: "One-Night Stay", kind: "hotel", faceValue: 180, expectedCost: 78, minPercentile: 82 },
  { id: "EVT2", name: "Two Event Tickets", kind: "event", faceValue: 140, expectedCost: 70, minPercentile: 68 },
];

function mulberry32(seed: number) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(2026090313);
const TIERS = ["platinum", "gold", "silver", "bronze"] as const;
const TRIGGERS = ["card_in", "trip_start", "coin_in_milestone", "session_end"] as const;
const ZONES = ["High Limit", "North Slots", "Table Games", "Hotel Lobby", "Sportsbook"];

function offerFor(percentile: number, churn: Proposal["churnBand"], index: number) {
  const eligible = OFFER_CATALOGUE.filter((offer) => offer.minPercentile <= percentile);
  const preferredKind =
    churn === "high" ? (index % 2 ? "food" : "event") : index % 3 ? "freeplay" : "hotel";
  return (
    eligible
      .filter((offer) => offer.kind === preferredKind)
      .sort((a, b) => b.expectedCost - a.expectedCost)[0] ??
    eligible.sort((a, b) => b.expectedCost - a.expectedCost)[0] ??
    OFFER_CATALOGUE[0]!
  );
}

function buildProposals(): Proposal[] {
  const proposals: Proposal[] = [];
  for (let i = 0; i < 34; i++) {
    const ltvPercentile = 42 + Math.floor(rand() * 58);
    const churnRoll = rand();
    const churnBand = churnRoll > 0.72 ? "high" : churnRoll > 0.3 ? "medium" : "low";
    const offer = offerFor(ltvPercentile, churnBand, i);
    const triggerType = TRIGGERS[i % TRIGGERS.length]!;
    const triggeredAt = new Date(
      new Date("2026-09-03T20:00:00Z").getTime() - i * 73_000,
    ).toISOString();
    proposals.push({
      proposalId: 88000 + i,
      playerId: 300200 + i * 3,
      playerLabel: `Player ${300200 + i * 3}`,
      tier: TIERS[Math.min(3, Math.floor((100 - ltvPercentile) / 24))]!,
      ltvPercentile,
      churnBand,
      triggerType,
      triggerZone: ZONES[i % ZONES.length]!,
      triggeredAt,
      offer,
      rationale:
        churnBand === "high"
          ? `${ltvPercentile}th-percentile player with elevated lapse risk; a non-gaming benefit supports relationship outreach without changing the underlying score.`
          : `${ltvPercentile}th-percentile player is currently on property; this offer fits the approved value band and recent visit context.`,
      rationaleKind: i % 5 === 0 ? "model" : "template",
      overBudget: i > 27,
    });
  }
  return proposals;
}

export const PROPOSALS = buildProposals();
export const SUPPRESSED_COUNT = 11;
export const BUDGET = {
  cap: 120_000,
  committed: 74_300,
};
