import { NavLink } from 'react-router-dom'
import { LayoutDashboard, BookOpen, CheckSquare, BarChart2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

const studentLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Inicio' },
  { to: '/lecciones', icon: BookOpen, label: 'Lecciones' },
  { to: '/ejercicios', icon: CheckSquare, label: 'Ejercicios' },
  { to: '/mi-progreso', icon: BarChart2, label: 'Progreso' },
]

export function BottomNav() {
  const { profile } = useAuth()
  if (profile?.role !== 'student') return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 transition-colors lg:hidden"
      aria-label="Navegación inferior"
    >
      <div className="flex">
        {studentLinks.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs transition-colors',
                isActive
                  ? 'text-primary-700 dark:text-primary-400 font-semibold'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                  'w-10 h-6 flex items-center justify-center rounded-full transition-all',
                  isActive && 'bg-primary-100 dark:bg-primary-950/80 text-primary-600 dark:text-primary-300'
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
