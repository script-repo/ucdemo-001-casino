# Churn-Risk Modeling — Design

Assumes the shared platform, contracts, and principles in
[`docs/casino-uc-design.md`](../../docs/casino-uc-design.md).

---

## 1. Outcome

Hosts reach players while they are still reachable. A player who has already
stopped coming is a reactivation problem; a player whose cadence is decaying is
still a retention problem, and far cheaper to solve.

| | Before | After |
| --- | --- | --- |
| Churn definition | Fixed window — 90 days since last visit | Relative to each player's own cadence |
| Weekly player, absent 3 weeks | Invisible | Flagged high risk |
| Quarterly player, absent 3 weeks | Invisible | Correctly ignored |
| Host queue | Sorted by recency | Sorted by risk weighted by value |

**Primary user:** casino host.
**Decision changed:** who to contact today, before they lapse.

---

## 2. Contracts

**Reads:** `cms_raw.patron`, `card_session`, `trip`, `slot_play`,
`table_rating`; `analytics.player_scores.ltv_percentile` for queue ordering;
`analytics.eligible_players` — see §3.

**Writes:** `analytics.player_scores` → `churn_risk`, `churn_band`,
`expected_days_to_visit`, `model_version`, `scored_at`. Upsert touching only
these columns. Runs **after** the LTV job.

Also writes `analytics.decision_log` when outreach is recorded (§7).

**Private** (`uc_churn_risk`):

```sql
CREATE TABLE uc_churn_risk.cadence_baseline (
    player_id        BIGINT      NOT NULL,
    as_of            DATE        NOT NULL,
    median_gap_days  NUMERIC(6,2) NOT NULL,
    iqr_gap_days     NUMERIC(6,2) NOT NULL,
    visits_observed  SMALLINT    NOT NULL,
    baseline_kind    TEXT        NOT NULL,  -- cadence | backstop
    PRIMARY KEY (player_id, as_of)
);

CREATE TABLE uc_churn_risk.band_threshold (
    band        TEXT          PRIMARY KEY,   -- low | medium | high
    min_risk    NUMERIC(4,3)  NOT NULL,
    updated_by  TEXT          NOT NULL,
    updated_at  TIMESTAMPTZ   NOT NULL
);
```

The baseline is a stored table, not a computed-on-read expression, because exit
criterion two requires it to be inspectable — a host has to see the same numbers
the model saw.

---

## 3. A deviation from the agreed scope, and why

`docs/casino-scope.md` applies the responsible gaming gate to use cases 3 and 4
only, on the basis that this use case produces a score rather than a player-facing
offer.

**This design applies the gate here as well.** The risk queue exists to make a
host pick up the phone. That is a player contact, and a self-excluded player
appearing in a host's morning queue is the exact harm principle 2 is written to
prevent — the fact that the contact is a call rather than a mailer does not
change it.

Concretely, the queue endpoint inner-joins `analytics.eligible_players`. Scoring
is unaffected: every player is still scored, and `player_scores` stays complete
for downstream consumers. Only the *queue* is filtered.

This is worth confirming rather than assuming. If the property intends hosts to
maintain relationships with self-excluded players under a different policy, the
join comes out — but that should be a decision, not an omission.

---

## 4. Method

**Cadence baseline.** For each player, the median and interquartile range of
inter-visit gaps over a trailing 12-month window. Requires at least four visits;
below that the baseline is marked `backstop` and a fixed 90-day rule applies.

**Risk signal.** The primary feature is elapsed days since last visit expressed
in units of that player's own gap distribution — roughly a per-player z-score.
A weekly player at 21 days is far out on their own distribution; a quarterly
player at 21 days is well inside it.

**Model.** Gradient-boosted classifier over the cadence z-score plus trend in
theo per visit, trend in trip length, tier movement, share of play in a declining
game type, tenure, and seasonality-adjusted expectation. Output is a probability;
`expected_days_to_visit` comes from the survival curve's median.

**Why not survival modelling end to end.** A proportional-hazards model is the
textbook fit and gives cleaner time-to-event estimates, but the exit criterion is
precision at the top decile of a ranked queue, and per-player features are
sharper there. Revisit if `expected_days_to_visit` becomes the primary output.

**Bands** are thresholds on the probability, stored in `band_threshold` and
tuned to produce a queue a host can actually work — roughly the top 5% as
`high`. Band tuning is an operational lever, not a model change, which is why it
is a table and not a constant.

---

## 5. Infrastructure

| Object | Kind | Schedule | Notes |
| --- | --- | --- | --- |
| `churn-train` | `Job` | Weekly | MLflow run and model registration |
| `churn-baseline` | `CronJob` | Nightly 02:20 | Rebuilds `cadence_baseline` |
| `churn-score` | `CronJob` | Nightly 02:40 | After LTV; writes churn columns |
| `churn-risk-modeling` | `Deployment` | — | FastAPI, 2 replicas |

Same shape and scale as LTV: a single pod trains comfortably at this volume.
Baseline rebuild is the heaviest step and is still a single pass over visits.

---

## 6. UI components

| Component | Purpose |
| --- | --- |
| `ScoreFreshnessBanner` | `scored_at`, model version, staleness warning |
| `RiskQueue` | The working surface: player, risk band, LTV percentile, days since visit, expected gap, last contact. Ordered by risk × value |
| `CadenceTimeline` | Visit history as a strip, with the player's expected next-visit band shaded and the current gap drawn against it |
| `WhyFlagged` | Cadence statistics in words plus signed feature contributions |
| `OutreachAction` | Record contacted / not reachable / do not contact, with a reason |
| `BandThresholdEditor` | Operator-only; adjusts band cut-offs and shows resulting queue sizes before saving |

`CadenceTimeline` is the component that makes the whole use case credible. "This
player normally comes every 8 days and it has been 26" is an argument a host can
act on; "risk 0.82" is not.

---

## 7. User flows

**Flow A — morning queue (daily, host).**
1. Opens the use case; `RiskQueue` is pre-filtered to `high`, ordered by value.
2. Picks the top player; `CadenceTimeline` shows an 8-day rhythm and a 26-day gap.
3. `WhyFlagged` adds that theo per visit has been easing for two months.
4. Host calls, then records the outcome in `OutreachAction`.
5. A `decision_log` row is written: subject the player, recommendation "contact",
   features as seen, model version, RG result, and the host's outcome.

**Flow B — challenging a flag (ad hoc, host).**
1. A regular appears whom the host believes is fine.
2. `CadenceTimeline` shows the gap is genuinely outside the player's own pattern.
3. Host records "not reachable" or "do not contact" with a reason — which is the
   labelled feedback the next training round needs.

**Flow C — queue sizing (monthly, operator).**
1. Queue is too large to work.
2. `BandThresholdEditor` previews sizes at candidate cut-offs.
3. Threshold saved with attribution; no retraining involved.

---

## 8. API sketch

`churn-risk-modeling.casino-ai-portal.svc.cluster.local`, reaching the UI as
`CHURN_RISK_MODELING_API_URL`.

```
GET  /health
     → 200 {"status":"ok","model_version":"...","last_scored_at":"..."}

GET  /risk-queue
     ?band=high&min_percentile=50&assigned_to=&limit=50&cursor=
     → 200 {
         "as_of": "2026-08-06",
         "model_version": "mlflow:run:3ab9...",
         "rg_filtered": true,           # eligible_players join applied (§3)
         "results": [
           {"player_id": 100234, "churn_risk": 0.82, "churn_band": "high",
            "ltv_percentile": 91, "days_since_visit": 26,
            "expected_gap_days": 8.0, "baseline_kind": "cadence",
            "last_contact": "2026-06-14"}
         ]
       }

GET  /players/{player_id}/cadence
     → 200 {"median_gap_days":8.0,"iqr_gap_days":3.5,"visits_observed":48,
            "baseline_kind":"cadence",
            "visits":["2026-07-11","2026-07-19","2026-07-27"],
            "expected_next":"2026-08-04","current_gap_days":26}

GET  /players/{player_id}/explanation
     → 200 {"summary_kind":"template",     # or "model" — see §5 of the portfolio doc
            "summary":"Visits every 8 days on average; 26 days since the last.",
            "drivers":[{"feature":"cadence_z","contribution":0.41,
                        "text":"Gap is 3.2x the usual interval"}]}

POST /players/{player_id}/outreach
     {"outcome":"contacted","reason":"left voicemail","actor":"host.jlee"}
     → 201 {"decision_id": 88213}

GET  /bands
     → 200 {"bands":[{"band":"high","min_risk":0.70,"queue_size":2411}]}

PUT  /bands
     {"bands":[{"band":"high","min_risk":0.75}],"actor":"ops.mchan"}
     → 200 {"bands":[...],"queue_size_preview":1832}
```

`rg_filtered` is returned explicitly so the interface can state that the queue is
gated rather than leaving it implied.

---

## 9. Guardrails and failure modes

| Failure | Detection | Behaviour |
| --- | --- | --- |
| LTV job has not run | `ltv_percentile` null for the date | Queue still renders, ordered by risk alone, with a notice |
| Player has too little history | `visits_observed < 4` | `baseline_kind = backstop`, fixed 90-day rule, labelled in the UI |
| Simulator produces no cadence decay | Model AUC near baseline | Pilot fails honestly rather than shipping a model fitted to noise |
| Band change empties the queue | Preview before save | Save is blocked on a queue of zero |
| Self-excluded player in queue | Inner join on `eligible_players` | Structurally impossible; asserted in tests |

---

## 10. Exit criteria

1. Beats a fixed-90-day-window baseline on precision at the top risk decile.
2. The per-player cadence baseline is inspectable — a host can see why a regular
   was flagged.

Both are measured on the simulated data, so both are only as meaningful as the
simulator's cadence decay. That dependency is stated in the portfolio doc as the
critical path for a reason.

---

## 11. Open questions

- **The RG gate deviation in §3** needs confirming or rejecting.
- **Outreach outcomes as labels.** Host feedback is the only real signal about
  whether a flag was right. Whether it feeds the next training round, and how to
  avoid the loop where contacted players look retained *because* they were
  contacted, is unresolved.
- **Assignment.** Whether the queue is assigned per host or worked from a shared
  pool changes `RiskQueue` materially.
- **Owner.** Unassigned.
