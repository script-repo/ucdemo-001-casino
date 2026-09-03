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
 * portal renders in Brand Mode, so build on the ink surfaces: `bg-ink-800`
 * cards on the `bg-ink-950` page, `border-hairline` edges, `text-ivory-100`
 * headings, `text-fog-300` body, and gold only as a fine rule.
 */
export default function Page() {
  return (
    <section className="rounded-lg border border-dashed border-hairline bg-ink-800 p-10">
      <div className="gold-rule" aria-hidden />
      <h2 className="mt-4 font-serif text-2xl text-ivory-100">
        __TITLE__ is scaffolded
      </h2>
      <p className="mt-3 max-w-[65ch] leading-relaxed text-fog-300">
        Replace this component with the real interface. The portal has already
        rendered the title, status, owner, category, and shared-resource list
        above from <code className="font-mono text-sm text-ivory-100">usecase.json</code>,
        so start with the body of the experience.
      </p>
      <ol className="mt-5 max-w-[65ch] list-inside list-decimal space-y-2 text-sm text-fog-300">
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
