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
import type { BoardMemberWithProfile, Task, TaskPriority } from '../../types/database'

interface TaskModalProps {
  task: Task | null
  boardId: string
  open: boolean
  onClose: () => void
}

const priorityOptions: TaskPriority[] = ['low', 'medium', 'high']

const selectClassName =
  'h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'

export function TaskModal({ task, boardId, open, onClose }: TaskModalProps) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const { members } = useMembers(boardId)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [dueDate, setDueDate] = useState('')
  const [assigneeId, setAssigneeId] = useState<string>('')

  useEffect(() => {
    if (!task) return
    setTitle(task.title)
    setDescription(task.description ?? '')
    setPriority(task.priority)
    setDueDate(task.due_date ?? '')
    setAssigneeId(task.assignee_id ?? '')
  }, [task])

  const saveMutation = useMutation({
    mutationFn: (updates: Parameters<typeof updateTask>[1]) =>
      updateTask(task!.id, updates),
    onSuccess: () => {
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

  const saveField = async (updates: Parameters<typeof updateTask>[1]) => {
    if (!task) return
    await saveMutation.mutateAsync(updates)
  }

  const handleTitleBlur = () => {
    if (!task || title.trim() === task.title) return
    void saveField({ title: title.trim() })
  }

  const handleDescriptionBlur = () => {
    if (!task) return
    const next = description.trim() || null
    if (next === (task.description ?? null)) return
    void saveField({ description: next })
  }

  const handlePriorityChange = (value: TaskPriority) => {
    setPriority(value)
    if (!task || value === task.priority) return
    void saveField({ priority: value })
  }

  const handleDueDateChange = (value: string) => {
    setDueDate(value)
    if (!task) return
    const next = value || null
    if (next === (task.due_date ?? null)) return
    void saveField({ due_date: next })
  }

  const handleAssigneeChange = (value: string) => {
    setAssigneeId(value)
    if (!task) return
    const next = value || null
    if (next === (task.assignee_id ?? null)) return
    void saveField({ assignee_id: next })
  }

  if (!task) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Task details"
      footer={
        <Button
          variant="danger"
          loading={deleteMutation.isPending}
          onClick={() => void deleteMutation.mutateAsync()}
        >
          Delete task
        </Button>
      }
    >
      <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto">
        <Input
          label="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={handleTitleBlur}
        />

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text">Description</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            onBlur={handleDescriptionBlur}
            rows={4}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Add details..."
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text">Priority</span>
          <select
            className={selectClassName}
            value={priority}
            onChange={(event) => handlePriorityChange(event.target.value as TaskPriority)}
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
          onChange={(event) => handleDueDateChange(event.target.value)}
        />

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text">Assignee</span>
          <select
            className={selectClassName}
            value={assigneeId}
            onChange={(event) => handleAssigneeChange(event.target.value)}
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
    </Modal>
  )
}
