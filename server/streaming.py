"""
Suno Radio — Audio Streaming Helpers (Phase 1)
For now this is thin — the heavy lifting is in main.py's FileResponse.
Future: HLS segmentation, on-the-fly normalization, voiceover mixing, Icecast bridge, etc.
"""
from pathlib import Path
from fastapi.responses import FileResponse


def audio_file_response(path: Path, track_title: str | None = None) -> FileResponse:
    """Return a properly configured FileResponse for an audio file."""
    media = "audio/mpeg" if path.suffix.lower() == ".mp3" else "audio/*"
    headers = {
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
    }
    if track_title:
        # Helpful for some players
        headers["Content-Disposition"] = f'inline; filename="{track_title[:80]}.mp3"'
    return FileResponse(
        path=str(path),
        media_type=media,
        headers=headers,
    )
