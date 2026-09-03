"use client";

import { PRESETS, type ScoreFilters, type Tier, type Trend, type ActivityStatus } from "../types";

const TIERS: Tier[] = ["platinum", "gold", "silver", "bronze"];

export function FilterBar({
  filters,
  onChange,
  onPreset,
  activePreset,
  resultCount,
  property,
}: {
  filters: ScoreFilters;
  onChange: (next: ScoreFilters) => void;
  onPreset: (id: string) => void;
  activePreset: string | null;
  resultCount: number;
  property: string;
}) {
  const chips = buildChips(filters);

  return (
    <div className="space-y-4 rounded-lg border border-stone-200 bg-white p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-charcoal-700">
          Quick views
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              title={p.description}
              onClick={() => onPreset(p.id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                activePreset === p.id
                  ? "border-navy-900 bg-navy-900 text-ivory-100"
                  : "border-stone-200 bg-mist-100 text-charcoal-900 hover:border-navy-700"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="block text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-charcoal-700">
            Property rank range
          </span>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={100}
              value={filters.percentileMin}
              onChange={(e) =>
                onChange({
                  ...filters,
                  percentileMin: clamp(Number(e.target.value), 0, 100),
                })
              }
              className="w-full rounded-md border border-stone-200 px-2 py-2 text-sm"
            />
            <span className="text-charcoal-700">–</span>
            <input
              type="number"
              min={0}
              max={100}
              value={filters.percentileMax}
              onChange={(e) =>
                onChange({
                  ...filters,
                  percentileMax: clamp(Number(e.target.value), 0, 100),
                })
              }
              className="w-full rounded-md border border-stone-200 px-2 py-2 text-sm"
            />
          </div>
        </label>

        <label className="block text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-charcoal-700">
            Current tier
          </span>
          <select
            className="mt-1 w-full rounded-md border border-stone-200 px-2 py-2 text-sm"
            value={filters.tiers[0] ?? ""}
            onChange={(e) => {
              const v = e.target.value as Tier | "";
              onChange({ ...filters, tiers: v ? [v] : [] });
            }}
          >
            <option value="">All tiers</option>
            {TIERS.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-charcoal-700">
            Expected value change
          </span>
          <select
            className="mt-1 w-full rounded-md border border-stone-200 px-2 py-2 text-sm"
            value={filters.trend}
            onChange={(e) =>
              onChange({ ...filters, trend: e.target.value as Trend | "any" })
            }
          >
            <option value="any">Any</option>
            <option value="rising">Rising</option>
            <option value="stable">Stable</option>
            <option value="declining">Declining</option>
          </select>
        </label>

        <label className="block text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-charcoal-700">
            Player activity
          </span>
          <select
            className="mt-1 w-full rounded-md border border-stone-200 px-2 py-2 text-sm"
            value={filters.activity}
            onChange={(e) =>
              onChange({
                ...filters,
                activity: e.target.value as ActivityStatus | "any",
              })
            }
          >
            <option value="any">Any</option>
            <option value="active">Active</option>
            <option value="lapsed">Lapsed</option>
            <option value="new">New</option>
          </select>
        </label>

        <label className="block text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-charcoal-700">
            Last visit within
          </span>
          <select
            className="mt-1 w-full rounded-md border border-stone-200 px-2 py-2 text-sm"
            value={filters.lastVisitDays ?? ""}
            onChange={(e) =>
              onChange({
                ...filters,
                lastVisitDays: e.target.value ? Number(e.target.value) : null,
              })
            }
          >
            <option value="">Any time</option>
            <option value="7">7 days</option>
            <option value="30">30 days</option>
            <option value="90">90 days</option>
          </select>
        </label>

        <label className="block text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-charcoal-700">
            Estimate availability
          </span>
          <select
            className="mt-1 w-full rounded-md border border-stone-200 px-2 py-2 text-sm"
            value={filters.eligibility}
            onChange={(e) =>
              onChange({
                ...filters,
                eligibility: e.target.value as ScoreFilters["eligibility"],
              })
            }
          >
            <option value="scored">Has estimate</option>
            <option value="unscored">Insufficient history</option>
            <option value="all">All players</option>
          </select>
        </label>

        <label className="block text-sm md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-charcoal-700">
            Search player ID or host
          </span>
          <input
            type="search"
            placeholder="e.g. 100120 or H-104"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="mt-1 w-full rounded-md border border-stone-200 px-3 py-2 text-sm"
          />
        </label>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => onChange(chip.clear(filters))}
              className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-mist-100 px-2.5 py-1 text-xs text-charcoal-900"
            >
              {chip.label}
              <span aria-hidden className="text-charcoal-700">
                ×
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={() =>
              onChange({
                percentileMin: 0,
                percentileMax: 100,
                tiers: [],
                trend: "any",
                activity: "any",
                lastVisitDays: null,
                search: "",
                eligibility: "scored",
                hostId: "any",
              })
            }
            className="text-xs font-semibold text-navy-900 hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      <p className="text-sm text-charcoal-700">
        <span className="font-semibold text-charcoal-900 tabular">{resultCount}</span>{" "}
        matching players · Rank calculated among scored players at {property}
      </p>
    </div>
  );
}

function clamp(n: number, min: number, max: number) {
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function buildChips(filters: ScoreFilters) {
  const chips: {
    key: string;
    label: string;
    clear: (f: ScoreFilters) => ScoreFilters;
  }[] = [];

  if (filters.percentileMin > 0 || filters.percentileMax < 100) {
    chips.push({
      key: "pct",
      label: `Rank ${filters.percentileMin}–${filters.percentileMax}`,
      clear: (f) => ({ ...f, percentileMin: 0, percentileMax: 100 }),
    });
  }
  if (filters.tiers[0]) {
    chips.push({
      key: "tier",
      label: `Tier: ${filters.tiers[0]}`,
      clear: (f) => ({ ...f, tiers: [] }),
    });
  }
  if (filters.trend !== "any") {
    chips.push({
      key: "trend",
      label: `Trend: ${filters.trend}`,
      clear: (f) => ({ ...f, trend: "any" }),
    });
  }
  if (filters.activity !== "any") {
    chips.push({
      key: "act",
      label: `Activity: ${filters.activity}`,
      clear: (f) => ({ ...f, activity: "any" }),
    });
  }
  if (filters.lastVisitDays != null) {
    chips.push({
      key: "visit",
      label: `Visit ≤ ${filters.lastVisitDays}d`,
      clear: (f) => ({ ...f, lastVisitDays: null }),
    });
  }
  if (filters.eligibility !== "scored") {
    chips.push({
      key: "elig",
      label: filters.eligibility === "unscored" ? "Insufficient history" : "All players",
      clear: (f) => ({ ...f, eligibility: "scored" }),
    });
  }
  if (filters.search.trim()) {
    chips.push({
      key: "q",
      label: `Search: ${filters.search.trim()}`,
      clear: (f) => ({ ...f, search: "" }),
    });
  }
  return chips;
}
