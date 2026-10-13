import { cn } from '@/lib/utils'

type BadgeVariant = 'blue' | 'gold' | 'green' | 'gray' | 'red'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  blue:  'bg-primary-100 text-primary-700',
  gold:  'bg-gold-100 text-gold-700',
  green: 'bg-success-50 text-success-700',
  gray:  'bg-neutral-100 text-neutral-600',
  red:   'bg-danger-50 text-danger-600',
}

export function Badge({ children, variant = 'gray', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
