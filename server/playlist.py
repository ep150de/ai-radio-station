"""
Suno Radio — Playlist / Radio State Machine (Phase 1)
The core of the "non-stop, no-repeat until full catalog played" promise.

Design goals:
- One-time shuffle (or fixed order) generated on first run.
- Persists current position + cycle count across restarts.
- Simple, testable, no external DB.
- Easy to extend later (favorites weighting, user re-order, etc.).
"""
import json
import random
from pathlib import Path
from typing import Optional

from config import PLAYLIST_STATE_FILE, DEFAULT_SHUFFLE
from models import PlaylistState, Track
from library import scan_library


class QueueManager:
    def __init__(self):
        self._state: Optional[PlaylistState] = None
        self._tracks: list[Track] = []

    def _load_tracks(self, force: bool = False) -> list[Track]:
        if not self._tracks or force:
            self._tracks = scan_library(force_rescan=force)
        return self._tracks

    def load(self) -> PlaylistState:
        """Load persisted state or create fresh on first boot."""
        if self._state is not None:
            return self._state

        tracks = self._load_tracks()

        if PLAYLIST_STATE_FILE.exists():
            try:
                raw = json.loads(PLAYLIST_STATE_FILE.read_text())
                state = PlaylistState(**raw)
                # Validate order still matches current library (some files may have been added/removed)
                valid_ids = {t.id for t in tracks}
                state.order = [tid for tid in state.order if tid in valid_ids]
                # If library grew, append new tracks to end (preserves "listened" feeling)
                existing = set(state.order)
                for t in tracks:
                    if t.id not in existing:
                        state.order.append(t.id)
                if not state.order:
                    state.order = [t.id for t in tracks]
                self._state = state
                self._save()
                return self._state
            except Exception:
                # Corrupt state — fall through to fresh creation
                pass

        # Fresh creation
        order = [t.id for t in tracks]
        if DEFAULT_SHUFFLE and len(order) > 1:
            random.seed()  # good enough; user can reshuffle via future API
            random.shuffle(order)

        self._state = PlaylistState(
            order=order,
            current_index=0,
            cycle=1,
            is_playing=False,
        )
        self._save()
        return self._state

    def _save(self) -> None:
        if self._state:
            PLAYLIST_STATE_FILE.write_text(self._state.model_dump_json(indent=2))

    @property
    def state(self) -> PlaylistState:
        if self._state is None:
            return self.load()
        return self._state

    def current(self) -> Optional[Track]:
        st = self.state
        tracks = self._load_tracks()
        if not st.order or not (0 <= st.current_index < len(st.order)):
            return None
        tid = st.order[st.current_index]
        return next((t for t in tracks if t.id == tid), None)

    def advance(self, steps: int = 1) -> Track | None:
        """Move forward (used by /next and auto-advance). Returns new current or None."""
        st = self.state
        if not st.order:
            return None

        st.current_index = (st.current_index + steps) % len(st.order)
        if steps > 0 and st.current_index < steps:   # wrapped
            st.cycle += 1
        st.is_playing = True
        self._save()
        return self.current()

    def jump(self, track_id: str) -> Optional[Track]:
        st = self.state
        tracks = self._load_tracks()
        try:
            idx = st.order.index(track_id)
        except ValueError:
            return None
        st.current_index = idx
        st.is_playing = True
        self._save()
        return self.current()

    def set_playing(self, playing: bool) -> None:
        self.state.is_playing = playing
        self._save()

    def get_now_playing(self) -> dict:
        """Convenience dict for API."""
        cur = self.current()
        st = self.state
        return {
            "track": cur.model_dump() if cur else None,
            "index": st.current_index,
            "total": len(st.order),
            "cycle": st.cycle,
            "is_playing": st.is_playing,
        }

    def reshuffle(self) -> None:
        """Future admin action: reshuffle remaining + unplayed."""
        st = self.state
        tracks = self._load_tracks()
        remaining = st.order[st.current_index:]
        unplayed = [t.id for t in tracks if t.id not in st.order]
        new_tail = remaining + unplayed
        random.shuffle(new_tail)
        st.order = st.order[:st.current_index] + new_tail
        self._save()


# Global singleton for the server process (simple & sufficient for local use)
manager = QueueManager()
