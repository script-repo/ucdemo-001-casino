"""Backend for Infrastructure Copilot.

Answers plain-language questions by pulling live inventory from Prism Central
and passing it to Nutanix Enterprise AI.

The Prism Central and NAI clients below are intentionally local to this use
case. Other use cases have their own copies; that is the design.
"""

from __future__ import annotations

import base64
import logging
import os
from functools import lru_cache

import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

# uvicorn configures only its own loggers, so without this the audit hook below
# emits nothing.
logging.basicConfig(level=logging.INFO)
LOGGER = logging.getLogger("infrastructure-copilot")

SLUG = "infrastructure-copilot"
MAX_TOKENS = int(os.getenv("NAI_MAX_TOKENS", "1536"))
SYSTEM_PROMPT = (
    "You are an assistant for Nutanix infrastructure operators. Answer only from "
    "the inventory provided. If the inventory does not contain the answer, say so "
    "plainly rather than guessing."
)

app = FastAPI(title="Infrastructure Copilot", version="0.1.0")


class AskRequest(BaseModel):
    question: str = Field(min_length=1, max_length=1000)


class AskResponse(BaseModel):
    answer: str


@lru_cache
def prism_config() -> tuple[str, str, str, bool] | None:
    endpoint = os.getenv("PRISM_CENTRAL_ENDPOINT")
    username = os.getenv("PRISM_CENTRAL_USERNAME")
    password = os.getenv("PRISM_CENTRAL_PASSWORD")
    if not (endpoint and username and password):
        return None
    verify = os.getenv("PRISM_CENTRAL_INSECURE_TLS", "false").lower() != "true"
    return endpoint.rstrip("/"), username, password, verify


def fetch_inventory() -> str:
    """Summarise clusters as plain text for the prompt. Returns '' if unconfigured."""
    config = prism_config()
    if config is None:
        return ""

    endpoint, username, password, verify = config
    token = base64.b64encode(f"{username}:{password}".encode()).decode()

    with httpx.Client(base_url=endpoint, verify=verify, timeout=30.0) as client:
        response = client.get(
            "/api/clustermgmt/v4.0/config/clusters",
            params={"$limit": 50},
            headers={"Authorization": f"Basic {token}", "Accept": "application/json"},
        )
        response.raise_for_status()
        clusters = response.json().get("data", []) or []

    lines = [
        f"- {cluster.get('name', 'unknown')}: "
        f"{len(cluster.get('nodes', {}).get('nodeList', []) or [])} nodes, "
        f"AOS {cluster.get('config', {}).get('clusterSoftwareMap', [{}])[0].get('version', 'unknown')}"
        for cluster in clusters
    ]
    return "\n".join(lines)


def ask_model(question: str, inventory: str) -> str:
    endpoint = os.getenv("NAI_ENDPOINT")
    api_key = os.getenv("NAI_API_KEY")
    model = os.getenv("NAI_CHAT_MODEL")

    if not (endpoint and api_key and model):
        return (
            "Nutanix Enterprise AI is not configured, so this is a placeholder "
            f"answer.\n\nQuestion: {question}\n\nInventory the model would have "
            f"seen:\n{inventory or '(Prism Central not configured either)'}"
        )

    with httpx.Client(base_url=endpoint.rstrip("/"), timeout=90.0) as client:
        response = client.post(
            "/chat/completions",
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": model,
                # nemotron3-fp4-uni is a reasoning model and its reasoning trace
                # is billed against max_tokens. Anything under ~1k returns an
                # empty `content` because the trace consumes the whole budget.
                "max_tokens": MAX_TOKENS,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": (
                            f"Inventory:\n{inventory or '(none available)'}"
                            f"\n\nQuestion: {question}"
                        ),
                    },
                ],
            },
        )
        response.raise_for_status()
        message = response.json()["choices"][0]["message"]

    # `reasoning` is the model's private working. It belongs in the audit trail,
    # never in the operator-facing answer.
    reasoning = message.get("reasoning") or ""
    if reasoning:
        LOGGER.info("model reasoning captured", extra={"chars": len(reasoning)})

    answer = (message.get("content") or "").strip()
    if not answer:
        return (
            "The model returned no answer within its token budget. Try a "
            "narrower question, or raise NAI_MAX_TOKENS."
        )
    return answer


@app.get("/healthz")
def healthz() -> dict[str, object]:
    return {
        "use_case": SLUG,
        "status": "ok",
        "resources": {
            "prism-central": prism_config() is not None,
            "nutanix-enterprise-ai": bool(
                os.getenv("NAI_ENDPOINT") and os.getenv("NAI_API_KEY")
            ),
        },
    }


@app.post("/api/ask", response_model=AskResponse)
def ask(request: AskRequest) -> AskResponse:
    try:
        inventory = fetch_inventory()
    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=502, detail=f"Prism Central unreachable: {error}"
        ) from error

    return AskResponse(answer=ask_model(request.question, inventory))
