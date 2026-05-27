"""
Suno Radio — Library Scanner & Metadata (Phase 1)
- Recursive scan of MUSIC_DIR
- mutagen for title/artist/album (excellent for MP3s from Suno exports)
- ffprobe fallback for duration when mutagen doesn't have it
- Simple JSON cache for fast restarts (1000 tracks should be <50ms)
- Graceful fallbacks for poor metadata (common with Suno downloads)
"""
import hashlib
import json
import subprocess
from pathlib import Path
from typing import Optional

from mutagen import File as MutagenFile
from mutagen.easyid3 import EasyID3
from mutagen.id3 import ID3NoHeaderError

from config import MUSIC_DIR, LIBRARY_CACHE_FILE, AUDIO_EXTENSIONS
from models import Track


def _ffprobe_duration(path: Path) -> float:
    """Fast duration via ffprobe (seconds, float)."""
    try:
        cmd = [
            "ffprobe", "-v", "error", "-show_entries",
            "format=duration", "-of",
            "default=noprint_wrappers=1:nokey=1", str(path)
        ]
        out = subprocess.check_output(cmd, stderr=subprocess.DEVNULL, text=True, timeout=4)
        return float(out.strip())
    except Exception:
        return 0.0


def _extract_metadata(path: Path) -> tuple[str, str, Optional[str], float]:
    """
    Return (title, artist, album, duration).
    Tries mutagen first (ID3 / Vorbis comments), falls back gracefully.
    """
    title = path.stem.replace("_", " ").replace("-", " ").title()
    artist = "Suno"
    album = None
    duration = 0.0

    try:
        audio = MutagenFile(str(path), easy=True)
        if audio is not None:
            # Title
            if "title" in audio:
                title = str(audio["title"][0]).strip() or title
            # Artist
            if "artist" in audio:
                artist = str(audio["artist"][0]).strip() or artist
            elif "albumartist" in audio:
                artist = str(audio["albumartist"][0]).strip() or artist
            # Album
            if "album" in audio:
                album = str(audio["album"][0]).strip() or None

            # Duration from mutagen when available
            if audio.info and getattr(audio.info, "length", 0):
                duration = float(audio.info.length)
    except ID3NoHeaderError:
        pass
    except Exception:
        # Corrupt or unsupported tag — fall through to filename + ffprobe
        pass

    if duration <= 0.1:
        duration = _ffprobe_duration(path)

    return title, artist, album, duration


def _stable_id(rel_path: str) -> str:
    """Short stable ID from relative path (so renames don't break state)."""
    return "t_" + hashlib.md5(rel_path.encode()).hexdigest()[:10]


def scan_library(force_rescan: bool = False) -> list[Track]:
    """
    Main entry point. Returns list of Track objects.
    Uses on-disk JSON cache unless force_rescan=True.
    """
    if not force_rescan and LIBRARY_CACHE_FILE.exists():
        try:
            data = json.loads(LIBRARY_CACHE_FILE.read_text())
            tracks = [Track(**item) for item in data]
            if tracks:
                return tracks
        except Exception:
            pass  # cache corrupt — rescan

    if not MUSIC_DIR.exists():
        return []

    tracks: list[Track] = []
    seen = set()

    for ext in AUDIO_EXTENSIONS:
        for p in sorted(MUSIC_DIR.rglob(f"*{ext}")):
            if not p.is_file():
                continue
            rel = str(p.relative_to(MUSIC_DIR))
            if rel in seen:
                continue
            seen.add(rel)

            title, artist, album, duration = _extract_metadata(p)
            size = p.stat().st_size

            track = Track(
                id=_stable_id(rel),
                path=rel,
                title=title,
                artist=artist,
                album=album,
                duration=duration,
                size=size,
            )
            tracks.append(track)

    # Persist cache
    try:
        LIBRARY_CACHE_FILE.write_text(
            json.dumps([t.model_dump() for t in tracks], indent=2)
        )
    except Exception:
        pass

    return tracks


def get_track_by_id(track_id: str, tracks: Optional[list[Track]] = None) -> Optional[Track]:
    if tracks is None:
        tracks = scan_library()
    return next((t for t in tracks if t.id == track_id), None)


def rescan_and_return() -> list[Track]:
    """Force a fresh scan (used by API rescan endpoint later)."""
    return scan_library(force_rescan=True)
