import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, CheckSquare, TrendingUp, Award, Calendar, ArrowRight, Star, HelpCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { formatDateShort, truncate } from '@/lib/utils'
import type { Lesson, Attempt } from '@/types/database'

export function StudentDashboard() {
  const { profile } = useAuth()
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [recentAttempts, setRecentAttempts] = useState<Attempt[]>([])
  const [churchName, setChurchName] = useState('Auditorium Cristo Viene')
  const [churchLogoUrl, setChurchLogoUrl] = useState('/logos/logo-iglesia.jpg')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [lessonRes, attemptsRes, settingsRes] = await Promise.all([
        supabase
          .from('lessons')
          .select('*, teacher:profiles(full_name)')
          .eq('status', 'published')
          .order('published_at', { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from('attempts')
          .select('*, exercise:exercises(title, lesson_id)')
          .eq('student_id', profile?.id ?? '')
          .eq('status', 'graded')
          .order('submitted_at', { ascending: false })
          .limit(5),
        supabase.from('settings').select('*'),
      ])
      if (lessonRes.data) setCurrentLesson(lessonRes.data as unknown as Lesson)
      if (attemptsRes.data) setRecentAttempts(attemptsRes.data as unknown as Attempt[])
      if (settingsRes.data && settingsRes.data.length > 0) {
        const map: Record<string, string> = {}
        settingsRes.data.forEach((s: { key: string; value: string }) => { map[s.key] = s.value })
        if (map.church_name?.trim()) setChurchName(map.church_name.trim())
        if (map.church_logo_url?.trim()) setChurchLogoUrl(map.church_logo_url.trim())
      }
      setLoading(false)
    }
    if (profile) load()
  }, [profile])

  const latestScore = recentAttempts[0]?.score ?? null

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Saludo */}
      <div className="bg-gradient-premium rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full bg-white" />
          <div className="absolute -bottom-12 -left-12 w-64 h-64 rounded-full bg-gold-400" />
        </div>
        <div className="relative z-10 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-primary-200 text-xs sm:text-sm mb-1 font-medium">Bienvenido de vuelta</p>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mb-1.5 tracking-tight">
              {profile?.full_name?.split(' ')[0]} 👋
            </h1>
            <p className="text-primary-100 text-xs sm:text-sm font-medium">
              Sigamos aprendiendo de la Palabra de Dios
            </p>
            <p className="text-xs sm:text-sm text-gold-300 font-semibold mt-1 tracking-wide">
              {churchName}
            </p>
            {latestScore !== null && (
              <div className="mt-3.5 inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3.5 py-1 text-white border border-white/20">
                <Star className="w-3.5 h-3.5 text-gold-300 fill-gold-300" />
                <span className="text-xs sm:text-sm font-semibold">Última nota: {latestScore}/100</span>
              </div>
            )}
          </div>

          {/* Logotipo de la iglesia */}
          <div className="flex-shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-1.5 shadow-lg border border-white/40 flex items-center justify-center overflow-hidden">
              <img
                src={churchLogoUrl}
                alt={churchName}
                className="w-full h-full object-contain rounded-xl"
                onError={(e) => {
                  const img = e.currentTarget
                  if (img.src !== '/logos/logo-iglesia.jpg') {
                    img.src = '/logos/logo-iglesia.jpg'
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: BookOpen, label: 'Lecciones', value: currentLesson ? '1 activa' : '0', color: 'bg-primary-50 dark:bg-primary-950/70 text-primary-700 dark:text-primary-300', to: '/lecciones' },
          { icon: CheckSquare, label: 'Ejercicios hechos', value: recentAttempts.length.toString(), color: 'bg-success-50 dark:bg-emerald-950/70 text-success-700 dark:text-emerald-300', to: '/ejercicios' },
          { icon: TrendingUp, label: 'Mi progreso', value: 'Ver notas', color: 'bg-gold-50 dark:bg-gold-950/70 text-gold-700 dark:text-gold-300', to: '/mi-progreso' },
          { icon: Award, label: 'Promedio', value: latestScore !== null ? `${latestScore}/100` : '—', color: 'bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300', to: '/mi-progreso' },
        ].map(({ icon: Icon, label, value, color, to }) => (
          <Link key={label} to={to} className="card-hover p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
              <p className="text-lg font-bold text-neutral-900 dark:text-white">{value}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Lección actual */}
      {currentLesson ? (
        <div className="card p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="blue">Lección {currentLesson.number}</Badge>
                <Badge variant="green">Publicada</Badge>
              </div>
              <h2 className="text-xl font-display font-bold text-neutral-900 dark:text-white">{currentLesson.title}</h2>
            </div>
            <BookOpen className="w-8 h-8 text-primary-200 dark:text-primary-700 flex-shrink-0" />
          </div>

          <div className="bible-text mb-4">
            <p className="text-sm font-medium text-primary-900 dark:text-primary-200">{currentLesson.biblical_text}</p>
          </div>

          <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-2">
            <span className="font-medium text-neutral-900 dark:text-white">Tema:</span> {currentLesson.theme}
          </p>
          <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-4">
            <span className="font-medium text-neutral-900 dark:text-white">Objetivo:</span> {truncate(currentLesson.objective, 150)}
          </p>

          <div className="flex items-center gap-2 text-xs text-neutral-400 mb-5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{currentLesson.published_at ? formatDateShort(currentLesson.published_at) : ''}</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to={`/lecciones/${currentLesson.id}`}
              className="btn-primary btn-md flex-1 justify-center shadow-sm"
            >
              <BookOpen className="w-4 h-4" />
              Estudiar lección
            </Link>
            <Link
              to="/ejercicios"
              className="btn-gold btn-md flex-1 justify-center shadow-sm"
            >
              <CheckSquare className="w-4 h-4" />
              Realizar ejercicio
            </Link>
            <Link
              to={`/preguntas?leccion=${currentLesson.id}`}
              className="btn-outline btn-md flex-1 justify-center shadow-sm"
            >
              <HelpCircle className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              Preguntar al maestro
            </Link>
          </div>
        </div>
      ) : (
        <div className="card p-10 text-center">
          <BookOpen className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
          <h3 className="font-display font-semibold text-neutral-700 dark:text-neutral-200 mb-2">Sin lecciones publicadas</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Cuando el maestro publique una lección, aparecerá aquí.</p>
        </div>
      )}

      {/* Historial de calificaciones */}
      {recentAttempts.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Calificaciones recientes</h3>
            <Link to="/mi-progreso" className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 font-medium flex items-center gap-1">
              Ver todo <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentAttempts.map((attempt) => (
              <div key={attempt.id} className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800">
                <div>
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100">
                    {(attempt.exercise as unknown as { title: string })?.title ?? 'Ejercicio'}
                  </p>
                  <p className="text-xs text-neutral-400">{attempt.submitted_at ? formatDateShort(attempt.submitted_at) : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-primary-700 dark:text-primary-300">{attempt.score ?? '—'}</span>
                  <span className="text-xs text-neutral-400">/100</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progreso semanal */}
      <div className="card p-6">
        <h3 className="section-title mb-4">Preguntas al Maestro</h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
          ¿Tienes dudas sobre un versículo, una enseñanza o tu fe? Puedes escribirle a tu maestro y él te responderá en la plataforma.
        </p>
        <Link to="/preguntas" className="btn-outline btn-sm inline-flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          Ir a mis preguntas y respuestas
        </Link>
      </div>
    </div>
  )
}
