# Casino AI Use-Case Scope

Agreed scope for the six casino use cases targeted by this portal. Decisions
recorded here are settled unless explicitly revisited; open items are listed at
the end.

This document records **what** was agreed. [`casino-uc-design.md`](./casino-uc-design.md)
records **how** it is built, and each use case has its own `DESIGN.md`. Two
points in this scope are challenged by the design and need confirming:

- The responsible gaming gate is scoped below to use cases 3 and 4. The churn
  design applies it to the risk queue as well, on the grounds that the queue
  exists to make a host place a call — see
  [`use-cases/churn-risk-modeling/DESIGN.md`](../use-cases/churn-risk-modeling/DESIGN.md) §3.
- Inference moved to the OpenRouter gateway, which **is** reachable from the NKP
  cluster while the on-premises Enterprise AI endpoint is not, and which also
  serves the embedding and rerank models the retrieval path needs. Its `:free`
  variants are capped at 50 requests per day, which is what now shapes the
  narrative layer — see `casino-uc-design.md` §5.

## Locked decisions

| Decision | Value |
| --- | --- |
| Property scope | Single locals casino, pilot |
| Delivery | All six use cases in parallel |
| Source data | No CMS access — simulated in Postgres on a SYNKROS/Advantage-shaped schema |
| Data platform | One Postgres on NKP: `cms_raw` + `analytics` schemas, `pgvector` enabled |
| Decision latency | Near real time — minutes, within the visit or session |
| Automation | Recommend only; a human approves before anything reaches a player |
| Regulation | State-regulated, model auditability required |
| Responsible gaming | Hard suppression gate on every player-facing path |
| Churn definition | Relative to each player's own cadence, with a fixed backstop |
| Value basis | Theoretical win plus non-gaming spend |
| LTV horizon | 12 months forward |
| ML platform | MLflow on NKP; training as Jobs; each use case serves its own model |
| Generative AI role | Narrative and Q&A layer only — explains scores, does not produce them |

## Revised shared resources

The original four do not cover predictive ML. Three resources are added and one
is collapsed.

| Resource | Status | Role |
| --- | --- | --- |
| Nutanix Prism Central | unchanged | Infrastructure inventory and capacity for the platform itself |
| Nutanix Kubernetes Platform | unchanged | Runtime for the portal, backends, training jobs, and Postgres |
| Nutanix Enterprise AI | unchanged | Narrative explanation of scores, natural-language querying |
| Vector database | **collapsed** | Now `pgvector` inside the casino Postgres, not a separate deployment |
| Casino data platform | **new** | Postgres: simulated CMS source of record plus the analytics warehouse |
| Model registry | **new** | MLflow on NKP — experiment tracking, model versioning, lineage for audit |
| Decision & audit log | **new** | Every score and recommendation with model version, features, and reviewer outcome |

Collapsing the vector database removes a deployment: `pgvector` in the same
Postgres serves the retrieval needs of the narrative layer, and at this data
volume a dedicated vector store earns nothing.

**As registered.** `shared-resources/resources.json` now carries
`casino-data-platform` and `model-registry`. The decision and audit log is
registered as a *contract of* the data platform rather than as its own resource:
it is a table in the same database reached with the same credentials, so a
separate entry would duplicate every environment variable without telling anyone
anything new.

`vector-db` is declared by the two use cases with a narrative layer. The
OpenRouter gateway serves embeddings and rerank, so retrieval is available — but
scoped to grounding generated prose in property documents, not to the analyses
themselves, which are relational. A seventh resource, `openrouter`, is registered
for the gateway.

### These stay resources, not shared code

The portal forbids shared code between use cases. Two cross-cutting concerns
therefore ship as **services and database objects**, never as an importable
module:

- **Responsible gaming gate** — a database view (`analytics.eligible_players`)
  and an API endpoint. Every player-facing use case queries it and filters
  against it. Each writes its own three-line client.
- **Audit log** — a Postgres table each use case writes to directly. The schema
  is the contract; the insert code is duplicated per use case.

## The score contract

This is the week-one unblock. Predictive LTV and churn-risk produce it; the
offer engine and win-back consume it. Fixing it first lets all six proceed in
parallel, with downstream use cases developing against a seeded stub.

```sql
CREATE TABLE analytics.player_scores (
    player_id                BIGINT      NOT NULL,
    score_date               DATE        NOT NULL,
    ltv_12m_theo             NUMERIC(12,2) NOT NULL,  -- predicted 12-month theo + non-gaming
    ltv_percentile           SMALLINT    NOT NULL,     -- 0-100, within property
    churn_risk               NUMERIC(4,3) NOT NULL,    -- 0.000-1.000
    churn_band               TEXT        NOT NULL,     -- low | medium | high
    expected_days_to_visit   SMALLINT,
    model_version            TEXT        NOT NULL,     -- MLflow run id
    scored_at                TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (player_id, score_date)
);
```

No use case may add columns here. A use case needing extra signal computes it in
its own schema.

## The six use cases

### 1. Predictive LTV scoring — `predictive-ltv-scoring`

Ranks players by predicted 12-month forward value, combining theoretical win
from carded gaming with hotel and F&B spend. Publishes `ltv_12m_theo` and
`ltv_percentile` to the score contract.

Gradient-boosted regression over play frequency, theo per visit, trip length,
tier history, and non-gaming spend. Reinvestment decisions depend on this, so
calibration matters more than raw accuracy — a predicted $500 player should
average $500.

**Resources:** casino data platform, model registry.
**Pilot done when:** scores for all carded players refresh nightly, calibration
holds within 15% by decile on a held-out period, and hosts can see the drivers
behind any individual score.

### 2. Churn-risk modeling — `churn-risk-modeling`

Flags players disengaging *relative to their own established cadence*, not
against a fixed calendar window. A weekly player absent three weeks is at risk;
a quarterly player absent three weeks is behaving normally. A fixed backstop
catches players with too little history to establish a cadence.

Publishes `churn_risk`, `churn_band`, and `expected_days_to_visit`.

**Resources:** casino data platform, model registry.
**Pilot done when:** the model beats a fixed-90-day-window baseline on
precision at the top risk decile, and the cadence baseline per player is
inspectable — a host must be able to see *why* a regular was flagged.

### 3. Dynamic offer engine — `dynamic-offer-engine`

Recommends promotions tailored to segment, informed by LTV percentile and
current churn band. Near real time: an offer is proposed within minutes of a
qualifying event during the visit.

**Recommend only.** The engine proposes; a marketer or host approves. Every
proposal passes the responsible gaming gate *before* surfacing, not after.

**Resources:** casino data platform, model registry, audit log, RG gate,
Enterprise AI (offer rationale in plain language).
**Pilot done when:** proposals generate within two minutes of the trigger event,
every proposal carries a stated reason and expected reinvestment, and no
suppressed player ever appears in the queue.

### 4. Win-back campaigns — `win-back-campaigns`

Triggered by churn-risk crossing a threshold. Assembles a candidate list, pairs
each player with a win-back offer sized by their LTV percentile, and routes it
for approval.

Consumes the score contract; produces no scores of its own. Depends on use cases
1 and 2 for real data, and develops against the seeded stub until they land.

**Resources:** casino data platform, audit log, RG gate, Enterprise AI (campaign
narrative).
**Pilot done when:** a marketer can review, edit, approve, or reject a generated
candidate list, and every decision lands in the audit log.

### 5. Slot & table performance — `slot-table-performance`

Correlates machine placement and game theme with hold percentage and
time-on-device. No player-facing action, so no responsible gaming gate and the
lightest regulatory burden of the six.

Analytical rather than predictive at pilot: floor-section and theme performance,
time-on-device distributions, and underperforming units against comparable
placements.

**Resources:** casino data platform, Enterprise AI (natural-language querying of
floor performance).
**Pilot done when:** a slot manager can identify underperforming units by
placement and theme, and drill from a floor view to an individual machine.

### 6. Revenue management — `revenue-management`

Dynamic room rates from demand forecasts. Hotel-side and largely independent of
player scoring, though casino demand — event calendar, expected high-value
arrivals — is a forecast input.

Time-series forecasting of occupancy and rate by date and segment, producing
recommended rates. Recommend only, consistent with the rest.

**Resources:** casino data platform, model registry.
**Pilot done when:** forecasts beat a same-period-last-year baseline on MAPE and
a revenue manager can override any recommended rate with the reason recorded.

## Simulated data platform

Because there is no CMS access, the simulator is a first-class deliverable, not
a fixture. Models trained on unrealistic data will validate and then fail.

**Property profile — locals casino:**

| Dimension | Volume |
| --- | --- |
| Slot machines | ~800 |
| Table games | ~20 |
| Hotel rooms | ~300 |
| Carded players | ~50,000 |
| History | 24 months |

**Entities (`cms_raw`)** — modelled on what SYNKROS and IGT Advantage have in
common rather than either vendor's specifics, so the schema survives contact
with real data:

- `patron` — player master, tier, enrolment date, demographics
- `player_card` / `card_session` — carded session start and end by device
- `slot_play` — coin-in, coin-out, theo win, actual win, time on device
- `table_rating` — average bet, hours played, rated theo
- `trip` — visit records, arrival and departure
- `hotel_stay` — folio, room revenue, rate code
- `fnb_transaction` — non-gaming spend
- `comp_offer` — offers issued, redeemed, and expired
- `exclusion_list` — self-exclusion and suppression flags

**Behaviours the generator must produce,** without which the models are
meaningless:

- Per-player visit cadence with realistic variance, not uniform random
- Seasonality and day-of-week effects; locals casinos peak differently from
  destination resorts
- Tier migration over the 24 months, both directions
- Genuine churn signals — cadence decay preceding absence, so churn is
  learnable rather than random
- Theo distribution with a long tail; a small fraction of players carrying a
  large share of value
- Correlation between slot placement, theme, and performance, so use case 5 has
  a real signal to find

## Cross-cutting requirements

**Responsible gaming gate.** Every player-facing use case (3 and 4) filters
against the eligibility view before a recommendation is *displayed*, not before
it is sent. A suppressed player must never appear in an approval queue.

**Audit log.** State auditability means every score and every recommendation is
recorded with its model version, the input features, and the reviewer's
approve or reject. MLflow supplies the model lineage; the audit table links each
decision to the exact model version that produced it.

**Recommend only.** No use case dispatches anything to a player without human
approval. This is a design constraint on the UI, not a configuration flag.

## Sequencing

All six proceed in parallel, with one hard ordering constraint:

1. **Week one:** freeze the score contract, stand up Postgres with the `cms_raw`
   schema, and seed the score table with stubbed values.
2. **Then in parallel:** use cases 1 and 2 replace the stub with real scores;
   3 and 4 build against it; 5 and 6 proceed independently of it entirely.

Use cases 5 and 6 have no dependency on the score contract and can start
immediately.

## Open items

- Trigger events for the offer engine — what qualifies during a visit, and where
  does the near-real-time signal come from in the simulation?
- Reinvestment budget rules — is there a target reinvestment percentage the
  offer engine must respect?
- Approval workflow — is there an existing campaign management system these
  recommendations hand off to, or does the portal own approval end to end?
- Event calendar for revenue management — real, simulated, or out of scope?
- Retention period for the audit log under the applicable state regulation.
