import {
  buildNarrative,
  exportCohortCsv,
  getCalibration,
  getModel,
  getPlayer,
  getRun,
  getRunHistory,
  getStaleHours,
  getSummary,
  hoursSinceScore,
  queryCohort,
} from "@/use-cases/predictive-ltv-scoring/web/data";
import type {
  CohortQuery,
  ScoreFilters,
} from "@/use-cases/predictive-ltv-scoring/web/types";
import {
  generateEpvBriefing,
  generateModelText,
} from "@/lib/model-gateways";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function noStore(payload: unknown, init?: ResponseInit) {
  return Response.json(payload, {
    ...init,
    headers: { ...init?.headers, "Cache-Control": "no-store" },
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const operation = url.searchParams.get("operation");

  if (operation === "health") {
    const run = getRun();
    const hours = hoursSinceScore(run.scoredAt);
    return noStore({
      run,
      recentRuns: getRunHistory(),
      model: getModel(),
      hoursSinceScore: hours,
      staleThresholdHours: getStaleHours(),
      isStale: hours > getStaleHours() || run.status === "stale",
      summary: getSummary(),
    });
  }

  if (operation === "calibration") {
    return noStore({ deciles: getCalibration(), model: getModel() });
  }

  if (operation === "player") {
    const playerId = Number(url.searchParams.get("playerId"));
    if (!Number.isFinite(playerId) || playerId <= 0) {
      return noStore({
        error: "Enter a valid player ID.",
        code: "bad_id",
      });
    }
    const player = getPlayer(playerId);
    if (!player) {
      return noStore({
        error: `No player found for ID ${playerId}.`,
        code: "not_found",
      });
    }
    return noStore({
      player,
      narrative: buildNarrative(player),
      cmsUrl: `https://cms.example.com/players/${player.playerId}`,
    });
  }

  return noStore({ error: "Unknown operation." }, { status: 400 });
}

export async function POST(request: Request) {
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (declaredLength > 64 * 1024) {
    return noStore({ error: "Request is too large." }, { status: 413 });
  }

  let body: {
    operation?: unknown;
    query?: unknown;
    filters?: unknown;
    playerId?: unknown;
  };
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > 64 * 1024) {
      return noStore({ error: "Request is too large." }, { status: 413 });
    }
    body = JSON.parse(raw) as typeof body;
  } catch {
    return noStore({ error: "Invalid JSON." }, { status: 400 });
  }

  try {
    if (body.operation === "cohort") {
      return noStore(queryCohort(body.query as CohortQuery));
    }
    if (body.operation === "export") {
      const payload = exportCohortCsv(body.filters as ScoreFilters);
      return noStore({
        ...payload,
        requiresStaleAck: hoursSinceScore() > getStaleHours(),
      });
    }
    if (body.operation === "ai-briefing") {
      const filters = body.filters as ScoreFilters;
      const cohort = queryCohort({
        filters,
        sort: "ltv12m",
        sortDir: "desc",
        page: 1,
        pageSize: 8,
      });
      const summary = getSummary();
      const context = [
        `Property: ${cohort.property}`,
        `Matching cohort: ${cohort.total.toLocaleString()} players`,
        `Population scored: ${summary.scoredCount.toLocaleString()}`,
        `Population intentionally unscored: ${summary.unscoredCount.toLocaleString()}`,
        `Population rising: ${summary.risingCount.toLocaleString()}`,
        `Portfolio expected 12-month value: $${summary.totalPredictedValue.toLocaleString()}`,
        `Active filters: ${JSON.stringify(filters)}`,
        "Highest-value matching synthetic records:",
        ...cohort.results.map(
          (player) =>
            `- ${player.displayLabel}: expected value $${player.ltv12m?.toLocaleString() ?? "unscored"}, percentile ${player.percentile ?? "n/a"}, tier ${player.tier}, trend ${player.trend ?? "n/a"}, visits ${player.visitCount}`,
        ),
        "Provide: (1) executive summary, (2) three observations, (3) responsible next actions, and (4) caveats.",
      ].join("\n");
      return noStore(await generateEpvBriefing(context));
    }
    if (body.operation === "player-action") {
      const playerId = Number(body.playerId);
      const player = getPlayer(playerId);
      if (!player) {
        return noStore({ error: "Player was not found." }, { status: 404 });
      }
      const context = [
        `Synthetic player: ${player.displayLabel}`,
        `Tier: ${player.tier}`,
        `Expected 12-month value: ${player.ltv12m == null ? "not scored due to insufficient history" : `$${player.ltv12m.toLocaleString()}`}`,
        `Property percentile: ${player.percentile ?? "not available"}`,
        `Trend: ${player.trend ?? "not available"}`,
        `Activity: ${player.activity}`,
        `Visits observed: ${player.visitCount}`,
        `Last visit: ${player.lastVisit ?? "not available"}`,
        `Likely value range: ${player.intervalLow == null ? "not available" : `$${player.intervalLow.toLocaleString()} to $${player.intervalHigh?.toLocaleString()}`}`,
        `Top drivers: ${player.drivers.slice(0, 3).map((driver) => driver.text).join("; ") || "insufficient data"}`,
      ].join("\n");
      return noStore(
        await generateModelText({
          systemPrompt:
            "You are assisting a casino host with synthetic player analytics. State exactly one responsible next action in plain language. Use exactly these headings: DO NOW, WHY, DO NOT. Keep each section to one or two short sentences. Never approve an offer, invent facts, recommend increased gambling, or contact a player without applicable eligibility checks.",
          context,
        }),
      );
    }
  } catch (error) {
    return noStore(
      {
        error:
          error instanceof Error
            ? error.message
            : "Expected Player Value request could not be completed.",
      },
      { status: 502 },
    );
  }

  return noStore({ error: "Unknown operation." }, { status: 400 });
}
