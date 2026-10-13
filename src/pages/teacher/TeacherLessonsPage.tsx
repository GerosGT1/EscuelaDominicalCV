import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, Edit, BookOpen, Eye, CheckSquare } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { formatDateShort } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Lesson, LessonStatus } from '@/types/database'

const STATUS_LABELS: Record<LessonStatus, string> = {
  draft: 'Borrador',
  published: 'Publicada',
  archived: 'Archivada',
}
const STATUS_VARIANTS: Record<LessonStatus, 'gray' | 'green' | 'blue'> = {
  draft: 'gray',
  published: 'green',
  archived: 'blue',
}

export function TeacherLessonsPage() {
  const { profile } = useAuth()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [exerciseLessonIds, setExerciseLessonIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const load = () => {
    if (!profile) return
    const lessonsQuery = profile.role === 'admin'
      ? supabase.from('lessons').select('*').order('created_at', { ascending: false })
      : supabase.from('lessons').select('*').eq('teacher_id', profile.id).order('created_at', { ascending: false })

    const exercisesQuery = supabase.from('exercises').select('lesson_id')

    Promise.all([lessonsQuery, exercisesQuery]).then(([lessonsRes, exercisesRes]) => {
      if (lessonsRes.data) setLessons(lessonsRes.data as Lesson[])
      if (exercisesRes.data) {
        const ids = new Set<string>(exercisesRes.data.map((e: { lesson_id: string }) => e.lesson_id))
        setExerciseLessonIds(ids)
      }
      setLoading(false)
    })
  }

  useEffect(() => {
    load()
  }, [profile])

  const changeStatus = async (lessonId: string, status: LessonStatus) => {
    const updates: Partial<Lesson> = { status }
    if (status === 'published') updates.published_at = new Date().toISOString()
    const { error } = await supabase.from('lessons').update(updates).eq('id', lessonId)
    if (error) {
      toast.error('Error al actualizar el estado')
      return
    }
    toast.success('Estado actualizado')
    load()
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title text-2xl">Mis lecciones</h1>
          <p className="section-subtitle">
            Crea contenidos bíblicos y administra sus ejercicios de evaluación
          </p>
        </div>
        <Link to="/maestro/lecciones/nueva" className="btn-primary btn-md self-start sm:self-auto">
          <PlusCircle className="w-4 h-4" />
          Nueva Lección
        </Link>
      </div>

      {lessons.length === 0 ? (
        <div className="card p-10 text-center">
          <BookOpen className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="font-semibold text-neutral-700">Aún no has creado lecciones</h3>
          <p className="text-sm text-neutral-500 mt-1 mb-6">
            Comienza publicando la primera lección bíblica para tus alumnos
          </p>
          <Link to="/maestro/lecciones/nueva" className="btn-primary btn-md inline-flex">
            <PlusCircle className="w-4 h-4" />
            Crear lección
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson) => {
            const hasExercise = exerciseLessonIds.has(lesson.id)

            return (
              <div key={lesson.id} className="card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0 text-primary-700 mt-0.5">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-semibold text-primary-800 bg-primary-50 px-2 py-0.5 rounded-md">
                        Lección {lesson.number}
                      </span>
                      <Badge variant={STATUS_VARIANTS[lesson.status]}>
                        {STATUS_LABELS[lesson.status]}
                      </Badge>
                      {hasExercise ? (
                        <Badge variant="green">✓ Con ejercicio</Badge>
                      ) : (
                        <Badge variant="gold">⚠️ Sin ejercicio</Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-neutral-900 text-base">{lesson.title}</h3>
                    <p className="text-xs text-gold-600 font-medium">{lesson.theme}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {lesson.created_at ? formatDateShort(lesson.created_at) : ''}
                    </p>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex flex-wrap items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-neutral-100 justify-end">
                  {/* Botón directo de Ejercicio */}
                  <Link
                    to={`/maestro/ejercicios/${lesson.id}`}
                    className={`btn-sm text-xs inline-flex items-center gap-1.5 ${
                      hasExercise ? 'btn-outline text-primary-700' : 'btn-gold'
                    }`}
                    title={hasExercise ? 'Editar preguntas del ejercicio' : 'Crear preguntas del ejercicio'}
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    {hasExercise ? 'Editar Ejercicio' : 'Crear Ejercicio'}
                  </Link>

                  {/* Publicar / Archivar */}
                  {lesson.status === 'draft' && (
                    <button
                      onClick={() => changeStatus(lesson.id, 'published')}
                      className="btn-outline btn-sm text-xs text-success-700 border-success-300 hover:bg-success-50"
                    >
                      Publicar
                    </button>
                  )}
                  {lesson.status === 'published' && (
                    <>
                      <Link
                        to={`/lecciones/${lesson.id}`}
                        className="btn-ghost btn-sm text-neutral-600"
                        title="Ver lección"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => changeStatus(lesson.id, 'archived')}
                        className="btn-outline btn-sm text-xs"
                      >
                        Archivar
                      </button>
                    </>
                  )}

                  {/* Editar contenido de la lección */}
                  <Link
                    to={`/maestro/lecciones/${lesson.id}/editar`}
                    className="btn-ghost btn-sm text-primary-700"
                    title="Editar lección"
                  >
                    <Edit className="w-4 h-4" />
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
