import { useEffect, useState, useMemo } from 'react'
import {
  Download,
  Printer,
  Users,
  Award,
  BookOpen,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { GradeStudentModal } from '@/components/teacher/GradeStudentModal'
import { scoreColor, scorelabel } from '@/lib/utils'
import type { Profile, Group, Attempt, Lesson, Exercise } from '@/types/database'
import toast from 'react-hot-toast'

interface StudentReportItem extends Profile {
  group?: Group
  attempts: Attempt[]
  average: number | null
  completedCount: number
}

export function TeacherReportsPage() {
  const { profile } = useAuth()
  const [students, setStudents] = useState<StudentReportItem[]>([])
  const [groups, setMyGroups] = useState<Group[]>([])
  const [allGroups, setAllGroups] = useState<Group[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [selectedGroup, setSelectedGroup] = useState<string>('all')
  const [performanceFilter, setPerformanceFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [gradingStudent, setGradingStudent] = useState<any>(null)

  const loadReportData = async () => {
    setLoading(true)
    const [studentsRes, groupsRes, attemptsRes, lessonsRes, exercisesRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('role', 'student').eq('is_active', true),
      supabase.from('groups').select('*').order('name'),
      supabase
        .from('attempts')
        .select('*, exercise:exercises(title, lesson_id)')
        .in('status', ['submitted', 'graded']),
      supabase.from('lessons').select('*').order('number', { ascending: true }),
      supabase.from('exercises').select('*'),
    ])

    const rawStudents = (studentsRes.data ?? []) as Profile[]
    const rawGroups = (groupsRes.data ?? []) as Group[]
    const rawAttempts = (attemptsRes.data ?? []) as unknown as Attempt[]
    const rawLessons = (lessonsRes.data ?? []) as Lesson[]
    const rawExercises = (exercisesRes.data ?? []) as Exercise[]

    const enrichedStudents: StudentReportItem[] = rawStudents.map((s) => {
      const studentAttempts = rawAttempts.filter((a) => a.student_id === s.id)
      const graded = studentAttempts.filter((a) => a.score !== null)
      const avg =
        graded.length > 0
          ? Math.round(graded.reduce((acc, a) => acc + (a.score ?? 0), 0) / graded.length)
          : null

      return {
        ...s,
        group: rawGroups.find((g) => g.id === s.group_id),
        attempts: studentAttempts,
        average: avg,
        completedCount: studentAttempts.length,
      }
    })

    setStudents(enrichedStudents)
    setAllGroups(rawGroups)
    setLessons(rawLessons)
    setExercises(rawExercises)

    if (profile) {
      const assigned = rawGroups.filter((g) => g.teacher_id === profile.id)
      setMyGroups(assigned)
      if (assigned.length > 0) {
        setSelectedGroup(assigned[0].id)
      } else {
        setSelectedGroup('all')
      }
    }

    setLoading(false)
  }

  useEffect(() => {
    loadReportData()
  }, [profile])

  // Filtrado de alumnos
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Filtro de grupo
      let matchesGroup = true
      if (selectedGroup === 'my_classes') {
        const myIds = groups.map((g) => g.id)
        matchesGroup = s.group_id ? myIds.includes(s.group_id) : false
      } else if (selectedGroup !== 'all') {
        matchesGroup = s.group_id === selectedGroup
      }

      // Filtro de búsqueda
      const matchesSearch =
        s.full_name.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase())

      // Filtro de desempeño
      let matchesPerf = true
      if (performanceFilter === 'excellent') {
        matchesPerf = s.average !== null && s.average >= 90
      } else if (performanceFilter === 'good') {
        matchesPerf = s.average !== null && s.average >= 70 && s.average < 90
      } else if (performanceFilter === 'needs_help') {
        matchesPerf = s.average !== null && s.average < 70
      } else if (performanceFilter === 'no_grades') {
        matchesPerf = s.average === null
      }

      return matchesGroup && matchesSearch && matchesPerf
    })
  }, [students, selectedGroup, performanceFilter, search, groups])

  // Estadísticas del grupo actual
  const stats = useMemo(() => {
    const graded = filteredStudents.filter((s) => s.average !== null)
    const overallAvg =
      graded.length > 0
        ? Math.round(graded.reduce((acc, s) => acc + (s.average ?? 0), 0) / graded.length)
        : null
    const passed = graded.filter((s) => (s.average ?? 0) >= 70).length
    const passRate = graded.length > 0 ? Math.round((passed / graded.length) * 100) : 0
    const totalSubmissions = filteredStudents.reduce((acc, s) => acc + s.completedCount, 0)

    return {
      totalStudents: filteredStudents.length,
      gradedStudents: graded.length,
      overallAvg,
      passed,
      passRate,
      totalSubmissions,
    }
  }, [filteredStudents])

  // Desempeño por lección
  const lessonStats = useMemo(() => {
    return lessons.map((lesson) => {
      const exercise = exercises.find((e) => e.lesson_id === lesson.id)
      if (!exercise) return { lesson, completed: 0, average: null }

      const matchingAttempts = filteredStudents.flatMap((s) =>
        s.attempts.filter((a) => a.exercise_id === exercise.id && a.score !== null)
      )

      const avg =
        matchingAttempts.length > 0
          ? Math.round(
              matchingAttempts.reduce((acc, a) => acc + (a.score ?? 0), 0) /
                matchingAttempts.length
            )
          : null

      return {
        lesson,
        completed: matchingAttempts.length,
        average: avg,
      }
    })
  }, [lessons, exercises, filteredStudents])

  // Función para exportar a CSV
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
      s.completedCount,
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
      `reporte_calificaciones_escuela_dominical_${new Date().toISOString().slice(0, 10)}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('¡Reporte CSV descargado con éxito!')
  }

  // Función para imprimir reporte oficial
  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank', 'width=1000,height=800')
    if (!printWindow) {
      toast.error('Por favor permite ventanas emergentes para imprimir el reporte')
      return
    }

    const currentGroupName =
      selectedGroup === 'all'
        ? 'Todas las clases'
        : selectedGroup === 'my_classes'
        ? 'Mis clases a cargo'
        : allGroups.find((g) => g.id === selectedGroup)?.name ?? 'Clase'

    const tableRows = filteredStudents
      .map(
        (s, idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 0 ? 'background-color: #f8fafc;' : ''}">
          <td style="padding: 8px 12px; font-weight: 600;">${idx + 1}. ${s.full_name}</td>
          <td style="padding: 8px 12px; color: #475569;">${s.group?.name ?? 'Sin clase'}</td>
          <td style="padding: 8px 12px; text-align: center;">${s.completedCount}</td>
          <td style="padding: 8px 12px; text-align: center; font-weight: 700; color: ${
            s.average !== null && s.average >= 70 ? '#15803d' : '#b45309'
          };">${s.average !== null ? `${s.average}/100` : '—'}</td>
          <td style="padding: 8px 12px; text-align: center; font-size: 12px;">${
            s.average !== null ? scorelabel(s.average) : 'Sin evaluaciones'
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
          <title>Reporte de Calificaciones - Escuela Dominical</title>
          <style>
            @page { size: letter portrait; margin: 1.5cm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 0; }
            .header { text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 20px; }
            .church { font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; color: #1e3a8a; font-weight: bold; }
            .title { font-size: 22px; font-weight: 800; margin: 6px 0; color: #0f172a; }
            .meta { font-size: 13px; color: #64748b; margin-top: 4px; }
            .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
            .stat-box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; text-align: center; background: #f8fafc; }
            .stat-val { font-size: 20px; font-weight: bold; color: #1e3a8a; }
            .stat-lbl { font-size: 11px; text-transform: uppercase; color: #64748b; margin-top: 2px; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 10px; }
            th { background-color: #1e3a8a; color: white; padding: 8px 12px; text-align: left; font-size: 12px; text-transform: uppercase; }
            .footer-signatures { margin-top: 50px; display: flex; justify-content: space-around; text-align: center; font-size: 12px; }
            .sign-line { width: 200px; border-top: 1px solid #475569; margin-top: 40px; padding-top: 6px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="church">Asambleas de Dios · Auditorium Cristo Viene</div>
            <div class="title">Reporte Oficial de Calificaciones y Desempeño</div>
            <div class="meta">
              <strong>Clase:</strong> ${currentGroupName} &nbsp;|&nbsp; 
              <strong>Maestro(a):</strong> ${profile?.full_name ?? 'Docente'} &nbsp;|&nbsp;
              <strong>Fecha:</strong> ${new Date().toLocaleDateString('es-GT', { dateStyle: 'long' })}
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-box">
              <div class="stat-val">${stats.totalStudents}</div>
              <div class="stat-lbl">Total Alumnos</div>
            </div>
            <div class="stat-box">
              <div class="stat-val">${stats.overallAvg !== null ? `${stats.overallAvg}/100` : '—'}</div>
              <div class="stat-lbl">Promedio General</div>
            </div>
            <div class="stat-box">
              <div class="stat-val">${stats.passRate}%</div>
              <div class="stat-lbl">Tasa de Aprobación</div>
            </div>
            <div class="stat-box">
              <div class="stat-val">${stats.totalSubmissions}</div>
              <div class="stat-lbl">Ejercicios Realizados</div>
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
              ${tableRows}
            </tbody>
          </table>

          <div class="footer-signatures">
            <div>
              <div class="sign-line">Firma del Maestro(a)</div>
              <div>${profile?.full_name}</div>
            </div>
            <div>
              <div class="sign-line">Firma de Dirección Pastoral</div>
              <div>Escuela Dominical</div>
            </div>
          </div>

          <script>
            window.focus();
            window.print();
          </script>
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
      {/* Encabezado con botones de acción */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title text-2xl">Reportes de Desempeño</h1>
          <p className="section-subtitle">
            Estadísticas, calificaciones consolidadas e informes para la Escuela Dominical
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="btn-outline btn-sm text-xs inline-flex items-center gap-1.5"
            title="Descargar tabla en formato Excel CSV"
          >
            <Download className="w-3.5 h-3.5 text-primary-600" />
            Exportar CSV
          </button>
          <button
            onClick={handlePrintReport}
            className="btn-primary btn-sm text-xs inline-flex items-center gap-1.5 shadow-sm"
            title="Imprimir informe para entrega pastoral"
          >
            <Printer className="w-3.5 h-3.5 text-gold-300" />
            Imprimir Reporte
          </button>
        </div>
      </div>

      {/* Tarjetas KPI de Resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/70 text-primary-700 dark:text-primary-300 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Total Alumnos</p>
            <p className="text-xl font-bold text-neutral-900 dark:text-white">
              {stats.totalStudents}
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
                stats.overallAvg !== null ? scoreColor(stats.overallAvg) : 'text-neutral-400'
              }`}
            >
              {stats.overallAvg !== null ? `${stats.overallAvg}/100` : '—'}
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
              {stats.passRate}%
            </p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Ejercicios Entregados</p>
            <p className="text-xl font-bold text-neutral-900 dark:text-white">
              {stats.totalSubmissions}
            </p>
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="card p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="search"
            placeholder="Buscar alumno por nombre o correo..."
            className="input-base pl-9 text-xs sm:text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-2">
          {/* Selector de Grupo */}
          <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
            <Filter className="w-4 h-4 text-neutral-400 hidden sm:block" />
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="input-base py-1.5 text-xs sm:w-48"
            >
              {groups.length > 0 && <option value="my_classes">Mis clases ({groups.length})</option>}
              <option value="all">Todas las clases</option>
              {allGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Desempeño */}
          <select
            value={performanceFilter}
            onChange={(e) => setPerformanceFilter(e.target.value)}
            className="input-base py-1.5 text-xs sm:w-44 flex-1 sm:flex-initial"
          >
            <option value="all">Todos los rendimientos</option>
            <option value="excellent">Sobresaliente (90-100)</option>
            <option value="good">Bueno (70-89)</option>
            <option value="needs_help">Por Mejorar (&lt;70)</option>
            <option value="no_grades">Sin notas aún</option>
          </select>
        </div>
      </div>

      {/* Tabla de Calificaciones y Alumnos */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <h2 className="font-semibold text-neutral-900 dark:text-white text-base">
            Listado Consolidado de Calificaciones ({filteredStudents.length} alumnos)
          </h2>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="p-10 text-center">
            <AlertTriangle className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
            <p className="text-neutral-600 dark:text-neutral-400 text-sm">
              No hay alumnos que coincidan con los filtros seleccionados.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-100 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 uppercase text-[11px] font-semibold">
                <tr>
                  <th className="py-3 px-4">Alumno</th>
                  <th className="py-3 px-4">Clase</th>
                  <th className="py-3 px-4 text-center">Entregas</th>
                  <th className="py-3 px-4 text-center">Promedio</th>
                  <th className="py-3 px-4">Nivel</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={student.full_name} src={student.avatar_url} size="sm" />
                        <div>
                          <p className="font-semibold text-neutral-900 dark:text-white">
                            {student.full_name}
                          </p>
                          <p className="text-[11px] text-neutral-400">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-neutral-600 dark:text-neutral-300">
                      {student.group?.name ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300">
                          {student.group.name}
                        </span>
                      ) : (
                        <span className="text-neutral-400 italic">Sin clase</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-neutral-700 dark:text-neutral-300">
                      {student.completedCount}
                    </td>
                    <td className="py-3 px-4 text-center font-bold">
                      {student.average !== null ? (
                        <span className={scoreColor(student.average)}>{student.average}/100</span>
                      ) : (
                        <span className="text-neutral-400 font-normal">Sin notas</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {student.average !== null ? (
                        <div className="w-28">
                          <ProgressBar
                            value={student.average}
                            color={student.average >= 70 ? 'primary' : 'gold'}
                            size="sm"
                          />
                          <p className="text-[10px] text-neutral-400 mt-0.5">
                            {scorelabel(student.average)}
                          </p>
                        </div>
                      ) : (
                        <Badge variant="gray" className="text-[10px]">
                          Pendiente
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setGradingStudent(student)}
                        className="btn-outline btn-sm text-[11px] py-1 px-2.5 inline-flex items-center gap-1"
                      >
                        <Award className="w-3 h-3 text-gold-500" />
                        Calificar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rendimiento por Lección */}
      <div className="card p-6">
        <h2 className="section-title text-base mb-1">Desempeño Promedio por Lección</h2>
        <p className="section-subtitle mb-4">
          Visualiza qué lecciones han generado mayor participación y qué temas requieren mayor refuerzo
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {lessonStats.map(({ lesson, completed, average }) => (
            <div
              key={lesson.id}
              className="p-3.5 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-bold text-primary-700 dark:text-primary-300">
                  Lección {lesson.number}
                </p>
                <p className="font-semibold text-neutral-900 dark:text-white text-xs truncate max-w-[170px] mt-0.5">
                  {lesson.title}
                </p>
                <p className="text-[11px] text-neutral-400 mt-1">
                  {completed} alumno{completed !== 1 ? 's' : ''} evaluado{completed !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="text-right">
                {average !== null ? (
                  <p className={`text-lg font-bold ${scoreColor(average)}`}>
                    {average}
                    <span className="text-[10px] text-neutral-400 font-normal">/100</span>
                  </p>
                ) : (
                  <p className="text-xs text-neutral-400 italic">Sin datos</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal para calificar desde el reporte */}
      {gradingStudent && (
        <GradeStudentModal
          student={gradingStudent}
          lessons={lessons}
          exercises={exercises}
          isOpen={true}
          onClose={() => setGradingStudent(null)}
          onSuccess={() => {
            loadReportData()
          }}
        />
      )}
    </div>
  )
}
