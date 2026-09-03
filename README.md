# AI Use-Case Portal

A dashboard plus a growing catalogue of AI use cases. Each use case is a
self-contained folder. They share infrastructure, never code.

```
.
├── app/                     Portal routes: dashboard, resource detail, use-case host
├── components/              Portal UI (not importable by use cases)
├── lib/                     Portal logic: use-case registry, resource status
├── shared-resources/        The four shared resources — contracts and docs
│   ├── resources.json         single source of truth for endpoints and variables
│   ├── prism-central/
│   ├── nkp/
│   ├── nutanix-enterprise-ai/
│   └── vector-db/
├── use-cases/               One folder per use case, plus _template/
│   ├── _template/
│   ├── infrastructure-copilot/
│   └── document-intelligence/
├── deploy/                  Kubernetes manifests for NKP
├── scripts/                 Scaffolding and contract validation
└── Dockerfile               Portal image
```

## The two rules

**1. Use cases share resources, not code.** The four shared resources are
infrastructure. A use case reaches them through documented environment
variables and its own client code. It never imports a client from a sibling use
case or from the portal's `lib/`.

**2. A use case is exactly one folder.** Its UI, backend, deployment manifest,
docs, and configuration all live under `use-cases/<slug>/`. Adding one touches
no portal file. Deleting one is `rm -rf`.

Duplication between use cases is expected and accepted. In exchange, any use
case can be rewritten, upgraded to a different library version, handed to
another team, or removed without a survey of what else might break.

`npm run validate` enforces both rules; it fails the build on a cross-boundary
import.

## Shared resources

| Resource | Role | Docs |
| --- | --- | --- |
| Nutanix Prism Central | Infrastructure inventory, metrics, lifecycle | [`shared-resources/prism-central/`](shared-resources/prism-central/README.md) |
| Nutanix Kubernetes Platform | Runtime for the portal and use-case backends | [`shared-resources/nkp/`](shared-resources/nkp/README.md) |
| Nutanix Enterprise AI | OpenAI-compatible chat and embedding inference | [`shared-resources/nutanix-enterprise-ai/`](shared-resources/nutanix-enterprise-ai/README.md) |
| Vector Database | Retrieval store, one collection per use case | [`shared-resources/vector-db/`](shared-resources/vector-db/README.md) |

`shared-resources/resources.json` declares each one and the environment
variables that address it. The dashboard reads that file to render the readiness
panel, reporting only whether each variable is *set* — it never reads the value
of anything marked secret.

## Getting started

```bash
npm install
cp .env.example .env.local     # fill in endpoints; leave blanks to run degraded
npm run dev
```

Open http://localhost:3000. Use cases with missing configuration still render,
with a banner naming what is absent.

## Adding a use case

```bash
npm run new:use-case incident-triage
```

This copies `use-cases/_template/`, substitutes the slug, title, and environment
prefix, and leaves you with a use case that already appears on the dashboard at
`/use-cases/incident-triage`. Then edit `usecase.json`, build the UI in
`web/Page.tsx`, and keep or delete `api/` depending on whether you need a
backend.

No portal file changes. The dashboard discovers use cases by scanning
`use-cases/*/usecase.json`, and a single dynamic route at
`app/use-cases/[slug]/page.tsx` renders each one's `web/Page.tsx`.

Details and the full contract: [`use-cases/README.md`](use-cases/README.md).

## How a use case reaches its backend

The template uses a server action inside the use-case folder rather than a
browser fetch. The action runs on the Next.js server and calls the FastAPI
backend service-to-service, which means no CORS configuration, no portal route
handler, and no credentials in the browser. See
`use-cases/infrastructure-copilot/web/actions.ts`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Portal with hot reload |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript, no emit |
| `npm run validate` | Check every use case against the structural contract |
| `npm run new:use-case <slug>` | Scaffold a use case from the template |

## Deploying

Kubernetes manifests and the configuration flow are documented in
[`deploy/README.md`](deploy/README.md). The portal is one deployment carrying
every use-case UI; only use cases with an `api/` folder get a workload of their
own.
