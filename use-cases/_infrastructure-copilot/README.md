# Infrastructure Copilot

Ask plain-language questions about the Nutanix estate and get an answer grounded
in live inventory.

## What it does

The UI posts a question to a server action in `web/actions.ts`, which calls this
use case's FastAPI backend. The backend lists clusters from Prism Central, puts
that inventory in the prompt, and asks Nutanix Enterprise AI. Answers are
constrained to the retrieved inventory, and the model is told to say so when the
inventory cannot answer the question.

## Shared resources used

| Resource | Used for |
| --- | --- |
| Nutanix Prism Central | Read-only cluster, host, and VM inventory (`/api/clustermgmt/v4.0/...`) |
| Nutanix Enterprise AI | Chat completion over the retrieved inventory |

Prism Central access is read-only by design. Adding a write path here requires a
confirmation step in the UI — see `shared-resources/prism-central/README.md`.

## Running locally

```bash
# Backend
cd use-cases/infrastructure-copilot/api
python -m venv .venv
.venv/Scripts/activate          # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8100

# UI, from the repo root
npm run dev
```

Then open http://localhost:3000/use-cases/infrastructure-copilot.

Without `PRISM_CENTRAL_*` and `NAI_*` set, both the UI and the backend degrade
gracefully: the page shows a configuration banner and the backend returns a
placeholder answer, so the flow is still testable.

## Deploying

```bash
docker build -t registry.example.com/ai-portal/infrastructure-copilot:latest api/
kubectl apply -n ai-portal -f deploy/deployment.yaml
```

The Deployment pulls shared-resource configuration from the
`shared-resources-config` ConfigMap and `shared-resources` Secret created by
`deploy/k8s/`.

## Owner

Platform Engineering. Runbook: https://wiki.example.com/ai-portal/copilot
