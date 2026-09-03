"use server";

/**
 * Server actions stand in for the FastAPI scoring service until the backend
 * deployment exists. The browser never talks to a data store directly.
 */

import {
  buildNarrative,
  exportCohortCsv,
  getCalibration,
  getModel,
  getPlayer,
  getRun,
  getStaleHours,
  getSummary,
  hoursSinceScore,
  queryCohort,
} from "./data";
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
  model: ModelInfo;
  hoursSinceScore: number;
  staleThresholdHours: number;
  isStale: boolean;
  summary: PortfolioSummary;
};

export async function fetchHealth(): Promise<HealthPayload> {
  const run = getRun();
  const hours = hoursSinceScore(run.scoredAt);
  return {
    run,
    model: getModel(),
    hoursSinceScore: hours,
    staleThresholdHours: getStaleHours(),
    isStale: hours > getStaleHours() || run.status === "stale",
    summary: getSummary(),
  };
}

export async function fetchCohort(query: CohortQuery): Promise<CohortResult> {
  return queryCohort(query);
}

export async function fetchPlayerDetail(
  playerId: number,
): Promise<PlayerDetailPayload | { error: string; code: "not_found" | "bad_id" }> {
  if (!Number.isFinite(playerId) || playerId <= 0) {
    return { error: "Enter a valid player ID.", code: "bad_id" };
  }
  const player = getPlayer(playerId);
  if (!player) {
    return { error: `No player found for ID ${playerId}.`, code: "not_found" };
  }
  return {
    player,
    narrative: buildNarrative(player),
    cmsUrl: `https://cms.example.com/players/${player.playerId}`,
  };
}

export async function fetchCalibration(): Promise<{
  deciles: CalibrationDecile[];
  model: ModelInfo;
}> {
  return { deciles: getCalibration(), model: getModel() };
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
  const hours = hoursSinceScore();
  const payload = exportCohortCsv(filters);
  return {
    ...payload,
    requiresStaleAck: hours > getStaleHours(),
  };
}
