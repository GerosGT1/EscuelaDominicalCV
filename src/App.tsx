import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthInit } from '@/hooks/useAuth'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { RoleGuard, PublicOnlyGuard } from '@/components/shared/RoleGuard'
import { AppLayout } from '@/components/layout/AppLayout'

// Auth pages
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { EmailConfirmPage } from '@/pages/auth/EmailConfirmPage'

// Student pages
import { StudentDashboard } from '@/pages/student/StudentDashboard'
import { LessonsPage } from '@/pages/student/LessonsPage'
import { LessonDetailPage } from '@/pages/student/LessonDetailPage'
import { ExercisesPage } from '@/pages/student/ExercisesPage'
import { ExercisePage } from '@/pages/student/ExercisePage'
import { ProgressPage } from '@/pages/student/ProgressPage'

// Teacher pages
import { TeacherDashboard } from '@/pages/teacher/TeacherDashboard'
import { TeacherLessonsPage } from '@/pages/teacher/TeacherLessonsPage'
import { LessonEditorPage } from '@/pages/teacher/LessonEditorPage'
import { TeacherExercisesPage } from '@/pages/teacher/TeacherExercisesPage'
import { ExerciseBuilderPage } from '@/pages/teacher/ExerciseBuilderPage'
import { TeacherStudentsPage } from '@/pages/teacher/TeacherStudentsPage'
import { TeacherReportsPage } from '@/pages/teacher/TeacherReportsPage'

// Admin pages
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { UserManagerPage } from '@/pages/admin/UserManagerPage'
import { AdminLessonsPage } from '@/pages/admin/AdminLessonsPage'
import { AdminReportsPage } from '@/pages/admin/AdminReportsPage'
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage'

import { useAuthStore } from '@/store/authStore'

function RootRedirect() {
  const { profile } = useAuthStore()
  if (profile?.role === 'admin') return <Navigate to="/admin" replace />
  if (profile?.role === 'teacher') return <Navigate to="/maestro" replace />
  return <Navigate to="/dashboard" replace />
}

function AppRouter() {
  useAuthInit()
  const { initialized } = useAuthStore()

  if (!initialized) return <PageLoader />

  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta raíz */}
        <Route path="/" element={<RootRedirect />} />

        {/* Rutas públicas (solo sin sesión) */}
        <Route
          path="/auth/ingresar"
          element={<PublicOnlyGuard><LoginPage /></PublicOnlyGuard>}
        />
        <Route
          path="/auth/registro"
          element={<PublicOnlyGuard><RegisterPage /></PublicOnlyGuard>}
        />
        <Route
          path="/auth/recuperar-contrasena"
          element={<PublicOnlyGuard><ForgotPasswordPage /></PublicOnlyGuard>}
        />
        <Route path="/auth/confirmar-correo" element={<EmailConfirmPage />} />

        {/* Rutas del alumno */}
        <Route
          element={
            <RoleGuard allowedRoles={['student', 'teacher', 'admin']}>
              <AppLayout />
            </RoleGuard>
          }
        >
          <Route path="/dashboard" element={<StudentDashboard />} />
          <Route path="/lecciones" element={<LessonsPage />} />
          <Route path="/lecciones/:id" element={<LessonDetailPage />} />
          <Route path="/ejercicios" element={<ExercisesPage />} />
          <Route path="/ejercicios/:id" element={<ExercisePage />} />
          <Route path="/mi-progreso" element={<ProgressPage />} />
        </Route>

        {/* Rutas del maestro */}
        <Route
          element={
            <RoleGuard allowedRoles={['teacher', 'admin']}>
              <AppLayout />
            </RoleGuard>
          }
        >
          <Route path="/maestro" element={<TeacherDashboard />} />
          <Route path="/maestro/lecciones" element={<TeacherLessonsPage />} />
          <Route path="/maestro/lecciones/nueva" element={<LessonEditorPage />} />
          <Route path="/maestro/lecciones/:id/editar" element={<LessonEditorPage />} />
          <Route path="/maestro/ejercicios" element={<TeacherExercisesPage />} />
          <Route path="/maestro/ejercicios/:id" element={<ExerciseBuilderPage />} />
          <Route path="/maestro/alumnos" element={<TeacherStudentsPage />} />
          <Route path="/maestro/reportes" element={<TeacherReportsPage />} />
        </Route>

        {/* Rutas del administrador */}
        <Route
          element={
            <RoleGuard allowedRoles={['admin']}>
              <AppLayout />
            </RoleGuard>
          }
        >
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/usuarios" element={<UserManagerPage />} />
          <Route path="/admin/lecciones" element={<AdminLessonsPage />} />
          <Route path="/admin/reportes" element={<AdminReportsPage />} />
          <Route path="/admin/configuracion" element={<AdminSettingsPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <>
      <AppRouter />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '12px',
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif',
          },
          success: {
            iconTheme: { primary: '#16a34a', secondary: '#f0fdf4' },
          },
          error: {
            iconTheme: { primary: '#dc2626', secondary: '#fef2f2' },
          },
        }}
      />
    </>
  )
}
