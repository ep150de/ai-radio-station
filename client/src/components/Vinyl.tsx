import { motion } from 'framer-motion'

interface VinylProps {
  isPlaying: boolean
  size?: number
}

export function Vinyl({ isPlaying, size = 112 }: VinylProps) {
  return (
    <div 
      className="relative rounded-full border-[14px] border-[#2c261f] bg-[#0d0a07] flex-shrink-0 overflow-hidden"
      style={{ width: size, height: size }}
    >
      <motion.div
        className="absolute inset-0 rounded-full vinyl"
        style={{
          background: 'repeating-radial-gradient(circle at 50% 50%, #1f1a14 0px, #1f1a14 2px, #0d0a07 3px, #0d0a07 7px)',
        }}
        animate={{ rotate: isPlaying ? 360 : 0 }}
        transition={{ duration: 3.8, ease: 'linear', repeat: isPlaying ? Infinity : 0 }}
      />
      {/* Center label */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#1f1a14] border border-[#4a4033] flex items-center justify-center">
        <div className="w-2.5 h-2.5 rounded-full bg-[#b8860b]/70" />
      </div>
      {/* Subtle highlight ring */}
      <div className="absolute inset-[6px] rounded-full border border-white/5" />
    </div>
  )
}
