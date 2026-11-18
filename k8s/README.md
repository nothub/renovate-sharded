# k8s

Each shard is a CronJob with its own PersistentVolumeClaim for the cache. `concurrencyPolicy: Forbid` skips a schedule while the shard's previous run is still going, so only one pod uses a claim at a time.

## Setup

Copy `.env.example` to `.env` and fill in the token. Kustomize builds the `renovate` Secret from it.

```
kubectl --context <ctx> apply -k k8s/
```

The claims use the cluster's default StorageClass. Set `storageClassName` in the `shard-*.yaml` files to use another one.

To run a shard now instead of waiting for its schedule:

```
kubectl --context <ctx> -n renovate create job --from=cronjob/renovate-a renovate-a-manual
kubectl --context <ctx> -n renovate logs -f job/renovate-a-manual
```

## Adding a shard

Copy a `shard-*.yaml`, replace the shard name in all four places and set the filter, then list the file in `kustomization.yaml`.
