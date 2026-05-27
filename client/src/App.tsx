import { useState, useEffect } from 'react'

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
  const [stationName] = useState("Beacon FM")
  const [showLibrary, setShowLibrary] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  useKeyboardShortcuts(player)

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
                <div>
                  <div className="text-[#c8b8a0] mb-2">DJ Voice Volume</div>
                  <input 
                    type="range" min={0} max={1} step={0.05} value={player.voiceVolume}
                    onChange={handleVoiceVolume}
                    className="accent-[#ffbf00] w-full" 
                  />
                </div>

                <div className="pt-3 border-t border-white/10 text-xs text-[#c8b8a0]">
                  Phase 2 DJ is powered by your browser’s built-in speech synthesis (works everywhere).<br />
                  For premium natural voices, run the Piper container (see README).
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
              <div className="flex justify-between mb-4">
                <div className="font-semibold text-lg">Catalog — {player.total} tracks</div>
                <button onClick={() => setShowLibrary(false)} className="text-[#c8b8a0]">Close</button>
              </div>
              <div className="text-xs text-[#c8b8a0] mb-3">Click any title to jump (radio order is preserved)</div>
              <LibraryList onJump={(id) => { player.jumpTo(id); setShowLibrary(false) }} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Simple lazy list (fetches on open)
function LibraryList({ onJump }: { onJump: (id: string) => void }) {
  const [tracks, setTracks] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/tracks').then(r => r.json()).then(d => setTracks(d.tracks || []))
  }, [])

  return (
    <div className="space-y-px text-sm max-h-[52vh] overflow-auto pr-1">
      {tracks.slice(0, 400).map((t, i) => (
        <button 
          key={i} 
          onClick={() => onJump(t.id)}
          className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-xl flex justify-between group"
        >
          <span className="truncate group-hover:text-[#ffbf00]">{t.title}</span>
          <span className="text-[#c8b8a0] pl-4 text-right shrink-0 tabular-nums text-xs self-center">{t.artist}</span>
        </button>
      ))}
      {tracks.length > 400 && <div className="text-center text-xs py-2 text-[#c8b8a0]">... and {tracks.length - 400} more</div>}
    </div>
  )
}
