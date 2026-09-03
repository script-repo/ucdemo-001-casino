# Dynamic Offer Engine — Design

Assumes the shared platform, contracts, and principles in
[`docs/casino-uc-design.md`](../../docs/casino-uc-design.md).

This is the only use case with a hard latency requirement and the only one that
reacts to events rather than running nightly.

---

## 1. Outcome

A relevant offer is proposed **while the player is still on property**, sized to
their value and their current risk of lapsing, and a human approves it before it
reaches them.

| | Before | After |
| --- | --- | --- |
| Offer timing | Next campaign cycle, days later | Within two minutes of a trigger event |
| Offer basis | Tier and a manual rule | LTV percentile, churn band, and visit context |
| Suppression check | At send | Before the proposal is ever displayed |
| Reinvestment visibility | Reconciled afterwards | Stated on the proposal |

**Primary user:** marketing operations, and hosts approving on the floor.
**Decision changed:** which offer to propose during a visit.

---

## 2. Contracts

**Reads:** `analytics.player_scores` (`ltv_percentile`, `churn_band`),
`analytics.eligible_players`, `cms_raw.comp_offer` for redemption history,
`cms_raw.trip` for visit context.

**Writes:** `analytics.decision_log`, one row per proposal at creation with
`review_outcome = 'pending'`, updated on review.

**Private** (`uc_offer_engine`):

```sql
CREATE TABLE uc_offer_engine.offer_catalogue (
    offer_id        TEXT          PRIMARY KEY,
    name            TEXT          NOT NULL,
    kind            TEXT          NOT NULL,  -- freeplay | food | hotel | event
    face_value      NUMERIC(10,2) NOT NULL,
    expected_cost   NUMERIC(10,2) NOT NULL,  -- face value x historical redemption
    min_percentile  SMALLINT      NOT NULL,
    max_percentile  SMALLINT      NOT NULL,
    active          BOOLEAN       NOT NULL DEFAULT true
);

CREATE TABLE uc_offer_engine.trigger_event (
    event_id      BIGSERIAL     PRIMARY KEY,
    player_id     BIGINT        NOT NULL,
    event_type    TEXT          NOT NULL,
    occurred_at   TIMESTAMPTZ   NOT NULL,
    received_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
    payload       JSONB         NOT NULL,
    proposal_id   BIGINT                    -- decision_log.decision_id, null if none
);

CREATE TABLE uc_offer_engine.budget_period (
    period_start   DATE          NOT NULL,
    period_end     DATE          NOT NULL,
    cap_amount     NUMERIC(12,2) NOT NULL,
    committed      NUMERIC(12,2) NOT NULL DEFAULT 0,
    PRIMARY KEY (period_start)
);
```

`expected_cost` rather than face value is what the proposal reports, because a
$50 freeplay offer redeemed 60% of the time costs $30. Reporting face value
would overstate committed spend by the redemption gap on every proposal.

---

## 3. Trigger events

The scope leaves trigger definition open. Rather than block, this design fixes
the **envelope** and leaves the catalogue of event types to be filled in.

```json
{
  "player_id": 100234,
  "event_type": "card_in",
  "occurred_at": "2026-08-06T18:41:02Z",
  "payload": { "device_id": "SLOT-0412", "zone": "high-limit" }
}
```

Candidate types, to be confirmed: `card_in` (session start), `coin_in_milestone`
(cumulative wager crosses a threshold), `trip_start` (arrival), `session_end`,
`loss_threshold`. `loss_threshold` needs particular care — an offer triggered by
a losing streak is precisely the pattern responsible gaming review will object
to, and it is listed here to be explicitly decided rather than quietly built.

In simulation the producer is a job replaying `card_session` records in
accelerated time against `POST /events`. Nothing in the engine knows it is a
simulation, so swapping in a real CMS feed is a producer change only.

---

## 4. Latency budget

Two minutes, event to proposal on screen.

| Step | Budget | Notes |
| --- | --- | --- |
| Event ingest and persist | < 100 ms | Single insert |
| Score lookup | < 50 ms | Precomputed row, primary key hit |
| Eligibility join | < 50 ms | Part of the same query |
| Offer selection | < 100 ms | Catalogue filter plus ranking |
| Budget check | < 50 ms | Single row |
| Proposal written and visible | < 500 ms total | Template rationale attached |
| Model rationale | asynchronous | Upgrades the proposal if it arrives |

The engine hits the requirement with two orders of magnitude to spare because
scoring is precomputed. **The only thing that can blow the budget is generating
prose inline**, so it is deliberately off the critical path: the proposal is
written and displayed with template text immediately, and model-generated text
replaces it in place if and when it returns.

Keeping it asynchronous matters more than the latency arithmetic suggests. A
chat call to the gateway measured about 4 seconds, which would fit inside two
minutes — but the account is capped at 50 requests per day on `:free` variants
(portfolio doc §5.3). On a busy floor the engine will exhaust that in the first
hour, and a proposal queue that stops producing proposals when a quota runs out
is an outage. Template text is therefore the **default** path, and model
rationale is an upgrade applied when quota allows.

That inverts the usual arrangement, and it is the right way round here: the
proposal is the product, and the sentence explaining it is a courtesy.

---

## 5. Infrastructure

| Object | Kind | Notes |
| --- | --- | --- |
| `dynamic-offer-engine` | `Deployment`, 2 replicas | FastAPI: ingest, selection, review |
| `offer-narrative` | Worker in the same Deployment | Async rationale upgrade; no-op without egress |
| `offer-event-replay` | `Job` | Simulation only; replays sessions as events |
| `uc_offer_engine` schema | Postgres | Catalogue, events, budget |

No model is trained here at pilot. Selection is a ranked rules pass over the
catalogue using score inputs — the intelligence is in the scores, which are
someone else's model. A learned propensity model is a fast follow once there is
approval feedback to learn from, and `decision_log` is already capturing it.

---

## 6. UI components

| Component | Purpose |
| --- | --- |
| `ProposalQueue` | Live list of pending proposals, newest first, auto-refreshing |
| `ProposalCard` | Player value context, proposed offer, rationale, expected reinvestment, RG status, age since trigger |
| `RationaleBlock` | The explanation, labelled `model` or `template` |
| `ReviewActions` | Approve, edit, reject, skip — the portfolio-standard four |
| `EditOfferDialog` | Swap the offer within the player's eligible band; records the change as an edit, not a new proposal |
| `BudgetMeter` | Committed against cap for the period, with the current proposal's contribution highlighted |
| `SuppressionNotice` | States that the queue is gated and how many candidates were filtered — a count, never a list |

`SuppressionNotice` shows a number and no identities. Telling a marketer that
eleven players were filtered is operationally useful; naming them would defeat
the gate.

---

## 7. User flows

**Flow A — approving a proposal (continuous, marketing ops).**
1. `ProposalQueue` shows a proposal 40 seconds old.
2. `ProposalCard`: 94th percentile, churn band medium, $50 freeplay, expected
   cost $30, rationale explaining the pairing.
3. `BudgetMeter` shows the period is 62% committed.
4. Approve. `decision_log` is updated with reviewer, outcome, and timestamp.

**Flow B — editing before approval.**
1. Reviewer judges the offer too generous.
2. `EditOfferDialog` offers alternatives within the player's band.
3. Selects a $25 offer; outcome is recorded as `edited` with both the original
   and final recommendation in the log — the edit is the training signal.

**Flow C — budget exhaustion.**
1. Cap is reached mid-period.
2. New proposals are still generated and logged, but marked `over_budget` and
   sorted below.
3. Approval requires an explicit override with a reason.

Proposals are not suppressed at the cap. Knowing what was recommended and
declined for budget is what the next budget conversation needs.

---

## 8. API sketch

`dynamic-offer-engine.casino-ai-portal.svc.cluster.local`, reaching the UI as
`DYNAMIC_OFFER_ENGINE_API_URL`.

```
GET  /health
     → 200 {"status":"ok","narrative_mode":"template","queue_depth":12}

POST /events                                  # trigger ingest
     {"player_id":100234,"event_type":"card_in",
      "occurred_at":"2026-08-06T18:41:02Z",
      "payload":{"device_id":"SLOT-0412"}}
     → 202 {"event_id":99120,"proposal_id":88231}
     → 202 {"event_id":99121,"proposal_id":null,
            "reason":"not_eligible"}          # RG gate, no detail returned
     → 202 {"event_id":99122,"proposal_id":null,"reason":"no_offer_in_band"}

GET  /proposals?status=pending&limit=50
     → 200 {"results":[
         {"proposal_id":88231,"player_id":100234,
          "ltv_percentile":94,"churn_band":"medium",
          "offer":{"offer_id":"FP50","name":"$50 Free Play",
                   "face_value":50.00,"expected_cost":30.00},
          "rationale":{"kind":"template",
                       "text":"High-value player, cadence easing."},
          "rg_gate_result":"pass","over_budget":false,
          "triggered_at":"2026-08-06T18:41:02Z","age_seconds":41}]}

GET  /proposals/{proposal_id}
     → 200 {... plus "features": {...} as logged at decision time}

POST /proposals/{proposal_id}/decision
     {"outcome":"approved","actor":"ops.mchan"}
     {"outcome":"edited","offer_id":"FP25","actor":"ops.mchan",
      "reason":"value band too generous for second visit"}
     {"outcome":"rejected","actor":"ops.mchan","reason":"recent offer outstanding"}
     → 200 {"proposal_id":88231,"review_outcome":"approved",
            "reviewed_at":"..."}
     → 409 {"reason":"already_reviewed","review_outcome":"approved"}

GET  /budget?period=2026-08
     → 200 {"cap_amount":120000.00,"committed":74300.00,
            "pending":8100.00,"utilisation":0.62}

GET  /offers?percentile=94
     → 200 {"results":[{"offer_id":"FP50", ...}]}
```

`POST /events` returns `202` in every case including refusal, and the refusal
reason for an ineligible player is the flat string `not_eligible` with no further
detail. An API that distinguished "self-excluded" from "opted out" would leak the
exclusion list to any caller able to send events.

---

## 9. Guardrails and failure modes

| Failure | Detection | Behaviour |
| --- | --- | --- |
| Scores stale or missing | `scored_at` check on lookup | Proposal suppressed; event logged with `reason: stale_scores`. A guess about value is worse than silence |
| Gateway unreachable or quota exhausted | Adapter probe, `429` handling | Template rationale, labelled; no latency impact (§4) |
| Duplicate events for one session | Dedupe on player and session window | One proposal per player per session unless the type is explicitly repeatable |
| Reviewer double-submits | `409` on already-reviewed | First decision stands |
| Budget cap reached | Budget check | Proposals marked, not suppressed (Flow C) |
| Suppressed player | Inner join at candidate build | Cannot reach the queue; asserted in tests |

---

## 10. Exit criteria

1. Proposals generate within two minutes of the trigger event.
2. Every proposal carries a stated reason and an expected reinvestment figure.
3. No suppressed player ever appears in the queue.

Criterion three is tested as an assertion, not a report: a test seeds an excluded
player, fires a qualifying event, and asserts the queue is empty and the log
records `suppressed`.

---

## 11. Open questions

- **Trigger catalogue** (§3), and whether `loss_threshold` is permissible at all.
- **Reinvestment cap.** `budget_period` exists; the number and who sets it do not.
- **Approval ownership.** Whether approval ends here or hands off to a campaign
  system determines whether `approved` is terminal or a queue state.
- **Repeat suppression.** How long after an offer a player is ineligible for
  another is undefined; `comp_offer` history supports it once the rule exists.
- **Owner.** Unassigned.
