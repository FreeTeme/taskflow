export const queryKeys = {
  boards: {
    all: ['boards'] as const,
    detail: (boardId: string) => ['boards', boardId] as const,
  },
  columns: {
    byBoard: (boardId: string) => ['columns', boardId] as const,
  },
  tasks: {
    byBoard: (boardId: string) => ['tasks', boardId] as const,
  },
} as const
