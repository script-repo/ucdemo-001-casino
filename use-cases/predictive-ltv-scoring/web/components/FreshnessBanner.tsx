"use client";

import { useState } from "react";
import type { HealthPayload } from "../client-api";
import { formatWhen } from "../format";

export function FreshnessBanner({ health }: { health: HealthPayload }) {
  const [open, setOpen] = useState(false);
  const { run, model, hoursSinceScore, staleThresholdHours, isStale } = health;

  const tone =
    run.status === "failed"
      ? "critical"
      : run.status === "running"
        ? "info"
        : isStale
          ? "warning"
          : "success";

  const title =
    run.status === "failed"
      ? "Scoring failed"
      : run.status === "running"
        ? "Scoring in progress"
        : isStale
          ? "Scores may be out of date"
          : "Scores are up to date";

  const detail =
    run.status === "failed"
      ? "The last scoring run did not publish. The previous valid set is still shown."
      : isStale
        ? `Last calculated ${Math.round(hoursSinceScore)} hours ago (threshold ${staleThresholdHours}h). Acknowledge staleness before exporting.`
        : `Last calculated ${formatWhen(run.scoredAt)}. Scoring method ${model.modelLabel}.`;

  const border =
    tone === "critical"
      ? "border-critical/40 bg-critical/10"
      : tone === "warning"
        ? "border-warning/40 bg-warning/10"
        : tone === "info"
          ? "border-information/40 bg-information/10"
          : "border-success/30 bg-success/10";

  const badge =
    tone === "critical"
      ? "text-critical"
      : tone === "warning"
        ? "text-warning"
        : tone === "info"
          ? "text-information"
          : "text-success";

  return (
    <div className={`rounded-lg border ${border}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span className={`mt-0.5 text-sm font-semibold ${badge}`} aria-hidden>
          {tone === "success" ? "●" : tone === "warning" ? "▲" : tone === "critical" ? "■" : "◌"}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-charcoal-900">{title}</span>
            <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-charcoal-700">
              {run.status === "healthy" && !isStale ? "Current" : run.status}
            </span>
          </span>
          <span className="mt-1 block text-sm text-charcoal-700">{detail}</span>
          <span className="mt-1 block text-xs text-charcoal-700">
            Scoring method: {model.modelLabel}
            <span className="text-charcoal-700/70"> · </span>
            Data through {run.trainingThrough}
            <span className="text-charcoal-700/70"> · </span>
            {run.property}
          </span>
        </span>
        <span className="shrink-0 text-xs font-semibold text-navy-900">
          {open ? "Hide details" : "Details"}
        </span>
      </button>

      {open && (
        <div className="border-t border-stone-200/80 bg-white/50 px-4 py-4">
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-charcoal-700">
                Run ID
              </dt>
              <dd className="mt-1 font-mono text-xs text-charcoal-900">{run.runId}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-charcoal-700">
                Technical model ID
              </dt>
              <dd className="mt-1 font-mono text-xs text-charcoal-900">{run.modelVersion}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-charcoal-700">
                Records
              </dt>
              <dd className="mt-1 text-charcoal-900">
                {run.recordsScored} scored · {run.recordsSkipped} skipped ·{" "}
                {run.recordsProcessed} processed
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-charcoal-700">
                Support
              </dt>
              <dd className="mt-1 text-charcoal-900">{run.supportOwner}</dd>
            </div>
          </dl>
          <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {run.stages.map((stage) => (
              <li
                key={stage.name}
                className="rounded-md border border-stone-200 bg-white px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={
                      stage.status === "ok"
                        ? "text-success"
                        : stage.status === "warn"
                          ? "text-warning"
                          : stage.status === "fail"
                            ? "text-critical"
                            : "text-charcoal-700"
                    }
                    aria-hidden
                  >
                    {stage.status === "ok" ? "✓" : stage.status === "warn" ? "!" : "·"}
                  </span>
                  <span className="font-medium text-charcoal-900">{stage.name}</span>
                </div>
                <p className="mt-1 text-xs text-charcoal-700">{stage.detail}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
