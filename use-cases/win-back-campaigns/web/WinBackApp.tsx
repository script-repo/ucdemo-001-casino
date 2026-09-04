"use client";

import { useMemo, useState } from "react";
import {
  CANDIDATES,
  CHURN_MODEL,
  OFFERS,
  RECENCY_EXCLUDED_COUNT,
  SCORES_AS_OF,
  SUPPRESSED_COUNT,
  VALUE_MODEL,
  offerFor,
  type OfferId,
  type WinBackCandidate,
} from "./data";

type CandidateDecision = {
  state: "removed" | "offer_changed";
  reason: string;
  offerId?: OfferId;
};
type CampaignStatus = "draft" | "in_review" | "approved" | "released";
type Report = { text: string; provider: string; model: string };

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

function pct(value: number) {
  return `${Math.round(value * 100)}%`;
}

function sections(text: string) {
  const headings = ["CAMPAIGN SUMMARY", "COHORT INSIGHTS", "REVIEW PRIORITIES", "RISKS AND GUARDRAILS"];
  const output: Array<{ heading: string; lines: string[] }> = [];
  let current = { heading: headings[0]!, lines: [] as string[] };
  output.push(current);
  for (const raw of text.replaceAll("**", "").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const heading = headings.find((item) =>
      line.toUpperCase().replace(/[:#]/g, "").trim().startsWith(item),
    );
    if (heading) {
      current = output.find((item) => item.heading === heading) ?? { heading, lines: [] };
      if (!output.includes(current)) output.push(current);
    } else {
      current.lines.push(line.replace(/^[-*•\d.)\s]+/, ""));
    }
  }
  return output.filter((item) => item.lines.length);
}

export function WinBackApp() {
  const [name, setName] = useState("September Win-Back");
  const [churnMin, setChurnMin] = useState(0.6);
  const [valueMin, setValueMin] = useState(40);
  const [cap, setCap] = useState(250);
  const [snapshotIds, setSnapshotIds] = useState<number[] | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [decisions, setDecisions] = useState<Record<number, CandidateDecision>>({});
  const [reason, setReason] = useState("");
  const [selectedOffer, setSelectedOffer] = useState<OfferId>("FP25");
  const [status, setStatus] = useState<CampaignStatus>("draft");
  const [report, setReport] = useState<Report | null>(null);
  const [reportPending, setReportPending] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const preview = useMemo(
    () =>
      CANDIDATES.filter(
        (candidate) =>
          candidate.churnRisk >= churnMin &&
          candidate.ltvPercentile >= valueMin,
      ).slice(0, cap),
    [churnMin, valueMin, cap],
  );
  const frozen = snapshotIds
    ? snapshotIds
        .map((id) => CANDIDATES.find((candidate) => candidate.playerId === id))
        .filter((candidate): candidate is WinBackCandidate => Boolean(candidate))
    : [];
  const included = frozen.filter(
    (candidate) => decisions[candidate.playerId]?.state !== "removed",
  );
  const selected =
    frozen.find((candidate) => candidate.playerId === selectedId) ??
    frozen[0] ??
    null;
  const expectedCost = included.reduce((sum, candidate) => {
    const changedOffer = decisions[candidate.playerId]?.offerId;
    return sum + (OFFERS.find((offer) => offer.id === changedOffer) ?? offerFor(candidate.ltvPercentile)).expectedCost;
  }, 0);
  const reportCards = useMemo(() => (report ? sections(report.text) : []), [report]);

  function buildCampaign() {
    const ids = preview.map((candidate) => candidate.playerId);
    setSnapshotIds(ids);
    setSelectedId(ids[0] ?? null);
    setDecisions({});
    setStatus("in_review");
    setReport(null);
  }

  function removeSelected() {
    if (!selected || reason.trim().length < 8) return;
    setDecisions((current) => ({
      ...current,
      [selected.playerId]: { state: "removed", reason: reason.trim() },
    }));
    setReason("");
  }

  function changeOffer() {
    if (!selected || reason.trim().length < 8) return;
    setDecisions((current) => ({
      ...current,
      [selected.playerId]: {
        state: "offer_changed",
        offerId: selectedOffer,
        reason: reason.trim(),
      },
    }));
    setReason("");
  }

  async function generateReport() {
    setReportPending(true);
    setReportError(null);
    try {
      const response = await fetch("/api/win-back-campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "generate-report",
          churnMin,
          valueMin,
          cap,
          campaignName: name,
          gatewayConfig: browserGatewayConfig(),
        }),
      });
      const result = (await response.json()) as Partial<Report> & { error?: string };
      if (!response.ok || !result.text) {
        throw new Error(result.error ?? "The campaign report could not be generated.");
      }
      setReport({
        text: result.text,
        provider: result.provider ?? "Inference gateway",
        model: result.model ?? "selected model",
      });
    } catch (error) {
      setReportError(error instanceof Error ? error.message : "The campaign report could not be generated.");
    } finally {
      setReportPending(false);
    }
  }

  return (
    <div className="resort-frame -mx-2 text-charcoal-900 sm:mx-0">
      <header className="border-b border-stone-200 bg-white px-5 py-5 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="gold-rule" aria-hidden />
            <p className="eyebrow mt-3">Internal · Marketing operations</p>
            <h2 className="mt-2 font-serif text-3xl text-navy-900">Win-Back Campaigns</h2>
            <p className="mt-2 max-w-[72ch] text-sm leading-relaxed text-charcoal-700">
              Build a frozen, reviewable reactivation cohort from cadence-relative
              churn and expected value, then approve separately from release.
            </p>
          </div>
          <button
            type="button"
            disabled={reportPending}
            onClick={generateReport}
            className="rounded-md bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {reportPending ? "Generating…" : "Generate AI campaign report"}
          </button>
        </div>
      </header>

      <main className="space-y-5 px-5 py-6 sm:px-8">
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Kpi label="Live eligible preview" value={preview.length.toLocaleString()} />
          <Kpi label="Frozen candidates" value={snapshotIds ? frozen.length.toLocaleString() : "Not built"} />
          <Kpi label="Included after review" value={included.length.toLocaleString()} tone="success" />
          <Kpi label="Expected campaign cost" value={money(expectedCost)} />
          <Kpi label="Campaign status" value={status.replace("_", " ")} tone={status === "approved" || status === "released" ? "success" : undefined} />
        </section>

        <section className="rounded-lg border border-success/30 bg-success/10 px-4 py-3">
          <p className="text-sm font-semibold text-success-dark">Eligibility gate applied first</p>
          <p className="mt-1 text-xs text-charcoal-700">
            {SUPPRESSED_COUNT} responsible-gaming or marketing suppressions and {RECENCY_EXCLUDED_COUNT} players with an outstanding offer were removed before this application received candidates.
          </p>
        </section>

        {(report || reportError) && (
          <section className="rounded-lg border border-gold-600/40 bg-white p-5">
            <div className="flex flex-wrap justify-between gap-3">
              <div><p className="text-[10px] font-semibold uppercase tracking-wide text-charcoal-700">Generative AI · campaign insight</p><h3 className="mt-1 font-serif text-xl text-navy-900">Campaign readiness report</h3></div>
              {report && <p className="text-[10px] text-charcoal-700">{report.provider} · {report.model}</p>}
            </div>
            {report && (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {reportCards.map((section) => (
                  <article key={section.heading} className="rounded-md border border-stone-200 bg-mist-100 p-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-navy-900">{section.heading}</h4>
                    <ul className="mt-2 space-y-2 text-sm leading-relaxed">
                      {section.lines.map((line, index) => <li key={`${line}-${index}`} className="flex gap-2"><span className="text-gold-600">•</span><span>{line}</span></li>)}
                    </ul>
                  </article>
                ))}
              </div>
            )}
            {reportError && <p className="mt-3 text-sm text-burgundy-700">{reportError}</p>}
            <p className="mt-3 text-xs text-charcoal-700">AI analyzes the cohort only. It cannot add candidates, approve the campaign, or release outreach.</p>
          </section>
        )}

        <section className="rounded-lg border border-stone-200 bg-white p-5">
          <div className="grid gap-4 lg:grid-cols-5">
            <label className="text-xs font-semibold text-charcoal-700 lg:col-span-2">
              Campaign name
              <input value={name} onChange={(event) => setName(event.target.value)} disabled={Boolean(snapshotIds)} className="mt-1 block h-10 w-full rounded-md border border-stone-200 px-3 text-sm disabled:bg-mist-100" />
            </label>
            <label className="text-xs font-semibold text-charcoal-700">
              Churn threshold · {pct(churnMin)}
              <input type="range" min="0.4" max="0.9" step="0.05" value={churnMin} onChange={(event) => setChurnMin(Number(event.target.value))} disabled={Boolean(snapshotIds)} className="mt-3 w-full accent-navy-900" />
            </label>
            <label className="text-xs font-semibold text-charcoal-700">
              Value floor
              <select value={valueMin} onChange={(event) => setValueMin(Number(event.target.value))} disabled={Boolean(snapshotIds)} className="mt-1 block h-10 w-full rounded-md border border-stone-200 bg-white px-3 text-sm">
                <option value={40}>40th percentile</option><option value={60}>60th percentile</option><option value={75}>75th percentile</option><option value={85}>85th percentile</option>
              </select>
            </label>
            <label className="text-xs font-semibold text-charcoal-700">
              Candidate cap
              <select value={cap} onChange={(event) => setCap(Number(event.target.value))} disabled={Boolean(snapshotIds)} className="mt-1 block h-10 w-full rounded-md border border-stone-200 bg-white px-3 text-sm">
                <option value={100}>100</option><option value={250}>250</option><option value={400}>400</option>
              </select>
            </label>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-4">
            <p className="text-sm text-charcoal-700"><strong className="text-charcoal-900">{preview.length}</strong> candidates match · scores from {SCORES_AS_OF}</p>
            {!snapshotIds ? (
              <button type="button" onClick={buildCampaign} disabled={!preview.length} className="rounded-md bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Build frozen campaign</button>
            ) : (
              <button type="button" onClick={() => { setSnapshotIds(null); setStatus("draft"); setDecisions({}); }} className="rounded-md border border-stone-200 px-4 py-2 text-sm font-semibold">Start new draft</button>
            )}
          </div>
        </section>

        {snapshotIds && (
          <>
            <section className="rounded-lg border border-stone-200 bg-white p-5">
              <h3 className="font-serif text-xl text-navy-900">Offer ladder</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {OFFERS.map((offer) => {
                  const count = included.filter((candidate) => (decisions[candidate.playerId]?.offerId ?? offerFor(candidate.ltvPercentile).id) === offer.id).length;
                  return <article key={offer.id} className="rounded-md border border-stone-200 p-4"><p className="text-xs font-semibold text-charcoal-700">{offer.minPercentile}th percentile and above</p><p className="mt-1 font-semibold text-navy-900">{offer.name}</p><p className="mt-2 text-xs text-charcoal-700">{count} candidates · {money(count * offer.expectedCost)} expected cost</p></article>;
                })}
              </div>
            </section>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(23rem,0.85fr)]">
              <section className="overflow-hidden rounded-lg border border-stone-200 bg-white">
                <div className="border-b border-stone-200 px-4 py-3"><h3 className="font-serif text-xl text-navy-900">Frozen candidate review</h3><p className="mt-1 text-xs text-charcoal-700">Each change records a candidate-level review outcome.</p></div>
                <div className="max-h-[40rem] overflow-auto">
                  <table className="w-full min-w-[46rem] text-left text-sm">
                    <thead className="sticky top-0 bg-mist-100 text-[10px] uppercase tracking-wide text-charcoal-700"><tr><th className="px-4 py-2">Player</th><th className="px-3 py-2">Churn</th><th className="px-3 py-2">Value</th><th className="px-3 py-2">Last visit</th><th className="px-3 py-2">Offer</th><th className="px-3 py-2">State</th></tr></thead>
                    <tbody>
                      {frozen.map((candidate) => {
                        const decision = decisions[candidate.playerId];
                        const offer = OFFERS.find((item) => item.id === decision?.offerId) ?? offerFor(candidate.ltvPercentile);
                        return <tr key={candidate.playerId} onClick={() => { setSelectedId(candidate.playerId); setSelectedOffer(offer.id); }} className={`cursor-pointer border-t border-stone-200 ${selected?.playerId === candidate.playerId ? "bg-gold-300/20" : "hover:bg-mist-100"}`}><td className="px-4 py-3 font-semibold">{candidate.label}<span className="block text-[10px] font-normal text-charcoal-700">{candidate.host}</span></td><td className="px-3 py-3">{pct(candidate.churnRisk)}</td><td className="px-3 py-3">{candidate.ltvPercentile}th</td><td className="px-3 py-3">{candidate.lastVisit}</td><td className="px-3 py-3">{offer.id}</td><td className="px-3 py-3 capitalize">{decision?.state.replace("_", " ") ?? "Included"}</td></tr>;
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
              {selected && (
                <aside className="space-y-4 rounded-lg border border-stone-200 bg-white p-5">
                  <div><p className="text-[10px] font-semibold uppercase tracking-wide text-charcoal-700">Candidate detail</p><h3 className="mt-1 font-serif text-2xl text-navy-900">{selected.label}</h3><p className="text-sm text-charcoal-700">Host {selected.host}</p></div>
                  <div className="grid grid-cols-2 gap-3"><Metric label="Churn risk" value={pct(selected.churnRisk)} /><Metric label="Value rank" value={`${selected.ltvPercentile}th`} /><Metric label="Expected cadence" value={`${selected.expectedDaysToVisit} days`} /><Metric label="Current gap" value={`${selected.daysSinceVisit} days`} /></div>
                  <div className="rounded-md bg-mist-100 p-4"><p className="text-xs font-semibold text-navy-900">Why included</p><ul className="mt-2 space-y-1 text-xs text-charcoal-700">{selected.drivers.map((driver) => <li key={driver}>• {driver}</li>)}</ul></div>
                  <label className="block text-xs font-semibold text-charcoal-700">Review reason<textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} placeholder="Required for removal or offer change…" className="mt-1 w-full rounded-md border border-stone-200 p-3 text-sm" /></label>
                  <label className="block text-xs font-semibold text-charcoal-700">Alternate offer<select value={selectedOffer} onChange={(event) => setSelectedOffer(event.target.value as OfferId)} className="mt-1 h-10 w-full rounded-md border border-stone-200 bg-white px-3 text-sm">{OFFERS.map((offer) => <option key={offer.id} value={offer.id}>{offer.name}</option>)}</select></label>
                  <div className="grid grid-cols-2 gap-2"><button type="button" disabled={reason.trim().length < 8} onClick={changeOffer} className="rounded-md border border-navy-900 px-3 py-2 text-sm font-semibold text-navy-900 disabled:opacity-40">Change offer</button><button type="button" disabled={reason.trim().length < 8} onClick={removeSelected} className="rounded-md border border-burgundy-700 px-3 py-2 text-sm font-semibold text-burgundy-700 disabled:opacity-40">Remove</button></div>
                  <a href={`/cms/players/${selected.playerId}`} className="inline-flex items-center justify-center rounded-md bg-navy-900 px-4 py-2.5 text-sm font-semibold text-ivory-100 hover:bg-navy-700">Open player record in CMS</a>
                </aside>
              )}
            </div>

            <section className="sticky bottom-3 rounded-lg border border-navy-900/20 bg-navy-900 p-5 text-white shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div><p className="font-serif text-xl">{included.length} candidates · {money(expectedCost)} expected cost</p><p className="mt-1 text-xs text-white/70">{Object.keys(decisions).length} individually reviewed · built with {CHURN_MODEL} and {VALUE_MODEL}</p></div>
                <div className="flex gap-2">
                  {status === "in_review" && <button type="button" onClick={() => setStatus("approved")} className="rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-navy-900">Approve campaign</button>}
                  {status === "approved" && <button type="button" onClick={() => setStatus("released")} className="rounded-md bg-gold-500 px-4 py-2.5 text-sm font-semibold text-navy-900">Release export</button>}
                  {status === "released" && <span className="rounded-md bg-success px-4 py-2.5 text-sm font-semibold">Released · export ready</span>}
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: "success" }) {
  return <article className="rounded-lg border border-stone-200 bg-white p-4"><p className="text-[10px] font-semibold uppercase tracking-wide text-charcoal-700">{label}</p><p className={`mt-2 font-serif text-2xl capitalize ${tone === "success" ? "text-success-dark" : "text-navy-900"}`}>{value}</p></article>;
}
function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border border-stone-200 p-3"><p className="text-[10px] uppercase tracking-wide text-charcoal-700">{label}</p><p className="mt-1 font-semibold text-navy-900">{value}</p></div>;
}
