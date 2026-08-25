import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Button } from '../components/shared/Button'
import { Input } from '../components/shared/Input'
import { useProfile } from '../hooks/useProfile'
import { useAuth } from '../providers/AuthProvider'
import { useToast } from '../providers/ToastProvider'
import { Link } from 'react-router-dom'
import { Avatar } from '../components/shared/Avatar'
import { Spinner } from '../components/shared/Spinner'

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
    return <main className="flex min-h-screen items-center justify-center"><Spinner size="lg" className="text-primary" label="Loading profile" /></main>
  }

  const displayName = name || profile?.name

  const handleNameBlur = async () => {
    if (!user || !name.trim() || name.trim() === profile?.name) return

    try {
      await updateProfile({ name: name.trim() })
      toast.success('Profile updated')
    } catch {
      toast.error('Unable to update your profile. Check your connection and try again.')
    }
  }

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!user || !file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Choose a JPEG, PNG, or WebP image.')
      event.target.value = ''
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Choose an image smaller than 5 MB.')
      event.target.value = ''
      return
    }

    try {
      await uploadAvatar(file)
      toast.success('Avatar uploaded')
    } catch {
      toast.error('Unable to upload the avatar. Check your connection and try again.')
    } finally {
      event.target.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-surface-muted">
      <a href="#main-content" className="skip-link">Skip to profile</a>
      <header className="border-b border-border bg-surface px-4 py-3 sm:px-6">
        <nav aria-label="Primary" className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <Link to="/" className="rounded-md text-lg font-bold text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">TaskFlow</Link>
          <Link to="/" className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-medium text-text-muted hover:bg-surface-muted hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Back to boards</Link>
        </nav>
      </header>
      <main id="main-content" className="mx-auto flex w-full max-w-lg flex-col gap-8 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold text-text">Profile</h1>
        <p className="mt-1 text-sm text-text-muted">Manage your account details</p>
      </div>

      <section aria-labelledby="avatar-heading" className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-surface p-5">
        <h2 id="avatar-heading" className="sr-only">Profile picture</h2>
        <Avatar name={displayName ?? user?.email} src={profile?.avatar_url} size="lg" className="h-16 w-16 text-xl" />
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <Button
            variant="secondary"
            size="sm"
            loading={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            Change profile picture
          </Button>
          <p className="mt-2 text-xs text-text-muted">JPEG, PNG, or WebP. Maximum 5 MB.</p>
        </div>
      </section>

      <section aria-labelledby="account-heading" className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
        <h2 id="account-heading" className="text-lg font-semibold text-text">Account details</h2>
        <Input label="Name" name="name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} onBlur={() => void handleNameBlur()} disabled={isUpdating} />

        <Input label="Email" name="email" value={user?.email ?? ''} readOnly className="bg-surface-muted" />

        <Input label="User ID" name="user-id" value={user?.id ?? ''} readOnly className="bg-surface-muted font-mono text-xs sm:text-xs" />
      </section>
      </main>
    </div>
  )
}
