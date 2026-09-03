import { generateModelText } from "@/lib/model-gateways";
import {
  ACCURACY,
  FORECAST_DATE,
  MODEL_VERSION,
  REVENUE_FORECAST,
} from "@/use-cases/revenue-management/web/data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function occupancy(index: number) {
  const day = REVENUE_FORECAST[index]!;
  return (
    day.rooms.reduce((sum, room) => sum + room.expectedRooms, 0) /
    day.rooms.reduce((sum, room) => sum + room.capacity, 0)
  );
}

export async function POST(request: Request) {
  let body: {
    operation?: unknown;
    horizon?: unknown;
    selectedDate?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (body.operation !== "generate-report") {
    return Response.json({ error: "Unknown operation." }, { status: 400 });
  }

  const requestedHorizon = Number(body.horizon);
  const horizon = [14, 30, 60, 90].includes(requestedHorizon)
    ? requestedHorizon
    : 30;
  const visible = REVENUE_FORECAST.slice(0, horizon);
  const selected =
    visible.find((day) => day.stayDate === body.selectedDate) ?? visible[0]!;
  const rankedDates = visible
    .map((day, index) => ({
      day,
      occupancy: occupancy(index),
      maxMove: Math.max(
        ...day.rooms.map((room) => room.recommendedRate - room.currentRate),
      ),
    }))
    .sort(
      (a, b) =>
        b.occupancy + b.day.displacementValue / 100_000 -
        (a.occupancy + a.day.displacementValue / 100_000),
    )
    .slice(0, 6);
  const averageOccupancy =
    visible.reduce((sum, _day, index) => sum + occupancy(index), 0) /
    visible.length;
  const totalHolds = visible.reduce(
    (sum, day) =>
      sum + day.rooms.reduce((roomSum, room) => roomSum + room.casinoHoldRooms, 0),
    0,
  );
  const materialMoves = visible.flatMap((day) => day.rooms).filter(
    (room) => Math.abs(room.recommendedRate - room.currentRate) >= 25,
  ).length;

  const context = [
    `This is synthetic, aggregate hotel forecasting data for a casino property.`,
    `Forecast vintage: ${FORECAST_DATE}`,
    `Model: ${MODEL_VERSION}`,
    `Report horizon: ${horizon} nights`,
    `Average forecast occupancy: ${Math.round(averageOccupancy * 100)}%`,
    `Material room-type rate moves of at least $25: ${materialMoves}`,
    `Casino room-night holds across the horizon: ${totalHolds}`,
    `Selected date: ${selected.stayDate}; event: ${selected.event ?? "none"}; high-value arrivals: ${selected.expectedHighValueArrivals}; displacement value: $${selected.displacementValue.toLocaleString()}`,
    "Highest-pressure dates:",
    ...rankedDates.map(
      ({ day, occupancy: pressure, maxMove }) =>
        `- ${day.stayDate}: ${Math.round(pressure * 100)}% occupancy, ${day.event ?? "no major event"}, ${day.expectedCasinoRooms} expected casino rooms, $${day.displacementValue.toLocaleString()} displacement value, largest rate increase $${maxMove}`,
    ),
    "Forecast accuracy:",
    ...ACCURACY.map(
      (point) =>
        `- ${point.leadDays}-day MAPE ${Math.round(point.mape * 1000) / 10}% versus ${Math.round(point.baselineMape * 1000) / 10}% baseline`,
    ),
  ].join("\n");

  try {
    return Response.json(
      await generateModelText({
        systemPrompt:
          "You are assisting a casino-hotel revenue manager. Turn the supplied aggregate, synthetic forecast into a concise decision report. Use exactly these headings: EXECUTIVE SUMMARY, PRIORITY DATES, RECOMMENDED ACTIONS, RISKS AND WATCH-OUTS. Under each heading use no more than three short bullets in plain language. Explain existing model recommendations only: do not invent events, set rates, approve overrides, expose individual players, or encourage gambling.",
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
            : "The revenue report could not be generated.",
      },
      { status: 502 },
    );
  }
}
