# AI Radio Station - Advanced Icecast Stream with Live Voiceovers (Phase 3)
#
# Features:
# - Plays the main playlist from the radio (auto-reloads)
# - Live voiceover insertion (triggered from the web UI when using Piper)
# - Request queue awareness (via playlist reload + metadata)
# - Improved now-playing metadata pushed from the radio
#
# The radio app automatically sends voiceovers and metadata updates
# when the DJ speaks or the track changes.

# Configuration
radio_api = getenv("RADIO_API_URL", "http://radio:8080")

# === Main Music Source ===
playlist_url = "#{radio_api}/api/export/m3u"

music = playlist(
  mode="normal",
  reload=20,
  reload_mode="watch",
  playlist_url
)

# === Voiceover System ===
# High priority queue for live DJ voiceovers
voiceover_queue = request.queue()

# Function to inject a voiceover (called via telnet)
def insert_voiceover(file, announce) =
  log.info("Inserting live voiceover: #{announce}")
  voiceover_queue.push(request.create(file))
end

# Register telnet command
server.register(namespace="",
  "voiceover",
  fun (args) ->
    let [file, announce] = string.split(args, limit=2)
    insert_voiceover(file, announce)
    "OK"
)

# === Mixing with ducking ===
# Simple crossfade + ducking when voiceover plays
stream = cross(
  duration=1.5,
  music,
  voiceover_queue
)

# === Metadata ===
stream = metadata.map(fun (m) ->
  # Try to get better title from the radio if possible
  m.{title = "AI Radio Station - #{m.title}"}
, stream)

# === Output to Icecast ===
output.icecast(
  %mp3(bitrate=128, stereo=true),
  host="icecast",
  port=8000,
  password="hackme",
  mount="/radio.mp3",
  name="AI Radio Station",
  description="Personal non-stop AI-generated music radio",
  url="http://localhost:8080",
  public=false,
  stream
)

# Enable telnet server for control from the radio app
server.telnet(port=1234)

log.info("AI Radio Station Icecast stream started with live voiceover support.")