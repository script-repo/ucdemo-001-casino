# Model Registry

MLflow tracking server and model registry on NKP, in namespace
`casino-ai-portal`, at `http://mlflow.casino-ai-portal.svc.cluster.local:5000`.

## Why it is a shared resource

Because `model_version` is a shared contract column. `analytics.player_scores`
and `analytics.decision_log` both carry it, and it is an MLflow run id. Without a
single registry, that column would mean something different depending on which
use case wrote it, and the auditability principle would not hold.

Everything else about model development stays private to each use case: its own
training job, its own features, its own algorithm. The registry is the one shared
point, and it is shared because the audit trail requires it.

## What each use case registers

| | |
| --- | --- |
| Experiment | `<prefix>-<slug>`, e.g. `casino-predictive-ltv-scoring` |
| Run | One per training execution, with parameters, metrics, and the training window |
| Registered model | One per use case, versioned |
| Stage | Promotion to production is a **human action**, never automatic |

That last row is deliberate and consistent across the portfolio. Nightly
calibration and accuracy jobs report drift; none of them promotes or rolls back a
model on its own. A regulated decision path should not change models without
someone accepting the change.

## Users

Three of the six use cases train models: predictive LTV scoring, churn-risk
modeling, and revenue management.

The dynamic offer engine and win-back campaigns register nothing — their
intelligence comes from the scores the first two produce, which is the point of
the score contract. They still *write* `model_version` into `decision_log`, but
they write the version of the score they consumed, not one of their own.

Slot & table performance trains nothing at pilot; it is a peer-comparison
analytics surface.

## Environment

| Variable | Required | Secret |
| --- | --- | --- |
| `MLFLOW_TRACKING_URI` | yes | no |
| `MLFLOW_EXPERIMENT_PREFIX` | no | no |
| `MLFLOW_TRACKING_TOKEN` | no | **yes** |

## Artifact storage

Backed by a PVC on `nai-nfs-storage` (RWX), so training jobs and scoring jobs on
different nodes can both reach artifacts.

## Status

Not yet deployed.
