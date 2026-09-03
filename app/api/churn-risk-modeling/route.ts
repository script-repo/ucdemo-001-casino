import { generateModelText } from "@/lib/model-gateways";
import { CHURN_DATA } from "@/use-cases/churn-risk-modeling/web/data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { playerId?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const player = CHURN_DATA.players.find(
    (candidate) => candidate.playerId === Number(body.playerId),
  );
  if (!player) {
    return Response.json({ error: "Player was not found." }, { status: 404 });
  }

  const context = [
    `Synthetic player: ${player.label}`,
    `Churn risk: ${Math.round(player.risk * 100)}% (${player.band})`,
    `Expected player value percentile: ${player.ltvPercentile}`,
    `Usual visit gap: ${player.medianGapDays} days`,
    `Current gap: ${player.daysSinceVisit} days`,
    `Expected return window: ${player.expectedDaysToVisit} days`,
    `Baseline: ${player.baselineKind} from ${player.visitsObserved} observed visits`,
    `Assigned host: ${player.host}`,
    `Signals: ${player.drivers.map((driver) => driver.detail).join("; ")}`,
  ].join("\n");

  try {
    return Response.json(
      await generateModelText({
        systemPrompt:
          "You assist a casino host with synthetic churn analytics. Give one practical retention action in simple language. Use exactly these headings: DO NOW, WHY, DO NOT. Keep each section to one or two short sentences. Never encourage increased gambling, invent facts, or bypass eligibility and responsible-gaming checks.",
        context,
      }),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Recommended action could not be generated.",
      },
      { status: 502 },
    );
  }
}
