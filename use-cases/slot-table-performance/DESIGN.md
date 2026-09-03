# Slot & Table Performance — Design

Assumes the shared platform, contracts, and principles in
[`docs/casino-uc-design.md`](../../docs/casino-uc-design.md).

The only use case with no player-facing output, no responsible gaming gate, and
no model at pilot. It is an analytics surface, and its value is entirely in one
idea: comparing like with like.

---

## 1. Outcome

A slot manager can identify an underperforming unit and say **why** — position,
theme, denomination, or the machine itself — instead of reading a ranked list
that mostly reflects where machines happen to sit.

| | Before | After |
| --- | --- | --- |
| Performance view | Ranked list of units by win | Unit compared to its own peer group |
| Underperformance | "Bottom 50 units" — mostly quiet zones | Units below peers in comparable placements |
| Theme decisions | Vendor claims and intuition | Theme performance held constant for placement |
| Reconfiguration | Annual, by feel | Evidence for a specific move |

**Primary user:** slot manager, floor operations.
**Decision changed:** where to place a machine and which themes to buy more of.

---

## 2. The peer group is the product

A raw ranking of units by win per day tells you which parts of the floor get foot
traffic. Everyone already knows that. The bank by the main entrance outperforms
the far wall regardless of what sits on it, so a ranking rediscovers the floor
plan and calls it insight.

The analysis that changes a decision is **unit versus comparable placements**:

```
peer_group = (zone, denomination, game_type, cabinet_family)
```

A unit is interesting when it sits well below the median of its own peer group —
that residual is attributable to the machine or its theme rather than to
position. And a *theme* is interesting when it beats peers consistently across
several different zones, because a theme that only performs in one high-traffic
zone has not demonstrated anything.

Peer groups smaller than a floor of six units are marked low-confidence rather
than reported. At ~800 units the tail of thin peer groups is real, and a
confident residual over four comparators is noise.

---

## 3. Contracts

**Reads only.** `cms_raw.slot_play`, `table_rating`, `card_session`, and the
unit and table dimension records. **Writes nothing** — no scores, no decision
log. A floor reconfiguration is a physical act recorded elsewhere.

**Private** (`uc_floor`), all derived:

```sql
CREATE MATERIALIZED VIEW uc_floor.unit_daily AS
SELECT unit_id, gaming_date,
       SUM(coin_in)                AS coin_in,
       SUM(theo_win)               AS theo_win,
       SUM(actual_win)             AS actual_win,
       SUM(seconds_played)         AS time_on_device,
       COUNT(DISTINCT session_id)  AS sessions
FROM cms_raw.slot_play
GROUP BY unit_id, gaming_date;

CREATE MATERIALIZED VIEW uc_floor.unit_peer_stats AS
SELECT zone, denomination, game_type, cabinet_family, period_start,
       COUNT(*)                                              AS peer_n,
       percentile_cont(0.5) WITHIN GROUP (ORDER BY wpud)     AS median_wpud,
       percentile_cont(0.25) WITHIN GROUP (ORDER BY wpud)    AS p25_wpud,
       percentile_cont(0.75) WITHIN GROUP (ORDER BY wpud)    AS p75_wpud
FROM uc_floor.unit_period
GROUP BY zone, denomination, game_type, cabinet_family, period_start;
```

Metrics reported: coin-in, theoretical win, actual win, hold percentage, time on
device, and win per unit per day. Table games use drop, table win, hold, and
occupied seat-hours from `table_rating`, with the same peer structure on
(pit, game, limit band).

---

## 4. Infrastructure

| Object | Kind | Schedule | Notes |
| --- | --- | --- | --- |
| `floor-refresh` | `CronJob` | Nightly 03:00 | `REFRESH MATERIALIZED VIEW CONCURRENTLY` |
| `slot-table-performance` | `Deployment`, 2 replicas | — | FastAPI read API |

The lightest of the six. No training, no registry, no external calls on the
primary path. 800 units × 730 days is under 600,000 rows — the materialised views
exist for query shape and predictable latency, not because the data is large.

Natural-language querying is the one optional feature. It is now **buildable** —
the OpenRouter gateway is reachable from the cluster and serves chat, embeddings,
and rerank (portfolio doc §5) — but it stays **out of scope for pilot**, for a
different reason than before.

Unlike a rationale sentence, an arbitrary question has no template fallback: the
feature either answers or it does not. At two gateway requests per question
against a 50-per-day account cap, it can demonstrate well and cannot be relied
on. Shipping it into a slot manager's daily workflow would mean shipping
something that stops working mid-morning.

If it is built, the shape is grounded question answering, not text-to-SQL:
`uc_floor.doc_chunk` holds the metric dictionary and peer-group definitions, and
the model explains what a figure means rather than inventing a query against the
floor. The endpoint is specified in §7 so the UI can hide the control cleanly on
a capability check, and raising the daily cap is the one change that would move
this into scope.

---

## 5. UI components

| Component | Purpose |
| --- | --- |
| `FloorMap` | Zones as blocks sized by unit count, shaded by the selected metric relative to floor median. Click to filter |
| `MetricSelector` | Coin-in, theo win, hold, time on device, win per unit per day, and residual against peers |
| `UnitTable` | Sortable unit list with metric, peer median, residual, and peer confidence |
| `UnitDetail` | One unit: trend over the period, its peer group named explicitly, its position in the peer distribution |
| `PeerDistribution` | The unit as a marker on its peer group's spread — the component that carries §2 |
| `ThemeComparison` | Theme performance across zones, with a consistency indicator |
| `PeriodSelector` | Trailing 30 / 90 / 365 days, and same period last year |
| `LowConfidenceFlag` | Marks peer groups below six units |

`FloorMap` is a schematic of zones, not a scale drawing. Real coordinates would
need a floor plan the simulation does not have, and a zone-level view answers the
placement question without pretending to millimetre accuracy.

---

## 6. User flows

**Flow A — finding real underperformers (monthly, slot manager).**
1. `MetricSelector` set to residual against peers.
2. `UnitTable` sorted ascending; the bottom is now units genuinely trailing
   comparable placements, not just units in quiet corners.
3. `UnitDetail` on the worst: `PeerDistribution` shows it in the 8th percentile
   of 14 comparable units.
4. Manager has a specific, defensible case for a move or a conversion.

**Flow B — theme purchasing (quarterly).**
1. `ThemeComparison` over the trailing year.
2. A theme is above peer median in five of six zones it appears in — consistent.
3. Another is strong in one zone only; the consistency indicator marks it, and it
   does not drive a purchase.

**Flow C — checking a change worked.**
1. Unit was relocated eight weeks ago.
2. `UnitDetail` over the trailing 90 days, with the move marked.
3. The comparison that matters is against its **new** peer group, which the unit
   detail switches to automatically at the move date.

---

## 7. API sketch

`slot-table-performance.casino-ai-portal.svc.cluster.local`, reaching the UI as
`SLOT_TABLE_PERFORMANCE_API_URL`.

```
GET  /health
     → 200 {"status":"ok","refreshed_at":"2026-08-06T03:04:11Z",
            "nl_query_available":false}

GET  /floor/zones?metric=wpud&period=90d
     → 200 {"floor_median":214.30,
            "zones":[{"zone":"high-limit","unit_count":48,
                      "median_wpud":612.40,"index_vs_floor":2.86}]}

GET  /units?zone=main&denomination=0.01&sort=residual&limit=50
     → 200 {"period":"90d","results":[
         {"unit_id":"SLOT-0412","theme":"Dragon Fortune",
          "zone":"main","denomination":0.01,"cabinet_family":"Ovation",
          "wpud":142.10,"peer_median_wpud":221.80,"residual":-79.70,
          "peer_n":14,"peer_percentile":8,"confidence":"ok"}]}

GET  /units/{unit_id}?period=90d
     → 200 {"unit_id":"SLOT-0412",
            "peer_group":{"zone":"main","denomination":0.01,
                          "game_type":"video-reel","cabinet_family":"Ovation",
                          "peer_n":14},
            "metrics":{"coin_in":1840220.00,"theo_win":18402.00,
                       "actual_win":17910.00,"hold_pct":0.973,
                       "time_on_device_hours":1421,"wpud":142.10},
            "distribution":{"p25":186.40,"median":221.80,"p75":268.90,
                            "unit_value":142.10,"unit_percentile":8},
            "trend":[{"period_start":"2026-05-01","wpud":151.20}],
            "placement_changes":[{"changed_at":"2026-06-11",
                                  "from_zone":"far-wall","to_zone":"main"}]}

GET  /themes/performance?period=365d&min_zones=3
     → 200 {"results":[
         {"theme":"Dragon Fortune","zones_present":6,
          "zones_above_peer_median":5,"consistency":"high",
          "avg_residual":41.20,"unit_count":22}]}

GET  /tables?pit=&game=&period=90d
     → 200 {"results":[{"table_id":"BJ-07","game":"blackjack",
                        "limit_band":"25-500","drop":412000.00,
                        "win":58400.00,"hold_pct":0.142,
                        "occupied_seat_hours":2140,
                        "peer_median_hold":0.151,"peer_n":9}]}

POST /ask                                  # optional; disabled for pilot (§4)
     {"question":"which penny themes underperform in the main pit?"}
     → 200 {"answer":"...","sources":[{"ref":"metric-dictionary#wpud"}],
            "kind":"model"}
     → 501 {"reason":"nl_query_disabled"}
     → 429 {"reason":"gateway_quota_exhausted","retry_after":  3600}
```

`nl_query_available` on `/health` lets the UI omit the control entirely rather
than showing a button that returns `501`.

---

## 8. Guardrails and failure modes

| Failure | Detection | Behaviour |
| --- | --- | --- |
| Peer group too small | `peer_n < 6` | `confidence: low`; excluded from ranked underperformer lists |
| Unit moved mid-period | `placement_changes` | Peer comparison splits at the move; a unit is never compared across two peer groups as one figure |
| Refresh did not run | `refreshed_at` staleness | Data served with the timestamp shown; no silent staleness |
| New unit with little history | Days in service | Excluded below 30 days rather than ranked bottom on a partial period |
| Simulator has no placement effect | Residual variance near zero | The use case has nothing to find, and says so rather than ranking noise |

The last row matters for pilot honesty. If the simulator generates unit
performance independently of placement and theme, every residual is noise and a
confident ranking would be fabricated. The simulator must build in a
placement/theme/performance correlation for this use case to be testable at all.

---

## 9. Exit criteria

1. Underperforming units are identifiable by placement and by theme.
2. Comparisons hold placement constant — the reported residual is attributable to
   the unit, not to where it sits.

---

## 10. Open questions

- **Peer group definition.** `(zone, denomination, game_type, cabinet_family)` is
  a proposal. A slot manager will have views, and this is the single decision
  that determines whether the use case is useful.
- **Zone map.** Zone boundaries need to come from someone who knows the floor;
  the simulator invents them today.
- **Table coverage.** Table analysis is thinner because ratings are estimates
  rather than metered. Whether tables are in scope for pilot conclusions, or
  present for completeness, should be settled.
- **Owner.** Unassigned.
