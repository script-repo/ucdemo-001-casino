# Predictive LTV Scoring — Design

Assumes the shared platform, contracts, and principles in
[`docs/casino-uc-design.md`](../../docs/casino-uc-design.md).

---

## 1. Outcome

Player development sizes reinvestment on **predicted forward value** rather than
trailing actuals. Today a player is funded on what they were worth last year,
which overfunds a declining regular and underfunds someone on the way up.

| | Before | After |
| --- | --- | --- |
| Basis for reinvestment | Trailing 12-month actual theo | Predicted next-12-month theo plus non-gaming |
| Ranking granularity | Tier (four buckets) | Percentile (0–100) within property |
| Rising player | Recognised a year late | Recognised at the next scoring run |

**Primary user:** player development / host management.
**Decision changed:** how much to reinvest in an individual player.

---

## 2. Contracts

**Reads** (`cms_raw`, read-only): `patron`, `card_session`, `slot_play`,
`table_rating`, `trip`, `hotel_stay`, `fnb_transaction`.

**Writes** (`analytics.player_scores`): `ltv_12m_theo`, `ltv_percentile`,
`model_version`, `scored_at`. Upsert on `(player_id, score_date)` touching only
these columns — churn-risk owns the rest of the row.

**Private** (`uc_predictive_ltv`):

```sql
CREATE TABLE uc_predictive_ltv.feature_snapshot (
    player_id     BIGINT      NOT NULL,
    score_date    DATE        NOT NULL,
    features      JSONB       NOT NULL,
    PRIMARY KEY (player_id, score_date)
);

CREATE TABLE uc_predictive_ltv.calibration (
    model_version TEXT        NOT NULL,
    eval_date     DATE        NOT NULL,
    decile        SMALLINT    NOT NULL,   -- 1..10
    predicted_avg NUMERIC(12,2) NOT NULL,
    actual_avg    NUMERIC(12,2) NOT NULL,
    n_players     INTEGER     NOT NULL,
    PRIMARY KEY (model_version, eval_date, decile)
);
```

---

## 3. Method

Gradient-boosted regression on a forward-looking target.

**Target.** Sum of theoretical win and non-gaming spend over the 12 months
*following* the observation date.

**The labelling constraint is the hard part.** A 12-month forward label needs 12
months of future data, so with 24 months of history only observations from the
first 12 months can be labelled. That leaves one year of training rows, and no
held-out period that is both labelled and recent. Two consequences:

- Validation is a time-based split inside the labelled window, not a random
  split. A random split leaks future behaviour of the same player.
- Until real history accumulates, model quality is bounded by simulator realism
  rather than by algorithm choice. Tuning is not where the return is.

**Features.** Visit frequency and its trend, theo per visit, trip length, tier
history and migrations, non-gaming share of spend, recency, tenure, and
game-mix concentration.

**Calibration over ranking.** Reinvestment is computed directly from the
prediction, so a model that ranks perfectly but runs 20% high overspends every
tier. An isotonic regression is fitted on held-out predictions and stored with
the model version; the decile calibration table above is the acceptance
artefact.

**Refusal to score.** Players with fewer than three carded visits get `NULL`
LTV, not a prediction. A confident number over two visits is a guess wearing a
model's clothes, and hosts calibrate their trust on the worst score they see.

---

## 4. Infrastructure

| Object | Kind | Schedule | Notes |
| --- | --- | --- | --- |
| `ltv-train` | `Job` | Weekly, manual re-run allowed | Logs run to MLflow, registers model version |
| `ltv-score` | `CronJob` | Nightly 02:00 | Full rescore of all carded players |
| `predictive-ltv-scoring` | `Deployment` | — | FastAPI read API, 2 replicas |

Scoring runs **first** in the nightly sequence; churn-risk consumes
`ltv_percentile` for queue ordering and runs after.

Resource shape: training peaks at ~4 CPU / 8 GiB for a 50k-player, 24-month
dataset — small enough to be a single pod with no distributed training. The API
is read-only over precomputed rows and needs 200m CPU / 512 MiB.

No responsible gaming gate: this use case produces no player-facing output. Its
consumers apply the gate.

---

## 5. UI components

Rendered inside the portal at `/use-cases/predictive-ltv-scoring`. No imports
from the portal shell.

| Component | Purpose |
| --- | --- |
| `ScoreFreshnessBanner` | `scored_at`, model version, and a warning when the last run is older than 36 hours |
| `CohortTable` | Ranked players: percentile, predicted value, tier, last visit, trend arrow. Sortable, filterable by tier and percentile band |
| `PlayerScoreDetail` | One player: predicted value with interval, percentile, and the driver contributions behind it |
| `DriverBars` | Signed feature contributions, largest first, in plain language ("visits up 40% over six months") |
| `CalibrationPanel` | Predicted versus actual by decile with the ±15% acceptance band drawn |
| `CohortExport` | CSV of the current filtered cohort for downstream campaign tooling |

`DriverBars` is not optional polish. A host who cannot explain the number will
not use it, and exit criterion three depends on it.

---

## 6. User flows

**Flow A — reinvestment review (weekly, PD manager).**
1. Opens the use case; `ScoreFreshnessBanner` confirms last night's run.
2. Filters `CohortTable` to percentile ≥ 90.
3. Sorts by trend to find players rising fastest.
4. Exports the cohort for the reinvestment cycle.

**Flow B — pre-call lookup (daily, host).**
1. Searches a player by id.
2. `PlayerScoreDetail` shows predicted value and percentile.
3. `DriverBars` gives the two or three reasons behind it.
4. Host makes the call with a defensible number.

**Flow C — accepting a model refresh (per release, analyst).**
1. `CalibrationPanel` for the candidate version.
2. Checks every decile sits inside ±15%.
3. If it does, promotes the version in MLflow; if not, the previous version
   stays live and scoring is unaffected.

Flow C is why model version is surfaced everywhere: promotion is a human
decision, and the interface has to make the previous state recoverable.

---

## 7. API sketch

FastAPI, `predictive-ltv-scoring.casino-ai-portal.svc.cluster.local`, port 80 →
container 8000. Base URL reaches the UI as `PREDICTIVE_LTV_SCORING_API_URL`.

```
GET  /health
     → 200 {"status":"ok","model_version":"...","last_scored_at":"..."}

GET  /scores
     ?percentile_min=90&percentile_max=100&tier=gold&limit=100&cursor=<opaque>
     → 200 {
         "as_of": "2026-08-06",
         "model_version": "mlflow:run:8f2c...",
         "count": 100,
         "next_cursor": "...",
         "results": [
           {"player_id": 100234, "ltv_12m_theo": 4820.00,
            "ltv_percentile": 97, "tier": "gold",
            "last_visit": "2026-08-02", "trend": "rising"}
         ]
       }

GET  /players/{player_id}/score
     → 200 {"player_id":100234,"ltv_12m_theo":4820.00,"ltv_percentile":97,
            "interval_low":3910.00,"interval_high":5760.00,
            "model_version":"...","scored_at":"..."}
     → 404 when the player has no score
     → 409 {"reason":"insufficient_history","visits":2} when refused (§3)

GET  /players/{player_id}/drivers
     → 200 {"drivers":[
             {"feature":"visit_frequency_6m","contribution":  612.40,
              "text":"Visits up 40% over six months"},
             {"feature":"theo_per_visit_trend","contribution": -180.10,
              "text":"Average theo per visit easing"}]}

GET  /model/calibration?model_version=&eval_date=
     → 200 {"deciles":[{"decile":1,"predicted_avg":41.20,
                        "actual_avg":38.90,"n_players":5000}]}

GET  /model/current
     → 200 {"model_version":"...","registered_at":"...","training_rows":48211}

POST /scores/refresh          # operator-triggered rescore
     → 202 {"job":"ltv-score-manual-20260806"}
```

Responses carry `player_id` and tier only. Name, contact details, and anything
else identifying stay in the CMS; this API is a scoring service, not a player
directory.

---

## 8. Guardrails and failure modes

| Failure | Detection | Behaviour |
| --- | --- | --- |
| Nightly scoring did not run | `last_scored_at` older than 36h | Banner warns; API still serves stale rows, labelled |
| Calibration drifts outside ±15% | Nightly calibration job | Alarm; model is **not** auto-rolled back — promotion is a human decision |
| Simulator regenerated underneath | Row count moves by more than 10% | Scoring aborts rather than writing a full rescore on changed ground truth |
| Player below history threshold | Visit count at feature build | `NULL` score, `409` from the API |
| Churn job runs before LTV | Sequence check | Churn job waits; it needs `ltv_percentile` for ordering |

---

## 9. Exit criteria

1. Scores for all carded players refresh nightly.
2. Calibration holds within 15% by decile on a held-out period.
3. Hosts can see the drivers behind any individual score.

---

## 10. Open questions

- **Reinvestment mapping.** The model outputs predicted value; it does not say
  what percentage of it to give back. Until the reinvestment rule exists, the
  offer engine cannot state expected reinvestment against a cap.
- **Percentile scope.** Property-wide today. If tier-relative percentiles are
  wanted, that is a second column, not a redefinition of the existing one.
- **Owner.** Unassigned. Exit criterion three names hosts as the acceptors.
