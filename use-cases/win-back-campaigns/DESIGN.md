# Win-Back Campaigns — Design

Assumes the shared platform, contracts, and principles in
[`docs/casino-uc-design.md`](../../docs/casino-uc-design.md).

Where the offer engine reacts to a single player in a moment, this use case
assembles a reviewed cohort and works in batch.

---

## 1. Outcome

Lapsed players are targeted for reactivation on **predicted value and predicted
recoverability**, with an offer sized to the player and an audit trail on every
candidate.

| | Before | After |
| --- | --- | --- |
| Candidate selection | Everyone past a fixed absence window | Crossed their own churn threshold, ranked by value |
| Offer sizing | One offer for the whole list | Ladder by LTV percentile |
| Review | Spot-check of a list | Every candidate reviewable and individually removable |
| Audit | Campaign-level record | Per-candidate record with model version and reviewer |

**Primary user:** marketing manager.
**Decision changed:** who to target for reactivation, and with what.

---

## 2. Contracts

**Reads:** `analytics.player_scores` (`churn_risk`, `churn_band`,
`ltv_percentile`, `expected_days_to_visit`), `analytics.eligible_players`,
`cms_raw.comp_offer` for prior offer history, `cms_raw.trip` for last visit.

**Writes:** `analytics.decision_log`, one row per **candidate** — not per
campaign. A campaign-level row would satisfy nobody at audit; the reviewable unit
is the player.

**Private** (`uc_win_back`):

```sql
CREATE TABLE uc_win_back.campaign (
    campaign_id     BIGSERIAL     PRIMARY KEY,
    name            TEXT          NOT NULL,
    churn_min       NUMERIC(4,3)  NOT NULL,   -- inclusion threshold
    percentile_min  SMALLINT      NOT NULL,
    max_candidates  INTEGER       NOT NULL,
    send_window     DATERANGE     NOT NULL,
    status          TEXT          NOT NULL,   -- draft | in_review | approved | released | cancelled
    created_by      TEXT          NOT NULL,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    approved_by     TEXT,
    approved_at     TIMESTAMPTZ
);

CREATE TABLE uc_win_back.offer_ladder (
    campaign_id     BIGINT        NOT NULL REFERENCES uc_win_back.campaign,
    percentile_min  SMALLINT      NOT NULL,
    percentile_max  SMALLINT      NOT NULL,
    offer_id        TEXT          NOT NULL,
    expected_cost   NUMERIC(10,2) NOT NULL,
    PRIMARY KEY (campaign_id, percentile_min)
);

CREATE TABLE uc_win_back.campaign_candidate (
    campaign_id     BIGINT        NOT NULL REFERENCES uc_win_back.campaign,
    player_id       BIGINT        NOT NULL,
    churn_risk      NUMERIC(4,3)  NOT NULL,
    ltv_percentile  SMALLINT      NOT NULL,
    offer_id        TEXT          NOT NULL,
    state           TEXT          NOT NULL,  -- included | removed | offer_changed
    state_reason    TEXT,
    decision_id     BIGINT        NOT NULL,  -- analytics.decision_log
    PRIMARY KEY (campaign_id, player_id)
);
```

Candidate rows are a **frozen snapshot** taken at build time. Scores move
nightly; a campaign reviewed on Monday and released on Wednesday must release the
list that was reviewed, not a list that quietly changed underneath the reviewer.

---

## 3. Candidate selection

Three filters and a rank, in this order:

1. **Eligibility.** Inner join `analytics.eligible_players`. First, so nothing
   downstream can reintroduce a suppressed player.
2. **Lapse.** `churn_risk >= campaign.churn_min`, which is cadence-relative by
   construction — a quarterly player two months out is not swept in with a weekly
   player two months out.
3. **Value floor.** `ltv_percentile >= campaign.percentile_min`. Reactivation has
   a cost floor; below some predicted value the offer cannot pay back.
4. **Rank and cap.** Order by predicted value, take `max_candidates`.

Offer assignment is a lookup into `offer_ladder` by percentile. The ladder is
per-campaign rather than global so a manager can run a conservative and an
aggressive campaign in the same period without editing shared configuration.

**Recency guard.** Players with an outstanding offer in `cms_raw.comp_offer`
inside the send window are excluded. Stacking win-back on an existing offer wastes
the reinvestment and reads as a scattergun to the player.

---

## 4. Infrastructure

| Object | Kind | Notes |
| --- | --- | --- |
| `win-back-campaigns` | `Deployment`, 2 replicas | FastAPI: campaigns, candidates, review |
| `winback-build` | Invoked on demand | Candidate build; seconds at this scale, run inline in a background task rather than as a `Job` |
| `winback-narrative` | Worker in the same Deployment | Campaign copy via the narrative adapter |
| `uc_win_back` schema | Postgres | Campaigns, ladders, candidates |

No model of its own. Selection consumes the churn and LTV models, which is the
point of the score contract — the same reason this use case could be built
against the seeded stub before either producer was finished.

The narrative adapter here writes campaign-level copy suggestions, not
per-player text. Two independent reasons point the same way. Per-player messages
would be unreviewable, which conflicts directly with per-candidate review — 2,180
generated messages cannot be read. And the gateway is capped at 50 requests per
day on `:free` variants (portfolio doc §5.3), so per-player generation is not
merely unwise but impossible.

A three-band ladder needs three requests. Copy is generated per band and reviewed
once, which is what a marketing manager would want regardless of quota.

Retrieval has a genuine place here: grounding that copy in the comp matrix and
the responsible gaming policy, so a generated offer description does not promise
something the property does not offer. Chunks live in `uc_win_back.doc_chunk`,
retrieved and reranked per the portfolio pattern.

---

## 5. UI components

| Component | Purpose |
| --- | --- |
| `CampaignList` | All campaigns with status, size, committed cost, send window |
| `CampaignBuilder` | Churn threshold, value floor, cap, send window, with a **live candidate count** as the inputs move |
| `OfferLadderEditor` | Percentile bands to offers, with expected cost per band and a running total |
| `CandidateTable` | Every candidate: player, churn risk, LTV percentile, last visit, assigned offer, state. Removable and editable per row |
| `CandidateDetail` | Why included — the same cadence and driver view the churn use case shows |
| `CopyPanel` | Generated campaign copy per band, labelled `model` or `template`, editable |
| `SuppressionNotice` | Count filtered by the gate; no identities |
| `ApprovalBar` | Approve or cancel, with a summary of size, cost, and outstanding unreviewed rows |

The live count in `CampaignBuilder` is what makes the tool usable. Threshold
setting is otherwise blind guessing followed by a rebuild.

---

## 6. User flows

**Flow A — building a campaign (weekly, marketing manager).**
1. `CampaignBuilder`: churn ≥ 0.60, percentile ≥ 40, cap 2,500, September window.
2. Live count settles at 2,180.
3. `OfferLadderEditor`: three bands, total expected cost $61,400.
4. Build. Candidates are frozen; a `decision_log` row is written per candidate
   with `review_outcome = 'pending'`.

**Flow B — reviewing candidates.**
1. `CandidateTable` sorted by value.
2. Manager spots a player recently handled by a host; `CandidateDetail` confirms
   it; removes the row with a reason. The log row becomes `rejected`.
3. Another candidate is moved to a lower offer band; logged as `edited`.
4. `ApprovalBar` shows 2,178 included, $61,150 expected cost.

**Flow C — approval and release.**
1. Approve. Campaign moves to `approved`, all remaining pending rows become
   `approved` with reviewer and timestamp.
2. Release is a **separate** action and is where the handoff to the sending
   system happens — undefined today (§9), so release currently produces an
   export and marks the campaign `released`.

Approval and release are deliberately distinct. Approval is the recommend-only
boundary; release is the act of contacting people. Collapsing them would make
approval irreversible in a way review has no chance to catch.

---

## 7. API sketch

`win-back-campaigns.casino-ai-portal.svc.cluster.local`, reaching the UI as
`WIN_BACK_CAMPAIGNS_API_URL`.

```
GET  /health
     → 200 {"status":"ok","narrative_mode":"template",
            "scores_as_of":"2026-08-06"}

POST /campaigns/preview                      # live count for the builder
     {"churn_min":0.60,"percentile_min":40,"max_candidates":2500,
      "send_window":["2026-09-01","2026-09-30"]}
     → 200 {"candidate_count":2180,"suppressed_count":47,
            "recency_excluded":312,
            "value_distribution":[{"percentile_band":"40-59","count":940}]}

POST /campaigns
     {"name":"September Win-Back","churn_min":0.60,"percentile_min":40,
      "max_candidates":2500,"send_window":["2026-09-01","2026-09-30"],
      "ladder":[{"percentile_min":40,"percentile_max":59,"offer_id":"FP25"},
                {"percentile_min":60,"percentile_max":84,"offer_id":"FP50"},
                {"percentile_min":85,"percentile_max":100,"offer_id":"FP100"}],
      "actor":"mkt.rsingh"}
     → 201 {"campaign_id":41,"status":"draft","candidate_count":2180,
            "expected_cost":61400.00,"scores_as_of":"2026-08-06"}

GET  /campaigns?status=in_review
     → 200 {"results":[{"campaign_id":41,"name":"September Win-Back",
                        "status":"in_review","candidate_count":2180,
                        "expected_cost":61400.00,"unreviewed":2180}]}

GET  /campaigns/{campaign_id}/candidates?state=included&limit=100&cursor=
     → 200 {"results":[
         {"player_id":100234,"churn_risk":0.74,"ltv_percentile":88,
          "last_visit":"2026-05-02","offer_id":"FP50",
          "state":"included","decision_id":90114}]}

PATCH /campaigns/{campaign_id}/candidates/{player_id}
     {"state":"removed","reason":"host contacted last week","actor":"mkt.rsingh"}
     {"state":"offer_changed","offer_id":"FP25","reason":"...","actor":"..."}
     → 200 {"player_id":100234,"state":"removed","decision_id":90114}

GET  /campaigns/{campaign_id}/copy
     → 200 {"bands":[{"percentile_min":85,"kind":"template",
                      "text":"We have missed you at the tables..."}]}

POST /campaigns/{campaign_id}/approve
     {"actor":"mkt.rsingh"}
     → 200 {"campaign_id":41,"status":"approved","approved_count":2178}
     → 409 {"reason":"scores_changed_since_build",
            "built_with":"2026-08-04","current":"2026-08-06"}

POST /campaigns/{campaign_id}/release
     → 200 {"campaign_id":41,"status":"released","export_rows":2178}
```

The `409` on approve is a real guard, not a formality. A campaign built from
scores several days old is approving a list that may no longer describe the
players in it; the reviewer is told, and rebuilds.

---

## 8. Guardrails and failure modes

| Failure | Detection | Behaviour |
| --- | --- | --- |
| Scores absent for the build date | Freshness check | Build refused with the last available date, rather than building on a partial night |
| Scores moved between build and approve | Compare `scores_as_of` | `409`; reviewer rebuilds |
| Suppressed player | Inner join at build (§3, step 1) | Cannot enter the candidate set; asserted in tests |
| Player has an outstanding offer | Recency guard | Excluded, counted in the preview |
| Campaign approved with unreviewed rows | Count in `ApprovalBar` | Allowed but explicit — bulk approval is legitimate at 2,000 rows; hiding it is not |
| Narrative unavailable | Adapter probe | Template copy, labelled |
| Release without approval | Status check | `409`; release requires `approved` |

---

## 9. Exit criteria

1. Campaigns are reproducible: same inputs and same score date give the same
   candidate list.
2. Every candidate has an audit trail — model version, features at selection,
   RG result, reviewer, outcome.

Reproducibility is why candidates are frozen at build and why `scores_as_of` is
carried on every response.

---

## 10. Open questions

- **Release handoff.** Whether the portal exports, calls a campaign system, or is
  itself the system of record. Everything up to `approved` is unaffected either
  way, which is why release is a separate action.
- **Measurement.** Reactivation attribution needs a holdout group; whether a
  control arm is acceptable in the pilot is not settled. Without one, "did it
  work" cannot be answered.
- **Copy approval.** Whether generated campaign copy needs marketing sign-off
  separate from candidate approval.
- **Owner.** Unassigned.
