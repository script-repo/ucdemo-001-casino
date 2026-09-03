# GitOps deployment

The deployable application currently consists of one container image:

```text
ghcr.io/script-repo/ucdemo-001-casino/portal
```

The six active use-case backends are designs only; they do not have runnable
`api/` directories and are therefore not published as empty containers.

## Flow

1. A change to portal inputs on `main` triggers
   `.github/workflows/publish-portal.yml`.
2. GitHub Actions builds `linux/amd64`, publishes `main` and immutable
   `sha-<full-commit>` tags to GHCR, and attests the image.
3. The workflow updates this environment's `newTag` to the immutable SHA tag
   and commits that desired state to `main`.
4. Flux polls the public repository and reconciles
   `deploy/gitops/db-project-001/` into the `db-project-001` namespace.

The `main` tag is a convenience tag. Flux deploys the immutable SHA tag written
to `kustomization.yaml`.

## Bootstrap

Flux is already installed on NKP. Bootstrap this repository once:

```bash
kubectl apply -f deploy/flux/db-project-001-sync.yaml
```

After bootstrap, do not apply the application overlay manually. Change Git,
allow GitHub Actions to publish the image and update its tag, then let Flux
reconcile.

## Frontend

- Two replicas
- NodePort `30007`
- No PVC: application files are inside the image
- Non-secret environment metadata comes from `portal-config`
- A restricted ServiceAccount may read and patch only
  `shared-resource-settings`; it cannot list, create, or delete Secrets

## Shared-resource settings

The resources page can save write-only values into the
`shared-resource-settings` Secret. Flux creates the metadata-only object using
merge-style server-side apply, so reconciliation does not erase keys written by
the portal.

Values are not injected into the frontend process and are never returned to the
browser. The server reads key names directly from the Kubernetes API to report
configured status.

This lab deployment deliberately has no user authentication. Anyone who can
reach NodePort `30007` can replace or clear allowlisted resource settings. The
Kubernetes Role limits the blast radius to one named Secret, but it does not
make the endpoint authenticated.

The NodePort is reachable at port `30007` on any NKP node IP.

## Package visibility

The GHCR package must be public for an unauthenticated NKP pull. If it is kept
private, create an `imagePullSecret` out of band and reference it from the
Deployment; never commit registry credentials.
