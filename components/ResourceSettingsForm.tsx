"use client";

import { useEffect, useMemo, useState } from "react";
import type { ResourceEnvVar } from "@/lib/types";

const STORAGE_KEY = "casino-ai-gateway-settings-v1";

type BrowserSettings = Record<string, string>;
type ApiResult = {
  ok?: boolean;
  error?: string;
  message?: string;
  latencyMs?: number;
  modelCount?: number;
  models?: string[];
  selectedModel?: string | null;
};

function readSettings(): BrowserSettings {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeSettings(settings: BrowserSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function ResourceSettingsForm({
  resourceId,
  variables,
}: {
  resourceId: string;
  variables: ResourceEnvVar[];
  initialStored?: string[];
  environmentVariables?: string[];
}) {
  const [stored, setStored] = useState<BrowserSettings>({});
  const [values, setValues] = useState<BrowserSettings>({});
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [testing, setTesting] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [message, setMessage] = useState<{
    tone: "ok" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    setStored(readSettings());
    setReady(true);
  }, []);

  const configured = useMemo(
    () =>
      variables
        .filter((variable) => variable.required)
        .every((variable) => Boolean(stored[variable.name])),
    [stored, variables],
  );
  const modelVariable =
    resourceId === "nutanix-enterprise-ai" ? "NAI_MODEL" : "OPENROUTER_MODEL";
  const effectiveSettings = { ...stored, ...values };

  function saveChanges() {
    setPending(true);
    const next = { ...stored };
    for (const variable of variables) {
      const value = values[variable.name]?.trim();
      if (value) next[variable.name] = value;
    }
    writeSettings(next);
    setStored(next);
    setValues({});
    setModels([]);
    setMessage({
      tone: "ok",
      text: "Saved in this browser only. The server does not persist these values.",
    });
    setPending(false);
  }

  function clearValue(name: string) {
    const next = { ...stored };
    delete next[name];
    if (name !== modelVariable) delete next[modelVariable];
    writeSettings(next);
    setStored(next);
    setModels([]);
    setSelectedModel("");
    setMessage({ tone: "ok", text: "Removed from this browser." });
  }

  async function testConnection() {
    setTesting(true);
    setMessage(null);
    try {
      const response = await fetch("/api/shared-resource-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceId, gatewayConfig: effectiveSettings }),
      });
      const result = (await response.json()) as ApiResult;
      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Connection test failed.");
      }
      setModels(result.models ?? []);
      setSelectedModel(result.selectedModel ?? "");
      setMessage({
        tone: "ok",
        text: `${result.message} ${result.modelCount ?? 0} models · ${result.latencyMs ?? 0} ms`,
      });
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "Connection test failed.",
      });
    } finally {
      setTesting(false);
    }
  }

  async function saveModel() {
    if (!selectedModel) return;
    const config = { ...effectiveSettings, [modelVariable]: selectedModel };
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/shared-resource-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceId,
          operation: "select-model",
          model: selectedModel,
          gatewayConfig: config,
        }),
      });
      const result = (await response.json()) as ApiResult;
      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Model selection could not be validated.");
      }
      writeSettings(config);
      setStored(config);
      setValues({});
      setMessage({ tone: "ok", text: "Default model saved in this browser." });
    } catch (error) {
      setMessage({
        tone: "error",
        text:
          error instanceof Error
            ? error.message
            : "Model selection could not be saved.",
      });
    } finally {
      setPending(false);
    }
  }

  const hasChanges = variables.some(
    (variable) => Boolean(values[variable.name]?.trim()),
  );
  const canTest = variables
    .filter((variable) => variable.required)
    .every((variable) => Boolean(effectiveSettings[variable.name]?.trim()));

  return (
    <div className="mt-5 border-t border-stone-200 pt-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-navy-900">
            Browser-local settings
          </h4>
          <p className="mt-1 max-w-[72ch] text-xs leading-relaxed text-charcoal-700">
            Keys are saved in this browser&apos;s local storage. They are sent
            with inference requests but are never written to the server or
            Kubernetes Secret.
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
            ready && configured
              ? "bg-success/15 text-success-dark"
              : "bg-mist-100 text-charcoal-700"
          }`}
        >
          {ready && configured ? "Configured in this browser" : "Not configured"}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {variables.map((variable) => {
          const hasStoredValue = Boolean(stored[variable.name]);
          return (
            <div
              key={variable.name}
              className="grid gap-3 rounded-md border border-stone-200 bg-white p-3 md:grid-cols-[minmax(13rem,1fr)_minmax(14rem,1.2fr)_auto]"
            >
              <label htmlFor={`${resourceId}-${variable.name}`}>
                <span className="block font-mono text-xs font-semibold text-navy-900">
                  {variable.name}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-charcoal-700">
                  {variable.description}
                </span>
              </label>
              <input
                id={`${resourceId}-${variable.name}`}
                type={variable.secret ? "password" : "url"}
                autoComplete="off"
                value={values[variable.name] ?? ""}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    [variable.name]: event.target.value,
                  }))
                }
                placeholder={
                  hasStoredValue
                    ? "Stored in this browser — enter a replacement"
                    : variable.example || "Enter a value"
                }
                className="h-10 w-full rounded-md border border-stone-200 bg-white px-3 text-sm text-charcoal-900"
              />
              <div className="flex items-center justify-end gap-2">
                <span className={`text-xs font-semibold ${hasStoredValue ? "text-success-dark" : "text-charcoal-700"}`}>
                  {hasStoredValue ? "Browser" : "Not set"}
                </span>
                {hasStoredValue && (
                  <button
                    type="button"
                    onClick={() => clearValue(variable.name)}
                    className="rounded-md border border-stone-200 px-2.5 py-1.5 text-xs font-semibold text-burgundy-700"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {models.length > 0 && (
        <div className="mt-4 rounded-md border border-stone-200 bg-mist-100 p-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-charcoal-700">
            Default inference model
            <select
              value={selectedModel}
              onChange={(event) => setSelectedModel(event.target.value)}
              className="mt-2 block h-10 w-full rounded-md border border-stone-200 bg-white px-3 text-sm normal-case"
            >
              <option value="" disabled>Select an available model</option>
              {models.map((model) => <option key={model}>{model}</option>)}
            </select>
          </label>
          <button
            type="button"
            disabled={pending || !selectedModel || selectedModel === stored[modelVariable]}
            onClick={saveModel}
            className="mt-3 rounded-md bg-navy-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Save as default model
          </button>
          {stored[modelVariable] && (
            <p className="mt-2 text-xs text-success-dark">
              Current browser default: {stored[modelVariable]}
            </p>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={pending || !hasChanges}
          onClick={saveChanges}
          className="rounded-md bg-navy-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Save in this browser
        </button>
        <button
          type="button"
          disabled={pending || testing || !canTest}
          onClick={testConnection}
          className="rounded-md border border-navy-700 px-4 py-2 text-sm font-semibold text-navy-900 disabled:opacity-50"
        >
          {testing ? "Testing…" : "Test connection"}
        </button>
        <p role="status" className={`text-xs ${message?.tone === "error" ? "text-burgundy-700" : "text-success-dark"}`}>
          {message?.text}
        </p>
      </div>
    </div>
  );
}
