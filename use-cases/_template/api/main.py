"""Backend for __TITLE__.

Self-contained on purpose: this file may duplicate helpers that exist in other
use cases. Do not factor them into a shared package.

Shared-resource endpoints and credentials arrive as environment variables. See
`shared-resources/README.md` for the contract.
"""

from __future__ import annotations

import os
from functools import lru_cache

from fastapi import FastAPI
from pydantic import BaseModel

SLUG = "__SLUG__"

app = FastAPI(title="__TITLE__", version="0.1.0")


class Health(BaseModel):
    use_case: str
    status: str
    resources: dict[str, bool]


@lru_cache
def settings() -> dict[str, str | None]:
    return {
        "nai_endpoint": os.getenv("NAI_ENDPOINT"),
        "nai_api_key": os.getenv("NAI_API_KEY"),
        "nai_chat_model": os.getenv("NAI_CHAT_MODEL"),
        "vector_db_endpoint": os.getenv("VECTOR_DB_ENDPOINT"),
        "collection": os.getenv("__ENV_PREFIX___COLLECTION", f"{SLUG}__default"),
    }


@app.get("/healthz", response_model=Health)
def healthz() -> Health:
    config = settings()
    return Health(
        use_case=SLUG,
        status="ok",
        # Report presence only. Never return credential values.
        resources={
            "nutanix-enterprise-ai": bool(config["nai_endpoint"] and config["nai_api_key"]),
            "vector-db": bool(config["vector_db_endpoint"]),
        },
    )


@app.get("/api/example")
def example() -> dict[str, str]:
    return {"message": f"Replace this endpoint with the real {SLUG} API."}
