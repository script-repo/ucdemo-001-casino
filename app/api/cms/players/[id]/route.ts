import {
  generateModelText,
  type BrowserGatewayConfig,
} from "@/lib/model-gateways";
import { getPatron, patronBriefingContext } from "@/lib/player-cms";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function noStore(payload: unknown, init?: ResponseInit) {
  return Response.json(payload, {
    ...init,
    headers: { ...init?.headers, "Cache-Control": "no-store" },
  });
}

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const patron = getPatron(Number(id));
  if (!patron) {
    return noStore({ error: "No player found for that ID.", code: "not_found" }, { status: 404 });
  }
  return noStore({ patron });
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const patron = getPatron(Number(id));
  if (!patron) {
    return noStore({ error: "No player found for that ID.", code: "not_found" }, { status: 404 });
  }

  let body: { gatewayConfig?: BrowserGatewayConfig } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return noStore({ error: "Invalid JSON." }, { status: 400 });
  }

  const rgLock =
    patron.rgStatus !== "clear"
      ? " Responsible-gaming status is not clear. Do not suggest contact, offers, or win-back copy. Tell the host to stop and follow property protocol."
      : "";

  try {
    return noStore(
      await generateModelText({
        systemPrompt:
          "You assist a casino host reviewing a synthetic CMS record. Give a short briefing for the floor, not a score or an approved offer. Use exactly these headings: SNAPSHOT, HOST FOCUS, DO NOT. Keep each section to one or two short sentences. Never invent facts, encourage increased gambling, or bypass responsible-gaming checks." +
          rgLock,
        context: patronBriefingContext(patron),
        gatewayConfig: body.gatewayConfig ?? {},
      }),
    );
  } catch (error) {
    return noStore(
      {
        error:
          error instanceof Error ? error.message : "Host briefing could not be generated.",
      },
      { status: 502 },
    );
  }
}
