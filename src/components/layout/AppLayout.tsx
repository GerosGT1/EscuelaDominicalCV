import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { BottomNav } from './BottomNav'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      {/* Sidebar adaptable para escritorio y móvil */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto scrollbar-thin pb-20 lg:pb-6">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Navegación inferior — solo móvil alumnos */}
      <BottomNav />
    </div>
  )
}
