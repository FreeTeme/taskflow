import type { Task } from '../../types/database'

interface TaskCardPreviewProps {
  task: Task
}

export function TaskCardPreview({ task }: TaskCardPreviewProps) {
  return (
    <div className="rounded-lg border border-primary bg-surface px-3 py-2 shadow-lg">
      <p className="text-sm font-medium text-text">{task.title}</p>
    </div>
  )
}
