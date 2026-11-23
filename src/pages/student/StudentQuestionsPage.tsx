import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  HelpCircle,
  Plus,
  Clock,
  CheckCircle2,
  BookOpen,
  MessageSquare,
  Send,
  Trash2,
  X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { formatDateShort } from '@/lib/utils'
import type { StudentQuestion, Lesson } from '@/types/database'
import toast from 'react-hot-toast'

export function StudentQuestionsPage() {
  const { profile } = useAuth()
  const [searchParams] = useSearchParams()
  const preselectedLessonId = searchParams.get('leccion')

  const [questions, setQuestions] = useState<StudentQuestion[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(Boolean(preselectedLessonId))

  // Formulario de nueva pregunta
  const [selectedLessonId, setSelectedLessonId] = useState<string>(preselectedLessonId ?? '')
  const [questionText, setQuestionText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadData = async () => {
    if (!profile) return
    setLoading(true)

    try {
      const [qRes, lRes] = await Promise.all([
        supabase
          .from('student_questions')
          .select('*, teacher:profiles!teacher_id(full_name, avatar_url), lesson:lessons(title, number)')
          .eq('student_id', profile.id)
          .order('created_at', { ascending: false }),
        supabase.from('lessons').select('*').order('number', { ascending: true }),
      ])

      if (qRes.error) {
        // Si la tabla no existe aún en Supabase, mostramos estado amigable
        console.warn('student_questions query error:', qRes.error)
      } else {
        setQuestions((qRes.data ?? []) as unknown as StudentQuestion[])
      }

      setLessons((lRes.data ?? []) as Lesson[])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [profile])

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile || !questionText.trim()) {
      toast.error('Por favor escribe tu pregunta')
      return
    }

    setSubmitting(true)
    try {
      const payload: any = {
        student_id: profile.id,
        group_id: profile.group_id || null,
        lesson_id: selectedLessonId || null,
        question: questionText.trim(),
        status: 'pending',
      }

      const { error } = await supabase.from('student_questions').insert(payload)

      if (error) {
        throw error
      }

      toast.success('¡Tu pregunta fue enviada a tu maestro!')
      setQuestionText('')
      setSelectedLessonId('')
      setShowModal(false)
      loadData()
    } catch (err: any) {
      console.error(err)
      toast.error('No se pudo enviar la pregunta: ' + (err.message || 'Error de conexión'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteQuestion = async (id: string) => {
    if (!window.confirm('¿Deseas eliminar esta pregunta?')) return

    try {
      const { error } = await supabase.from('student_questions').delete().eq('id', id)
      if (error) throw error
      toast.success('Pregunta eliminada')
      loadData()
    } catch {
      toast.error('No se pudo eliminar la pregunta')
    }
  }

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>

  const pendingCount = questions.filter((q) => q.status === 'pending').length
  const answeredCount = questions.filter((q) => q.status === 'answered').length

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-12">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title text-2xl">Preguntas al Maestro</h1>
          <p className="section-subtitle">
            Hazle consultas bíblicas y dudas de tus lecciones a tu maestro de Escuela Dominical
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn-primary btn-md inline-flex items-center gap-2 shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Hacer una Pregunta
        </button>
      </div>

      {/* Resumen rápido */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/70 text-primary-700 dark:text-primary-300 flex items-center justify-center font-bold">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Total Preguntas</p>
            <p className="text-xl font-bold text-neutral-900 dark:text-white">{questions.length}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold-50 dark:bg-gold-950/70 text-gold-700 dark:text-gold-300 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Por Responder</p>
            <p className="text-xl font-bold text-gold-600 dark:text-gold-400">{pendingCount}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-success-50 dark:bg-emerald-950/70 text-success-700 dark:text-emerald-300 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Respondidas</p>
            <p className="text-xl font-bold text-success-700 dark:text-emerald-400">
              {answeredCount}
            </p>
          </div>
        </div>
      </div>

      {/* Listado de preguntas */}
      <div className="space-y-4">
        {questions.length === 0 ? (
          <div className="card p-10 text-center">
            <HelpCircle className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
            <h3 className="font-semibold text-neutral-800 dark:text-neutral-200 text-base">
              ¿Tienes alguna duda sobre la lección o la Biblia?
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto mt-1 mb-4">
              Tu maestro de Escuela Dominical está listo para ayudarte a entender la Palabra de Dios y
              responder a tus preguntas.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary btn-md inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Escribir mi primera pregunta
            </button>
          </div>
        ) : (
          questions.map((q) => {
            const isAnswered = q.status === 'answered'
            const lessonInfo = q.lesson as unknown as { title: string; number: number } | undefined
            const teacherInfo = q.teacher as unknown as { full_name: string; avatar_url?: string } | undefined

            return (
              <div
                key={q.id}
                className="card p-5 space-y-4 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
              >
                {/* Encabezado de la pregunta */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={isAnswered ? 'green' : 'gold'}>
                      {isAnswered ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> Respondida por el maestro
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" /> Pendiente de respuesta
                        </>
                      )}
                    </Badge>

                    {lessonInfo ? (
                      <span className="inline-flex items-center gap-1 text-xs text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/60 px-2 py-0.5 rounded-full font-medium">
                        <BookOpen className="w-3 h-3" /> Lección {lessonInfo.number}: {lessonInfo.title}
                      </span>
                    ) : (
                      <span className="badge badge-gold text-[11px] font-medium flex items-center gap-1">
                        <HelpCircle className="w-3 h-3 text-gold-600 dark:text-gold-400" /> Consulta Bíblica General
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-neutral-400">
                    <span>{formatDateShort(q.created_at)}</span>
                    {!isAnswered && (
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="text-danger-500 hover:text-danger-700 p-1 rounded-md"
                        title="Eliminar pregunta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Texto de la pregunta del alumno */}
                <div className="bg-neutral-50 dark:bg-neutral-800/40 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800">
                  <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1">
                    Tu pregunta:
                  </p>
                  <p className="text-sm text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap leading-relaxed">
                    {q.question}
                  </p>
                </div>

                {/* Respuesta del maestro (si está respondida) */}
                {isAnswered && q.answer && (
                  <div className="bg-primary-50/70 dark:bg-primary-950/40 p-4 rounded-xl border border-primary-200/70 dark:border-primary-900/40 space-y-2">
                    <div className="flex items-center gap-2.5">
                      <Avatar
                        name={teacherInfo?.full_name ?? 'Maestro'}
                        src={teacherInfo?.avatar_url}
                        size="sm"
                      />
                      <div>
                        <p className="text-xs font-bold text-primary-900 dark:text-primary-200">
                          Respuesta de: {teacherInfo?.full_name ?? 'Tu Maestro(a)'}
                        </p>
                        {q.answered_at && (
                          <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                            {formatDateShort(q.answered_at)}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap pl-1 border-l-2 border-primary-400 dark:border-primary-600">
                      {q.answer}
                    </p>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Modal para formular nueva pregunta */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary-100 dark:bg-primary-900/60 flex items-center justify-center text-primary-700 dark:text-primary-300">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <h2 className="font-semibold text-neutral-900 dark:text-white text-base">
                  Hacer una Pregunta a mi Maestro
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuestion} className="p-5 space-y-4">
              {/* Lección relacionada */}
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Lección relacionada (Opcional)
                </label>
                <select
                  value={selectedLessonId}
                  onChange={(e) => setSelectedLessonId(e.target.value)}
                  className="input-base text-xs sm:text-sm"
                >
                  <option value="">Pregunta bíblica general / Consulta abierta</option>
                  {lessons.map((l) => (
                    <option key={l.id} value={l.id}>
                      Lección {l.number}: {l.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Texto de la pregunta */}
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Escribe tu duda o consulta <span className="text-danger-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Ej: Hermano(a), no entendí muy bien el versículo bíblico de hoy, ¿me podría explicar cómo aplicarlo en mi vida diaria?..."
                  className="input-base text-sm resize-none"
                  required
                />
                <p className="text-[11px] text-neutral-400 mt-1">
                  Tu maestro de clase recibirá tu pregunta y te responderá en la plataforma.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-outline btn-sm text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !questionText.trim()}
                  className="btn-primary btn-sm text-xs inline-flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submitting ? 'Enviando...' : 'Enviar Pregunta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
