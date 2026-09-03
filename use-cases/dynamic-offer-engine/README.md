# Dynamic Offer Engine

Recommends promotions tailored to segment, informed by LTV percentile and
current churn band. Near real time — a proposal within minutes of a qualifying
event during the visit.

**Status:** planned. Scaffolded UI only; no backend yet.

Full design — outcomes, contracts, infrastructure, UI, flows, and API — is in
[`DESIGN.md`](./DESIGN.md). This README is the summary.

## Contract

Consumes `analytics.player_scores`. Produces offer proposals plus an audit-log
row per proposal. Adds no columns to the score contract.

## Constraints

- **Recommend only.** A marketer or host approves before anything reaches a
  player.
- **Responsible gaming gate applies before display**, not before send. A
  suppressed player must never appear in the approval queue.
- Enterprise AI explains the recommendation; it does not produce the score.

## Exit criteria

Proposals inside two minutes of the trigger event, each carrying a stated reason
and expected reinvestment, and no suppressed player in the queue.

## Open

Trigger events during a visit are undefined, as is the reinvestment budget rule
the engine must respect. See `docs/casino-scope.md`.
