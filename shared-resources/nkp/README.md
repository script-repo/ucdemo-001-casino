# Nutanix Kubernetes Platform (NKP)

The workload cluster that runs the portal and every use-case backend. Some use
cases also talk to the Kubernetes API directly to schedule jobs or read workload
state.

## Environment variables

| Variable | Required | Secret | Notes |
| --- | --- | --- | --- |
| `NKP_CLUSTER_NAME` | yes | no | Workload cluster name, e.g. `nkp-ai-prod` |
| `NKP_API_SERVER` | yes | no | API server URL, e.g. `https://nkp-ai-prod.lab.example.com:6443` |
| `NKP_NAMESPACE` | yes | no | Namespace owning the portal, e.g. `ai-portal` |
| `NKP_KUBECONFIG` | no | yes | Path to a kubeconfig; omit in cluster |

## Access pattern

In cluster, use the projected service account token at
`/var/run/secrets/kubernetes.io/serviceaccount/` rather than a kubeconfig. The
official client libraries pick this up automatically:

```python
from kubernetes import config
try:
    config.load_incluster_config()
except config.ConfigException:
    config.load_kube_config(config_file=os.environ["NKP_KUBECONFIG"])
```

Grant each use-case backend its own ServiceAccount and Role. The portal's own
ServiceAccount should not be reused for use-case workloads.

## Conventions

- **One namespace, per-use-case ServiceAccounts.** Everything lands in
  `$NKP_NAMESPACE`; isolation comes from RBAC, not from extra namespaces.
- **Label everything** with `app.kubernetes.io/part-of: ai-use-case-portal` and
  `ai-portal.nutanix.com/use-case: <slug>` so cost and usage can be attributed.
- **GPU workloads** must set a node selector or toleration for the GPU pool
  rather than relying on default scheduling.
- **Resource requests are mandatory.** Unbounded pods get evicted first.

## Verifying connectivity

```bash
kubectl --context "$NKP_CLUSTER_NAME" -n "$NKP_NAMESPACE" get pods
kubectl --context "$NKP_CLUSTER_NAME" auth can-i list pods -n "$NKP_NAMESPACE"
```

## Deploying

Manifests live in `deploy/k8s/`. See the root `README.md` for the deployment
flow.
