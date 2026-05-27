# AI Radio Station — Your Personal Non-Stop AI Music Station

> **GitHub:** [ep150de/ai-radio-station](https://github.com/ep150de/ai-radio-station)  
> A beautiful, local-first internet radio appliance for AI-generated music collections.

A minimal, beautiful, completely local, open-source radio that plays through your entire Suno catalog (hundreds or thousands of tracks) **without ever repeating** until the full cycle is complete.

Clean vintage receiver aesthetic with modern touches. One-command Docker deployment. Built for people who have generated hundreds of Suno songs and want a dedicated, always-on listening experience.

**Phase 1 + Phase 2 complete** — fully working beautiful radio + automatic DJ with station IDs and song title callouts.

- **DJ Mode** works out of the box using your browser’s built-in speech synthesis (zero setup).
- Optional: Run the included Piper container for premium natural voices.
- Sleep timer + many other quality-of-life features included.

Originally built for ~1000 Suno tracks, but designed to work with any local collection of AI-generated (or other) music.

---

## 5-Minute Quick Start

```bash
# 1. Clone
git clone <your-repo> suno-radio
cd suno-radio

# 2. Put some songs in the music folder (or symlink your whole library)
mkdir -p music
# Example: cp -r ~/Music/suno-songs/* music/     or use a symlink

# 3. Start it
docker compose up -d

# 4. Open
open http://localhost:8080
```

The first time it starts it will scan your library, create a shuffled (or ordered) playlist, and begin the non-repeating journey through every track you own.

Hit **PLAY**. That's it.

When you add more Suno downloads later, just drop them in `music/` and click **RESCAN** (or hit the `/api/rescan` button).

---

## The Vision

You have ~1000 Suno tracks. You don't want another Spotify-style library or jukebox app. You want a **dedicated radio station** that lives on your network (or a small old tablet) and simply plays beautiful music, in sequence, forever, without ever repeating the same song twice until you've heard the entire collection.

This is that station.

- Warm, calm, vintage-modern wooden radio UI (amber LEDs, cream text, real depth)
- True "play the whole catalog once before any repeats" behavior
- Survives restarts and remembers exactly where it was
- Multiple browsers/tabs all "tune in" to the same live position
- Zero cloud. Zero cost. Fully yours.

---

## UI Highlights (Phase 1)

- Beautiful centered receiver with layered bezel, soft shadows, and tactile controls
- Slowly rotating vinyl visual (modern touch on classic form)
- Clickable progress bar, big Play/Pause/Next buttons that feel physical
- Live "Cycle X • 347 / 987" display so you always know where you are in the journey
- "Up Next" strip + full searchable Catalog modal (jump anywhere without breaking the radio flow)
- Keyboard support (Space = play/pause, → or N = next)
- Volume slider + everything works great on desktop and tablets

The aesthetic is deliberately **clean and simple vintage with modern touches** — deep walnut, aged paper text, dark gold and bright amber, generous breathing room.

---

## Getting Your Suno Songs (The Hard Part Made Easy)

Suno has no official bulk export. See the complete, up-to-date guide:

**→ [tools/suno-import/README.md](tools/suno-import/README.md)**

Top recommendations (2026):
1. **Suno Manager** extension (best for most people — covers, metadata, 20k+ tracks)
2. Console script (zero permissions) + the `download.py` included here

Both paths are documented with copy-paste snippets.

---

## Architecture (Modular & Upgradable by Design)

```
client/          React + Vite + Tailwind (exact same stack as your vidmuse-local)
server/
  main.py        FastAPI (LAN CORS, health, state, control, audio streaming)
  library.py     Real mutagen + ffprobe scanner with JSON cache
  playlist.py    The heart: one-time shuffle or fixed order + cycle tracking + persistence
  streaming.py   Range-aware audio helper (easy to evolve into HLS later)
tools/suno-import/  Battle-tested downloader + decision guide
```

Everything is deliberately small and obvious. Adding a new feature (sleep timer, favorites weighting, LLM banter for Phase 2) touches one or two files.

---

## Docker & Deployment (Exactly Like Your Other Projects)

Follows the same patterns as vidmuse-local:

- Single `docker compose up -d`
- Bind-mount your real music folder (`./music`)
- State lives in `./data` (survives everything)
- Healthcheck + restart policy
- Easy to add Piper (Phase 2) via a second compose file

See `DOCKER_DEPLOYMENT.md` (coming in next pass — same tone and structure as vidmuse).

---

## Phase 2 — Automatic DJ (Completed)

Turn **DJ MODE** on and the station will intelligently speak:

- Song titles when tracks change
- Station identifications every few tracks

**Zero setup** — works immediately using your browser’s built-in speech synthesis.

**For significantly more natural voices**, enable the included Piper profile:

```bash
docker compose -f docker-compose.yml -f docker-compose.piper.yml up -d
```

The radio will automatically detect Piper and start using real generated audio. It falls back gracefully if Piper is not running.

---

## Keyboard Shortcuts (Phase 1)

- `Space` or `K` — Play / Pause
- `→` or `N` — Next track
- `R` — Force refresh state
- Click progress bar — Seek (client only for now)

---

## Roadmap (What Comes Next)

**Phase 1 (done)**
- Working non-repeating radio
- Gorgeous vintage UI
- Real metadata scanner
- Ingestion tooling + docs
- Docker one-command deploy

**Phase 2 (Completed)**
- Automatic DJ with title callouts + station IDs
- Music ducking + "DJ MODE" toggle
- Browser speech (default) + robust Piper support for premium voices
- Sleep timer

**Phase 3 (In Progress)**
- Favorites / request queue
- True gapless playback
- M3U export
- Icecast output (optional)
- Appliance installers

---

## Contributing / Philosophy

This is intentionally **minimal**. If a feature can live in a documented extension point or a future phase, it was left out of v1.

The goal is a finished, calm, heirloom-quality appliance you actually want to leave running.

MIT licensed. Use it, fork it, make your own station name and colors.

---

**Made for people with 1000 Suno songs who just want to hear them, beautifully, forever.**

Turn it on. Walk away. Let it play.
