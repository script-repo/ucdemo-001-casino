import type {
  CalibrationDecile,
  CohortQuery,
  CohortResult,
  ModelInfo,
  PlayerScore,
  PortfolioSummary,
  ScoreFilters,
  ScoringRun,
} from "./types";

export type PlayerDetailPayload = {
  player: PlayerScore;
  narrative: string;
  cmsUrl: string;
};

export type HealthPayload = {
  run: ScoringRun;
  recentRuns: ScoringRun[];
  model: ModelInfo;
  hoursSinceScore: number;
  staleThresholdHours: number;
  isStale: boolean;
  summary: PortfolioSummary;
};

export type AiBriefing = {
  text: string;
  provider: string;
  model: string;
};

export type PlayerAction = AiBriefing;

async function responseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error ?? "Expected Player Value service failed.");
  }
  return payload;
}

export async function fetchHealth(): Promise<HealthPayload> {
  return responseJson<HealthPayload>(
    await fetch("/api/expected-player-value?operation=health", {
      cache: "no-store",
    }),
  );
}

export async function fetchCohort(
  query: CohortQuery,
): Promise<CohortResult> {
  return responseJson<CohortResult>(
    await fetch("/api/expected-player-value", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operation: "cohort", query }),
    }),
  );
}

export async function fetchPlayerDetail(
  playerId: number,
): Promise<PlayerDetailPayload | { error: string; code: "not_found" | "bad_id" }> {
  return responseJson<
    PlayerDetailPayload | { error: string; code: "not_found" | "bad_id" }
  >(
    await fetch(
      `/api/expected-player-value?operation=player&playerId=${encodeURIComponent(playerId)}`,
      { cache: "no-store" },
    ),
  );
}

export async function fetchCalibration(): Promise<{
  deciles: CalibrationDecile[];
  model: ModelInfo;
}> {
  return responseJson(
    await fetch("/api/expected-player-value?operation=calibration", {
      cache: "no-store",
    }),
  );
}

export async function buildExport(filters: ScoreFilters): Promise<{
  csv: string;
  count: number;
  meta: {
    modelVersion: string;
    modelLabel: string;
    scoreDate: string;
    property: string;
    exportedAt: string;
  };
  requiresStaleAck: boolean;
}> {
  return responseJson(
    await fetch("/api/expected-player-value", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operation: "export", filters }),
    }),
  );
}

export async function generateAiBriefing(
  filters: ScoreFilters,
): Promise<AiBriefing> {
  return responseJson(
    await fetch("/api/expected-player-value", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operation: "ai-briefing", filters }),
    }),
  );
}

export async function generatePlayerAction(
  playerId: number,
): Promise<PlayerAction> {
  return responseJson(
    await fetch("/api/expected-player-value", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operation: "player-action", playerId }),
    }),
  );
}
