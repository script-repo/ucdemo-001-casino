/**
 * UI for Revenue Management, rendered by the portal at
 * /use-cases/revenue-management.
 *
 * Import only from `react`, `next/*`, and this folder. Importing from another
 * use case, or from the portal's `lib/` and `components/`, is not allowed.
 */
const EXIT_CRITERIA = [
  "Forecasts beat a same-period-last-year baseline on MAPE.",
  "A revenue manager can override any recommended rate, with the reason recorded.",
];

export default function Page() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <section className="rounded-lg border border-hairline bg-ink-800 p-8">
        <div className="gold-rule" aria-hidden />
        <h2 className="mt-4 font-serif text-2xl text-ivory-100">How it works</h2>
        <p className="mt-4 max-w-[70ch] leading-relaxed text-fog-300">
          Time-series forecasting of occupancy and rate by date and segment,
          producing recommended room rates from demand forecasts and booking
          pace.
        </p>
        <p className="mt-4 max-w-[70ch] leading-relaxed text-fog-300">
          Hotel-side and largely independent of player scoring, though casino
          demand is a forecast input: the event calendar and expected
          high-value arrivals both move the right rate for a given night.
          Pricing a room purely on hotel demand ignores what the guest is worth
          on the floor.
        </p>
        <p className="mt-4 max-w-[70ch] leading-relaxed text-fog-300">
          Recommend only, consistent with the rest of the portfolio.
        </p>
      </section>

      <aside className="space-y-6">
        <section className="rounded-lg border border-hairline bg-ink-800 p-6">
          <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-fog-500">
            Pilot complete when
          </h3>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-fog-300">
            {EXIT_CRITERIA.map((criterion) => (
              <li key={criterion} className="flex gap-3">
                <span className="mt-2 size-1 shrink-0 rounded-full bg-gold-500" aria-hidden />
                {criterion}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-hairline border-l-2 border-l-gold-500 bg-ink-800 p-6">
          <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-fog-500">
            Not built yet
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-fog-300">
            Scaffolded only. Whether the event calendar is real, simulated, or
            out of scope is still an open question.
          </p>
        </section>
      </aside>
    </div>
  );
}
