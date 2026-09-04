export type PatronTier = "platinum" | "gold" | "silver" | "bronze";
export type CardStatus = "active" | "lost" | "replaced";
export type RgStatus = "clear" | "marketing-suppressed" | "self-excluded";

export type PatronSummary = {
  playerId: number;
  firstName: string;
  lastName: string;
  displayName: string;
  tier: PatronTier;
  hostId: string;
  enrolledOn: string;
  lastVisit: string | null;
  city: string;
  cardStatus: CardStatus;
  rgStatus: RgStatus;
};

export type PatronRecord = PatronSummary & {
  email: string;
  phone: string;
  property: string;
  cardNumber: string;
  visitCount: number;
  lifetimeTheo: number;
  nonGamingSpend: number;
  preferredGame: string;
  visits: Array<{ date: string; theo: number; nights: number }>;
  comps: Array<{ date: string; offer: string; status: "redeemed" | "expired" | "open" }>;
  relatedApps: Array<{ label: string; href: string }>;
};

const FIRST = [
  "Elena", "Marcus", "Priya", "Jonah", "Camille", "Andre", "Sofia", "Nathan",
  "Isabel", "Victor", "Amara", "Leo", "Hannah", "Diego", "Claire", "Omar",
];
const LAST = [
  "Hart", "Nguyen", "Alvarez", "Brooks", "Patel", "Sutton", "Reyes", "Walsh",
  "Kim", "Moreau", "Bennett", "Shah", "Cole", "Ibrahim", "Vance", "Duarte",
];
const CITIES = ["Henderson", "North Las Vegas", "Boulder City", "Summerlin", "Paradise"];
const GAMES = ["Video reels", "Blackjack", "Video poker", "Baccarat", "Roulette"];
export const HOSTS = ["H-104", "H-118", "H-122", "H-131", "H-140", "unassigned"];
const PROPERTY = "Locals Pilot — Desert Springs";

export const CARD_BOOK_START = 100100;
export const CARD_BOOK_COUNT = 5000;
export const CARD_BOOK_END = CARD_BOOK_START + CARD_BOOK_COUNT - 1;

function mulberry32(seed: number) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function relatedApps(playerId: number) {
  const links: Array<{ label: string; href: string }> = [];
  if (playerId >= CARD_BOOK_START && playerId <= CARD_BOOK_END) {
    links.push({
      label: "Expected Player Value",
      href: `/use-cases/predictive-ltv-scoring?playerId=${playerId}`,
    });
  }
  if (playerId >= 200100 && playerId <= 200739) {
    links.push({
      label: "Churn-Risk Modeling",
      href: `/use-cases/churn-risk-modeling`,
    });
  }
  if (playerId >= 300200 && playerId <= 300299) {
    links.push({
      label: "Dynamic Offer Engine",
      href: `/use-cases/dynamic-offer-engine`,
    });
  }
  if (playerId >= 410000 && playerId <= 410958) {
    links.push({
      label: "Win-Back Campaigns",
      href: `/use-cases/win-back-campaigns`,
    });
  }
  return links;
}

function summarize(patron: PatronRecord): PatronSummary {
  return {
    playerId: patron.playerId,
    firstName: patron.firstName,
    lastName: patron.lastName,
    displayName: patron.displayName,
    tier: patron.tier,
    hostId: patron.hostId,
    enrolledOn: patron.enrolledOn,
    lastVisit: patron.lastVisit,
    city: patron.city,
    cardStatus: patron.cardStatus,
    rgStatus: patron.rgStatus,
  };
}

function matchesFilters(
  patron: PatronRecord,
  tier: PatronTier | "all",
  hostId: string,
  rgStatus: RgStatus | "all",
) {
  if (tier !== "all" && patron.tier !== tier) return false;
  if (hostId !== "all" && patron.hostId !== hostId) return false;
  if (rgStatus !== "all" && patron.rgStatus !== rgStatus) return false;
  return true;
}

export function getPatron(playerId: number): PatronRecord | null {
  if (!Number.isInteger(playerId) || playerId <= 0) return null;
  const rand = mulberry32(playerId * 9973);
  const firstName = FIRST[Math.floor(rand() * FIRST.length)]!;
  const lastName = LAST[Math.floor(rand() * LAST.length)]!;
  const tierRoll = rand();
  const tier: PatronTier =
    tierRoll < 0.06 ? "platinum" : tierRoll < 0.24 ? "gold" : tierRoll < 0.58 ? "silver" : "bronze";
  const hostId = rand() > 0.92 ? "unassigned" : HOSTS[Math.floor(rand() * (HOSTS.length - 1))]!;
  const enrolledYear = 2018 + Math.floor(rand() * 8);
  const enrolledMonth = 1 + Math.floor(rand() * 12);
  const enrolledDay = 1 + Math.floor(rand() * 27);
  const lastVisitDays = Math.floor(rand() * 120);
  const visitCount = 4 + Math.floor(rand() * 48);
  const lifetimeTheo = Math.round((800 + rand() * 42000) * (tier === "platinum" ? 4.2 : tier === "gold" ? 2.1 : 1));
  const rgStatus: RgStatus =
    playerId % 97 === 0
      ? "self-excluded"
      : playerId % 53 === 0
        ? "marketing-suppressed"
        : "clear";
  const cardStatus: CardStatus =
    rand() > 0.97 ? "lost" : rand() > 0.93 ? "replaced" : "active";
  const visits = Array.from({ length: Math.min(6, visitCount) }, (_, index) => {
    const ago = lastVisitDays + index * (8 + Math.floor(rand() * 18));
    const date = new Date("2026-09-03T12:00:00Z");
    date.setUTCDate(date.getUTCDate() - ago);
    return {
      date: date.toISOString().slice(0, 10),
      theo: Math.round(40 + rand() * 980),
      nights: rand() > 0.62 ? 0 : 1 + Math.floor(rand() * 2),
    };
  });
  const comps = [
    { date: visits[0]?.date ?? "2026-08-12", offer: "$25 Dining Credit", status: rand() > 0.4 ? "redeemed" : "open" },
    { date: visits[2]?.date ?? "2026-07-03", offer: "$50 Property Experience", status: rand() > 0.5 ? "expired" : "redeemed" },
  ] as PatronRecord["comps"];

  return {
    playerId,
    firstName,
    lastName,
    displayName: `${firstName} ${lastName}`,
    tier,
    hostId,
    enrolledOn: `${enrolledYear}-${String(enrolledMonth).padStart(2, "0")}-${String(enrolledDay).padStart(2, "0")}`,
    lastVisit: visits[0]?.date ?? null,
    city: CITIES[Math.floor(rand() * CITIES.length)]!,
    cardStatus,
    rgStatus,
    email: `${firstName}.${lastName}.${playerId}@player.example`.toLowerCase(),
    phone: `(702) ${String(400 + (playerId % 500)).padStart(3, "0")}-${String(1000 + (playerId % 9000)).slice(-4)}`,
    property: PROPERTY,
    cardNumber: `DS-${String(playerId).slice(-6)}`,
    visitCount,
    lifetimeTheo,
    nonGamingSpend: Math.round(lifetimeTheo * (0.12 + rand() * 0.28)),
    preferredGame: GAMES[Math.floor(rand() * GAMES.length)]!,
    visits,
    comps,
    relatedApps: relatedApps(playerId),
  };
}

export function queryPatrons({
  search = "",
  tier = "all",
  hostId = "all",
  rgStatus = "all",
  page = 1,
  pageSize = 12,
}: {
  search?: string;
  tier?: PatronTier | "all";
  hostId?: string;
  rgStatus?: RgStatus | "all";
  page?: number;
  pageSize?: number;
}) {
  const trimmed = search.trim();
  const q = trimmed.toLowerCase();
  const numeric = Number(trimmed);
  const exactId = trimmed !== "" && Number.isInteger(numeric) && String(numeric) === trimmed;
  const safePage = Math.max(1, page);
  const safeSize = Math.min(50, Math.max(1, pageSize));

  if (exactId) {
    const patron = getPatron(numeric);
    const results =
      patron && matchesFilters(patron, tier, hostId, rgStatus) ? [summarize(patron)] : [];
    return {
      results,
      total: results.length,
      page: 1,
      pageSize: safeSize,
      hosts: HOSTS,
      property: PROPERTY,
    };
  }

  const unfiltered = !q && tier === "all" && hostId === "all" && rgStatus === "all";
  if (unfiltered) {
    const startId = CARD_BOOK_START + (safePage - 1) * safeSize;
    const results: PatronSummary[] = [];
    for (let offset = 0; offset < safeSize; offset++) {
      const patron = getPatron(startId + offset);
      if (patron) results.push(summarize(patron));
    }
    return {
      results,
      total: CARD_BOOK_COUNT,
      page: safePage,
      pageSize: safeSize,
      hosts: HOSTS,
      property: PROPERTY,
    };
  }

  const matches: PatronSummary[] = [];
  for (let id = CARD_BOOK_START; id <= CARD_BOOK_END; id++) {
    const patron = getPatron(id);
    if (!patron || !matchesFilters(patron, tier, hostId, rgStatus)) continue;
    if (
      q &&
      !String(patron.playerId).includes(q) &&
      !patron.displayName.toLowerCase().includes(q) &&
      !patron.cardNumber.toLowerCase().includes(q)
    ) {
      continue;
    }
    matches.push(summarize(patron));
  }

  const start = (safePage - 1) * safeSize;
  return {
    results: matches.slice(start, start + safeSize),
    total: matches.length,
    page: safePage,
    pageSize: safeSize,
    hosts: HOSTS,
    property: PROPERTY,
  };
}

export function patronBriefingContext(patron: PatronRecord) {
  return [
    `Synthetic CMS record for ${patron.displayName} (ID ${patron.playerId})`,
    `Property: ${patron.property}`,
    `Tier: ${patron.tier}; host: ${patron.hostId}; card: ${patron.cardStatus}`,
    `Responsible-gaming status: ${patron.rgStatus}`,
    `Enrolled: ${patron.enrolledOn}; last visit: ${patron.lastVisit ?? "none"}`,
    `Visits observed: ${patron.visitCount}; lifetime theo: $${patron.lifetimeTheo.toLocaleString()}`,
    `Non-gaming spend: $${patron.nonGamingSpend.toLocaleString()}; preferred game: ${patron.preferredGame}`,
    `Recent visits: ${patron.visits.map((visit) => `${visit.date} theo $${visit.theo}`).join("; ")}`,
    `Recent comps: ${patron.comps.map((comp) => `${comp.offer} (${comp.status})`).join("; ")}`,
  ].join("\n");
}
