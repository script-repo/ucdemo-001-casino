export type SlotUnit = {
  unitId: string;
  theme: string;
  zone: string;
  denomination: number;
  cabinet: string;
  coinIn: number;
  theoWin: number;
  actualWin: number;
  holdPct: number;
  hoursPlayed: number;
  wpud: number;
  peerMedian: number;
  residual: number;
  peerN: number;
  peerPercentile: number;
  trend: number[];
};

export type TableUnit = {
  tableId: string;
  game: string;
  pit: string;
  limitBand: string;
  drop: number;
  win: number;
  holdPct: number;
  seatHours: number;
  peerMedianHold: number;
  peerN: number;
};

export type ThemePerformance = {
  theme: string;
  unitCount: number;
  zonesPresent: number;
  zonesAboveMedian: number;
  avgResidual: number;
};

function mulberry32(seed: number) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(2026090321);
export const ZONES = ["Main Floor", "North Slots", "High Limit", "Far Wall"];
const THEMES = ["Dragon Fortune", "Buffalo Trail", "Golden Lantern", "Neon Sevens", "Ocean Riches", "Royal Reels"];
const CABINETS = ["Ovation", "Arc", "Curve"];
const DENOMS = [0.01, 0.05, 0.25];

export const SLOT_UNITS: SlotUnit[] = Array.from({ length: 144 }, (_, index) => {
  const zone = ZONES[index % ZONES.length]!;
  const theme = THEMES[(index * 5 + Math.floor(index / 12)) % THEMES.length]!;
  const denomination = DENOMS[Math.floor(index / 8) % DENOMS.length]!;
  const cabinet = CABINETS[Math.floor(index / 4) % CABINETS.length]!;
  const zoneFactor = [1.13, 0.96, 1.42, 0.76][index % 4]!;
  const themeFactor = [1.12, 1.04, 0.91, 0.84, 1.18, 0.97][THEMES.indexOf(theme)]!;
  const peerMedian = Math.round(215 * zoneFactor * (1 + denomination * 0.8));
  const residual = Math.round(peerMedian * (themeFactor - 1 + (rand() - 0.5) * 0.42));
  const wpud = Math.max(42, peerMedian + residual);
  const peerN = index % 19 === 0 ? 4 + (index % 2) : 8 + (index % 11);
  const coinIn = Math.round(wpud * 90 * (74 + rand() * 22));
  const theoWin = Math.round(coinIn * (0.085 + rand() * 0.025));
  const actualWin = Math.round(theoWin * (0.88 + rand() * 0.24));
  return {
    unitId: `SLOT-${String(index + 1).padStart(4, "0")}`,
    theme,
    zone,
    denomination,
    cabinet,
    coinIn,
    theoWin,
    actualWin,
    holdPct: actualWin / coinIn,
    hoursPlayed: Math.round(760 + rand() * 1150),
    wpud,
    peerMedian,
    residual: wpud - peerMedian,
    peerN,
    peerPercentile: Math.max(2, Math.min(98, Math.round(50 + ((wpud - peerMedian) / peerMedian) * 120))),
    trend: Array.from({ length: 8 }, (_, point) =>
      Math.round(wpud * (0.82 + point * 0.025 + (rand() - 0.5) * 0.16)),
    ),
  };
});

const GAMES = ["Blackjack", "Baccarat", "Roulette", "Craps"];
const PITS = ["Main Pit", "East Pit", "High Limit"];
export const TABLE_UNITS: TableUnit[] = Array.from({ length: 30 }, (_, index) => {
  const game = GAMES[index % GAMES.length]!;
  const pit = PITS[index % PITS.length]!;
  const peerMedianHold = [0.145, 0.118, 0.166, 0.132][index % GAMES.length]!;
  const drop = Math.round(170_000 + rand() * 540_000);
  const holdPct = Math.max(0.06, peerMedianHold + (rand() - 0.5) * 0.09);
  return {
    tableId: `${game.slice(0, 2).toUpperCase()}-${String(index + 1).padStart(2, "0")}`,
    game,
    pit,
    limitBand: index % 4 === 0 ? "$100–$2,000" : index % 2 ? "$25–$500" : "$10–$300",
    drop,
    win: Math.round(drop * holdPct),
    holdPct,
    seatHours: Math.round(580 + rand() * 1900),
    peerMedianHold,
    peerN: 6 + (index % 8),
  };
});

export const THEME_PERFORMANCE: ThemePerformance[] = THEMES.map((theme) => {
  const units = SLOT_UNITS.filter((unit) => unit.theme === theme);
  const zones = ZONES.filter((zone) => units.some((unit) => unit.zone === zone));
  return {
    theme,
    unitCount: units.length,
    zonesPresent: zones.length,
    zonesAboveMedian: zones.filter((zone) => {
      const group = units.filter((unit) => unit.zone === zone);
      return group.reduce((sum, unit) => sum + unit.residual, 0) / group.length > 0;
    }).length,
    avgResidual: Math.round(units.reduce((sum, unit) => sum + unit.residual, 0) / units.length),
  };
}).sort((a, b) => b.avgResidual - a.avgResidual);

export const REFRESHED_AT = "2026-09-03T03:04:11-07:00";
