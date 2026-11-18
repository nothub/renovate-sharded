# compose

One compose service, run by a systemd timer. Each run starts the shards inside the one container.

## Setup

Copy the files to `/opt/services/renovate/` with `cp -L`, so `shard.mjs` is copied instead of the symlink. Copy `.env.example` to `.env` there (mode `0600`) and fill in the token.

Install the units and start the timer:

```
systemctl link /opt/services/renovate/renovate.service /opt/services/renovate/renovate.timer
systemctl enable --now renovate.timer
```

`systemctl link` needs the file name to match the unit name, so keep the `renovate.*` names.

To run now instead of waiting for the timer:

```
systemctl start --no-block renovate.service
journalctl -fu renovate.service
```
