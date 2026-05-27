# Suno Radio Roadmap

## Phase 1 — Core Appliance (Completed)

- [x] Non-repeating catalog playback engine
- [x] Real metadata scanning (mutagen + ffprobe)
- [x] Persisted state across restarts
- [x] Beautiful vintage-modern receiver UI (walnut/amber)
- [x] Working Docker deployment
- [x] Ingestion guide + practical downloader tool
- [x] Keyboard support + library jump
- [x] "Tune in" behavior for multiple clients

## Phase 2 — The DJ (Next)

- [ ] Piper TTS container (already in compose skeleton)
- [ ] `server/voice.py` with clean provider interface
- [ ] Station ID + title callouts between tracks or on timer
- [ ] Client-side ducking or server-side mix
- [ ] UI toggles ("DJ Mode", voice volume)
- [ ] Optional local LLM banter using original Suno prompts

## Phase 3 — Polish & Broadcast

- [ ] Sleep timer
- [ ] Favorites / request queue from the web UI
- [ ] True gapless (server-side crossfade or HLS)
- [ ] Optional Icecast / liquidsoap output for real multi-room / public station
- [ ] M3U export of current order
- [ ] Windows / Mac / Linux "appliance" single-binary builds (Tauri or PyInstaller + tray)

## Phase 4 — Community & Extensions

- [ ] Theming (different wood grains, "night mode", CRT overlay toggle)
- [ ] Per-track notes / custom metadata editor
- [ ] Web request form (visitors can ask for a song)
- [ ] Analytics (how many cycles completed, most played, etc.)

---

**Guiding principle**: Keep the core experience dead simple and calm. Every new feature must feel like it belongs in a beautiful wooden radio from 1963 that happens to understand AI music.
