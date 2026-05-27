"""
AI Radio Station — Request Queue (Phase 3)

Simple listener request system.
Anyone viewing the web UI can submit song requests.
The radio operator sees and can act on the queue.
"""
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List

from config import DATA_DIR
from models import SongRequest, Track
from library import scan_library


REQUESTS_FILE = DATA_DIR / "requests.json"


class RequestQueue:
    def __init__(self):
        self._requests: List[SongRequest] = []
        self._load()

    def _load(self):
        if REQUESTS_FILE.exists():
            try:
                data = json.loads(REQUESTS_FILE.read_text())
                self._requests = [SongRequest(**item) for item in data]
            except Exception:
                self._requests = []

    def _save(self):
        REQUESTS_FILE.write_text(
            json.dumps([r.model_dump() for r in self._requests], indent=2)
        )

    def submit(self, track_id: str, message: Optional[str] = None) -> SongRequest:
        tracks = scan_library()
        track = next((t for t in tracks if t.id == track_id), None)
        if not track:
            raise ValueError("Track not found")

        req = SongRequest(
            id=f"req_{uuid.uuid4().hex[:10]}",
            track_id=track_id,
            title=track.title,
            artist=track.artist,
            message=message,
            requested_at=datetime.now(timezone.utc).isoformat(),
        )
        self._requests.append(req)
        self._save()
        return req

    def list(self) -> List[SongRequest]:
        # Return newest first
        return sorted(self._requests, key=lambda r: r.requested_at, reverse=True)

    def remove(self, request_id: str) -> bool:
        original_len = len(self._requests)
        self._requests = [r for r in self._requests if r.id != request_id]
        if len(self._requests) != original_len:
            self._save()
            return True
        return False

    def clear(self):
        self._requests = []
        self._save()

    def get_by_id(self, request_id: str) -> Optional[SongRequest]:
        return next((r for r in self._requests if r.id == request_id), None)


# Singleton
request_queue = RequestQueue()