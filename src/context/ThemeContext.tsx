import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import type { ThemePreference } from '../types'

interface ThemeValue {
  theme: ThemePreference
  resolvedTheme: 'dark' | 'light'
  setTheme: (theme: ThemePreference) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeValue | null>(null)
// v2 intentionally ignores the legacy dark-first preference so existing visitors
// receive the new light-first experience once, then their future choice persists.
const themeKey = 'auraflow-theme-v2'

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setTheme] = useState<ThemePreference>(() => {
    const saved = window.localStorage.getItem(themeKey)
    return saved === 'dark' || saved === 'light' || saved === 'system' ? saved : 'light'
  })
  const [systemTheme, setSystemTheme] = useState<'dark' | 'light'>(() => (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'))
  const resolvedTheme = theme === 'system' ? systemTheme : theme

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: light)')
    const update = () => setSystemTheme(media.matches ? 'light' : 'dark')
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme
    document.documentElement.style.colorScheme = resolvedTheme
    window.localStorage.setItem(themeKey, theme)
  }, [resolvedTheme, theme])

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      toggleTheme: () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')),
    }),
    [resolvedTheme, theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider.')
  return context
}
