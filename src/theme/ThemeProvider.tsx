import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ThemeContext,
  THEME_DEFAULTS,
  type ThemeContextValue,
  type ThemeState,
} from './themeContext'

const STORAGE_KEY = 'cauris-theme'

function load(): ThemeState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') {
        return { ...THEME_DEFAULTS, ...(parsed as Partial<ThemeState>) }
      }
    }
  } catch {
    return THEME_DEFAULTS
  }
  return THEME_DEFAULTS
}

/**
 * Applique le thème sur <html>, logique EXACTE de design/wireframe/app.jsx :
 * data-theme, data-glass, --accent, et brandNav qui surcharge
 * --solid/--on-solid/--feature/--feature-ink (blancs via le token --on-accent).
 */
function apply(s: ThemeState): void {
  const r = document.documentElement
  r.setAttribute('data-theme', s.dark ? 'dark' : 'light')
  r.setAttribute('data-glass', s.glass ? 'on' : 'off')
  r.style.setProperty('--accent', s.accent)
  if (s.brandNav) {
    r.style.setProperty('--solid', 'var(--accent)')
    r.style.setProperty('--on-solid', 'var(--on-accent)')
    r.style.setProperty('--feature', 'var(--accent)')
    r.style.setProperty('--feature-ink', 'var(--on-accent)')
  } else {
    for (const p of ['--solid', '--on-solid', '--feature', '--feature-ink']) {
      r.style.removeProperty(p)
    }
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ThemeState>(load)

  useEffect(() => {
    apply(state)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* stockage indisponible — on ignore */
    }
  }, [state])

  const value = useMemo<ThemeContextValue>(
    () => ({
      ...state,
      setDark: (v) => setState((s) => ({ ...s, dark: v })),
      setGlass: (v) => setState((s) => ({ ...s, glass: v })),
      setAccent: (v) => setState((s) => ({ ...s, accent: v })),
      setBrandNav: (v) => setState((s) => ({ ...s, brandNav: v })),
    }),
    [state],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
