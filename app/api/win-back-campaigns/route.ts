import { generateModelText } from "@/lib/model-gateways";
import {
  CANDIDATES,
  CHURN_MODEL,
  RECENCY_EXCLUDED_COUNT,
  SCORES_AS_OF,
  SUPPRESSED_COUNT,
  VALUE_MODEL,
  offerFor,
} from "@/use-cases/win-back-campaigns/web/data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: {
    operation?: unknown;
    churnMin?: unknown;
    valueMin?: unknown;
    cap?: unknown;
    campaignName?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }
  if (body.operation !== "generate-report") {
    return Response.json({ error: "Unknown operation." }, { status: 400 });
  }

  const churnMin = Math.min(0.9, Math.max(0.4, Number(body.churnMin) || 0.6));
  const valueMin = [40, 60, 75, 85].includes(Number(body.valueMin))
    ? Number(body.valueMin)
    : 40;
  const cap = [100, 250, 400].includes(Number(body.cap)) ? Number(body.cap) : 250;
  const cohort = CANDIDATES.filter(
    (candidate) =>
      candidate.churnRisk >= churnMin &&
      candidate.ltvPercentile >= valueMin,
  ).slice(0, cap);
  const bands = ["FP25", "FP50", "FP100"].map((offerId) => {
    const candidates = cohort.filter(
      (candidate) => offerFor(candidate.ltvPercentile).id === offerId,
    );
    return {
      offerId,
      count: candidates.length,
      cost: candidates.reduce(
        (sum, candidate) => sum + offerFor(candidate.ltvPercentile).expectedCost,
        0,
      ),
    };
  });
  const expectedCost = bands.reduce((sum, band) => sum + band.cost, 0);
  const highRisk = cohort.filter((candidate) => candidate.churnRisk >= 0.75).length;
  const highValue = cohort.filter((candidate) => candidate.ltvPercentile >= 85).length;
  const unassigned = cohort.filter((candidate) => candidate.host === "Unassigned").length;
  const avgOverdue = cohort.length
    ? Math.round(
        cohort.reduce(
          (sum, candidate) =>
            sum + candidate.daysSinceVisit - candidate.expectedDaysToVisit,
          0,
        ) / cohort.length,
      )
    : 0;

  const context = [
    "Synthetic, aggregate win-back campaign preview.",
    `Campaign: ${typeof body.campaignName === "string" ? body.campaignName.slice(0, 80) : "Win-Back Campaign"}`,
    `Scores as of: ${SCORES_AS_OF}; churn model: ${CHURN_MODEL}; value model: ${VALUE_MODEL}`,
    `Rules: churn at least ${Math.round(churnMin * 100)}%, value percentile at least ${valueMin}, cap ${cap}`,
    `Eligible cohort: ${cohort.length}; expected cost: $${expectedCost.toLocaleString()}`,
    `High-risk candidates: ${highRisk}; high-value candidates: ${highValue}; unassigned host: ${unassigned}`,
    `Average days beyond personal expected cadence: ${avgOverdue}`,
    `Pre-application exclusions: ${SUPPRESSED_COUNT} responsible-gaming or marketing suppressions; ${RECENCY_EXCLUDED_COUNT} outstanding-offer exclusions`,
    "Offer ladder:",
    ...bands.map(
      (band) =>
        `- ${band.offerId}: ${band.count} candidates, $${band.cost.toLocaleString()} expected cost`,
    ),
  ].join("\n");

  try {
    return Response.json(
      await generateModelText({
        systemPrompt:
          "You assist a casino marketing manager with an aggregate, synthetic win-back campaign preview. Use exactly these headings: CAMPAIGN SUMMARY, COHORT INSIGHTS, REVIEW PRIORITIES, RISKS AND GUARDRAILS. Under each heading use no more than three short bullets in simple language. Do not create per-player copy, invent facts, recommend increased gambling, change eligibility, approve a campaign, or release outreach. Explicitly preserve human review and responsible-gaming exclusions.",
        context,
      }),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "The campaign report could not be generated." },
      { status: 502 },
    );
  }
}
