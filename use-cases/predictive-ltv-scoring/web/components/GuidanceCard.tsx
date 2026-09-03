export function GuidanceCard() {
  return (
    <aside className="rounded-lg border border-stone-200 bg-white p-5">
      <h3 className="font-serif text-lg text-navy-900">How to use these scores</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-success">
            Use this estimate to
          </p>
          <ul className="mt-2 space-y-1.5 text-sm text-charcoal-700">
            <li>Prioritize player review</li>
            <li>Identify rising or declining value</li>
            <li>Prepare for host conversations</li>
            <li>Build cohorts for governed workflows</li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-critical">
            Do not use this estimate to
          </p>
          <ul className="mt-2 space-y-1.5 text-sm text-charcoal-700">
            <li>Guarantee future player behavior</li>
            <li>Automatically set an offer amount</li>
            <li>Replace responsible-gaming controls</li>
            <li>Replace host judgment</li>
          </ul>
        </div>
      </div>
      <p className="mt-4 rounded-md border border-stone-200 bg-mist-100 px-3 py-2 text-sm text-charcoal-700">
        No reinvestment recommendation is configured. Treat expected value as one
        input into the existing approval process — not as an approved spend amount.
      </p>
    </aside>
  );
}
