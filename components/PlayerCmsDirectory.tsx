"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { PatronSummary, PatronTier, RgStatus } from "@/lib/player-cms";
import { HOSTS } from "@/lib/player-cms";

type DirectoryResponse = {
  results: PatronSummary[];
  total: number;
  page: number;
  pageSize: number;
  hosts: string[];
  property: string;
};

const TIERS: Array<PatronTier | "all"> = ["all", "platinum", "gold", "silver", "bronze"];
const RG: Array<RgStatus | "all"> = [
  "all",
  "clear",
  "marketing-suppressed",
  "self-excluded",
];

function rgClass(status: RgStatus) {
  if (status === "self-excluded") return "bg-critical/10 text-burgundy-700";
  if (status === "marketing-suppressed") return "bg-warning/15 text-bronze-700";
  return "bg-success/10 text-success-dark";
}

export function PlayerCmsDirectory() {
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [tier, setTier] = useState<PatronTier | "all">("all");
  const [hostId, setHostId] = useState("all");
  const [rgStatus, setRgStatus] = useState<RgStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<DirectoryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setSearch(draft.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(handle);
  }, [draft]);

  useEffect(() => {
    const params = new URLSearchParams({
      search,
      tier,
      hostId,
      rgStatus,
      page: String(page),
      pageSize: "12",
    });
    let cancelled = false;
    setError(null);
    fetch(`/api/cms/players?${params}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as DirectoryResponse & { error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Directory could not be loaded.");
        if (!cancelled) setData(payload);
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Directory could not be loaded.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [search, tier, hostId, rgStatus, page]);

  const pages = useMemo(
    () => Math.max(1, Math.ceil((data?.total ?? 0) / (data?.pageSize ?? 12))),
    [data],
  );

  return (
    <div className="space-y-6">
      <form
        className="resort-panel grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault();
          setSearch(draft.trim());
          setPage(1);
        }}
      >
        <label className="block text-xs font-semibold text-charcoal-700 sm:col-span-2">
          Search name, card, or player ID
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Elena Hart or 100120"
            className="mt-1 h-10 w-full rounded-md border border-stone-200 px-3 text-sm"
          />
        </label>
        <label className="block text-xs font-semibold text-charcoal-700">
          Tier
          <select
            value={tier}
            onChange={(event) => {
              setTier(event.target.value as PatronTier | "all");
              setPage(1);
            }}
            className="mt-1 h-10 w-full rounded-md border border-stone-200 bg-white px-3 text-sm"
          >
            {TIERS.map((value) => (
              <option key={value} value={value}>
                {value === "all" ? "All tiers" : value}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-semibold text-charcoal-700">
          Host
          <select
            value={hostId}
            onChange={(event) => {
              setHostId(event.target.value);
              setPage(1);
            }}
            className="mt-1 h-10 w-full rounded-md border border-stone-200 bg-white px-3 text-sm"
          >
            <option value="all">All hosts</option>
            {(data?.hosts ?? HOSTS).map((host) => (
              <option key={host} value={host}>
                {host}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-semibold text-charcoal-700">
          Responsible gaming
          <select
            value={rgStatus}
            onChange={(event) => {
              setRgStatus(event.target.value as RgStatus | "all");
              setPage(1);
            }}
            className="mt-1 h-10 w-full rounded-md border border-stone-200 bg-white px-3 text-sm"
          >
            {RG.map((value) => (
              <option key={value} value={value}>
                {value === "all" ? "All statuses" : value.replaceAll("-", " ")}
              </option>
            ))}
          </select>
        </label>
      </form>

      {error && (
        <p className="rounded-md border border-critical/30 bg-critical/10 px-4 py-3 text-sm text-burgundy-700">
          {error}
        </p>
      )}

      <section className="overflow-hidden rounded-lg border border-stone-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 px-4 py-3">
          <h2 className="font-serif text-xl text-navy-900">Carded player book</h2>
          <p className="text-xs text-charcoal-700">
            {data ? `${data.total.toLocaleString()} records · ${data.property}` : "Loading…"}
          </p>
        </div>
        <div className="max-h-[42rem] overflow-auto">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead className="sticky top-0 bg-mist-100 text-[10px] uppercase tracking-wide text-charcoal-700">
              <tr>
                <th className="px-4 py-2">Player</th>
                <th className="px-3 py-2">Tier</th>
                <th className="px-3 py-2">Host</th>
                <th className="px-3 py-2">Last visit</th>
                <th className="px-3 py-2">City</th>
                <th className="px-3 py-2">Card</th>
                <th className="px-3 py-2">RG</th>
              </tr>
            </thead>
            <tbody>
              {!data && !error ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-charcoal-700">
                    Loading player book…
                  </td>
                </tr>
              ) : (data?.results.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-charcoal-700">
                    No players match those filters. Try a full player ID from a use-case queue.
                  </td>
                </tr>
              ) : (
                (data?.results ?? []).map((patron) => (
                <tr key={patron.playerId} className="border-t border-stone-200 hover:bg-mist-100">
                  <td className="px-4 py-3">
                    <Link
                      href={`/cms/players/${patron.playerId}`}
                      className="font-semibold text-navy-900 hover:text-burgundy-700"
                    >
                      {patron.displayName}
                    </Link>
                    <span className="block text-[10px] text-charcoal-700">
                      ID {patron.playerId}
                    </span>
                  </td>
                  <td className="px-3 py-3 capitalize">{patron.tier}</td>
                  <td className="px-3 py-3">{patron.hostId}</td>
                  <td className="px-3 py-3">{patron.lastVisit ?? "—"}</td>
                  <td className="px-3 py-3">{patron.city}</td>
                  <td className="px-3 py-3 capitalize">{patron.cardStatus}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${rgClass(patron.rgStatus)}`}
                    >
                      {patron.rgStatus.replaceAll("-", " ")}
                    </span>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-stone-200 px-4 py-3 text-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
            className="rounded-md border border-navy-900 px-3 py-1.5 text-xs font-semibold text-navy-900 disabled:opacity-40"
          >
            Previous
          </button>
          <p className="text-xs text-charcoal-700">
            Page {page} of {pages}
          </p>
          <button
            type="button"
            disabled={page >= pages}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-md border border-navy-900 px-3 py-1.5 text-xs font-semibold text-navy-900 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </section>
    </div>
  );
}
