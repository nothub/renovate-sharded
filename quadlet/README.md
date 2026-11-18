# quadlet

One Podman Quadlet container, run as a oneshot service from a systemd timer. Each run starts the shards inside the one container.

## Setup

Copy the Quadlet files to their own directory and the timer to systemd. `install` copies `shard.mjs` instead of the symlink:

```
install -d /etc/containers/systemd/renovate
install -m 0644 renovate.container shard.mjs /etc/containers/systemd/renovate/
install -m 0600 .env.example /etc/containers/systemd/renovate/.env
install -m 0644 renovate.timer /etc/systemd/system/
```

Fill in the token in `/etc/containers/systemd/renovate/.env`, then start the timer:

```
systemctl daemon-reload
systemctl enable --now renovate.timer
```

For rootless Podman, use `~/.config/containers/systemd/renovate/` and `~/.config/systemd/user/`, `systemctl --user`, and `loginctl enable-linger` so the timer runs without a login session.

To run now and follow it:

```
systemctl start --no-block renovate.service
journalctl -fu renovate.service
```

Check the generated unit after a change:

```
/usr/libexec/podman/quadlet -dryrun
```
