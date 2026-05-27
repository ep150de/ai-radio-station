"""
Suno Radio — FastAPI Server (Phase 1)
Minimal, LAN-friendly appliance backend.
Follows vidmuse-local patterns for structure and CORS.
"""
import os
import time
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles

from config import (
    STATION_NAME, PORT, MUSIC_DIR, DATA_DIR,
    PLAYLIST_STATE_FILE, LIBRARY_CACHE_FILE,
)
from models import HealthResponse, Track, NowPlaying, PlaylistState
from library import scan_library, get_track_by_id
from playlist import manager as playlist_manager
from streaming import audio_file_response

# --- App setup -----------------------------------------------------------

app = FastAPI(
    title="Suno Radio",
    description="Personal non-stop streaming station for your Suno catalog. Phase 1: simple, local, beautiful.",
    version="0.1.0-phase1",
)

# LAN-friendly CORS (like vidmuse-local)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static frontend (built client) at root — Phase 1 single-container simplicity
# (We'll create a tiny placeholder index.html first; real React build later)
STATIC_DIR = Path(__file__).parent / "static"
STATIC_DIR.mkdir(exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# --- Real modules (library + playlist state machine) ---------------------

_library: list[Track] = []


def _load_library(force: bool = False) -> list[Track]:
    """Delegates to library.py scanner (with simple process cache)."""
    global _library
    if _library and not force:
        return _library
    _library = scan_library(force_rescan=force)
    return _library


def _get_state() -> dict:
    """Always go through the real QueueManager."""
    return playlist_manager.get_now_playing()


# --- Routes --------------------------------------------------------------

@app.get("/api/health", response_model=HealthResponse)
async def health():
    lib = _load_library()
    pl = _get_or_init_playlist()
    return HealthResponse(
        status="healthy",
        station_name=STATION_NAME,
        tracks_indexed=len(lib),
        current_cycle=pl.cycle,
    )


@app.get("/api/tracks")
async def get_tracks():
    """Return full library (for modal / search)."""
    lib = _load_library()
    return {"tracks": [t.model_dump() for t in lib], "total": len(lib)}


@app.get("/api/state", response_model=NowPlaying)
async def get_state():
    """Current radio state — powered by the real playlist manager."""
    data = _get_state()
    return NowPlaying(
        track=Track(**data["track"]) if data.get("track") else None,
        index=data["index"],
        total=data["total"],
        cycle=data["cycle"],
        is_playing=data["is_playing"],
        progress=0.0,
    )


@app.post("/api/control/next")
async def control_next():
    current = playlist_manager.advance(1)
    if not current:
        raise HTTPException(400, "No tracks")
    return {"ok": True, "new_index": playlist_manager.state.current_index, "cycle": playlist_manager.state.cycle}


@app.post("/api/control/play")
async def control_play():
    playlist_manager.set_playing(True)
    return {"ok": True}


@app.post("/api/control/pause")
async def control_pause():
    playlist_manager.set_playing(False)
    return {"ok": True}


@app.post("/api/control/jump")
async def control_jump(payload: dict):
    track_id = payload.get("track_id")
    if not track_id:
        raise HTTPException(400, "track_id required")
    current = playlist_manager.jump(track_id)
    if not current:
        raise HTTPException(404, "Track not found or not in active order")
    return {"ok": True, "index": playlist_manager.state.current_index}


# --- Audio streaming (Phase 1: direct file with Range support) ----------

@app.get("/audio/{track_id}")
async def stream_audio(track_id: str):
    """Serve audio with proper Range headers for seeking / scrubbing."""
    lib = _load_library()
    track = next((t for t in lib if t.id == track_id), None)
    if not track:
        raise HTTPException(404, "Track not found")

    file_path = MUSIC_DIR / track.path
    if not file_path.exists():
        raise HTTPException(404, "File missing on disk")

    return audio_file_response(file_path, track.title)


@app.post("/api/rescan")
async def rescan_library():
    """Force a fresh library scan (after adding new Suno downloads)."""
    lib = _load_library(force=True)
    # Rebuild playlist order if it is now out of sync (keeps current position best-effort)
    playlist_manager.load()  # will append newly discovered tracks
    return {"ok": True, "tracks": len(lib)}


@app.get("/api/up-next")
async def up_next(limit: int = 5):
    """Next N tracks in the current non-repeating order (for UI strip)."""
    st = playlist_manager.state
    lib = _load_library()
    id_to_track = {t.id: t for t in lib}
    result = []
    for i in range(1, limit + 1):
        idx = (st.current_index + i) % len(st.order) if st.order else 0
        tid = st.order[idx] if st.order else None
        if tid and tid in id_to_track:
            t = id_to_track[tid]
            result.append({"index": idx, "title": t.title, "artist": t.artist, "id": t.id})
    return {"up_next": result, "cycle": st.cycle}


# --- Root: tiny placeholder UI until real frontend is built -------------

@app.get("/", include_in_schema=False)
async def root():
    """Serve a minimal beautiful placeholder radio page (replaced by React build later)."""
    html = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Suno Radio — Phase 1 Bootstrap</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background: #0d0a07; color: #f4e9d8; font-family: system-ui, sans-serif; }
    .receiver { background: #1f1a14; border: 12px solid #2c261f; box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.4); }
    .led { box-shadow: 0 0 8px #ffbf00, inset 0 0 4px #b8860b; }
    .vinyl { animation: spin 4s linear infinite; animation-play-state: paused; }
    .vinyl.playing { animation-play-state: running; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body class="min-h-screen flex items-center justify-center p-8">
  <div class="max-w-2xl w-full">
    <div class="receiver rounded-3xl p-8 mx-auto">
      <div class="flex justify-between items-center mb-6">
        <div>
          <div class="text-amber-400 text-sm tracking-[4px] font-mono">FM • AI</div>
          <div class="text-4xl font-bold text-[#f4e9d8] tracking-tight">BEACON FM</div>
        </div>
        <div class="text-right">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 text-xs">
            <div class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span class="text-emerald-400">ON AIR</span>
          </div>
          <div id="cycle" class="text-[10px] text-[#c8b8a0] mt-1 font-mono">CYCLE 1 • 0 / 0</div>
        </div>
      </div>

      <div class="bg-[#0d0a07] rounded-2xl p-6 mb-6 flex gap-5 items-center">
        <div id="vinyl" class="vinyl w-28 h-28 rounded-full border-[12px] border-[#2c261f] flex-shrink-0 relative">
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-6 h-6 bg-[#1f1a14] rounded-full border border-[#4a4033]"></div>
          </div>
        </div>
        <div class="min-w-0 flex-1">
          <div id="title" class="text-2xl font-semibold truncate text-[#f4e9d8]">Loading library...</div>
          <div id="artist" class="text-[#c8b8a0] mt-0.5">Suno</div>
          <div class="mt-4 h-1 bg-[#2c261f] rounded overflow-hidden">
            <div id="progress" class="h-1 w-0 bg-[#ffbf00] transition-all" style="width:0%"></div>
          </div>
          <div class="flex justify-between text-[10px] text-[#c8b8a0] mt-1 font-mono">
            <div id="time">0:00</div><div id="total">0:00</div>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between gap-4">
        <button onclick="control('pause')" class="px-5 py-2 rounded-xl bg-[#2c261f] hover:bg-[#3a3229] active:bg-black/50 transition text-sm">PAUSE</button>
        <button onclick="control('play')" class="px-8 py-2 rounded-2xl bg-[#ffbf00] text-black font-semibold active:scale-[0.985] transition">PLAY</button>
        <button onclick="control('next')" class="px-6 py-2 rounded-xl bg-[#2c261f] hover:bg-[#3a3229] active:bg-black/50 transition text-sm">NEXT →</button>
        <button onclick="location.reload()" class="text-xs text-[#c8b8a0] hover:text-[#f4e9d8]">RESCAN</button>
      </div>
    </div>

    <div class="text-center mt-4 text-[10px] text-[#4a4033] font-mono tracking-widest">
      SUNO RADIO • PHASE 1 • LOCAL ONLY • <span id="trackcount">0</span> TRACKS
    </div>
  </div>

  <script>
    let audio = new Audio();
    let currentId = null;

    async function refresh() {
      const res = await fetch('/api/state');
      const data = await res.json();
      document.getElementById('cycle').textContent = `CYCLE ${data.cycle} • ${data.index + 1} / ${data.total}`;
      document.getElementById('trackcount').textContent = data.total;

      if (data.track) {
        document.getElementById('title').textContent = data.track.title;
        document.getElementById('artist').textContent = data.track.artist || 'Suno';
        currentId = data.track.id;
      }
    }

    async function control(action) {
      if (action === 'play') {
        await fetch('/api/control/play', {method:'POST'});
        if (currentId) {
          audio.src = `/audio/${currentId}`;
          audio.play().catch(()=>{});
        }
      } else if (action === 'pause') {
        await fetch('/api/control/pause', {method:'POST'});
        audio.pause();
      } else if (action === 'next') {
        const r = await fetch('/api/control/next', {method:'POST'});
        const d = await r.json();
        await refresh();
        if (currentId) {
          audio.src = `/audio/${currentId}`;
          audio.play().catch(()=>{});
        }
      }
      refresh();
    }

    audio.addEventListener('ended', () => control('next'));
    audio.addEventListener('timeupdate', () => {
      const p = document.getElementById('progress');
      if (audio.duration) p.style.width = (audio.currentTime / audio.duration * 100) + '%';
      document.getElementById('time').textContent = format(audio.currentTime);
      document.getElementById('total').textContent = format(audio.duration || 0);
    });

    function format(s) {
      const m = Math.floor(s / 60);
      const sec = Math.floor(s % 60);
      return m + ':' + (sec < 10 ? '0' : '') + sec;
    }

    // Boot
    (async () => {
      await refresh();
      const lib = await fetch('/api/tracks').then(r => r.json());
      if (lib.tracks?.length && !currentId) {
        currentId = lib.tracks[0].id;
      }
      setInterval(refresh, 8000);
    })();
  </script>
</body>
</html>"""
    return StreamingResponse(html, media_type="text/html")


# --- Startup -------------------------------------------------------------

@app.on_event("startup")
async def on_startup():
    print(f"[suno-radio] Starting — station: {STATION_NAME}")
    print(f"[suno-radio] Music dir: {MUSIC_DIR}  (exists: {MUSIC_DIR.exists()})")
    print(f"[suno-radio] Data dir:  {DATA_DIR}")
    lib = _load_library()
    playlist_manager.load()   # ensures one-time shuffle + persisted order
    print(f"[suno-radio] Ready on :{PORT} — {len(lib)} tracks indexed (playlist ready)")
