"use client";

import { useEffect, useState } from "react";
import {
  generatePlayerAction,
  type PlayerAction,
  type PlayerDetailPayload,
} from "../client-api";
import {
  activityLabel,
  formatDate,
  formatWhen,
  money,
  rankPhrase,
  tierLabel,
  trendLabel,
} from "../format";
import { DriverBars } from "./DriverBars";

export function PlayerDetail({
  detail,
  onClose,
}: {
  detail: PlayerDetailPayload;
  onClose: () => void;
}) {
  const { player, narrative, cmsUrl } = detail;
  const scored = player.ltv12m != null;
  const [action, setAction] = useState<PlayerAction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);

  useEffect(() => {
    setAction(null);
    setActionError(null);
  }, [player.playerId]);

  async function recommendAction() {
    setActionPending(true);
    setActionError(null);
    try {
      setAction(await generatePlayerAction(player.playerId));
    } catch (error) {
      setAction(null);
      setActionError(
        error instanceof Error
          ? error.message
          : "A recommended action could not be generated.",
      );
    } finally {
      setActionPending(false);
    }
  }

  return (
    <div
      className="flex h-full flex-col rounded-lg border border-stone-200 bg-white shadow-sm"
      role="region"
      aria-label={`Player ${player.playerId} detail`}
    >
      <header className="flex items-start justify-between gap-3 border-b border-stone-200 px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-charcoal-700">
            Player estimate
          </p>
          <h3 className="mt-1 font-serif text-2xl text-navy-900">
            {player.displayLabel}
          </h3>
          <p className="mt-1 text-sm text-charcoal-700">
            ID {player.playerId} · {tierLabel(player.tier)} · Host {player.hostId}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-stone-200 px-3 py-1.5 text-sm font-medium text-charcoal-900 hover:bg-mist-100"
        >
          Close
        </button>
      </header>

      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
        {!scored ? (
          <div className="rounded-lg border border-warning/40 bg-warning/10 p-4">
            <p className="text-sm font-semibold text-charcoal-900">
              Insufficient history
            </p>
            <p className="mt-2 text-sm leading-relaxed text-charcoal-700">
              {narrative}
            </p>
            <p className="mt-3 text-xs text-charcoal-700">
              Recorded visits: {player.visitCount} · Last visit:{" "}
              {player.lastVisit ? formatDate(player.lastVisit) : "—"}
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-stone-200 bg-mist-100 p-4">
              <p className="text-sm leading-relaxed text-charcoal-900">{narrative}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Metric
                label="Expected value — next 12 months"
                value={money(player.ltv12m!)}
              />
              <Metric
                label="Property rank"
                value={rankPhrase(player.percentile!)}
                hint={`Percentile ${player.percentile} at ${player.property}`}
              />
              <Metric
                label="Likely range"
                value={`${money(player.intervalLow!)} – ${money(player.intervalHigh!)}`}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
              <Meta label="Expected value change" value={trendLabel(player.trend)} />
              <Meta label="Player activity" value={activityLabel(player.activity)} />
              <Meta
                label="Last visit"
                value={player.lastVisit ? formatDate(player.lastVisit) : "—"}
              />
              <Meta
                label="When calculated"
                value={player.scoredAt ? formatWhen(player.scoredAt) : "—"}
              />
            </div>

            {(player.gamingShare != null || player.nonGamingShare != null) && (
              <p className="text-xs text-charcoal-700">
                Approximate mix in the estimate:{" "}
                {Math.round((player.gamingShare ?? 0) * 100)}% gaming ·{" "}
                {Math.round((player.nonGamingShare ?? 0) * 100)}% hotel & dining.
                Uncarded activity is not included.
              </p>
            )}

            <section>
              <h4 className="font-serif text-lg text-navy-900">
                Why this estimate looks this way
              </h4>
              <div className="mt-3">
                <DriverBars drivers={player.drivers} />
              </div>
            </section>

            <details className="rounded-lg border border-stone-200 bg-white">
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-navy-900">
                Technical details
              </summary>
              <dl className="space-y-2 border-t border-stone-200 px-4 py-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-charcoal-700">Scoring method</dt>
                  <dd className="text-charcoal-900">{player.modelLabel}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-charcoal-700">Technical ID</dt>
                  <dd className="font-mono text-xs text-charcoal-900">
                    {player.modelVersion}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-charcoal-700">Prior estimate</dt>
                  <dd className="tabular text-charcoal-900">
                    {player.priorLtv12m != null ? money(player.priorLtv12m) : "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-charcoal-700">Carded visits</dt>
                  <dd className="text-charcoal-900">{player.visitCount}</dd>
                </div>
              </dl>
            </details>
          </>
        )}

        <section className="rounded-lg border border-gold-600/40 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-charcoal-700">
                Generative AI · host guidance
              </p>
              <h4 className="mt-1 font-serif text-lg text-navy-900">
                Recommended action
              </h4>
            </div>
            <button
              type="button"
              disabled={actionPending}
              onClick={recommendAction}
              className="rounded-md bg-navy-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {actionPending ? "Generating…" : "Recommend action"}
            </button>
          </div>
          {action && (
            <>
              <p className="mt-3 whitespace-pre-line rounded-md bg-mist-100 p-3 text-sm leading-relaxed text-charcoal-900">
                {action.text.replaceAll("**", "")}
              </p>
              <p className="mt-2 text-[10px] text-charcoal-700">
                {action.provider} · {action.model}
              </p>
            </>
          )}
          {actionError && (
            <p className="mt-3 text-sm text-burgundy-700">{actionError}</p>
          )}
        </section>

        <div className="rounded-md border border-stone-200 bg-mist-100 px-3 py-2 text-xs text-charcoal-700">
          Prediction only — not a guarantee, automatic offer, or approved
          reinvestment amount. Based on recorded carded activity at this property.
        </div>
      </div>

      <footer className="border-t border-stone-200 px-5 py-4">
        <a
          href={cmsUrl}
          className="inline-flex items-center justify-center rounded-md bg-navy-900 px-4 py-2.5 text-sm font-semibold text-ivory-100 hover:bg-navy-700"
        >
          Open player record in CMS
        </a>
      </footer>
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-charcoal-700">
        {label}
      </p>
      <p className="mt-1 font-serif text-xl text-navy-900 tabular">{value}</p>
      {hint && <p className="mt-1 text-xs text-charcoal-700">{hint}</p>}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-charcoal-700">
        {label}
      </p>
      <p className="mt-1 text-charcoal-900">{value}</p>
    </div>
  );
}
