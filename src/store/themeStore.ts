import { create } from 'zustand'

export type Theme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  try {
    const saved = localStorage.getItem('edd-theme') as Theme | null
    if (saved === 'light' || saved === 'dark') {
      applyThemeToDom(saved)
      return saved
    }
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initial = prefersDark ? 'dark' : 'light'
    applyThemeToDom(initial)
    return initial
  } catch {
    return 'light'
  }
}

function applyThemeToDom(theme: Theme) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
  try {
    localStorage.setItem('edd-theme', theme)
  } catch {}
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getInitialTheme(),
  toggleTheme: () => {
    set((state) => {
      const nextTheme: Theme = state.theme === 'light' ? 'dark' : 'light'
      applyThemeToDom(nextTheme)
      return { theme: nextTheme }
    })
  },
  setTheme: (theme: Theme) => {
    applyThemeToDom(theme)
    set({ theme })
  },
}))
