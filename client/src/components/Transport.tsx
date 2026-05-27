import { Play, Pause, SkipForward } from 'lucide-react'
import { motion } from 'framer-motion'

interface Props {
  isPlaying: boolean
  isLoading: boolean
  onPlay: () => void
  onPause: () => void
  onNext: () => void
}

export function Transport({ isPlaying, isLoading, onPlay, onPause, onNext }: Props) {
  return (
    <div className="flex items-center justify-between gap-3">
      <button
        onClick={onPause}
        className="radio-button flex-1 py-3.5 rounded-2xl bg-[#2c261f] hover:bg-[#3a3229] active:bg-black/50 text-sm font-medium tracking-wider"
      >
        PAUSE
      </button>

      <button
        onClick={isPlaying ? onPause : onPlay}
        disabled={isLoading}
        className="radio-button flex-1 py-3.5 rounded-3xl bg-[#ffbf00] hover:brightness-105 active:scale-[0.985] text-[#0d0a07] font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-70"
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        {isPlaying ? 'PAUSE' : 'PLAY'}
      </button>

      <button
        onClick={onNext}
        className="radio-button flex-1 py-3.5 rounded-2xl bg-[#2c261f] hover:bg-[#3a3229] active:bg-black/50 text-sm font-medium tracking-wider flex items-center justify-center gap-2"
      >
        NEXT <SkipForward className="w-4 h-4" />
      </button>
    </div>
  )
}
