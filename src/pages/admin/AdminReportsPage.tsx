import { useEffect, useState, useMemo } from 'react'
import {
  Download,
  Printer,
  Users,
  Award,
  GraduationCap,
  Search,
  CheckCircle2,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { scoreColor, scorelabel } from '@/lib/utils'
import type { Profile, Group, Attempt, Lesson } from '@/types/database'
import toast from 'react-hot-toast'

export function AdminReportsPage() {
  const [students, setStudents] = useState<Profile[]>([])
  const [teachers, setTeachers] = useState<Profile[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [selectedGroup, setSelectedGroup] = useState<string>('all')
  const [search, setSearch] = useState('')

  const loadData = async () => {
    setLoading(true)
    const [profilesRes, groupsRes, lessonsRes, attemptsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('is_active', true),
      supabase.from('groups').select('*').order('name'),
      supabase.from('lessons').select('*').order('number', { ascending: true }),
      supabase.from('attempts').select('*, exercise:exercises(title, lesson_id)').in('status', ['submitted', 'graded']),
    ])

    const allProfiles = (profilesRes.data ?? []) as Profile[]
    setStudents(allProfiles.filter((p) => p.role === 'student'))
    setTeachers(allProfiles.filter((p) => p.role === 'teacher' || p.role === 'admin'))
    setGroups((groupsRes.data ?? []) as Group[])
    setLessons((lessonsRes.data ?? []) as Lesson[])
    setAttempts((attemptsRes.data ?? []) as unknown as Attempt[])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  // Estudiantes enriquecidos con notas
  const enrichedStudents = useMemo(() => {
    return students.map((s) => {
      const studentAttempts = attempts.filter((a) => a.student_id === s.id)
      const graded = studentAttempts.filter((a) => a.score !== null)
      const avg =
        graded.length > 0
          ? Math.round(graded.reduce((acc, a) => acc + (a.score ?? 0), 0) / graded.length)
          : null

      return {
        ...s,
        group: groups.find((g) => g.id === s.group_id),
        attemptsCount: studentAttempts.length,
        average: avg,
      }
    })
  }, [students, attempts, groups])

  const filteredStudents = useMemo(() => {
    return enrichedStudents.filter((s) => {
      const matchesGroup = selectedGroup === 'all' || s.group_id === selectedGroup
      const matchesSearch =
        s.full_name.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase())
      return matchesGroup && matchesSearch
    })
  }, [enrichedStudents, selectedGroup, search])

  // Métricas generales
  const overallMetrics = useMemo(() => {
    const graded = enrichedStudents.filter((s) => s.average !== null)
    const churchAvg =
      graded.length > 0
        ? Math.round(graded.reduce((acc, s) => acc + (s.average ?? 0), 0) / graded.length)
        : null
    const passCount = graded.filter((s) => (s.average ?? 0) >= 70).length
    const passRate = graded.length > 0 ? Math.round((passCount / graded.length) * 100) : 0

    return {
      totalStudents: students.length,
      totalTeachers: teachers.length,
      totalGroups: groups.length,
      totalLessons: lessons.length,
      churchAvg,
      passRate,
      totalAttempts: attempts.length,
    }
  }, [students, teachers, groups, lessons, attempts, enrichedStudents])

  // Rendimiento por clase
  const classBreakdown = useMemo(() => {
    return groups.map((g) => {
      const classStudents = enrichedStudents.filter((s) => s.group_id === g.id)
      const graded = classStudents.filter((s) => s.average !== null)
      const avg =
        graded.length > 0
          ? Math.round(graded.reduce((acc, s) => acc + (s.average ?? 0), 0) / graded.length)
          : null
      const teacher = teachers.find((t) => t.id === g.teacher_id)

      return {
        group: g,
        teacher,
        studentCount: classStudents.length,
        average: avg,
      }
    })
  }, [groups, enrichedStudents, teachers])

  // Exportar a CSV institucional
  const handleExportCSV = () => {
    if (filteredStudents.length === 0) {
      toast.error('No hay datos para exportar')
      return
    }

    const headers = ['Alumno', 'Correo', 'Clase', 'Evaluaciones_Completadas', 'Promedio_100', 'Estado']
    const rows = filteredStudents.map((s) => [
      `"${s.full_name}"`,
      `"${s.email}"`,
      `"${s.group?.name ?? 'Sin clase'}"`,
      s.attemptsCount,
      s.average ?? 'N/A',
      `"${s.average !== null ? scorelabel(s.average) : 'Sin notas'}"`,
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `reporte_institucional_escuela_dominical_${new Date().toISOString().slice(0, 10)}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('¡Reporte institucional descargado con éxito!')
  }

  // Imprimir reporte administrativo
  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=1000,height=800')
    if (!printWindow) {
      toast.error('Permite las ventanas emergentes para imprimir')
      return
    }

    const rows = filteredStudents
      .map(
        (s, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 0 ? 'background-color: #f8fafc;' : ''}">
        <td style="padding: 7px 10px; font-weight: 600;">${idx + 1}. ${s.full_name}</td>
        <td style="padding: 7px 10px; color: #475569;">${s.group?.name ?? 'Sin clase'}</td>
        <td style="padding: 7px 10px; text-align: center;">${s.attemptsCount}</td>
        <td style="padding: 7px 10px; text-align: center; font-weight: bold; color: ${
          s.average !== null && s.average >= 70 ? '#15803d' : '#b45309'
        };">${s.average !== null ? `${s.average}/100` : '—'}</td>
        <td style="padding: 7px 10px; text-align: center; font-size: 11px;">${
          s.average !== null ? scorelabel(s.average) : 'Sin notas'
        }</td>
      </tr>
    `
      )
      .join('')

    const html = `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <title>Reporte General - Escuela Dominical</title>
          <style>
            @page { size: letter portrait; margin: 1.5cm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 0; font-size: 13px; }
            .header { text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 15px; }
            .church { font-size: 14px; text-transform: uppercase; letter-spacing: 1.5px; color: #1e3a8a; font-weight: bold; }
            .title { font-size: 22px; font-weight: 800; margin: 6px 0; }
            .meta { font-size: 12px; color: #64748b; }
            .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
            .kpi { border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; text-align: center; background: #f8fafc; }
            .kpi-num { font-size: 20px; font-weight: bold; color: #1e3a8a; }
            .kpi-lbl { font-size: 11px; text-transform: uppercase; color: #64748b; margin-top: 2px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
            th { background-color: #1e3a8a; color: white; padding: 8px 10px; text-align: left; text-transform: uppercase; font-size: 11px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="church">Asambleas de Dios · Auditorium Cristo Viene</div>
            <div class="title">Informe Ejecutivo de Escuela Dominical</div>
            <div class="meta">Fecha de emisión: ${new Date().toLocaleDateString('es-GT', { dateStyle: 'long' })}</div>
          </div>

          <div class="kpi-grid">
            <div class="kpi">
              <div class="kpi-num">${overallMetrics.totalStudents}</div>
              <div class="kpi-lbl">Total Alumnos</div>
            </div>
            <div class="kpi">
              <div class="kpi-num">${overallMetrics.totalTeachers}</div>
              <div class="kpi-lbl">Total Maestros</div>
            </div>
            <div class="kpi">
              <div class="kpi-num">${overallMetrics.churchAvg !== null ? `${overallMetrics.churchAvg}/100` : '—'}</div>
              <div class="kpi-lbl">Promedio General</div>
            </div>
            <div class="kpi">
              <div class="kpi-num">${overallMetrics.totalAttempts}</div>
              <div class="kpi-lbl">Evaluaciones Realizadas</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Alumno</th>
                <th>Clase</th>
                <th style="text-align: center;">Entregas</th>
                <th style="text-align: center;">Promedio</th>
                <th style="text-align: center;">Nivel</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>

          <script>window.focus(); window.print();</script>
        </body>
      </html>
    `

    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()
  }

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cabecera y acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title text-2xl">Reportes Generales de la Iglesia</h1>
          <p className="section-subtitle">
            Visión global del crecimiento, participación y rendimiento de la Escuela Dominical
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="btn-outline btn-sm text-xs inline-flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-primary-600" />
            Exportar CSV
          </button>
          <button
            onClick={handlePrint}
            className="btn-primary btn-sm text-xs inline-flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-gold-300" />
            Imprimir Informe
          </button>
        </div>
      </div>

      {/* Métricas Principales de toda la iglesia */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/70 text-primary-700 dark:text-primary-300 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Total Alumnos</p>
            <p className="text-xl font-bold text-neutral-900 dark:text-white">
              {overallMetrics.totalStudents}
            </p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold-50 dark:bg-gold-950/70 text-gold-700 dark:text-gold-300 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Promedio General</p>
            <p
              className={`text-xl font-bold ${
                overallMetrics.churchAvg !== null
                  ? scoreColor(overallMetrics.churchAvg)
                  : 'text-neutral-400'
              }`}
            >
              {overallMetrics.churchAvg !== null ? `${overallMetrics.churchAvg}/100` : '—'}
            </p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Maestros Activos</p>
            <p className="text-xl font-bold text-neutral-900 dark:text-white">
              {overallMetrics.totalTeachers}
            </p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-success-50 dark:bg-emerald-950/70 text-success-700 dark:text-emerald-300 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Aprobación (≥70)</p>
            <p className="text-xl font-bold text-success-700 dark:text-emerald-400">
              {overallMetrics.passRate}%
            </p>
          </div>
        </div>
      </div>

      {/* Rendimiento Comparativo por Clase */}
      <div className="card p-6">
        <h2 className="section-title text-base mb-1">Comparativa por Clases de Escuela Dominical</h2>
        <p className="section-subtitle mb-4">
          Resumen de participación y promedio de calificaciones por grupo etario
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classBreakdown.map(({ group, teacher, studentCount, average }) => (
            <div
              key={group.id}
              className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">
                    {group.name}
                  </h3>
                  <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 bg-white dark:bg-neutral-800 px-2 py-0.5 rounded-full border border-neutral-200 dark:border-neutral-700">
                    {studentCount} alumno{studentCount !== 1 ? 's' : ''}
                  </span>
                </div>

                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Maestro:{' '}
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">
                    {teacher ? teacher.full_name : 'Sin asignar'}
                  </span>
                </p>
              </div>

              <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                <span className="text-xs text-neutral-500 dark:text-neutral-400">Promedio:</span>
                <span
                  className={`text-base font-bold ${
                    average !== null ? scoreColor(average) : 'text-neutral-400'
                  }`}
                >
                  {average !== null ? `${average}/100` : 'Sin notas'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabla detallada de Alumnos */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="font-semibold text-neutral-900 dark:text-white text-base">
            Todos los Alumnos ({filteredStudents.length})
          </h2>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="search"
                placeholder="Buscar por nombre..."
                className="input-base pl-9 text-xs sm:w-56 py-1.5"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="input-base py-1.5 text-xs sm:w-48"
            >
              <option value="all">Todas las clases</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-100 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 uppercase text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">Alumno</th>
                <th className="py-3 px-4">Clase</th>
                <th className="py-3 px-4 text-center">Evaluaciones</th>
                <th className="py-3 px-4 text-center">Promedio</th>
                <th className="py-3 px-4">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredStudents.map((s) => (
                <tr
                  key={s.id}
                  className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={s.full_name} src={s.avatar_url} size="sm" />
                      <div>
                        <p className="font-semibold text-neutral-900 dark:text-white">
                          {s.full_name}
                        </p>
                        <p className="text-[11px] text-neutral-400">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-neutral-600 dark:text-neutral-300">
                    {s.group ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300">
                        {s.group.name}
                      </span>
                    ) : (
                      <span className="text-neutral-400 italic">Sin clase</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center font-medium">{s.attemptsCount}</td>
                  <td className="py-3 px-4 text-center font-bold">
                    {s.average !== null ? (
                      <span className={scoreColor(s.average)}>{s.average}/100</span>
                    ) : (
                      <span className="text-neutral-400 font-normal">Sin notas</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {s.average !== null ? (
                      <Badge variant={s.average >= 70 ? 'green' : 'gold'}>
                        {scorelabel(s.average)}
                      </Badge>
                    ) : (
                      <Badge variant="gray">Sin notas</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
