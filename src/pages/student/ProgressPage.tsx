import { useEffect, useState } from 'react'
import { BarChart2, Award, CheckSquare } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { formatDateShort, scoreColor, scorelabel } from '@/lib/utils'
import type { Attempt } from '@/types/database'

export function ProgressPage() {
  const { profile } = useAuth()
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    supabase
      .from('attempts')
      .select('*, exercise:exercises(title)')
      .eq('student_id', profile.id)
      .in('status', ['submitted', 'graded'])
      .order('submitted_at', { ascending: false })
      .then(({ data }) => {
        if (data) setAttempts(data as unknown as Attempt[])
        setLoading(false)
      })
  }, [profile])

  const avgScore = attempts.length > 0
    ? Math.round(attempts.filter(a => a.score !== null).reduce((acc, a) => acc + (a.score ?? 0), 0) / attempts.filter(a => a.score !== null).length)
    : null

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title text-2xl">Mi progreso</h1>
        <p className="section-subtitle">Consulta tu historial de calificaciones y actividad</p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card p-5 text-center">
          <div className="w-12 h-12 rounded-full bg-gold-50 flex items-center justify-center mx-auto mb-3">
            <Award className="w-6 h-6 text-gold-600" />
          </div>
          <p className={`text-3xl font-bold mb-1 ${avgScore !== null ? scoreColor(avgScore) : 'text-neutral-300'}`}>
            {avgScore ?? '—'}
          </p>
          <p className="text-xs text-neutral-500">Promedio</p>
        </div>
        <div className="card p-5 text-center">
          <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-3">
            <CheckSquare className="w-6 h-6 text-primary-600" />
          </div>
          <p className="text-3xl font-bold text-neutral-900 mb-1">{attempts.length}</p>
          <p className="text-xs text-neutral-500">Ejercicios completados</p>
        </div>
        <div className="card p-5 text-center col-span-2 lg:col-span-1">
          <div className="w-12 h-12 rounded-full bg-success-50 flex items-center justify-center mx-auto mb-3">
            <BarChart2 className="w-6 h-6 text-success-600" />
          </div>
          <p className="text-lg font-bold text-neutral-900 mb-1">
            {avgScore !== null ? scorelabel(avgScore) : '—'}
          </p>
          <p className="text-xs text-neutral-500">Desempeño general</p>
        </div>
      </div>

      {avgScore !== null && (
        <div className="card p-5">
          <ProgressBar value={avgScore} label="Promedio general" color="gold" size="lg" />
        </div>
      )}

      {/* Historial */}
      <div className="card p-6">
        <h2 className="section-title mb-4">Historial de calificaciones</h2>
        {attempts.length === 0 ? (
          <div className="text-center py-8">
            <CheckSquare className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-500 text-sm">Aún no has completado ningún ejercicio.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {attempts.map(attempt => (
              <div key={attempt.id} className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors">
                <div>
                  <p className="text-sm font-medium text-neutral-800">
                    {(attempt.exercise as unknown as { title: string })?.title ?? 'Ejercicio'}
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {attempt.submitted_at ? formatDateShort(attempt.submitted_at) : ''}
                  </p>
                </div>
                <div className="text-right">
                  {attempt.score !== null ? (
                    <>
                      <p className={`text-xl font-bold ${scoreColor(attempt.score)}`}>{attempt.score}</p>
                      <p className="text-xs text-neutral-400">/100</p>
                    </>
                  ) : (
                    <span className="text-xs text-warning-600 bg-warning-50 px-2 py-1 rounded-full font-medium">Pendiente</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
