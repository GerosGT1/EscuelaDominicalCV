import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, BookOpen, UserPlus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'
import type { Group } from '@/types/database'

const registerSchema = z.object({
  full_name: z.string().min(3, 'Ingresa tu nombre completo'),
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirm_password: z.string(),
  group_id: z.string().optional(),
  privacy_accepted: z.boolean().refine(val => val, 'Debes aceptar las políticas de privacidad'),
}).refine(data => data.password === data.confirm_password, {
  message: 'Las contraseñas no coinciden',
  path: ['confirm_password'],
})

type RegisterFormData = z.infer<typeof registerSchema>

export function RegisterPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [groups, setGroups] = useState<Group[]>([])

  useEffect(() => {
    supabase.from('groups').select('*').order('name').then(({ data }) => {
      if (data) setGroups(data as Group[])
    })
  }, [])

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { privacy_accepted: false, group_id: '' },
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            group_id: data.group_id || null,
          },
          emailRedirectTo: `${window.location.origin}/auth/confirmar`,
        },
      })
      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('Ya existe una cuenta con este correo electrónico')
        } else {
          toast.error('Error al registrarse. Inténtalo de nuevo.')
        }
        return
      }
      toast.success('¡Registro exitoso! Revisa tu correo para confirmar tu cuenta.')
      navigate('/auth/confirmar-correo')
    } catch {
      toast.error('Error inesperado. Inténtalo de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Encabezado */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="/logos/logo-escuela-dominical.png"
            alt="Escuela Dominical"
            className="w-16 h-16 object-contain mb-4"
            onError={(e) => {
              const el = e.currentTarget
              el.style.display = 'none'
              el.nextElementSibling?.classList.remove('hidden')
            }}
          />
          <div className="hidden w-16 h-16 rounded-xl bg-primary-700 items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-display font-bold text-neutral-900">Crear cuenta</h1>
          <p className="text-sm text-neutral-500 mt-1">Únete a la Escuela Dominical Digital</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Nombre completo */}
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-neutral-700 mb-1.5">
                Nombre completo
              </label>
              <input
                id="full_name"
                type="text"
                autoComplete="name"
                placeholder="Tu nombre y apellido"
                className={cn('input-base', errors.full_name && 'input-error')}
                {...register('full_name')}
              />
              {errors.full_name && (
                <p className="mt-1 text-xs text-danger-600">{errors.full_name.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1.5">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="tu@correo.com"
                className={cn('input-base', errors.email && 'input-error')}
                {...register('email')}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-danger-600">{errors.email.message}</p>
              )}
            </div>

            {/* Clase de Escuela Dominical (Opcional) */}
            {groups.length > 0 && (
              <div>
                <label htmlFor="group_id" className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Clase de Escuela Dominical <span className="text-neutral-400 font-normal">(Opcional)</span>
                </label>
                <select
                  id="group_id"
                  className="input-base text-sm"
                  {...register('group_id')}
                >
                  <option value="">Seleccionar más tarde (por asignar)</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-neutral-400 mt-1">
                  Puedes elegir tu clase ahora o tu maestro/administrador podrá asignarte después.
                </p>
              </div>
            )}

            {/* Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  className={cn('input-base pr-11', errors.password && 'input-error')}
                  {...register('password')}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar' : 'Mostrar'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-danger-600">{errors.password.message}</p>
              )}
            </div>

            {/* Confirmar contraseña */}
            <div>
              <label htmlFor="confirm_password" className="block text-sm font-medium text-neutral-700 mb-1.5">
                Confirmar contraseña
              </label>
              <div className="relative">
                <input
                  id="confirm_password"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Repite tu contraseña"
                  className={cn('input-base pr-11', errors.confirm_password && 'input-error')}
                  {...register('confirm_password')}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={showConfirm ? 'Ocultar' : 'Mostrar'}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirm_password && (
                <p className="mt-1 text-xs text-danger-600">{errors.confirm_password.message}</p>
              )}
            </div>

            {/* Política de privacidad */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  {...register('privacy_accepted')}
                />
                <span className="text-sm text-neutral-600">
                  He leído y acepto las{' '}
                  <a href="#privacidad" className="text-primary-600 hover:underline font-medium">
                    políticas de privacidad
                  </a>
                  {' '}de la plataforma.
                </span>
              </label>
              {errors.privacy_accepted && (
                <p className="mt-1 text-xs text-danger-600">{errors.privacy_accepted.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary btn-lg w-full mt-2"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" className="border-white border-t-transparent" />
              ) : (
                <UserPlus className="w-5 h-5" />
              )}
              {isLoading ? 'Registrando...' : 'Crear cuenta'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600">
              ¿Ya tienes cuenta?{' '}
              <Link to="/auth/ingresar" className="font-medium text-primary-600 hover:text-primary-800">
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
