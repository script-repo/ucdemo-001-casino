# Nutanix Enterprise AI (NAI)

Privately hosted inference. NAI exposes an OpenAI-compatible API, so standard
SDKs work by changing the base URL. This is the only sanctioned LLM path for the
portal — no use case should call a public model provider.

## Environment variables

| Variable | Required | Secret | Notes |
| --- | --- | --- | --- |
| `NAI_ENDPOINT` | yes | no | OpenAI-compatible base URL, currently `https://nai-dre.corp.p10y.ntnxdpro.com/enterpriseai/gateway/v1` |
| `NAI_API_KEY` | yes | yes | Issued per use case so usage is attributable |
| `NAI_CHAT_MODEL` | yes | no | Published chat model name, currently `nemotron3-fp4-uni` |
| `NAI_EMBEDDING_MODEL` | no | no | Must match the model that populated your vector collection |

## The served model is a reasoning model

`nemotron3-fp4-uni` returns **two** fields on each message:

```json
{
  "role": "assistant",
  "content": "portal-ok",
  "reasoning": "We are to reply with exactly the string \"portal-ok\"..."
}
```

Two consequences, both of which have already bitten:

1. **Reasoning tokens are billed against `max_tokens`.** A request with
   `max_tokens: 20` returns an empty `content` — the trace consumed the entire
   budget before the answer began. Budget at least 1024, and treat an empty
   `content` as a recoverable condition rather than an error.
2. **`reasoning` must never reach the user.** It is the model's private
   working, frequently contains discarded hypotheses, and in a regulated
   environment reads as a statement the business did not make. Log it to the
   audit trail; render `content` only.

The endpoint publishes no embedding model today, so leave `NAI_EMBEDDING_MODEL`
unset until one appears.

## Access pattern

Call it over plain HTTP rather than through the OpenAI SDK, so that `reasoning`
stays accessible — the SDK's typed response drops unknown fields:

```python
import os, httpx

with httpx.Client(base_url=os.environ["NAI_ENDPOINT"].rstrip("/"), timeout=90.0) as client:
    response = client.post(
        "/chat/completions",
        headers={"Authorization": f"Bearer {os.environ['NAI_API_KEY']}"},
        json={
            "model": os.environ["NAI_CHAT_MODEL"],
            "max_tokens": 1536,
            "messages": [{"role": "user", "content": "Summarise this incident."}],
        },
    )
    response.raise_for_status()
    message = response.json()["choices"][0]["message"]

answer = message.get("content") or ""
reasoning = message.get("reasoning") or ""   # audit trail only
```

List what the endpoint actually serves before hardcoding a model name:

```bash
curl -s -H "Authorization: Bearer $NAI_API_KEY" "$NAI_ENDPOINT/models" | python -m json.tool
```

## Conventions

- **Stream long responses.** Endpoints enforce request timeouts; streaming keeps
  the UI responsive and avoids hitting them.
- **Set `max_tokens` generously.** With a reasoning model the usual advice
  inverts: too low produces empty answers, not short ones. 1536 is a reasonable
  default for this portal.
- **Handle 429 with backoff.** The endpoint is shared; a use case that retries
  aggressively degrades every other one.
- **Embeddings are versioned by model.** Changing `NAI_EMBEDDING_MODEL` means
  re-embedding your entire collection. Record the model name in the collection
  metadata.
- **No PII in prompts** unless the use case has been reviewed for it.

## Verifying connectivity

```bash
curl -s -X POST "$NAI_ENDPOINT/chat/completions" \
  -H "Authorization: Bearer $NAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"model\":\"$NAI_CHAT_MODEL\",\"messages\":[{\"role\":\"user\",\"content\":\"ping\"}],\"max_tokens\":8}"
```
