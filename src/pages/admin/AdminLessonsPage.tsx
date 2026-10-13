import { Link } from 'react-router-dom'
import { BookOpen } from 'lucide-react'

export function AdminLessonsPage() {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title text-2xl">Todas las lecciones</h1>
          <p className="section-subtitle">Administra el contenido de toda la plataforma</p>
        </div>
        <Link to="/maestro/lecciones" className="btn-outline btn-md">Ir al panel de maestro</Link>
      </div>
      <div className="card p-10 text-center">
        <BookOpen className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
        <p className="text-neutral-500">Vista de administrador de lecciones. Usa el panel del maestro para crear y editar lecciones.</p>
      </div>
    </div>
  )
}
