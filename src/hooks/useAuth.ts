import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { Profile } from '@/types/database'

export function useAuthInit() {
  const { setUser, setSession, setProfile, setLoading, setInitialized } = useAuthStore()

  useEffect(() => {
    // Sesión inicial
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user)
      }
      setLoading(false)
      setInitialized(true)
    })

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(user: { id: string; email?: string; user_metadata?: Record<string, any> }) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (data) {
      setProfile(data as Profile)
    } else {
      const fallback: Profile = {
        id: user.id,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
        email: user.email || '',
        role: 'student',
        group_id: user.user_metadata?.group_id || null,
        avatar_url: null,
        is_active: true,
        created_at: new Date().toISOString(),
      }
      try {
        const { data: created } = await supabase
          .from('profiles')
          .upsert(fallback)
          .select()
          .single()
        setProfile((created as Profile) || fallback)
      } catch {
        setProfile(fallback)
      }
    }
  }
}

export function useAuth() {
  return useAuthStore()
}
