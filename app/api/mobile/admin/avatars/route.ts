import { NextResponse } from 'next/server'
import { createAdminClient } from '../../../../../lib/supabase/admin'
import { authenticateMobileRequest } from '../../../../../lib/mobile-auth'

async function requireGlobalAdmin(userId: string) {
  const { data } = await createAdminClient()
    .from('users')
    .select('is_global_admin')
    .eq('id', userId)
    .maybeSingle()
  return data?.is_global_admin === true
}

/** List users with pending avatars (global admin only). */
export async function GET(request: Request) {
  const auth = await authenticateMobileRequest(request)
  if (!auth.ok) return auth.response

  if (!(await requireGlobalAdmin(auth.user.id))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { data, error } = await createAdminClient()
    .from('users')
    .select('id, username, email, pending_avatar_url, avatar_url')
    .not('pending_avatar_url', 'is', null)
    .order('username', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    pending: (data || []).map((row) => ({
      id: row.id,
      username: row.username,
      email: row.email,
      pendingAvatarUrl: row.pending_avatar_url as string,
      avatarUrl: row.avatar_url,
    })),
  })
}

/** Approve or reject a pending avatar (global admin only). */
export async function POST(request: Request) {
  const auth = await authenticateMobileRequest(request)
  if (!auth.ok) return auth.response

  if (!(await requireGlobalAdmin(auth.user.id))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  let body: { action?: string; userId?: string; pendingUrl?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const action = body.action
  const userId = String(body.userId || '')
  if (!userId || (action !== 'approve' && action !== 'reject')) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const db = createAdminClient()

  if (action === 'approve') {
    const pendingUrl = String(body.pendingUrl || '')
    if (!pendingUrl) {
      return NextResponse.json({ error: 'Pending URL required' }, { status: 400 })
    }
    const { error } = await db
      .from('users')
      .update({ avatar_url: pendingUrl, pending_avatar_url: null })
      .eq('id', userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, message: 'Avatar approved' })
  }

  const { error } = await db.from('users').update({ pending_avatar_url: null }).eq('id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, message: 'Avatar rejected' })
}
