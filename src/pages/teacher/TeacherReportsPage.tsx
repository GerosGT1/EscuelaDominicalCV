import { BarChart2 } from 'lucide-react'

export function TeacherReportsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title text-2xl">Reportes</h1>
        <p className="section-subtitle">Estadísticas de participación y desempeño</p>
      </div>
      <div className="card p-10 text-center">
        <BarChart2 className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
        <h3 className="font-semibold text-neutral-700">Reportes detallados</h3>
        <p className="text-sm text-neutral-500 mt-1">Disponibles en la próxima actualización (Etapa 4).</p>
      </div>
    </div>
  )
}
