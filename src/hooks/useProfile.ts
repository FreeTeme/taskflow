import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchProfile, updateProfile, uploadAvatar } from '../services/profiles'

export const profileQueryKey = (userId: string) => ['profile', userId] as const

export function useProfile(userId: string | undefined) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: profileQueryKey(userId ?? ''),
    queryFn: () => fetchProfile(userId!),
    enabled: Boolean(userId),
  })

  const updateMutation = useMutation({
    mutationFn: (updates: { name?: string | null; avatar_url?: string | null }) =>
      updateProfile(userId!, updates),
    onSuccess: (profile) => {
      queryClient.setQueryData(profileQueryKey(userId!), profile)
    },
  })

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadAvatar(userId!, file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: profileQueryKey(userId!) })
    },
  })

  return {
    profile: query.data,
    isLoading: query.isLoading,
    error: query.error,
    updateProfile: updateMutation.mutateAsync,
    uploadAvatar: uploadMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    isUploading: uploadMutation.isPending,
  }
}
