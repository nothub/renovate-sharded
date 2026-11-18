# renovate-sharded

Self-hosted [Renovate](https://docs.renovatebot.com/) with autodiscovered repos split across several concurrent shards.

## Deployments

| Directory              | Runs on                                  |
|------------------------|------------------------------------------|
| [`compose/`](compose/) | One host, Docker Compose + systemd timer |
| [`quadlet/`](quadlet/) | One host, Podman Quadlet + systemd timer |
| [`k8s/`](k8s/)         | Kubernetes, one CronJob                  |

All three run the stock Renovate image with [`shard.mjs`](shard.mjs) mounted as its command.

## Shards

Each run, `shard.mjs` does the following:

1. It runs `renovate --write-discovered-repos`. Autodiscover and `autodiscoverFilter` work as usual.
2. It picks the shard count as `clamp(ceil(repos / SHARD_SIZE), SHARDS_MIN, SHARDS_MAX)`.
3. It cuts the sorted repo list into that many equal chunks.
4. It runs one Renovate process per chunk in parallel and waits for all of them. Each process gets its own base dir `<RENOVATE_BASE_DIR>/<shard>`.

| Variable     | Default | Meaning                    |
|--------------|---------|----------------------------|
| `SHARD_SIZE` | `25`    | target repos per shard     |
| `SHARDS_MIN` | `1`     | lower bound of the count   |
| `SHARDS_MAX` | `4`     | upper bound of the count   |

With the defaults, 100 repos run as 4 shards of 25.

A new repo shifts at most one repo per chunk boundary, so most repos keep their shard and its cache. When the shard count changes, most repos move and get one run with a cold cache.

## Tradeoffs

- All shards share one token and its GitHub API rate limit, so N shards use it up to N times faster.
- Each shard has its own cache, so registry lookups are repeated per shard. A shared Redis (`RENOVATE_REDIS_URL`) would dedupe them.
- A run ends when its slowest shard ends, and the next run waits for that.
- All shards run in one container, so its memory use grows with the shard count.
