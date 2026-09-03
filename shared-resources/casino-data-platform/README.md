# Casino Data Platform

One Postgres instance on NKP, in namespace `casino-ai-portal`, at
`casino-postgres.casino-ai-portal.svc.cluster.local:5432`.

This is where the portfolio's "contracts, not shared code" principle lives. Use
cases may not import each other's code, so everything they must agree on is a
database object here.

## Schemas

| Schema | Owner | Access |
| --- | --- | --- |
| `cms_raw` | Simulator | Read-only to every use case |
| `analytics` | Shared | Read to all; write restricted per contract below |
| `uc_<slug>` | One use case | That use case only |

`cms_raw` stands in for the property CMS, modelled on what SYNKROS and IGT
Advantage have in common: `patron`, `player_card`, `card_session`, `slot_play`,
`table_rating`, `trip`, `hotel_stay`, `fnb_transaction`, `comp_offer`,
`exclusion_list`. There is no CMS access in the pilot, so this is populated by
the simulator.

## The three contracts

Defined in full in [`docs/casino-uc-design.md`](../../docs/casino-uc-design.md)
§3. Summarised here because this is the resource that carries them.

**`analytics.player_scores`** — predicted LTV and churn risk per player per day.
Written by predictive LTV scoring and churn-risk modeling, which own disjoint
column sets on the same row and upsert in a fixed nightly order. Read by the
offer engine and win-back. **Closed to new columns**: a use case needing extra
signal builds it in its own `uc_<slug>` schema.

**`analytics.eligible_players`** — the responsible gaming gate, as a view.
Player-facing use cases inner-join it when building a candidate list. A view
rather than a function because an inner join cannot be skipped by a code path
that forgot to check.

**`analytics.decision_log`** — one row per recommendation, carrying the features
as seen at decision time, the model version, the gate result, and the reviewer's
outcome. This is the object that makes state auditability achievable: an auditor
takes a row and recovers the whole decision.

The decision log is a contract of this resource rather than a separately
registered shared resource. It runs in this database, is reached with these
credentials, and registering it separately would duplicate every environment
variable below without telling anyone anything new.

## Roles

Each use case gets its own role: read on `cms_raw`, full rights on its own
`uc_<slug>` schema, and grants on `analytics` narrow enough to enforce the
contract — LTV scoring cannot write churn columns, and neither consumer can
write `player_scores` at all.

## Environment

| Variable | Required | Secret |
| --- | --- | --- |
| `CASINO_DB_HOST` | yes | no |
| `CASINO_DB_PORT` | yes | no |
| `CASINO_DB_NAME` | yes | no |
| `CASINO_DB_USER` | yes | no |
| `CASINO_DB_PASSWORD` | yes | **yes** |
| `CASINO_DB_SSLMODE` | no | no |

`CASINO_DB_USER` differs per use-case backend. The portal itself does not connect
to this database; it renders use-case UIs that call their own backends.

## Status

Not yet deployed. The PVC (`casino-postgres-data`) is provisioned; Postgres, the
schemas, and the simulator are outstanding, and the simulator is the critical
path for four of the six use cases.

## `pgvector`

Installed and usable — the OpenRouter gateway serves embeddings. Requires
pgvector **0.7.0 or later**, because the vectors are 2048-dimensional and
indexing above 2000 needs the `halfvec` type. See
[`../vector-db/README.md`](../vector-db/README.md).

Chunk tables belong in each use case's own `uc_<slug>` schema, not in
`analytics`. Retrieval is not a shared contract.
