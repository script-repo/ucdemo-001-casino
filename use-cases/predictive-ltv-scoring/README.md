# Predictive LTV Scoring

Ranks players by predicted twelve-month forward value, combining theoretical win
from carded gaming with hotel and F&B spend.

**Status:** planned. Scaffolded UI only; no model or backend yet.

Full design — outcomes, contracts, infrastructure, UI, flows, and API — is in
[`DESIGN.md`](./DESIGN.md). This README is the summary.

## Contract

Publishes `ltv_12m_theo` and `ltv_percentile` to `analytics.player_scores`.
Together with churn-risk, this use case owns that table; everything else reads
it.

## Approach

Gradient-boosted regression over play frequency, theo per visit, trip length,
tier history, and non-gaming spend.

Calibration matters more than raw accuracy here. Reinvestment is sized directly
off the prediction, so a model that ranks correctly but runs 20% high overspends
the budget on every tier. A player predicted at $500 should average $500.

## Exit criteria

Nightly refresh for all carded players, calibration within 15% by decile on a
held-out period, and per-score driver visibility for hosts.
