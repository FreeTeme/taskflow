import type { TaskWithAssignee } from '../../types/database'
import { Avatar } from '../shared/Avatar'

interface TaskCardPreviewProps {
  task: TaskWithAssignee
}

export function TaskCardPreview({ task }: TaskCardPreviewProps) {
  return (
    <div className="w-72 rounded-lg border border-primary bg-surface px-3 py-2 shadow-lg">
      <div className="flex items-center gap-2">
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-text">
          {task.title}
        </p>
        {task.assignee ? (
          <Avatar
            name={task.assignee.name}
            src={task.assignee.avatar_url}
            size="sm"
          />
        ) : null}
      </div>
    </div>
  )
}
