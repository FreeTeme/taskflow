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
    const timer = window.setTimeout(onDismiss, 5000)
    return () => window.clearTimeout(timer)
  }, [onDismiss])

  const styles =
    variant === 'error'
      ? 'border-danger/30 bg-danger/10 text-danger'
      : 'border-success/30 bg-success/10 text-success'

  return (
    <div
      role="alert"
      className={`fixed right-4 top-4 z-50 flex max-w-sm items-start gap-3 rounded-lg border px-4 py-3 shadow-lg ${styles}`}
    >
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="text-sm opacity-70 hover:opacity-100"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}
