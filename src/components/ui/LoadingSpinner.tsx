import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizes = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-[3px]',
  xl: 'w-12 h-12 border-4',
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        'rounded-full border-neutral-200 border-t-primary-600 animate-spin',
        sizes[size],
        className
      )}
      role="status"
      aria-label="Cargando..."
    />
  )
}

export function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="xl" />
        <p className="text-sm text-neutral-500 animate-pulse">Cargando...</p>
      </div>
    </div>
  )
}
