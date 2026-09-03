"use client";

import { useMemo, useState } from "react";
import {
  CHURN_DATA,
  MODEL_VERSION,
  SCORED_AT,
  type ChurnPlayer,
  type OutreachOutcome,
  type RiskBand,
} from "./data";

const BAND_ORDER: Record<RiskBand, number> = { high: 0, medium: 1, low: 2 };

function pct(value: number) {
  return `${Math.round(value * 100)}%`;
}

function bandFor(risk: number, high: number, medium: number): RiskBand {
  if (risk >= high) return "high";
  if (risk >= medium) return "medium";
  return "low";
}

function bandStyle(band: RiskBand) {
  if (band === "high") return "bg-critical/15 text-burgundy-700";
  if (band === "medium") return "bg-warning/15 text-bronze-700";
  return "bg-success/15 text-success-dark";
}

export function ChurnApp() {
  const [band, setBand] = useState<RiskBand | "all">("high");
  const [host, setHost] = useState("all");
  const [search, setSearch] = useState("");
  const [highThreshold, setHighThreshold] = useState(0.72);
  const [mediumThreshold, setMediumThreshold] = useState(0.46);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [outreach, setOutreach] = useState<
    Record<number, { outcome: OutreachOutcome; note: string }>
  >({});
  const [note, setNote] = useState("");

  const queue = useMemo(() => {
    const q = search.trim().toLowerCase();
    return CHURN_DATA.players
      .map((player) => ({
        ...player,
        band: bandFor(player.risk, highThreshold, mediumThreshold),
      }))
      .filter((player) => band === "all" || player.band === band)
      .filter((player) => host === "all" || player.host === host)
      .filter(
        (player) =>
          !q ||
          player.label.toLowerCase().includes(q) ||
          String(player.playerId).includes(q),
      )
      .sort(
        (a, b) =>
          BAND_ORDER[a.band] - BAND_ORDER[b.band] ||
          b.risk * (0.5 + b.ltvPercentile / 100) -
            a.risk * (0.5 + a.ltvPercentile / 100),
      );
  }, [band, host, search, highThreshold, mediumThreshold]);

  const selected =
    queue.find((player) => player.playerId === selectedId) ??
    queue[0] ??
    null;
  const counts = CHURN_DATA.players.reduce(
    (result, player) => {
      result[bandFor(player.risk, highThreshold, mediumThreshold)]++;
      return result;
    },
    { high: 0, medium: 0, low: 0 },
  );
  const hosts = [...new Set(CHURN_DATA.players.map((player) => player.host))].sort();

  function recordOutreach(outcome: OutreachOutcome) {
    if (!selected) return;
    setOutreach((current) => ({
      ...current,
      [selected.playerId]: { outcome, note: note.trim() },
    }));
    setNote("");
  }

  return (
    <div className="-mx-2 overflow-hidden rounded-xl border border-stone-200 bg-mist-100 text-charcoal-900 shadow-sm sm:mx-0">
      <header className="border-b border-stone-200 bg-white px-5 py-5 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="gold-rule" aria-hidden />
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-charcoal-700">
              Internal · Player development
            </p>
            <h2 className="mt-2 font-serif text-3xl text-navy-900">
              Churn-Risk Modeling
            </h2>
            <p className="mt-2 max-w-[68ch] text-sm leading-relaxed text-charcoal-700">
              Prioritize outreach by deviation from each player&apos;s own visit
              cadence—not a fixed inactivity window.
            </p>
          </div>
          <div className="rounded-md border border-stone-200 bg-mist-100 px-4 py-3 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-charcoal-700">
              Score freshness
            </p>
            <p className="mt-1 text-sm font-semibold text-success-dark">
              Current · {SCORED_AT.slice(0, 10)}
            </p>
            <p className="mt-1 font-mono text-[10px] text-charcoal-700">
              {MODEL_VERSION}
            </p>
          </div>
        </div>
      </header>

      <main className="space-y-5 px-5 py-6 sm:px-8">
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Kpi label="High risk" value={String(counts.high)} tone="critical" />
          <Kpi label="Medium risk" value={String(counts.medium)} tone="warning" />
          <Kpi
            label="High-value at risk"
            value={String(
              CHURN_DATA.players.filter(
                (p) => p.risk >= highThreshold && p.ltvPercentile >= 75,
              ).length,
            )}
          />
          <Kpi
            label="Backstop baseline"
            value={String(CHURN_DATA.players.filter((p) => p.baselineKind === "backstop").length)}
          />
          <Kpi
            label="Suppressed before display"
            value={String(CHURN_DATA.suppressedCount)}
            tone="success"
          />
        </section>

        <section className="rounded-lg border border-stone-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <label className="text-xs font-semibold text-charcoal-700">
              Risk band
              <select
                value={band}
                onChange={(event) => setBand(event.target.value as RiskBand | "all")}
                className="mt-1 block h-10 w-full rounded-md border border-stone-200 bg-white px-3 text-sm text-charcoal-900"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
                <option value="all">All bands</option>
              </select>
            </label>
            <label className="text-xs font-semibold text-charcoal-700">
              Assigned host
              <select
                value={host}
                onChange={(event) => setHost(event.target.value)}
                className="mt-1 block h-10 w-full rounded-md border border-stone-200 bg-white px-3 text-sm text-charcoal-900"
              >
                <option value="all">All hosts</option>
                {hosts.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-charcoal-700 md:col-span-2">
              Find player
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Player ID"
                className="mt-1 block h-10 w-full rounded-md border border-stone-200 px-3 text-sm"
              />
            </label>
          </div>
          <p className="mt-3 text-xs text-charcoal-700">
            {queue.length} eligible players · sorted by risk weighted by expected
            player value. Responsible-gaming and marketing suppressions are
            applied before this queue.
          </p>
        </section>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(24rem,0.95fr)]">
          <section className="overflow-hidden rounded-lg border border-stone-200 bg-white">
            <div className="border-b border-stone-200 px-4 py-3">
              <h3 className="font-serif text-xl text-navy-900">Morning risk queue</h3>
            </div>
            <div className="max-h-[42rem] overflow-auto">
              <table className="w-full min-w-[42rem] text-left text-sm">
                <thead className="sticky top-0 bg-mist-100 text-[10px] uppercase tracking-wide text-charcoal-700">
                  <tr>
                    <th className="px-4 py-2">Player</th>
                    <th className="px-3 py-2">Risk</th>
                    <th className="px-3 py-2">Cadence</th>
                    <th className="px-3 py-2">LTV rank</th>
                    <th className="px-3 py-2">Host</th>
                    <th className="px-3 py-2">Outreach</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map((player) => (
                    <tr
                      key={player.playerId}
                      onClick={() => setSelectedId(player.playerId)}
                      className={`cursor-pointer border-t border-stone-200 ${
                        selected?.playerId === player.playerId ? "bg-gold-300/20" : "hover:bg-mist-100"
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-navy-900">
                        {player.label}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${bandStyle(player.band)}`}>
                          {player.band} · {pct(player.risk)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-charcoal-700">
                        {player.daysSinceVisit}d / {player.medianGapDays}d
                      </td>
                      <td className="tabular px-3 py-3">{player.ltvPercentile}th</td>
                      <td className="px-3 py-3 text-charcoal-700">{player.host}</td>
                      <td className="px-3 py-3 text-charcoal-700">
                        {outreach[player.playerId]?.outcome ?? "Pending"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {queue.length === 0 && (
                <p className="p-8 text-center text-sm text-charcoal-700">
                  No eligible players match these filters.
                </p>
              )}
            </div>
          </section>

          <section>
            {selected ? (
              <PlayerPanel
                player={selected}
                outreach={outreach[selected.playerId]}
                note={note}
                onNote={setNote}
                onOutcome={recordOutreach}
              />
            ) : (
              <div className="rounded-lg border border-dashed border-stone-200 bg-white p-8 text-center text-charcoal-700">
                Select a player from the queue.
              </div>
            )}
          </section>
        </div>

        <section className="rounded-lg border border-stone-200 bg-white p-5">
          <h3 className="font-serif text-xl text-navy-900">Queue threshold preview</h3>
          <p className="mt-1 text-sm text-charcoal-700">
            Adjust operational bands without changing the model.
          </p>
          <div className="mt-4 grid gap-5 md:grid-cols-2">
            <Threshold
              label="High risk threshold"
              value={highThreshold}
              min={Math.max(0.55, mediumThreshold + 0.05)}
              onChange={setHighThreshold}
              count={counts.high}
            />
            <Threshold
              label="Medium risk threshold"
              value={mediumThreshold}
              min={0.25}
              max={highThreshold - 0.05}
              onChange={setMediumThreshold}
              count={counts.medium}
            />
          </div>
        </section>
      </main>
    </div>
  );
}

function PlayerPanel({
  player,
  outreach,
  note,
  onNote,
  onOutcome,
}: {
  player: ChurnPlayer;
  outreach?: { outcome: OutreachOutcome; note: string };
  note: string;
  onNote: (value: string) => void;
  onOutcome: (outcome: OutreachOutcome) => void;
}) {
  return (
    <div className="space-y-4">
      <article className="rounded-lg border border-stone-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-charcoal-700">
              {player.tier} · {player.host}
            </p>
            <h3 className="mt-1 font-serif text-2xl text-navy-900">{player.label}</h3>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${bandStyle(player.band)}`}>
            {pct(player.risk)} {player.band} risk
          </span>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-charcoal-700">
          This player normally returns every{" "}
          <strong className="text-charcoal-900">{player.medianGapDays} days</strong>.
          It has been{" "}
          <strong className="text-charcoal-900">{player.daysSinceVisit} days</strong>{" "}
          since the last visit.
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <Metric label="Visits observed" value={String(player.visitsObserved)} />
          <Metric label="Baseline" value={player.baselineKind} />
          <Metric label="Gap variability" value={`${player.iqrGapDays} days IQR`} />
          <Metric label="Expected return" value={`${player.expectedDaysToVisit} days`} />
        </dl>
      </article>

      <article className="rounded-lg border border-stone-200 bg-white p-5">
        <h4 className="font-serif text-lg text-navy-900">Cadence timeline</h4>
        <div className="mt-4 flex min-h-16 items-center gap-2 overflow-x-auto border-y border-stone-200 py-4">
          {player.visits.map((visit, index) => (
            <div key={`${visit}-${index}`} className="flex min-w-14 flex-col items-center gap-1">
              <span className="size-3 rounded-full bg-navy-700" />
              <span className="text-[9px] text-charcoal-700">{visit.slice(5)}</span>
            </div>
          ))}
          <div className="flex min-w-20 flex-col items-center gap-1">
            <span className="size-4 rounded-full border-2 border-critical bg-white" />
            <span className="text-[9px] font-semibold text-critical">Today</span>
          </div>
        </div>
      </article>

      <article className="rounded-lg border border-stone-200 bg-white p-5">
        <h4 className="font-serif text-lg text-navy-900">Why flagged</h4>
        <ul className="mt-3 space-y-3">
          {player.drivers.map((driver) => (
            <li key={driver.label}>
              <div className="flex justify-between gap-3 text-sm">
                <span className="font-medium text-charcoal-900">{driver.label}</span>
                <span className={driver.impact >= 0 ? "text-critical" : "text-success-dark"}>
                  {driver.impact >= 0 ? "+" : ""}
                  {driver.impact.toFixed(2)}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-charcoal-700">{driver.detail}</p>
            </li>
          ))}
        </ul>
      </article>

      <article className="rounded-lg border border-stone-200 bg-white p-5">
        <h4 className="font-serif text-lg text-navy-900">Record outreach</h4>
        {outreach && (
          <p className="mt-2 rounded-md bg-success/10 px-3 py-2 text-sm text-success-dark">
            Recorded: {outreach.outcome}
            {outreach.note ? ` · ${outreach.note}` : ""}
          </p>
        )}
        <input
          value={note}
          onChange={(event) => onNote(event.target.value)}
          placeholder="Optional contact note"
          className="mt-3 h-10 w-full rounded-md border border-stone-200 px-3 text-sm"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {(["contacted", "not-reachable", "do-not-contact"] as const).map((outcome) => (
            <button
              key={outcome}
              type="button"
              onClick={() => onOutcome(outcome)}
              className="rounded-md border border-navy-700 px-3 py-2 text-xs font-semibold text-navy-900 hover:bg-mist-100"
            >
              {outcome.replaceAll("-", " ")}
            </button>
          ))}
        </div>
      </article>
    </div>
  );
}

function Kpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "critical" | "warning" | "success";
}) {
  const colour =
    tone === "critical"
      ? "text-burgundy-700"
      : tone === "warning"
        ? "text-bronze-700"
        : tone === "success"
          ? "text-success-dark"
          : "text-navy-900";
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-charcoal-700">{label}</p>
      <p className={`tabular mt-1 font-serif text-2xl ${colour}`}>{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-mist-100 p-3">
      <dt className="text-[10px] uppercase tracking-wide text-charcoal-700">{label}</dt>
      <dd className="mt-1 font-semibold text-charcoal-900">{value}</dd>
    </div>
  );
}

function Threshold({
  label,
  value,
  min,
  max = 0.9,
  count,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max?: number;
  count: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex justify-between text-sm font-medium text-charcoal-900">
        {label}
        <span>{pct(value)} · {count} players</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={0.01}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-3 w-full accent-navy-900"
      />
    </label>
  );
}
