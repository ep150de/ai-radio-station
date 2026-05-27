"""
Suno Radio — Pydantic models (shared between API and internal logic)
"""
from typing import Optional, Literal
from pydantic import BaseModel, Field


class Track(BaseModel):
    """A single audio track in the library."""
    id: str
    path: str                    # Relative path from MUSIC_DIR (stable key)
    title: str
    artist: str = "Suno"
    album: Optional[str] = None
    duration: float = 0.0        # seconds
    size: int = 0                # bytes
    cover_path: Optional[str] = None  # relative if we ever store art


class PlaylistState(BaseModel):
    """Persisted radio state — survives restarts."""
    version: int = 1
    order: list[str]             # List of track IDs (shuffled once or user order)
    current_index: int = 0
    cycle: int = 1               # How many full plays through the catalog
    is_playing: bool = False
    last_position: float = 0.0   # Seconds into current track (for future resume)


class ApiTrack(Track):
    """Track as returned by API (adds stream URL helper)."""
    stream_url: Optional[str] = None


class NowPlaying(BaseModel):
    track: Optional[Track] = None
    index: int = 0
    total: int = 0
    cycle: int = 1
    is_playing: bool = False
    progress: float = 0.0        # 0.0–1.0


class ControlAction(BaseModel):
    action: Literal["play", "pause", "next", "prev", "jump"]
    track_id: Optional[str] = None


class HealthResponse(BaseModel):
    status: Literal["healthy", "degraded"] = "healthy"
    station_name: str
    tracks_indexed: int
    current_cycle: int
    version: str = "0.1.0-phase1"
