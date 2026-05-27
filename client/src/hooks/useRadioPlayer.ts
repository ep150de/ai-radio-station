import { useCallback, useEffect, useRef, useState } from 'react'
import { getState, control } from '../api'

export interface NowPlayingTrack {
  id: string
  title: string
  artist: string
  duration: number
}

export interface PendingVoiceover {
  text: string
  audio_url?: string | null
  duration: number
  kind: 'title' | 'station_id' | 'transition'
}

interface PlayerState {
  track: NowPlayingTrack | null
  isPlaying: boolean
  progress: number
  currentTime: number
  index: number
  total: number
  cycle: number
  voiceover?: PendingVoiceover | null
  isDJSpeaking: boolean
}

export function useRadioPlayer() {
  const musicAudioRef = useRef<HTMLAudioElement | null>(null)
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const musicGainRef = useRef<GainNode | null>(null)

  const [state, setState] = useState<PlayerState>({
    track: null,
    isPlaying: false,
    progress: 0,
    currentTime: 0,
    index: 0,
    total: 0,
    cycle: 1,
    voiceover: null,
    isDJSpeaking: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [djEnabled, setDjEnabled] = useState(true)           // Phase 2 toggle
  const [voiceVolume, setVoiceVolume] = useState(0.95)
  const [isPremiumVoice, setIsPremiumVoice] = useState(false)

  // Sleep timer (Phase 3 nice-to-have)
  const [sleepMinutes, setSleepMinutes] = useState(0)
  const sleepTimeoutRef = useRef<number | null>(null)

  // --- Web Audio ducking setup (smooth music volume reduction) ----------
  const setupAudioDucking = useCallback(() => {
    if (audioContextRef.current) return

    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const musicGain = ctx.createGain()
      musicGain.gain.value = 1.0

      const musicSource = ctx.createMediaElementSource(musicAudioRef.current!)
      musicSource.connect(musicGain)
      musicGain.connect(ctx.destination)

      audioContextRef.current = ctx
      musicGainRef.current = musicGain
    } catch (e) {
      console.warn('[radio] Web Audio ducking not available, falling back to simple volume')
    }
  }, [])

  const duckMusic = useCallback((duck: boolean) => {
    const gain = musicGainRef.current
    if (gain) {
      const target = duck ? 0.18 : 1.0
      const now = audioContextRef.current!.currentTime
      gain.gain.cancelScheduledValues(now)
      gain.gain.linearRampToValueAtTime(target, now + (duck ? 0.25 : 0.6))
    } else {
      // Fallback
      if (musicAudioRef.current) {
        musicAudioRef.current.volume = duck ? 0.22 : 1.0
      }
    }
  }, [])

  // --- Core music audio element -----------------------------------------
  useEffect(() => {
    const audio = new Audio()
    audio.preload = 'auto'
    musicAudioRef.current = audio

    const onTime = () => {
      if (!audio.duration) return
      setState(s => ({
        ...s,
        currentTime: audio.currentTime,
        progress: audio.currentTime / audio.duration,
      }))
    }
    const onEnded = () => {
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

  // --- Voice audio element (for real Piper clips) -----------------------
  useEffect(() => {
    const voice = new Audio()
    voice.preload = 'auto'
    voiceAudioRef.current = voice

    const onVoiceEnd = () => {
      setState(s => ({ ...s, isDJSpeaking: false }))
      duckMusic(false)
      // Resume music if it was playing
      if (state.isPlaying && musicAudioRef.current) {
        musicAudioRef.current.play().catch(() => {})
      }
    }
    voice.addEventListener('ended', onVoiceEnd)
    return () => voice.removeEventListener('ended', onVoiceEnd)
  }, [state.isPlaying])

  // --- Main state polling + voiceover handling --------------------------
  const refreshState = useCallback(async () => {
    try {
      const data = await getState()
      const track = data.track ? {
        id: data.track.id,
        title: data.track.title,
        artist: data.track.artist,
        duration: data.track.duration,
      } : null

      const newVoice = data.voiceover as PendingVoiceover | undefined

      setState(s => ({
        ...s,
        track,
        isPlaying: data.is_playing,
        index: data.index,
        total: data.total,
        cycle: data.cycle,
        voiceover: newVoice || null,
      }))

      // Handle incoming voiceover from server (Phase 2)
      if (djEnabled && newVoice && newVoice.text) {
        handleIncomingVoiceover(newVoice)
      }

      // Music playback sync
      const audio = musicAudioRef.current
      if (audio && track) {
        const expectedSrc = `/audio/${track.id}`
        if (audio.src !== location.origin + expectedSrc) {
          audio.src = expectedSrc
        }
        if (data.is_playing && audio.paused && !state.isDJSpeaking) {
          audio.play().catch(() => {})
        } else if (!data.is_playing && !audio.paused) {
          audio.pause()
        }
      }
    } catch (e) {
      console.warn('[radio] state refresh failed', e)
    }
  }, [djEnabled, state.isDJSpeaking])

  // Play a voiceover (either real audio file or browser speech)
  const handleIncomingVoiceover = useCallback((vo: PendingVoiceover) => {
    if (!djEnabled) return

    setState(s => ({ ...s, isDJSpeaking: true, voiceover: vo }))

    const music = musicAudioRef.current
    if (music) {
      setupAudioDucking()
      duckMusic(true)
      // Pause music while DJ speaks (we'll resume on voice end)
      music.pause()
    }

    // Prefer real audio clip if server gave us one
    if (vo.audio_url) {
      const voiceEl = voiceAudioRef.current
      if (voiceEl) {
        voiceEl.src = vo.audio_url
        voiceEl.volume = voiceVolume
        voiceEl.play().catch(() => {
          // fallback to speech if audio fails
          speakWithBrowser(vo.text)
        })
      }
    } else {
      // Beautiful fallback: browser speech synthesis
      speakWithBrowser(vo.text)
    }
  }, [djEnabled, voiceVolume, setupAudioDucking, duckMusic])

  const speakWithBrowser = (text: string) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Browser does not support speechSynthesis')
      setState(s => ({ ...s, isDJSpeaking: false }))
      duckMusic(false)
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.96
    utterance.pitch = 1.02
    utterance.volume = voiceVolume

    utterance.onend = () => {
      setState(s => ({ ...s, isDJSpeaking: false }))
      duckMusic(false)
      if (state.isPlaying && musicAudioRef.current) {
        musicAudioRef.current.play().catch(() => {})
      }
    }

    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  // Check for premium voice availability
  const checkPremiumVoice = useCallback(async () => {
    try {
      const res = await fetch('/api/health')
      const data = await res.json()
      setIsPremiumVoice(!!data.premium_voice)
    } catch {
      setIsPremiumVoice(false)
    }
  }, [])

  // Initial + periodic sync
  useEffect(() => {
    refreshState()
    checkPremiumVoice()
    const id = setInterval(refreshState, 6500)
    const healthId = setInterval(checkPremiumVoice, 30000)
    return () => {
      clearInterval(id)
      clearInterval(healthId)
    }
  }, [refreshState, checkPremiumVoice])

  // --- Playback controls (updated for DJ awareness) ---------------------
  const play = useCallback(async () => {
    setIsLoading(true)
    await control('play')
    const audio = musicAudioRef.current
    if (audio && state.track && !state.isDJSpeaking) {
      if (!audio.src) audio.src = `/audio/${state.track.id}`
      await audio.play().catch(() => {})
    }
    await refreshState()
    setIsLoading(false)
  }, [state.track, state.isDJSpeaking, refreshState])

  const pause = useCallback(async () => {
    await control('pause')
    musicAudioRef.current?.pause()
    await refreshState()
  }, [refreshState])
    await control('pause')
    audioRef.current?.pause()
    await refreshState()
  }, [refreshState])

  const next = useCallback(async () => {
    setIsLoading(true)
    await control('next')
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
    const audio = musicAudioRef.current
    if (audio && audio.duration) {
      audio.currentTime = fraction * audio.duration
    }
  }, [])

  const setVolume = useCallback((vol: number) => {
    if (musicAudioRef.current) musicAudioRef.current.volume = Math.max(0, Math.min(1, vol))
  }, [])

  const toggleDJ = useCallback(() => {
    const newVal = !djEnabled
    setDjEnabled(newVal)
    if (!newVal) {
      // Stop any current speaking
      window.speechSynthesis?.cancel()
      voiceAudioRef.current?.pause()
      setState(s => ({ ...s, isDJSpeaking: false }))
      duckMusic(false)
    }
  }, [djEnabled, duckMusic])

  const updateVoiceVolume = useCallback((v: number) => {
    setVoiceVolume(v)
    if (voiceAudioRef.current) voiceAudioRef.current.volume = v
  }, [])

  const setSleepTimer = useCallback((minutes: number) => {
    if (sleepTimeoutRef.current) {
      clearTimeout(sleepTimeoutRef.current)
    }
    setSleepMinutes(minutes)

    if (minutes > 0) {
      sleepTimeoutRef.current = window.setTimeout(() => {
        // Gentle fade out + pause
        const audio = musicAudioRef.current
        if (audio) {
          const fade = setInterval(() => {
            if (audio.volume > 0.05) {
              audio.volume = Math.max(0.02, audio.volume - 0.08)
            } else {
              clearInterval(fade)
              audio.pause()
              pause()
              setSleepMinutes(0)
            }
          }, 120)
        }
      }, minutes * 60 * 1000)
    }
  }, [pause])

  return {
    ...state,
    isLoading,
    djEnabled,
    voiceVolume,
    play,
    pause,
    next,
    jumpTo,
    seek,
    setVolume,
    toggleDJ,
    updateVoiceVolume,
    sleepMinutes,
    setSleepTimer,
    isPremiumVoice,
    musicAudioRef,
    refresh: refreshState,
  }
}
