"""
Suno Radio — Voice / DJ Layer (Phase 2 stub)

This file defines the interface so the rest of the system can be written
against it today. Real implementations (Piper, OpenAI, Web Speech fallback)
plug in here without touching the radio engine.

Design goals for Phase 2:
- Generate short station IDs and title callouts
- Cache them aggressively (text hash → wav)
- Expose a simple /api/voiceover/schedule or similar
"""
from __future__ import annotations
from dataclasses import dataclass
from pathlib import Path
from typing import Protocol, Optional
import hashlib

from config import VOICOVER_CACHE_DIR, TTS_PROVIDER


@dataclass
class VoiceClip:
    text: str
    path: Path
    duration: float = 0.0


class TTSProvider(Protocol):
    def synthesize(self, text: str, voice: str = "default") -> VoiceClip: ...


class DummyProvider:
    """Does nothing — lets the UI and API be written before real TTS exists."""
    def synthesize(self, text: str, voice: str = "default") -> VoiceClip:
        # In real life this would call Piper / OpenAI and return a real wav
        fake = VOICOVER_CACHE_DIR / f"dummy_{hashlib.md5(text.encode()).hexdigest()[:8]}.wav"
        fake.parent.mkdir(parents=True, exist_ok=True)
        fake.write_bytes(b"")  # placeholder
        return VoiceClip(text=text, path=fake, duration=3.5)


# Global provider (swapped at runtime in Phase 2)
_provider: TTSProvider = DummyProvider()


def set_provider(p: TTSProvider) -> None:
    global _provider
    _provider = p


def generate_station_id() -> VoiceClip:
    text = "You are listening to Suno Beacon — the complete works of Suno, playing without repetition."
    return _provider.synthesize(text)


def generate_title_callout(title: str, artist: str = "Suno") -> VoiceClip:
    text = f"Now playing: {title}."
    return _provider.synthesize(text)


def get_or_generate_clip(text: str) -> VoiceClip:
    """Cache-friendly entry point the radio engine will use."""
    h = hashlib.md5(text.encode()).hexdigest()[:12]
    cached = VOICOVER_CACHE_DIR / f"{h}.wav"
    if cached.exists():
        return VoiceClip(text=text, path=cached, duration=3.0)  # duration can be real later
    return _provider.synthesize(text)
