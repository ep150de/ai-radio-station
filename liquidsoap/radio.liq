# AI Radio Station - Basic Icecast Stream (Phase 3)
#
# This is a starting point. It fetches the current playlist from the radio
# and streams it continuously to Icecast.
#
# Limitations (current):
# - It does not yet react live to voiceovers or the request queue.
# - It replays the playlist when it ends.
#
# Future improvements can query the radio API more intelligently.

# Configuration - these can be overridden via environment if needed
radio_api = getenv("RADIO_API_URL", "http://radio:8080")

# Fetch the current playlist from the radio
playlist_url = "#{radio_api}/api/export/m3u"

# Create a playlist source from the radio's current order
radio_playlist = playlist(
  mode="normal",
  reload=30,           # Refresh playlist every 30 seconds
  reload_mode="watch", # Watch for changes
  playlist_url
)

# Add some metadata
radio = metadata.map(fun (m) ->
  m.{title = "AI Radio Station - #{m.title}"}
, radio_playlist)

# Output to Icecast
output.icecast(
  %mp3(bitrate=128),
  host="icecast",
  port=8000,
  password="hackme",
  mount="/radio.mp3",
  name="AI Radio Station",
  description="Personal non-stop AI music radio",
  url="http://localhost:8080",
  radio
)

# Log when we start
log.info("AI Radio Station stream started. Streaming to Icecast at http://localhost:8000/radio.mp3")