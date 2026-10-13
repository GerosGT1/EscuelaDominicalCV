import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckSquare, Clock, Trophy } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { formatDateShort } from '@/lib/utils'
import type { Exercise } from '@/types/database'

export function ExercisesPage() {
  const { profile } = useAuth()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('exercises')
      .select('*, lesson:lessons(title, status)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) {
          const visible = data.filter(
            (ex: unknown) => (ex as { lesson?: { status?: string } }).lesson?.status === 'published'
          )
          setExercises(visible as unknown as Exercise[])
        }
        setLoading(false)
      })
  }, [profile])

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title text-2xl">Ejercicios</h1>
        <p className="section-subtitle">Completa los ejercicios de cada lección para obtener tu puntuación</p>
      </div>

      {exercises.length === 0 ? (
        <div className="card p-10 text-center">
          <CheckSquare className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="font-semibold text-neutral-700">No hay ejercicios disponibles</h3>
          <p className="text-sm text-neutral-500 mt-1">El maestro publicará ejercicios próximamente.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {exercises.map((ex) => (
            <Link key={ex.id} to={`/ejercicios/${ex.id}`} className="card-hover p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                  <CheckSquare className="w-5 h-5 text-primary-700" />
                </div>
                <Badge variant="blue">{ex.max_score} pts</Badge>
              </div>
              <h3 className="font-display font-semibold text-neutral-900 mb-1">{ex.title}</h3>
              {ex.instructions && <p className="text-xs text-neutral-500 mb-3 line-clamp-2">{ex.instructions}</p>}
              <div className="flex items-center gap-3 text-xs text-neutral-400">
                {ex.deadline && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Límite: {formatDateShort(ex.deadline)}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Trophy className="w-3 h-3" />
                  Máx. {ex.max_attempts} intento{ex.max_attempts !== 1 ? 's' : ''}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
