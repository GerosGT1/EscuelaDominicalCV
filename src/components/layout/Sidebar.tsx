import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, BookOpen, FileText, Users, Settings,
  BarChart2, CheckSquare, GraduationCap, BookMarked, LogOut, X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Avatar } from '@/components/ui/Avatar'
import toast from 'react-hot-toast'

interface NavItem {
  to: string
  icon: React.ReactNode
  label: string
  roles?: string[]
}

const studentNav: NavItem[] = [
  { to: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Inicio' },
  { to: '/lecciones', icon: <BookOpen className="w-5 h-5" />, label: 'Lecciones' },
  { to: '/ejercicios', icon: <CheckSquare className="w-5 h-5" />, label: 'Ejercicios' },
  { to: '/mi-progreso', icon: <BarChart2 className="w-5 h-5" />, label: 'Mi progreso' },
]

const teacherNav: NavItem[] = [
  { to: '/maestro', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Panel' },
  { to: '/maestro/lecciones', icon: <BookOpen className="w-5 h-5" />, label: 'Mis lecciones' },
  { to: '/maestro/ejercicios', icon: <FileText className="w-5 h-5" />, label: 'Ejercicios' },
  { to: '/maestro/alumnos', icon: <GraduationCap className="w-5 h-5" />, label: 'Alumnos' },
  { to: '/maestro/reportes', icon: <BarChart2 className="w-5 h-5" />, label: 'Reportes' },
]

const adminNav: NavItem[] = [
  { to: '/admin', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Panel' },
  { to: '/admin/usuarios', icon: <Users className="w-5 h-5" />, label: 'Usuarios' },
  { to: '/admin/lecciones', icon: <BookMarked className="w-5 h-5" />, label: 'Lecciones' },
  { to: '/admin/reportes', icon: <BarChart2 className="w-5 h-5" />, label: 'Reportes' },
  { to: '/admin/configuracion', icon: <Settings className="w-5 h-5" />, label: 'Configuración' },
]

interface SidebarProps {
  open?: boolean
  onClose?: () => void
}

export function Sidebar({ open = true, onClose }: SidebarProps) {
  const { profile } = useAuth()

  const navItems = profile?.role === 'admin'
    ? adminNav
    : profile?.role === 'teacher'
    ? teacherNav
    : studentNav

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Sesión cerrada')
  }

  return (
    <>
      {/* Overlay móvil */}
      {open && (
        <div
          className="fixed inset-0 bg-neutral-900/50 z-20 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-30 h-full w-64 flex-shrink-0 transition-all duration-300',
          'bg-white dark:bg-neutral-900 border-r border-neutral-100 dark:border-neutral-800 shadow-card-lg flex flex-col',
          'lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <img
              src="/logos/logo-escuela-dominical.png"
              alt="Escuela Dominical"
              className="w-9 h-9 object-contain"
              onError={(e) => {
                const el = e.currentTarget
                el.style.display = 'none'
                el.nextElementSibling?.classList.remove('hidden')
              }}
            />
            <div className="hidden w-9 h-9 rounded-lg bg-primary-700 items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-primary-900 dark:text-primary-300 leading-tight">Escuela</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-tight">Dominical Digital</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Perfil */}
        {profile && (
          <div className="p-4 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60">
              <Avatar name={profile.full_name} size="md" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">{profile.full_name}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 capitalize">
                  {profile.role === 'admin' ? 'Administrador'
                    : profile.role === 'teacher' ? 'Maestro' : 'Alumno'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin" aria-label="Navegación principal">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-950/70 text-primary-700 dark:text-primary-300 font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100'
                )
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Cerrar sesión */}
        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800">
          <button
            onClick={handleLogout}
            className="btn-ghost btn-sm w-full justify-start text-danger-600 hover:bg-danger-50 dark:hover:bg-red-950/40 hover:text-danger-700"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  )
}
