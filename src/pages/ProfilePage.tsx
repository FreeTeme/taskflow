import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Button } from '../components/shared/Button'
import { Input } from '../components/shared/Input'
import { useProfile } from '../hooks/useProfile'
import { useAuth } from '../providers/AuthProvider'
import { useToast } from '../providers/ToastProvider'

export function ProfilePage() {
  const { user } = useAuth()
  const toast = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { profile, isLoading, updateProfile, uploadAvatar, isUpdating, isUploading } =
    useProfile(user?.id)

  const [name, setName] = useState('')

  useEffect(() => {
    if (profile?.name) {
      setName(profile.name)
    }
  }, [profile?.name])

  if (isLoading && !profile) {
    return <p className="p-6 text-text-muted">Loading profile...</p>
  }

  const displayName = name || profile?.name

  const handleNameBlur = async () => {
    if (!user || !name.trim() || name.trim() === profile?.name) return

    try {
      await updateProfile({ name: name.trim() })
      toast.success('Profile updated')
    } catch {
      toast.error('Failed to update profile')
    }
  }

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!user || !file) return

    try {
      await uploadAvatar(file)
      toast.success('Avatar uploaded')
    } catch {
      toast.error('Failed to upload avatar')
    } finally {
      event.target.value = ''
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-text">Profile</h1>
        <p className="mt-1 text-sm text-text-muted">Manage your account details</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-surface-muted text-xl font-semibold text-text">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={displayName ?? 'Avatar'}
              className="h-full w-full object-cover"
            />
          ) : (
            (displayName?.[0] ?? user?.email?.[0] ?? '?').toUpperCase()
          )}
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <Button
            variant="secondary"
            size="sm"
            loading={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            Upload avatar
          </Button>
        </div>
      </div>

      <Input
        label="Name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        onBlur={handleNameBlur}
        disabled={isUpdating}
      />

      <Input label="Email" value={user?.email ?? ''} disabled readOnly />

      <Input label="User ID" value={user?.id ?? ''} disabled readOnly />
    </div>
  )
}
