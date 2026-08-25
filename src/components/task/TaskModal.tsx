import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '../shared/Button'
import { Input } from '../shared/Input'
import { Modal } from '../shared/Modal'
import { CommentForm } from './CommentForm'
import { CommentList } from './CommentList'
import { useMembers } from '../../hooks/useMembers'
import { useToast } from '../../providers/ToastProvider'
import { deleteTask, updateTask } from '../../services/tasks'
import { queryKeys } from '../../lib/queryKeys'
import type {
  BoardMemberWithProfile,
  Task,
  TaskPriority,
  TaskWithAssignee,
} from '../../types/database'

interface TaskModalProps {
  task: Task | null
  boardId: string
  open: boolean
  onClose: () => void
}

const priorityOptions: TaskPriority[] = ['low', 'medium', 'high']

const selectClassName =
  'h-10 w-full rounded-lg border border-border bg-surface px-3 text-base text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-sm'

export function TaskModal({ task, boardId, open, onClose }: TaskModalProps) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const { members } = useMembers(boardId)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [dueDate, setDueDate] = useState('')
  const [assigneeId, setAssigneeId] = useState<string>('')
  const [titleError, setTitleError] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  useEffect(() => {
    if (!task) return
    setTitle(task.title)
    setTitleError(null)
    setDescription(task.description ?? '')
    setPriority(task.priority)
    setDueDate(task.due_date ?? '')
    setAssigneeId(task.assignee_id ?? '')
    setConfirmingDelete(false)
  }, [task])

  const saveMutation = useMutation({
    mutationFn: ({
      taskId,
      updates,
    }: {
      taskId: string
      updates: Parameters<typeof updateTask>[1]
    }) => updateTask(taskId, updates),
    onSuccess: (updatedTask) => {
      queryClient.setQueryData<TaskWithAssignee[]>(
        queryKeys.tasks.byBoard(boardId),
        (current) => current?.map((currentTask) => {
          if (currentTask.id !== updatedTask.id) return currentTask

          const assignee = members.find(
            (member) => member.user_id === updatedTask.assignee_id,
          )?.profile

          return {
            ...currentTask,
            ...updatedTask,
            assignee:
              updatedTask.assignee_id === currentTask.assignee_id
                ? currentTask.assignee ?? assignee ?? null
                : assignee ?? null,
          }
        }),
      )
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byBoard(boardId) })
    },
    onError: () => {
      toast.error('Failed to save task')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteTask(task!.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byBoard(boardId) })
      toast.success('Task deleted')
      onClose()
    },
    onError: () => {
      toast.error('Failed to delete task')
    },
  })

  const saveField = async (updates: Parameters<typeof updateTask>[1]): Promise<boolean> => {
    if (!task) return false
    try {
      await saveMutation.mutateAsync({ taskId: task.id, updates })
      return true
    } catch {
      return false
    }
  }

  const handleTitleBlur = async () => {
    if (!task) return
    const next = title.trim()
    if (!next) {
      setTitleError('Enter a title before saving.')
      return
    }
    setTitleError(null)
    if (next === task.title) return
    if (!(await saveField({ title: next }))) setTitle(task.title)
  }

  const handleDescriptionBlur = async () => {
    if (!task) return
    const next = description.trim() || null
    if (next === (task.description ?? null)) return
    if (!(await saveField({ description: next }))) {
      setDescription(task.description ?? '')
    }
  }

  const handlePriorityChange = async (value: TaskPriority) => {
    setPriority(value)
    if (!task || value === task.priority) return
    if (!(await saveField({ priority: value }))) setPriority(task.priority)
  }

  const handleDueDateChange = async (value: string) => {
    setDueDate(value)
    if (!task) return
    const next = value || null
    if (next === (task.due_date ?? null)) return
    if (!(await saveField({ due_date: next }))) setDueDate(task.due_date ?? '')
  }

  const handleAssigneeChange = async (value: string) => {
    setAssigneeId(value)
    if (!task) return
    const next = value || null
    if (next === (task.assignee_id ?? null)) return
    if (!(await saveField({ assignee_id: next }))) {
      setAssigneeId(task.assignee_id ?? '')
    }
  }

  if (!task) return null

  return (
    <Modal
      open={open}
      onClose={() => {
        setConfirmingDelete(false)
        onClose()
      }}
      title={confirmingDelete ? 'Delete task?' : 'Task details'}
      description={confirmingDelete ? 'This task and its comments will be permanently deleted.' : undefined}
      footer={
        confirmingDelete ? (
          <>
            <Button variant="secondary" onClick={() => setConfirmingDelete(false)}>Cancel</Button>
            <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>Delete task</Button>
          </>
        ) : (
          <Button variant="danger" onClick={() => setConfirmingDelete(true)}>Delete task</Button>
        )
      }
    >
      {confirmingDelete ? null : (
      <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="task-title" className="text-sm font-medium text-text">
            Title
          </label>
          <input
            id="task-title"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value)
              if (event.target.value.trim()) setTitleError(null)
            }}
            onBlur={() => void handleTitleBlur()}
            aria-invalid={!!titleError}
            aria-describedby={titleError ? 'task-title-error' : undefined}
            className={`h-10 w-full rounded-lg border bg-surface px-3 text-base text-text outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-sm ${
              titleError ? 'border-danger' : 'border-border'
            }`}
          />
          {titleError ? (
            <p id="task-title-error" role="alert" className="text-sm text-danger">
              {titleError}
            </p>
          ) : null}
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text">Description</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            onBlur={() => void handleDescriptionBlur()}
            rows={4}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-base text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-sm"
            placeholder="Add details..."
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text">Priority</span>
          <select
            className={selectClassName}
            value={priority}
            onChange={(event) => void handlePriorityChange(event.target.value as TaskPriority)}
          >
            {priorityOptions.map((option) => (
              <option key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        </label>

        <Input
          label="Due date"
          type="date"
          value={dueDate}
          onChange={(event) => void handleDueDateChange(event.target.value)}
        />

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text">Assignee</span>
          <select
            className={selectClassName}
            value={assigneeId}
            onChange={(event) => void handleAssigneeChange(event.target.value)}
          >
            <option value="">Unassigned</option>
            {members.map((member: BoardMemberWithProfile) => (
              <option key={member.user_id} value={member.user_id}>
                {member.profile?.name ?? member.user_id.slice(0, 8)}
              </option>
            ))}
          </select>
        </label>

        <section className="border-t border-border pt-4">
          <h3 className="mb-3 text-sm font-semibold text-text">Comments</h3>
          <div className="flex flex-col gap-4">
            <CommentList taskId={task.id} />
            <CommentForm taskId={task.id} />
          </div>
        </section>
      </div>
      )}
    </Modal>
  )
}
