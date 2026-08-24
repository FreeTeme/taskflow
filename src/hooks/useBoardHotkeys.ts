import { useEffect } from 'react'

interface UseBoardHotkeysOptions {
  onNewTask?: () => void
  onCloseModal?: () => void
  modalOpen?: boolean
  enabled?: boolean
}

export function useBoardHotkeys({
  onNewTask,
  onCloseModal,
  modalOpen = false,
  enabled = true,
}: UseBoardHotkeysOptions) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isTyping =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        target?.isContentEditable

      if (event.key === 'Escape' && modalOpen) {
        event.preventDefault()
        onCloseModal?.()
        return
      }

      if (isTyping) return

      if (event.key.toLowerCase() === 'n' && !event.metaKey && !event.ctrlKey) {
        event.preventDefault()
        onNewTask?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, modalOpen, onCloseModal, onNewTask])
}
