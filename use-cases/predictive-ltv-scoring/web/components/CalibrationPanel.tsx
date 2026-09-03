"use client";

import type { CalibrationDecile, ModelInfo } from "../types";
import { money } from "../format";

export function CalibrationPanel({
  deciles,
  model,
}: {
  deciles: CalibrationDecile[];
  model: ModelInfo;
}) {
  const maxVal = Math.max(
    ...deciles.flatMap((d) => [d.predictedAvg, d.actualAvg]),
    1,
  );
  const failing = deciles.filter((d) => !d.withinBand);

  return (
    <div className="space-y-5 rounded-lg border border-stone-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-serif text-xl text-navy-900">Prediction quality</h3>
          <p className="mt-1 max-w-[60ch] text-sm text-charcoal-700">
            How closely estimates matched eventual results by group (each group ≈
            10% of players). Approved tolerance is ±15%.
          </p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-mist-100 px-4 py-3 text-sm">
          <p className="font-semibold text-charcoal-900">
            {model.decilesPassing} of {model.decilesTotal} groups within tolerance
          </p>
          <p className="mt-1 text-charcoal-700">
            Average prediction error: {model.weightedMape}%
          </p>
          <p className="mt-1 text-xs text-charcoal-700">
            {model.modelLabel} · Eval {model.evalPeriod}
          </p>
        </div>
      </div>

      <div
        className={`rounded-md border px-3 py-2 text-sm ${
          failing.length === 0
            ? "border-success/30 bg-success/10 text-charcoal-900"
            : "border-warning/40 bg-warning/10 text-charcoal-900"
        }`}
      >
        {failing.length === 0
          ? "Prediction quality is acceptable for pilot use."
          : `Groups outside tolerance: ${failing.map((d) => `Group ${d.decile} (${d.pctError > 0 ? "+" : ""}${d.pctError}%)`).join("; ")}.`}
      </div>

      <div className="space-y-3" role="img" aria-label="Predicted versus actual by decile">
        {deciles.map((d) => (
          <div key={d.decile} className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-3">
            <span className="text-xs font-semibold text-charcoal-700">
              Group {d.decile}
            </span>
            <div className="space-y-1">
              <Bar
                label="Predicted"
                value={d.predictedAvg}
                max={maxVal}
                color="bg-navy-900"
              />
              <Bar
                label="Actual"
                value={d.actualAvg}
                max={maxVal}
                color="bg-gold-500"
              />
            </div>
            <div className="w-28 text-right text-xs">
              <span
                className={`font-semibold tabular ${
                  d.withinBand ? "text-success" : "text-warning"
                }`}
              >
                {d.pctError > 0 ? "+" : ""}
                {d.pctError}%
              </span>
              <div className="text-charcoal-700">{d.withinBand ? "Within band" : "Outside band"}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <caption className="sr-only">
            Calibration table: predicted and actual averages by decile
          </caption>
          <thead className="bg-mist-100 text-xs uppercase tracking-wide text-charcoal-700">
            <tr>
              <th className="px-3 py-2">Group</th>
              <th className="px-3 py-2 text-right">Predicted avg</th>
              <th className="px-3 py-2 text-right">Actual avg</th>
              <th className="px-3 py-2 text-right">Error</th>
              <th className="px-3 py-2 text-right">Players</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {deciles.map((d) => (
              <tr key={d.decile} className="border-t border-stone-200">
                <td className="px-3 py-2">{d.decile}</td>
                <td className="px-3 py-2 text-right tabular">{money(d.predictedAvg)}</td>
                <td className="px-3 py-2 text-right tabular">{money(d.actualAvg)}</td>
                <td className="px-3 py-2 text-right tabular">
                  {d.pctError > 0 ? "+" : ""}
                  {d.pctError}%
                </td>
                <td className="px-3 py-2 text-right tabular">{d.nPlayers}</td>
                <td className="px-3 py-2">
                  {d.withinBand ? "Within ±15%" : "Outside ±15%"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-charcoal-700">
        Model promotion is a human decision. Passing an aggregate metric alone does
        not promote a candidate. Prior production models remain recoverable in the
        registry (not wired in this MVP).
      </p>
    </div>
  );
}

function Bar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const width = Math.max(2, (value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 text-[10px] uppercase tracking-wide text-charcoal-700">
        {label}
      </span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-mist-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
