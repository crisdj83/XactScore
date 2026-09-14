import { NextResponse } from 'next/server'
import { createAdminClient } from '../../../../lib/supabase/admin'
import { authenticateMobileRequest } from '../../../../lib/mobile-auth'
import { notifyContestMembers } from '../../../../lib/notify-contest'

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

type UserEmbed = { username?: string | null; email?: string | null } | null
type ContestEmbed = { name?: string | null } | null

/** Load contest messages + replies for the signed-in member. */
export async function GET(request: Request) {
  const auth = await authenticateMobileRequest(request)
  if (!auth.ok) return auth.response

  const db = createAdminClient()
  const [{ data: memberships }, { data: profile }] = await Promise.all([
    auth.supabase
      .from('contest_members')
      .select('contest_id, role, contests(name)')
      .eq('user_id', auth.user.id),
    auth.supabase.from('users').select('is_global_admin').eq('id', auth.user.id).maybeSingle(),
  ])

  const contests = (memberships || []).map((row) => {
    const contest = firstRelation(row.contests as ContestEmbed | ContestEmbed[])
    return {
      id: row.contest_id as string,
      name: contest?.name || 'Contest',
      role: row.role as string,
    }
  })
  const contestIds = contests.map((c) => c.id)
  const isGlobalAdmin = profile?.is_global_admin === true

  if (contestIds.length === 0) {
    return NextResponse.json({ contests: [], messages: [], isGlobalAdmin })
  }

  const { data: messageData, error: messageError } = await db
    .from('messages')
    .select('id, contest_id, author_id, title, body, created_at, users(username, email), contests(name)')
    .in('contest_id', contestIds)
    .order('created_at', { ascending: false })
    .limit(60)

  if (messageError) {
    return NextResponse.json({ error: messageError.message }, { status: 500 })
  }

  const messages = (messageData || []).map((row) => {
    const user = firstRelation(row.users as UserEmbed | UserEmbed[])
    const contest = firstRelation(row.contests as ContestEmbed | ContestEmbed[])
    return {
      id: row.id as string,
      contestId: row.contest_id as string,
      authorId: row.author_id as string,
      title: row.title as string,
      body: row.body as string,
      createdAt: row.created_at as string,
      authorName: user?.username || user?.email || 'Member',
      contestName: contest?.name || 'League',
    }
  })

  const messageIds = messages.map((m) => m.id)
  const { data: replyData } = messageIds.length
    ? await db
        .from('message_replies')
        .select('id, message_id, author_id, body, created_at, users(username, email)')
        .in('message_id', messageIds)
        .order('created_at', { ascending: true })
    : { data: [] as never[] }

  const replies = (replyData || []).map((row) => {
    const user = firstRelation(row.users as UserEmbed | UserEmbed[])
    return {
      id: row.id as string,
      messageId: row.message_id as string,
      authorId: row.author_id as string,
      body: row.body as string,
      createdAt: row.created_at as string,
      authorName: user?.username || user?.email || 'Member',
    }
  })

  const repliesByMessage = new Map<string, typeof replies>()
  for (const reply of replies) {
    const list = repliesByMessage.get(reply.messageId) || []
    list.push(reply)
    repliesByMessage.set(reply.messageId, list)
  }

  try {
    await db.from('message_reads').upsert({
      user_id: auth.user.id,
      last_read_at: new Date().toISOString(),
    })
  } catch {
    // message_reads may be missing in older DBs
  }

  return NextResponse.json({
    contests,
    isGlobalAdmin,
    messages: messages.map((message) => ({
      ...message,
      replies: repliesByMessage.get(message.id) || [],
    })),
  })
}

/** Create a message or reply. */
export async function POST(request: Request) {
  const auth = await authenticateMobileRequest(request)
  if (!auth.ok) return auth.response

  let body: {
    kind?: string
    contestId?: string
    messageId?: string
    title?: string
    body?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const db = createAdminClient()
  const kind = body.kind

  if (kind === 'message') {
    const contestId = String(body.contestId || '')
    const title = String(body.title || '').trim()
    const text = String(body.body || '').trim()
    if (!contestId || !title || !text) {
      return NextResponse.json({ error: 'Message title and text are required.' }, { status: 400 })
    }
    if (title.length > 120 || text.length > 5000) {
      return NextResponse.json({ error: 'Message is too long.' }, { status: 400 })
    }

    const { data: membership } = await db
      .from('contest_members')
      .select('role')
      .eq('contest_id', contestId)
      .eq('user_id', auth.user.id)
      .maybeSingle()
    if (!membership) {
      return NextResponse.json({ error: 'You can only post in contests you belong to.' }, { status: 403 })
    }

    const { error } = await db.from('messages').insert({
      contest_id: contestId,
      author_id: auth.user.id,
      title,
      body: text,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    try {
      await notifyContestMembers({
        contestId,
        authorId: auth.user.id,
        title,
        body: text,
        kind: 'message',
      })
    } catch {
      // push is best-effort
    }

    return NextResponse.json({ ok: true })
  }

  if (kind === 'reply') {
    const messageId = String(body.messageId || '')
    const text = String(body.body || '').trim()
    if (!messageId || !text) {
      return NextResponse.json({ error: 'Reply text is required.' }, { status: 400 })
    }
    if (text.length > 5000) {
      return NextResponse.json({ error: 'Reply is too long.' }, { status: 400 })
    }

    const { data: message } = await db
      .from('messages')
      .select('contest_id')
      .eq('id', messageId)
      .maybeSingle()
    if (!message) {
      return NextResponse.json({ error: 'Message not found.' }, { status: 404 })
    }

    const { data: membership } = await db
      .from('contest_members')
      .select('role')
      .eq('contest_id', message.contest_id)
      .eq('user_id', auth.user.id)
      .maybeSingle()
    if (!membership) {
      return NextResponse.json({ error: 'You can only reply in contests you belong to.' }, { status: 403 })
    }

    const { error } = await db.from('message_replies').insert({
      message_id: messageId,
      author_id: auth.user.id,
      body: text,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    try {
      await notifyContestMembers({
        contestId: message.contest_id,
        authorId: auth.user.id,
        title: 'Reply',
        body: text,
        kind: 'reply',
      })
    } catch {
      // push is best-effort
    }

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

/** Delete a message or reply (author, contest admin, or global admin). */
export async function DELETE(request: Request) {
  const auth = await authenticateMobileRequest(request)
  if (!auth.ok) return auth.response

  let body: { kind?: string; id?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const id = String(body.id || '')
  const kind = body.kind
  if (!id || (kind !== 'message' && kind !== 'reply')) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const db = createAdminClient()
  const { data: profile } = await auth.supabase
    .from('users')
    .select('is_global_admin')
    .eq('id', auth.user.id)
    .maybeSingle()
  const isGlobalAdmin = profile?.is_global_admin === true

  if (kind === 'message') {
    const { data: message } = await db
      .from('messages')
      .select('contest_id, author_id')
      .eq('id', id)
      .maybeSingle()
    if (!message) return NextResponse.json({ error: 'Message not found.' }, { status: 404 })

    const { data: membership } = await db
      .from('contest_members')
      .select('role')
      .eq('contest_id', message.contest_id)
      .eq('user_id', auth.user.id)
      .maybeSingle()
    const canDelete =
      isGlobalAdmin ||
      membership?.role === 'admin' ||
      message.author_id === auth.user.id
    if (!membership || !canDelete) {
      return NextResponse.json({ error: 'Not allowed to delete this message.' }, { status: 403 })
    }

    const { error } = await db.from('messages').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  const { data: reply } = await db
    .from('message_replies')
    .select('message_id, author_id')
    .eq('id', id)
    .maybeSingle()
  if (!reply) return NextResponse.json({ error: 'Reply not found.' }, { status: 404 })

  const { data: message } = await db
    .from('messages')
    .select('contest_id')
    .eq('id', reply.message_id)
    .maybeSingle()
  if (!message) return NextResponse.json({ error: 'Message not found.' }, { status: 404 })

  const { data: membership } = await db
    .from('contest_members')
    .select('role')
    .eq('contest_id', message.contest_id)
    .eq('user_id', auth.user.id)
    .maybeSingle()
  const canDelete =
    isGlobalAdmin || membership?.role === 'admin' || reply.author_id === auth.user.id
  if (!membership || !canDelete) {
    return NextResponse.json({ error: 'Not allowed to delete this reply.' }, { status: 403 })
  }

  const { error } = await db.from('message_replies').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
