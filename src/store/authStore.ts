import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile, Role } from '@/types/database'

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  initialized: boolean
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
  clear: () => void
  // Helpers
  isAdmin: () => boolean
  isTeacher: () => boolean
  isStudent: () => boolean
  hasRole: (role: Role) => boolean
}

export const useAuthStore = create<AuthState>()(persist(
  (set, get) => ({
    user: null,
    session: null,
    profile: null,
    loading: true,
    initialized: false,
    setUser: (user) => set({ user }),
    setSession: (session) => set({ session }),
    setProfile: (profile) => set({ profile }),
    setLoading: (loading) => set({ loading }),
    setInitialized: (initialized) => set({ initialized }),
    clear: () => set({ user: null, session: null, profile: null }),
    isAdmin: () => get().profile?.role === 'admin',
    isTeacher: () => get().profile?.role === 'teacher',
    isStudent: () => get().profile?.role === 'student',
    hasRole: (role) => get().profile?.role === role,
  }),
  {
    name: 'edd-auth',
    partialize: (state) => ({ profile: state.profile }),
  }
))
