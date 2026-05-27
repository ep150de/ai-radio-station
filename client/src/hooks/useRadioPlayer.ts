import { useCallback, useEffect, useRef, useState } from 'react'
import { getState, control } from '../api'

export interface NowPlayingTrack {
  id: string
  title: string
  artist: string
  duration: number
}

interface PlayerState {
  track: NowPlayingTrack | null
  isPlaying: boolean
  progress: number
  currentTime: number
  index: number
  total: number
  cycle: number
}

export function useRadioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [state, setState] = useState<PlayerState>({
    track: null,
    isPlaying: false,
    progress: 0,
    currentTime: 0,
    index: 0,
    total: 0,
    cycle: 1,
  })
  const [isLoading, setIsLoading] = useState(false)

  // Create audio element once
  useEffect(() => {
    const audio = new Audio()
    audio.preload = 'auto'
    audioRef.current = audio

    const onTime = () => {
      if (!audio.duration) return
      setState(s => ({
        ...s,
        currentTime: audio.currentTime,
        progress: audio.currentTime / audio.duration,
      }))
    }
    const onEnded = () => {
      // Auto-advance via server (keeps all clients in sync with the "station")
      control('next').then(() => refreshState())
    }

    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('ended', onEnded)
      audio.pause()
    }
  }, [])

  const refreshState = useCallback(async () => {
    try {
      const data = await getState()
      const track = data.track ? {
        id: data.track.id,
        title: data.track.title,
        artist: data.track.artist,
        duration: data.track.duration,
      } : null

      setState(s => ({
        ...s,
        track,
        isPlaying: data.is_playing,
        index: data.index,
        total: data.total,
        cycle: data.cycle,
      }))

      // If server says playing but we have no src or different track, load it
      const audio = audioRef.current
      if (audio && track) {
        const expectedSrc = `/audio/${track.id}`
        if (audio.src !== location.origin + expectedSrc) {
          audio.src = expectedSrc
        }
        if (data.is_playing && audio.paused) {
          audio.play().catch(() => {})
        } else if (!data.is_playing && !audio.paused) {
          audio.pause()
        }
      }
    } catch (e) {
      console.warn('[radio] state refresh failed', e)
    }
  }, [])

  // Initial + periodic sync (clients "tune in" to the live radio position)
  useEffect(() => {
    refreshState()
    const id = setInterval(refreshState, 7000)
    return () => clearInterval(id)
  }, [refreshState])

  const play = useCallback(async () => {
    setIsLoading(true)
    await control('play')
    const audio = audioRef.current
    if (audio && state.track) {
      if (!audio.src) audio.src = `/audio/${state.track.id}`
      await audio.play().catch(() => {})
    }
    await refreshState()
    setIsLoading(false)
  }, [state.track, refreshState])

  const pause = useCallback(async () => {
    await control('pause')
    audioRef.current?.pause()
    await refreshState()
  }, [refreshState])

  const next = useCallback(async () => {
    setIsLoading(true)
    await control('next')
    // The refresh + ended handler will load the new src
    await refreshState()
    setIsLoading(false)
  }, [refreshState])

  const jumpTo = useCallback(async (trackId: string) => {
    setIsLoading(true)
    await control('jump', { track_id: trackId })
    await refreshState()
    setIsLoading(false)
  }, [refreshState])

  const seek = useCallback((fraction: number) => {
    const audio = audioRef.current
    if (audio && audio.duration) {
      audio.currentTime = fraction * audio.duration
    }
  }, [])

  const setVolume = useCallback((vol: number) => {
    if (audioRef.current) audioRef.current.volume = Math.max(0, Math.min(1, vol))
  }, [])

  return {
    ...state,
    isLoading,
    play,
    pause,
    next,
    jumpTo,
    seek,
    setVolume,
    audioRef,
    refresh: refreshState,
  }
}
