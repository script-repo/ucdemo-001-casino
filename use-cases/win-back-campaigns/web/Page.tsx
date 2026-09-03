/**
 * UI for Win-Back Campaigns, rendered by the portal at
 * /use-cases/win-back-campaigns.
 *
 * Import only from `react`, `next/*`, and this folder. Importing from another
 * use case, or from the portal's `lib/` and `components/`, is not allowed.
 */
const EXIT_CRITERIA = [
  "A marketer can review, edit, approve, or reject a generated candidate list.",
  "Every decision lands in the audit log with the model version behind it.",
];

export default function Page() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <section className="rounded-lg border border-hairline bg-ink-800 p-8">
        <div className="gold-rule" aria-hidden />
        <h2 className="mt-4 font-serif text-2xl text-ivory-100">How it works</h2>
        <p className="mt-4 max-w-[70ch] leading-relaxed text-fog-300">
          Triggered when a player&apos;s churn risk crosses a threshold. It
          assembles a candidate list, pairs each player with a win-back offer
          sized by their LTV percentile, and routes the list for approval.
        </p>
        <p className="mt-4 max-w-[70ch] leading-relaxed text-fog-300">
          It consumes the score contract and produces no scores of its own. That
          makes it dependent on predictive LTV and churn-risk for real data, so
          it develops against the seeded stub until those land.
        </p>
        <p className="mt-4 max-w-[70ch] leading-relaxed text-fog-300">
          Every candidate passes the responsible gaming gate before the list is
          displayed. Enterprise AI drafts the campaign narrative; a marketer
          approves before anything is sent.
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
            Scaffolded only. Whether the portal owns approval end to end or hands
            off to an existing campaign system is still open.
          </p>
        </section>
      </aside>
    </div>
  );
}
