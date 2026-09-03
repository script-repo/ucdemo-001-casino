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
  } catch {
    return noStore({ error: "Invalid Expected Player Value query." }, { status: 400 });
  }

  return noStore({ error: "Unknown operation." }, { status: 400 });
}
