# Revenue Management — Design

Assumes the shared platform, contracts, and principles in
[`docs/casino-uc-design.md`](../../docs/casino-uc-design.md).

---

## 1. Outcome

Room rates are set against a demand forecast that includes **casino demand**, so
the hotel is not filled with cash guests on a night when high-value players need
rooms.

| | Before | After |
| --- | --- | --- |
| Rate basis | Last year's rate, adjusted by feel | Forecast demand by date and room type |
| Casino demand | Handled by blocking rooms manually | An explicit forecast input |
| Overrides | Made, not recorded | Recorded with a reason and measured after |
| Accuracy | Unmeasured | MAPE against a stated baseline |

**Primary user:** revenue manager.
**Decision changed:** tonight's — and the next 90 nights' — room rate.

---

## 2. Displacement is the whole problem

In a standalone hotel, a full house at a high rate is a good night. In a casino
hotel it can be a bad one. A room sold for $180 cash that would otherwise have
gone to a player worth $900 in theoretical win is a $720 loss that appears
nowhere in hotel revenue, and appears as a *win* in every hotel metric.

So the recommendation is not "the rate that maximises room revenue". It is the
rate that maximises room revenue **subject to leaving enough inventory for
expected casino demand at its displacement value**.

That requires knowing roughly how many high-value players will want rooms on a
given night, which is where this use case touches player scoring — and it takes
that as an **aggregate**, deliberately:

```sql
CREATE VIEW analytics.expected_casino_demand AS
SELECT stay_date,
       COUNT(*) FILTER (WHERE ltv_percentile >= 85) AS expected_high_value,
       COUNT(*)                                     AS expected_total,
       SUM(displacement_value)                      AS displacement_value
FROM ...  -- expected arrivals derived from trip cadence and scores
GROUP BY stay_date;
```

Consuming per-player scores would couple hotel pricing to the player score
contract and make a hotel forecast wait on player scoring for no forecasting
benefit. A count and a value per date is all the pricing decision needs. This is
the decoupling recorded in the portfolio dependency map.

---

## 3. Contracts

**Reads:** `cms_raw.hotel_stay`, `trip`, `patron`, `fnb_transaction`;
`analytics.expected_casino_demand` (aggregate only, §2).

**Writes:** `analytics.decision_log` — one row per **override**, not per
recommendation. Rates are generated for 90 dates × room types nightly and logging
every one would bury the meaningful events. The auditable act is a human
departing from the recommendation.

**Private** (`uc_revenue`):

```sql
CREATE TABLE uc_revenue.demand_forecast (
    stay_date       DATE          NOT NULL,
    room_type       TEXT          NOT NULL,
    forecast_date   DATE          NOT NULL,   -- when the forecast was made
    expected_rooms  NUMERIC(8,2)  NOT NULL,
    interval_low    NUMERIC(8,2)  NOT NULL,
    interval_high   NUMERIC(8,2)  NOT NULL,
    model_version   TEXT          NOT NULL,
    PRIMARY KEY (stay_date, room_type, forecast_date)
);

CREATE TABLE uc_revenue.rate_recommendation (
    stay_date         DATE          NOT NULL,
    room_type         TEXT          NOT NULL,
    forecast_date     DATE          NOT NULL,
    recommended_rate  NUMERIC(8,2)  NOT NULL,
    current_rate      NUMERIC(8,2),
    casino_hold_rooms SMALLINT      NOT NULL,   -- inventory reserved (§2)
    rationale         JSONB         NOT NULL,
    PRIMARY KEY (stay_date, room_type, forecast_date)
);

CREATE TABLE uc_revenue.rate_override (
    stay_date     DATE          NOT NULL,
    room_type     TEXT          NOT NULL,
    override_rate NUMERIC(8,2)  NOT NULL,
    reason        TEXT          NOT NULL,
    actor         TEXT          NOT NULL,
    decision_id   BIGINT        NOT NULL,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
    PRIMARY KEY (stay_date, room_type, created_at)
);
```

`forecast_date` in the primary keys keeps every forecast vintage. Measuring
accuracy requires knowing what was predicted seven days out, not just what the
last forecast said — and overwriting in place makes a model look far better than
it is.

---

## 4. Method

**Demand forecast.** Gradient-boosted regression on calendar features — day of
week, month, holiday proximity, lead time — plus booking pace to date, trailing
occupancy, and the casino demand aggregate. Trained per room type where volume
supports it, pooled with room type as a feature where it does not; at ~300 rooms
the suite categories will not support their own model.

**Why not a classical time-series model.** Occupancy is driven more by calendar
and event structure than by autocorrelation, and events are a covariate. A
gradient-boosted model on calendar features handles the irregular
event-driven spikes that dominate a locals property better than a smooth seasonal
decomposition, and the pilot has 24 months — two observations of any annual
pattern, which is not enough to fit seasonality anyway.

**Rate recommendation** is a rules layer over the forecast, not a second model.
Forecast demand against available inventory gives a pressure ratio; the rate
moves along a demand curve fitted from historical rate-and-occupancy pairs;
inventory is then reserved for casino demand where its displacement value exceeds
the achievable cash rate. Keeping this as explicit rules means a revenue manager
can read why a rate moved, which a second model would not give.

**Baseline.** Same period last year, adjusted for trend. Every accuracy figure is
reported against it. A forecast that cannot beat last year does not justify the
change in process.

---

## 5. Infrastructure

| Object | Kind | Schedule | Notes |
| --- | --- | --- | --- |
| `rm-train` | `Job` | Weekly | MLflow run and registration |
| `rm-forecast` | `CronJob` | Nightly 03:20 | 90-day horizon, all room types; writes a new vintage |
| `rm-accuracy` | `CronJob` | Nightly 03:40 | Scores matured forecasts against actuals |
| `revenue-management` | `Deployment`, 2 replicas | — | FastAPI |

The smallest data of the six: 300 rooms over 730 days. Training is seconds. The
engineering effort is in vintage handling and the demand curve, not in scale.

No responsible gaming gate — no player-facing output. No narrative dependency,
so this use case is unaffected by the inference gateway constraint.

---

## 6. UI components

| Component | Purpose |
| --- | --- |
| `RateCalendar` | The main surface: 90 days as a calendar grid, each cell showing current rate, recommended rate, and forecast occupancy. Shaded by the size of the recommended move |
| `ForecastChart` | Expected occupancy over the horizon with the confidence interval, and actuals overlaid where dates have matured |
| `DateDetail` | One date: forecast by room type, casino hold, rationale, booking pace against the same point last year |
| `RationaleList` | The rules that produced the rate, in order — demand pressure, curve position, casino reserve |
| `OverrideDialog` | Set a rate manually; reason is **required**, free text plus a category |
| `CasinoDemandPanel` | Expected high-value arrivals and displacement value for the date |
| `AccuracyScorecard` | MAPE by lead time (1, 7, 30 days) against the same-period-last-year baseline |
| `OverrideReview` | Past overrides with what happened afterwards |

`OverrideReview` is what makes overrides worth capturing. A reason recorded and
never revisited is paperwork; a reason shown next to the outcome is how a revenue
manager learns whether their instinct beat the model, and how the model earns
trust when it did not.

---

## 7. User flows

**Flow A — daily rate review (revenue manager).**
1. `RateCalendar` for the next 90 days; large recommended moves stand out.
2. A Saturday three weeks out recommends $210 against a current $165.
3. `DateDetail`: forecast occupancy 94%, booking pace ahead of last year.
4. `CasinoDemandPanel` shows 40 expected high-value arrivals, 30 rooms held.
5. Accepts the rate.

**Flow B — overriding.**
1. Manager knows of a group booking not in the data.
2. `OverrideDialog`: $185, category "known group business", free text.
3. A `decision_log` row records recommendation, override, reason, actor, and the
   features the model saw.

**Flow C — accuracy review (monthly).**
1. `AccuracyScorecard`: MAPE by lead time against baseline.
2. Seven-day MAPE beats baseline; thirty-day does not.
3. `OverrideReview` shows overrides on event dates were usually right — which
   points at the missing event calendar (§10) rather than at the model.

Flow C is the flow that decides whether the pilot succeeded, which is why
accuracy is a first-class screen and not a report someone runs.

---

## 8. API sketch

`revenue-management.casino-ai-portal.svc.cluster.local`, reaching the UI as
`REVENUE_MANAGEMENT_API_URL`.

```
GET  /health
     → 200 {"status":"ok","model_version":"...",
            "last_forecast_date":"2026-08-06","horizon_days":90}

GET  /forecast?from=2026-08-07&to=2026-11-04&room_type=standard
     → 200 {"forecast_date":"2026-08-06","model_version":"mlflow:run:1d7e...",
            "results":[{"stay_date":"2026-08-29","room_type":"standard",
                        "expected_rooms":268.40,"interval_low":241.00,
                        "interval_high":289.10,"capacity":285}]}

GET  /rates?from=&to=
     → 200 {"results":[
         {"stay_date":"2026-08-29","room_type":"standard",
          "current_rate":165.00,"recommended_rate":210.00,
          "occupancy_forecast":0.94,"casino_hold_rooms":30,
          "rationale":[
            {"rule":"demand_pressure","detail":"forecast 94% vs 71% typical",
             "effect":"+30.00"},
            {"rule":"casino_reserve","detail":"40 expected high-value arrivals",
             "effect":"30 rooms held"},
            {"rule":"curve_position","detail":"elasticity band 3",
             "effect":"+15.00"}]}]}

GET  /dates/{stay_date}
     → 200 {"stay_date":"2026-08-29","by_room_type":[...],
            "booking_pace":{"on_books":184,"same_point_last_year":151},
            "casino_demand":{"expected_high_value":40,"expected_total":112,
                             "displacement_value":36200.00}}

POST /rates/{stay_date}/override
     {"room_type":"standard","override_rate":185.00,
      "reason_category":"known_group_business",
      "reason":"40-room block not yet in the system","actor":"rm.tokafor"}
     → 201 {"decision_id":91044,"stay_date":"2026-08-29",
            "recommended_rate":210.00,"override_rate":185.00}

GET  /overrides?from=&to=&with_outcome=true
     → 200 {"results":[{"stay_date":"2026-07-04","recommended_rate":240.00,
                        "override_rate":195.00,"reason_category":"event",
                        "actual_occupancy":0.99,
                        "outcome":"override_underpriced"}]}

GET  /accuracy?lead_days=7&from=&to=
     → 200 {"lead_days":7,"mape":0.081,"baseline_mape":0.114,
            "baseline":"same_period_last_year","n_dates":90,
            "beats_baseline":true}
```

`/accuracy` returns the baseline alongside the model in the same response. An
accuracy figure without its comparator is not interpretable, and separating them
into two calls invites reporting one without the other.

---

## 9. Guardrails and failure modes

| Failure | Detection | Behaviour |
| --- | --- | --- |
| Forecast job did not run | `last_forecast_date` staleness | Previous vintage served, labelled with its date; rates are not recomputed from stale demand |
| Casino demand aggregate missing | View returns no rows | Forecast still produced without the casino input, and the rationale states the input was absent — never silently treated as zero demand |
| Recommended rate outside floor/ceiling | Bounds check | Clamped, and the clamp appears in the rationale |
| Override without reason | Required field | Rejected at the API, not just in the UI |
| Model worse than baseline | Nightly accuracy job | Reported, not auto-rolled back. Promotion stays a human decision, as with the other models |
| Event not in the data | Override review pattern | Surfaced in `OverrideReview` as the missing-calendar signal it is |

The casino demand row is the one to watch. Treating a missing aggregate as zero
would produce a confident recommendation to sell every room for cash on exactly
the night the property most needs inventory.

---

## 10. Exit criteria

1. Rate recommendations are produced for a 90-day rolling horizon.
2. Forecast accuracy beats same-period-last-year, measured by MAPE at 7 and 30
   days of lead time.
3. Overrides are captured with a reason and reviewable against outcomes.

---

## 11. Open questions

- **Event calendar.** The largest known gap. Concerts, tournaments, and local
  events drive the spikes this model must catch, and without them the 30-day
  forecast will lose to a manager who knows what is on. Needed as a dated table
  with a category, not free text.
- **Displacement value.** §2 assumes a per-player displacement value derived from
  predicted theo. The rule converting predicted value into a room-night
  displacement figure has not been agreed.
- **Rate authority.** Whether accepted rates flow to the property management
  system or are transcribed. This determines whether `accepted` is an action here
  or a status mirrored from elsewhere.
- **Room type granularity.** Whether suites are forecast separately or pooled.
- **Owner.** Unassigned.
