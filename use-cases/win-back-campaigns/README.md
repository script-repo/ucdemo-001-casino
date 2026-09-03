# Win-Back Campaigns

Triggered by churn risk crossing a threshold. Assembles a candidate list, sizes
each offer by LTV percentile, and routes the list for approval.

**Status:** planned. Scaffolded UI only; no backend yet.

Full design — outcomes, contracts, infrastructure, UI, flows, and API — is in
[`DESIGN.md`](./DESIGN.md). This README is the summary.

## Contract

Consumes `analytics.player_scores`. Produces candidate lists and an audit-log row
per decision. Produces no scores of its own.

## Constraints

- **Recommend only.** A marketer reviews, edits, approves, or rejects.
- **Responsible gaming gate applies before the list is displayed.**
- Enterprise AI drafts the campaign narrative; it does not decide who is on the
  list.

## Sequencing

Depends on predictive LTV and churn-risk for real scores, so it develops against
the seeded stub until those land. The stub is the whole reason all six can run in
parallel.

## Exit criteria

A marketer can review, edit, approve, or reject a generated candidate list, and
every decision lands in the audit log against the model version that produced it.

## Open

Whether the portal owns approval end to end or hands off to an existing campaign
management system.
