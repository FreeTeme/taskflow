import type { TaskWithAssignee } from '../../types/database'
import { Avatar } from '../shared/Avatar'

interface TaskCardPreviewProps {
  task: TaskWithAssignee
}

export function TaskCardPreview({ task }: TaskCardPreviewProps) {
  return (
    <div className="w-80 rounded-lg border border-primary bg-surface p-3 shadow-xl">
      <div className="flex items-center gap-2">
        <p className="min-w-0 flex-1 truncate text-sm font-medium leading-[1.4] text-text">
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
