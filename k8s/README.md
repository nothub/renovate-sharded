# k8s

One CronJob with a PersistentVolumeClaim for the cache. Each run starts the shards inside the one pod. `concurrencyPolicy: Forbid` skips a schedule while the previous run is still going, so only one pod uses the claim at a time.

## Setup

Copy `.env.example` to `.env` and fill in the token. Kustomize builds the `renovate` Secret from it.

`shard.mjs` is a symlink to the repo root, which kustomize refuses to load by default, so build with the load restrictor off:

```
kubectl kustomize --load-restrictor LoadRestrictionsNone k8s/ | kubectl --context <ctx> apply -f -
```

The claim uses the cluster's default StorageClass. Set `storageClassName` in `renovate.yaml` to use another one.

To run now instead of waiting for the schedule:

```
kubectl --context <ctx> -n renovate create job --from=cronjob/renovate renovate-manual
kubectl --context <ctx> -n renovate logs -f job/renovate-manual
```
