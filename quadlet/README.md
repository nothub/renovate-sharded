# quadlet

Each shard is an instance of the Podman Quadlet template `renovate@.container`, run as a oneshot service from its own systemd timer. The shard's filter comes from `shard-<shard>.env`, its cache from the named volume `renovate-<shard>`.

## Setup

Copy the Quadlet files to their own directory and the timer to systemd:

```
install -d /etc/containers/systemd/renovate
install -m 0644 renovate@.container shard-*.env /etc/containers/systemd/renovate/
install -m 0600 .env.example /etc/containers/systemd/renovate/.env
install -m 0644 renovate@.timer /etc/systemd/system/
```

Fill in the token in `/etc/containers/systemd/renovate/.env`, then start one timer per shard:

```
systemctl daemon-reload
systemctl enable --now renovate@a.timer renovate@b.timer renovate@c.timer
```

For rootless Podman, use `~/.config/containers/systemd/renovate/` and `~/.config/systemd/user/`, `systemctl --user`, and `loginctl enable-linger` so the timers run without a login session.

To run a shard now and follow it:

```
systemctl start --no-block renovate@a.service
journalctl -fu renovate@a.service
```

## Adding a shard

Add a `shard-<shard>.env` with the filter, then enable `renovate@<shard>.timer`.

Check the generated unit after a change:

```
/usr/libexec/podman/quadlet -dryrun
```
