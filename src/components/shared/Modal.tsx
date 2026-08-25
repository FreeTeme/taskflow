import {
  useEffect,
  useId,
  useRef,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'
import { Button } from './Button'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  initialFocusRef?: RefObject<HTMLElement | null>
  closeLabel?: string
}

export function Modal({ open, onClose, title, description, children, footer, initialFocusRef, closeLabel = 'Close dialog' }: ModalProps) {
  const titleId = useId()
  const descriptionId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    const appRoot = document.getElementById('root')
    const previousOverflow = document.body.style.overflow
    appRoot?.setAttribute('inert', '')
    document.body.style.overflow = 'hidden'

    const focusTimer = window.requestAnimationFrame(() => {
      const target = initialFocusRef?.current
        ?? dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
        ?? dialogRef.current
      target?.focus()
    })

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }

      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)]
      if (focusable.length === 0) {
        event.preventDefault()
        dialogRef.current.focus()
        return
      }
      const first = focusable[0]!
      const last = focusable[focusable.length - 1]!
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      window.cancelAnimationFrame(focusTimer)
      document.removeEventListener('keydown', handleKeyDown)
      appRoot?.removeAttribute('inert')
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus()
    }
  }, [initialFocusRef, open])

  if (!open) return null

  const handleBackdropMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onCloseRef.current()
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain bg-black/50 p-4" onMouseDown={handleBackdropMouseDown}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className="relative w-full max-w-lg rounded-2xl border border-border bg-surface shadow-xl outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-5 sm:px-6 sm:pt-6">
          <div className="min-w-0">
            <h2 id={titleId} className="text-balance text-lg font-semibold leading-tight text-text">{title}</h2>
            {description ? <p id={descriptionId} className="mt-2 text-pretty text-sm leading-relaxed text-text-muted">{description}</p> : null}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label={closeLabel} className="-mr-2 min-w-10 px-2">
            <span aria-hidden="true">×</span>
          </Button>
        </div>
        <div className="px-5 py-3 sm:px-6">{children}</div>
        {footer ? (
          <div className="flex flex-wrap-reverse justify-end gap-3 px-5 pb-5 pt-3 sm:px-6 sm:pb-6">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
  onClose: () => void
  loading?: boolean
  destructive?: boolean
}

export function ConfirmDialog({ open, title, description, confirmLabel, onConfirm, onClose, loading = false, destructive = false }: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  return (
    <Modal open={open} onClose={onClose} title={title} description={description} initialFocusRef={cancelRef} footer={
      <>
        <Button ref={cancelRef} variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant={destructive ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      </>
    }>
      <span className="sr-only">Choose an action below.</span>
    </Modal>
  )
}
