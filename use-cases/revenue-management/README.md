# Revenue Management

Dynamic room rates from demand forecasts, booking pace, and the gaming value of
the guest being priced.

**Status:** beta. Interactive synthetic forecast, rate review, auditable overrides,
accuracy comparison, and inference-backed revenue reports are available.

Full design — outcomes, contracts, infrastructure, UI, flows, and API — is in
[`DESIGN.md`](./DESIGN.md). This README is the summary.

## Contract

Reads `cms_raw.hotel_stay` and `cms_raw.trip`. Produces recommended rates by date
and segment. Writes nothing to the score contract.

## Approach

Gradient-boosted demand forecasting by date and room type, followed by an
explainable rate-rules layer.

Hotel-side and largely independent of player scoring, but casino demand feeds the
forecast: the event calendar and expected high-value arrivals both move the right
rate for a given night. Pricing purely on hotel demand ignores what the guest is
worth on the floor.

Recommend only, consistent with the rest of the portfolio.

## Exit criteria

Forecasts beat a same-period-last-year baseline on MAPE, and a revenue manager
can override any recommended rate with the reason recorded.

## Open

Whether the event calendar is real, simulated, or out of scope.
