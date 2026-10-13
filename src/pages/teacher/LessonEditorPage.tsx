import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save, Upload, Eye, ArrowLeft, CheckSquare } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const lessonSchema = z.object({
  number: z.coerce.number().min(1, 'Ingresa el número de la lección'),
  title: z.string().min(3, 'Ingresa el título'),
  biblical_text: z.string().min(3, 'Ingresa el texto bíblico principal'),
  theme: z.string().min(3, 'Ingresa el tema central'),
  objective: z.string().min(10, 'Ingresa el objetivo'),
  introduction: z.string().optional(),
  content: z.string().optional(),
  bible_references: z.string().optional(),
  teachings: z.string().optional(),
  application: z.string().optional(),
  conclusion: z.string().optional(),
  reflection_questions: z.string().optional(),
  weekly_activities: z.string().optional(),
  closing_prayer: z.string().optional(),
})

type LessonFormData = z.infer<typeof lessonSchema>

export function LessonEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const isEditing = Boolean(id)
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  const { register, handleSubmit, reset, formState: { errors } } = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
  })

  useEffect(() => {
    if (!id) return
    supabase.from('lessons').select('*').eq('id', id).single().then(({ data }) => {
      if (data) reset(data as LessonFormData)
      setLoading(false)
    })
  }, [id, reset])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    setImageFiles(files)
    setImagePreviews(files.map(f => URL.createObjectURL(f)))
  }

  const uploadImages = async (lessonId: string) => {
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i]
      const ext = file.name.split('.').pop()
      const path = `lessons/${lessonId}/${Date.now()}-${i}.${ext}`
      const { error: uploadError } = await supabase.storage.from('lesson-images').upload(path, file)
      if (uploadError) continue
      const { data: urlData } = supabase.storage.from('lesson-images').getPublicUrl(path)
      await supabase.from('lesson_images').insert({
        lesson_id: lessonId, url: urlData.publicUrl, display_order: i
      })
    }
  }

  const onSubmit = async (data: LessonFormData, status: 'draft' | 'published' = 'draft') => {
    setSaving(true)
    try {
      const payload = { ...data, teacher_id: profile?.id, status,
        ...(status === 'published' ? { published_at: new Date().toISOString() } : {}) }

      if (isEditing && id) {
        const { error } = await supabase.from('lessons').update(payload).eq('id', id)
        if (error) throw error
        if (imageFiles.length > 0) await uploadImages(id)
        toast.success('Lección actualizada')
        navigate('/maestro/lecciones')
      } else {
        const { data: newLesson, error } = await supabase.from('lessons').insert(payload).select().single()
        if (error || !newLesson) throw error
        if (imageFiles.length > 0) await uploadImages(newLesson.id)
        toast.success('Lección creada. Ahora configura el ejercicio de evaluación.')
        navigate(`/maestro/ejercicios/${newLesson.id}`)
      }
    } catch {
      toast.error('Error al guardar la lección')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>

  const InputField = ({ name, label, placeholder, required = false, textarea = false, rows = 3 }: {
    name: keyof LessonFormData, label: string, placeholder?: string, required?: boolean, textarea?: boolean, rows?: number
  }) => (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
        {label}{required && <span className="text-danger-500 ml-0.5">*</span>}
      </label>
      {textarea ? (
        <textarea
          rows={rows}
          placeholder={placeholder}
          className={cn('input-base resize-none', errors[name] && 'input-error')}
          {...register(name)}
        />
      ) : (
        <input
          type="text"
          placeholder={placeholder}
          className={cn('input-base', errors[name] && 'input-error')}
          {...register(name)}
        />
      )}
      {errors[name] && (
        <p className="mt-1 text-xs text-danger-600">{String(errors[name]?.message)}</p>
      )}
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <Link
          to="/maestro/lecciones"
          className="btn-outline btn-sm inline-flex items-center gap-1.5 text-neutral-600"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a mis lecciones
        </Link>

        {isEditing && id && (
          <Link
            to={`/maestro/ejercicios/${id}`}
            className="btn-gold btn-sm inline-flex items-center gap-1.5"
          >
            <CheckSquare className="w-4 h-4" />
            Configurar Ejercicio
          </Link>
        )}
      </div>

      <div>
        <h1 className="section-title text-2xl">{isEditing ? 'Editar lección' : 'Nueva lección'}</h1>
        <p className="section-subtitle">Completa el contenido de la lección bíblica</p>
      </div>

      {isEditing && id && (
        <div className="card p-5 bg-gradient-to-r from-primary-50 via-white to-gold-50 border border-primary-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CheckSquare className="w-5 h-5 text-gold-500" />
              <h3 className="font-semibold text-primary-900 text-base">Ejercicio de Evaluación</h3>
            </div>
            <p className="text-xs text-neutral-600">
              Diseña las preguntas interactivas (opción múltiple, V/F, reflexión) para evaluar esta lección con nota de 0 a 100 puntos.
            </p>
          </div>
          <Link
            to={`/maestro/ejercicios/${id}`}
            className="btn-gold btn-md whitespace-nowrap self-start sm:self-auto inline-flex items-center gap-2"
          >
            <CheckSquare className="w-4 h-4" />
            Editar Preguntas del Ejercicio
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit((data) => onSubmit(data, 'draft'))} className="space-y-6">
        {/* Información básica */}
        <div className="card p-6 space-y-4">
          <h2 className="font-display font-semibold text-neutral-900 border-b pb-3">Información básica</h2>
          <div className="grid grid-cols-2 gap-4">
            <InputField name="number" label="Número de lección" placeholder="1" required />
            <InputField name="theme" label="Tema central" placeholder="Ej: La fe" required />
          </div>
          <InputField name="title" label="Título de la lección" placeholder="Ej: La fe que mueve montañas" required />
          <InputField name="biblical_text" label="Texto bíblico principal" placeholder="Ej: Hebreos 11:1" required />
          <InputField name="objective" label="Objetivo" placeholder="Al finalizar esta lección, el alumno..." required textarea rows={2} />
        </div>

        {/* Contenido */}
        <div className="card p-6 space-y-4">
          <h2 className="font-display font-semibold text-neutral-900 border-b pb-3">Contenido de la lección</h2>
          <InputField name="introduction" label="Introducción" textarea rows={3} />
          <InputField name="content" label="Desarrollo del contenido" textarea rows={6} />
          <InputField name="bible_references" label="Referencias bíblicas adicionales" textarea rows={2} />
          <InputField name="teachings" label="Enseñanzas principales" textarea rows={3} />
          <InputField name="application" label="Aplicación práctica" textarea rows={3} />
          <InputField name="conclusion" label="Conclusión" textarea rows={3} />
        </div>

        {/* Reflexión */}
        <div className="card p-6 space-y-4">
          <h2 className="font-display font-semibold text-neutral-900 border-b pb-3">Reflexión y actividades</h2>
          <InputField name="reflection_questions" label="Preguntas de reflexión" textarea rows={3} />
          <InputField name="weekly_activities" label="Actividades semanales (Mi reto)" textarea rows={3} />
          <InputField name="closing_prayer" label="Oración o reflexión final" textarea rows={3} />
        </div>

        {/* Imágenes */}
        <div className="card p-6">
          <h2 className="font-display font-semibold text-neutral-900 border-b pb-3 mb-4">Imágenes ilustrativas</h2>
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-neutral-300 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors">
            <Upload className="w-8 h-8 text-neutral-400 mb-2" />
            <span className="text-sm text-neutral-500">Haz clic para seleccionar imágenes</span>
            <span className="text-xs text-neutral-400">PNG, JPG, WEBP — máx. 5 MB cada una</span>
            <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
          </label>
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              {imagePreviews.map((src, i) => (
                <img key={i} src={src} alt={`Vista previa ${i + 1}`} className="w-full h-24 object-cover rounded-lg" />
              ))}
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={saving}
            className="btn-outline btn-lg flex-1 justify-center"
          >
            {saving ? <LoadingSpinner size="sm" /> : <Save className="w-5 h-5" />}
            Guardar borrador
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSubmit((data) => onSubmit(data, 'published'))}
            className="btn-primary btn-lg flex-1 justify-center"
          >
            {saving ? <LoadingSpinner size="sm" className="border-white border-t-transparent" /> : <Eye className="w-5 h-5" />}
            Publicar lección
          </button>
        </div>
      </form>
    </div>
  )
}
