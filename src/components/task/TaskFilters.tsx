import type { TaskPriority } from '../../types/database'
import type { DueDateFilter, TaskFiltersState } from '../../lib/taskFilters'
import type { BoardMemberWithProfile } from '../../types/database'

interface TaskFiltersProps {
  filters: TaskFiltersState
  members: BoardMemberWithProfile[]
  onPriorityChange: (priority: TaskFiltersState['priority']) => void
  onAssigneeChange: (assigneeId: TaskFiltersState['assigneeId']) => void
  onDueDateChange: (dueDate: DueDateFilter) => void
  onReset: () => void
}

const priorityOptions: Array<{ value: TaskPriority | 'all'; label: string }> = [
  { value: 'all', label: 'All priorities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

const dueDateOptions: Array<{ value: DueDateFilter; label: string }> = [
  { value: 'all', label: 'Any due date' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'today', label: 'Due today' },
  { value: 'week', label: 'Due this week' },
  { value: 'none', label: 'No due date' },
]

const selectClassName =
  'h-9 rounded-lg border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'

export function TaskFilters({
  filters,
  members,
  onPriorityChange,
  onAssigneeChange,
  onDueDateChange,
  onReset,
}: TaskFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-text">Priority</span>
        <select
          className={selectClassName}
          value={filters.priority}
          onChange={(event) =>
            onPriorityChange(event.target.value as TaskFiltersState['priority'])
          }
        >
          {priorityOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-text">Assignee</span>
        <select
          className={selectClassName}
          value={filters.assigneeId}
          onChange={(event) =>
            onAssigneeChange(event.target.value as TaskFiltersState['assigneeId'])
          }
        >
          <option value="all">All assignees</option>
          <option value="unassigned">Unassigned</option>
          {members.map((member) => (
            <option key={member.user_id} value={member.user_id}>
              {member.profile?.name ?? member.user_id.slice(0, 8)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-text">Due date</span>
        <select
          className={selectClassName}
          value={filters.dueDate}
          onChange={(event) => onDueDateChange(event.target.value as DueDateFilter)}
        >
          {dueDateOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={onReset}
        className="h-9 rounded-lg px-3 text-sm text-text-muted transition-colors hover:bg-surface-muted hover:text-text"
      >
        Reset filters
      </button>
    </div>
  )
}
