"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PatronRecord, RgStatus } from "@/lib/player-cms";

const NOTES_KEY = "casino-cms-notes-v1";

function browserGatewayConfig(): Record<string, string> {
  try {
    const value = JSON.parse(
      localStorage.getItem("casino-ai-gateway-settings-v1") ?? "{}",
    ) as unknown;
    return value && typeof value === "object" ? (value as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function money(value: number) {
  return `$${value.toLocaleString()}`;
}

function rgClass(status: RgStatus) {
  if (status === "self-excluded") return "border-critical/40 bg-critical/10 text-burgundy-700";
  if (status === "marketing-suppressed") {
    return "border-warning/40 bg-warning/10 text-bronze-700";
  }
  return "border-success/30 bg-success/10 text-success-dark";
}

export function PlayerCmsRecord({ patron }: { patron: PatronRecord }) {
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const [briefing, setBriefing] = useState<{
    text: string;
    provider: string;
    model: string;
  } | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const store = JSON.parse(localStorage.getItem(NOTES_KEY) ?? "{}") as Record<
        string,
        string
      >;
      setNote(store[String(patron.playerId)] ?? "");
    } catch {
      setNote("");
    }
    setBriefing(null);
    setError(null);
    setSaved(false);
  }, [patron.playerId]);

  function saveNote() {
    try {
      const store = JSON.parse(localStorage.getItem(NOTES_KEY) ?? "{}") as Record<
        string,
        string
      >;
      store[String(patron.playerId)] = note;
      localStorage.setItem(NOTES_KEY, JSON.stringify(store));
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }

  async function generateBriefing() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/cms/players/${patron.playerId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gatewayConfig: browserGatewayConfig() }),
      });
      const result = (await response.json()) as {
        text?: string;
        provider?: string;
        model?: string;
        error?: string;
      };
      if (!response.ok || !result.text) {
        throw new Error(result.error ?? "Host briefing could not be generated.");
      }
      setBriefing({
        text: result.text,
        provider: result.provider ?? "Inference gateway",
        model: result.model ?? "selected model",
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Host briefing could not be generated.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.8fr)]">
      <div className="space-y-5">
        {patron.rgStatus !== "clear" && (
          <div className={`rounded-lg border px-4 py-3 text-sm ${rgClass(patron.rgStatus)}`}>
            <p className="font-semibold capitalize">
              Responsible-gaming flag: {patron.rgStatus.replaceAll("-", " ")}
            </p>
            <p className="mt-1">
              Do not use this record for offers, campaigns, or outbound contact. Follow
              property protocol before any player-facing action.
            </p>
          </div>
        )}

        <section className="resort-panel p-6">
          <p className="eyebrow">Patron identity</p>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-serif text-3xl text-navy-950">{patron.displayName}</h2>
              <p className="mt-1 text-sm text-charcoal-700">
                ID {patron.playerId} · {patron.cardNumber} · {patron.property}
              </p>
            </div>
            <span className="rounded-full bg-navy-950 px-3 py-1 text-xs font-semibold text-ivory-100">
              {patron.tier}
            </span>
          </div>
          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            <Metric label="Email" value={patron.email} />
            <Metric label="Phone" value={patron.phone} />
            <Metric label="City" value={patron.city} />
            <Metric label="Host" value={patron.hostId} />
            <Metric label="Enrolled" value={patron.enrolledOn} />
            <Metric label="Card status" value={patron.cardStatus.replaceAll("-", " ")} />
          </dl>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <Kpi label="Lifetime theo" value={money(patron.lifetimeTheo)} />
          <Kpi label="Non-gaming spend" value={money(patron.nonGamingSpend)} />
          <Kpi label="Carded visits" value={String(patron.visitCount)} />
        </section>

        <section className="overflow-hidden rounded-lg border border-stone-200 bg-white">
          <div className="border-b border-stone-200 px-5 py-3">
            <h3 className="font-serif text-xl text-navy-900">Recent visits</h3>
            <p className="mt-1 text-xs text-charcoal-700">
              Preferred game: {patron.preferredGame}
            </p>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-mist-100 text-[10px] uppercase tracking-wide text-charcoal-700">
              <tr>
                <th className="px-5 py-2">Date</th>
                <th className="px-3 py-2">Theo</th>
                <th className="px-3 py-2">Hotel nights</th>
              </tr>
            </thead>
            <tbody>
              {patron.visits.map((visit) => (
                <tr key={visit.date} className="border-t border-stone-200">
                  <td className="px-5 py-3">{visit.date}</td>
                  <td className="px-3 py-3">{money(visit.theo)}</td>
                  <td className="px-3 py-3">{visit.nights}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="overflow-hidden rounded-lg border border-stone-200 bg-white">
          <div className="border-b border-stone-200 px-5 py-3">
            <h3 className="font-serif text-xl text-navy-900">Comp history</h3>
          </div>
          <ul className="divide-y divide-stone-200">
            {patron.comps.map((comp) => (
              <li key={`${comp.date}-${comp.offer}`} className="flex justify-between gap-3 px-5 py-3 text-sm">
                <span>
                  <span className="font-medium text-charcoal-900">{comp.offer}</span>
                  <span className="block text-xs text-charcoal-700">{comp.date}</span>
                </span>
                <span className="capitalize text-charcoal-700">{comp.status}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <aside className="space-y-5">
        <section className="rounded-lg border border-gold-600/40 bg-white p-5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-charcoal-700">
            Generative AI · host guidance
          </p>
          <h3 className="mt-1 font-serif text-xl text-navy-900">Host briefing</h3>
          <p className="mt-2 text-xs text-charcoal-700">
            Optional. The record stays usable without inference. Configure gateways on
            Resources first.
          </p>
          <button
            type="button"
            disabled={pending}
            onClick={() => void generateBriefing()}
            className="mt-3 rounded-md bg-navy-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {pending ? "Generating…" : "Generate host briefing"}
          </button>
          {briefing && (
            <>
              <p className="mt-3 whitespace-pre-line rounded-md bg-mist-100 p-3 text-sm leading-relaxed text-charcoal-900">
                {briefing.text.replaceAll("**", "")}
              </p>
              <p className="mt-2 text-[10px] text-charcoal-700">
                {briefing.provider} · {briefing.model}
              </p>
            </>
          )}
          {error && <p className="mt-3 text-sm text-burgundy-700">{error}</p>}
        </section>

        <section className="rounded-lg border border-stone-200 bg-white p-5">
          <h3 className="font-serif text-xl text-navy-900">Host notes</h3>
          <p className="mt-1 text-xs text-charcoal-700">
            Saved in this browser only. Two portal replicas do not share notes.
          </p>
          <textarea
            value={note}
            onChange={(event) => {
              setNote(event.target.value);
              setSaved(false);
            }}
            rows={5}
            placeholder="Floor observation, preference, or follow-up…"
            className="mt-3 w-full rounded-md border border-stone-200 p-3 text-sm"
          />
          <button
            type="button"
            onClick={saveNote}
            className="mt-3 rounded-md border border-navy-900 px-3 py-2 text-sm font-semibold text-navy-900"
          >
            Save note
          </button>
          {saved && <p className="mt-2 text-xs text-success-dark">Saved on this device.</p>}
        </section>

        <section className="rounded-lg border border-stone-200 bg-white p-5">
          <h3 className="font-serif text-xl text-navy-900">Related applications</h3>
          {patron.relatedApps.length === 0 ? (
            <p className="mt-2 text-sm text-charcoal-700">
              This ID is not in a current AI queue. The CMS record is still the source
              of identity.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {patron.relatedApps.map((app) => (
                <li key={app.href}>
                  <Link
                    href={app.href}
                    className="text-sm font-semibold text-navy-900 hover:text-burgundy-700"
                  >
                    {app.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </aside>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border border-stone-200 bg-white p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-charcoal-700">
        {label}
      </p>
      <p className="mt-1 font-serif text-2xl text-navy-900">{value}</p>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-mist-100 p-3">
      <dt className="text-[10px] uppercase tracking-wide text-charcoal-700">{label}</dt>
      <dd className="mt-1 break-all text-sm font-semibold text-charcoal-900">
        {value}
      </dd>
    </div>
  );
}
