# Document Intelligence

Retrieval-augmented search over internal policy and contract libraries.

## What it does

Users ask a question; the use case embeds it with Nutanix Enterprise AI,
retrieves the nearest passages from its own vector collections, and generates an
answer that cites the passages it used.

This use case is currently UI only — there is no `api/` folder, and
`usecase.json` sets `"api": { "enabled": false }`. Retrieval runs in server
components and server actions inside `web/`. If it outgrows that, add an `api/`
folder using `use-cases/_template/api/` as the starting point.

## Shared resources used

| Resource | Used for |
| --- | --- |
| Nutanix Enterprise AI | Embeddings (`NAI_EMBEDDING_MODEL`) and answer generation |
| Vector Database | Collections `document-intelligence__policies` and `document-intelligence__contracts` |

Both collections carry the slug prefix required by
`shared-resources/vector-db/README.md`. This use case reads no other collection.

## Running locally

```bash
npm run dev
```

Then open http://localhost:3000/use-cases/document-intelligence. The counts shown
are placeholders until the retrieval layer is wired to the vector database.

## Re-embedding

Changing `NAI_EMBEDDING_MODEL` invalidates the collections. Write to
`document-intelligence__policies_v2`, verify recall, then swap the name in this
folder and drop the old collection.

## Owner

Knowledge Management.
