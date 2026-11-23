import { useState, useEffect } from 'react'
import { X, Award, Plus, Save, Clock, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { formatDateShort, scoreColor } from '@/lib/utils'
import type { Profile, Group, Attempt, Lesson, Exercise } from '@/types/database'
import toast from 'react-hot-toast'

interface GradeStudentModalProps {
  student: Profile & { group?: Group; attempts: Attempt[] }
  lessons: Lesson[]
  exercises: Exercise[]
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function GradeStudentModal({
  student,
  lessons,
  exercises,
  isOpen,
  onClose,
  onSuccess,
}: GradeStudentModalProps) {
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('')
  const [score, setScore] = useState<number | ''>(100)
  const [feedback, setFeedback] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [editingAttemptId, setEditingAttemptId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'list' | 'form'>('list')

  // Mapeo de lecciones con ejercicio
  const lessonsWithExercises = lessons
    .map((l) => {
      const ex = exercises.find((e) => e.lesson_id === l.id)
      return { lesson: l, exercise: ex }
    })
    .filter((item): item is { lesson: Lesson; exercise: Exercise } => Boolean(item.exercise))

  useEffect(() => {
    if (lessonsWithExercises.length > 0 && !selectedExerciseId) {
      setSelectedExerciseId(lessonsWithExercises[0].exercise.id)
    }
  }, [lessonsWithExercises, selectedExerciseId])

  if (!isOpen) return null

  const handleStartNewGrade = () => {
    setEditingAttemptId(null)
    setScore(100)
    setFeedback('')
    if (lessonsWithExercises.length > 0) {
      setSelectedExerciseId(lessonsWithExercises[0].exercise.id)
    }
    setActiveTab('form')
  }

  const handleEditAttempt = (attempt: Attempt) => {
    setEditingAttemptId(attempt.id)
    setSelectedExerciseId(attempt.exercise_id)
    setScore(attempt.score ?? 100)
    setFeedback(attempt.feedback ?? '')
    setActiveTab('form')
  }

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedExerciseId) {
      toast.error('Selecciona una lección/ejercicio a calificar')
      return
    }

    const numScore = Number(score)
    if (isNaN(numScore) || numScore < 0 || numScore > 100) {
      toast.error('La nota debe ser un número entre 0 y 100')
      return
    }

    setSaving(true)
    try {
      if (editingAttemptId) {
        // Actualizar intento existente
        const { error } = await supabase
          .from('attempts')
          .update({
            score: numScore,
            status: 'graded',
            feedback: feedback.trim() || null,
          })
          .eq('id', editingAttemptId)

        if (error) throw error
        toast.success('Calificación actualizada correctamente')
      } else {
        // Verificar si ya existe un intento del alumno para este ejercicio
        const existing = student.attempts.find((a) => a.exercise_id === selectedExerciseId)
        if (existing) {
          const { error } = await supabase
            .from('attempts')
            .update({
              score: numScore,
              status: 'graded',
              feedback: feedback.trim() || null,
            })
            .eq('id', existing.id)

          if (error) throw error
          toast.success('Calificación registrada para el ejercicio')
        } else {
          // Crear nuevo intento calificado
          const { error } = await supabase.from('attempts').insert({
            exercise_id: selectedExerciseId,
            student_id: student.id,
            score: numScore,
            status: 'graded',
            feedback: feedback.trim() || null,
            started_at: new Date().toISOString(),
            submitted_at: new Date().toISOString(),
          })

          if (error) throw error
          toast.success('Nueva calificación guardada')
        }
      }

      onSuccess()
      setActiveTab('list')
    } catch (err: any) {
      console.error(err)
      toast.error('Error al guardar la calificación: ' + (err.message || 'Error desconocido'))
    } finally {
      setSaving(false)
    }
  }

  const gradedAttempts = student.attempts.filter((a) => a.score !== null)
  const average =
    gradedAttempts.length > 0
      ? Math.round(
          gradedAttempts.reduce((acc, a) => acc + (a.score ?? 0), 0) / gradedAttempts.length
        )
      : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Cabecera */}
        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-800/40">
          <div className="flex items-center gap-3">
            <Avatar name={student.full_name} src={student.avatar_url} size="md" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-neutral-900 dark:text-white text-base">
                  {student.full_name}
                </h2>
                {student.group && (
                  <Badge variant="blue" className="text-[11px]">
                    {student.group.name}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Calificaciones de Escuela Dominical
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumen rápido */}
        <div className="px-5 py-3 bg-primary-50/60 dark:bg-primary-950/40 border-b border-primary-100 dark:border-primary-900/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-neutral-500 dark:text-neutral-400">Promedio general: </span>
              <span className="font-bold text-primary-700 dark:text-primary-300 text-sm">
                {average !== null ? `${average}/100` : 'Sin notas'}
              </span>
            </div>
            <div>
              <span className="text-neutral-500 dark:text-neutral-400">Evaluaciones: </span>
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                {student.attempts.length}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                activeTab === 'list'
                  ? 'bg-white dark:bg-neutral-800 text-primary-700 dark:text-primary-300 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              Historial ({student.attempts.length})
            </button>
            <button
              onClick={handleStartNewGrade}
              className={`px-3 py-1 rounded-lg font-medium inline-flex items-center gap-1 transition-colors ${
                activeTab === 'form'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-primary-100 dark:bg-primary-900/50 text-primary-800 dark:text-primary-200 hover:bg-primary-200'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              Nueva nota
            </button>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="p-5 flex-1 overflow-y-auto scrollbar-thin">
          {activeTab === 'list' ? (
            <div className="space-y-3">
              {student.attempts.length === 0 ? (
                <div className="text-center py-12">
                  <Award className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
                  <p className="text-neutral-700 dark:text-neutral-300 font-medium">
                    Sin calificaciones registradas aún
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto mt-1 mb-4">
                    Puedes calificar los ejercicios realizados por el alumno o colocarle una nota
                    manual por asistencia, participación u hoja de trabajo.
                  </p>
                  <button
                    onClick={handleStartNewGrade}
                    className="btn-primary btn-sm inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    Colocar primera nota
                  </button>
                </div>
              ) : (
                student.attempts.map((attempt) => {
                  const exTitle =
                    (attempt.exercise as unknown as { title: string })?.title ?? 'Ejercicio'
                  return (
                    <div
                      key={attempt.id}
                      className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-neutral-900 dark:text-white text-sm truncate">
                            {exTitle}
                          </p>
                          <Badge
                            variant={attempt.status === 'graded' ? 'green' : 'gold'}
                            className="text-[10px]"
                          >
                            {attempt.status === 'graded' ? 'Calificado' : 'Por revisar'}
                          </Badge>
                        </div>

                        {attempt.submitted_at && (
                          <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDateShort(attempt.submitted_at)}
                          </p>
                        )}

                        {attempt.feedback && (
                          <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-2 bg-white dark:bg-neutral-800/60 p-2 rounded-lg border border-neutral-100 dark:border-neutral-700/50 italic">
                            «{attempt.feedback}»
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0">
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${scoreColor(attempt.score ?? 0)}`}>
                            {attempt.score ?? '—'}
                            <span className="text-xs text-neutral-400 font-normal">/100</span>
                          </p>
                        </div>
                        <button
                          onClick={() => handleEditAttempt(attempt)}
                          className="btn-outline btn-sm text-xs py-1 px-2.5"
                          title="Modificar nota o retroalimentación"
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          ) : (
            <form onSubmit={handleSaveGrade} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">
                  {editingAttemptId ? 'Editar calificación' : 'Registrar nueva calificación'}
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 underline"
                >
                  Volver al historial
                </button>
              </div>

              {/* Selección de lección */}
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Lección / Ejercicio a calificar
                </label>
                {lessonsWithExercises.length === 0 ? (
                  <div className="p-3 rounded-xl bg-gold-50 text-gold-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>No hay lecciones con ejercicios creados aún.</span>
                  </div>
                ) : (
                  <select
                    value={selectedExerciseId}
                    onChange={(e) => setSelectedExerciseId(e.target.value)}
                    className="input-base text-sm"
                    disabled={Boolean(editingAttemptId)}
                  >
                    {lessonsWithExercises.map(({ lesson: l, exercise: ex }) => (
                      <option key={ex.id} value={ex.id}>
                        Lección {l.number}: {l.title} — ({ex.title})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Nota (0 a 100) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    Nota numérica (0 a 100)
                  </label>
                  <span className="text-xs text-neutral-400">Puntaje oficial</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={score}
                    onChange={(e) =>
                      setScore(e.target.value === '' ? '' : Math.min(100, Math.max(0, Number(e.target.value))))
                    }
                    className="input-base text-xl font-bold text-center w-32 py-2"
                    placeholder="100"
                    required
                  />

                  {/* Botones de calificación rápida */}
                  <div className="flex flex-wrap gap-1.5 flex-1">
                    {[100, 95, 90, 85, 80, 70].map((quickScore) => (
                      <button
                        key={quickScore}
                        type="button"
                        onClick={() => setScore(quickScore)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg border font-semibold transition-all ${
                          score === quickScore
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-primary-400'
                        }`}
                      >
                        {quickScore} pts
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Observación / Retroalimentación pedagógica y pastoral */}
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Retroalimentación / Comentario del Maestro (Opcional)
                </label>
                <textarea
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Ej: ¡Excelente trabajo! Demostraste gran comprensión del versículo bíblico y buen desarrollo en clase..."
                  className="input-base text-sm resize-none"
                />
                <p className="text-[11px] text-neutral-400 mt-1">
                  El alumno podrá leer este mensaje cuando revise su progreso en la plataforma.
                </p>
              </div>

              {/* Botones de acción */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="btn-outline btn-md text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || !selectedExerciseId}
                  className="btn-primary btn-md text-xs inline-flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Guardando...' : 'Guardar Calificación'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
