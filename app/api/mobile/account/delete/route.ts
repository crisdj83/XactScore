import { NextResponse } from 'next/server'
import { createAdminClient } from '../../../../../lib/supabase/admin'
import { authenticateMobileRequest } from '../../../../../lib/mobile-auth'

/**
 * Permanently delete the signed-in account (Guideline 5.1.1(v)).
 * Removes contests the user solely administers, then deletes the Auth user
 * (public.users and related rows cascade).
 */
export async function POST(request: Request) {
  const auth = await authenticateMobileRequest(request)
  if (!auth.ok) return auth.response

  const userId = auth.user.id
  const db = createAdminClient()

  // Contests.admin_id does not cascade — remove leagues this user owns first.
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
      return NextResponse.json({ error: deleteContestsError.message }, { status: 500 })
    }
  }

  // Best-effort cleanup of content reports filed by/about the user.
  try {
    await db.from('content_reports').delete().or(`reporter_id.eq.${userId},target_user_id.eq.${userId}`)
  } catch {
    // table may not exist yet
  }

  const { error: authDeleteError } = await db.auth.admin.deleteUser(userId)
  if (authDeleteError) {
    return NextResponse.json({ error: authDeleteError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
