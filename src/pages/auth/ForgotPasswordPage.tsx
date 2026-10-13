import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

const schema = z.object({
  email: z.string().email('Correo electrónico inválido'),
})

type FormData = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { register, handleSubmit, getValues, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/nueva-contrasena`,
      })
      if (error) {
        toast.error('No se pudo enviar el correo. Verifica la dirección e inténtalo de nuevo.')
        return
      }
      setSent(true)
    } catch {
      toast.error('Error inesperado. Inténtalo de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
        <div className="w-full max-w-md text-center">
          <div className="card p-10">
            <div className="w-16 h-16 rounded-full bg-success-50 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-success-600" />
            </div>
            <h2 className="text-2xl font-display font-bold text-neutral-900 mb-3">Correo enviado</h2>
            <p className="text-neutral-600 mb-2">
              Hemos enviado un enlace de recuperación a:
            </p>
            <p className="font-semibold text-primary-700 mb-6">{getValues('email')}</p>
            <p className="text-sm text-neutral-500 mb-8">
              Revisa tu bandeja de entrada y sigue las instrucciones. El enlace es válido por 1 hora.
            </p>
            <Link to="/auth/ingresar" className="btn-primary btn-md inline-flex">
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="mb-8">
            <Link to="/auth/ingresar" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 mb-6">
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Link>
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-primary-700" />
            </div>
            <h2 className="text-2xl font-display font-bold text-neutral-900">Recuperar contraseña</h2>
            <p className="text-sm text-neutral-500 mt-1">
              Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
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

            <button type="submit" disabled={isLoading} className="btn-primary btn-lg w-full">
              {isLoading ? (
                <LoadingSpinner size="sm" className="border-white border-t-transparent" />
              ) : (
                <Mail className="w-5 h-5" />
              )}
              {isLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
