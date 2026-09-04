import {
  generateModelText,
  type BrowserGatewayConfig,
} from "@/lib/model-gateways";
import {
  REFRESHED_AT,
  SLOT_UNITS,
  TABLE_UNITS,
  THEME_PERFORMANCE,
} from "@/use-cases/slot-table-performance/web/data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: {
    operation?: unknown;
    view?: unknown;
    zone?: unknown;
    period?: unknown;
    gatewayConfig?: BrowserGatewayConfig;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }
  if (body.operation !== "generate-report") {
    return Response.json({ error: "Unknown operation." }, { status: 400 });
  }

  const view = body.view === "tables" ? "tables" : "slots";
  const zone = typeof body.zone === "string" ? body.zone : "all";
  const period = ["30", "90", "365"].includes(String(body.period))
    ? String(body.period)
    : "90";
  const units = SLOT_UNITS.filter((unit) => zone === "all" || unit.zone === zone);
  const comparable = units.filter((unit) => unit.peerN >= 6);
  const worst = [...comparable].sort((a, b) => a.residual - b.residual).slice(0, 6);
  const tables = [...TABLE_UNITS]
    .sort(
      (a, b) =>
        a.holdPct - a.peerMedianHold - (b.holdPct - b.peerMedianHold),
    )
    .slice(0, 6);

  const context = [
    "Synthetic, aggregate casino floor performance.",
    `Report view: ${view}; period: trailing ${period} days; zone: ${zone}`,
    `Data refreshed: ${REFRESHED_AT}`,
    `Slots in scope: ${units.length}; comparable peer groups: ${comparable.length}; low-confidence units: ${units.length - comparable.length}`,
    `Comparable slot underperformers below peers by at least $50 WPUD: ${comparable.filter((unit) => unit.residual <= -50).length}`,
    "Largest comparable slot gaps:",
    ...worst.map(
      (unit) =>
        `- ${unit.unitId}, ${unit.theme}, ${unit.zone}: WPUD $${unit.wpud}, peer median $${unit.peerMedian}, residual $${unit.residual}, peer n=${unit.peerN}`,
    ),
    "Theme consistency:",
    ...THEME_PERFORMANCE.map(
      (theme) =>
        `- ${theme.theme}: average residual $${theme.avgResidual}; above peers in ${theme.zonesAboveMedian}/${theme.zonesPresent} zones; ${theme.unitCount} units`,
    ),
    "Lowest table hold gaps:",
    ...tables.map(
      (table) =>
        `- ${table.tableId}, ${table.game}, ${table.pit}: hold ${(table.holdPct * 100).toFixed(1)}%, peer ${(table.peerMedianHold * 100).toFixed(1)}%, peer n=${table.peerN}`,
    ),
  ].join("\n");

  try {
    return Response.json(
      await generateModelText({
        systemPrompt:
          "You assist casino gaming operations with synthetic, aggregate slot and table analytics. Explain comparisons only among like-for-like peer groups. Use exactly these headings: BOTTOM LINE, UNDERPERFORMERS, OPPORTUNITIES, NEXT ACTIONS. Under each heading use no more than three short bullets. Do not invent causes, treat low-confidence groups as findings, recommend gambling behavior, or authorize floor changes or purchases.",
        context,
        gatewayConfig: body.gatewayConfig ?? {},
      }),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "The performance report could not be generated." },
      { status: 502 },
    );
  }
}
