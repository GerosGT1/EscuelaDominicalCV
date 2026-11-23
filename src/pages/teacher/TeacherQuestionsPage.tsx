import { useEffect, useState } from 'react'
import {
  HelpCircle,
  Clock,
  CheckCircle2,
  BookOpen,
  MessageSquare,
  Send,
  Filter,
  X,
  Search,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { formatDateShort } from '@/lib/utils'
import type { StudentQuestion, Lesson } from '@/types/database'
import toast from 'react-hot-toast'

export function TeacherQuestionsPage() {
  const { profile } = useAuth()
  const [questions, setQuestions] = useState<StudentQuestion[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'answered'>('all')
  const [selectedLessonFilter, setSelectedLessonFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Modal para responder
  const [answeringQuestion, setAnsweringQuestion] = useState<StudentQuestion | null>(null)
  const [answerText, setAnswerText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadData = async () => {
    if (!profile) return
    setLoading(true)

    try {
      let query = supabase
        .from('student_questions')
        .select(`
          *,
          student:profiles!student_id(full_name, avatar_url, class_id),
          teacher:profiles!teacher_id(full_name, avatar_url),
          lesson:lessons(title, number)
        `)
        .order('created_at', { ascending: false })

      // Si el maestro tiene un grupo/clase asignada, filtramos preferentemente por su grupo
      if (profile.role === 'teacher' && profile.group_id) {
        query = query.or(`group_id.eq.${profile.group_id},teacher_id.eq.${profile.id}`)
      }

      const [qRes, lRes] = await Promise.all([
        query,
        supabase.from('lessons').select('*').order('number', { ascending: true }),
      ])

      if (qRes.error) {
        console.warn('Error al cargar preguntas:', qRes.error)
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

  const openAnswerModal = (q: StudentQuestion) => {
    setAnsweringQuestion(q)
    setAnswerText(q.answer || '')
  }

  const handleSaveAnswer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile || !answeringQuestion || !answerText.trim()) {
      toast.error('Por favor escribe una respuesta para el alumno')
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('student_questions')
        .update({
          answer: answerText.trim(),
          answered_at: new Date().toISOString(),
          teacher_id: profile.id,
          status: 'answered',
        })
        .eq('id', answeringQuestion.id)

      if (error) throw error

      toast.success('¡Respuesta enviada al alumno con éxito!')
      setAnsweringQuestion(null)
      setAnswerText('')
      loadData()
    } catch (err: any) {
      console.error(err)
      toast.error('No se pudo guardar la respuesta: ' + (err.message || 'Error de conexión'))
    } finally {
      setSubmitting(false)
    }
  }

  const pendingCount = questions.filter((q) => q.status === 'pending').length
  const answeredCount = questions.filter((q) => q.status === 'answered').length

  const filteredQuestions = questions.filter((q) => {
    // Filtro de estado
    if (filterStatus === 'pending' && q.status !== 'pending') return false
    if (filterStatus === 'answered' && q.status !== 'answered') return false

    // Filtro de lección
    if (selectedLessonFilter !== 'all' && q.lesson_id !== selectedLessonFilter) return false

    // Filtro de búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      const matchesStudent = q.student?.full_name?.toLowerCase().includes(term) ?? false
      const matchesQuestion = q.question.toLowerCase().includes(term)
      const matchesAnswer = q.answer?.toLowerCase().includes(term) ?? false
      const matchesLesson = q.lesson?.title?.toLowerCase().includes(term) ?? false
      if (!matchesStudent && !matchesQuestion && !matchesAnswer && !matchesLesson) return false
    }

    return true
  })

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-12">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title text-2xl">Preguntas de Alumnos</h1>
          <p className="section-subtitle">
            Responde dudas bíblicas, consultas de las lecciones y orienta a los estudiantes de tu clase
          </p>
        </div>

        {pendingCount > 0 && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold-100 dark:bg-gold-950/70 border border-gold-300 dark:border-gold-800 text-gold-800 dark:text-gold-200 text-xs font-semibold self-start sm:self-auto">
            <Clock className="w-4 h-4 text-gold-600 dark:text-gold-400 animate-pulse" />
            {pendingCount} {pendingCount === 1 ? 'pregunta pendiente' : 'preguntas pendientes'}
          </div>
        )}
      </div>

      {/* Tarjetas de métricas rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/70 text-primary-700 dark:text-primary-300 flex items-center justify-center font-bold">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-neutral-900 dark:text-white">{questions.length}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Total preguntas</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold-50 dark:bg-gold-950/70 text-gold-700 dark:text-gold-300 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-neutral-900 dark:text-white">{pendingCount}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Por responder</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-neutral-900 dark:text-white">{answeredCount}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Respondidas</p>
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Pestañas de estado */}
          <div className="flex items-center gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterStatus === 'all'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              Todas ({questions.length})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                filterStatus === 'pending'
                  ? 'bg-white dark:bg-neutral-900 text-gold-700 dark:text-gold-300 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              Pendientes
              {pendingCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-gold-500" />
              )}
            </button>
            <button
              onClick={() => setFilterStatus('answered')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterStatus === 'answered'
                  ? 'bg-white dark:bg-neutral-900 text-emerald-700 dark:text-emerald-300 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              Respondidas ({answeredCount})
            </button>
          </div>

          {/* Filtro por Lección */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-neutral-400 flex-shrink-0" />
            <select
              value={selectedLessonFilter}
              onChange={(e) => setSelectedLessonFilter(e.target.value)}
              className="input-base text-xs py-1.5 px-3 min-w-[200px]"
            >
              <option value="all">Todas las lecciones</option>
              {lessons.map((l) => (
                <option key={l.id} value={l.id}>
                  Lección #{l.number}: {l.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Buscador de texto */}
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre de alumno, pregunta, respuesta o tema..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-base pl-9 text-xs py-2"
          />
        </div>
      </div>

      {/* Lista de Preguntas */}
      {filteredQuestions.length === 0 ? (
        <div className="card p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 mx-auto flex items-center justify-center">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
            No hay preguntas encontradas
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
            {filterStatus === 'pending'
              ? '¡Excelente! Estás al día, no hay preguntas de alumnos pendientes por responder.'
              : 'No hay preguntas que coincidan con los filtros seleccionados.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((q) => {
            const isAnswered = q.status === 'answered'

            return (
              <div
                key={q.id}
                className={`card p-5 space-y-4 border transition-all duration-200 ${
                  !isAnswered
                    ? 'border-gold-300 dark:border-gold-900/60 bg-gold-50/20 dark:bg-gold-950/10'
                    : 'border-neutral-100 dark:border-neutral-800'
                }`}
              >
                {/* Cabecera de la tarjeta con Alumno y Lección */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={q.student?.full_name || 'Alumno'}
                      src={q.student?.avatar_url ?? undefined}
                      size="sm"
                    />
                    <div>
                      <span className="font-semibold text-sm text-neutral-900 dark:text-white block">
                        {q.student?.full_name || 'Alumno'}
                      </span>
                      <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDateShort(q.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {q.lesson ? (
                      <span className="badge badge-blue flex items-center gap-1 text-[11px]">
                        <BookOpen className="w-3 h-3" />
                        Lec. #{q.lesson.number}: {q.lesson.title}
                      </span>
                    ) : (
                      <span className="badge badge-gray text-[11px]">Consulta general</span>
                    )}

                    {isAnswered ? (
                      <Badge variant="green" className="text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Respondida
                      </Badge>
                    ) : (
                      <span className="badge badge-gold text-[11px] flex items-center gap-1 font-semibold animate-pulse">
                        <Clock className="w-3 h-3" />
                        Pendiente
                      </span>
                    )}
                  </div>
                </div>

                {/* Pregunta del alumno */}
                <div className="bg-neutral-50 dark:bg-neutral-800/60 rounded-xl p-3.5 space-y-1 border border-neutral-100 dark:border-neutral-800">
                  <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                    Pregunta del estudiante:
                  </p>
                  <p className="text-sm font-medium text-neutral-900 dark:text-white whitespace-pre-line leading-relaxed">
                    {q.question}
                  </p>
                </div>

                {/* Respuesta del maestro (si ya respondió) */}
                {isAnswered && q.answer && (
                  <div className="bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl p-3.5 border border-emerald-200 dark:border-emerald-800/40 space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                      <div className="flex items-center gap-2">
                        <Avatar
                          name={q.teacher?.full_name || profile?.full_name || 'Maestro'}
                          src={q.teacher?.avatar_url ?? profile?.avatar_url ?? undefined}
                          size="sm"
                        />
                        <span>Respuesta dada ({q.teacher?.full_name || 'Tú'}):</span>
                      </div>
                      {q.answered_at && (
                        <span className="text-[11px] text-neutral-400">
                          {formatDateShort(q.answered_at)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-800 dark:text-neutral-100 whitespace-pre-line pl-6">
                      {q.answer}
                    </p>
                  </div>
                )}

                {/* Botón de acción */}
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => openAnswerModal(q)}
                    className={
                      isAnswered
                        ? 'btn-outline btn-sm text-xs'
                        : 'btn-primary btn-sm text-xs shadow-sm flex items-center gap-1.5'
                    }
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isAnswered ? 'Editar respuesta' : 'Responder al alumno'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal para Responder / Editar Respuesta */}
      {answeringQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-xl p-6 space-y-5 shadow-2xl border border-neutral-200 dark:border-neutral-700 max-h-[90vh] overflow-y-auto">
            {/* Cabecera del modal */}
            <div className="flex items-start justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  Responder a {answeringQuestion.student?.full_name || 'Alumno'}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {answeringQuestion.lesson
                    ? `Lección #${answeringQuestion.lesson.number}: ${answeringQuestion.lesson.title}`
                    : 'Consulta general'}
                </p>
              </div>
              <button
                onClick={() => setAnsweringQuestion(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cuadro resumen de la pregunta */}
            <div className="bg-neutral-50 dark:bg-neutral-800/60 rounded-xl p-3.5 border border-neutral-200 dark:border-neutral-700/80">
              <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 block mb-1">
                Pregunta del alumno:
              </span>
              <p className="text-sm font-medium text-neutral-900 dark:text-white italic">
                "{answeringQuestion.question}"
              </p>
            </div>

            {/* Formulario de Respuesta */}
            <form onSubmit={handleSaveAnswer} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">
                  Tu respuesta bíblica / pastoral:
                </label>
                <textarea
                  required
                  rows={5}
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Escribe aquí tu explicación clara, con pasajes bíblicos o consejos para el alumno..."
                  className="input-base text-sm resize-none"
                />
                <p className="text-[11px] text-neutral-400">
                  El alumno podrá ver tu respuesta inmediatamente en su sección de preguntas.
                </p>
              </div>

              {/* Botones */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAnsweringQuestion(null)}
                  className="btn-outline btn-sm text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary btn-sm text-xs inline-flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submitting ? 'Enviando...' : 'Publicar Respuesta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
