import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchMembers,
  inviteMemberByEmail,
  removeMember,
} from '../services/members'

export const membersQueryKey = (boardId: string) => ['members', boardId] as const

export function useMembers(boardId: string | undefined) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: membersQueryKey(boardId ?? ''),
    queryFn: () => fetchMembers(boardId!),
    enabled: Boolean(boardId),
  })

  const inviteMutation = useMutation({
    mutationFn: (email: string) => inviteMemberByEmail(boardId!, email),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: membersQueryKey(boardId!) })
    },
  })

  const removeMutation = useMutation({
    mutationFn: removeMember,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: membersQueryKey(boardId!) })
    },
  })

  return {
    members: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    inviteMember: inviteMutation.mutateAsync,
    removeMember: removeMutation.mutateAsync,
    isInviting: inviteMutation.isPending,
    isRemoving: removeMutation.isPending,
  }
}
