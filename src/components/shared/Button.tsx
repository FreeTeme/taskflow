import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Spinner } from './Spinner'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  children: ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-primary-foreground hover:bg-primary-hover focus-visible:ring-primary/50',
  secondary:
    'border border-border bg-surface text-text hover:bg-surface-muted focus-visible:ring-primary/30',
  ghost:
    'bg-transparent text-text-muted hover:bg-surface-muted hover:text-text focus-visible:ring-primary/30',
  danger:
    'bg-danger-fill text-danger-foreground hover:bg-danger-fill-hover focus-visible:ring-danger/50',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-10 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-base',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}, ref) {
  return (
    <button
      type="button"
      ref={ref}
      disabled={Boolean(disabled || loading)}
      aria-busy={loading || undefined}
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-medium transition-[background-color,color,border-color,box-shadow,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface motion-safe:active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {loading ? <Spinner size="sm" className="text-current" /> : null}
      {children}
    </button>
  )
})
