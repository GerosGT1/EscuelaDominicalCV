import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  max?: number
  label?: string
  showPercent?: boolean
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'gold' | 'success' | 'danger'
  className?: string
}

const colorClasses = {
  primary: 'bg-primary-600',
  gold:    'bg-gradient-gold',
  success: 'bg-success-500',
  danger:  'bg-danger-500',
}

const sizeClasses = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showPercent = true,
  size = 'md',
  color = 'primary',
  className,
}: ProgressBarProps) {
  const percent = Math.min(100, Math.round((value / max) * 100))

  return (
    <div className={cn('w-full', className)}>
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-xs font-medium text-neutral-600">{label}</span>}
          {showPercent && (
            <span className="text-xs font-semibold text-neutral-700">{percent}%</span>
          )}
        </div>
      )}
      <div className={cn('w-full bg-neutral-200 rounded-full overflow-hidden', sizeClasses[size])}>
        <div
          className={cn('rounded-full transition-all duration-500 ease-out', colorClasses[color], sizeClasses[size])}
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  )
}
