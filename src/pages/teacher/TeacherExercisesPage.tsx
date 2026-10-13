import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckSquare, BookOpen, AlertCircle, ArrowRight, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import type { Lesson, Exercise } from '@/types/database'

interface LessonWithExercise extends Lesson {
  exercise?: Exercise & { question_count?: number }
}

export function TeacherExercisesPage() {
  const { profile } = useAuth()
  const [lessons, setLessons] = useState<LessonWithExercise[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return

    const lessonsQuery = profile.role === 'admin'
      ? supabase.from('lessons').select('*').order('number', { ascending: false })
      : supabase.from('lessons').select('*').eq('teacher_id', profile.id).order('number', { ascending: false })

    const exercisesQuery = supabase.from('exercises').select('*, questions:questions(id)')

    Promise.all([lessonsQuery, exercisesQuery]).then(([lessonsRes, exercisesRes]) => {
      const lessonsData = (lessonsRes.data ?? []) as Lesson[]
      const exercisesData = (exercisesRes.data ?? []) as (Exercise & { questions?: { id: string }[] })[]

      const combined: LessonWithExercise[] = lessonsData.map((lesson) => {
        const found = exercisesData.find((ex) => ex.lesson_id === lesson.id)
        return {
          ...lesson,
          exercise: found ? {
            ...found,
            question_count: found.questions?.length ?? 0
          } : undefined
        }
      })

      setLessons(combined)
      setLoading(false)
    })
  }, [profile])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const withExerciseCount = lessons.filter((l) => l.exercise).length
  const pendingCount = lessons.length - withExerciseCount

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title text-2xl">Ejercicios y Evaluaciones</h1>
          <p className="section-subtitle">
            Diseña los cuestionarios de cada lección para calificar a los alumnos (0 a 100 puntos)
          </p>
        </div>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-neutral-500">Total Lecciones</p>
            <p className="text-xl font-bold text-neutral-900">{lessons.length}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-success-50 text-success-700 flex items-center justify-center font-bold">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-neutral-500">Con Ejercicio Activo</p>
            <p className="text-xl font-bold text-success-700">{withExerciseCount}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold-50 text-gold-700 flex items-center justify-center font-bold">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-neutral-500">Pendientes de Ejercicio</p>
            <p className="text-xl font-bold text-gold-700">{pendingCount}</p>
          </div>
        </div>
      </div>

      {lessons.length === 0 ? (
        <div className="card p-10 text-center">
          <BookOpen className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="font-semibold text-neutral-700 mb-2">No hay lecciones registradas aún</h3>
          <p className="text-sm text-neutral-500 mb-4">
            Primero crea una lección bíblica para poder asignarle su ejercicio interactivo.
          </p>
          <Link to="/maestro/lecciones/nueva" className="btn-primary btn-md inline-flex">
            Crear primera lección
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson) => {
            const hasEx = Boolean(lesson.exercise)

            return (
              <div
                key={lesson.id}
                className="card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      hasEx ? 'bg-success-50 text-success-700' : 'bg-gold-50 text-gold-700'
                    }`}
                  >
                    <CheckSquare className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-semibold text-primary-800 bg-primary-50 px-2 py-0.5 rounded-md">
                        Lección {lesson.number}
                      </span>
                      {hasEx ? (
                        <Badge variant="green">
                          ✓ {lesson.exercise?.question_count} pregunta{lesson.exercise?.question_count !== 1 ? 's' : ''}
                        </Badge>
                      ) : (
                        <Badge variant="gold">Pendiente de crear</Badge>
                      )}
                      <Badge variant={lesson.status === 'published' ? 'green' : 'gray'}>
                        {lesson.status === 'published' ? 'Publicada' : 'Borrador'}
                      </Badge>
                    </div>

                    <h3 className="font-semibold text-neutral-900 text-base">{lesson.title}</h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {lesson.exercise?.title ? (
                        <span className="text-neutral-700 font-medium">
                          Título: {lesson.exercise.title}
                        </span>
                      ) : (
                        <span className="text-neutral-400 italic">Sin cuestionario configurado</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-neutral-100 justify-end">
                  {hasEx && (
                    <Link
                      to={`/ejercicios/${lesson.exercise?.id}`}
                      className="btn-outline btn-sm text-xs inline-flex items-center gap-1 text-neutral-600"
                      title="Probar vista previa de alumno"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Vista previa
                    </Link>
                  )}

                  <Link
                    to={`/maestro/ejercicios/${lesson.id}`}
                    className={`btn-sm text-xs inline-flex items-center gap-1.5 ${
                      hasEx ? 'btn-primary' : 'btn-gold'
                    }`}
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    {hasEx ? 'Editar Preguntas' : 'Crear Ejercicio'}
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
