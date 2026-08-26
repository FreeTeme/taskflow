import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321'
const anonKey = process.env.SUPABASE_ANON_KEY ?? 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'
const password = 'TaskFlow-local-only-123!'

function client() {
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

async function signUp(email, name) {
  const supabase = client()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  })
  assert.ifError(error)
  assert.ok(data.user)
  assert.ok(data.session)
  return { supabase, user: data.user }
}

async function insertBoard(supabase, ownerId, title) {
  const { data, error } = await supabase
    .from('boards')
    .insert({ owner_id: ownerId, title })
    .select('*')
    .single()
  assert.ifError(error)
  return data
}

async function columnsFor(supabase, boardId) {
  const { data, error } = await supabase
    .from('columns')
    .select('*')
    .eq('board_id', boardId)
    .order('position')
  assert.ifError(error)
  return data
}

async function main() {
  const suffix = Date.now().toString(36)
  const ownerEmail = `owner-${suffix}@taskflow.local`
  const memberEmail = `member-${suffix}@taskflow.local`
  const outsiderEmail = `outsider-${suffix}@taskflow.local`

  const owner = await signUp(ownerEmail, 'Local Owner')
  const member = await signUp(memberEmail, 'Local Member')
  const outsider = await signUp(outsiderEmail, 'Local Outsider')

  const board = await insertBoard(owner.supabase, owner.user.id, 'Local E2E board')
  const secondBoard = await insertBoard(owner.supabase, owner.user.id, 'Boundary board')
  const columns = await columnsFor(owner.supabase, board.id)
  const secondColumns = await columnsFor(owner.supabase, secondBoard.id)
  assert.deepEqual(columns.map(({ title }) => title), ['To Do', 'In Progress', 'Done'])

  const { data: hiddenBoards, error: hiddenBoardsError } = await member.supabase
    .from('boards')
    .select('id')
    .eq('id', board.id)
  assert.ifError(hiddenBoardsError)
  assert.equal(hiddenBoards.length, 0, 'RLS exposed a board before invitation')

  const { error: inviteError } = await owner.supabase.rpc('invite_member_by_email', {
    p_board_id: board.id,
    p_email: memberEmail,
  })
  assert.ifError(inviteError)

  const { data: memberBoards, error: memberBoardsError } = await member.supabase
    .from('boards')
    .select('id')
    .eq('id', board.id)
  assert.ifError(memberBoardsError)
  assert.equal(memberBoards.length, 1)

  const { data: temporaryColumn, error: temporaryColumnError } = await owner.supabase
    .from('columns')
    .insert({ board_id: board.id, title: 'Temporary', position: 3 })
    .select('*')
    .single()
  assert.ifError(temporaryColumnError)
  const { data: renamedColumn, error: renameColumnError } = await owner.supabase
    .from('columns')
    .update({ title: 'Temporary renamed' })
    .eq('id', temporaryColumn.id)
    .select('*')
    .single()
  assert.ifError(renameColumnError)
  assert.equal(renamedColumn.title, 'Temporary renamed')
  const { data: deletedColumn, error: deleteColumnError } = await owner.supabase
    .from('columns')
    .delete()
    .eq('id', temporaryColumn.id)
    .select('id')
  assert.ifError(deleteColumnError)
  assert.equal(deletedColumn.length, 1)

  const { error: memberInviteError } = await member.supabase.rpc('invite_member_by_email', {
    p_board_id: board.id,
    p_email: outsiderEmail,
  })
  assert.ok(memberInviteError, 'A member invited another user')

  const { error: memberColumnInsertError } = await member.supabase
    .from('columns')
    .insert({ board_id: board.id, title: 'Forbidden', position: 3 })
  assert.ok(memberColumnInsertError, 'A member inserted a column')

  const { data: memberColumnUpdate, error: memberColumnUpdateError } = await member.supabase
    .from('columns')
    .update({ title: 'Forbidden rename' })
    .eq('id', columns[0].id)
    .select('id')
  assert.ifError(memberColumnUpdateError)
  assert.equal(memberColumnUpdate.length, 0, 'A member renamed a column')

  const { data: firstTask, error: firstTaskError } = await member.supabase
    .from('tasks')
    .insert({
      column_id: columns[0].id,
      title: 'Member task',
      created_by: member.user.id,
      position: 0,
      priority: 'high',
    })
    .select('*')
    .single()
  assert.ifError(firstTaskError)

  const { data: disposableTask, error: disposableTaskError } = await member.supabase
    .from('tasks')
    .insert({
      column_id: columns[0].id,
      title: 'Disposable task',
      created_by: member.user.id,
      position: 1,
    })
    .select('*')
    .single()
  assert.ifError(disposableTaskError)
  const { data: deletedTask, error: deletedTaskError } = await member.supabase
    .from('tasks')
    .delete()
    .eq('id', disposableTask.id)
    .select('id')
  assert.ifError(deletedTaskError)
  assert.equal(deletedTask.length, 1)

  const { data: detailedTask, error: detailedTaskError } = await member.supabase
    .from('tasks')
    .update({
      description: 'Local integration details',
      due_date: '2026-09-01',
      priority: 'low',
    })
    .eq('id', firstTask.id)
    .select('description,due_date,priority')
    .single()
  assert.ifError(detailedTaskError)
  assert.deepEqual(detailedTask, {
    description: 'Local integration details',
    due_date: '2026-09-01',
    priority: 'low',
  })

  let markRealtimeReady
  const realtimeReady = new Promise((resolve) => {
    markRealtimeReady = resolve
  })
  const realtimeTask = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Realtime task event timed out')), 10_000)
    const channel = owner.supabase
      .channel(`local-e2e-${suffix}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tasks' }, (payload) => {
        if (payload.new.title !== 'Realtime task') return
        clearTimeout(timeout)
        void owner.supabase.removeChannel(channel)
        resolve(payload.new)
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') markRealtimeReady()
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          clearTimeout(timeout)
          reject(new Error(`Realtime subscription failed: ${status}`))
        }
      })
  })

  await realtimeReady
  const { data: secondTask, error: secondTaskError } = await member.supabase
    .from('tasks')
    .insert({
      column_id: columns[1].id,
      title: 'Realtime task',
      created_by: member.user.id,
      position: 0,
    })
    .select('*')
    .single()
  assert.ifError(secondTaskError)
  await realtimeTask

  const { error: outsiderAssignmentError } = await owner.supabase
    .from('tasks')
    .update({ assignee_id: outsider.user.id })
    .eq('id', firstTask.id)
  assert.ok(outsiderAssignmentError, 'Assigned a task to a non-member')

  const { error: validAssignmentError } = await owner.supabase
    .from('tasks')
    .update({ assignee_id: member.user.id })
    .eq('id', firstTask.id)
  assert.ifError(validAssignmentError)

  const { data: ownComment, error: ownCommentError } = await member.supabase
    .from('comments')
    .insert({ task_id: firstTask.id, user_id: member.user.id, content: 'Local E2E comment' })
    .select('*')
    .single()
  assert.ifError(ownCommentError)
  const { data: deletedOwnComment, error: deletedOwnCommentError } = await member.supabase
    .from('comments')
    .delete()
    .eq('id', ownComment.id)
    .select('id')
  assert.ifError(deletedOwnCommentError)
  assert.equal(deletedOwnComment.length, 1)

  const { data: comment, error: commentError } = await member.supabase
    .from('comments')
    .insert({ task_id: firstTask.id, user_id: member.user.id, content: 'Protected member comment' })
    .select('*')
    .single()
  assert.ifError(commentError)

  const { error: outsiderCommentError } = await outsider.supabase
    .from('comments')
    .insert({ task_id: firstTask.id, user_id: outsider.user.id, content: 'Forbidden' })
  assert.ok(outsiderCommentError, 'An outsider commented on a private task')

  const { error: reorderError } = await member.supabase.rpc('reorder_tasks', {
    p_updates: [
      { id: firstTask.id, column_id: columns[1].id, position: 1 },
      { id: secondTask.id, column_id: columns[1].id, position: 0 },
    ],
  })
  assert.ifError(reorderError)

  const { error: crossBoardError } = await owner.supabase
    .from('tasks')
    .update({ column_id: secondColumns[0].id })
    .eq('id', firstTask.id)
  assert.ok(crossBoardError, 'Moved a task across board boundaries')

  const avatarBytes = Uint8Array.from(Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZpS8AAAAASUVORK5CYII=',
    'base64',
  ))
  const avatarPath = `${member.user.id}/local-e2e.png`
  const { error: avatarError } = await member.supabase.storage
    .from('avatars')
    .upload(avatarPath, avatarBytes, { contentType: 'image/png' })
  assert.ifError(avatarError)
  const { data: publicAvatar } = member.supabase.storage.from('avatars').getPublicUrl(avatarPath)
  const avatarResponse = await fetch(publicAvatar.publicUrl)
  assert.equal(avatarResponse.status, 200)

  const { data: updatedProfile, error: updateProfileError } = await member.supabase
    .from('profiles')
    .update({ name: 'Updated Local Member', avatar_url: publicAvatar.publicUrl })
    .eq('id', member.user.id)
    .select('name,avatar_url')
    .single()
  assert.ifError(updateProfileError)
  assert.equal(updatedProfile.name, 'Updated Local Member')
  assert.equal(updatedProfile.avatar_url, publicAvatar.publicUrl)

  const { data: membership, error: membershipError } = await owner.supabase
    .from('board_members')
    .select('id')
    .eq('board_id', board.id)
    .eq('user_id', member.user.id)
    .single()
  assert.ifError(membershipError)
  const { error: removeMemberError } = await owner.supabase
    .from('board_members')
    .delete()
    .eq('id', membership.id)
  assert.ifError(removeMemberError)

  const { data: unassignedTask, error: unassignedTaskError } = await owner.supabase
    .from('tasks')
    .select('assignee_id')
    .eq('id', firstTask.id)
    .single()
  assert.ifError(unassignedTaskError)
  assert.equal(unassignedTask.assignee_id, null, 'Removed member remained assigned')

  const { data: removedMemberBoards, error: removedMemberBoardsError } = await member.supabase
    .from('boards')
    .select('id')
    .eq('id', board.id)
  assert.ifError(removedMemberBoardsError)
  assert.equal(removedMemberBoards.length, 0)

  const { data: deletedComment, error: deleteCommentError } = await owner.supabase
    .from('comments')
    .delete()
    .eq('id', comment.id)
    .select('id')
  assert.ifError(deleteCommentError)
  assert.equal(deletedComment.length, 0, 'Owner deleted another author\'s comment')

  const { data: deletedBoard, error: deleteBoardError } = await owner.supabase
    .from('boards')
    .delete()
    .eq('id', secondBoard.id)
    .select('id')
  assert.ifError(deleteBoardError)
  assert.equal(deletedBoard.length, 1)

  console.log(JSON.stringify({
    checks: 30,
    ownerEmail,
    memberEmail,
    password,
    boardId: board.id,
    result: 'passed',
  }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
