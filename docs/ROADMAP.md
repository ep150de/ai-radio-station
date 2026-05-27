# AI Radio Station Roadmap

## Phase 1 — Core Appliance (Completed)

- [x] Non-repeating catalog playback engine
- [x] Real metadata scanning (mutagen + ffprobe)
- [x] Persisted state across restarts
- [x] Beautiful vintage-modern receiver UI (walnut/amber)
- [x] Working Docker deployment
- [x] Ingestion guide + practical downloader tool
- [x] Keyboard support + library jump
- [x] "Tune in" behavior for multiple clients

## Phase 2 — The DJ (Completed)

**Two-tier voice system** (browser speech by default, real audio when Piper is enabled):

- [x] Automatic title callouts + station ID bumpers
- [x] Scheduling (every N tracks)
- [x] `server/voice.py` with clean `PiperProvider` + `BrowserSpeechProvider`
- [x] Music ducking during speech (Web Audio)
- [x] UI toggle ("DJ MODE") + live speaking indicator
- [x] Voice volume control + "Test DJ Voice" button
- [x] Robust Piper integration with health checks (when `docker-compose.piper.yml` is used)
- [x] Graceful fallback to browser speech synthesis when Piper is unavailable

**How to get premium voices**:
```bash
docker compose -f docker-compose.yml -f docker-compose.piper.yml up -d
```

## Phase 3 — Polish & Broadcast (In Progress)

- [x] Sleep timer with gentle fade-out
- [x] M3U export of current non-repeating playlist order
- [x] Basic Favorites system (star tracks in catalog, persisted)
- [x] Listener Request Queue (submit requests + operator management with Play Now)
- [ ] True gapless (server-side crossfade or HLS)
- [ ] Optional Icecast / liquidsoap output for real multi-room / public station
- [ ] Windows / Mac / Linux "appliance" single-binary builds (Tauri or PyInstaller + tray)

## Phase 4 — Community & Extensions

- [ ] Theming (different wood grains, "night mode", CRT overlay toggle)
- [ ] Per-track notes / custom metadata editor
- [ ] Web request form (visitors can ask for a song)
- [ ] Analytics (how many cycles completed, most played, etc.)

---

**Guiding principle**: Keep the core experience dead simple and calm. Every new feature must feel like it belongs in a beautiful wooden radio from 1963 that happens to understand AI music.
