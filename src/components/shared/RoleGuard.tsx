import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import type { Role } from '@/types/database'

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles?: Role[]
  /** Ruta a la que redirigir si no está autenticado */
  redirectTo?: string
}

export function RoleGuard({
  children,
  allowedRoles,
  redirectTo = '/auth/ingresar',
}: RoleGuardProps) {
  const { user, profile, initialized, loading } = useAuth()

  if (!initialized || loading) return <PageLoader />

  if (!user) return <Navigate to={redirectTo} replace />

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    // Redirigir al dashboard según el rol
    const dashboardByRole: Record<Role, string> = {
      admin:   '/admin',
      teacher: '/maestro',
      student: '/dashboard',
    }
    return <Navigate to={dashboardByRole[profile.role]} replace />
  }

  return <>{children}</>
}

/** Variante: sólo para usuarios NO autenticados (páginas de auth) */
export function PublicOnlyGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, initialized, loading } = useAuth()
  if (!initialized || loading) return <PageLoader />
  if (user) {
    if (profile?.role === 'admin') return <Navigate to="/admin" replace />
    if (profile?.role === 'teacher') return <Navigate to="/maestro" replace />
    return <Navigate to="/dashboard" replace />
  }
  return <>{children}</>
}
