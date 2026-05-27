# Docker Deployment — Suno Radio

Exactly the same philosophy and structure as your vidmuse-local setup.

## Quick Start

```bash
git clone ...
cd suno-radio

# Put your music in ./music (or symlink)
mkdir -p music data
# cp -r /path/to/your/suno-mp3s/* music/

docker compose up -d

# Open http://localhost:8080
```

## What Runs

- One container (`suno-radio`) serving both the API and the beautiful frontend
- Music folder mounted read-only
- State (`playlist.json`, library cache, future voice clips) in `./data`

## Common Commands

```bash
# Logs
docker compose logs -f radio

# Restart after adding music
docker compose restart radio

# Full rebuild (rarely needed)
docker compose down
docker compose build --no-cache
docker compose up -d

# Stop everything
docker compose down
```

## Pointing at Your Real Library

Edit `docker-compose.yml` or use an env file:

```yaml
volumes:
  - /home/you/Music/suno-complete:/music:ro
  - ./data:/data
```

Then `docker compose up -d`.

## Adding Phase 2 (Piper TTS)

Uncomment the `piper` service in `docker-compose.yml` or use the override:

```bash
docker compose -f docker-compose.yml -f docker-compose.piper.yml up -d
```

The radio server will automatically detect it when you implement the voice layer.

## Production Tips (Same as vidmuse)

- Put it on a small always-on machine, old NUC, Raspberry Pi 5, or mini PC
- Access from the whole house via Tailscale / ZeroTier / simple port forward
- For a dedicated tablet: full-screen Chrome + a cheap wall mount
- Back up `./data` if you care about exact cycle position

## Health

The container has a healthcheck. `docker ps` will show `(healthy)` when everything is good.

---

You now have a real personal radio station.
