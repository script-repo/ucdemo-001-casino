# __TITLE__

> Replace this file with a real description. Keep it short enough that someone
> new can decide in thirty seconds whether this use case is what they need.

## What it does

Describe the user-facing behaviour and the problem it solves.

## Shared resources used

List each resource from `shared-resources/resources.json` this use case calls,
and what it does with it. Keep this in sync with `resources` in `usecase.json`.

| Resource | Used for |
| --- | --- |
| _(none yet)_ | |

## Running locally

```bash
# UI only — served by the portal at /use-cases/__SLUG__
npm run dev

# Backend, if this use case has one
cd use-cases/__SLUG__/api
python -m venv .venv && .venv/Scripts/activate   # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8100
```

Copy `.env.example` to the repo root `.env.local` (or export the variables) so
both the UI and backend can see them.

## Owner

Team or individual accountable for this use case, and how to reach them.
