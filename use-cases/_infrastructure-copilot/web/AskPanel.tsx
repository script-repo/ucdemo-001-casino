"use client";

import { useActionState } from "react";
import { askCopilot, initialAskState } from "./actions";

const SUGGESTIONS = [
  "Which clusters are above 80% storage utilisation?",
  "List VMs with no recovery point in the last 24 hours.",
  "Summarise the critical alerts raised today.",
];

export function AskPanel() {
  const [state, formAction, pending] = useActionState(
    askCopilot,
    initialAskState,
  );

  return (
    <div className="space-y-5">
      <form action={formAction} className="flex flex-wrap gap-3">
        <label htmlFor="question" className="sr-only">
          Ask a question about the estate
        </label>
        <input
          id="question"
          name="question"
          defaultValue={state.question}
          placeholder="Ask about clusters, hosts, virtual machines, or alerts"
          className="min-h-[44px] flex-1 rounded-sm border border-stone-200 bg-white px-4 text-sm text-charcoal-900 placeholder:text-charcoal-700/70 focus:border-navy-700 focus:outline-none"
        />
        {/* Section 11.1 — primary action is navy fill with white text. */}
        <button
          type="submit"
          disabled={pending}
          className="min-h-[44px] rounded-md border border-navy-900 bg-navy-900 px-6 text-sm font-semibold text-white transition-colors duration-150 hover:border-navy-700 hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Working…" : "Ask"}
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <form key={suggestion} action={formAction}>
            <input type="hidden" name="question" value={suggestion} />
            {/* Section 11.1 — secondary action is white fill with navy border. */}
            <button
              type="submit"
              disabled={pending}
              className="min-h-[36px] rounded-md border border-stone-200 bg-white px-3 text-xs text-charcoal-900 transition-colors duration-150 hover:border-navy-700 disabled:opacity-60"
            >
              {suggestion}
            </button>
          </form>
        ))}
      </div>

      {state.error && (
        // Section 31.5 — say what happened and what to do about it.
        <div
          role="alert"
          className="rounded-lg border border-stone-200 border-l-2 border-l-critical bg-white p-5"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-charcoal-700">
            Request failed
          </p>
          <p className="mt-2 text-sm text-charcoal-900">{state.error}</p>
        </div>
      )}

      {state.answer && (
        <div className="rounded-lg border border-stone-200 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-charcoal-700">
            Answer
          </p>
          <p className="mt-3 max-w-[70ch] whitespace-pre-wrap leading-relaxed text-charcoal-900">
            {state.answer}
          </p>
          <p className="mt-4 border-t border-stone-200 pt-3 text-xs text-charcoal-700">
            Generated from live Prism Central inventory. Verify before acting on
            operational decisions.
          </p>
        </div>
      )}
    </div>
  );
}
