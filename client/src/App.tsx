import { useState, useEffect } from 'react'
import { useTheme } from './hooks/useTheme'

// Global keyboard support (space, arrows)
function useKeyboardShortcuts(player: ReturnType<typeof useRadioPlayer>) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (e.key === ' ' || e.key === 'k') {
        e.preventDefault()
        player.isPlaying ? player.pause() : player.play()
      }
      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'n') player.next()
      if (e.key.toLowerCase() === 'r') player.refresh()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [player])
}
import { Settings, ListMusic, Radio } from 'lucide-react'
import { useRadioPlayer } from './hooks/useRadioPlayer'
import { TunerBar } from './components/TunerBar'
import { NowPlaying } from './components/NowPlaying'
import { Transport } from './components/Transport'
import { UpNext } from './components/UpNext'
import { motion, AnimatePresence } from 'framer-motion'

export default function App() {
  const player = useRadioPlayer()
  const theme = useTheme()
  const [stationName] = useState("Beacon FM")
  const [showLibrary, setShowLibrary] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [showRequestsManager, setShowRequestsManager] = useState(false)
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0)

  useKeyboardShortcuts(player)

  // Poll request count for the operator
  useEffect(() => {
    const fetchCount = () => {
      fetch('/api/requests')
        .then(r => r.json())
        .then(d => setPendingRequestsCount(d.count || 0))
        .catch(() => {})
    }
    fetchCount()
    const id = setInterval(fetchCount, 8000)
    return () => clearInterval(id)
  }, [])

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    player.setVolume(v)
  }

  const handleVoiceVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    player.updateVoiceVolume(parseFloat(e.target.value))
  }

  return (
    <div className="min-h-screen bg-[#0d0a07] text-[#f4e9d8] flex items-start justify-center p-4 md:p-8">
      <div className="max-w-[960px] w-full pt-4">
        <div className="receiver-bezel rounded-[32px] p-9 md:p-10">
          <TunerBar 
            stationName={stationName} 
            cycle={player.cycle} 
            index={player.index} 
            total={player.total} 
          />

          {/* Phase 2 DJ Status */}
          {player.djEnabled && player.isDJSpeaking && (
            <div className="mb-4 flex items-center gap-2 px-4 py-2 bg-black/30 rounded-2xl text-sm">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              <span className="text-amber-400 font-medium">DJ SPEAKING</span>
              <span className="text-[#c8b8a0] ml-2 truncate max-w-[420px]">“{player.voiceover?.text}”</span>
            </div>
          )}

          <NowPlaying
            track={player.track}
            progress={player.progress}
            currentTime={player.currentTime}
            isPlaying={player.isPlaying}
            onSeek={player.seek}
          />

          <div className="mt-6">
            <Transport
              isPlaying={player.isPlaying}
              isLoading={player.isLoading}
              onPlay={player.play}
              onPause={player.pause}
              onNext={player.next}
            />
          </div>

          {/* Volume + actions row (Phase 2 enhanced) */}
          <div className="mt-5 flex items-center gap-4 px-1 flex-wrap">
            <div className="flex-1 flex items-center gap-3 text-xs text-[#c8b8a0]">
              <span>VOL</span>
              <input 
                type="range" 
                min={0} max={1} step={0.01} defaultValue={0.85}
                onChange={handleVolume}
                className="accent-[#ffbf00] w-24" 
              />
            </div>

            {/* Phase 2 DJ Controls */}
            <button
              onClick={player.toggleDJ}
              className={`flex items-center gap-2 text-xs px-3 py-2 rounded-2xl transition ${player.djEnabled ? 'bg-[#ffbf00] text-[#0d0a07] font-medium' : 'bg-[#2c261f] hover:bg-[#3a3229]'}`}
            >
              DJ MODE {player.djEnabled ? 'ON' : 'OFF'}
            </button>

            <button 
              onClick={() => setShowLibrary(true)}
              className="flex items-center gap-2 text-xs px-4 py-2 rounded-2xl bg-[#2c261f] hover:bg-[#3a3229] active:bg-black/50"
            >
              <ListMusic className="w-3.5 h-3.5" /> CATALOG
            </button>

            <button
              onClick={() => setShowRequestModal(true)}
              className="flex items-center gap-2 text-xs px-4 py-2 rounded-2xl bg-[#ffbf00] text-[#0d0a07] font-medium hover:brightness-105 active:scale-[0.985]"
            >
              Request a Song
            </button>

            <button
              onClick={() => setShowRequestsManager(true)}
              className="flex items-center gap-2 text-xs px-3 py-2 rounded-2xl bg-[#2c261f] hover:bg-[#3a3229] active:bg-black/50"
            >
              Requests <span className="text-[#ffbf00] font-mono">({pendingRequestsCount})</span>
            </button>

            <button
              onClick={() => {
                const link = document.createElement('a')
                link.href = '/api/export/m3u'
                link.download = 'beacon-fm-playlist.m3u'
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
              }}
              className="flex items-center gap-2 text-xs px-3 py-2 rounded-2xl bg-[#2c261f] hover:bg-[#3a3229] active:bg-black/50"
              title="Download current non-repeating order as .m3u playlist"
            >
              Export M3U
            </button>

            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-2xl bg-[#2c261f] hover:bg-[#3a3229]"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          <UpNext onJump={player.jumpTo} />

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-white/5 flex justify-between text-[10px] text-[#4a4033] font-mono tracking-widest">
            <div>NON-REPEATING • {player.total} TRACKS IN CATALOG</div>
            <div>PHASE 1 • LOCAL • FREE</div>
          </div>
        </div>

        {/* Tiny hint */}
        <div className="text-center mt-3 text-[10px] text-[#3a3229]">
          Space = Play/Pause • Right Arrow = Next • Click progress bar to seek
        </div>
      </div>

      {/* Request a Song Modal (Phase 3) */}
      <AnimatePresence>
        {showRequestModal && (
          <RequestSongModal 
            onClose={() => setShowRequestModal(false)} 
          />
        )}
      </AnimatePresence>

      {/* Requests Manager Modal (Phase 3 - for operator) */}
      <AnimatePresence>
        {showRequestsManager && (
          <RequestsManagerModal 
            onClose={() => setShowRequestsManager(false)} 
          />
        )}
      </AnimatePresence>

      {/* Settings Modal (Phase 2 + 3) */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowSettings(false)}>
            <motion.div 
              className="bg-[#1f1a14] rounded-3xl max-w-md w-full p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between mb-5">
                <div className="font-semibold text-lg">Station Settings</div>
                <button onClick={() => setShowSettings(false)}>Close</button>
              </div>

              <div className="space-y-6 text-sm">
                {/* Theme Switcher */}
                <div>
                  <div className="text-[#c8b8a0] mb-2">UI Theme</div>
                  <div className="flex gap-2">
                    {theme.themes.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => theme.setTheme(t.id)}
                        className={`flex-1 py-2 rounded-xl text-xs transition ${
                          theme.theme === t.id 
                            ? 'bg-[#ffbf00] text-[#0d0a07] font-medium' 
                            : 'bg-[#2c261f] hover:bg-[#3a3229]'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <div className="text-[10px] text-[#c8b8a0] mt-1 text-center">
                    Current: {theme.themeLabel}
                  </div>
                </div>

                <div>
                  <div className="text-[#c8b8a0] mb-2">DJ Voice Volume</div>
                  <input 
                    type="range" min={0} max={1} step={0.05} value={player.voiceVolume}
                    onChange={handleVoiceVolume}
                    className="accent-[#ffbf00] w-full" 
                  />
                </div>

                <button
                  onClick={async () => {
                    await fetch('/api/dj/speak', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ text: "This is a test of the Beacon FM DJ voice system." })
                    })
                  }}
                  className="w-full mt-2 py-2 rounded-2xl bg-[#2c261f] hover:bg-[#3a3229] text-sm"
                >
                  Test DJ Voice
                </button>

                <div className="pt-3 border-t border-white/10 text-xs text-[#c8b8a0]">
                  {player.isPremiumVoice ? "Using premium Piper voice" : "Using browser speech synthesis"}
                  <br />
                  For much more natural voices, run the Piper container (see README).
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Minimal Library Modal */}
      <AnimatePresence>
        {showLibrary && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowLibrary(false)}>
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-[#1f1a14] rounded-3xl max-w-lg w-full p-6 max-h-[70vh] overflow-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between mb-4 items-center">
                <div className="font-semibold text-lg">Catalog — {player.total} tracks</div>
                <button onClick={() => setShowLibrary(false)} className="text-[#c8b8a0]">Close</button>
              </div>
              <div className="text-xs text-[#c8b8a0] mb-3">Click any title to jump • ★ = Favorite</div>
              <LibraryList onJump={(id) => { player.jumpTo(id); setShowLibrary(false) }} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Request Song Modal (Phase 3)
function RequestSongModal({ onClose }: { onClose: () => void }) {
  const [tracks, setTracks] = useState<any[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetch('/api/tracks').then(r => r.json()).then(d => setTracks(d.tracks || []))
  }, [])

  const submitRequest = async () => {
    if (!selectedId) return
    setIsSubmitting(true)
    try {
      await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          track_id: selectedId,
          message: message.trim() || undefined,
        }),
      })
      setSuccess(true)
      setTimeout(() => {
        onClose()
      }, 1200)
    } catch (e) {
      alert("Failed to submit request. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-[#1f1a14] rounded-3xl p-8 text-center">
          <div className="text-2xl mb-2">✓ Request submitted!</div>
          <div className="text-[#c8b8a0]">The DJ will see your request shortly.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-[#1f1a14] rounded-3xl max-w-lg w-full p-6 max-h-[80vh] overflow-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between mb-4">
          <div className="font-semibold text-lg">Request a Song</div>
          <button onClick={onClose} className="text-[#c8b8a0]">Close</button>
        </div>

        <div className="text-xs text-[#c8b8a0] mb-3">
          Pick a track from the catalog. The DJ will see your request.
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Optional message for the DJ..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full bg-[#0d0a07] border border-[#2c261f] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#ffbf00]"
          />
        </div>

        <div className="max-h-[42vh] overflow-auto border border-[#2c261f] rounded-2xl p-1 mb-4">
          {tracks.slice(0, 300).map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedId(t.id)}
              className={`w-full text-left px-3 py-2 rounded-xl flex justify-between text-sm hover:bg-white/5 ${selectedId === t.id ? 'bg-[#ffbf00]/10 text-[#ffbf00]' : ''}`}
            >
              <span className="truncate">{t.title}</span>
              <span className="text-[#c8b8a0] pl-4 shrink-0 text-xs self-center">{t.artist}</span>
            </button>
          ))}
        </div>

        <button
          onClick={submitRequest}
          disabled={!selectedId || isSubmitting}
          className="w-full py-3 rounded-2xl bg-[#ffbf00] text-[#0d0a07] font-semibold disabled:opacity-50"
        >
          {isSubmitting ? "Submitting..." : "Submit Request"}
        </button>
      </div>
    </div>
  )
}

// Requests Manager Modal (for the operator / DJ)
function RequestsManagerModal({ onClose }: { onClose: () => void }) {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = () => {
    setLoading(true)
    fetch('/api/requests')
      .then(r => r.json())
      .then(d => {
        setRequests(d.requests || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 6000)
    return () => clearInterval(id)
  }, [])

  const playRequest = async (req: any) => {
    try {
      await fetch(`/api/requests/${req.id}/play`, { method: 'POST' })
      refresh()
    } catch (e) {
      alert("Failed to play requested song")
    }
  }

  const dismiss = async (req: any) => {
    await fetch(`/api/requests/${req.id}`, { method: 'DELETE' })
    refresh()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-[#1f1a14] rounded-3xl max-w-lg w-full p-6 max-h-[75vh] overflow-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between mb-4">
          <div className="font-semibold text-lg">Song Requests ({requests.length})</div>
          <button onClick={onClose} className="text-[#c8b8a0]">Close</button>
        </div>

        {loading && requests.length === 0 && <div className="text-center py-8 text-[#c8b8a0]">Loading requests...</div>}

        {!loading && requests.length === 0 && (
          <div className="text-center py-8 text-[#c8b8a0]">No pending requests. The airwaves are quiet.</div>
        )}

        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.id} className="bg-[#0d0a07] rounded-2xl p-4">
              <div className="font-medium">{req.title}</div>
              <div className="text-sm text-[#c8b8a0]">{req.artist}</div>
              {req.message && (
                <div className="mt-2 text-xs italic text-[#ffbf00]">“{req.message}”</div>
              )}
              <div className="flex gap-2 mt-3">
                <button 
                  onClick={() => playRequest(req)}
                  className="flex-1 py-2 rounded-xl bg-[#ffbf00] text-[#0d0a07] text-sm font-medium"
                >
                  Play Now
                </button>
                <button 
                  onClick={() => dismiss(req)}
                  className="px-4 py-2 rounded-xl bg-[#2c261f] text-sm"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Simple lazy list with Phase 3 Favorites support
function LibraryList({ onJump }: { onJump: (id: string) => void }) {
  const [tracks, setTracks] = useState<any[]>([])
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/tracks').then(r => r.json()).then(d => setTracks(d.tracks || []))
    fetch('/api/favorites').then(r => r.json()).then(d => {
      setFavorites(new Set((d.favorites || []).map((f: any) => f.id)))
    })
  }, [])

  const toggleFav = async (e: React.MouseEvent, trackId: string) => {
    e.stopPropagation()
    const res = await fetch(`/api/favorites/${trackId}/toggle`, { method: 'POST' })
    const data = await res.json()
    setFavorites(prev => {
      const next = new Set(prev)
      if (data.is_favorite) next.add(trackId)
      else next.delete(trackId)
      return next
    })
  }

  return (
    <div className="space-y-px text-sm max-h-[52vh] overflow-auto pr-1">
      {tracks.slice(0, 400).map((t, i) => {
        const isFav = favorites.has(t.id)
        return (
          <div 
            key={i} 
            onClick={() => onJump(t.id)}
            className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-xl flex justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-2 truncate">
              <button 
                onClick={(e) => toggleFav(e, t.id)}
                className="text-lg leading-none hover:scale-110 transition"
              >
                {isFav ? "★" : "☆"}
              </button>
              <span className="truncate group-hover:text-[#ffbf00]">{t.title}</span>
            </div>
            <span className="text-[#c8b8a0] pl-4 text-right shrink-0 tabular-nums text-xs self-center">{t.artist}</span>
          </div>
        )
      })}
      {tracks.length > 400 && <div className="text-center text-xs py-2 text-[#c8b8a0]">... and {tracks.length - 400} more</div>}
    </div>
  )
}
