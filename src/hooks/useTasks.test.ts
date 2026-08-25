import { describe, expect, it } from 'vitest'
import type { Task } from '../types/database'
import { buildMoveUpdates } from './useTasks'

function task(id: string, position: number): Task {
  return {
    id,
    column_id: 'column-1',
    title: id,
    description: null,
    priority: 'medium',
    due_date: null,
    assignee_id: null,
    position,
    created_by: 'user-1',
    created_at: '2026-08-25T00:00:00.000Z',
  }
}

describe('buildMoveUpdates', () => {
  it('preserves hidden tasks while reordering a filtered view', () => {
    const hidden = task('hidden', 0)
    const active = task('active', 1)
    const visibleTarget = task('visible-target', 2)

    const updates = buildMoveUpdates(
      { 'column-1': [hidden, active, visibleTarget] },
      active.id,
      'column-1',
      2,
    )

    expect(updates).toEqual([
      { id: visibleTarget.id, column_id: 'column-1', position: 1 },
      { id: active.id, column_id: 'column-1', position: 2 },
    ])
    expect(updates.some(({ id }) => id === hidden.id)).toBe(false)
  })
})
