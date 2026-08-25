import { forwardRef, useId, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className = '', 'aria-describedby': ariaDescribedBy, 'aria-invalid': ariaInvalid, ...props }, ref) => {
    const generatedId = useId()
    const inputId = id ?? `input-${generatedId}`
    const errorId = `${inputId}-error`
    const describedBy = [ariaDescribedBy, error ? errorId : null]
      .filter(Boolean)
      .join(' ') || undefined

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
          aria-invalid={error ? true : ariaInvalid}
          aria-describedby={describedBy}
          className={`min-h-10 w-full rounded-lg border bg-surface px-3 text-base text-text outline-none transition-[border-color,box-shadow] placeholder:text-text-muted focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 sm:text-sm ${
            error ? 'border-danger' : 'border-border'
          } ${className}`}
          {...props}
        />
        {error ? <p id={errorId} className="text-sm text-danger">{error}</p> : null}
      </div>
    )
  },
)

Input.displayName = 'Input'
