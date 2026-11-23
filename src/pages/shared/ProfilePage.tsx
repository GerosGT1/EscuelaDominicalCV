import { useState, useRef } from 'react'
import {
  User,
  Mail,
  Camera,
  Trash2,
  Save,
  Phone,
  Shield,
  Layers,
  Calendar,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { formatDateShort } from '@/lib/utils'
import toast from 'react-hot-toast'

export function ProfilePage() {
  const { profile } = useAuth()
  const { setProfile } = useAuthStore()

  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url ?? null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!profile) return null

  // Redimensionar imagen para avatar óptimo
  const processImageToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const MAX_SIZE = 300
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width
              width = MAX_SIZE
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height
              height = MAX_SIZE
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL('image/jpeg', 0.85))
        }
        img.onerror = reject
        img.src = event.target?.result as string
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP)')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe pesar más de 5MB')
      return
    }

    setSelectedFile(file)
    try {
      const previewUrl = await processImageToDataUrl(file)
      setAvatarPreview(previewUrl)
    } catch {
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleRemoveAvatar = () => {
    setSelectedFile(null)
    setAvatarPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) {
      toast.error('El nombre no puede estar vacío')
      return
    }

    setSaving(true)
    const toastId = toast.loading('Guardando perfil...')

    try {
      let finalAvatarUrl: string | null = avatarPreview

      // Si seleccionó una nueva foto, intentar subirla a storage
      if (selectedFile) {
        try {
          const ext = selectedFile.name.split('.').pop() || 'jpg'
          const filePath = `${profile.id}/avatar-${Date.now()}.${ext}`

          // Intentar subir a bucket 'avatars'
          let uploadRes = await supabase.storage.from('avatars').upload(filePath, selectedFile, {
            upsert: true,
          })

          // Si falla o no existe, intentar bucket 'lesson-images'
          if (uploadRes.error) {
            uploadRes = await supabase.storage
              .from('lesson-images')
              .upload(`avatars/${filePath}`, selectedFile, { upsert: true })
            if (!uploadRes.error) {
              const { data } = supabase.storage
                .from('lesson-images')
                .getPublicUrl(`avatars/${filePath}`)
              finalAvatarUrl = data.publicUrl
            } else {
              // Fallback infalible: usar data URL optimizada
              finalAvatarUrl = await processImageToDataUrl(selectedFile)
            }
          } else {
            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
            finalAvatarUrl = data.publicUrl
          }
        } catch {
          // Fallback seguro a imagen optimizada
          finalAvatarUrl = await processImageToDataUrl(selectedFile)
        }
      }

      // Actualizar tabla profiles (con tolerancia por si la columna 'phone' aún no ha sido agregada en Supabase)
      let updatePayload: Record<string, any> = {
        full_name: fullName.trim(),
        avatar_url: finalAvatarUrl,
      }
      if (phone.trim()) {
        updatePayload.phone = phone.trim()
      }

      let { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', profile.id)
        .select()
        .single()

      // Si la base de datos reporta que la columna 'phone' no existe, reintentar sin phone
      if (error && (error.message?.includes('phone') || error.code === 'PGRST204')) {
        delete updatePayload.phone
        const retry = await supabase
          .from('profiles')
          .update(updatePayload)
          .eq('id', profile.id)
          .select()
          .single()
        updatedProfile = retry.data
        error = retry.error
      }

      if (error) throw error

      // Actualizar estado global y persistencia
      if (updatedProfile) {
        setProfile({
          ...profile,
          full_name: updatedProfile.full_name,
          phone: updatedProfile.phone,
          avatar_url: updatedProfile.avatar_url,
        })
      }

      toast.success('¡Perfil y foto actualizados exitosamente!', { id: toastId })
      setSelectedFile(null)
    } catch (err: any) {
      console.error(err)
      toast.error('Error al actualizar perfil: ' + (err.message || 'Error desconocido'), {
        id: toastId,
      })
    } finally {
      setSaving(false)
    }
  }

  const roleLabels = {
    admin: 'Administrador General',
    teacher: 'Maestro de Escuela Dominical',
    student: 'Alumno',
  }

  const roleVariants: Record<string, 'blue' | 'gold' | 'green'> = {
    admin: 'gold',
    teacher: 'green',
    student: 'blue',
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-12">
      <div>
        <h1 className="section-title text-2xl">Mi Perfil</h1>
        <p className="section-subtitle">
          Administra tu información personal y foto de perfil en la plataforma
        </p>
      </div>

      <div className="card p-6 sm:p-8">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Sección de Foto de Perfil */}
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-neutral-100 dark:border-neutral-800">
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-white dark:border-neutral-800 shadow-md bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt={fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Avatar name={fullName || 'Usuario'} size="xl" className="w-full h-full text-2xl" />
                )}
              </div>

              {/* Botón flotante para seleccionar archivo */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2.5 rounded-full bg-primary-600 hover:bg-primary-500 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                title="Subir o cambiar foto"
                aria-label="Subir foto de perfil"
              >
                <Camera className="w-4 h-4" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <div className="text-center sm:text-left flex-1 min-w-0">
              <h3 className="font-semibold text-neutral-900 dark:text-white text-base">
                Foto de Perfil
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Sube una imagen cuadrada (PNG, JPG o WebP de hasta 5MB). Aparecerá en tus lecciones,
                calificaciones y preguntas.
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-outline btn-sm text-xs py-1.5 px-3"
                >
                  <Camera className="w-3.5 h-3.5 text-primary-600" />
                  Elegir foto
                </button>

                {avatarPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="btn-ghost btn-sm text-xs py-1.5 px-3 text-danger-600 hover:bg-danger-50 dark:hover:bg-red-950/40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Quitar foto
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Formulario de Datos */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Nombre Completo
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-base pl-10"
                  placeholder="Tu nombre y apellido"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Correo Electrónico (Cuenta)
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="input-base pl-10 bg-neutral-100/60 dark:bg-neutral-800/60 text-neutral-500 cursor-not-allowed"
                />
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">
                El correo está vinculado a tu inicio de sesión y no puede modificarse directamente.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Número de Teléfono / WhatsApp (Opcional)
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-base pl-10"
                  placeholder="Ej: +502 5555-5555"
                />
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">
                Permite que los maestros o administradores de la iglesia se comuniquen contigo para avisos.
              </p>
            </div>

            {/* Información institucional de solo lectura */}
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-primary-600" /> Rol asignado:
                </span>
                <Badge variant={roleVariants[profile.role] ?? 'blue'}>
                  {roleLabels[profile.role] ?? profile.role}
                </Badge>
              </div>

              {profile.group && (
                <div className="flex items-center justify-between text-xs pt-2 border-t border-neutral-200/60 dark:border-neutral-700/60">
                  <span className="text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-gold-500" /> Clase actual:
                  </span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                    {profile.group.name}
                  </span>
                </div>
              )}

              {profile.created_at && (
                <div className="flex items-center justify-between text-xs pt-2 border-t border-neutral-200/60 dark:border-neutral-700/60">
                  <span className="text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-neutral-400" /> Miembro desde:
                  </span>
                  <span className="text-neutral-600 dark:text-neutral-300">
                    {formatDateShort(profile.created_at)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Botón Guardar */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary btn-md inline-flex items-center gap-2 shadow-card hover:shadow-card-md w-full sm:w-auto"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando cambios...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
