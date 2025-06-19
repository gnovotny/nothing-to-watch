import { store } from '@/store'
import { type ReactNode, createContext, use, useEffect } from 'react'
import { THEME } from '../../../consts'

type ThemeProviderProps = {
  children: ReactNode
  defaultTheme?: THEME
  storageKey?: string
}

type ThemeProviderState = {
  theme: THEME
  setTheme: (theme: THEME) => void
}

const initialState: ThemeProviderState = {
  theme: THEME.system,
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = THEME.system,
  ...props
}: ThemeProviderProps) {
  const { theme, setTheme } = store()

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove('light', 'dark')

    if (theme === THEME.system) {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light'

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    setTheme,
  }

  return (
    <ThemeProviderContext {...props} value={value}>
      {children}
    </ThemeProviderContext>
  )
}

export const useTheme = () => {
  const context = use(ThemeProviderContext)

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')

  return context
}
