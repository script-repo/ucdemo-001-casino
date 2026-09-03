"use client";

import { useMemo, useState } from "react";
import {
  REFRESHED_AT,
  SLOT_UNITS,
  TABLE_UNITS,
  THEME_PERFORMANCE,
  ZONES,
  type SlotUnit,
} from "./data";

type Report = { text: string; provider: string; model: string };

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function signedMoney(value: number) {
  return `${value >= 0 ? "+" : "−"}${money(Math.abs(value))}`;
}

function reportSections(text: string) {
  const headings = ["BOTTOM LINE", "UNDERPERFORMERS", "OPPORTUNITIES", "NEXT ACTIONS"];
  const sections: Array<{ heading: string; lines: string[] }> = [];
  let current = { heading: headings[0]!, lines: [] as string[] };
  sections.push(current);
  for (const raw of text.replaceAll("**", "").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const heading = headings.find((item) =>
      line.toUpperCase().replace(/[:#]/g, "").trim().startsWith(item),
    );
    if (heading) {
      current = sections.find((section) => section.heading === heading) ?? { heading, lines: [] };
      if (!sections.includes(current)) sections.push(current);
    } else {
      current.lines.push(line.replace(/^[-*•\d.)\s]+/, ""));
    }
  }
  return sections.filter((section) => section.lines.length);
}

export function PerformanceApp() {
  const [view, setView] = useState<"slots" | "tables">("slots");
  const [zone, setZone] = useState("all");
  const [period, setPeriod] = useState("90");
  const [selectedId, setSelectedId] = useState(SLOT_UNITS[0]!.unitId);
  const [report, setReport] = useState<Report | null>(null);
  const [reportPending, setReportPending] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const units = useMemo(
    () =>
      SLOT_UNITS.filter((unit) => zone === "all" || unit.zone === zone).sort(
        (a, b) => a.residual - b.residual,
      ),
    [zone],
  );
  const selected =
    SLOT_UNITS.find((unit) => unit.unitId === selectedId) ?? units[0]!;
  const eligibleUnits = units.filter((unit) => unit.peerN >= 6);
  const underperformers = eligibleUnits.filter((unit) => unit.residual <= -50);
  const reportCards = useMemo(
    () => (report ? reportSections(report.text) : []),
    [report],
  );

  async function generateReport() {
    setReportPending(true);
    setReportError(null);
    try {
      const response = await fetch("/api/slot-table-performance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation: "generate-report", view, zone, period }),
      });
      const result = (await response.json()) as Partial<Report> & { error?: string };
      if (!response.ok || !result.text) {
        throw new Error(result.error ?? "The report could not be generated.");
      }
      setReport({
        text: result.text,
        provider: result.provider ?? "Inference gateway",
        model: result.model ?? "selected model",
      });
    } catch (error) {
      setReportError(error instanceof Error ? error.message : "The report could not be generated.");
    } finally {
      setReportPending(false);
    }
  }

  return (
    <div className="-mx-2 overflow-hidden rounded-xl border border-stone-200 bg-mist-100 text-charcoal-900 shadow-sm sm:mx-0">
      <header className="border-b border-stone-200 bg-white px-5 py-5 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="gold-rule" aria-hidden />
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-charcoal-700">
              Internal · Gaming operations
            </p>
            <h2 className="mt-2 font-serif text-3xl text-navy-900">
              Slot &amp; Table Performance
            </h2>
            <p className="mt-2 max-w-[72ch] text-sm leading-relaxed text-charcoal-700">
              Compare units with genuinely similar placements so performance
              differences point to the machine, theme, or table—not foot traffic.
            </p>
          </div>
          <button
            type="button"
            disabled={reportPending}
            onClick={generateReport}
            className="rounded-md bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {reportPending ? "Generating…" : "Generate AI performance report"}
          </button>
        </div>
      </header>

      <main className="space-y-5 px-5 py-6 sm:px-8">
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Kpi label="Slot units analyzed" value={String(SLOT_UNITS.length)} />
          <Kpi label="Comparable underperformers" value={String(underperformers.length)} tone="warning" />
          <Kpi label="Low-confidence groups" value={String(units.filter((unit) => unit.peerN < 6).length)} />
          <Kpi label="Tables analyzed" value={String(TABLE_UNITS.length)} />
          <Kpi label="Data freshness" value={REFRESHED_AT.slice(0, 10)} tone="success" />
        </section>

        {(report || reportError) && (
          <section className="rounded-lg border border-gold-600/40 bg-white p-5">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-charcoal-700">
                  Generative AI · operational insight
                </p>
                <h3 className="mt-1 font-serif text-xl text-navy-900">Floor performance report</h3>
              </div>
              {report && <p className="text-[10px] text-charcoal-700">{report.provider} · {report.model}</p>}
            </div>
            {report && (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {reportCards.map((section) => (
                  <article key={section.heading} className="rounded-md border border-stone-200 bg-mist-100 p-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-navy-900">{section.heading}</h4>
                    <ul className="mt-2 space-y-2 text-sm leading-relaxed">
                      {section.lines.map((line, index) => (
                        <li key={`${line}-${index}`} className="flex gap-2">
                          <span className="text-gold-600">•</span><span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            )}
            {reportError && <p className="mt-3 text-sm text-burgundy-700">{reportError}</p>}
            <p className="mt-3 text-xs text-charcoal-700">
              AI explains aggregated metrics only. Floor moves and purchases remain human decisions.
            </p>
          </section>
        )}

        <section className="rounded-lg border border-stone-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="flex rounded-md border border-stone-200 p-1">
              {(["slots", "tables"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setView(item)}
                  className={`flex-1 rounded px-3 py-2 text-sm font-semibold capitalize ${view === item ? "bg-navy-900 text-white" : "text-charcoal-700"}`}
                >
                  {item}
                </button>
              ))}
            </div>
            <label className="text-xs font-semibold text-charcoal-700">
              Zone
              <select value={zone} onChange={(event) => setZone(event.target.value)} className="mt-1 block h-10 w-full rounded-md border border-stone-200 bg-white px-3 text-sm">
                <option value="all">All zones</option>
                {ZONES.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-charcoal-700">
              Comparison period
              <select value={period} onChange={(event) => setPeriod(event.target.value)} className="mt-1 block h-10 w-full rounded-md border border-stone-200 bg-white px-3 text-sm">
                <option value="30">Trailing 30 days</option>
                <option value="90">Trailing 90 days</option>
                <option value="365">Trailing year</option>
              </select>
            </label>
            <div className="rounded-md bg-mist-100 p-3 text-xs text-charcoal-700">
              <strong className="text-charcoal-900">Peer definition:</strong><br />
              zone + denomination + game + cabinet
            </div>
          </div>
        </section>

        {view === "slots" ? (
          <>
            <section className="grid gap-3 md:grid-cols-4">
              {ZONES.map((item) => {
                const group = SLOT_UNITS.filter((unit) => unit.zone === item);
                const residual = Math.round(group.reduce((sum, unit) => sum + unit.residual, 0) / group.length);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setZone(zone === item ? "all" : item)}
                    className={`rounded-lg border p-4 text-left ${zone === item ? "border-navy-900 bg-navy-900 text-white" : "border-stone-200 bg-white"}`}
                  >
                    <p className="text-xs font-semibold">{item}</p>
                    <p className="mt-2 font-serif text-2xl">{group.length} units</p>
                    <p className="mt-1 text-xs">{signedMoney(residual)} average peer residual</p>
                  </button>
                );
              })}
            </section>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(23rem,0.9fr)]">
              <section className="overflow-hidden rounded-lg border border-stone-200 bg-white">
                <div className="border-b border-stone-200 px-4 py-3">
                  <h3 className="font-serif text-xl text-navy-900">Comparable-unit ranking</h3>
                  <p className="mt-1 text-xs text-charcoal-700">Lowest peer residual first; groups under six are not treated as findings.</p>
                </div>
                <div className="max-h-[38rem] overflow-auto">
                  <table className="w-full min-w-[44rem] text-left text-sm">
                    <thead className="sticky top-0 bg-mist-100 text-[10px] uppercase tracking-wide text-charcoal-700">
                      <tr><th className="px-4 py-2">Unit</th><th className="px-3 py-2">Theme</th><th className="px-3 py-2">WPUD</th><th className="px-3 py-2">Peer median</th><th className="px-3 py-2">Residual</th><th className="px-3 py-2">Confidence</th></tr>
                    </thead>
                    <tbody>
                      {units.map((unit) => (
                        <tr key={unit.unitId} onClick={() => setSelectedId(unit.unitId)} className={`cursor-pointer border-t border-stone-200 ${selected.unitId === unit.unitId ? "bg-gold-300/20" : "hover:bg-mist-100"}`}>
                          <td className="px-4 py-3 font-semibold">{unit.unitId}<span className="block text-[10px] font-normal text-charcoal-700">{unit.zone}</span></td>
                          <td className="px-3 py-3">{unit.theme}</td>
                          <td className="px-3 py-3">{money(unit.wpud)}</td>
                          <td className="px-3 py-3">{money(unit.peerMedian)}</td>
                          <td className={`px-3 py-3 font-semibold ${unit.residual < 0 ? "text-burgundy-700" : "text-success-dark"}`}>{signedMoney(unit.residual)}</td>
                          <td className="px-3 py-3">{unit.peerN < 6 ? <span className="rounded-full bg-warning/15 px-2 py-1 text-xs text-bronze-700">Low · n={unit.peerN}</span> : `n=${unit.peerN}`}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
              <UnitDetail unit={selected} />
            </div>

            <section className="rounded-lg border border-stone-200 bg-white p-5">
              <h3 className="font-serif text-xl text-navy-900">Theme consistency across zones</h3>
              <p className="mt-1 text-xs text-charcoal-700">A theme is compelling only when it beats comparable units in several placements.</p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {THEME_PERFORMANCE.map((theme) => (
                  <article key={theme.theme} className="rounded-md border border-stone-200 p-4">
                    <p className="font-semibold text-navy-900">{theme.theme}</p>
                    <p className={`mt-2 font-serif text-2xl ${theme.avgResidual >= 0 ? "text-success-dark" : "text-burgundy-700"}`}>{signedMoney(theme.avgResidual)}</p>
                    <p className="mt-1 text-xs text-charcoal-700">{theme.zonesAboveMedian} of {theme.zonesPresent} zones above peer median · {theme.unitCount} units</p>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : (
          <section className="overflow-hidden rounded-lg border border-stone-200 bg-white">
            <div className="border-b border-stone-200 px-5 py-4">
              <h3 className="font-serif text-xl text-navy-900">Table performance by comparable pit, game, and limit</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[48rem] text-left text-sm">
                <thead className="bg-mist-100 text-[10px] uppercase tracking-wide text-charcoal-700">
                  <tr><th className="px-4 py-2">Table</th><th className="px-3 py-2">Game / pit</th><th className="px-3 py-2">Drop</th><th className="px-3 py-2">Win</th><th className="px-3 py-2">Hold</th><th className="px-3 py-2">Peer median</th><th className="px-3 py-2">Seat hours</th></tr>
                </thead>
                <tbody>
                  {TABLE_UNITS.map((table) => (
                    <tr key={table.tableId} className="border-t border-stone-200">
                      <td className="px-4 py-3 font-semibold">{table.tableId}<span className="block text-[10px] font-normal text-charcoal-700">{table.limitBand}</span></td>
                      <td className="px-3 py-3">{table.game}<span className="block text-[10px] text-charcoal-700">{table.pit}</span></td>
                      <td className="px-3 py-3">{money(table.drop)}</td><td className="px-3 py-3">{money(table.win)}</td>
                      <td className="px-3 py-3">{pct(table.holdPct)}</td><td className="px-3 py-3">{pct(table.peerMedianHold)}</td><td className="px-3 py-3">{table.seatHours.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function UnitDetail({ unit }: { unit: SlotUnit }) {
  const max = Math.max(...unit.trend);
  return (
    <aside className="space-y-4 rounded-lg border border-stone-200 bg-white p-5">
      <div><p className="text-[10px] font-semibold uppercase tracking-wide text-charcoal-700">Selected unit</p><h3 className="mt-1 font-serif text-2xl text-navy-900">{unit.unitId}</h3><p className="text-sm text-charcoal-700">{unit.theme} · {unit.zone}</p></div>
      <div className="grid grid-cols-2 gap-3"><Metric label="WPUD" value={money(unit.wpud)} /><Metric label="Peer residual" value={signedMoney(unit.residual)} /><Metric label="Peer percentile" value={`${unit.peerPercentile}th`} /><Metric label="Actual hold" value={pct(unit.holdPct)} /></div>
      <div className="rounded-md bg-mist-100 p-4"><p className="text-xs font-semibold text-navy-900">Named peer group</p><p className="mt-1 text-xs leading-relaxed text-charcoal-700">{unit.zone} · ${unit.denomination.toFixed(2)} · video reel · {unit.cabinet} · {unit.peerN} units</p></div>
      <div><p className="text-xs font-semibold text-charcoal-700">Eight-week WPUD trend</p><div className="mt-3 flex h-28 items-end gap-2">{unit.trend.map((value, index) => <div key={index} className="flex-1 rounded-t bg-navy-700" style={{ height: `${Math.max(12, (value / max) * 100)}%` }} title={money(value)} />)}</div></div>
      <div className="h-2 rounded-full bg-stone-200"><div className="h-2 rounded-full bg-gold-600" style={{ width: `${unit.peerPercentile}%` }} /></div>
      <p className="text-xs text-charcoal-700">{unit.peerN < 6 ? "Low confidence: too few comparable units for a move decision." : `This unit ranks at the ${unit.peerPercentile}th percentile of its comparable placement group.`}</p>
    </aside>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: "warning" | "success" }) {
  return <article className="rounded-lg border border-stone-200 bg-white p-4"><p className="text-[10px] font-semibold uppercase tracking-wide text-charcoal-700">{label}</p><p className={`mt-2 font-serif text-2xl ${tone === "warning" ? "text-bronze-700" : tone === "success" ? "text-success-dark" : "text-navy-900"}`}>{value}</p></article>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border border-stone-200 p-3"><p className="text-[10px] uppercase tracking-wide text-charcoal-700">{label}</p><p className="mt-1 font-semibold text-navy-900">{value}</p></div>;
}
