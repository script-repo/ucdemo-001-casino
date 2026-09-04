import {
  selectModelGateway,
  testModelGateway,
  type BrowserGatewayConfig,
} from "@/lib/model-gateways";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return Response.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }

  let payload: {
    resourceId?: unknown;
    operation?: unknown;
    model?: unknown;
    gatewayConfig?: BrowserGatewayConfig;
  };
  try {
    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, "utf8") > 24 * 1024) {
      return Response.json({ error: "Request is too large." }, { status: 413 });
    }
    payload = JSON.parse(rawBody) as typeof payload;
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (
    payload.resourceId !== "openrouter" &&
    payload.resourceId !== "nutanix-enterprise-ai"
  ) {
    return Response.json(
      { error: "This shared resource cannot be tested." },
      { status: 400 },
    );
  }

  try {
    if (payload.operation === "select-model") {
      if (
        typeof payload.model !== "string" ||
        !payload.model.trim() ||
        payload.model.length > 300
      ) {
        return Response.json({ error: "Select a valid model." }, { status: 400 });
      }
      return Response.json({
        ok: true,
        ...(await selectModelGateway(
          payload.resourceId,
          payload.model.trim(),
          payload.gatewayConfig ?? {},
        )),
      });
    }
    return Response.json({
      ok: true,
      ...(await testModelGateway(
        payload.resourceId,
        payload.gatewayConfig ?? {},
      )),
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Connection test failed." },
      { status: 502 },
    );
  }
}
