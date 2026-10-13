import { getInitials, cn } from '@/lib/utils'

interface AvatarProps {
  name: string
  src?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover border-2 border-white shadow-sm', sizes[size], className)}
      />
    )
  }
  return (
    <div
      className={cn(
        'rounded-full bg-gradient-premium text-white font-semibold flex items-center justify-center border-2 border-white shadow-sm flex-shrink-0',
        sizes[size],
        className
      )}
      aria-label={name}
    >
      {getInitials(name)}
    </div>
  )
}
