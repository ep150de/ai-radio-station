"""
AI Radio Station — Voice / DJ Layer (Phase 2 - Complete)

Two-tier design for maximum accessibility:

1. **Primary (always works)**: Client uses browser `speechSynthesis` (Web Speech API).
   Zero setup, high quality on modern OSes, instant.

2. **Premium (optional)**: When the Piper container is running, the server can
   generate real high-quality WAV clips via Piper's HTTP endpoint and serve them.
   The client will prefer real audio clips when available.

This gives users a great DJ experience immediately, with an easy upgrade path.
"""
from __future__ import annotations
from dataclasses import dataclass
from pathlib import Path
from typing import Optional
import hashlib
import os

from config import VOICOVER_CACHE_DIR, PIPER_URL, TTS_PROVIDER


@dataclass
class VoiceClip:
    """Represents something the DJ should say."""
    text: str
    # If path exists and is a real file, client should play the audio file.
    # If path is empty or doesn't exist, client falls back to speechSynthesis.speak(text)
    path: Optional[Path] = None
    duration: float = 0.0   # estimated or actual seconds


class VoiceService:
    """Central service for all DJ voice features."""

    def __init__(self):
        self.piper_url = PIPER_URL.rstrip("/")
        self.enabled = TTS_PROVIDER in ("piper", "auto")

    def generate_station_id(self) -> VoiceClip:
        texts = [
            "You're tuned to Beacon FM — your personal archive of AI-generated music.",
            "This is Beacon FM, playing the complete works of artificial intelligence, without repetition.",
            "Beacon FM — where every track was born from imagination and code.",
        ]
        import random
        text = random.choice(texts)
        return self._get_clip(text)

    def generate_title_callout(self, title: str, artist: str = "AI") -> VoiceClip:
        text = f"Now playing: {title}."
        return self._get_clip(text)

    def generate_transition(self) -> VoiceClip:
        texts = [
            "Coming up next on the station.",
            "Another original composition, right after this.",
            "Continuing our journey through the archive.",
        ]
        import random
        return self._get_clip(random.choice(texts))

    def _get_clip(self, text: str) -> VoiceClip:
        """Try to generate a real audio file via Piper. Fall back to text-only."""
        if not self.enabled:
            return VoiceClip(text=text)

        # Try Piper first
        clip = self._try_piper(text)
        if clip and clip.path and clip.path.exists():
            return clip

        # Fall back to pure text (client will use speechSynthesis)
        return VoiceClip(text=text, duration=self._estimate_duration(text))

    def _try_piper(self, text: str) -> Optional[VoiceClip]:
        """Attempt to synthesize via Piper HTTP (wyoming-piper or compatible)."""
        try:
            import httpx

            # Many Piper HTTP frontends expose /synthesize or similar.
            # rhasspy/wyoming-piper with its built-in server often works on /synthesize
            # We'll try the most common patterns.
            candidates = [
                f"{self.piper_url}/synthesize",
                f"{self.piper_url}/api/tts",
                f"{self.piper_url}/tts",
            ]

            h = hashlib.md5(text.encode()).hexdigest()[:12]
            out_path = VOICOVER_CACHE_DIR / f"{h}.wav"

            if out_path.exists() and out_path.stat().st_size > 1000:
                return VoiceClip(text=text, path=out_path, duration=self._estimate_duration(text))

            for url in candidates:
                try:
                    resp = httpx.post(
                        url,
                        json={"text": text, "voice": "default"},
                        timeout=25,
                    )
                    if resp.status_code == 200 and len(resp.content) > 2000:
                        out_path.write_bytes(resp.content)
                        return VoiceClip(text=text, path=out_path, duration=self._estimate_duration(text))
                except Exception:
                    continue
            return None
        except Exception:
            return None

    def _estimate_duration(self, text: str) -> float:
        # Very rough: ~150 words per minute → ~2.5 words per second
        words = len(text.split())
        return max(1.8, words / 2.5)


# Singleton service used by the rest of the app
voice_service = VoiceService()
