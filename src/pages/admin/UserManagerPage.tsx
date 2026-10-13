import { useEffect, useState } from 'react'
import {
  Users, ShieldCheck, GraduationCap, BookOpen, Plus,
  Trash2, Layers, Search, X, Check
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'
import type { Profile, Role, Group } from '@/types/database'

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrador',
  teacher: 'Maestro',
  student: 'Alumno',
}

const ROLE_ICONS: Record<Role, React.ReactNode> = {
  admin: <ShieldCheck className="w-4 h-4" />,
  teacher: <BookOpen className="w-4 h-4" />,
  student: <GraduationCap className="w-4 h-4" />,
}

const ROLE_VARIANTS: Record<Role, 'red' | 'blue' | 'gray'> = {
  admin: 'red',
  teacher: 'blue',
  student: 'gray',
}

export function UserManagerPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'groups'>('users')
  const [users, setUsers] = useState<Profile[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  // Estado para modal / creación de grupo
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDesc, setNewGroupDesc] = useState('')
  const [newGroupTeacherId, setNewGroupTeacherId] = useState<string>('')
  const [savingGroup, setSavingGroup] = useState(false)

  const loadData = async () => {
    setLoading(true)
    const [usersRes, groupsRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('groups').select('*').order('name', { ascending: true }),
    ])

    if (usersRes.data) setUsers(usersRes.data as Profile[])
    if (groupsRes.data) setGroups(groupsRes.data as Group[])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const changeRole = async (userId: string, role: Role) => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
    if (error) {
      toast.error('Error al cambiar el rol')
      return
    }
    toast.success('Rol actualizado exitosamente')
    loadData()
  }

  const changeGroup = async (userId: string, groupId: string | null) => {
    const { error } = await supabase
      .from('profiles')
      .update({ group_id: groupId || null })
      .eq('id', userId)

    if (error) {
      toast.error('Error al asignar la clase/grupo')
      return
    }
    toast.success('Clase actualizada')
    loadData()
  }

  const toggleActive = async (user: Profile) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !user.is_active })
      .eq('id', user.id)

    if (error) {
      toast.error('Error al actualizar el estado')
      return
    }
    toast.success(user.is_active ? 'Cuenta suspendida' : 'Cuenta activada')
    loadData()
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGroupName.trim()) {
      toast.error('El nombre de la clase es obligatorio')
      return
    }

    setSavingGroup(true)
    const { error } = await supabase.from('groups').insert({
      name: newGroupName.trim(),
      description: newGroupDesc.trim() || null,
      teacher_id: newGroupTeacherId || null,
    })

    setSavingGroup(false)
    if (error) {
      toast.error('Error al crear la clase: ' + error.message)
      return
    }

    toast.success('Clase creada correctamente')
    setNewGroupName('')
    setNewGroupDesc('')
    setNewGroupTeacherId('')
    setShowGroupModal(false)
    loadData()
  }

  const handleUpdateGroupTeacher = async (groupId: string, teacherId: string | null) => {
    const { error } = await supabase
      .from('groups')
      .update({ teacher_id: teacherId || null })
      .eq('id', groupId)

    if (error) {
      toast.error('Error al asignar maestro')
      return
    }
    toast.success('Maestro asignado a la clase')
    loadData()
  }

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar la clase "${groupName}"? Los alumnos quedarán sin clase asignada.`)) {
      return
    }

    const { error } = await supabase.from('groups').delete().eq('id', groupId)
    if (error) {
      toast.error('Error al eliminar la clase')
      return
    }
    toast.success('Clase eliminada')
    loadData()
  }

  const teachers = users.filter((u) => u.role === 'teacher' || u.role === 'admin')

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  if (loading && users.length === 0) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="section-title text-2xl">Gestión de Usuarios y Clases</h1>
          <p className="section-subtitle">
            Administra los roles, clases de la Escuela Dominical y asigna alumnos a sus maestros
          </p>
        </div>

        {activeTab === 'groups' && (
          <button
            onClick={() => setShowGroupModal(true)}
            className="btn-primary btn-md inline-flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Nueva Clase / Grupo
          </button>
        )}
      </div>

      {/* Pestañas */}
      <div className="flex border-b border-neutral-200 gap-4">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'users'
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Usuarios ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'groups'
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Clases / Grupos ({groups.length})
        </button>
      </div>

      {/* PESTAÑA 1: USUARIOS */}
      {activeTab === 'users' && (
        <div className="space-y-4">
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
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input-base py-2 text-sm sm:w-48"
            >
              <option value="all">Todos los roles</option>
              <option value="student">Solo Alumnos</option>
              <option value="teacher">Solo Maestros</option>
              <option value="admin">Solo Administradores</option>
            </select>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="card p-10 text-center">
              <Users className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <h3 className="font-semibold text-neutral-700">No se encontraron usuarios</h3>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => {
                const assignedGroup = groups.find((g) => g.id === user.group_id)
                return (
                  <div key={user.id} className="card p-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Información de usuario */}
                      <div className="flex items-center gap-4 min-w-0">
                        <Avatar name={user.full_name} size="md" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-neutral-900 truncate">{user.full_name}</h3>
                            <Badge variant={ROLE_VARIANTS[user.role]}>
                              {ROLE_ICONS[user.role]}
                              {ROLE_LABELS[user.role]}
                            </Badge>
                            {!user.is_active && <Badge variant="red">Suspendida</Badge>}
                          </div>
                          <p className="text-xs text-neutral-500 mt-0.5">{user.email}</p>

                          {/* Clase asignada */}
                          <div className="mt-1 flex items-center gap-1.5 text-xs text-neutral-600">
                            <Layers className="w-3.5 h-3.5 text-primary-600" />
                            <span>Clase: </span>
                            <span className="font-medium text-primary-800">
                              {assignedGroup ? assignedGroup.name : 'Sin clase asignada'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Controles de asignación */}
                      <div className="flex flex-wrap items-center gap-2.5 pt-3 md:pt-0 border-t md:border-t-0 border-neutral-100">
                        {/* Selector de Grupo / Clase */}
                        <div className="flex flex-col">
                          <label className="text-[10px] uppercase font-bold text-neutral-400 mb-1">
                            Clase / Grupo
                          </label>
                          <select
                            value={user.group_id ?? ''}
                            onChange={(e) => changeGroup(user.id, e.target.value || null)}
                            className="input-base py-1.5 text-xs w-44"
                          >
                            <option value="">Sin clase asignada</option>
                            {groups.map((g) => (
                              <option key={g.id} value={g.id}>
                                {g.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Selector de Rol */}
                        <div className="flex flex-col">
                          <label className="text-[10px] uppercase font-bold text-neutral-400 mb-1">
                            Rol del sistema
                          </label>
                          <select
                            value={user.role}
                            onChange={(e) => changeRole(user.id, e.target.value as Role)}
                            className="input-base py-1.5 text-xs w-32"
                          >
                            {(['admin', 'teacher', 'student'] as Role[]).map((r) => (
                              <option key={r} value={r}>
                                {ROLE_LABELS[r]}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Botón de suspender/activar */}
                        <div className="flex flex-col justify-end">
                          <label className="text-[10px] uppercase font-bold text-neutral-400 mb-1 opacity-0">
                            Acción
                          </label>
                          <button
                            onClick={() => toggleActive(user)}
                            className={
                              user.is_active
                                ? 'btn-outline btn-sm text-xs h-[34px]'
                                : 'btn-primary btn-sm text-xs h-[34px]'
                            }
                          >
                            {user.is_active ? 'Suspender' : 'Activar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA 2: CLASES / GRUPOS */}
      {activeTab === 'groups' && (
        <div className="space-y-4">
          {groups.length === 0 ? (
            <div className="card p-10 text-center">
              <Layers className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <h3 className="font-semibold text-neutral-700 mb-2">No hay clases creadas aún</h3>
              <p className="text-sm text-neutral-500 mb-4">
                Crea las clases de tu iglesia (ej. Párvulos, Primarios, Jóvenes, Adultos) para organizar a los alumnos y maestros.
              </p>
              <button
                onClick={() => setShowGroupModal(true)}
                className="btn-primary btn-md inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Crear primera clase
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groups.map((group) => {
                const studentCount = users.filter((u) => u.group_id === group.id).length
                const groupTeacher = teachers.find((t) => t.id === group.teacher_id)

                return (
                  <div key={group.id} className="card p-5 flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-display font-semibold text-lg text-neutral-900">
                          {group.name}
                        </h3>
                        <Badge variant="blue">{studentCount} alumno{studentCount !== 1 ? 's' : ''}</Badge>
                      </div>

                      {group.description && (
                        <p className="text-xs text-neutral-500 mb-4 leading-relaxed">
                          {group.description}
                        </p>
                      )}

                      {/* Asignación de Maestro */}
                      <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100 mb-2">
                        <p className="text-xs font-semibold text-neutral-700 mb-1.5 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-primary-600" />
                          Maestro responsable:
                        </p>
                        <select
                          value={group.teacher_id ?? ''}
                          onChange={(e) => handleUpdateGroupTeacher(group.id, e.target.value || null)}
                          className="input-base py-1.5 text-xs w-full bg-white"
                        >
                          <option value="">Sin maestro asignado</option>
                          {teachers.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.full_name} ({t.email})
                            </option>
                          ))}
                        </select>
                        {groupTeacher && (
                          <p className="text-[11px] text-success-600 mt-1 font-medium">
                            ✓ {groupTeacher.full_name} recibe las evaluaciones de esta clase.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                      <span className="text-xs text-neutral-400">
                        {studentCount} inscrito{studentCount !== 1 ? 's' : ''}
                      </span>
                      <button
                        onClick={() => handleDeleteGroup(group.id, group.name)}
                        className="text-danger-600 hover:text-danger-700 hover:bg-danger-50 p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors"
                        title="Eliminar clase"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Eliminar
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL CREAR NUEVA CLASE */}
      {showGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4">
          <div className="card w-full max-w-md p-6 bg-white animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
              <h3 className="font-display font-semibold text-lg text-neutral-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary-600" />
                Nueva Clase / Grupo
              </h3>
              <button
                onClick={() => setShowGroupModal(false)}
                className="text-neutral-400 hover:text-neutral-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Nombre de la Clase *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Jóvenes (15 a 25 años) o Primarios"
                  className="input-base"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Descripción (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Edades, propósito o detalles de la clase..."
                  className="input-base text-sm resize-none"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Maestro Responsable (Opcional)
                </label>
                <select
                  value={newGroupTeacherId}
                  onChange={(e) => setNewGroupTeacherId(e.target.value)}
                  className="input-base text-sm"
                >
                  <option value="">Seleccionar maestro después</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name} ({t.role === 'admin' ? 'Admin' : 'Maestro'})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-neutral-400 mt-1">
                  El maestro asignado podrá consultar y calificar a los alumnos de este grupo.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowGroupModal(false)}
                  className="btn-outline btn-md"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingGroup}
                  className="btn-primary btn-md inline-flex items-center gap-2"
                >
                  {savingGroup ? <LoadingSpinner size="sm" /> : <Check className="w-4 h-4" />}
                  {savingGroup ? 'Guardando...' : 'Crear Clase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
