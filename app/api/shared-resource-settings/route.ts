import { getSharedResources } from "@/lib/shared-resources";
import {
  getStoredSettingNames,
  patchStoredSettings,
} from "@/lib/kubernetes-settings";
import { testModelGateway } from "@/lib/model-gateways";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BODY_BYTES = 64 * 1024;
const MAX_VALUE_BYTES = 8 * 1024;

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");
  if (!host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

async function allowedVariables(resourceId: string): Promise<Set<string> | null> {
  const resources = await getSharedResources();
  const resource = resources.find((entry) => entry.id === resourceId);
  return resource ? new Set(resource.env.map((variable) => variable.name)) : null;
}

export async function GET() {
  try {
    const setVariables = [...(await getStoredSettingNames())].sort();
    return Response.json(
      { setVariables },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Could not read shared-resource settings.", error);
    return Response.json(
      { error: "Settings storage is unavailable." },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return Response.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }

  let resourceId: unknown;
  try {
    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, "utf8") > 4 * 1024) {
      return Response.json({ error: "Request is too large." }, { status: 413 });
    }
    resourceId = (JSON.parse(rawBody) as { resourceId?: unknown }).resourceId;
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (
    resourceId !== "openrouter" &&
    resourceId !== "nutanix-enterprise-ai"
  ) {
    return Response.json(
      { error: "This shared resource cannot be tested." },
      { status: 400 },
    );
  }

  try {
    return Response.json({ ok: true, ...(await testModelGateway(resourceId)) });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Connection test failed.",
      },
      { status: 502 },
    );
  }
}

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) {
    return Response.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    return Response.json({ error: "Request is too large." }, { status: 413 });
  }
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return Response.json({ error: "Expected application/json." }, { status: 415 });
  }

  let payload: unknown;
  try {
    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) {
      return Response.json({ error: "Request is too large." }, { status: 413 });
    }
    payload = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (!payload || typeof payload !== "object") {
    return Response.json({ error: "Invalid settings payload." }, { status: 400 });
  }

  const candidate = payload as {
    resourceId?: unknown;
    set?: unknown;
    clear?: unknown;
  };
  if (typeof candidate.resourceId !== "string") {
    return Response.json({ error: "resourceId is required." }, { status: 400 });
  }

  const allowlist = await allowedVariables(candidate.resourceId);
  if (!allowlist) {
    return Response.json({ error: "Unknown shared resource." }, { status: 404 });
  }

  const set =
    candidate.set &&
    typeof candidate.set === "object" &&
    !Array.isArray(candidate.set)
      ? (candidate.set as Record<string, unknown>)
      : {};
  const clear = Array.isArray(candidate.clear) ? candidate.clear : [];
  const setEntries = Object.entries(set);

  if (setEntries.length + clear.length > allowlist.size) {
    return Response.json({ error: "Too many settings in one request." }, { status: 400 });
  }

  const cleanSet: Record<string, string> = {};
  for (const [name, value] of setEntries) {
    if (!allowlist.has(name) || typeof value !== "string") {
      return Response.json({ error: "Setting is not allowed." }, { status: 400 });
    }
    const trimmed = value.trim();
    if (!trimmed) continue;
    if (Buffer.byteLength(trimmed, "utf8") > MAX_VALUE_BYTES) {
      return Response.json({ error: `${name} exceeds 8 KiB.` }, { status: 413 });
    }
    cleanSet[name] = trimmed;
  }

  const cleanClear: string[] = [];
  for (const name of clear) {
    if (typeof name !== "string" || !allowlist.has(name)) {
      return Response.json({ error: "Setting is not allowed." }, { status: 400 });
    }
    if (!(name in cleanSet)) cleanClear.push(name);
  }

  if (Object.keys(cleanSet).length === 0 && cleanClear.length === 0) {
    return Response.json({ error: "No setting changes supplied." }, { status: 400 });
  }

  try {
    const stored = await patchStoredSettings({
      set: cleanSet,
      clear: cleanClear,
    });
    return Response.json({
      ok: true,
      setVariables: [...stored].filter((name) => allowlist.has(name)).sort(),
    });
  } catch (error) {
    console.error("Could not update shared-resource settings.", error);
    return Response.json(
      { error: "Settings storage is unavailable." },
      { status: 503 },
    );
  }
}
