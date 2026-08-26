export const queryKeys = {
  boards: {
    all: (userId: string) => ['private', 'boards', userId] as const,
    detail: (boardId: string) => ['private', 'boards', 'detail', boardId] as const,
  },
  notifications: {
    all: (userId: string) => ['private', 'notifications', userId] as const,
  },
  columns: {
    byBoard: (boardId: string) => ['private', 'columns', boardId] as const,
  },
  tasks: {
    byBoard: (boardId: string) => ['private', 'tasks', boardId] as const,
  },
} as const
