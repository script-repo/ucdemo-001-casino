"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Icon, type IconName } from "@/components/icons";
import {
  FEATURED_INSIGHTS,
  HEADLINE_METRICS,
  RECENT_ACTIVITY,
} from "@/lib/demo-content";
import type { UseCaseManifest, UseCaseStatus } from "@/lib/types";

const ALL = "All applications";
const FAVOURITES_KEY = "portal.favourites";

const TILE: Record<string, string> = {
  navy: "bg-tile-navy",
  burgundy: "bg-tile-burgundy",
  emerald: "bg-tile-emerald",
  bronze: "bg-tile-bronze",
  teal: "bg-tile-teal",
  plum: "bg-tile-plum",
};

const CATEGORY_ICON: Record<string, IconName> = {
  [ALL]: "grid",
  "Gaming & Ops": "dice",
  Marketing: "megaphone",
  Finance: "coins",
  "Risk & Compliance": "shield",
  Knowledge: "book",
};

const STATUS_LABEL: Record<UseCaseStatus, string> = {
  active: "Active",
  beta: "Beta",
  planned: "Planned",
  retired: "Retired",
};

const STATUS_DOT: Record<UseCaseStatus, string> = {
  active: "bg-success",
  beta: "bg-information",
  planned: "bg-fog-500",
  retired: "bg-critical",
};

function iconFor(name: string | undefined): IconName {
  return (name ?? "grid") as IconName;
}

export function DashboardShell({
  useCases,
  resourcesConfigured,
  resourcesTotal,
  initialQuery = "",
}: {
  useCases: UseCaseManifest[];
  resourcesConfigured: number;
  resourcesTotal: number;
  initialQuery?: string;
}) {
  const [category, setCategory] = useState(ALL);
  const [favouritesOnly, setFavouritesOnly] = useState(false);
  const [favourites, setFavourites] = useState<string[]>([]);

  // Read after mount so the server and client render the same first pass.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(FAVOURITES_KEY);
      if (stored) setFavourites(JSON.parse(stored) as string[]);
    } catch {
      /* storage unavailable; favourites stay in memory for this session */
    }
  }, []);

  function toggleFavourite(slug: string) {
    setFavourites((current) => {
      const next = current.includes(slug)
        ? current.filter((entry) => entry !== slug)
        : [...current, slug];
      try {
        window.localStorage.setItem(FAVOURITES_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const useCase of useCases) {
      const key = useCase.category ?? "Uncategorised";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [
      { name: ALL, count: useCases.length },
      ...[...counts.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([name, count]) => ({ name, count })),
    ];
  }, [useCases]);

  const query = initialQuery.trim().toLowerCase();

  const visible = useCases.filter((useCase) => {
    if (category !== ALL && (useCase.category ?? "Uncategorised") !== category) {
      return false;
    }
    if (favouritesOnly && !favourites.includes(useCase.slug)) return false;
    if (query) {
      const haystack = [useCase.title, useCase.summary, ...useCase.tags]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  return (
    <div className="mx-auto flex max-w-[1680px] gap-6 px-6 py-6">
      {/* ---------------- Category rail ---------------- */}
      <aside className="hidden w-60 shrink-0 xl:block">
        <nav aria-label="Browse by category" className="rounded-lg border border-hairline bg-ink-850 p-4">
          <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-fog-500">
            Browse by category
          </p>
          <ul className="mt-3 space-y-1">
            {categories.map((entry) => {
              const selected = entry.name === category;
              return (
                <li key={entry.name}>
                  <button
                    type="button"
                    onClick={() => setCategory(entry.name)}
                    aria-pressed={selected}
                    className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors ${
                      selected
                        ? "bg-ink-750 text-ivory-100"
                        : "text-fog-300 hover:bg-ink-800 hover:text-ivory-100"
                    }`}
                  >
                    <Icon
                      name={CATEGORY_ICON[entry.name] ?? "grid"}
                      className={`size-4 ${selected ? "text-gold-500" : "text-fog-500"}`}
                    />
                    <span className="flex-1 truncate">{entry.name}</span>
                    <span className="tabular text-xs text-fog-500">
                      {entry.count}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <p className="mt-6 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-fog-500">
            Quick filters
          </p>
          <button
            type="button"
            onClick={() => setFavouritesOnly((on) => !on)}
            aria-pressed={favouritesOnly}
            className={`mt-3 flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors ${
              favouritesOnly
                ? "bg-ink-750 text-ivory-100"
                : "text-fog-300 hover:bg-ink-800 hover:text-ivory-100"
            }`}
          >
            <Icon
              name="star"
              className={`size-4 ${favouritesOnly ? "text-gold-500" : "text-fog-500"}`}
            />
            <span className="flex-1">My favourites</span>
            <span className="tabular text-xs text-fog-500">
              {favourites.length}
            </span>
          </button>
        </nav>

        <div className="mt-4 rounded-lg border border-hairline bg-ink-850 p-5">
          <Icon name="crown" className="size-5 text-gold-500" />
          <p className="mt-3 font-serif text-base text-ivory-100">
            Need help getting started?
          </p>
          <p className="mt-2 text-xs leading-relaxed text-fog-300">
            Every application shares the same infrastructure. Check what is
            wired up before you build against it.
          </p>
          <Link
            href="/resources"
            className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-gold-500 hover:text-gold-300"
          >
            View shared resources
            <Icon name="arrowRight" className="size-3.5" />
          </Link>
        </div>
      </aside>

      {/* ---------------- Main column ---------------- */}
      <main className="min-w-0 flex-1">
        <section className="hero-motif overflow-hidden rounded-t-lg border border-hairline px-8 py-12 md:px-12 md:py-16">
          <h1 className="max-w-[18ch] font-serif text-4xl leading-tight text-ivory-100 md:text-5xl">
            AI Workspace for Casino &amp; Resort Operations
          </h1>
          <p className="mt-5 max-w-[58ch] leading-relaxed text-fog-300">
            Securely access AI-powered tools, insights, and workflows that drive
            revenue, delight guests, and manage risk responsibly.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#applications"
              className="inline-flex items-center gap-2 rounded-md bg-gold-500 px-5 py-2.5 text-sm font-semibold text-ink-950 transition-colors hover:bg-gold-300"
            >
              Explore applications
              <Icon name="arrowRight" className="size-4" />
            </a>
            <Link
              href="/resources"
              className="inline-flex items-center gap-2 rounded-md border border-hairline-strong px-5 py-2.5 text-sm font-semibold text-ivory-100 transition-colors hover:border-gold-600"
            >
              View shared resources
            </Link>
          </div>
        </section>

        {/* Headline metrics. Placeholder figures — see lib/demo-content.ts. */}
        <section
          aria-label="Headline metrics"
          className="grid grid-cols-2 gap-px overflow-hidden rounded-b-lg border border-t-0 border-hairline bg-hairline lg:grid-cols-4"
        >
          {HEADLINE_METRICS.map((metric) => (
            <div key={metric.label} className="flex items-center gap-4 bg-burgundy-800 px-6 py-5">
              <Icon name={metric.icon} className="size-6 shrink-0 text-gold-500" />
              <div className="min-w-0">
                <p className="text-xs text-fog-300">{metric.label}</p>
                <p className="tabular mt-0.5 text-xl font-semibold text-ivory-100">
                  {metric.value}
                </p>
                <p className="tabular text-[11px] text-success">
                  {metric.delta} vs last month
                </p>
              </div>
            </div>
          ))}
        </section>

        {/* ---------------- Applications ---------------- */}
        <section id="applications" className="mt-8 scroll-mt-20">
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-hairline pb-3">
            <h2 className="font-serif text-2xl text-ivory-100">Applications</h2>
            <p className="text-xs text-fog-500">
              {visible.length === useCases.length
                ? `${useCases.length} registered`
                : `${visible.length} of ${useCases.length} shown`}
              {query && ` · matching “${initialQuery.trim()}”`}
            </p>
          </div>

          {visible.length === 0 ? (
            <div className="mt-6 rounded-lg border border-dashed border-hairline bg-ink-850 p-10 text-center">
              <p className="font-serif text-lg text-ivory-100">
                Nothing matches this filter
              </p>
              <p className="mx-auto mt-2 max-w-[55ch] text-sm text-fog-300">
                {useCases.length === 0
                  ? "Applications appear here automatically once a folder exists under use-cases/. Scaffold one with npm run new:use-case <slug>."
                  : "Clear the category or favourites filter, or search for something else."}
              </p>
            </div>
          ) : (
            <ul className="mt-6 grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
              {visible.map((useCase) => {
                const favourite = favourites.includes(useCase.slug);
                return (
                  <li key={useCase.slug} className="relative">
                    <Link
                      href={`/use-cases/${useCase.slug}`}
                      className="block h-full rounded-lg border border-hairline bg-ink-800 p-6 transition-colors hover:border-hairline-strong hover:bg-ink-750"
                    >
                      <span
                        className={`grid size-12 place-items-center rounded-lg text-gold-300 ${
                          TILE[useCase.accent ?? "navy"] ?? TILE.navy
                        }`}
                      >
                        <Icon name={iconFor(useCase.icon)} className="size-6" />
                      </span>

                      <h3 className="mt-5 pr-8 text-base font-semibold text-ivory-100">
                        {useCase.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-fog-300">
                        {useCase.summary}
                      </p>

                      <span className="mt-5 flex flex-wrap items-center gap-2">
                        {useCase.tags[0] && (
                          <span className="rounded-full bg-ink-950 px-2.5 py-1 text-[11px] text-fog-300">
                            {useCase.tags[0]}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline px-2.5 py-1 text-[11px] text-fog-300">
                          <span
                            className={`size-1.5 rounded-full ${STATUS_DOT[useCase.status]}`}
                            aria-hidden
                          />
                          {STATUS_LABEL[useCase.status]}
                        </span>
                      </span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => toggleFavourite(useCase.slug)}
                      aria-pressed={favourite}
                      aria-label={`${favourite ? "Remove" : "Add"} ${useCase.title} ${
                        favourite ? "from" : "to"
                      } favourites`}
                      className={`absolute right-4 top-4 rounded-md p-1.5 transition-colors ${
                        favourite
                          ? "text-gold-500"
                          : "text-fog-500 hover:text-ivory-100"
                      }`}
                    >
                      <Icon name="star" className="size-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>

      {/* ---------------- Right rail ---------------- */}
      <aside className="hidden w-80 shrink-0 space-y-4 2xl:block">
        <section className="rounded-lg border border-hairline bg-ink-850 p-5">
          <h2 className="text-sm font-semibold text-ivory-100">Recent activity</h2>
          <ul className="mt-4 space-y-3">
            {RECENT_ACTIVITY.map((item) => (
              <li key={item.text} className="flex gap-3">
                <Icon name={item.icon} className="mt-0.5 size-4 shrink-0 text-fog-500" />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs leading-relaxed text-fog-300">
                    {item.text}
                  </span>
                  <span className="block text-[11px] text-fog-500">
                    {item.when}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-hairline bg-ink-850 p-5">
          <h2 className="text-sm font-semibold text-ivory-100">Featured insight</h2>
          <ul className="mt-4 space-y-3">
            {FEATURED_INSIGHTS.map((item) => (
              <li key={item.title} className="flex gap-3">
                <Icon name="fileText" className="mt-0.5 size-4 shrink-0 text-gold-500" />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs leading-relaxed text-ivory-100">
                    {item.title}
                  </span>
                  <span className="block text-[11px] text-fog-500">
                    {item.when}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* The only rail panel driven by live state. */}
        <section className="rounded-lg border border-hairline bg-ink-850 p-5">
          <h2 className="text-sm font-semibold text-ivory-100">
            Governance &amp; access
          </h2>
          <div className="mt-4 flex items-center gap-4">
            <Icon
              name={
                resourcesConfigured === resourcesTotal ? "checkShield" : "alertTriangle"
              }
              className={`size-8 shrink-0 ${
                resourcesConfigured === resourcesTotal
                  ? "text-success"
                  : "text-warning"
              }`}
            />
            <p className="text-xs leading-relaxed text-fog-300">
              {resourcesConfigured} of {resourcesTotal} shared resources are
              configured for this environment.
            </p>
          </div>
          <Link
            href="/resources"
            className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-gold-500 hover:text-gold-300"
          >
            Review configuration
            <Icon name="arrowRight" className="size-3.5" />
          </Link>
        </section>

        <section className="rounded-lg border border-hairline bg-ink-850 p-5">
          <h2 className="text-sm font-semibold text-ivory-100">Quick actions</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <a
              href="#applications"
              className="flex flex-col items-center gap-2 rounded-md border border-hairline px-3 py-4 text-center text-[11px] text-fog-300 transition-colors hover:border-gold-600 hover:text-ivory-100"
            >
              <Icon name="grid" className="size-4" />
              Browse applications
            </a>
            <Link
              href="/resources"
              className="flex flex-col items-center gap-2 rounded-md border border-hairline px-3 py-4 text-center text-[11px] text-fog-300 transition-colors hover:border-gold-600 hover:text-ivory-100"
            >
              <Icon name="workflow" className="size-4" />
              Shared resources
            </Link>
          </div>
        </section>

        <p className="px-1 text-[11px] leading-relaxed text-fog-500">
          Headline metrics, recent activity, and featured insight show
          demonstration data. Application and resource panels are live.
        </p>
      </aside>
    </div>
  );
}
