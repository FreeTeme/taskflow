import { createClient } from 'npm:@supabase/supabase-js@2'

const PRODUCTION_ORIGIN = 'https://taskflow-one-livid-94.vercel.app'
const ALLOWED_ORIGINS = new Set([
  PRODUCTION_ORIGIN,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
])

function corsHeaders(origin: string | null) {
  return {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Origin': origin && ALLOWED_ORIGINS.has(origin)
      ? origin
      : PRODUCTION_ORIGIN,
    'Vary': 'Origin',
  }
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  headers: Record<string, string>,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (request) => {
  const origin = request.headers.get('origin')
  const headers = corsHeaders(origin)

  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, headers)
  }

  const authorization = request.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Authentication required' }, 401, headers)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: 'Server configuration is incomplete' }, 500, headers)
  }

  let payload: { boardId?: string; email?: string }
  try {
    payload = await request.json()
  } catch {
    return jsonResponse({ error: 'Invalid request body' }, 400, headers)
  }

  const boardId = payload.boardId?.trim()
  const email = payload.email?.trim().toLowerCase()
  if (!boardId || !email) {
    return jsonResponse({ error: 'Board and email are required' }, 400, headers)
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  })
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const token = authorization.slice('Bearer '.length)
  const { data: userData, error: userError } = await adminClient.auth.getUser(token)
  if (userError || !userData.user) {
    return jsonResponse({ error: 'Your session has expired. Sign in again.' }, 401, headers)
  }

  const { data: board, error: boardError } = await adminClient
    .from('boards')
    .select('owner_id')
    .eq('id', boardId)
    .maybeSingle()

  if (boardError) {
    return jsonResponse({ error: 'Unable to verify board access' }, 500, headers)
  }
  if (!board || board.owner_id !== userData.user.id) {
    return jsonResponse({ error: 'Only the board owner can invite members' }, 403, headers)
  }

  const redirectOrigin = origin && ALLOWED_ORIGINS.has(origin)
    ? origin
    : PRODUCTION_ORIGIN
  const redirectTo = `${redirectOrigin}/boards/${boardId}`

  const { data: existingMember } = await adminClient
    .from('board_members')
    .select('user_id')
    .eq('board_id', boardId)

  const { data: existingUserId, error: addError } = await userClient.rpc(
    'invite_member_by_email',
    { p_board_id: boardId, p_email: email },
  )

  if (!addError && existingUserId) {
    const wasAlreadyMember = (existingMember ?? []).some(
      (member) => member.user_id === existingUserId,
    )
    if (wasAlreadyMember) {
      return jsonResponse({ status: 'already_member' }, 200, headers)
    }

    const mailClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
    })
    const { error: emailError } = await mailClient.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo, shouldCreateUser: false },
    })
    if (emailError) {
      return jsonResponse(
        { status: 'added', warning: 'Member was added, but the email could not be sent.' },
        200,
        headers,
      )
    }

    return jsonResponse({ status: 'added_and_emailed' }, 200, headers)
  }

  if (addError && !addError.message.toLowerCase().includes('not found')) {
    return jsonResponse({ error: addError.message }, 400, headers)
  }

  const { data: invited, error: inviteError } = await adminClient.auth.admin
    .inviteUserByEmail(email, {
      redirectTo,
      data: { invited_to_board: boardId },
    })

  if (inviteError || !invited.user) {
    return jsonResponse(
      { error: inviteError?.message ?? 'Unable to send invitation' },
      400,
      headers,
    )
  }

  const { error: membershipError } = await adminClient
    .from('board_members')
    .upsert(
      { board_id: boardId, user_id: invited.user.id, role: 'member' },
      { onConflict: 'board_id,user_id' },
    )

  if (membershipError) {
    return jsonResponse({ error: 'Invitation sent, but board access could not be granted' }, 500, headers)
  }

  return jsonResponse({ status: 'invited' }, 200, headers)
})
