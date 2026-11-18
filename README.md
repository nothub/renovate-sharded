# renovate-sharded

Self-hosted [Renovate](https://docs.renovatebot.com/) with autodiscovered repos split across several concurrent shards.

## Deployments

| Directory              | Runs on                                    |
|------------------------|--------------------------------------------|
| [`compose/`](compose/) | one host, Docker Compose + systemd timers  |
| [`quadlet/`](quadlet/) | one host, Podman Quadlets + systemd timers |
| [`k8s/`](k8s/)         | Kubernetes, one CronJob per shard          |

## Shards

The filters must cover every repo exactly once. Each filter matches the first character of the repo name. The last shard uses a negated character class, so it takes everything the others do not, including names starting with `.`, `_` or `-`.

| Shard | Filter                       |
|-------|------------------------------|
| a     | `/^nothub\/[0-9a-f]/i`       |
| b     | `/^nothub\/[g-m]/i`          |
| c     | `/^nothub\/[^0-9a-m]/i`      |

## Tradeoffs

- All shards share one token and its GitHub API rate limit, so N shards use it up to N times faster.
- Each shard has its own cache, so registry lookups are repeated per shard. A shared Redis (`RENOVATE_REDIS_URL`) would dedupe them.
