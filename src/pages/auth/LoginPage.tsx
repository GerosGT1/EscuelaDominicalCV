import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, BookOpen, LogIn } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })
      if (error) {
        if (error.message.includes('Invalid login')) {
          toast.error('Correo o contraseña incorrectos')
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Debes confirmar tu correo electrónico antes de iniciar sesión')
        } else {
          toast.error('Error al iniciar sesión. Inténtalo de nuevo.')
        }
        return
      }

      if (authData.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.user.id)
          .single()

        if (profileData?.role === 'admin') {
          navigate('/admin')
          return
        } else if (profileData?.role === 'teacher') {
          navigate('/maestro')
          return
        }
      }

      navigate('/dashboard')
    } catch {
      toast.error('Error inesperado. Inténtalo de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo — decorativo */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-premium flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Elementos decorativos de fondo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-white/20 -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-white/10 translate-x-1/4 translate-y-1/4" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-gold-400/20 -translate-x-1/2 -translate-y-1/2" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center max-w-md">
          {/* Logo Escuela Dominical */}
          <div className="mb-8">
            <img
              src="/logos/logo-escuela-dominical.png"
              alt="Escuela Dominical Asambleas de Dios"
              className="w-32 h-32 object-contain drop-shadow-2xl"
              onError={(e) => {
                const el = e.currentTarget
                el.style.display = 'none'
                el.nextElementSibling?.classList.remove('hidden')
              }}
            />
            <div className="hidden w-32 h-32 rounded-2xl bg-white/20 flex items-center justify-center">
              <BookOpen className="w-16 h-16 text-white" />
            </div>
          </div>

          <h1 className="text-4xl font-display font-bold text-white mb-3">
            Escuela Dominical Digital
          </h1>
          <div className="w-16 h-1 bg-gradient-gold rounded-full mb-6" />
          <p className="text-primary-100 text-lg leading-relaxed mb-8">
            Crece en la fe con lecciones bíblicas interactivas diseñadas para
            fortalecer tu conocimiento de la Palabra de Dios.
          </p>

          {/* Logo Iglesia */}
          <div className="mt-auto">
            <img
              src="/logos/logo-iglesia.jpg"
              alt="Auditorium Cristo Viene, Santa Catarina Pinula"
              className="w-24 h-24 object-contain drop-shadow-xl rounded-full border-2 border-gold-400/50"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
            <p className="text-primary-200 text-sm mt-3">
              Auditorium Cristo Viene
            </p>
            <p className="text-primary-300 text-xs">
              Santa Catarina Pinula · Asambleas de Dios
            </p>
          </div>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-neutral-50">
        {/* Logo en móvil */}
        <div className="lg:hidden flex flex-col items-center mb-8">
          <img
            src="/logos/logo-escuela-dominical.png"
            alt="Escuela Dominical"
            className="w-20 h-20 object-contain mb-4"
            onError={(e) => {
              const el = e.currentTarget
              el.style.display = 'none'
              el.nextElementSibling?.classList.remove('hidden')
            }}
          />
          <div className="hidden w-20 h-20 rounded-xl bg-primary-700 flex items-center justify-center mb-4">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-xl font-display font-bold text-primary-900 text-center">
            Escuela Dominical Digital
          </h1>
        </div>

        <div className="w-full max-w-md">
          <div className="card p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-display font-bold text-neutral-900">
                Iniciar sesión
              </h2>
              <p className="text-sm text-neutral-500 mt-1">
                Ingresa con tu correo y contraseña
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
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

              {/* Contraseña */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
                    Contraseña
                  </label>
                  <Link
                    to="/auth/recuperar-contrasena"
                    className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className={cn('input-base pr-11', errors.password && 'input-error')}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-danger-600">{errors.password.message}</p>
                )}
              </div>

              {/* Botón */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary btn-lg w-full mt-2"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" className="border-white border-t-transparent" />
                ) : (
                  <LogIn className="w-5 h-5" />
                )}
                {isLoading ? 'Ingresando...' : 'Ingresar'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-neutral-600">
                ¿No tienes cuenta?{' '}
                <Link
                  to="/auth/registro"
                  className="font-medium text-primary-600 hover:text-primary-800"
                >
                  Regístrate aquí
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-neutral-400 mt-6">
            Asambleas de Dios · Santa Catarina Pinula
          </p>
        </div>
      </div>
    </div>
  )
}
