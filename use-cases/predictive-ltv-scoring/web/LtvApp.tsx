"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  fetchCalibration,
  fetchCohort,
  fetchHealth,
  fetchPlayerDetail,
  generateAiBriefing,
  type AiBriefing,
  type HealthPayload,
  type PlayerDetailPayload,
} from "./client-api";
import { CalibrationPanel } from "./components/CalibrationPanel";
import { CohortTable } from "./components/CohortTable";
import { ExportModal } from "./components/ExportModal";
import { FilterBar } from "./components/FilterBar";
import { FreshnessBanner } from "./components/FreshnessBanner";
import { GuidanceCard } from "./components/GuidanceCard";
import { PlayerDetail } from "./components/PlayerDetail";
import { TaskPicker } from "./components/TaskPicker";
import { formatWhen, money, moneyCompact } from "./format";
import {
  DEFAULT_FILTERS,
  PRESETS,
  type CalibrationDecile,
  type CohortResult,
  type ModelInfo,
  type ScoreFilters,
  type SortKey,
  type TaskId,
} from "./types";

const PAGE_SIZE = 10;
const SAVED_KEY = "ltv-mvp-saved-views";

type SavedView = { name: string; filters: ScoreFilters; sort: SortKey; sortDir: "asc" | "desc" };

function readableBriefing(text: string) {
  const headings = [
    "BOTTOM LINE",
    "WHAT STANDS OUT",
    "RECOMMENDED NEXT STEPS",
    "WATCH OUT",
  ];
  const sections: Array<{ heading: string; lines: string[] }> = [];
  let current = { heading: "BOTTOM LINE", lines: [] as string[] };
  sections.push(current);

  for (const rawLine of text.replaceAll("**", "").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const matched = headings.find((heading) =>
      line.toUpperCase().replace(/[:#]/g, "").trim().startsWith(heading),
    );
    if (matched) {
      current = sections.find((section) => section.heading === matched) ?? {
        heading: matched,
        lines: [],
      };
      if (!sections.includes(current)) sections.push(current);
      const remainder = line.slice(line.toUpperCase().indexOf(matched) + matched.length).replace(/^[:\s-]+/, "");
      if (remainder) current.lines.push(remainder);
      continue;
    }
    current.lines.push(line.replace(/^[-*•\d.)\s]+/, ""));
  }
  return sections.filter((section) => section.lines.length > 0);
}

export function LtvApp() {
  const [task, setTask] = useState<TaskId | null>(null);
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [filters, setFilters] = useState<ScoreFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortKey>("ltv12m");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [cohort, setCohort] = useState<CohortResult | null>(null);
  const [detail, setDetail] = useState<PlayerDetailPayload | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [hostQuery, setHostQuery] = useState("");
  const [hostError, setHostError] = useState<string | null>(null);
  const [calibration, setCalibration] = useState<{
    deciles: CalibrationDecile[];
    model: ModelInfo;
  } | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [saveName, setSaveName] = useState("");
  const [pending, startTransition] = useTransition();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [aiBriefing, setAiBriefing] = useState<AiBriefing | null>(null);
  const [aiPending, setAiPending] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const h = await fetchHealth();
        if (!cancelled) {
          setHealth(h);
        }
      } catch {
        if (!cancelled) setLoadError("Could not load scoring health.");
      }
    })();
    try {
      const raw = localStorage.getItem(SAVED_KEY);
      if (raw) setSavedViews(JSON.parse(raw) as SavedView[]);
    } catch {
      /* ignore */
    }
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshCohort = useCallback(
    (next?: {
      filters?: ScoreFilters;
      sort?: SortKey;
      sortDir?: "asc" | "desc";
      page?: number;
    }) => {
      const f = next?.filters ?? filters;
      const s = next?.sort ?? sort;
      const d = next?.sortDir ?? sortDir;
      const p = next?.page ?? page;
      startTransition(async () => {
        try {
          const result = await fetchCohort({
            filters: f,
            sort: s,
            sortDir: d,
            page: p,
            pageSize: PAGE_SIZE,
          });
          setCohort(result);
          setLoadError(null);
        } catch {
          setLoadError("Could not load player cohort.");
        }
      });
    },
    [filters, sort, sortDir, page],
  );

  useEffect(() => {
    if (task === "prioritize" || task === "host") {
      refreshCohort();
    }
  }, [task]); // eslint-disable-line react-hooks/exhaustive-deps -- initial load per task

  useEffect(() => {
    if (task !== "quality") return;
    (async () => {
      try {
        setCalibration(await fetchCalibration());
      } catch {
        setLoadError("Could not load calibration.");
      }
    })();
  }, [task]);

  function applyFilters(next: ScoreFilters) {
    setFilters(next);
    setPage(1);
    setActivePreset(null);
    refreshCohort({ filters: next, page: 1 });
  }

  function applyPreset(id: string) {
    const preset = PRESETS.find((p) => p.id === id);
    if (!preset) return;
    const next = { ...DEFAULT_FILTERS, ...preset.filters };
    const s = preset.sort ?? "ltv12m";
    const d = preset.sortDir ?? "desc";
    setFilters(next);
    setSort(s);
    setSortDir(d);
    setPage(1);
    setActivePreset(id);
    refreshCohort({ filters: next, sort: s, sortDir: d, page: 1 });
  }

  function onSort(key: SortKey) {
    const nextDir = sort === key && sortDir === "desc" ? "asc" : "desc";
    const dir = sort === key ? nextDir : "desc";
    setSort(key);
    setSortDir(dir);
    setPage(1);
    refreshCohort({ sort: key, sortDir: dir, page: 1 });
  }

  function onPage(p: number) {
    setPage(p);
    refreshCohort({ page: p });
  }

  async function openPlayer(playerId: number) {
    setSelectedId(playerId);
    setHostError(null);
    const result = await fetchPlayerDetail(playerId);
    if ("error" in result) {
      setDetail(null);
      setHostError(result.error);
      return;
    }
    setDetail(result);
  }

  async function lookupHost(e: React.FormEvent) {
    e.preventDefault();
    const id = Number(hostQuery.trim());
    if (!Number.isFinite(id)) {
      setHostError("Enter a numeric player ID.");
      return;
    }
    await openPlayer(id);
  }

  function saveView() {
    const name = saveName.trim();
    if (!name) return;
    const next = [
      ...savedViews.filter((v) => v.name !== name),
      { name, filters, sort, sortDir },
    ];
    setSavedViews(next);
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
    setSaveName("");
  }

  function loadView(view: SavedView) {
    setFilters(view.filters);
    setSort(view.sort);
    setSortDir(view.sortDir);
    setPage(1);
    setActivePreset(null);
    refreshCohort({
      filters: view.filters,
      sort: view.sort,
      sortDir: view.sortDir,
      page: 1,
    });
  }

  async function createAiBriefing() {
    setAiPending(true);
    setAiError(null);
    try {
      setAiBriefing(await generateAiBriefing(filters));
    } catch (error) {
      setAiBriefing(null);
      setAiError(
        error instanceof Error
          ? error.message
          : "The AI briefing could not be generated.",
      );
    } finally {
      setAiPending(false);
    }
  }

  const summary = health?.summary;
  const aiSections = useMemo(
    () => (aiBriefing ? readableBriefing(aiBriefing.text) : []),
    [aiBriefing],
  );
  const property = cohort?.property ?? health?.run.property ?? "this property";

  const headerBlurb = useMemo(() => {
    switch (task) {
      case "host":
        return "Look up a player before you call. Plain-language estimate, rank, and reasons.";
      case "prioritize":
        return "Build a defensible high-value or rising cohort for the weekly reinvestment review.";
      case "quality":
        return "Compare predicted and actual outcomes by player group before trusting the method.";
      case "health":
        return "Confirm the last scoring run, coverage, and pipeline stages.";
      default:
        return "Estimate each player’s gaming and non-gaming value over the next twelve months.";
    }
  }, [task]);

  return (
    <div className="resort-frame -mx-2 text-charcoal-900 sm:mx-0">
      <div className="border-b border-stone-200 bg-white px-5 py-6 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="gold-rule" aria-hidden />
            <p className="eyebrow mt-3">Internal · Player analytics</p>
            <h2 className="mt-2 font-serif text-3xl text-navy-900">
              Expected Player Value
            </h2>
            <p className="mt-1 text-sm text-charcoal-700">
              Predictive lifetime value scoring
            </p>
            <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-charcoal-700">
              {headerBlurb}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={aiPending || !health}
              onClick={createAiBriefing}
              className="rounded-md border border-navy-700 px-4 py-2.5 text-sm font-semibold text-navy-900 hover:bg-mist-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {aiPending ? "Generating…" : "Generate AI briefing"}
            </button>
            {task === "prioritize" && (
            <button
              type="button"
              onClick={() => setExportOpen(true)}
              className="rounded-md bg-navy-900 px-4 py-2.5 text-sm font-semibold text-ivory-100 hover:bg-navy-700"
            >
              Export cohort
            </button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6 px-5 py-6 sm:px-8">
        {loadError && (
          <div className="rounded-lg border border-critical/40 bg-critical/10 px-4 py-3 text-sm text-charcoal-900">
            {loadError}
          </div>
        )}

        {health && <FreshnessBanner health={health} />}

        {(aiBriefing || aiError) && (
          <section className="rounded-lg border border-gold-600/40 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-charcoal-700">
                  Generative AI · decision support
                </p>
                <h3 className="mt-1 font-serif text-xl text-navy-900">
                  EPV portfolio briefing
                </h3>
              </div>
              {aiBriefing && (
                <span className="rounded-full bg-mist-100 px-2.5 py-1 text-[10px] font-semibold text-charcoal-700">
                  {aiBriefing.provider} · {aiBriefing.model}
                </span>
              )}
            </div>
            {aiBriefing ? (
              <>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {aiSections.map((section) => (
                    <div
                      key={section.heading}
                      className="rounded-md border border-stone-200 bg-mist-100 p-4"
                    >
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-navy-900">
                        {section.heading}
                      </h4>
                      <ul className="mt-2 space-y-2 text-sm leading-relaxed text-charcoal-900">
                        {section.lines.map((line, index) => (
                          <li key={`${line}-${index}`} className="flex gap-2">
                            <span className="text-gold-600" aria-hidden>•</span>
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <p className="mt-4 border-t border-stone-200 pt-3 text-xs text-charcoal-700">
                  Generated from aggregated synthetic data. Review before use;
                  predicted value is not an approved reinvestment amount.
                </p>
              </>
            ) : (
              <p className="mt-4 text-sm text-burgundy-700">
                {aiError}{" "}
                <a href="/resources" className="font-semibold underline">
                  Open Shared Resources
                </a>
              </p>
            )}
          </section>
        )}

        <TaskPicker
          active={task}
          onSelect={(id) => {
            setTask(id);
            setDetail(null);
            setSelectedId(null);
            setHostError(null);
            if (id === "prioritize") {
              applyPreset("top10");
            }
          }}
        />

        {!task && (
          <div className="rounded-lg border border-dashed border-stone-200 bg-white p-8 text-center">
            <p className="font-serif text-xl text-navy-900">Choose a task to begin</p>
            <p className="mx-auto mt-2 max-w-[48ch] text-sm text-charcoal-700">
              The workspace adapts to hosts, player development, analysts, and
              operators so you only see what you need.
            </p>
            {summary && (
              <dl className="mx-auto mt-6 grid max-w-3xl gap-3 sm:grid-cols-4 text-left">
                <Kpi label="Scored players" value={String(summary.scoredCount)} />
                <Kpi
                  label="Portfolio expected value"
                  value={moneyCompact(summary.totalPredictedValue)}
                />
                <Kpi label="Top 10%" value={String(summary.topDecileCount)} />
                <Kpi label="Rising" value={String(summary.risingCount)} />
              </dl>
            )}
          </div>
        )}

        {task === "host" && (
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <div className="space-y-4">
              <form
                onSubmit={lookupHost}
                className="rounded-lg border border-stone-200 bg-white p-5"
              >
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-charcoal-700">
                    Player ID
                  </span>
                  <span className="mt-1 flex gap-2">
                    <input
                      value={hostQuery}
                      onChange={(e) => setHostQuery(e.target.value)}
                      placeholder="e.g. 100120"
                      className="w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm"
                      inputMode="numeric"
                    />
                    <button
                      type="submit"
                      className="shrink-0 rounded-md bg-navy-900 px-4 py-2.5 text-sm font-semibold text-ivory-100"
                    >
                      Look up
                    </button>
                  </span>
                </label>
                <p className="mt-2 text-xs text-charcoal-700">
                  Names and contact details stay in the customer-management system.
                  Deep-link from CMS with{" "}
                  <code className="font-mono text-[11px]">?playerId=</code> when
                  integrated.
                </p>
                {hostError && (
                  <p className="mt-3 text-sm text-critical" role="alert">
                    {hostError}
                  </p>
                )}
              </form>
              <GuidanceCard />
              <div className="rounded-lg border border-stone-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-charcoal-700">
                  Sample IDs for demo
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(cohort?.results ?? []).slice(0, 5).map((p) => (
                    <button
                      key={p.playerId}
                      type="button"
                      onClick={() => {
                        setHostQuery(String(p.playerId));
                        void openPlayer(p.playerId);
                      }}
                      className="rounded-full border border-stone-200 px-3 py-1 text-xs font-medium hover:bg-mist-100"
                    >
                      {p.playerId}
                      {p.ltv12m == null ? " · no score" : ""}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setHostQuery("100100");
                      void openPlayer(100100);
                    }}
                    className="rounded-full border border-stone-200 px-3 py-1 text-xs font-medium hover:bg-mist-100"
                  >
                    100100 · try insufficient history
                  </button>
                </div>
              </div>
            </div>
            <div className="min-h-[28rem]">
              {detail ? (
                <PlayerDetail detail={detail} onClose={() => setDetail(null)} />
              ) : (
                <div className="flex h-full min-h-[28rem] items-center justify-center rounded-lg border border-dashed border-stone-200 bg-white p-8 text-center">
                  <div>
                    <p className="font-serif text-lg text-navy-900">
                      No player selected
                    </p>
                    <p className="mt-2 max-w-[36ch] text-sm text-charcoal-700">
                      Enter a player ID to see expected value, property rank, likely
                      range, and plain-language reasons.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {task === "prioritize" && (
          <section className="space-y-4">
            {summary && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Kpi
                  label="Matching now"
                  value={String(cohort?.total ?? "—")}
                  hint={`Score date ${cohort?.asOf ?? "—"}`}
                />
                <Kpi
                  label="Portfolio expected value"
                  value={moneyCompact(summary.totalPredictedValue)}
                  hint={`${summary.scoredCount} scored players`}
                />
                <Kpi
                  label="Rising players"
                  value={String(summary.risingCount)}
                  hint="Vs prior scoring period"
                />
                <Kpi
                  label="Not scored"
                  value={String(summary.unscoredCount)}
                  hint="Fewer than 3 carded visits"
                />
              </div>
            )}

            <FilterBar
              filters={filters}
              onChange={applyFilters}
              onPreset={applyPreset}
              activePreset={activePreset}
              resultCount={cohort?.total ?? 0}
              property={property}
            />

            <div className="flex flex-wrap items-end gap-3 rounded-lg border border-stone-200 bg-white p-4">
              <label className="min-w-[12rem] flex-1 text-sm">
                <span className="text-xs font-semibold uppercase tracking-wide text-charcoal-700">
                  Save this view
                </span>
                <input
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="e.g. Top rising — August review"
                  className="mt-1 w-full rounded-md border border-stone-200 px-3 py-2"
                />
              </label>
              <button
                type="button"
                onClick={saveView}
                className="rounded-md border border-navy-900 px-4 py-2 text-sm font-semibold text-navy-900 hover:bg-mist-100"
              >
                Save view
              </button>
              {savedViews.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {savedViews.map((v) => (
                    <button
                      key={v.name}
                      type="button"
                      onClick={() => loadView(v)}
                      className="rounded-full bg-mist-100 px-3 py-1.5 text-xs font-medium text-charcoal-900 hover:bg-stone-200"
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.9fr)]">
              <CohortTable
                rows={cohort?.results ?? []}
                total={cohort?.total ?? 0}
                page={page}
                pageSize={PAGE_SIZE}
                sort={sort}
                sortDir={sortDir}
                selectedId={selectedId}
                onSort={onSort}
                onSelect={(id) => void openPlayer(id)}
                onPage={onPage}
                loading={pending}
              />
              <div className="min-h-[24rem]">
                {detail ? (
                  <PlayerDetail detail={detail} onClose={() => setDetail(null)} />
                ) : (
                  <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-stone-200 bg-white p-6 text-center text-sm text-charcoal-700">
                    Select a row to inspect expected value and drivers. Filters stay
                    applied.
                  </div>
                )}
              </div>
            </div>

            <GuidanceCard />
          </section>
        )}

        {task === "quality" && calibration && (
          <section className="space-y-4">
            <CalibrationPanel
              deciles={calibration.deciles}
              model={calibration.model}
            />
            <GuidanceCard />
          </section>
        )}

        {task === "health" && health && (
          <section className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Kpi
                label="Last scored"
                value={formatWhen(health.run.scoredAt)}
                hint={
                  health.isStale
                    ? `Stale (>${health.staleThresholdHours}h)`
                    : "Within freshness window"
                }
              />
              <Kpi
                label="Scoring method"
                value={health.model.modelLabel}
                hint={health.model.modelVersion}
              />
              <Kpi
                label="Coverage"
                value={`${health.run.recordsScored} / ${health.run.recordsProcessed}`}
                hint={`${health.run.recordsSkipped} insufficient history`}
              />
              <Kpi
                label="Calibration"
                value={`${health.summary.decilesPassing}/${health.summary.decilesTotal}`}
                hint={
                  health.summary.calibrationOk
                    ? "Acceptable for pilot"
                    : "Review failing groups"
                }
              />
            </div>

            <div className="rounded-lg border border-stone-200 bg-white p-5">
              <h3 className="font-serif text-xl text-navy-900">Pipeline stages</h3>
              <p className="mt-1 text-sm text-charcoal-700">
                Run {health.run.runId}. Failed runs do not overwrite the last valid
                score set.
              </p>
              <ol className="mt-4 space-y-2">
                {health.run.stages.map((stage, i) => (
                  <li
                    key={stage.name}
                    className="flex items-start gap-3 rounded-md border border-stone-200 px-3 py-3"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-mist-100 text-xs font-semibold text-navy-900">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-medium text-charcoal-900">
                        {stage.name}{" "}
                        <span className="text-xs font-semibold uppercase text-charcoal-700">
                          · {stage.status}
                        </span>
                      </p>
                      <p className="text-sm text-charcoal-700">{stage.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-4 text-xs text-charcoal-700">
                Manual rescore and live job control are operator-only and not exposed
                in this MVP UI. Contact {health.run.supportOwner}.
              </p>
            </div>

            <div className="rounded-lg border border-stone-200 bg-white p-5">
              <h3 className="font-serif text-xl text-navy-900">
                Recent scoring runs
              </h3>
              <p className="mt-1 text-sm text-charcoal-700">
                Failed runs preserve the last valid score set instead of
                publishing partial results.
              </p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[42rem] text-left text-sm">
                  <thead>
                    <tr className="border-y border-stone-200 text-[11px] uppercase tracking-wide text-charcoal-700">
                      <th className="py-2 pr-4 font-semibold">Run</th>
                      <th className="py-2 pr-4 font-semibold">Status</th>
                      <th className="py-2 pr-4 font-semibold">Finished</th>
                      <th className="py-2 pr-4 text-right font-semibold">
                        Scored
                      </th>
                      <th className="py-2 text-right font-semibold">Skipped</th>
                    </tr>
                  </thead>
                  <tbody>
                    {health.recentRuns.map((run) => (
                      <tr key={run.runId} className="border-b border-stone-200">
                        <td className="py-3 pr-4 font-mono text-xs text-navy-900">
                          {run.runId}
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-semibold ${
                              run.status === "healthy"
                                ? "bg-success/15 text-success-dark"
                                : run.status === "failed"
                                  ? "bg-critical/15 text-burgundy-700"
                                  : "bg-warning/15 text-bronze-700"
                            }`}
                          >
                            {run.status}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-charcoal-700">
                          {run.finishedAt ? formatWhen(run.finishedAt) : "Running"}
                        </td>
                        <td className="tabular py-3 pr-4 text-right text-charcoal-900">
                          {run.recordsScored.toLocaleString()}
                        </td>
                        <td className="tabular py-3 text-right text-charcoal-700">
                          {run.recordsSkipped.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {summary && (
              <div className="rounded-lg border border-stone-200 bg-white p-5">
                <h3 className="font-serif text-lg text-navy-900">Portfolio snapshot</h3>
                <p className="mt-2 text-sm text-charcoal-700">
                  Total expected twelve-month value{" "}
                  <span className="font-semibold tabular text-charcoal-900">
                    {money(summary.totalPredictedValue)}
                  </span>{" "}
                  (
                  {summary.totalPredictedValue >= summary.priorTotalPredictedValue
                    ? "+"
                    : ""}
                  {money(
                    summary.totalPredictedValue - summary.priorTotalPredictedValue,
                  )}{" "}
                  vs prior period).
                </p>
              </div>
            )}
          </section>
        )}
      </div>

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        filters={filters}
        isStale={Boolean(health?.isStale)}
      />
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-charcoal-700">
        {label}
      </p>
      <p className="mt-1 font-serif text-2xl text-navy-900 tabular">{value}</p>
      {hint && <p className="mt-1 text-xs text-charcoal-700 break-all">{hint}</p>}
    </div>
  );
}
