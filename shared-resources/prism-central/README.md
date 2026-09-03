# Nutanix Prism Central

Control plane for the Nutanix estate. Use cases query it for infrastructure
inventory, capacity, and events that give AI features real operational context.

## Environment variables

| Variable | Required | Secret | Notes |
| --- | --- | --- | --- |
| `PRISM_CENTRAL_ENDPOINT` | yes | no | Base URL including port, e.g. `https://pc.lab.example.com:9440` |
| `PRISM_CENTRAL_USERNAME` | yes | no | Least-privilege service account |
| `PRISM_CENTRAL_PASSWORD` | yes | yes | Sourced from the `shared-resources` Secret in cluster |
| `PRISM_CENTRAL_INSECURE_TLS` | no | no | `true` only for lab endpoints with self-signed certs |

## Access pattern

The v4 APIs use HTTP Basic auth over TLS. A minimal client is roughly:

```python
import base64, os, httpx

def prism_client() -> httpx.Client:
    token = base64.b64encode(
        f"{os.environ['PRISM_CENTRAL_USERNAME']}:{os.environ['PRISM_CENTRAL_PASSWORD']}".encode()
    ).decode()
    return httpx.Client(
        base_url=os.environ["PRISM_CENTRAL_ENDPOINT"],
        headers={"Authorization": f"Basic {token}", "Accept": "application/json"},
        verify=os.getenv("PRISM_CENTRAL_INSECURE_TLS", "false").lower() != "true",
        timeout=30.0,
    )
```

Copy this into your use case's `api/` folder and adapt it. Do not import it from
here.

## Conventions

- **Read by default.** Listing VMs, hosts, clusters, and metrics is fair game.
  Power operations, deletions, and category changes must sit behind an explicit
  user confirmation in the use-case UI.
- **Paginate.** v4 list endpoints cap page size; always follow `$page`/`$limit`
  rather than assuming one response holds everything.
- **Cache.** Inventory changes slowly. Cache list responses for at least 60
  seconds so a busy dashboard does not hammer the control plane.

## Verifying connectivity

```bash
curl -sk -u "$PRISM_CENTRAL_USERNAME:$PRISM_CENTRAL_PASSWORD" \
  "$PRISM_CENTRAL_ENDPOINT/api/clustermgmt/v4.0/config/clusters?\$limit=1" | head
```

A `401` means the credentials are wrong; a hang usually means the pod has no
network route to the management network.
