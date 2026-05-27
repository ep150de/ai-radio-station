"""
Suno Radio — Server Configuration
Loads from environment with sensible defaults for local appliance use.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Paths (inside container, override via env or .env)
MUSIC_DIR = Path(os.getenv("MUSIC_DIR", "/music"))
DATA_DIR = Path(os.getenv("DATA_DIR", "/data"))
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Server
PORT = int(os.getenv("PORT", 8080))
HOST = os.getenv("HOST", "0.0.0.0")
STATION_NAME = os.getenv("STATION_NAME", "Suno Beacon")
LOG_LEVEL = os.getenv("LOG_LEVEL", "info").lower()

# Playback
CROSSFADE_MS = int(os.getenv("CROSSFADE_MS", 300))
DEFAULT_SHUFFLE = os.getenv("DEFAULT_SHUFFLE", "true").lower() == "true"

# Phase 2 - Voice / DJ
PIPER_URL = os.getenv("PIPER_URL", "http://piper:5000")
PIPER_VOICE = os.getenv("PIPER_VOICE") or None          # Usually controlled by the container --voice flag
TTS_PROVIDER = os.getenv("TTS_PROVIDER", "webspeech")   # webspeech | piper | auto | openai

# Phase 3 - Icecast / Liquidsoap control
LIQUIDSOAP_TELNET_HOST = os.getenv("LIQUIDSOAP_TELNET_HOST", "liquidsoap")
LIQUIDSOAP_TELNET_PORT = int(os.getenv("LIQUIDSOAP_TELNET_PORT", 1234))

# OpenAI fallback (optional)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_TTS_MODEL = os.getenv("OPENAI_TTS_MODEL", "tts-1")
OPENAI_TTS_VOICE = os.getenv("OPENAI_TTS_VOICE", "nova")

# Derived
PLAYLIST_STATE_FILE = DATA_DIR / "playlist.json"
LIBRARY_CACHE_FILE = DATA_DIR / "library.json"
VOICOVER_CACHE_DIR = DATA_DIR / "voiceover"
VOICOVER_CACHE_DIR.mkdir(parents=True, exist_ok=True)

# Supported audio extensions
AUDIO_EXTENSIONS = {".mp3", ".wav", ".flac", ".ogg", ".m4a", ".aac"}

def get_station_name() -> str:
    return STATION_NAME
