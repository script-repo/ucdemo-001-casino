"use client";

import { useMemo, useState } from "react";
import {
  ACCURACY,
  FORECAST_DATE,
  MODEL_VERSION,
  REVENUE_FORECAST,
  type RevenueDay,
  type RoomType,
} from "./data";

type Override = {
  rate: number;
  category: string;
  reason: string;
};

type AiReport = {
  text: string;
  provider: string;
  model: string;
};

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}

function longDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}

function occupancy(day: RevenueDay) {
  return (
    day.rooms.reduce((sum, room) => sum + room.expectedRooms, 0) /
    day.rooms.reduce((sum, room) => sum + room.capacity, 0)
  );
}

function reportSections(text: string) {
  const headings = [
    "EXECUTIVE SUMMARY",
    "PRIORITY DATES",
    "RECOMMENDED ACTIONS",
    "RISKS AND WATCH-OUTS",
  ];
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
      current = sections.find((section) => section.heading === heading) ?? {
        heading,
        lines: [],
      };
      if (!sections.includes(current)) sections.push(current);
      const remainder = line
        .slice(line.toUpperCase().indexOf(heading) + heading.length)
        .replace(/^[:\s-]+/, "");
      if (remainder) current.lines.push(remainder);
    } else {
      current.lines.push(line.replace(/^[-*•\d.)\s]+/, ""));
    }
  }
  return sections.filter((section) => section.lines.length);
}

export function RevenueApp() {
  const [horizon, setHorizon] = useState(30);
  const [selectedDate, setSelectedDate] = useState(
    REVENUE_FORECAST[0]!.stayDate,
  );
  const [accepted, setAccepted] = useState<Set<string>>(new Set());
  const [overrides, setOverrides] = useState<Record<string, Override>>({});
  const [overrideRoom, setOverrideRoom] = useState<RoomType>("standard");
  const [overrideRate, setOverrideRate] = useState("");
  const [overrideCategory, setOverrideCategory] = useState("known_group_business");
  const [overrideReason, setOverrideReason] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [report, setReport] = useState<AiReport | null>(null);
  const [reportPending, setReportPending] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const visible = REVENUE_FORECAST.slice(0, horizon);
  const selected =
    REVENUE_FORECAST.find((day) => day.stayDate === selectedDate) ?? visible[0]!;
  const reportCards = useMemo(
    () => (report ? reportSections(report.text) : []),
    [report],
  );
  const averageOccupancy =
    visible.reduce((sum, day) => sum + occupancy(day), 0) / visible.length;
  const rateMoves = visible.flatMap((day) => day.rooms).filter(
    (room) => Math.abs(room.recommendedRate - room.currentRate) >= 25,
  ).length;
  const casinoHolds = visible.reduce(
    (sum, day) =>
      sum + day.rooms.reduce((roomSum, room) => roomSum + room.casinoHoldRooms, 0),
    0,
  );
  const estimatedUplift = visible.reduce(
    (sum, day) =>
      sum +
      day.rooms.reduce(
        (roomSum, room) =>
          roomSum +
          Math.max(0, room.recommendedRate - room.currentRate) *
            room.expectedRooms,
        0,
      ),
    0,
  );

  function key(roomType: RoomType) {
    return `${selected.stayDate}:${roomType}`;
  }

  function accept(roomType: RoomType) {
    setAccepted((current) => new Set(current).add(key(roomType)));
  }

  function saveOverride() {
    const rate = Number(overrideRate);
    if (!Number.isFinite(rate) || rate < 49 || rate > 2_500) {
      setFormError("Enter a room rate between $49 and $2,500.");
      return;
    }
    if (overrideReason.trim().length < 8) {
      setFormError("Explain the business reason for this override.");
      return;
    }
    setOverrides((current) => ({
      ...current,
      [key(overrideRoom)]: {
        rate,
        category: overrideCategory,
        reason: overrideReason.trim(),
      },
    }));
    setAccepted((current) => new Set(current).add(key(overrideRoom)));
    setOverrideRate("");
    setOverrideReason("");
    setFormError(null);
  }

  async function generateReport() {
    setReportPending(true);
    setReportError(null);
    try {
      const response = await fetch("/api/revenue-management", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "generate-report",
          horizon,
          selectedDate: selected.stayDate,
        }),
      });
      const result = (await response.json()) as Partial<AiReport> & {
        error?: string;
      };
      if (!response.ok || !result.text) {
        throw new Error(result.error ?? "The report could not be generated.");
      }
      setReport({
        text: result.text,
        provider: result.provider ?? "Inference gateway",
        model: result.model ?? "selected model",
      });
    } catch (error) {
      setReportError(
        error instanceof Error ? error.message : "The report could not be generated.",
      );
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
              Internal · Revenue management
            </p>
            <h2 className="mt-2 font-serif text-3xl text-navy-900">
              Revenue Management
            </h2>
            <p className="mt-2 max-w-[72ch] text-sm leading-relaxed text-charcoal-700">
              Price hotel inventory against forecast demand while reserving
              rooms when expected casino value exceeds the achievable cash rate.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="text-xs font-semibold text-charcoal-700">
              Planning horizon
              <select
                value={horizon}
                onChange={(event) => setHorizon(Number(event.target.value))}
                className="mt-1 block h-10 rounded-md border border-stone-200 bg-white px-3 text-sm"
              >
                <option value={14}>14 nights</option>
                <option value={30}>30 nights</option>
                <option value={60}>60 nights</option>
                <option value={90}>90 nights</option>
              </select>
            </label>
            <button
              type="button"
              disabled={reportPending}
              onClick={generateReport}
              className="self-end rounded-md bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {reportPending ? "Generating…" : "Generate AI revenue report"}
            </button>
          </div>
        </div>
      </header>

      <main className="space-y-5 px-5 py-6 sm:px-8">
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Kpi label="Forecast occupancy" value={`${Math.round(averageOccupancy * 100)}%`} />
          <Kpi label="Revenue opportunity" value={money(estimatedUplift)} tone="success" />
          <Kpi label="Casino room holds" value={String(casinoHolds)} />
          <Kpi label="Material rate moves" value={String(rateMoves)} tone="warning" />
          <Kpi label="Forecast freshness" value={FORECAST_DATE} tone="success" />
        </section>

        {(report || reportError) && (
          <section className="rounded-lg border border-gold-600/40 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-charcoal-700">
                  Generative AI · decision support
                </p>
                <h3 className="mt-1 font-serif text-xl text-navy-900">
                  Revenue manager report
                </h3>
              </div>
              {report && (
                <p className="text-[10px] text-charcoal-700">
                  {report.provider} · {report.model}
                </p>
              )}
            </div>
            {report && (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {reportCards.map((section) => (
                  <article
                    key={section.heading}
                    className="rounded-md border border-stone-200 bg-mist-100 p-4"
                  >
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-navy-900">
                      {section.heading}
                    </h4>
                    <ul className="mt-2 space-y-2 text-sm leading-relaxed">
                      {section.lines.map((line, index) => (
                        <li key={`${line}-${index}`} className="flex gap-2">
                          <span className="text-gold-600" aria-hidden>•</span>
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            )}
            {reportError && <p className="mt-3 text-sm text-burgundy-700">{reportError}</p>}
            <p className="mt-3 text-xs text-charcoal-700">
              AI explains the forecast; it cannot set rates or approve overrides.
            </p>
          </section>
        )}

        <section className="rounded-lg border border-stone-200 bg-white p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="font-serif text-xl text-navy-900">Rate calendar</h3>
              <p className="mt-1 text-xs text-charcoal-700">
                Select a date. Color indicates forecast pressure; arrows compare
                the standard-room recommendation with the current rate.
              </p>
            </div>
            <p className="font-mono text-[10px] text-charcoal-700">{MODEL_VERSION}</p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {visible.map((day) => {
              const room = day.rooms[0]!;
              const occ = occupancy(day);
              const move = room.recommendedRate - room.currentRate;
              return (
                <button
                  key={day.stayDate}
                  type="button"
                  onClick={() => setSelectedDate(day.stayDate)}
                  className={`rounded-md border p-3 text-left ${
                    day.stayDate === selected.stayDate
                      ? "border-navy-900 bg-navy-900 text-white"
                      : occ >= 0.9
                        ? "border-burgundy-700/30 bg-burgundy-700/10"
                        : occ >= 0.78
                          ? "border-gold-600/40 bg-gold-300/20"
                          : "border-stone-200 bg-white hover:bg-mist-100"
                  }`}
                >
                  <p className="text-xs font-semibold">{shortDate(day.stayDate)}</p>
                  <p className="mt-2 font-serif text-lg">{Math.round(occ * 100)}%</p>
                  <p className="mt-1 text-[10px]">
                    {move >= 0 ? "↑" : "↓"} {money(Math.abs(move))}
                  </p>
                  {day.event && <p className="mt-2 truncate text-[9px]">{day.event}</p>}
                </button>
              );
            })}
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.65fr)]">
          <section className="rounded-lg border border-stone-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-charcoal-700">
                  Selected night
                </p>
                <h3 className="mt-1 font-serif text-2xl text-navy-900">
                  {longDate(selected.stayDate)}
                </h3>
                <p className="mt-1 text-sm text-charcoal-700">
                  {selected.event ?? "No major event in the calendar"}
                </p>
              </div>
              <span className="rounded-full bg-navy-900 px-3 py-1 text-xs font-semibold text-white">
                {Math.round(occupancy(selected) * 100)}% forecast occupancy
              </span>
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[46rem] text-left text-sm">
                <thead className="bg-mist-100 text-[10px] uppercase tracking-wide text-charcoal-700">
                  <tr>
                    <th className="px-3 py-2">Room type</th>
                    <th className="px-3 py-2">Forecast</th>
                    <th className="px-3 py-2">Current</th>
                    <th className="px-3 py-2">Recommended</th>
                    <th className="px-3 py-2">Casino hold</th>
                    <th className="px-3 py-2">Decision</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.rooms.map((room) => {
                    const decisionKey = key(room.roomType);
                    const override = overrides[decisionKey];
                    return (
                      <tr key={room.roomType} className="border-t border-stone-200">
                        <td className="px-3 py-3 font-semibold capitalize">{room.roomType}</td>
                        <td className="px-3 py-3">
                          {room.expectedRooms}/{room.capacity}
                          <span className="block text-[10px] text-charcoal-700">
                            {room.intervalLow}–{room.intervalHigh}
                          </span>
                        </td>
                        <td className="px-3 py-3">{money(room.currentRate)}</td>
                        <td className="px-3 py-3 font-semibold text-navy-900">
                          {money(room.recommendedRate)}
                        </td>
                        <td className="px-3 py-3">{room.casinoHoldRooms} rooms</td>
                        <td className="px-3 py-3">
                          {override ? (
                            <span className="font-semibold text-bronze-700">
                              Overridden · {money(override.rate)}
                            </span>
                          ) : accepted.has(decisionKey) ? (
                            <span className="font-semibold text-success-dark">Accepted</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => accept(room.roomType)}
                              className="rounded-md bg-navy-900 px-3 py-1.5 text-xs font-semibold text-white"
                            >
                              Accept rate
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {selected.rooms.map((room) => (
                <article key={room.roomType} className="rounded-md bg-mist-100 p-3">
                  <h4 className="text-xs font-semibold capitalize text-navy-900">
                    {room.roomType} rationale
                  </h4>
                  <ul className="mt-2 space-y-1 text-xs leading-relaxed text-charcoal-700">
                    {room.rationale.map((item) => <li key={item}>• {item}</li>)}
                  </ul>
                </article>
              ))}
            </div>
          </section>

          <aside className="space-y-5">
            <section className="rounded-lg border border-stone-200 bg-white p-5">
              <h3 className="font-serif text-xl text-navy-900">Casino demand</h3>
              <dl className="mt-4 space-y-3 text-sm">
                <Metric label="High-value arrivals" value={String(selected.expectedHighValueArrivals)} />
                <Metric label="Expected casino rooms" value={String(selected.expectedCasinoRooms)} />
                <Metric label="Displacement value" value={money(selected.displacementValue)} />
                <Metric label="Booking pace" value={`${selected.bookingPace} vs ${selected.priorYearPace} last year`} />
              </dl>
              <p className="mt-3 text-xs text-charcoal-700">
                Only aggregate demand is used. No player record is exposed here.
              </p>
            </section>

            <section className="rounded-lg border border-stone-200 bg-white p-5">
              <h3 className="font-serif text-xl text-navy-900">Override a rate</h3>
              <p className="mt-1 text-xs text-charcoal-700">
                Overrides require an auditable business reason.
              </p>
              <div className="mt-4 space-y-3">
                <Field label="Room type">
                  <select
                    value={overrideRoom}
                    onChange={(event) => setOverrideRoom(event.target.value as RoomType)}
                    className="h-10 w-full rounded-md border border-stone-200 bg-white px-3 text-sm"
                  >
                    <option value="standard">Standard</option>
                    <option value="premium">Premium</option>
                    <option value="suite">Suite</option>
                  </select>
                </Field>
                <Field label="Override rate">
                  <input
                    type="number"
                    value={overrideRate}
                    onChange={(event) => setOverrideRate(event.target.value)}
                    placeholder="185"
                    className="h-10 w-full rounded-md border border-stone-200 px-3 text-sm"
                  />
                </Field>
                <Field label="Reason category">
                  <select
                    value={overrideCategory}
                    onChange={(event) => setOverrideCategory(event.target.value)}
                    className="h-10 w-full rounded-md border border-stone-200 bg-white px-3 text-sm"
                  >
                    <option value="known_group_business">Known group business</option>
                    <option value="event_intelligence">Event intelligence</option>
                    <option value="competitive_rate">Competitive rate</option>
                    <option value="other">Other</option>
                  </select>
                </Field>
                <Field label="Business reason">
                  <textarea
                    value={overrideReason}
                    onChange={(event) => setOverrideReason(event.target.value)}
                    rows={3}
                    placeholder="Explain what the forecast does not know…"
                    className="w-full rounded-md border border-stone-200 p-3 text-sm"
                  />
                </Field>
                {formError && <p className="text-xs text-burgundy-700">{formError}</p>}
                <button
                  type="button"
                  onClick={saveOverride}
                  className="w-full rounded-md border border-navy-900 px-4 py-2.5 text-sm font-semibold text-navy-900"
                >
                  Save override
                </button>
              </div>
            </section>
          </aside>
        </div>

        <section className="rounded-lg border border-stone-200 bg-white p-5">
          <h3 className="font-serif text-xl text-navy-900">Forecast accuracy</h3>
          <p className="mt-1 text-xs text-charcoal-700">
            Mean absolute percentage error compared with same-period-last-year.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {ACCURACY.map((point) => (
              <article key={point.leadDays} className="rounded-md border border-stone-200 p-4">
                <p className="text-xs font-semibold text-charcoal-700">
                  {point.leadDays}-day lead
                </p>
                <p className="mt-2 font-serif text-2xl text-navy-900">
                  {Math.round(point.mape * 1000) / 10}% MAPE
                </p>
                <p className="mt-1 text-xs text-success-dark">
                  Beats {Math.round(point.baselineMape * 1000) / 10}% baseline
                </p>
                <p className="mt-2 text-[10px] text-charcoal-700">
                  {point.observations} matured forecasts
                </p>
              </article>
            ))}
          </div>
        </section>

        <p className="text-xs text-charcoal-700">
          Recommendations are decision support only. A revenue manager must accept
          or override every rate before it flows to the property-management system.
        </p>
      </main>
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
  tone?: "success" | "warning";
}) {
  return (
    <article className="rounded-lg border border-stone-200 bg-white p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-charcoal-700">{label}</p>
      <p className={`mt-2 font-serif text-2xl ${tone === "success" ? "text-success-dark" : tone === "warning" ? "text-bronze-700" : "text-navy-900"}`}>
        {value}
      </p>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-stone-200 pb-2">
      <dt className="text-charcoal-700">{label}</dt>
      <dd className="text-right font-semibold text-charcoal-900">{value}</dd>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-charcoal-700">
      {label}
      <span className="mt-1 block">{children}</span>
    </label>
  );
}
