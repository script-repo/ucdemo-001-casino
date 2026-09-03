# Slot & Table Performance

Correlates machine placement and game theme with hold percentage and
time-on-device.

**Status:** planned. Scaffolded UI only; no backend yet.

Full design — outcomes, contracts, infrastructure, UI, flows, and API — is in
[`DESIGN.md`](./DESIGN.md). This README is the summary.

## Contract

Reads `cms_raw.slot_play`, `cms_raw.table_rating`, and the machine placement
dimension. Writes nothing to the score contract.

## Approach

Analytical rather than predictive at pilot: floor-section and theme performance,
time-on-device distributions, and underperforming units against comparable
placements.

## Why this one is the easiest to start

No player-facing output, so no responsible gaming gate and the lightest
regulatory burden of the six. It has no dependency on the score contract, so it
can begin before the week-one freeze lands.

## Exit criteria

A slot manager can identify underperforming units by placement and theme, and
drill from a floor view down to an individual machine.

## Depends on

The simulator producing a genuine correlation between placement, theme, and
performance. Without it there is no signal to find.
