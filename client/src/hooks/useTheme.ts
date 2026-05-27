import { useState, useEffect, useCallback } from 'react'

export type Theme = 'vintage' | 'noir' | 'neon'

const THEME_STORAGE_KEY = 'ai-radio-theme'

const THEME_LABELS: Record<Theme, string> = {
  vintage: 'Vintage Radio',
  noir: 'Noir (Dark Modern)',
  neon: 'Neon / Synthwave',
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('vintage')

  // Apply theme to document
  const applyTheme = useCallback((newTheme: Theme) => {
    document.documentElement.setAttribute('data-theme', newTheme)
    setThemeState(newTheme)
    localStorage.setItem(THEME_STORAGE_KEY, newTheme)
  }, [])

  // Load saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
    if (saved && ['vintage', 'noir', 'neon'].includes(saved)) {
      applyTheme(saved)
    } else {
      // Default
      document.documentElement.setAttribute('data-theme', 'vintage')
    }
  }, [applyTheme])

  const setTheme = (newTheme: Theme) => {
    applyTheme(newTheme)
  }

  const cycleTheme = () => {
    const themes: Theme[] = ['vintage', 'noir', 'neon']
    const currentIndex = themes.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }

  return {
    theme,
    setTheme,
    cycleTheme,
    themeLabel: THEME_LABELS[theme],
    themes: [
      { id: 'vintage' as const, label: THEME_LABELS.vintage },
      { id: 'noir' as const, label: THEME_LABELS.noir },
      { id: 'neon' as const, label: THEME_LABELS.neon },
    ],
  }
}
