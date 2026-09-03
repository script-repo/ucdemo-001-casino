# Churn-Risk Modeling

Flags players disengaging relative to their own established cadence, not against
a fixed calendar window.

**Status:** planned. Scaffolded UI only; no model or backend yet.

Full design — outcomes, contracts, infrastructure, UI, flows, and API — is in
[`DESIGN.md`](./DESIGN.md). This README is the summary.

## Contract

Publishes `churn_risk`, `churn_band`, and `expected_days_to_visit` to
`analytics.player_scores`. Win-back campaigns triggers off these.

## Why cadence-relative

A weekly player absent three weeks is at risk. A quarterly player absent three
weeks is behaving normally. A fixed 90-day window scores both identically and is
wrong about one of them. A fixed backstop still catches players with too little
history to establish a cadence.

## Exit criteria

Beats a fixed-90-day-window baseline on precision at the top risk decile, and the
per-player cadence baseline is inspectable. A host acting on the flag needs to
see why a regular was flagged, or the score gets ignored the first time it is
wrong.

## Depends on

The simulator producing cadence decay ahead of absence. If churn is random in the
generated data, it is unlearnable and the model validates against noise.
