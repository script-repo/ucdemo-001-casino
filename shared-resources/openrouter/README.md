# OpenRouter Model Gateway

OpenAI-compatible gateway at `https://openrouter.ai/api/v1`, serving NVIDIA
Nemotron chat, embedding, and rerank models.

This is the inference resource the backends target, because it is reachable from
the NKP cluster and [`../nutanix-enterprise-ai/README.md`](../nutanix-enterprise-ai/README.md)
is not.

## Validated models

All four were tested against the live endpoint, from the workstation and from
inside a pod in `casino-ai-portal`.

| Role | Model | Verified |
| --- | --- | --- |
| Chat | `nvidia/nemotron-3-super-120b-a12b:free` | 262,144 context, ~4 s round trip |
| Chat (fast) | `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` | 256,000 context, ~1.4 s, accepts text/audio/image/video |
| Embedding | `nvidia/nemotron-3-embed-1b:free` | 2048 dims, L2-normalised, 256 inputs per request |
| Rerank | `nvidia/llama-nemotron-rerank-vl-1b-v2:free` | Ranks correctly, ~1.3 s |

## Four things that will bite

**1. The embedding and rerank models are not in `GET /models`.** That endpoint
lists chat models only. Both work; a catalogue lookup is not a valid existence
check for them.

**2. Embeddings are fixed at 2048 dimensions.** Passing `dimensions` returns
`400 dimensions must be one of 2048`, so Matryoshka truncation is not an option.
2048 exceeds pgvector's 2000-dimension index ceiling — see
[`../vector-db/README.md`](../vector-db/README.md) for the `halfvec` cast that
resolves it.

**3. Both chat models return a separate `reasoning` field, billed against
`max_tokens`.** Same trap as the Enterprise AI endpoint. Measured on
`nemotron-3-super-120b-a12b:free` with an identical prompt:

| `max_tokens` | `finish_reason` | Outcome |
| --- | --- | --- |
| 64 | `length` | Truncated inside the reasoning trace |
| 256 | `stop` | Complete |
| 1024 | `stop` | Complete |

Budget at least 1024. Log the `reasoning` field; never display it.

**4. `:free` variants are capped per account, not per key.** Under $10 of
lifetime credits the account gets **50 requests per day** at 20 per minute.
This account has $3.45 in credits, so the 50/day cap applies, and failed
requests count against it.

## Living within 50 requests per day

The cap is a request cap, not a token cap, so **batch aggressively**.

A single embedding request accepts an array. 256 inputs returned in 4.4 seconds
as one request, which puts a realistic ceiling around 12,800 chunks per day.
That is enough for a pilot corpus and nowhere near enough to embed per-player
records, which is one more reason the narrative layer stays a narrative layer.

Two escape hatches, in order of preference:

- **Drop `:free` on the chat models.** `nvidia/nemotron-3-super-120b-a12b`
  exists as a paid variant with no platform request cap, billed per token
  against the $3.45 balance.
- **Add $10 of credits once.** Raises the free daily cap to 1,000 permanently,
  even if the balance later drops. This is the only lever for the embedding
  model, which has **no paid variant** — `nvidia/nemotron-3-embed-1b` without the
  suffix returns `404`.

Retry with backoff and honour `Retry-After`. A misfiring retry loop can exhaust
a 50-request day without producing anything.

## Endpoints

```
POST /chat/completions   # OpenAI-compatible
POST /embeddings         # OpenAI-compatible; input accepts a string or an array
POST /rerank             # NOT OpenAI-standard; /reranking returns 404
GET  /key                # key status and credit limit
GET  /credits            # lifetime credits and usage
```

`/rerank` takes `{model, query, documents[]}` and returns `results[]` with
`index`, `relevance_score`, and the echoed `document`. Scores are small and
relative — in testing the top result scored 0.0019 and the worst 0.0001. **Rank
by order, never threshold on the absolute score.**

## Access pattern

```python
import os, httpx

client = httpx.Client(
    base_url=os.environ["OPENROUTER_BASE_URL"],
    headers={"Authorization": f"Bearer {os.environ['OPENROUTER_API_KEY']}"},
    timeout=60.0,
)

r = client.post("/chat/completions", json={
    "model": os.environ["OPENROUTER_CHAT_MODEL"],
    "messages": [{"role": "user", "content": prompt}],
    "max_tokens": int(os.getenv("OPENROUTER_MAX_TOKENS", "1536")),
})
msg = r.json()["choices"][0]["message"]
answer, trace = msg["content"], msg.get("reasoning")
```

Use raw `httpx`, not the OpenAI SDK. The SDK drops unknown response fields, and
`reasoning` is the field you need for the audit log.

## Verifying connectivity

```bash
curl -s https://openrouter.ai/api/v1/key -H "Authorization: Bearer $OPENROUTER_API_KEY"
```

On Windows, `curl.exe` may fail with `CRYPT_E_NO_REVOCATION_CHECK` — a local
schannel revocation-check quirk, not an endpoint problem. Add `--ssl-no-revoke`
or use a different client. It does not occur in-cluster.

## Key handling

The key is account-wide and is currently in a Kubernetes Secret and in
`.env.local`. It was shared in plain text during setup and **should be rotated**
before this leaves the lab.
