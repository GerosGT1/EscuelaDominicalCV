import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, CheckSquare, TrendingUp, Award, Calendar, ArrowRight, Star } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { formatDateShort, truncate } from '@/lib/utils'
import type { Lesson, Attempt } from '@/types/database'

export function StudentDashboard() {
  const { profile } = useAuth()
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [recentAttempts, setRecentAttempts] = useState<Attempt[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [lessonRes, attemptsRes] = await Promise.all([
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
      ])
      if (lessonRes.data) setCurrentLesson(lessonRes.data as unknown as Lesson)
      if (attemptsRes.data) setRecentAttempts(attemptsRes.data as unknown as Attempt[])
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
        <div className="relative z-10">
          <p className="text-primary-200 text-sm mb-1">Bienvenido de vuelta</p>
          <h1 className="text-2xl font-display font-bold text-white mb-2">
            {profile?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-primary-100 text-sm">
            Continúa tu estudio de la Palabra de Dios
          </p>
          {latestScore !== null && (
            <div className="mt-4 inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5">
              <Star className="w-4 h-4 text-gold-300" />
              <span className="text-sm font-semibold">Última nota: {latestScore}/100</span>
            </div>
          )}
        </div>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: BookOpen, label: 'Lecciones', value: '—', color: 'bg-primary-50 text-primary-700' },
          { icon: CheckSquare, label: 'Ejercicios', value: recentAttempts.length.toString(), color: 'bg-success-50 text-success-700' },
          { icon: TrendingUp, label: 'Progreso', value: '—', color: 'bg-gold-50 text-gold-700' },
          { icon: Award, label: 'Promedio', value: latestScore !== null ? `${latestScore}` : '—', color: 'bg-purple-50 text-purple-700' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">{label}</p>
              <p className="text-xl font-bold text-neutral-900">{value}</p>
            </div>
          </div>
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
              <h2 className="text-xl font-display font-bold text-neutral-900">{currentLesson.title}</h2>
            </div>
            <BookOpen className="w-8 h-8 text-primary-200 flex-shrink-0" />
          </div>

          <div className="bible-text mb-4">
            <p className="text-sm font-medium text-primary-900">{currentLesson.biblical_text}</p>
          </div>

          <p className="text-sm text-neutral-600 mb-2">
            <span className="font-medium">Tema:</span> {currentLesson.theme}
          </p>
          <p className="text-sm text-neutral-600 mb-4">
            <span className="font-medium">Objetivo:</span> {truncate(currentLesson.objective, 150)}
          </p>

          <div className="flex items-center gap-2 text-xs text-neutral-400 mb-5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{currentLesson.published_at ? formatDateShort(currentLesson.published_at) : ''}</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to={`/lecciones/${currentLesson.id}`}
              className="btn-primary btn-md flex-1 justify-center"
            >
              <BookOpen className="w-4 h-4" />
              Estudiar lección
            </Link>
            <Link
              to="/ejercicios"
              className="btn-outline btn-md flex-1 justify-center"
            >
              <CheckSquare className="w-4 h-4" />
              Realizar ejercicio
            </Link>
          </div>
        </div>
      ) : (
        <div className="card p-10 text-center">
          <BookOpen className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="font-display font-semibold text-neutral-700 mb-2">Sin lecciones publicadas</h3>
          <p className="text-sm text-neutral-500">Cuando el maestro publique una lección, aparecerá aquí.</p>
        </div>
      )}

      {/* Historial de calificaciones */}
      {recentAttempts.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Calificaciones recientes</h3>
            <Link to="/mi-progreso" className="text-sm text-primary-600 hover:text-primary-800 font-medium flex items-center gap-1">
              Ver todo <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentAttempts.map((attempt) => (
              <div key={attempt.id} className="flex items-center justify-between p-3 rounded-xl bg-neutral-50">
                <div>
                  <p className="text-sm font-medium text-neutral-800">
                    {(attempt.exercise as unknown as { title: string })?.title ?? 'Ejercicio'}
                  </p>
                  <p className="text-xs text-neutral-400">{attempt.submitted_at ? formatDateShort(attempt.submitted_at) : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-primary-700">{attempt.score ?? '—'}</span>
                  <span className="text-xs text-neutral-400">/100</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progreso semanal placeholder */}
      <div className="card p-6">
        <h3 className="section-title mb-4">Progreso semanal</h3>
        <ProgressBar value={0} label="Actividades completadas" color="gold" />
        <p className="text-xs text-neutral-400 mt-3">Completa las actividades de la semana para ver tu progreso.</p>
      </div>
    </div>
  )
}
