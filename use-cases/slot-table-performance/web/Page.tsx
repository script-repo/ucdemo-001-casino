/**
 * UI for Slot & Table Performance, rendered by the portal at
 * /use-cases/slot-table-performance.
 *
 * Import only from `react`, `next/*`, and this folder. Importing from another
 * use case, or from the portal's `lib/` and `components/`, is not allowed.
 */
const EXIT_CRITERIA = [
  "A slot manager can identify underperforming units by placement and theme.",
  "Drill-through works from a floor view to an individual machine.",
];

export default function Page() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <section className="rounded-lg border border-stone-200 bg-white p-8">
        <div className="gold-rule" aria-hidden />
        <h2 className="mt-4 font-serif text-2xl text-navy-950">How it works</h2>
        <p className="mt-4 max-w-[70ch] leading-relaxed text-charcoal-700">
          Correlates machine placement and game theme with hold percentage and
          time-on-device, so floor layout and game mix decisions rest on measured
          performance rather than on where a cabinet happened to be installed.
        </p>
        <p className="mt-4 max-w-[70ch] leading-relaxed text-charcoal-700">
          Analytical rather than predictive at pilot: floor-section and theme
          performance, time-on-device distributions, and underperforming units
          measured against comparable placements.
        </p>
        <p className="mt-4 max-w-[70ch] leading-relaxed text-charcoal-700">
          Nothing here reaches a player, so this use case carries no responsible
          gaming gate and the lightest regulatory burden of the six. Along with
          win-back, it has no dependency on the score contract and can start
          immediately.
        </p>
      </section>

      <aside className="space-y-6">
        <section className="rounded-lg border border-stone-200 bg-white p-6">
          <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
            Pilot complete when
          </h3>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-charcoal-700">
            {EXIT_CRITERIA.map((criterion) => (
              <li key={criterion} className="flex gap-3">
                <span className="mt-2 size-1 shrink-0 rounded-full bg-gold-500" aria-hidden />
                {criterion}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-stone-200 border-l-2 border-l-gold-500 bg-mist-100 p-6">
          <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
            Not built yet
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-charcoal-700">
            Scaffolded only. Its signal depends on the simulator producing a real
            correlation between placement, theme, and performance.
          </p>
        </section>
      </aside>
    </div>
  );
}
