/**
 * UI for Dynamic Offer Engine, rendered by the portal at
 * /use-cases/dynamic-offer-engine.
 *
 * Import only from `react`, `next/*`, and this folder. Importing from another
 * use case, or from the portal's `lib/` and `components/`, is not allowed.
 */
const EXIT_CRITERIA = [
  "Proposals generate within two minutes of the trigger event.",
  "Every proposal carries a stated reason and an expected reinvestment figure.",
  "No suppressed player ever appears in the approval queue.",
];

export default function Page() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <section className="rounded-lg border border-hairline bg-ink-800 p-8">
        <div className="gold-rule" aria-hidden />
        <h2 className="mt-4 font-serif text-2xl text-ivory-100">How it works</h2>
        <p className="mt-4 max-w-[70ch] leading-relaxed text-fog-300">
          Recommends promotions tailored to segment, informed by each player&apos;s
          LTV percentile and current churn band from the score contract. It runs
          near real time: an offer is proposed within minutes of a qualifying
          event during the visit.
        </p>
        <p className="mt-4 max-w-[70ch] leading-relaxed text-fog-300">
          The engine proposes and a marketer or host approves — it never
          dispatches to a player on its own. Every proposal passes the
          responsible gaming gate <em>before</em> it surfaces, so a suppressed
          player is filtered out of the queue rather than removed from it later.
        </p>
        <p className="mt-4 max-w-[70ch] leading-relaxed text-fog-300">
          Enterprise AI supplies the offer rationale in plain language. It
          explains the recommendation; it does not produce the score behind it.
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
            Scaffolded only. It depends on the score contract, which is the
            week-one deliverable; until that lands it develops against a seeded
            stub.
          </p>
        </section>
      </aside>
    </div>
  );
}
