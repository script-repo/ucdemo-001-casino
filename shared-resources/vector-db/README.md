# Vector Database

Shared retrieval store. One deployment, but each use case owns its own
collection and never reads another's.

## Status: usable

`pgvector` inside the casino Postgres, populated through the OpenRouter gateway
(`nvidia/nemotron-3-embed-1b:free`). See
[`../openrouter/README.md`](../openrouter/README.md).

Scope it deliberately. The casino analyses are relational — scores, cadence
baselines, peer groups, and forecasts are aggregate queries over structured
data, and retrieval helps none of them. What retrieval is for here is grounding
the **narrative layer** in property documents: responsible gaming policy, comp
matrices, game rules, standard operating procedures, and the metric dictionary
behind natural-language querying. Embedding per-player records would be both
useless and, at 50 requests per day, impossible.

## Dimensions: 2048, and why that needs a cast

The embedding model returns **2048 dimensions and rejects any other value**.
pgvector's HNSW and IVFFlat indexes cap at **2000 dimensions** for the `vector`
type (`HNSW_MAX_DIM 2000` in the source), so a plain `vector(2048)` column
cannot be indexed at all.

The fix is `halfvec`, which indexes up to 4000 dimensions by storing
half-precision floats. Store full precision, index the cast:

```sql
CREATE TABLE uc_<slug>.doc_chunk (
    chunk_id     BIGSERIAL PRIMARY KEY,
    source_ref   TEXT        NOT NULL,
    content      TEXT        NOT NULL,
    embedding    vector(2048) NOT NULL,
    embed_model  TEXT        NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ON uc_<slug>.doc_chunk
    USING hnsw ((embedding::halfvec(2048)) halfvec_cosine_ops);
```

Query with the same cast, or the index is not used:

```sql
SELECT chunk_id, source_ref, content
FROM   uc_<slug>.doc_chunk
ORDER  BY embedding::halfvec(2048) <=> $1::halfvec(2048)
LIMIT  30;
```

Requires pgvector 0.7.0 or later. At pilot corpus size exact search without any
index is also perfectly adequate — the index matters at scale, not at hundreds
of documents.

The vectors are already **L2-normalised** (measured norm 1.0), so cosine and
inner product rank identically; no normalisation step is needed on write.

## Retrieve then rerank

Vector search alone is the first stage, not the answer. Over-fetch, then rerank:

1. `ORDER BY embedding::halfvec(2048) <=> query` — take ~30 candidates.
2. Send those to `POST /rerank` with the original question.
3. Keep the top 5 **by rank order**. Rerank scores are relative, not calibrated
   probabilities — in testing the best scored 0.0019 and the worst 0.0001, so an
   absolute threshold is meaningless.

This costs two gateway requests per question against a 50-per-day account cap,
which is the real constraint on interactive retrieval — not query latency.

## Environment variables

| Variable | Required | Secret | Notes |
| --- | --- | --- | --- |
| `VECTOR_DB_KIND` | yes | no | `milvus`, `pgvector`, `qdrant`, or `weaviate` |
| `VECTOR_DB_ENDPOINT` | yes | no | Prefer the in-cluster service address |
| `VECTOR_DB_API_KEY` | no | yes | Token or `user:password`, if auth is enabled |
| `VECTOR_DB_DATABASE` | no | no | Logical database, e.g. `ai_portal` |

## Isolation

Chunk tables live in each use case's own `uc_<slug>` schema, not in a shared one.
That is the same boundary the rest of the portfolio uses: deleting a use case
means dropping its folder and its schema, and nothing else is affected. No use
case reads another's chunks.

## Access pattern

```python
import os, httpx, psycopg

def embed(texts: list[str]) -> list[list[float]]:
    r = httpx.post(
        f"{os.environ['OPENROUTER_BASE_URL']}/embeddings",
        headers={"Authorization": f"Bearer {os.environ['OPENROUTER_API_KEY']}"},
        json={"model": os.environ["OPENROUTER_EMBEDDING_MODEL"], "input": texts},
        timeout=120.0,
    )
    return [d["embedding"] for d in r.json()["data"]]

# Batch on write. One request takes 256 inputs; the daily cap counts requests.
for batch in chunked(chunks, 256):
    vectors = embed([c.content for c in batch])
```

Vendor this into your use case's `api/` folder. It is a dozen lines, and
duplicating it is cheaper than a shared library the isolation rule forbids.

## Conventions

- **Record the embedding model on every row.** `embed_model` exists for this.
  Vectors from different models are not comparable, and mixing them silently
  returns garbage.
- **Store a source reference** so the UI can cite what it retrieved. An
  ungrounded narrative sentence is worse than no sentence.
- **Re-embed, do not patch,** when the model changes. Write to a new table,
  verify, swap, drop the old one.
- **Batch on write, bound `top_k` on read.** Both are request-cap concerns
  before they are performance concerns.

## Verifying

```bash
psql "$VECTOR_DB_ENDPOINT" -c "\dx vector"                 # extension present
psql "$VECTOR_DB_ENDPOINT" -c "SELECT extversion FROM pg_extension WHERE extname='vector'"
```

`extversion` must be 0.7.0 or later for `halfvec`.
