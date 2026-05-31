import { createContext, useContext } from 'react'

export interface ThemeState {
  dark: boolean
  glass: boolean
  accent: string
  brandNav: boolean
}

export interface ThemeContextValue extends ThemeState {
  setDark: (v: boolean) => void
  setGlass: (v: boolean) => void
  setAccent: (v: string) => void
  setBrandNav: (v: boolean) => void
}

/** Les 5 accents EXACTS de design/wireframe/app.jsx (ACCENTS). */
export const ACCENTS = ['#2f5d8c', '#1f7a5b', '#c2603f', '#5a55c8', '#9d4068'] as const

/** Valeurs par défaut EXACTES de TWEAK_DEFAULTS (app.jsx). */
export const THEME_DEFAULTS: ThemeState = {
  dark: false,
  glass: true,
  accent: '#2f5d8c',
  brandNav: false,
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme doit être utilisé à l’intérieur de <ThemeProvider>')
  return ctx
}
