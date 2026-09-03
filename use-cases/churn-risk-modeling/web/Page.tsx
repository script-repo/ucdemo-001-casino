/**
 * UI for Churn-Risk Modeling, rendered by the portal at
 * /use-cases/churn-risk-modeling.
 *
 * Import only from `react`, `next/*`, and this folder. Importing from another
 * use case, or from the portal's `lib/` and `components/`, is not allowed.
 */
const EXIT_CRITERIA = [
  "The model beats a fixed-90-day-window baseline on precision at the top risk decile.",
  "The cadence baseline per player is inspectable — a host can see why a regular was flagged.",
];

export default function Page() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <section className="rounded-lg border border-stone-200 bg-white p-8">
        <div className="gold-rule" aria-hidden />
        <h2 className="mt-4 font-serif text-2xl text-navy-950">How it works</h2>
        <p className="mt-4 max-w-[70ch] leading-relaxed text-charcoal-700">
          Flags players disengaging <em>relative to their own established
          cadence</em>, not against a fixed calendar window. A weekly player
          absent three weeks is at risk; a quarterly player absent three weeks is
          behaving perfectly normally. A fixed backstop catches players with too
          little history to establish a cadence at all.
        </p>
        <p className="mt-4 max-w-[70ch] leading-relaxed text-charcoal-700">
          Publishes <code className="font-mono text-sm text-navy-950">churn_risk</code>,{" "}
          <code className="font-mono text-sm text-navy-950">churn_band</code>, and{" "}
          <code className="font-mono text-sm text-navy-950">expected_days_to_visit</code>{" "}
          to the shared score contract, where win-back campaigns picks them up.
        </p>
        <p className="mt-4 max-w-[70ch] leading-relaxed text-charcoal-700">
          Because a host will act on the flag, the per-player cadence baseline has
          to be visible alongside the score. An unexplained risk number gets
          ignored the first time it is wrong.
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
            Scaffolded only. It needs the simulator to produce genuine cadence
            decay before absence, otherwise churn is random and unlearnable.
          </p>
        </section>
      </aside>
    </div>
  );
}
