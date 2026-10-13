import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Calendar, Search, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { formatDateShort, truncate } from '@/lib/utils'
import type { Lesson } from '@/types/database'

export function LessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase
      .from('lessons')
      .select('*, teacher:profiles(full_name)')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .then(({ data }) => {
        if (data) setLessons(data as unknown as Lesson[])
        setLoading(false)
      })
  }, [])

  const filtered = lessons.filter(l =>
    l.title.toLowerCase().includes(search.toLowerCase()) ||
    l.theme.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title text-2xl">Lecciones</h1>
        <p className="section-subtitle">Explora y estudia las lecciones bíblicas publicadas</p>
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="search"
          placeholder="Buscar por título o tema..."
          className="input-base pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <BookOpen className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="font-semibold text-neutral-700">No hay lecciones disponibles</h3>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((lesson) => (
            <Link key={lesson.id} to={`/lecciones/${lesson.id}`} className="card-hover p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <Badge variant="blue">Lección {lesson.number}</Badge>
                <ChevronRight className="w-4 h-4 text-neutral-300" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-neutral-900 mb-1">{lesson.title}</h3>
                <p className="text-xs text-gold-600 font-medium">{lesson.theme}</p>
              </div>
              <div className="bible-text !my-0 !py-1.5">
                <p className="text-xs">{truncate(lesson.biblical_text, 80)}</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-neutral-400 mt-auto">
                <Calendar className="w-3 h-3" />
                {lesson.published_at ? formatDateShort(lesson.published_at) : ''}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
