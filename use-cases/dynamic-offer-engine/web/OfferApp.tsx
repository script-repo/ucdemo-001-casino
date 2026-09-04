"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BUDGET,
  OFFER_CATALOGUE,
  PROPOSALS,
  SUPPRESSED_COUNT,
  type Offer,
  type Proposal,
} from "./data";

type Decision = {
  outcome: "approved" | "edited" | "rejected" | "skipped";
  reason: string;
  finalOffer: Offer;
};

const DEMO_NOW = new Date("2026-09-03T20:05:00Z").getTime();

function browserGatewayConfig(): Record<string, string> {
  try {
    const value = JSON.parse(localStorage.getItem("casino-ai-gateway-settings-v1") ?? "{}");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function age(triggeredAt: string) {
  const seconds = Math.max(0, (DEMO_NOW - new Date(triggeredAt).getTime()) / 1000);
  if (seconds < 60) return `${Math.round(seconds)} sec`;
  return `${Math.round(seconds / 60)} min`;
}

export function OfferApp() {
  const [proposals, setProposals] = useState(PROPOSALS);
  const [selectedId, setSelectedId] = useState(PROPOSALS[0]?.proposalId ?? null);
  const [decisions, setDecisions] = useState<Record<number, Decision>>({});
  const [status, setStatus] = useState<"pending" | "reviewed" | "all">("pending");
  const [kind, setKind] = useState("all");
  const [reason, setReason] = useState("");
  const [editedOfferId, setEditedOfferId] = useState("");

  const visible = useMemo(
    () =>
      proposals.filter((proposal) => {
        const reviewed = Boolean(decisions[proposal.proposalId]);
        if (status === "pending" && reviewed) return false;
        if (status === "reviewed" && !reviewed) return false;
        return kind === "all" || proposal.offer.kind === kind;
      }),
    [proposals, decisions, status, kind],
  );
  const selected =
    proposals.find((proposal) => proposal.proposalId === selectedId) ??
    visible[0] ??
    null;
  const pendingCost = proposals
    .filter((proposal) => !decisions[proposal.proposalId])
    .reduce((sum, proposal) => sum + proposal.offer.expectedCost, 0);
  const approvedCost = Object.values(decisions)
    .filter((decision) => decision.outcome === "approved" || decision.outcome === "edited")
    .reduce((sum, decision) => sum + decision.finalOffer.expectedCost, 0);
  const utilisation = (BUDGET.committed + approvedCost) / BUDGET.cap;

  function decide(
    proposal: Proposal,
    outcome: Decision["outcome"],
    finalOffer = proposal.offer,
  ) {
    setDecisions((current) => ({
      ...current,
      [proposal.proposalId]: {
        outcome,
        reason: reason.trim(),
        finalOffer,
      },
    }));
    setReason("");
    setEditedOfferId("");
  }

  function simulateEvent() {
    const template = PROPOSALS[(proposals.length + 3) % PROPOSALS.length]!;
    const next: Proposal = {
      ...template,
      proposalId: Math.max(...proposals.map((proposal) => proposal.proposalId)) + 1,
      playerId: template.playerId + 1000,
      playerLabel: `Player ${template.playerId + 1000}`,
      triggeredAt: "2026-09-03T20:04:42Z",
      overBudget: utilisation >= 1,
    };
    setProposals((current) => [next, ...current]);
    setSelectedId(next.proposalId);
    setStatus("pending");
  }

  return (
    <div className="-mx-2 overflow-hidden rounded-xl border border-stone-200 bg-mist-100 text-charcoal-900 shadow-sm sm:mx-0">
      <header className="border-b border-stone-200 bg-white px-5 py-5 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="gold-rule" aria-hidden />
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-charcoal-700">
              Internal · Marketing operations
            </p>
            <h2 className="mt-2 font-serif text-3xl text-navy-900">
              Dynamic Offer Engine
            </h2>
            <p className="mt-2 max-w-[68ch] text-sm leading-relaxed text-charcoal-700">
              Review value-aware proposals generated during a visit. Every
              recommendation requires human approval before dispatch.
            </p>
          </div>
          <button
            type="button"
            onClick={simulateEvent}
            className="rounded-md bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-700"
          >
            Simulate trigger event
          </button>
        </div>
      </header>

      <main className="space-y-5 px-5 py-6 sm:px-8">
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Kpi
            label="Pending proposals"
            value={String(proposals.filter((p) => !decisions[p.proposalId]).length)}
          />
          <Kpi
            label="Reviewed"
            value={String(Object.keys(decisions).length)}
            tone="success"
          />
          <Kpi label="Expected pending cost" value={money(pendingCost)} />
          <Kpi
            label="Over budget"
            value={String(proposals.filter((p) => p.overBudget).length)}
            tone="warning"
          />
          <Kpi
            label="Suppressed before display"
            value={String(SUPPRESSED_COUNT)}
            tone="success"
          />
        </section>

        <section className="rounded-lg border border-stone-200 bg-white p-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h3 className="font-serif text-xl text-navy-900">Period budget</h3>
              <p className="mt-1 text-sm text-charcoal-700">
                {money(BUDGET.committed + approvedCost)} committed of{" "}
                {money(BUDGET.cap)} · {money(pendingCost)} pending
              </p>
            </div>
            <span className={`text-sm font-semibold ${utilisation >= 1 ? "text-critical" : "text-success-dark"}`}>
              {Math.round(utilisation * 100)}% committed
            </span>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-mist-100">
            <div
              className={`h-full ${utilisation >= 1 ? "bg-critical" : "bg-success"}`}
              style={{ width: `${Math.min(100, utilisation * 100)}%` }}
            />
          </div>
        </section>

        <section className="rounded-lg border border-success/30 bg-success/10 px-4 py-3">
          <p className="text-sm font-semibold text-success-dark">
            Responsible-gaming gate active
          </p>
          <p className="mt-1 text-xs text-charcoal-700">
            {SUPPRESSED_COUNT} candidates were filtered before proposal creation.
            Identities are intentionally unavailable to this application.
          </p>
        </section>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(26rem,1.1fr)]">
          <section className="overflow-hidden rounded-lg border border-stone-200 bg-white">
            <div className="grid gap-3 border-b border-stone-200 p-4 sm:grid-cols-2">
              <label className="text-xs font-semibold text-charcoal-700">
                Queue status
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as typeof status)}
                  className="mt-1 block h-10 w-full rounded-md border border-stone-200 bg-white px-3 text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="all">All</option>
                </select>
              </label>
              <label className="text-xs font-semibold text-charcoal-700">
                Offer type
                <select
                  value={kind}
                  onChange={(event) => setKind(event.target.value)}
                  className="mt-1 block h-10 w-full rounded-md border border-stone-200 bg-white px-3 text-sm"
                >
                  <option value="all">All types</option>
                  <option value="freeplay">Free play</option>
                  <option value="food">Food</option>
                  <option value="hotel">Hotel</option>
                  <option value="event">Event</option>
                </select>
              </label>
            </div>
            <div className="max-h-[48rem] overflow-auto">
              {visible.map((proposal) => {
                const decision = decisions[proposal.proposalId];
                return (
                  <button
                    key={proposal.proposalId}
                    type="button"
                    onClick={() => setSelectedId(proposal.proposalId)}
                    className={`block w-full border-b border-stone-200 p-4 text-left ${
                      selected?.proposalId === proposal.proposalId ? "bg-gold-300/20" : "hover:bg-mist-100"
                    }`}
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span>
                        <span className="block font-semibold text-navy-900">{proposal.playerLabel}</span>
                        <span className="mt-1 block text-xs text-charcoal-700">
                          {proposal.offer.name} · {proposal.triggerZone}
                        </span>
                      </span>
                      <span className="text-right">
                        <span className="block text-xs font-semibold text-charcoal-900">
                          {decision?.outcome ?? age(proposal.triggeredAt)}
                        </span>
                        {proposal.overBudget && (
                          <span className="mt-1 block text-[10px] font-semibold uppercase text-critical">
                            over budget
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                );
              })}
              {visible.length === 0 && (
                <p className="p-8 text-center text-sm text-charcoal-700">
                  No proposals match this view.
                </p>
              )}
            </div>
          </section>

          <section>
            {selected ? (
              <ProposalPanel
                proposal={selected}
                decision={decisions[selected.proposalId]}
                reason={reason}
                editedOfferId={editedOfferId}
                onReason={setReason}
                onEdit={setEditedOfferId}
                onDecision={decide}
              />
            ) : (
              <div className="rounded-lg border border-dashed border-stone-200 bg-white p-8 text-center text-charcoal-700">
                Select a proposal to review.
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function ProposalPanel({
  proposal,
  decision,
  reason,
  editedOfferId,
  onReason,
  onEdit,
  onDecision,
}: {
  proposal: Proposal;
  decision?: Decision;
  reason: string;
  editedOfferId: string;
  onReason: (value: string) => void;
  onEdit: (value: string) => void;
  onDecision: (proposal: Proposal, outcome: Decision["outcome"], offer?: Offer) => void;
}) {
  const alternatives = OFFER_CATALOGUE.filter(
    (offer) => offer.minPercentile <= proposal.ltvPercentile,
  );
  const editedOffer = alternatives.find((offer) => offer.id === editedOfferId);
  const [aiRationale, setAiRationale] = useState<{
    text: string;
    provider: string;
    model: string;
  } | null>(null);
  const [aiPending, setAiPending] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    setAiRationale(null);
    setAiError(null);
  }, [proposal.proposalId]);

  async function generateRationale() {
    setAiPending(true);
    setAiError(null);
    try {
      const response = await fetch("/api/dynamic-offer-engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposalId: proposal.proposalId,
          proposal,
          gatewayConfig: browserGatewayConfig(),
        }),
      });
      const result = (await response.json()) as {
        text?: string;
        provider?: string;
        model?: string;
        error?: string;
      };
      if (!response.ok || !result.text) {
        throw new Error(result.error ?? "AI rationale could not be generated.");
      }
      setAiRationale({
        text: result.text,
        provider: result.provider ?? "Inference gateway",
        model: result.model ?? "selected model",
      });
    } catch (error) {
      setAiError(
        error instanceof Error ? error.message : "AI rationale could not be generated.",
      );
    } finally {
      setAiPending(false);
    }
  }

  return (
    <article className="space-y-4 rounded-lg border border-stone-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-charcoal-700">
            Proposal {proposal.proposalId} · {age(proposal.triggeredAt)} old
          </p>
          <h3 className="mt-1 font-serif text-2xl text-navy-900">{proposal.playerLabel}</h3>
          <p className="mt-1 text-sm text-charcoal-700">
            {proposal.tier} · {proposal.ltvPercentile}th percentile · {proposal.churnBand} churn risk
          </p>
        </div>
        <span className="rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success-dark">
          RG gate passed
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Proposed offer" value={proposal.offer.name} />
        <Metric label="Face value" value={money(proposal.offer.faceValue)} />
        <Metric label="Expected cost" value={money(proposal.offer.expectedCost)} />
      </div>

      <div className="rounded-md border-l-2 border-l-gold-500 bg-mist-100 p-4">
        <div className="flex justify-between gap-3">
          <h4 className="text-sm font-semibold text-navy-900">Recommendation rationale</h4>
          <span className="text-[10px] font-semibold uppercase text-charcoal-700">
            {proposal.rationaleKind}
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-charcoal-700">{proposal.rationale}</p>
        <button
          type="button"
          disabled={aiPending}
          onClick={generateRationale}
          className="mt-3 rounded-md border border-navy-700 bg-white px-3 py-2 text-xs font-semibold text-navy-900 disabled:opacity-50"
        >
          {aiPending ? "Generating…" : "Generate AI rationale"}
        </button>
        {aiRationale && (
          <>
            <p className="mt-3 whitespace-pre-line border-t border-stone-200 pt-3 text-sm leading-relaxed text-charcoal-900">
              {aiRationale.text.replaceAll("**", "")}
            </p>
            <p className="mt-2 text-[10px] text-charcoal-700">
              {aiRationale.provider} · {aiRationale.model}
            </p>
          </>
        )}
        {aiError && <p className="mt-3 text-sm text-burgundy-700">{aiError}</p>}
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <Metric label="Trigger" value={proposal.triggerType.replaceAll("_", " ")} />
        <Metric label="Location" value={proposal.triggerZone} />
      </dl>

      {proposal.overBudget && (
        <p className="rounded-md border border-critical/30 bg-critical/10 px-3 py-2 text-sm text-burgundy-700">
          Period cap reached. Approval requires an override reason.
        </p>
      )}

      {decision ? (
        <div className="rounded-md bg-success/10 p-4 text-sm text-success-dark">
          <strong className="capitalize">{decision.outcome}</strong> · {decision.finalOffer.name}
          {decision.reason ? ` · ${decision.reason}` : ""}
        </div>
      ) : (
        <>
          <label className="block text-xs font-semibold text-charcoal-700">
            Edit to another eligible offer
            <select
              value={editedOfferId}
              onChange={(event) => onEdit(event.target.value)}
              className="mt-1 block h-10 w-full rounded-md border border-stone-200 bg-white px-3 text-sm"
            >
              <option value="">Keep proposed offer</option>
              {alternatives
                .filter((offer) => offer.id !== proposal.offer.id)
                .map((offer) => (
                  <option key={offer.id} value={offer.id}>
                    {offer.name} · expected cost {money(offer.expectedCost)}
                  </option>
                ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-charcoal-700">
            Review reason
            <input
              value={reason}
              onChange={(event) => onReason(event.target.value)}
              placeholder={proposal.overBudget ? "Required for budget override" : "Optional audit note"}
              className="mt-1 block h-10 w-full rounded-md border border-stone-200 px-3 text-sm"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={proposal.overBudget && !reason.trim()}
              onClick={() =>
                onDecision(
                  proposal,
                  editedOffer ? "edited" : "approved",
                  editedOffer ?? proposal.offer,
                )
              }
              className="rounded-md bg-navy-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              {editedOffer ? "Approve edited offer" : "Approve"}
            </button>
            <button
              type="button"
              onClick={() => onDecision(proposal, "rejected")}
              className="rounded-md border border-burgundy-700 px-4 py-2 text-sm font-semibold text-burgundy-700"
            >
              Reject
            </button>
            <button
              type="button"
              onClick={() => onDecision(proposal, "skipped")}
              className="rounded-md border border-stone-200 px-4 py-2 text-sm font-semibold text-charcoal-700"
            >
              Skip
            </button>
          </div>
        </>
      )}
      <p className="border-t border-stone-200 pt-3 text-xs text-charcoal-700">
        Decisions are audit events. This interface proposes only and never sends an offer.
      </p>
    </article>
  );
}

function Kpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "success" | "warning";
}) {
  const colour =
    tone === "success"
      ? "text-success-dark"
      : tone === "warning"
        ? "text-bronze-700"
        : "text-navy-900";
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-charcoal-700">{label}</p>
      <p className={`tabular mt-1 font-serif text-2xl ${colour}`}>{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-mist-100 p-3">
      <dt className="text-[10px] uppercase tracking-wide text-charcoal-700">{label}</dt>
      <dd className="mt-1 font-semibold text-charcoal-900">{value}</dd>
    </div>
  );
}
