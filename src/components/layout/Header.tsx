import { Menu, Bell } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Avatar } from '@/components/ui/Avatar'

interface HeaderProps {
  onMenuClick?: () => void
  title?: string
}

export function Header({ onMenuClick, title }: HeaderProps) {
  const { profile } = useAuth()

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-neutral-100 shadow-sm">
      <div className="flex items-center justify-between px-4 lg:px-6 h-16">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
          {title && (
            <h1 className="text-lg font-display font-semibold text-neutral-900">{title}</h1>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            className="relative p-2 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            aria-label="Notificaciones"
          >
            <Bell className="w-5 h-5" />
          </button>
          {profile && (
            <Avatar name={profile.full_name} size="sm" />
          )}
        </div>
      </div>
    </header>
  )
}
