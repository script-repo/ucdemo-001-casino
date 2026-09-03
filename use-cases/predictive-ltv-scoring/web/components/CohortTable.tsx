"use client";

import type { PlayerScore, SortKey } from "../types";
import {
  activityLabel,
  formatDate,
  money,
  tierLabel,
  trendLabel,
} from "../format";

export function CohortTable({
  rows,
  total,
  page,
  pageSize,
  sort,
  sortDir,
  selectedId,
  onSort,
  onSelect,
  onPage,
  loading,
}: {
  rows: PlayerScore[];
  total: number;
  page: number;
  pageSize: number;
  sort: SortKey;
  sortDir: "asc" | "desc";
  selectedId: number | null;
  onSort: (key: SortKey) => void;
  onSelect: (playerId: number) => void;
  onPage: (page: number) => void;
  loading?: boolean;
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 px-4 py-3 text-sm text-charcoal-700">
        <p>
          Showing{" "}
          <span className="font-semibold tabular text-charcoal-900">
            {from}–{to}
          </span>{" "}
          of{" "}
          <span className="font-semibold tabular text-charcoal-900">{total}</span>{" "}
          players
          {loading ? " · Updating…" : null}
        </p>
        <p className="text-xs">
          Sorted by {sortLabel(sort)} ({sortDir === "desc" ? "high → low" : "low → high"})
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 bg-mist-100 text-xs uppercase tracking-wide text-charcoal-700">
            <tr>
              <Th k="playerId" sort={sort} sortDir={sortDir} onSort={onSort}>
                Player
              </Th>
              <Th k="ltv12m" sort={sort} sortDir={sortDir} onSort={onSort} align="right">
                Expected value — next 12 months
              </Th>
              <Th k="percentile" sort={sort} sortDir={sortDir} onSort={onSort} align="right">
                Property rank
              </Th>
              <Th k="tier" sort={sort} sortDir={sortDir} onSort={onSort}>
                Current tier
              </Th>
              <Th k="lastVisit" sort={sort} sortDir={sortDir} onSort={onSort}>
                Last visit
              </Th>
              <Th k="trend" sort={sort} sortDir={sortDir} onSort={onSort}>
                Value change
              </Th>
              <th className="px-3 py-2 font-semibold">Activity</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-charcoal-700">
                  No players match these filters. Clear filters or try another quick view.
                </td>
              </tr>
            ) : (
              rows.map((p) => {
                const selected = selectedId === p.playerId;
                const unscored = p.ltv12m == null;
                return (
                  <tr
                    key={p.playerId}
                    tabIndex={0}
                    onClick={() => onSelect(p.playerId)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelect(p.playerId);
                      }
                    }}
                    className={`cursor-pointer border-t border-stone-200 transition-colors ${
                      selected ? "bg-navy-900/5" : "hover:bg-mist-100"
                    }`}
                    aria-selected={selected}
                  >
                    <td className="px-3 py-3">
                      <div className="font-medium text-charcoal-900">
                        {p.displayLabel}
                      </div>
                      <div className="text-xs text-charcoal-700">ID {p.playerId}</div>
                    </td>
                    <td className="px-3 py-3 text-right tabular text-charcoal-900">
                      {unscored ? (
                        <span className="text-charcoal-700">Not scored</span>
                      ) : (
                        money(p.ltv12m!)
                      )}
                    </td>
                    <td className="px-3 py-3 text-right tabular text-charcoal-900">
                      {unscored ? "—" : `${p.percentile}`}
                    </td>
                    <td className="px-3 py-3 text-charcoal-900">{tierLabel(p.tier)}</td>
                    <td className="px-3 py-3 text-charcoal-900">
                      {p.lastVisit ? formatDate(p.lastVisit) : "—"}
                    </td>
                    <td className="px-3 py-3">
                      <TrendPill trend={p.trend} />
                    </td>
                    <td className="px-3 py-3 text-charcoal-900">
                      {activityLabel(p.activity)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-stone-200 px-4 py-3">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="rounded-md border border-stone-200 px-3 py-1.5 text-sm font-medium text-charcoal-900 disabled:opacity-40"
        >
          Previous
        </button>
        <p className="text-sm text-charcoal-700">
          Page <span className="tabular font-semibold text-charcoal-900">{page}</span> of{" "}
          <span className="tabular font-semibold text-charcoal-900">{pages}</span>
        </p>
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          className="rounded-md border border-stone-200 px-3 py-1.5 text-sm font-medium text-charcoal-900 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function Th({
  children,
  k,
  sort,
  sortDir,
  onSort,
  align,
}: {
  children: React.ReactNode;
  k: SortKey;
  sort: SortKey;
  sortDir: "asc" | "desc";
  onSort: (key: SortKey) => void;
  align?: "right";
}) {
  const active = sort === k;
  return (
    <th className={`px-3 py-2 font-semibold ${align === "right" ? "text-right" : ""}`}>
      <button
        type="button"
        onClick={() => onSort(k)}
        className="inline-flex items-center gap-1 hover:text-navy-900"
      >
        {children}
        <span className="text-[10px] text-charcoal-700" aria-hidden>
          {active ? (sortDir === "asc" ? "▲" : "▼") : "◇"}
        </span>
      </button>
    </th>
  );
}

function TrendPill({ trend }: { trend: PlayerScore["trend"] }) {
  if (!trend) return <span className="text-charcoal-700">—</span>;
  const cls =
    trend === "rising"
      ? "bg-success/15 text-success"
      : trend === "declining"
        ? "bg-critical/15 text-critical"
        : "bg-mist-100 text-charcoal-700";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>
      <span aria-hidden>{trend === "rising" ? "↑" : trend === "declining" ? "↓" : "→"}</span>
      {trendLabel(trend)}
    </span>
  );
}

function sortLabel(sort: SortKey): string {
  switch (sort) {
    case "ltv12m":
      return "expected value";
    case "percentile":
      return "property rank";
    case "lastVisit":
      return "last visit";
    case "trend":
      return "value change";
    case "tier":
      return "tier";
    default:
      return "player ID";
  }
}
