import { useState, type FormEvent } from 'react'
import { Button } from '../shared/Button'
import { Input } from '../shared/Input'
import { Modal } from '../shared/Modal'
import { useMembers } from '../../hooks/useMembers'
import { useAuth } from '../../providers/AuthProvider'
import { useToast } from '../../providers/ToastProvider'
import type { BoardMemberWithProfile } from '../../types/database'

interface BoardMembersModalProps {
  boardId: string
  ownerId: string
  open: boolean
  onClose: () => void
}

export function BoardMembersModal({
  boardId,
  ownerId,
  open,
  onClose,
}: BoardMembersModalProps) {
  const { user } = useAuth()
  const toast = useToast()
  const { members, inviteMember, removeMember, isInviting, isRemoving } =
    useMembers(boardId)
  const [email, setEmail] = useState('')
  const [memberToRemove, setMemberToRemove] = useState<BoardMemberWithProfile | null>(null)

  const isOwner = user?.id === ownerId

  const handleInvite = async (event: FormEvent) => {
    event.preventDefault()
    if (!email.trim()) return

    try {
      await inviteMember(email)
      toast.success('Member added. The board is now in their list.')
      setEmail('')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to invite member'
      toast.error(message)
    }
  }

  const handleRemove = async (member: BoardMemberWithProfile) => {
    if (member.role === 'owner') return

    try {
      await removeMember(member.id)
      toast.success('Member removed')
      setMemberToRemove(null)
    } catch {
      toast.error('Failed to remove member')
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        setMemberToRemove(null)
        onClose()
      }}
      title={memberToRemove ? 'Remove member?' : 'Board members'}
      description={memberToRemove ? `${memberToRemove.profile?.name ?? 'This member'} will lose access to the board and will be unassigned from its tasks.` : undefined}
      footer={memberToRemove ? (
        <>
          <Button variant="secondary" onClick={() => setMemberToRemove(null)} disabled={isRemoving}>Cancel</Button>
          <Button variant="danger" loading={isRemoving} onClick={() => void handleRemove(memberToRemove)}>Remove member</Button>
        </>
      ) : undefined}
    >
      {memberToRemove ? null : (
      <div className="flex flex-col gap-4">
        <ul className="flex flex-col gap-2">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between rounded-lg border border-border bg-surface-muted px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium text-text">
                  {member.profile?.name ?? 'Unknown user'}
                </p>
                <p className="text-xs capitalize text-text-muted">{member.role}</p>
              </div>
              {isOwner && member.role !== 'owner' ? (
                <Button
                  variant="ghost"
                  size="sm"
                  loading={isRemoving}
                  onClick={() => setMemberToRemove(member)}
                >
                  Remove
                </Button>
              ) : null}
            </li>
          ))}
        </ul>

        {isOwner ? (
          <form onSubmit={handleInvite} className="flex flex-col gap-2 border-t border-border pt-4">
            <Input
              label="Invite member by email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="user@example.com"
            />
            <p className="text-xs text-text-muted">
              They need an existing TaskFlow account. The board will appear in their list.
            </p>
            <div className="flex justify-end">
              <Button type="submit" loading={isInviting} disabled={!email.trim()}>
                Invite
              </Button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-text-muted">Only the board owner can invite members.</p>
        )}
      </div>
      )}
    </Modal>
  )
}
