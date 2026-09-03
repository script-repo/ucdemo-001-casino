"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { ResourceEnvVar } from "@/lib/types";

type ApiResult = {
  ok?: boolean;
  error?: string;
  setVariables?: string[];
  message?: string;
  latencyMs?: number;
  modelCount?: number;
  models?: string[];
  selectedModel?: string | null;
};

export function ResourceSettingsForm({
  resourceId,
  variables,
  initialStored,
  environmentVariables,
}: {
  resourceId: string;
  variables: ResourceEnvVar[];
  initialStored: string[];
  environmentVariables: string[];
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const [stored, setStored] = useState(initialStored);
  const [pending, setPending] = useState(false);
  const [testing, setTesting] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [message, setMessage] = useState<{
    tone: "ok" | "error";
    text: string;
  } | null>(null);

  const storedSet = useMemo(() => new Set(stored), [stored]);
  const environmentSet = useMemo(
    () => new Set(environmentVariables),
    [environmentVariables],
  );
  const changes = Object.fromEntries(
    Object.entries(values).filter(([, value]) => value.trim()),
  );
  const canTest = variables
    .filter((variable) => variable.required)
    .every(
      (variable) =>
        storedSet.has(variable.name) || environmentSet.has(variable.name),
    );

  async function request(body: {
    set?: Record<string, string>;
    clear?: string[];
  }) {
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/shared-resource-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceId, ...body }),
      });
      const result = (await response.json()) as ApiResult;
      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Settings could not be saved.");
      }
      setStored(result.setVariables ?? []);
      setValues({});
      setModels([]);
      setSelectedModel("");
      setMessage({
        tone: "ok",
        text: body.clear ? "Setting cleared." : "Settings saved securely.",
      });
      router.refresh();
    } catch (error) {
      setMessage({
        tone: "error",
        text:
          error instanceof Error ? error.message : "Settings could not be saved.",
      });
    } finally {
      setPending(false);
    }
  }

  async function testConnection() {
    setTesting(true);
    setMessage(null);
    try {
      const response = await fetch("/api/shared-resource-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceId }),
      });
      const result = (await response.json()) as ApiResult;
      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Connection test failed.");
      }
      setMessage({
        tone: "ok",
        text: `${result.message} ${result.modelCount ?? 0} models · ${result.latencyMs ?? 0} ms`,
      });
      setModels(result.models ?? []);
      setSelectedModel(result.selectedModel ?? "");
    } catch (error) {
      setMessage({
        tone: "error",
        text:
          error instanceof Error ? error.message : "Connection test failed.",
      });
    } finally {
      setTesting(false);
    }
  }

  async function selectModel(model: string) {
    setSelectedModel(model);
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/shared-resource-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceId,
          operation: "select-model",
          model,
        }),
      });
      const result = (await response.json()) as ApiResult;
      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Model selection could not be saved.");
      }
      setSelectedModel(result.selectedModel ?? model);
      setMessage({ tone: "ok", text: "Default inference model saved." });
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

  return (
    <div className="mt-5 border-t border-stone-200 pt-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-navy-900">
            Environment settings
          </h4>
          <p className="mt-1 max-w-[70ch] text-xs leading-relaxed text-charcoal-700">
            Values are write-only. Saved values are stored in the namespace
            Secret and are never returned to this page.
          </p>
        </div>
        <span className="rounded-full bg-mist-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-charcoal-700">
          Unauthenticated lab access
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {variables.map((variable) => {
          const inSecret = storedSet.has(variable.name);
          const inEnvironment = environmentSet.has(variable.name);
          const configured = inSecret || inEnvironment;

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
                type="password"
                autoComplete="new-password"
                value={values[variable.name] ?? ""}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    [variable.name]: event.target.value,
                  }))
                }
                placeholder={
                  configured
                    ? "Configured — enter a replacement"
                    : variable.example || "Enter a value"
                }
                className="h-10 w-full rounded-md border border-stone-200 bg-white px-3 text-sm text-charcoal-900 placeholder:text-charcoal-700/60 focus:border-navy-700 focus:outline-none"
              />

              <div className="flex min-w-28 items-center justify-end gap-2">
                <span
                  className={`text-xs font-semibold ${
                    configured ? "text-success-dark" : "text-charcoal-700"
                  }`}
                >
                  {inSecret
                    ? "Secret"
                    : inEnvironment
                      ? "Deployment"
                      : "Not set"}
                </span>
                {inSecret && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => request({ clear: [variable.name] })}
                    className="rounded-md border border-stone-200 px-2.5 py-1.5 text-xs font-semibold text-burgundy-700 hover:bg-mist-100 disabled:opacity-50"
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
        <label className="mt-4 block rounded-md border border-stone-200 bg-mist-100 p-3">
          <span className="block text-xs font-semibold uppercase tracking-wide text-charcoal-700">
            Default inference model
          </span>
          <select
            value={selectedModel}
            disabled={pending || testing}
            onChange={(event) => void selectModel(event.target.value)}
            className="mt-2 h-10 w-full rounded-md border border-stone-200 bg-white px-3 text-sm text-charcoal-900 focus:border-navy-700 focus:outline-none"
          >
            <option value="" disabled>
              Select an available model
            </option>
            {models.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={pending || Object.keys(changes).length === 0}
          onClick={() => request({ set: changes })}
          className="rounded-md bg-navy-900 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          disabled={pending || testing || !canTest}
          onClick={testConnection}
          className="rounded-md border border-navy-700 px-4 py-2 text-sm font-semibold text-navy-900 hover:bg-mist-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {testing ? "Testing…" : "Test connection"}
        </button>
        <p
          role="status"
          className={`text-xs ${
            message?.tone === "error" ? "text-burgundy-700" : "text-success-dark"
          }`}
        >
          {message?.text}
        </p>
      </div>
    </div>
  );
}
