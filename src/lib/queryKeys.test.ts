import { describe, expect, it } from 'vitest'
import { queryKeys } from './queryKeys'

describe('private query keys', () => {
  it('scopes board lists to the authenticated user', () => {
    expect(queryKeys.boards.all('user-a')).not.toEqual(
      queryKeys.boards.all('user-b'),
    )
  })

  it('uses the private namespace for board data', () => {
    expect(queryKeys.boards.detail('board-1')[0]).toBe('private')
    expect(queryKeys.columns.byBoard('board-1')[0]).toBe('private')
    expect(queryKeys.tasks.byBoard('board-1')[0]).toBe('private')
  })
})
