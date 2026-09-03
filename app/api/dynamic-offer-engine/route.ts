import { generateModelText } from "@/lib/model-gateways";
import {
  PROPOSALS,
  type Proposal,
} from "@/use-cases/dynamic-offer-engine/web/data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isProposal(value: unknown): value is Proposal {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Proposal>;
  return (
    typeof candidate.proposalId === "number" &&
    typeof candidate.playerLabel === "string" &&
    typeof candidate.ltvPercentile === "number" &&
    typeof candidate.churnBand === "string" &&
    typeof candidate.triggerType === "string" &&
    typeof candidate.triggerZone === "string" &&
    Boolean(candidate.offer) &&
    typeof candidate.offer?.name === "string" &&
    typeof candidate.offer?.faceValue === "number" &&
    typeof candidate.offer?.expectedCost === "number"
  );
}

export async function POST(request: Request) {
  let body: { proposalId?: unknown; proposal?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const proposal =
    PROPOSALS.find(
      (candidate) => candidate.proposalId === Number(body.proposalId),
    ) ?? (isProposal(body.proposal) ? body.proposal : null);
  if (!proposal) {
    return Response.json({ error: "Proposal was not found." }, { status: 404 });
  }

  const context = [
    `Synthetic player: ${proposal.playerLabel}`,
    `Tier: ${proposal.tier}`,
    `Expected player value percentile: ${proposal.ltvPercentile}`,
    `Churn band: ${proposal.churnBand}`,
    `Visit trigger: ${proposal.triggerType} in ${proposal.triggerZone}`,
    `Proposed offer: ${proposal.offer.name}`,
    `Face value: $${proposal.offer.faceValue}`,
    `Expected reinvestment cost: $${proposal.offer.expectedCost}`,
    `Budget status: ${proposal.overBudget ? "over period cap" : "within period cap"}`,
  ].join("\n");

  try {
    return Response.json(
      await generateModelText({
        systemPrompt:
          "You explain an already-selected synthetic casino offer to a human reviewer. Do not choose or change the offer. Use exactly these headings: WHY THIS FITS, REVIEW BEFORE APPROVING, DO NOT. Keep each section to one or two short sentences in plain language. Never encourage increased gambling, invent facts, auto-approve, or bypass budget and responsible-gaming controls.",
        context,
      }),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "AI rationale could not be generated.",
      },
      { status: 502 },
    );
  }
}
