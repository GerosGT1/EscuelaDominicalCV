import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, BookOpen, Calendar, CheckSquare, User, ZoomIn } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ImageLightboxModal } from '@/components/ui/ImageLightboxModal'
import { formatDate } from '@/lib/utils'
import type { Lesson, LessonImage, WeeklyChallenge } from '@/types/database'

export function LessonDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [images, setImages] = useState<LessonImage[]>([])
  const [challenges, setChallenges] = useState<WeeklyChallenge[]>([])
  const [loading, setLoading] = useState(true)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  useEffect(() => {
    if (!id) return
    Promise.all([
      supabase.from('lessons').select('*, teacher:profiles(full_name)').eq('id', id).single(),
      supabase.from('lesson_images').select('*').eq('lesson_id', id).order('display_order'),
      supabase.from('weekly_challenges').select('*').eq('lesson_id', id),
    ]).then(([lessonRes, imagesRes, challengesRes]) => {
      if (lessonRes.data) setLesson(lessonRes.data as unknown as Lesson)
      if (imagesRes.data) setImages(imagesRes.data)
      if (challengesRes.data) setChallenges(challengesRes.data)
      setLoading(false)
    })
  }, [id])

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
  if (!lesson) return <div className="text-center py-20 text-neutral-500">Lección no encontrada.</div>

  const teacher = lesson.teacher as unknown as { full_name: string }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Navegación */}
      <Link to="/lecciones" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">
        <ArrowLeft className="w-4 h-4" />
        Volver a lecciones
      </Link>

      {/* Encabezado */}
      <div className="card p-6">
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="blue">Lección {lesson.number}</Badge>
          <Badge variant="green">Publicada</Badge>
        </div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-neutral-900 dark:text-neutral-100 mb-3">
          {lesson.title}
        </h1>
        <p className="text-gold-600 dark:text-gold-400 font-semibold mb-4">{lesson.theme}</p>

        <div className="bible-text">
          <p className="font-medium text-primary-900 dark:text-primary-200">{lesson.biblical_text}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-neutral-500 dark:text-neutral-400 mt-4">
          {lesson.published_at && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(lesson.published_at)}
            </span>
          )}
          {teacher?.full_name && (
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              {teacher.full_name}
            </span>
          )}
        </div>
      </div>

      {/* Galería de Ilustraciones interactivas con visor lightbox, descarga e impresión */}
      {images.length > 0 && (
        <div className="card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="section-title">Imágenes ilustrativas</h2>
              <p className="section-subtitle">
                Haz clic en cualquier imagen para verla en pantalla completa, descargarla o imprimirla.
              </p>
            </div>
            <span className="self-start sm:self-auto text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-full font-medium">
              {images.length} {images.length === 1 ? 'ilustración' : 'ilustraciones'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {images.map((img, idx) => (
              <div
                key={img.id || idx}
                onClick={() => setLightboxIndex(idx)}
                className="group relative rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800/40 cursor-pointer shadow-sm hover:shadow-md hover:border-primary-400 dark:hover:border-primary-600 transition-all duration-200"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-neutral-900/5 dark:bg-neutral-900/40">
                  <img
                    src={img.url}
                    alt={img.title ?? 'Imagen de la lección'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Overlay en hover con badge de acción */}
                  <div className="absolute inset-0 bg-neutral-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center p-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 text-neutral-900 text-xs font-semibold shadow-lg backdrop-blur-sm transform translate-y-2 group-hover:translate-y-0 transition-transform duration-200">
                      <ZoomIn className="w-3.5 h-3.5 text-primary-600" />
                      Ver completa / Imprimir
                    </span>
                  </div>
                </div>

                {img.title && (
                  <div className="p-3 bg-white dark:bg-neutral-900/90 border-t border-neutral-100 dark:border-neutral-800">
                    <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                      {img.title}
                    </p>
                    {img.description && (
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                        {img.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contenido textual */}
      <div className="card p-6 space-y-6">
        {lesson.objective && (
          <section>
            <h2 className="text-lg font-display font-semibold text-neutral-900 dark:text-neutral-100 mb-2 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary-600 dark:text-primary-400" />Objetivo
            </h2>
            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">{lesson.objective}</p>
          </section>
        )}
        {lesson.introduction && (
          <section>
            <h2 className="text-lg font-display font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Introducción</h2>
            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">{lesson.introduction}</p>
          </section>
        )}
        {lesson.content && (
          <section>
            <h2 className="text-lg font-display font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Desarrollo</h2>
            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">{lesson.content}</p>
          </section>
        )}
        {lesson.teachings && (
          <section>
            <h2 className="text-lg font-display font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Enseñanzas principales</h2>
            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">{lesson.teachings}</p>
          </section>
        )}
        {lesson.application && (
          <section>
            <h2 className="text-lg font-display font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Aplicación práctica</h2>
            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">{lesson.application}</p>
          </section>
        )}
        {lesson.conclusion && (
          <section>
            <h2 className="text-lg font-display font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Conclusión</h2>
            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">{lesson.conclusion}</p>
          </section>
        )}
        {lesson.reflection_questions && (
          <section>
            <h2 className="text-lg font-display font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Preguntas de reflexión</h2>
            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">{lesson.reflection_questions}</p>
          </section>
        )}
        {lesson.closing_prayer && (
          <section className="bg-primary-50 dark:bg-primary-950/40 rounded-xl p-4 border-l-4 border-primary-500 dark:border-primary-400">
            <h2 className="text-lg font-display font-semibold text-primary-900 dark:text-primary-200 mb-2">Oración</h2>
            <p className="text-primary-800 dark:text-primary-300 italic leading-relaxed">{lesson.closing_prayer}</p>
          </section>
        )}
      </div>

      {/* Reto semanal */}
      {challenges.length > 0 && (
        <div className="card p-6">
          <h2 className="section-title mb-4">🏆 Mi reto de la semana</h2>
          <div className="space-y-3">
            {challenges.map((ch) => (
              <div key={ch.id} className="flex items-start gap-3 p-3 bg-gold-50 dark:bg-gold-950/20 rounded-xl border border-gold-100 dark:border-gold-900/40">
                <div className="w-6 h-6 rounded-full bg-gold-400 dark:bg-gold-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckSquare className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-neutral-800 dark:text-neutral-200 text-sm">{ch.title}</p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">{ch.instructions}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botón de ejercicio */}
      <div className="flex justify-center pb-4">
        <Link to="/ejercicios" className="btn-gold btn-lg">
          <CheckSquare className="w-5 h-5" />
          Realizar el ejercicio de esta lección
        </Link>
      </div>

      {/* Modal Lightbox Interactivo */}
      {lightboxIndex !== null && (
        <ImageLightboxModal
          images={images}
          initialIndex={lightboxIndex}
          lessonTitle={`Lección ${lesson.number}: ${lesson.title}`}
          biblicalText={lesson.biblical_text}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  )
}
