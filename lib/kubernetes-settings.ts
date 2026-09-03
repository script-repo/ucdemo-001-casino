import "server-only";

import { readFile } from "node:fs/promises";

const SECRET_NAME =
  process.env.SHARED_RESOURCE_SETTINGS_SECRET ?? "shared-resource-settings";
const TOKEN_FILE =
  "/var/run/secrets/kubernetes.io/serviceaccount/token";
const NAMESPACE_FILE =
  "/var/run/secrets/kubernetes.io/serviceaccount/namespace";

type SecretResponse = {
  data?: Record<string, string>;
};

function apiServer(): string | null {
  const host = process.env.KUBERNETES_SERVICE_HOST;
  const port = process.env.KUBERNETES_SERVICE_PORT_HTTPS ?? "443";
  return host ? `https://${host}:${port}` : null;
}

async function serviceAccount(): Promise<{
  token: string;
  namespace: string;
} | null> {
  if (!apiServer()) return null;

  try {
    const [token, mountedNamespace] = await Promise.all([
      readFile(TOKEN_FILE, "utf8"),
      readFile(NAMESPACE_FILE, "utf8"),
    ]);
    return {
      token: token.trim(),
      namespace:
        process.env.NKP_NAMESPACE?.trim() || mountedNamespace.trim(),
    };
  } catch {
    return null;
  }
}

async function secretRequest(
  method: "GET" | "PATCH",
  body?: unknown,
): Promise<Response | null> {
  const server = apiServer();
  const account = await serviceAccount();
  if (!server || !account) return null;

  return fetch(
    `${server}/api/v1/namespaces/${encodeURIComponent(account.namespace)}/secrets/${encodeURIComponent(SECRET_NAME)}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${account.token}`,
        Accept: "application/json",
        ...(body
          ? { "Content-Type": "application/merge-patch+json" }
          : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    },
  );
}

/**
 * Returns key names only. Secret values are deliberately never decoded.
 * Local development falls back to process.env and therefore returns no keys.
 */
export async function getStoredSettingNames(): Promise<Set<string>> {
  const response = await secretRequest("GET");
  if (!response || response.status === 404) return new Set();
  if (!response.ok) {
    throw new Error(`Kubernetes Secret read failed (${response.status}).`);
  }

  const secret = (await response.json()) as SecretResponse;
  return new Set(Object.keys(secret.data ?? {}));
}

/**
 * Resolves only explicitly requested settings for server-side integrations.
 * Secret values override deployment environment values and must never be
 * returned directly to a browser or written to logs.
 */
export async function getSettingValues(
  names: string[],
): Promise<Record<string, string>> {
  const values: Record<string, string> = {};
  for (const name of names) {
    if (process.env[name]) values[name] = process.env[name]!;
  }

  const response = await secretRequest("GET");
  if (!response || response.status === 404) return values;
  if (!response.ok) {
    throw new Error(`Kubernetes Secret read failed (${response.status}).`);
  }

  const secret = (await response.json()) as SecretResponse;
  for (const name of names) {
    const encoded = secret.data?.[name];
    if (encoded) values[name] = Buffer.from(encoded, "base64").toString("utf8");
  }
  return values;
}

export async function patchStoredSettings({
  set,
  clear,
}: {
  set: Record<string, string>;
  clear: string[];
}): Promise<Set<string>> {
  const data: Record<string, string | null> = {};

  for (const [name, value] of Object.entries(set)) {
    data[name] = Buffer.from(value, "utf8").toString("base64");
  }
  for (const name of clear) data[name] = null;

  const response = await secretRequest("PATCH", { data });
  if (!response) {
    throw new Error(
      "Kubernetes settings are available only from an in-cluster portal.",
    );
  }
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `Kubernetes Secret update failed (${response.status})${detail ? `: ${detail.slice(0, 240)}` : ""}`,
    );
  }

  const secret = (await response.json()) as SecretResponse;
  return new Set(Object.keys(secret.data ?? {}));
}
