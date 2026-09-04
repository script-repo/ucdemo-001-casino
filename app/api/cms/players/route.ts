import { queryPatrons, type PatronTier, type RgStatus } from "@/lib/player-cms";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function noStore(payload: unknown, init?: ResponseInit) {
  return Response.json(payload, {
    ...init,
    headers: { ...init?.headers, "Cache-Control": "no-store" },
  });
}

function asTier(value: string | null): PatronTier | "all" {
  return value === "platinum" || value === "gold" || value === "silver" || value === "bronze"
    ? value
    : "all";
}

function asRg(value: string | null): RgStatus | "all" {
  return value === "clear" || value === "marketing-suppressed" || value === "self-excluded"
    ? value
    : "all";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  return noStore(
    queryPatrons({
      search: url.searchParams.get("search") ?? "",
      tier: asTier(url.searchParams.get("tier")),
      hostId: url.searchParams.get("hostId") || "all",
      rgStatus: asRg(url.searchParams.get("rgStatus")),
      page: Number(url.searchParams.get("page") ?? "1"),
      pageSize: Number(url.searchParams.get("pageSize") ?? "12"),
    }),
  );
}
