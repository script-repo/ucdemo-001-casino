import { AskPanel } from "./AskPanel";

export default function Page() {
  const configured = Boolean(
    process.env.PRISM_CENTRAL_ENDPOINT && process.env.NAI_ENDPOINT,
  );

  return (
    <section className="space-y-6">
      {!configured && (
        <div className="rounded-lg border border-stone-200 border-l-2 border-l-warning bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-charcoal-700">
            Limited configuration
          </p>
          <p className="mt-2 max-w-[70ch] text-sm text-charcoal-900">
            Prism Central or Nutanix Enterprise AI is not configured. Copy{" "}
            <code className="font-mono text-xs">.env.example</code> to{" "}
            <code className="font-mono text-xs">.env.local</code> and supply the
            endpoints. Answers remain placeholders until then.
          </p>
        </div>
      )}

      <AskPanel />

      <div className="rounded-lg border border-stone-200 bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-charcoal-700">
          How this works
        </p>
        <p className="mt-3 max-w-[70ch] leading-relaxed text-charcoal-700">
          The form posts to a server action in this folder, which calls this use
          case&apos;s own backend. The backend reads current inventory from Prism
          Central, includes it in the prompt, and asks Nutanix Enterprise AI.
          Nothing in this path is shared with another use case.
        </p>
      </div>
    </section>
  );
}
