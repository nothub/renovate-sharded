# compose

Each shard is a compose service and runs from its own systemd timer.

## Setup

Copy the files to `/opt/services/renovate/`, copy `.env.example` to `.env` there (mode `0600`) and fill in the token.

Install the units and start one timer per shard:

```
systemctl link /opt/services/renovate/renovate@.service /opt/services/renovate/renovate@.timer
systemctl enable --now renovate@a.timer renovate@b.timer renovate@c.timer
```

`systemctl link` needs the file name to match the unit name, so keep the `renovate@.*` names.

## Adding a shard

Add a service with its own `RENOVATE_BASE_DIR` and filter, then enable `renovate@<shard>.timer`.

Check a change before enabling it. Every repo should appear in exactly one shard's discovered list:

```
docker compose config
docker compose run --rm -e LOG_LEVEL=debug -e RENOVATE_DRY_RUN=extract renovate-a
```
