import { useEffect, useState } from 'react'
import { getUpNext } from '../api'

interface Item { id: string; title: string; artist: string; index: number }

export function UpNext({ onJump }: { onJump: (id: string) => void }) {
  const [items, setItems] = useState<Item[]>([])

  useEffect(() => {
    getUpNext(3).then(d => setItems(d.up_next || []))
    const id = setInterval(() => getUpNext(3).then(d => setItems(d.up_next || [])), 12000)
    return () => clearInterval(id)
  }, [])

  if (!items.length) return null

  return (
    <div className="mt-6 text-xs">
      <div className="text-[#c8b8a0] mb-1.5 px-1 tracking-wider text-[10px]">UP NEXT</div>
      <div className="space-y-px">
        {items.map((it, i) => (
          <button
            key={i}
            onClick={() => onJump(it.id)}
            className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 active:bg-white/10 flex justify-between items-center group"
          >
            <span className="truncate text-[#f4e9d8] group-hover:text-[#ffbf00]">{it.title}</span>
            <span className="text-[#c8b8a0] pl-4 text-right tabular-nums shrink-0">{it.artist}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
