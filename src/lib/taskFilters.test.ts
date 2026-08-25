import { describe, expect, it } from 'vitest'
import type { Task } from '../types/database'
import { defaultTaskFilters, filterTasks } from './taskFilters'

function task(overrides: Partial<Task> & Pick<Task, 'id' | 'title'>): Task {
  return {
    column_id: 'column-1',
    description: null,
    priority: 'medium',
    due_date: null,
    assignee_id: null,
    position: 0,
    created_by: 'user-1',
    created_at: '2026-08-25T00:00:00.000Z',
    ...overrides,
    id: overrides.id,
    title: overrides.title,
  }
}

const tasks = [
  task({ id: 'one', title: 'Plan release', priority: 'high', assignee_id: 'user-1' }),
  task({ id: 'two', title: 'Write documentation', priority: 'low' }),
  task({ id: 'three', title: 'Review release notes', priority: 'high' }),
]

describe('filterTasks', () => {
  it('returns every task for the default filters', () => {
    expect(filterTasks(tasks, defaultTaskFilters)).toEqual(tasks)
  })

  it('combines search, priority and assignee filters', () => {
    expect(
      filterTasks(tasks, {
        ...defaultTaskFilters,
        search: 'release',
        priority: 'high',
        assigneeId: 'unassigned',
      }).map(({ id }) => id),
    ).toEqual(['three'])
  })

  it('matches search without regard to case or surrounding whitespace', () => {
    expect(
      filterTasks(tasks, {
        ...defaultTaskFilters,
        search: '  DOCUMENTATION  ',
      }).map(({ id }) => id),
    ).toEqual(['two'])
  })
})
