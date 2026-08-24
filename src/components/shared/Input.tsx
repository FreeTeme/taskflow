import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className = '', ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label ? (
          <label htmlFor={inputId} className="text-sm font-medium text-text">
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={`h-10 w-full rounded-lg border bg-surface px-3 text-sm text-text outline-none transition-colors placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 ${
            error ? 'border-danger' : 'border-border'
          } ${className}`}
          {...props}
        />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </div>
    )
  },
)

Input.displayName = 'Input'
