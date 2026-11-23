import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, CheckSquare, Users, PlusCircle, TrendingUp, BarChart2, HelpCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export function TeacherDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({ lessons: 0, exercises: 0, pending: 0, questions: 0 })
  const [churchName, setChurchName] = useState('Auditorium Cristo Viene')
  const [churchLogoUrl, setChurchLogoUrl] = useState('/logos/logo-iglesia.jpg')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    Promise.all([
      supabase.from('lessons').select('id', { count: 'exact', head: true }).eq('teacher_id', profile.id),
      supabase.from('exercises').select('id', { count: 'exact', head: true }),
      supabase.from('attempts').select('id', { count: 'exact', head: true }).eq('status', 'submitted'),
      supabase.from('student_questions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('settings').select('*'),
    ]).then(([l, e, p, q, s]) => {
      setStats({
        lessons: l.count ?? 0,
        exercises: e.count ?? 0,
        pending: p.count ?? 0,
        questions: q.count ?? 0,
      })
      if (s.data && s.data.length > 0) {
        const map: Record<string, string> = {}
        s.data.forEach((item: { key: string; value: string }) => { map[item.key] = item.value })
        if (map.church_name?.trim()) setChurchName(map.church_name.trim())
        if (map.church_logo_url?.trim()) setChurchLogoUrl(map.church_logo_url.trim())
      }
      setLoading(false)
    })
  }, [profile])

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-premium rounded-2xl p-6 text-white flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold mb-1 text-white">Panel del Maestro</h1>
          <p className="text-primary-200 text-sm">Bienvenido, {profile?.full_name?.split(' ')[0]}</p>
          <p className="text-xs text-gold-300 font-semibold mt-1">{churchName}</p>
        </div>
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-1.5 shadow-md flex items-center justify-center flex-shrink-0 overflow-hidden border border-white/30">
          <img
            src={churchLogoUrl}
            alt={churchName}
            className="w-full h-full object-contain rounded-xl"
            onError={(e) => {
              const img = e.currentTarget
              if (img.src !== '/logos/logo-iglesia.jpg') img.src = '/logos/logo-iglesia.jpg'
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: BookOpen, label: 'Mis lecciones', value: stats.lessons, color: 'bg-primary-50 dark:bg-primary-950/70 text-primary-700 dark:text-primary-300', to: '/maestro/lecciones' },
          { icon: CheckSquare, label: 'Ejercicios', value: stats.exercises, color: 'bg-success-50 dark:bg-emerald-950/70 text-success-700 dark:text-emerald-300', to: '/maestro/ejercicios' },
          { icon: TrendingUp, label: 'Por calificar', value: stats.pending, color: 'bg-gold-50 dark:bg-gold-950/70 text-gold-700 dark:text-gold-300', to: '/maestro/alumnos' },
          { icon: HelpCircle, label: 'Preguntas pendientes', value: stats.questions, color: 'bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300', to: '/maestro/preguntas' },
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

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/maestro/lecciones/nueva" className="card-hover p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-700 dark:bg-primary-600 flex items-center justify-center flex-shrink-0">
            <PlusCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">Nueva lección</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Crear lección bíblica</p>
          </div>
        </Link>
        <Link to="/maestro/alumnos" className="card-hover p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold-500 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">Calificar alumnos</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Progreso y notas</p>
          </div>
        </Link>
        <Link to="/maestro/reportes" className="card-hover p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
            <BarChart2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">Reportes</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Métricas e impresión</p>
          </div>
        </Link>
        <Link to="/maestro/preguntas" className="card-hover p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center flex-shrink-0">
            <HelpCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">Preguntas</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Dudas de estudiantes</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
