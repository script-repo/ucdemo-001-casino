"use client";

import { useState } from "react";
import type { ScoreFilters } from "../types";
import { buildExport } from "../client-api";

export function ExportModal({
  filters,
  open,
  onClose,
  isStale,
}: {
  filters: ScoreFilters;
  open: boolean;
  onClose: () => void;
  isStale: boolean;
}) {
  const [ackStale, setAckStale] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    count: number;
    meta: {
      modelVersion: string;
      modelLabel: string;
      scoreDate: string;
      property: string;
      exportedAt: string;
    };
  } | null>(null);

  if (!open) return null;

  async function loadPreview() {
    setBusy(true);
    setError(null);
    try {
      const result = await buildExport(filters);
      setPreview({ count: result.count, meta: result.meta });
    } catch {
      setError("Could not prepare export.");
    } finally {
      setBusy(false);
    }
  }

  async function download() {
    if (isStale && !ackStale) {
      setError("Acknowledge stale scores before exporting.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await buildExport(filters);
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `expected-player-value-${result.meta.scoreDate}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      onClose();
    } catch {
      setError("Export failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-title"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-stone-200 bg-white shadow-xl">
        <div className="border-b border-stone-200 px-5 py-4">
          <h2 id="export-title" className="font-serif text-xl text-navy-900">
            Export cohort
          </h2>
          <p className="mt-1 text-sm text-charcoal-700">
            Review classification and score lineage before download.
          </p>
        </div>

        <div className="space-y-4 px-5 py-4 text-sm">
          {!preview ? (
            <button
              type="button"
              onClick={loadPreview}
              disabled={busy}
              className="rounded-md bg-navy-900 px-4 py-2 font-semibold text-ivory-100 disabled:opacity-50"
            >
              {busy ? "Preparing…" : "Prepare export summary"}
            </button>
          ) : (
            <dl className="space-y-2 rounded-md border border-stone-200 bg-mist-100 p-3">
              <Row label="Records" value={String(preview.count)} />
              <Row label="Property" value={preview.meta.property} />
              <Row label="Score date" value={preview.meta.scoreDate} />
              <Row label="Scoring method" value={preview.meta.modelLabel} />
              <Row label="Technical ID" value={preview.meta.modelVersion} />
              <Row label="Classification" value="Internal — player analytics" />
              <Row
                label="Included columns"
                value="player_id, tier, expected value, rank, trend, activity, model, timestamps"
              />
              <Row
                label="Note"
                value="Expected value is a prediction, not an approved reinvestment amount. No names or contact details."
              />
            </dl>
          )}

          {isStale && (
            <label className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 p-3">
              <input
                type="checkbox"
                checked={ackStale}
                onChange={(e) => setAckStale(e.target.checked)}
                className="mt-1"
              />
              <span>
                I understand these scores may be out of date and accept exporting
                them for internal review only.
              </span>
            </label>
          )}

          {error && <p className="text-sm text-critical">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-stone-200 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-stone-200 px-4 py-2 font-medium text-charcoal-900"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={download}
            disabled={busy || !preview || (isStale && !ackStale)}
            className="rounded-md bg-navy-900 px-4 py-2 font-semibold text-ivory-100 disabled:opacity-40"
          >
            {busy ? "Working…" : "Download CSV"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-2">
      <dt className="font-semibold text-charcoal-700">{label}</dt>
      <dd className="text-charcoal-900 break-words">{value}</dd>
    </div>
  );
}
