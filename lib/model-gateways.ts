import "server-only";

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

type ChatGateway = {
  provider: string;
  baseUrl: string;
  apiKey: string;
  model: string;
};

export type BrowserGatewayConfig = {
  NAI_ENDPOINT?: string;
  NAI_API_KEY?: string;
  NAI_MODEL?: string;
  OPENROUTER_API_KEY?: string;
  OPENROUTER_MODEL?: string;
};

function cleanConfig(config: BrowserGatewayConfig | undefined): BrowserGatewayConfig {
  if (!config || typeof config !== "object") return {};
  const value = (name: keyof BrowserGatewayConfig, max = 8_192) => {
    const candidate = config[name];
    return typeof candidate === "string" && candidate.length <= max
      ? candidate.trim()
      : "";
  };
  return {
    NAI_ENDPOINT: value("NAI_ENDPOINT", 2_048),
    NAI_API_KEY: value("NAI_API_KEY"),
    NAI_MODEL: value("NAI_MODEL", 300),
    OPENROUTER_API_KEY: value("OPENROUTER_API_KEY"),
    OPENROUTER_MODEL: value("OPENROUTER_MODEL", 300),
  };
}

function endpoint(base: string, path: string) {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

function normalizeOpenRouterKey(value: string) {
  const key = value.trim().replace(/^Bearer\s+/i, "");
  return /^[a-f0-9]{64}$/i.test(key) ? `sk-or-v1-${key}` : key;
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

export async function testModelGateway(
  resourceId: string,
  browserConfig: BrowserGatewayConfig,
): Promise<{
  message: string;
  latencyMs: number;
  modelCount: number;
  models: string[];
  selectedModel: string | null;
}> {
  const settings = cleanConfig(browserConfig);
  if (resourceId === "openrouter") {
    if (!settings.OPENROUTER_API_KEY) {
      throw new Error("Save an OpenRouter API key before testing.");
    }
    const apiKey = normalizeOpenRouterKey(settings.OPENROUTER_API_KEY);
    const started = Date.now();
    const authentication = await fetch(endpoint(OPENROUTER_BASE_URL, "key"), {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!authentication.ok) {
      throw new Error(errorForStatus(authentication.status));
    }
    const result = await listModels(OPENROUTER_BASE_URL, apiKey);
    return {
      message: "OpenRouter authentication succeeded.",
      latencyMs: Date.now() - started,
      modelCount: result.models.length,
      models: result.models.sort(),
      selectedModel:
        settings.OPENROUTER_MODEL &&
        result.models.includes(settings.OPENROUTER_MODEL)
          ? settings.OPENROUTER_MODEL
          : null,
    };
  }

  if (resourceId === "nutanix-enterprise-ai") {
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
      models: result.models.sort(),
      selectedModel:
        settings.NAI_MODEL && result.models.includes(settings.NAI_MODEL)
          ? settings.NAI_MODEL
          : null,
    };
  }

  throw new Error("This shared resource does not support a connection test.");
}

export async function selectModelGateway(
  resourceId: string,
  model: string,
  browserConfig: BrowserGatewayConfig,
): Promise<{ selectedModel: string }> {
  const result = await testModelGateway(resourceId, browserConfig);
  if (!result.models.includes(model)) {
    throw new Error("Select a model returned by the authenticated gateway.");
  }
  return { selectedModel: model };
}

async function resolveChatGateways(browserConfig: BrowserGatewayConfig): Promise<ChatGateway[]> {
  const settings = cleanConfig(browserConfig);
  const gateways: ChatGateway[] = [];
  const setupErrors: string[] = [];

  // Nutanix Enterprise AI is intentionally first. OpenRouter is the fallback.
  if (settings.NAI_ENDPOINT && settings.NAI_API_KEY) {
    try {
      const available = await listModels(
        settings.NAI_ENDPOINT,
        settings.NAI_API_KEY,
      );
      const model =
        settings.NAI_MODEL && available.models.includes(settings.NAI_MODEL)
          ? settings.NAI_MODEL
          : available.models[0];
      if (!model) {
        throw new Error("No available models were returned.");
      }
      gateways.push({
        provider: "Nutanix Enterprise AI",
        baseUrl: settings.NAI_ENDPOINT,
        apiKey: settings.NAI_API_KEY,
        model,
      });
    } catch (error) {
      setupErrors.push(
        `Nutanix Enterprise AI: ${error instanceof Error ? error.message : "unavailable"}`,
      );
    }
  }

  if (settings.OPENROUTER_API_KEY) {
    gateways.push({
      provider: "OpenRouter",
      baseUrl: OPENROUTER_BASE_URL,
      apiKey: normalizeOpenRouterKey(settings.OPENROUTER_API_KEY),
      model:
        settings.OPENROUTER_MODEL ||
        DEFAULT_OPENROUTER_MODEL,
    });
  }

  if (gateways.length > 0) return gateways;
  if (setupErrors.length > 0) {
    throw new Error(setupErrors.join(" "));
  }

  throw new Error(
    "Configure OpenRouter or Nutanix Enterprise AI in this browser first.",
  );
}

async function requestChat(
  gateway: ChatGateway,
  systemPrompt: string,
  context: string,
) {
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
          content: systemPrompt,
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

export async function generateModelText({
  systemPrompt,
  context,
  gatewayConfig,
}: {
  systemPrompt: string;
  context: string;
  gatewayConfig: BrowserGatewayConfig;
}): Promise<{
  text: string;
  provider: string;
  model: string;
}> {
  const gateways = await resolveChatGateways(gatewayConfig);
  const failures: string[] = [];
  for (const gateway of gateways) {
    try {
      return await requestChat(gateway, systemPrompt, context);
    } catch (error) {
      failures.push(
        `${gateway.provider}: ${error instanceof Error ? error.message : "unavailable"}`,
      );
    }
  }
  throw new Error(`No inference gateway succeeded. ${failures.join(" ")}`);
}

export async function generateEpvBriefing(
  context: string,
  gatewayConfig: BrowserGatewayConfig,
) {
  return generateModelText({
    systemPrompt:
      "You are a casino player-development analyst. Explain aggregated, synthetic Expected Player Value data in very simple language. Use exactly these headings: BOTTOM LINE, WHAT STANDS OUT, RECOMMENDED NEXT STEPS, WATCH OUT. Under BOTTOM LINE write two short sentences. Under the other headings use no more than three short bullets. Do not use jargon, invent facts, prescribe gambling behavior, or treat predicted value as an approved offer.",
    context,
    gatewayConfig,
  });
}
