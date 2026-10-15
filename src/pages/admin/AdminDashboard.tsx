import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, BookOpen, Settings, BarChart2, Shield } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, lessons: 0, exercises: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('lessons').select('id', { count: 'exact', head: true }),
      supabase.from('exercises').select('id', { count: 'exact', head: true }),
    ]).then(([u, l, e]) => {
      setStats({ users: u.count ?? 0, lessons: l.count ?? 0, exercises: e.count ?? 0 })
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-premium rounded-2xl p-6 text-white flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Panel de Administración</h1>
          <p className="text-primary-200 text-sm">Gestión completa de la plataforma</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { icon: Users, label: 'Usuarios', value: stats.users, color: 'bg-primary-50 dark:bg-primary-950/70 text-primary-700 dark:text-primary-300', to: '/admin/usuarios' },
          { icon: BookOpen, label: 'Lecciones', value: stats.lessons, color: 'bg-gold-50 dark:bg-gold-950/70 text-gold-700 dark:text-gold-300', to: '/admin/lecciones' },
          { icon: BarChart2, label: 'Ejercicios', value: stats.exercises, color: 'bg-success-50 dark:bg-emerald-950/70 text-success-700 dark:text-emerald-300', to: '/admin/reportes' },
        ].map(({ icon: Icon, label, value, color, to }) => (
          <Link key={label} to={to} className="card-hover p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link to="/admin/usuarios" className="card-hover p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-700 dark:bg-primary-600 flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-white">Gestionar usuarios</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Roles, permisos y cuentas</p>
          </div>
        </Link>
        <Link to="/admin/configuracion" className="card-hover p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gold-500 flex items-center justify-center flex-shrink-0">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-white">Configuración</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Logotipos e información institucional</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
