import "server-only";

import { getSettingValues } from "@/lib/kubernetes-settings";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_OPENROUTER_MODEL =
  "nvidia/nemotron-3-super-120b-a12b:free";
const REQUEST_TIMEOUT_MS = 20_000;

type ModelsResponse = {
  data?: Array<{ id?: string }>;
};

type ChatResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
};

function endpoint(base: string, path: string) {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

function errorForStatus(status: number) {
  if (status === 401 || status === 403) return "Authentication failed.";
  if (status === 404) return "Endpoint does not expose the expected API path.";
  return `Gateway returned HTTP ${status}.`;
}

async function listModels(baseUrl: string, apiKey: string) {
  const started = Date.now();
  const response = await fetch(endpoint(baseUrl, "models"), {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(errorForStatus(response.status));
  const payload = (await response.json()) as ModelsResponse;
  return {
    latencyMs: Date.now() - started,
    models: (payload.data ?? [])
      .map((model) => model.id)
      .filter((id): id is string => Boolean(id)),
  };
}

export async function testModelGateway(resourceId: string): Promise<{
  message: string;
  latencyMs: number;
  modelCount: number;
}> {
  if (resourceId === "openrouter") {
    const settings = await getSettingValues(["OPENROUTER_API_KEY"]);
    if (!settings.OPENROUTER_API_KEY) {
      throw new Error("Save an OpenRouter API key before testing.");
    }
    const result = await listModels(
      OPENROUTER_BASE_URL,
      settings.OPENROUTER_API_KEY,
    );
    return {
      message: "OpenRouter authentication succeeded.",
      latencyMs: result.latencyMs,
      modelCount: result.models.length,
    };
  }

  if (resourceId === "nutanix-enterprise-ai") {
    const settings = await getSettingValues(["NAI_ENDPOINT", "NAI_API_KEY"]);
    if (!settings.NAI_ENDPOINT || !settings.NAI_API_KEY) {
      throw new Error(
        "Save the Nutanix Enterprise AI endpoint and API key before testing.",
      );
    }
    const result = await listModels(settings.NAI_ENDPOINT, settings.NAI_API_KEY);
    return {
      message: "Nutanix Enterprise AI authentication succeeded.",
      latencyMs: result.latencyMs,
      modelCount: result.models.length,
    };
  }

  throw new Error("This shared resource does not support a connection test.");
}

async function resolveChatGateway(): Promise<{
  provider: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}> {
  const settings = await getSettingValues([
    "OPENROUTER_API_KEY",
    "OPENROUTER_CHAT_MODEL",
    "NAI_ENDPOINT",
    "NAI_API_KEY",
  ]);

  if (settings.OPENROUTER_API_KEY) {
    return {
      provider: "OpenRouter",
      baseUrl: OPENROUTER_BASE_URL,
      apiKey: settings.OPENROUTER_API_KEY,
      model:
        settings.OPENROUTER_CHAT_MODEL || DEFAULT_OPENROUTER_MODEL,
    };
  }

  if (settings.NAI_ENDPOINT && settings.NAI_API_KEY) {
    const available = await listModels(
      settings.NAI_ENDPOINT,
      settings.NAI_API_KEY,
    );
    const model = available.models[0];
    if (!model) {
      throw new Error("Nutanix Enterprise AI returned no available models.");
    }
    return {
      provider: "Nutanix Enterprise AI",
      baseUrl: settings.NAI_ENDPOINT,
      apiKey: settings.NAI_API_KEY,
      model,
    };
  }

  throw new Error(
    "Configure OpenRouter or Nutanix Enterprise AI in Shared Resources first.",
  );
}

export async function generateEpvBriefing(context: string): Promise<{
  text: string;
  provider: string;
  model: string;
}> {
  const gateway = await resolveChatGateway();
  const response = await fetch(endpoint(gateway.baseUrl, "chat/completions"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${gateway.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: gateway.model,
      temperature: 0.2,
      max_tokens: 1200,
      messages: [
        {
          role: "system",
          content:
            "You are a casino player-development analyst. Produce a concise operational briefing from aggregated, synthetic Expected Player Value data. Do not invent facts, prescribe gambling behavior, or treat predicted value as an approved offer. Use short headings and bullets.",
        },
        {
          role: "user",
          content: context,
        },
      ],
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    cache: "no-store",
  });

  const payload = (await response.json()) as ChatResponse;
  if (!response.ok) {
    throw new Error(payload.error?.message || errorForStatus(response.status));
  }
  const text = payload.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("The model returned an empty briefing.");

  return {
    text: text.slice(0, 6_000),
    provider: gateway.provider,
    model: gateway.model,
  };
}
