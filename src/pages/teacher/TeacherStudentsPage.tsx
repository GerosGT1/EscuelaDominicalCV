import { useEffect, useState } from 'react'
import { Users, Layers, Search, Filter } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import type { Profile, Attempt, Group } from '@/types/database'

interface StudentWithDetails extends Profile {
  attempts: Attempt[]
  group?: Group
}

export function TeacherStudentsPage() {
  const { profile } = useAuth()
  const [students, setStudents] = useState<StudentWithDetails[]>([])
  const [myGroups, setMyGroups] = useState<Group[]>([])
  const [allGroups, setAllGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState<string>('my_groups')

  useEffect(() => {
    Promise.all([
      supabase.from('profiles').select('*').eq('role', 'student').eq('is_active', true),
      supabase.from('groups').select('*').order('name'),
      supabase.from('attempts').select('*, exercise:exercises(title)').in('status', ['submitted', 'graded']).order('submitted_at', { ascending: false }),
    ]).then(([studentsRes, groupsRes, attemptsRes]) => {
      const allAttempts = (attemptsRes.data ?? []) as unknown as Attempt[]
      const studentsList = (studentsRes.data ?? []) as unknown as StudentWithDetails[]
      const groupsList = (groupsRes.data ?? []) as Group[]

      const enriched = studentsList.map(s => ({
        ...s,
        group: groupsList.find(g => g.id === s.group_id),
        attempts: allAttempts.filter(a => a.student_id === s.id),
      }))

      setStudents(enriched)
      setAllGroups(groupsList)

      if (profile) {
        const assigned = groupsList.filter(g => g.teacher_id === profile.id)
        setMyGroups(assigned)
        if (assigned.length === 0) {
          setGroupFilter('all')
        }
      }

      setLoading(false)
    })
  }, [profile])

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>

  const myGroupIds = myGroups.map(g => g.id)

  const filtered = students.filter(s => {
    const matchesSearch =
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())

    let matchesGroup = true
    if (groupFilter === 'my_groups') {
      matchesGroup = s.group_id ? myGroupIds.includes(s.group_id) : false
    } else if (groupFilter === 'no_group') {
      matchesGroup = !s.group_id
    } else if (groupFilter !== 'all') {
      matchesGroup = s.group_id === groupFilter
    }

    return matchesSearch && matchesGroup
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title text-2xl">Alumnos y Seguimiento</h1>
        <p className="section-subtitle">
          Consulta el progreso de los participantes de tus clases de Escuela Dominical
        </p>
      </div>

      {/* Banner de clases a cargo */}
      {myGroups.length > 0 ? (
        <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 flex-shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-primary-900">
              Clases a tu cargo:
            </p>
            <div className="flex flex-wrap gap-2 mt-1">
              {myGroups.map(g => (
                <span key={g.id} className="inline-flex items-center gap-1 bg-white border border-primary-200 text-primary-800 text-xs px-2.5 py-0.5 rounded-full font-medium">
                  {g.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-neutral-100 border border-neutral-200 rounded-2xl p-4 text-xs text-neutral-600 flex items-center gap-2">
          <Layers className="w-4 h-4 text-neutral-400" />
          <span>Aún no tienes una clase asignada formalmente. El administrador puede asignarte una en el panel de usuarios.</span>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="search"
            placeholder="Buscar por nombre o correo..."
            className="input-base pl-9 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-neutral-400 hidden sm:block" />
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="input-base py-2 text-sm sm:w-56"
          >
            {myGroups.length > 0 && (
              <option value="my_groups">Mis clases asignadas ({myGroups.length})</option>
            )}
            <option value="all">Todos los alumnos</option>
            <option value="no_group">Sin clase asignada</option>
            <optgroup label="Filtrar por clase">
              {allGroups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <Users className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="font-semibold text-neutral-700">No se encontraron alumnos</h3>
          <p className="text-sm text-neutral-500 mt-1">
            {groupFilter === 'my_groups' && myGroups.length > 0
              ? 'No hay alumnos inscritos todavía en tus clases asignadas.'
              : 'No hay alumnos que coincidan con la búsqueda.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(student => {
            const graded = student.attempts.filter(a => a.score !== null)
            const avg = graded.length > 0
              ? Math.round(graded.reduce((acc, a) => acc + (a.score ?? 0), 0) / graded.length)
              : null
            const pending = student.attempts.filter(a => a.status === 'submitted').length
            const isMyStudent = student.group_id && myGroupIds.includes(student.group_id)

            return (
              <div key={student.id} className="card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Avatar name={student.full_name} size="md" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-neutral-900">{student.full_name}</h3>
                      {student.group ? (
                        <Badge variant={isMyStudent ? 'green' : 'blue'}>
                          <Layers className="w-3 h-3" />
                          {student.group.name}
                        </Badge>
                      ) : (
                        <Badge variant="gray">Sin clase</Badge>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">{student.email}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-neutral-100">
                  <div className="text-left sm:text-right">
                    <p className="text-xs text-neutral-400">Promedio</p>
                    {avg !== null ? (
                      <p className="text-lg font-bold text-primary-700 leading-tight">
                        {avg}<span className="text-xs text-neutral-400 font-normal">/100</span>
                      </p>
                    ) : (
                      <p className="text-sm text-neutral-400 font-medium">Sin notas</p>
                    )}
                  </div>

                  <div className="text-right flex-shrink-0">
                    {pending > 0 ? (
                      <Badge variant="gold">{pending} por revisar</Badge>
                    ) : (
                      <Badge variant="green">Al día</Badge>
                    )}
                    <p className="text-[11px] text-neutral-400 mt-1">
                      {student.attempts.length} ejercicio{student.attempts.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
