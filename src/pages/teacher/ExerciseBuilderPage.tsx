import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PlusCircle, Trash2, Save, ArrowLeft, BookOpen, CheckSquare } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'
import type { Exercise, Question, QuestionType, Lesson } from '@/types/database'

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'multiple_choice', label: 'Selección múltiple' },
  { value: 'true_false', label: 'Verdadero o Falso' },
  { value: 'fill_blank', label: 'Completar espacios' },
  { value: 'short_answer', label: 'Respuesta corta' },
  { value: 'reflection', label: 'Reflexión personal' },
]

interface LocalQuestion {
  id?: string
  type: QuestionType
  text: string
  points: number
  options: { text: string; is_correct: boolean }[]
}

export function ExerciseBuilderPage() {
  const { id: lessonId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [title, setTitle] = useState('')
  const [instructions, setInstructions] = useState('')
  const [questions, setQuestions] = useState<LocalQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!lessonId) return

    Promise.all([
      supabase.from('lessons').select('*').eq('id', lessonId).single(),
      supabase
        .from('exercises')
        .select('*, questions:questions(*, options:question_options(*))')
        .eq('lesson_id', lessonId)
        .maybeSingle(),
    ]).then(([lessonRes, exRes]) => {
      if (lessonRes.data) {
        const l = lessonRes.data as Lesson
        setLesson(l)
        if (!exRes.data) {
          setTitle(`Ejercicio: ${l.title}`)
          setInstructions('Lee cuidadosamente cada pregunta y selecciona o escribe tu respuesta basada en la lección.')
        }
      }

      if (exRes.data) {
        const ex = exRes.data as unknown as Exercise
        setExercise(ex)
        setTitle(ex.title)
        setInstructions(ex.instructions ?? '')
        setQuestions(
          ex.questions?.map((q) => ({
            id: q.id,
            type: q.type,
            text: q.text,
            points: q.points,
            options: q.options?.map((o) => ({ text: o.text, is_correct: o.is_correct })) ?? [],
          })) ?? []
        )
      }

      setLoading(false)
    })
  }, [lessonId])

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        type: 'multiple_choice',
        text: '',
        points: 10,
        options: [
          { text: '', is_correct: true },
          { text: '', is_correct: false },
        ],
      },
    ])
  }

  const removeQuestion = (idx: number) => setQuestions((prev) => prev.filter((_, i) => i !== idx))

  const updateQuestion = (idx: number, updates: Partial<LocalQuestion>) =>
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...updates } : q)))

  const addOption = (qIdx: number) =>
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx ? { ...q, options: [...q.options, { text: '', is_correct: false }] } : q
      )
    )

  const updateOption = (qIdx: number, oIdx: number, text: string) =>
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx
          ? { ...q, options: q.options.map((o, j) => (j === oIdx ? { ...o, text } : o)) }
          : q
      )
    )

  const setCorrect = (qIdx: number, oIdx: number) =>
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx
          ? { ...q, options: q.options.map((o, j) => ({ ...o, is_correct: j === oIdx })) }
          : q
      )
    )

  const handleSave = async () => {
    if (!lessonId || !title.trim()) {
      toast.error('Ingresa el título del ejercicio')
      return
    }
    if (questions.length === 0) {
      toast.error('Agrega al menos una pregunta al ejercicio')
      return
    }

    setSaving(true)
    try {
      const maxScore = questions.reduce((acc, q) => acc + (q.points || 0), 0) || 100
      let exerciseId: string

      if (exercise) {
        await supabase
          .from('exercises')
          .update({ title: title.trim(), instructions: instructions.trim(), max_score: maxScore })
          .eq('id', exercise.id)
        exerciseId = exercise.id
        await supabase.from('questions').delete().eq('exercise_id', exerciseId)
      } else {
        const { data, error } = await supabase
          .from('exercises')
          .insert({
            lesson_id: lessonId,
            title: title.trim(),
            instructions: instructions.trim(),
            max_score: maxScore,
            max_attempts: 3,
          })
          .select()
          .single()
        if (error || !data) throw error
        exerciseId = (data as unknown as Exercise).id
      }

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i]
        const { data: qData } = await supabase
          .from('questions')
          .insert({
            exercise_id: exerciseId,
            type: q.type,
            text: q.text.trim(),
            points: q.points || 10,
            display_order: i,
          })
          .select()
          .single()

        if (!qData) continue
        const qId = (qData as unknown as Question).id

        if ((q.type === 'multiple_choice' || q.type === 'true_false') && q.options.length > 0) {
          await supabase.from('question_options').insert(
            q.options.map((o, j) => ({
              question_id: qId,
              text: o.text.trim(),
              is_correct: o.is_correct,
              display_order: j,
            }))
          )
        }
      }

      toast.success('¡Ejercicio guardado exitosamente!')
      navigate('/maestro/ejercicios')
    } catch {
      toast.error('Error al guardar el ejercicio')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Botón volver y cabecera */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/maestro/ejercicios')}
          className="btn-outline btn-sm inline-flex items-center gap-1.5 text-neutral-600"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a ejercicios
        </button>

        {lesson && (
          <div className="flex items-center gap-2 text-xs bg-primary-50 text-primary-800 font-semibold px-3 py-1.5 rounded-lg border border-primary-200">
            <BookOpen className="w-3.5 h-3.5 text-primary-600" />
            <span>Lección {lesson.number}: {lesson.title}</span>
          </div>
        )}
      </div>

      <div>
        <h1 className="section-title text-2xl flex items-center gap-2">
          <CheckSquare className="w-6 h-6 text-gold-500" />
          Constructor de Ejercicio
        </h1>
        <p className="section-subtitle">
          Configura las preguntas y respuestas correctas para evaluar a tus alumnos (0 a 100 puntos)
        </p>
      </div>

      {/* Datos del ejercicio */}
      <div className="card p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            Título del ejercicio *
          </label>
          <input
            className="input-base"
            placeholder="Ej: Cuestionario de repaso - Lección 1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            Instrucciones para el alumno
          </label>
          <textarea
            rows={2}
            className="input-base resize-none"
            placeholder="Instrucciones sobre cómo contestar las preguntas..."
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
          />
        </div>
      </div>

      {/* Lista de preguntas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-display font-semibold text-neutral-900">
            Preguntas ({questions.length})
          </h2>
          <span className="text-xs text-neutral-500">
            Puntos acumulados: {questions.reduce((acc, q) => acc + (q.points || 0), 0)} pts
          </span>
        </div>

        {questions.length === 0 ? (
          <div className="card p-8 text-center bg-neutral-50 border-dashed border-2 border-neutral-200">
            <CheckSquare className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-neutral-600 mb-1">Aún no has agregado preguntas</p>
            <p className="text-xs text-neutral-400 mb-4">
              Puedes agregar preguntas de opción múltiple, verdadero/falso o respuesta libre.
            </p>
            <button onClick={addQuestion} className="btn-primary btn-sm inline-flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4" />
              Agregar primera pregunta
            </button>
          </div>
        ) : (
          questions.map((q, qIdx) => (
            <div key={qIdx} className="card p-6 space-y-4 border-l-4 border-l-primary-600">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-primary-900 bg-primary-100 px-2.5 py-0.5 rounded-full">
                  Pregunta {qIdx + 1}
                </span>
                <button
                  onClick={() => removeQuestion(qIdx)}
                  className="text-danger-500 hover:text-danger-700 p-1 rounded-lg text-xs flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-neutral-600 mb-1">
                    Tipo de pregunta
                  </label>
                  <select
                    className="input-base text-sm"
                    value={q.type}
                    onChange={(e) => {
                      const newType = e.target.value as QuestionType
                      let newOptions = q.options
                      if (newType === 'true_false') {
                        newOptions = [
                          { text: 'Verdadero', is_correct: true },
                          { text: 'Falso', is_correct: false },
                        ]
                      }
                      updateQuestion(qIdx, { type: newType, options: newOptions })
                    }}
                  >
                    {QUESTION_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">
                    Puntos
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="input-base text-sm"
                    value={q.points}
                    onChange={(e) => updateQuestion(qIdx, { points: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">
                  Enunciado de la pregunta *
                </label>
                <textarea
                  rows={2}
                  className="input-base text-sm resize-none"
                  placeholder="Escribe la pregunta aquí..."
                  value={q.text}
                  onChange={(e) => updateQuestion(qIdx, { text: e.target.value })}
                />
              </div>

              {/* Opciones para opción múltiple o V/F */}
              {(q.type === 'multiple_choice' || q.type === 'true_false') && (
                <div className="bg-neutral-50 p-4 rounded-xl space-y-3">
                  <p className="text-xs font-semibold text-neutral-700">
                    Opciones de respuesta (Marca el botón circular en la respuesta correcta):
                  </p>

                  {q.type === 'true_false' ? (
                    <div className="flex gap-4">
                      {['Verdadero', 'Falso'].map((opt, oIdx) => (
                        <label
                          key={oIdx}
                          className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-neutral-200"
                        >
                          <input
                            type="radio"
                            name={`correct-${qIdx}`}
                            checked={q.options[oIdx]?.is_correct}
                            onChange={() => setCorrect(qIdx, oIdx)}
                            className="w-4 h-4 text-primary-600"
                          />
                          <span className="text-sm font-medium text-neutral-800">{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${qIdx}`}
                            checked={opt.is_correct}
                            onChange={() => setCorrect(qIdx, oIdx)}
                            className="w-4 h-4 text-primary-600 flex-shrink-0"
                            title="Marcar como respuesta correcta"
                          />
                          <input
                            className="input-base text-sm py-1.5"
                            placeholder={`Opción ${oIdx + 1}`}
                            value={opt.text}
                            onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                          />
                          {q.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newOpts = q.options.filter((_, j) => j !== oIdx)
                                updateQuestion(qIdx, { options: newOpts })
                              }}
                              className="text-neutral-400 hover:text-danger-500 p-1"
                              title="Quitar opción"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => addOption(qIdx)}
                        className="btn-ghost btn-sm text-primary-600 text-xs mt-1"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        Agregar otra opción
                      </button>
                    </div>
                  )}
                </div>
              )}

              {(q.type === 'short_answer' || q.type === 'reflection') && (
                <div className="bg-primary-50/50 p-3 rounded-xl border border-primary-100 text-xs text-primary-800">
                  ℹ️ Esta pregunta requiere respuesta libre del alumno. La plataforma la guardará y tú podrás revisarla y calificarla desde tu panel de alumnos.
                </div>
              )}
            </div>
          ))
        )}

        <button
          onClick={addQuestion}
          className="btn-outline btn-md w-full border-dashed border-2 text-primary-700 hover:bg-primary-50 py-3"
        >
          <PlusCircle className="w-4 h-4" />
          Agregar otra pregunta
        </button>
      </div>

      {/* Botón Guardar */}
      <div className="pt-4 border-t border-neutral-200">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary btn-xl w-full justify-center shadow-card-lg"
        >
          {saving ? (
            <LoadingSpinner size="sm" className="border-white border-t-transparent" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {saving ? 'Guardando ejercicio...' : 'Guardar y Publicar Ejercicio'}
        </button>
      </div>
    </div>
  )
}
