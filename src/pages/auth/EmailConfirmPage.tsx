import { Link } from 'react-router-dom'
import { Mail, BookOpen } from 'lucide-react'

export function EmailConfirmPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="card p-10">
          <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-primary-700" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-gold-500" />
            <span className="text-sm font-medium text-neutral-500">Escuela Dominical Digital</span>
          </div>
          <h2 className="text-2xl font-display font-bold text-neutral-900 mb-3">Confirma tu correo</h2>
          <p className="text-neutral-600 mb-6">
            Te hemos enviado un correo de confirmación. Por favor revisa tu bandeja de entrada
            y haz clic en el enlace para activar tu cuenta.
          </p>
          <div className="bg-primary-50 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm text-primary-800 font-medium mb-1">¿No recibiste el correo?</p>
            <ul className="text-sm text-primary-700 space-y-1 list-disc list-inside">
              <li>Revisa la carpeta de correo no deseado (spam)</li>
              <li>Verifica que el correo ingresado sea correcto</li>
              <li>Espera unos minutos y revisa de nuevo</li>
            </ul>
          </div>
          <Link to="/auth/ingresar" className="btn-outline btn-md inline-flex">
            Ir al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  )
}
