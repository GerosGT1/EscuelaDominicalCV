import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckSquare, ArrowLeft, Send, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { normalizeScore, scoreColor, scorelabel } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Exercise, Question, QuestionOption, Attempt } from '@/types/database'

type AnswerMap = Record<string, string> // questionId -> optionId or text

export function ExercisePage() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ score: number; correct: number; total: number } | null>(null)

  useEffect(() => {
    if (!id) return
    Promise.all([
      supabase.from('exercises').select('*').eq('id', id).single(),
      supabase
        .from('questions')
        .select('*, options:question_options(*)')
        .eq('exercise_id', id)
        .order('display_order'),
    ]).then(([exRes, qRes]) => {
      if (exRes.data) setExercise(exRes.data as unknown as Exercise)
      if (qRes.data) setQuestions(qRes.data as unknown as Question[])
      setLoading(false)
    })
  }, [id])

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const handleSubmit = async () => {
    if (!exercise || !profile) return
    setSubmitting(true)

    try {
      // Crear intento
      const { data: attemptData, error: attemptError } = await supabase
        .from('attempts')
        .insert({ exercise_id: exercise.id, student_id: profile.id, status: 'in_progress', started_at: new Date().toISOString() })
        .select()
        .single()

      if (attemptError || !attemptData) throw new Error('No se pudo crear el intento')

      const newAttempt = attemptData as unknown as Attempt

      // Evaluar respuestas
      let earnedPoints = 0
      let correctCount = 0
      const answerInserts = questions.map(q => {
        const value = answers[q.id]
        let isCorrect: boolean | null = null
        let pointsEarned = 0
        let selectedOptionId: string | null = null

        if (q.type === 'multiple_choice' || q.type === 'true_false') {
          selectedOptionId = value ?? null
          const correctOpt = q.options?.find(o => o.is_correct)
          isCorrect = correctOpt?.id === value
          if (isCorrect) { pointsEarned = q.points; earnedPoints += q.points; correctCount++ }
        } else if (q.type === 'short_answer' || q.type === 'reflection') {
          isCorrect = null // requires manual review
        } else {
          isCorrect = null
        }

        return {
          attempt_id: newAttempt.id,
          question_id: q.id,
          selected_option_id: selectedOptionId,
          text_answer: (q.type === 'short_answer' || q.type === 'fill_blank' || q.type === 'reflection') ? (value ?? null) : null,
          is_correct: isCorrect,
          points_earned: pointsEarned,
        }
      })

      await supabase.from('answers').insert(answerInserts)

      const score = normalizeScore(earnedPoints, exercise.max_score)
      const hasOpenQuestions = questions.some(q => q.type === 'short_answer' || q.type === 'reflection')

      await supabase
        .from('attempts')
        .update({
          score,
          status: hasOpenQuestions ? 'submitted' : 'graded',
          submitted_at: new Date().toISOString(),
        })
        .eq('id', newAttempt.id)

      setResult({ score, correct: correctCount, total: questions.length })
      toast.success('¡Ejercicio enviado exitosamente!')
    } catch (err) {
      toast.error('Error al enviar el ejercicio. Inténtalo de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
  if (!exercise) return <div className="text-center py-20">Ejercicio no encontrado.</div>

  if (result) {
    return (
      <div className="max-w-lg mx-auto py-12 animate-slide-up">
        <div className="card p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-primary-600" />
          </div>
          <h2 className="text-2xl font-display font-bold text-neutral-900 mb-2">¡Ejercicio completado!</h2>
          <p className="text-neutral-500 mb-6">Tu resultado:</p>
          <div className={`text-6xl font-bold mb-2 ${scoreColor(result.score)}`}>{result.score}</div>
          <p className="text-neutral-500 mb-1">puntos de 100</p>
          <p className="text-lg font-semibold text-neutral-700 mb-6">{scorelabel(result.score)}</p>
          <div className="bg-neutral-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-neutral-600">
              Respuestas correctas: <span className="font-semibold">{result.correct}/{result.total}</span>
            </p>
            {questions.some(q => q.type === 'short_answer' || q.type === 'reflection') && (
              <p className="text-xs text-warning-600 mt-2">
                Algunas respuestas requieren revisión del maestro.
              </p>
            )}
          </div>
          <button onClick={() => navigate('/ejercicios')} className="btn-primary btn-md">
            Volver a ejercicios
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700">
        <ArrowLeft className="w-4 h-4" />Volver
      </button>

      <div className="card p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
            <CheckSquare className="w-5 h-5 text-primary-700" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-neutral-900">{exercise.title}</h1>
            <p className="text-sm text-neutral-500">Puntuación máxima: {exercise.max_score} pts</p>
          </div>
        </div>
        {exercise.instructions && (
          <p className="text-sm text-neutral-700 bg-primary-50 rounded-xl p-3 mt-3">{exercise.instructions}</p>
        )}
      </div>

      {questions.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-neutral-500">Este ejercicio no tiene preguntas todavía.</p>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }} className="space-y-4">
          {questions.map((q, idx) => (
            <div key={q.id} className="card p-5">
              <p className="font-medium text-neutral-900 mb-1">
                <span className="text-primary-600 font-bold">{idx + 1}. </span>{q.text}
              </p>
              <p className="text-xs text-neutral-400 mb-3">{q.points} punto{q.points !== 1 ? 's' : ''}</p>

              {(q.type === 'multiple_choice' || q.type === 'true_false') && q.options && (
                <div className="space-y-2">
                  {q.options.map((opt: QuestionOption) => (
                    <label key={opt.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      answers[q.id] === opt.id
                        ? 'border-primary-400 bg-primary-50'
                        : 'border-neutral-200 hover:border-primary-200 hover:bg-neutral-50'
                    }`}>
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        value={opt.id}
                        checked={answers[q.id] === opt.id}
                        onChange={() => handleAnswer(q.id, opt.id)}
                        className="w-4 h-4 text-primary-600 border-neutral-300 focus:ring-primary-500"
                      />
                      <span className="text-sm text-neutral-800">{opt.text}</span>
                    </label>
                  ))}
                </div>
              )}

              {(q.type === 'short_answer' || q.type === 'fill_blank' || q.type === 'reflection') && (
                <textarea
                  rows={q.type === 'reflection' ? 4 : 2}
                  placeholder="Escribe tu respuesta aquí..."
                  className="input-base resize-none"
                  value={answers[q.id] ?? ''}
                  onChange={(e) => handleAnswer(q.id, e.target.value)}
                />
              )}
            </div>
          ))}

          <button type="submit" disabled={submitting} className="btn-gold btn-lg w-full">
            {submitting ? <LoadingSpinner size="sm" className="border-white border-t-transparent" /> : <Send className="w-5 h-5" />}
            {submitting ? 'Enviando...' : 'Enviar ejercicio'}
          </button>
        </form>
      )}
    </div>
  )
}
