interface Props {
  stationName: string
  cycle: number
  index: number
  total: number
}

export function TunerBar({ stationName, cycle, index, total }: Props) {
  return (
    <div className="flex items-end justify-between mb-6 px-1">
      <div>
        <div className="text-[10px] text-[#c8b8a0] tracking-[4px] font-mono mb-px">FM • PERSONAL ARCHIVE</div>
        <div className="text-[42px] leading-none font-semibold tracking-[-2.2px] text-[#f4e9d8]">{stationName}</div>
      </div>

      <div className="text-right pb-1">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/30 text-sm mb-1">
          <div className="w-2 h-2 rounded-full bg-[#ffbf00] led-on-air" />
          <span className="text-[#ffbf00] font-medium tracking-wider text-xs">ON AIR</span>
        </div>
        <div className="text-[10px] text-[#c8b8a0] font-mono tracking-[1px]">
          CYCLE {cycle} • {index + 1} / {total}
        </div>
      </div>
    </div>
  )
}
