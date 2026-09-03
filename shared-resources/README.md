# Shared Resources

Four pieces of infrastructure are shared by every use case in this portal:

| Folder | Resource | Role |
| --- | --- | --- |
| `prism-central/` | Nutanix Prism Central | Infrastructure inventory, metrics, and lifecycle operations |
| `nkp/` | Nutanix Kubernetes Platform | Runtime for the portal and use-case backends |
| `nutanix-enterprise-ai/` | Nutanix Enterprise AI | OpenAI-compatible chat and embedding inference |
| `vector-db/` | Vector Database | Retrieval store, one collection per use case |

## What "shared" means here

Shared resources are **shared infrastructure, not shared code**. A use case never
imports a client library from this folder or from a sibling use case. What it
consumes is a contract:

1. **`resources.json`** declares each resource and the environment variables that
   address it. It is the single source of truth, read by the dashboard to render
   the resource panel and by `npm run validate` to check use-case manifests.
2. **Environment variables** carry the actual endpoints and credentials. Locally
   they come from `.env.local`; in cluster they come from a ConfigMap and a
   Secret (see `deploy/k8s/`).
3. **The per-resource README** in each folder documents the access pattern,
   quotas, and how to verify connectivity.

Each use case writes its own client against that contract. Duplicating a twenty
line HTTP client across use cases is the intended trade: it keeps use cases
independently deployable, upgradable, and deletable.

## Declaring a dependency

A use case lists the resources it touches in its `usecase.json`:

```json
{
  "resources": ["nutanix-enterprise-ai", "vector-db"]
}
```

`npm run validate` fails if a use case names a resource that does not exist in
`resources.json`, and the dashboard warns when a declared resource is missing
required environment variables. Declare only what you actually call — the list
doubles as the access review record.

## Adding a fifth shared resource

1. Create `shared-resources/<id>/README.md`.
2. Add an entry to `resources.json` with its environment variables, marking
   credentials `"secret": true`.
3. Add the variables to `.env.example` and to `deploy/k8s/shared-resources-configmap.yaml`
   (non-secret) or `shared-resources-secret.example.yaml` (secret).

No portal or use-case code changes are required; the dashboard picks it up from
`resources.json`.

## Credential handling

- Secrets never enter Git. `.env` and `.env.local` are ignored, as is
  `deploy/k8s/shared-resources-secret.yaml`.
- The dashboard reports whether a variable is *set*. It never reads or renders
  the value of anything marked `"secret": true`.
- Prefer a distinct service account or API key per use case so access can be
  revoked without affecting the rest of the portal.
