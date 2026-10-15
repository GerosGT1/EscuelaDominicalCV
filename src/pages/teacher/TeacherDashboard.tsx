import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, CheckSquare, Users, PlusCircle, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export function TeacherDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({ lessons: 0, exercises: 0, pending: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    Promise.all([
      supabase.from('lessons').select('id', { count: 'exact', head: true }).eq('teacher_id', profile.id),
      supabase.from('exercises').select('id', { count: 'exact', head: true }),
      supabase.from('attempts').select('id', { count: 'exact', head: true }).eq('status', 'submitted'),
    ]).then(([l, e, p]) => {
      setStats({ lessons: l.count ?? 0, exercises: e.count ?? 0, pending: p.count ?? 0 })
      setLoading(false)
    })
  }, [profile])

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-premium rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-display font-bold mb-1 text-white">Panel del Maestro</h1>
        <p className="text-primary-200">Bienvenido, {profile?.full_name?.split(' ')[0]}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { icon: BookOpen, label: 'Mis lecciones', value: stats.lessons, color: 'bg-primary-50 dark:bg-primary-950/70 text-primary-700 dark:text-primary-300', to: '/maestro/lecciones' },
          { icon: CheckSquare, label: 'Ejercicios', value: stats.exercises, color: 'bg-success-50 dark:bg-emerald-950/70 text-success-700 dark:text-emerald-300', to: '/maestro/ejercicios' },
          { icon: TrendingUp, label: 'Pendientes revisión', value: stats.pending, color: 'bg-gold-50 dark:bg-gold-950/70 text-gold-700 dark:text-gold-300', to: '/maestro/alumnos' },
        ].map(({ icon: Icon, label, value, color, to }) => (
          <Link key={label} to={to} className="card-hover p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link to="/maestro/lecciones/nueva" className="card-hover p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-700 dark:bg-primary-600 flex items-center justify-center flex-shrink-0">
            <PlusCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-neutral-900 dark:text-white">Nueva lección</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Crea y publica una nueva lección bíblica</p>
          </div>
        </Link>
        <Link to="/maestro/alumnos" className="card-hover p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gold-500 flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-neutral-900 dark:text-white">Ver alumnos</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Consulta el progreso y calificaciones</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
