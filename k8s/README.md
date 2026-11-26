# k8s

One CronJob with a PersistentVolumeClaim for the cache. Each run starts the shards inside the one pod. `concurrencyPolicy: Forbid` skips a schedule while the previous run is still going, so only one pod uses the claim at a time.

## Setup

Copy `.env.example` to `.env` and fill in the token. Kustomize builds the `renovate` Secret from it.

```
kubectl --context <ctx> apply -k k8s/
```

The claim uses the cluster's default StorageClass. Set `storageClassName` in `renovate.yaml` to use another one.

To run now instead of waiting for the schedule:

```
kubectl --context <ctx> -n renovate create job --from=cronjob/renovate renovate-manual
kubectl --context <ctx> -n renovate logs -f job/renovate-manual
```

`concurrencyPolicy: Forbid` counts only Jobs the CronJob created itself, so a manual Job can overlap a scheduled run, and both pods then share the cache claim. Check that no `renovate` pod is running before you create one.
