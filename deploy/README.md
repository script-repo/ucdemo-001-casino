# Deploying

Everything runs on Nutanix Kubernetes Platform in the `casino-ai-portal` namespace.

## What deploys where

| Component | Runtime | Manifest |
| --- | --- | --- |
| Portal (dashboard + all use-case UIs) | `node:24-alpine` running a bundle staged on a volume | `k8s/portal.yaml` |
| Use-case backend | `use-cases/<slug>/api/Dockerfile` | `use-cases/<slug>/deploy/deployment.yaml` |

The portal runs the Next.js standalone bundle off a ReadWriteMany volume rather
than from its own image, because this cluster has no registry to push to. The
root `Dockerfile` is still the correct build once a registry exists — see
"Switching to an image" below.

The portal is a single deployment. Adding a use-case UI does not add a
deployment — it ships inside the portal image. Only use cases with an `api/`
folder get their own workload.

## First-time setup

```bash
kubectl apply -f k8s/namespace.yaml

# Credentials, created out of band so they never enter Git.
kubectl create secret generic shared-resources -n casino-ai-portal \
  --from-literal=PRISM_CENTRAL_PASSWORD='...' \
  --from-literal=NAI_API_KEY='...' \
  --from-literal=VECTOR_DB_API_KEY='...'

kubectl apply -f k8s/shared-resources-configmap.yaml
```

## Deploying the portal

Build locally, stage the bundle onto the volume, then restart the Deployment.
`k8s/portal.yaml` creates the `ai-portal-app` volume, the Deployment, and the
NodePort Service; the bundle is what makes it serve anything.

```powershell
npm run build

# Assemble what the Dockerfile's runner stage would have copied.
$stage = ".deploy-bundle"
Remove-Item $stage -Recurse -Force -ErrorAction Ignore
robocopy ".next\standalone"  $stage                 /E /NFL /NDL /NJH /NJS /NP
robocopy ".next\static"      "$stage\.next\static"  /E /NFL /NDL /NJH /NJS /NP
robocopy "shared-resources"  "$stage\shared-resources" /E /NFL /NDL /NJH /NJS /NP
robocopy "use-cases"         "$stage\use-cases"     /E /NFL /NDL /NJH /NJS /NP
tar -czf portal-bundle.tgz -C $stage .
```

`shared-resources/` and `use-cases/` are copied explicitly because the dashboard
reads those JSON files at request time rather than bundling them.

```bash
kubectl apply -f k8s/portal.yaml
kubectl apply -f k8s/portal-seed-pod.yaml
kubectl wait --for=condition=Ready pod/portal-seed -n casino-ai-portal --timeout=180s

kubectl cp portal-bundle.tgz casino-ai-portal/portal-seed:/bundle/portal-bundle.tgz
kubectl exec portal-seed -n casino-ai-portal -- sh -c \
  'cd /bundle && tar -xzf portal-bundle.tgz && rm -f portal-bundle.tgz \
   && mkdir -p /bundle/.next/cache && chmod -R a+rX /bundle'

kubectl delete pod portal-seed -n casino-ai-portal
kubectl rollout restart deploy/ai-portal -n casino-ai-portal
```

Run `kubectl cp` from the repo root with a relative path — an absolute Windows
path contains a colon, which `kubectl cp` reads as its own source/target
separator.

The volume is ReadWriteMany, so restaging does not require stopping the running
portal; the Deployment mounts it read-only and picks up the new bundle on
restart.

### Switching to an image

Once a registry is reachable, build the root `Dockerfile`, push it, and in
`k8s/portal.yaml` replace `image`, `command`, `workingDir`, and the `app` volume
with a single `image:` reference. Nothing else changes — the env wiring, probes,
and Service stay as they are.

## Deploying everything with kustomize

```bash
kubectl apply -k k8s/
```

`k8s/kustomization.yaml` lists each use-case backend manifest. That one line is
the only place outside a use case's own folder that mentions it.

## Configuration flow

```
shared-resources/resources.json   declares the variables
  ├── .env.example                local development
  └── deploy/k8s/
        ├── shared-resources-configmap.yaml   non-secret values
        └── shared-resources (Secret)          credentials, created out of band
              └── envFrom  →  portal pod and every use-case backend pod
```

Adding a shared-resource variable means touching `resources.json`,
`.env.example`, and the ConfigMap or Secret. The dashboard's readiness panel
picks it up with no code change.

## Verifying

```bash
kubectl -n casino-ai-portal get pods
kubectl -n casino-ai-portal logs deploy/ai-portal
```

The Service is a NodePort on **30007**, reachable on any node IP — for the
current cluster, <http://10.42.156.115:30007>. NodePort answers on every node,
so any of them works:

```bash
kubectl get nodes -o wide          # any INTERNAL-IP will serve port 30007
```

Then open the portal and check the shared-resources panel — anything showing
"Not configured" names the exact variables that are missing.
