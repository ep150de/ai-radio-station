import { motion } from 'framer-motion'
import { Vinyl } from './Vinyl'

interface Props {
  track: { title: string; artist: string; duration?: number } | null
  progress: number
  currentTime: number
  isPlaying: boolean
  onSeek: (fraction: number) => void
}

export function NowPlaying({ track, progress, currentTime, isPlaying, onSeek }: Props) {
  const fmt = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const dur = track?.duration || 0

  return (
    <div className="bg-[#0d0a07] rounded-3xl p-6 flex gap-5 items-center">
      <Vinyl isPlaying={isPlaying} />

      <div className="flex-1 min-w-0 pt-1">
        <div className="track-title truncate text-[#f4e9d8]">{track?.title || '—'}</div>
        <div className="text-[#c8b8a0] text-sm mt-px truncate">{track?.artist || 'Suno'}</div>

        {/* Progress */}
        <div 
          className="progress-bar h-[5px] rounded mt-5 mb-1.5 cursor-pointer relative overflow-hidden"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
            onSeek(frac)
          }}
        >
          <motion.div 
            className="progress-fill h-full rounded" 
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        <div className="flex justify-between text-[10px] text-[#c8b8a0] font-mono tabular-nums">
          <div>{fmt(currentTime)}</div>
          <div>{fmt(dur)}</div>
        </div>
      </div>
    </div>
  )
}
