import { useEffect } from 'react'

interface ToastProps {
  message: string
  variant?: 'error' | 'success'
  onDismiss: () => void
}

export function Toast({
  message,
  variant = 'error',
  onDismiss,
}: ToastProps) {
  useEffect(() => {
    if (variant === 'error') return
    const timer = window.setTimeout(onDismiss, 5000)
    return () => window.clearTimeout(timer)
  }, [onDismiss, variant])

  const styles =
    variant === 'error'
      ? 'border-danger/30 bg-surface text-danger'
      : 'border-success/30 bg-surface text-success'

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
      className={`fixed inset-x-4 top-4 z-50 mx-auto flex max-w-sm items-start gap-3 rounded-lg border px-4 py-3 shadow-lg ${styles}`}
    >
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="-my-2 -mr-2 inline-flex min-h-10 min-w-10 items-center justify-center rounded-md text-lg opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  )
}
