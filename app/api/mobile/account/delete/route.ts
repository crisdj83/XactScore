import { NextResponse } from 'next/server'
import { createAdminClient } from '../../../../../lib/supabase/admin'
import { authenticateMobileRequest } from '../../../../../lib/mobile-auth'

/**
 * Permanently delete the signed-in account (Guideline 5.1.1(v)).
 * Cleans non-cascading refs, removes public.users, then Auth user.
 */
export async function POST(request: Request) {
  const auth = await authenticateMobileRequest(request)
  if (!auth.ok) return auth.response

  const userId = auth.user.id
  const db = createAdminClient()

  // Contests the user administers (admin_id historically had no ON DELETE CASCADE).
  const { data: owned, error: ownedError } = await db
    .from('contests')
    .select('id')
    .eq('admin_id', userId)

  if (ownedError) {
    return NextResponse.json({ error: ownedError.message }, { status: 500 })
  }

  const ownedIds = (owned || []).map((row) => row.id as string)
  if (ownedIds.length) {
    const { error: deleteContestsError } = await db.from('contests').delete().in('id', ownedIds)
    if (deleteContestsError) {
      return NextResponse.json(
        { error: `Could not remove administered leagues: ${deleteContestsError.message}` },
        { status: 500 },
      )
    }
  }

  // Best-effort optional tables (ignore if missing).
  for (const table of [
    'content_reports',
    'push_subscriptions',
    'match_reminders',
    'message_reads',
    'news_reads',
    'suggestions',
  ] as const) {
    try {
      if (table === 'content_reports') {
        await db.from(table).delete().or(`reporter_id.eq.${userId},target_user_id.eq.${userId}`)
      } else {
        await db.from(table).delete().eq('user_id', userId)
      }
    } catch {
      // table may not exist
    }
  }

  // Remove profile row first so leftover FKs surface before Auth delete.
  const { error: profileDeleteError } = await db.from('users').delete().eq('id', userId)
  if (profileDeleteError) {
    return NextResponse.json(
      {
        error: `Could not remove profile data: ${profileDeleteError.message}. If this mentions contests/admin_id, run supabase/fix_contests_admin_cascade.sql.`,
      },
      { status: 500 },
    )
  }

  const { error: authDeleteError } = await db.auth.admin.deleteUser(userId)
  if (authDeleteError) {
    return NextResponse.json({ error: authDeleteError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
