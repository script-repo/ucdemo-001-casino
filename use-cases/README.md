# Use Cases

Every folder here is one use case. Folders prefixed with `_` are scaffolding and
are ignored by the dashboard.

```
use-cases/
├── _template/                  # copied by `npm run new:use-case`
└── <slug>/
    ├── usecase.json            # manifest — the only file the portal reads
    ├── README.md               # what it does, how to run it, who owns it
    ├── .env.example            # variables specific to this use case
    ├── web/
    │   └── Page.tsx            # default-exported React component, rendered at /use-cases/<slug>
    ├── api/                    # optional FastAPI backend
    │   ├── main.py
    │   ├── requirements.txt
    │   └── Dockerfile
    └── deploy/
        └── deployment.yaml     # only if the use case has a backend
```

## The one hard rule

**A use case never imports from another use case.** No `../other-use-case/`
imports, no shared utility package between them. If two use cases need the same
Prism Central client, each gets its own copy.

This is deliberate. It means any use case can be rewritten, upgraded to a
different library version, handed to a different team, or deleted with `rm -rf`
without a survey of what else might break. The cost is duplication; the benefit
is that the blast radius of a change is exactly one folder.

What a use case *may* import:

- `react`, `next/*`, and anything in its own folder.
- Nothing from `lib/` or `components/` — those belong to the portal shell.

`npm run validate` enforces the cross-use-case import ban.

## Adding one

```bash
npm run new:use-case incident-triage
```

That copies `_template/`, rewrites the slug, and leaves you with a use case that
already renders. Then:

1. Edit `usecase.json` — title, summary, owner, and the `resources` you actually
   call.
2. Write the UI in `web/Page.tsx`.
3. If you need a backend, keep `api/`; otherwise delete it along with `deploy/`
   and set `"api": { "enabled": false }`.
4. Run `npm run validate && npm run dev`.

No portal file needs editing. The dashboard discovers the folder, and
`/use-cases/<slug>` renders `web/Page.tsx` through a single dynamic route.

## Removing one

Delete the folder, drop the use case's vector collections (prefixed with its
slug), and revoke its NAI API key. Nothing else references it.

## Using shared resources

Read the contract in [`shared-resources/README.md`](../shared-resources/README.md).
Declare what you use in `usecase.json`, read the documented environment
variables, and vendor your own client code.
