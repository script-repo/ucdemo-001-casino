/**
 * UI for __TITLE__, rendered by the portal at /use-cases/__SLUG__.
 *
 * This is a server component by default. Add "use client" to this file, or to a
 * child in this folder, when you need state or event handlers.
 *
 * Import only from `react`, `next/*`, and this folder. Importing from another
 * use case, or from the portal's `lib/` and `components/`, is not allowed.
 *
 * Style against the Executive Resort Modernism tokens in app/globals.css. The
 * portal renders in Work Mode, so build on white or mist surfaces with
 * `border-stone-200` edges, `text-navy-950` headings, `text-charcoal-700`
 * body copy, and gold only as a fine rule.
 */
export default function Page() {
  return (
    <section className="rounded-lg border border-dashed border-stone-200 bg-mist-100 p-10">
      <div className="gold-rule" aria-hidden />
      <h2 className="mt-4 font-serif text-2xl text-navy-950">
        __TITLE__ is scaffolded
      </h2>
      <p className="mt-3 max-w-[65ch] leading-relaxed text-charcoal-700">
        Replace this component with the real interface. The portal has already
        rendered the title, status, owner, category, and shared-resource list
        above from <code className="font-mono text-sm text-navy-950">usecase.json</code>,
        so start with the body of the experience.
      </p>
      <ol className="mt-5 max-w-[65ch] list-inside list-decimal space-y-2 text-sm text-charcoal-700">
        <li>
          Fill in title, summary, owner, category, and resources in usecase.json.
        </li>
        <li>Pick an icon and accent so the dashboard card reads correctly.</li>
        <li>Build the interface here in web/.</li>
        <li>Keep or delete api/ depending on whether you need a backend.</li>
        <li>Run npm run validate before opening a pull request.</li>
      </ol>
    </section>
  );
}
