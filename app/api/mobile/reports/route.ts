import { NextResponse } from 'next/server'
import { createAdminClient } from '../../../../lib/supabase/admin'
import { authenticateMobileRequest } from '../../../../lib/mobile-auth'

/** File a UGC report for App Store Guideline 1.2 safety. */
export async function POST(request: Request) {
  const auth = await authenticateMobileRequest(request)
  if (!auth.ok) return auth.response

  let body: {
    kind?: string
    targetId?: string
    targetUserId?: string
    reason?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const kind = String(body.kind || '')
  const targetId = String(body.targetId || '')
  const reason = String(body.reason || '').trim().slice(0, 500)
  if (!['message', 'reply', 'user'].includes(kind) || !targetId || reason.length < 3) {
    return NextResponse.json({ error: 'Report details are required.' }, { status: 400 })
  }

  const db = createAdminClient()
  const { error } = await db.from('content_reports').insert({
    reporter_id: auth.user.id,
    kind,
    target_id: targetId,
    target_user_id: body.targetUserId || null,
    reason,
  })

  if (error) {
    return NextResponse.json(
      {
        error:
          error.message.includes('content_reports') || error.code === '42P01'
            ? 'Reporting is not enabled on the server yet. Email support@xactscore.app.'
            : error.message,
      },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true })
}
