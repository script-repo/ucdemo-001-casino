export type RiskBand = "high" | "medium" | "low";
export type OutreachOutcome = "contacted" | "not-reachable" | "do-not-contact";

export type ChurnPlayer = {
  playerId: number;
  label: string;
  host: string;
  tier: "platinum" | "gold" | "silver" | "bronze";
  risk: number;
  band: RiskBand;
  ltvPercentile: number;
  medianGapDays: number;
  iqrGapDays: number;
  daysSinceVisit: number;
  expectedDaysToVisit: number;
  visitsObserved: number;
  baselineKind: "cadence" | "backstop";
  lastContact: string | null;
  visits: string[];
  drivers: Array<{ label: string; detail: string; impact: number }>;
};

function mulberry32(seed: number) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260903);
const HOSTS = ["H-104", "H-118", "H-122", "H-131", "H-140", "Unassigned"];
const TIERS = ["platinum", "gold", "silver", "bronze"] as const;
const AS_OF = new Date("2026-09-03T12:00:00-07:00");

function dateAgo(days: number) {
  const date = new Date(AS_OF);
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function tierFor(roll: number): ChurnPlayer["tier"] {
  if (roll < 0.07) return "platinum";
  if (roll < 0.25) return "gold";
  if (roll < 0.6) return "silver";
  return "bronze";
}

function riskBand(risk: number): RiskBand {
  if (risk >= 0.72) return "high";
  if (risk >= 0.46) return "medium";
  return "low";
}

function buildVisits(currentGap: number, medianGap: number, count: number) {
  const visits = [dateAgo(currentGap)];
  let elapsed = currentGap;
  for (let i = 1; i < Math.min(count, 12); i++) {
    const variation = Math.round((rand() - 0.5) * medianGap * 0.55);
    elapsed += Math.max(2, medianGap + variation);
    visits.push(dateAgo(elapsed));
  }
  return visits.reverse();
}

function buildPlayers() {
  const players: ChurnPlayer[] = [];
  let suppressedCount = 0;

  for (let i = 0; i < 640; i++) {
    // Apply the responsible-gaming/marketing gate before queue construction.
    if (i % 37 === 0 || i % 113 === 0) {
      suppressedCount++;
      continue;
    }

    const visitsObserved = i % 19 === 0 ? 2 + Math.floor(rand() * 2) : 5 + Math.floor(rand() * 48);
    const baselineKind = visitsObserved < 4 ? "backstop" : "cadence";
    const medianGapDays =
      baselineKind === "backstop" ? 90 : 6 + Math.round(Math.pow(rand(), 1.7) * 70);
    const iqrGapDays =
      baselineKind === "backstop" ? 0 : Math.max(2, Math.round(medianGapDays * (0.2 + rand() * 0.35)));
    const decayRoll = rand();
    const gapMultiplier =
      decayRoll > 0.91
        ? 2.7 + rand() * 1.8
        : decayRoll > 0.72
          ? 1.5 + rand() * 1.1
          : 0.35 + rand() * 1.1;
    const daysSinceVisit = Math.round(medianGapDays * gapMultiplier);
    const cadencePressure =
      baselineKind === "backstop"
        ? Math.max(0, (daysSinceVisit - 60) / 60)
        : Math.max(0, (daysSinceVisit - medianGapDays) / Math.max(iqrGapDays, 2));
    const valueTrend = (rand() - 0.58) * 1.4;
    const rawRisk = 1 / (1 + Math.exp(-(cadencePressure * 1.05 - 1.8 - valueTrend)));
    const risk = Math.min(0.98, Math.max(0.03, rawRisk));
    const tier = tierFor(rand());
    const ltvPercentile = Math.min(
      99,
      Math.max(
        4,
        Math.round(
          (tier === "platinum" ? 88 : tier === "gold" ? 70 : tier === "silver" ? 45 : 20) +
            (rand() - 0.5) * 28,
        ),
      ),
    );
    const cadenceImpact = Math.min(0.62, cadencePressure * 0.14);

    players.push({
      playerId: 200100 + i,
      label: `Player ${200100 + i}`,
      host: HOSTS[Math.floor(rand() * HOSTS.length)]!,
      tier,
      risk,
      band: riskBand(risk),
      ltvPercentile,
      medianGapDays,
      iqrGapDays,
      daysSinceVisit,
      expectedDaysToVisit: Math.max(1, Math.round(medianGapDays * (1.1 + rand() * 0.6))),
      visitsObserved,
      baselineKind,
      lastContact: rand() > 0.67 ? dateAgo(8 + Math.floor(rand() * 55)) : null,
      visits: buildVisits(daysSinceVisit, medianGapDays, visitsObserved),
      drivers: [
        {
          label: "Cadence gap",
          detail:
            baselineKind === "cadence"
              ? `${daysSinceVisit} days since visit vs ${medianGapDays}-day personal median`
              : `${daysSinceVisit} days since visit; fixed backstop used`,
          impact: cadenceImpact,
        },
        {
          label: "Theo per visit",
          detail: valueTrend > 0 ? "Value per visit is easing" : "Value per visit is stable",
          impact: valueTrend > 0 ? 0.13 + rand() * 0.12 : -(0.04 + rand() * 0.08),
        },
        {
          label: "Visit regularity",
          detail:
            iqrGapDays > medianGapDays * 0.4
              ? "Historically irregular cadence lowers confidence"
              : "Historically consistent cadence strengthens the signal",
          impact: iqrGapDays > medianGapDays * 0.4 ? -0.08 : 0.08,
        },
      ],
    });
  }

  return { players, suppressedCount };
}

export const CHURN_DATA = buildPlayers();
export const SCORED_AT = "2026-09-03T02:40:00-07:00";
export const MODEL_VERSION = "churn-cadence-v1.7";
