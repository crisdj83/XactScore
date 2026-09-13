import { NextResponse } from 'next/server'
import { authenticateMobileRequest } from '../../../../../../lib/mobile-auth'
import { createAdminClient } from '../../../../../../lib/supabase/admin'
import { getPLMatches } from '../../../../../../lib/football'
import { isMatchInContestSeason } from '../../../../../../lib/contest-season'
import { isPredictionLocked } from '../../../../../../lib/scoring'

type Body =
  | {
      matchId: string | number
      home: number
      away: number
    }
  | {
      predictions: Array<{ matchId: string | number; home: number; away: number }>
    }

function clampScore(value: unknown) {
  const n = Number(value)
  if (!Number.isInteger(n) || n < 0 || n > 5) return null
  return n
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateMobileRequest(request)
  if (!auth.ok) return auth.response

  const { id: contestId } = await context.params
  const { supabase, user } = auth

  const { data: membership, error: membershipError } = await supabase
    .from('contest_members')
    .select('user_id, contests(season_length)')
    .eq('contest_id', contestId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (membershipError || !membership) {
    return NextResponse.json({ error: 'You are not a member of this contest.' }, { status: 403 })
  }

  const contest = Array.isArray(membership.contests)
    ? membership.contests[0]
    : membership.contests

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const items =
    'predictions' in body && Array.isArray(body.predictions)
      ? body.predictions
      : 'matchId' in body
        ? [{ matchId: body.matchId, home: body.home, away: body.away }]
        : []

  if (items.length === 0) {
    return NextResponse.json({ error: 'No predictions provided.' }, { status: 400 })
  }

  let matchData: { matches?: Array<{ id: number | string; utcDate: string; matchday?: number }> }
  try {
    matchData = await getPLMatches()
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Could not verify fixtures. Try again.',
      },
      { status: 502 }
    )
  }

  const now = Date.now()
  const updatedAt = new Date().toISOString()
  const payloads: Array<{
    user_id: string
    contest_id: string
    match_id: string
    predicted_home_score: number
    predicted_away_score: number
    updated_at: string
  }> = []

  for (const item of items) {
    const home = clampScore(item.home)
    const away = clampScore(item.away)
    if (home === null || away === null) continue

    const match = (matchData.matches || []).find(
      (row) => String(row.id) === String(item.matchId)
    )
    if (!match) continue
    if (!isMatchInContestSeason(match, contest?.season_length)) continue
    if (!match.utcDate || isPredictionLocked(match.utcDate, now)) continue

    payloads.push({
      user_id: user.id,
      contest_id: contestId,
      match_id: String(item.matchId),
      predicted_home_score: home,
      predicted_away_score: away,
      updated_at: updatedAt,
    })
  }

  if (payloads.length === 0) {
    return NextResponse.json(
      { error: 'No unlocked matches left to save.' },
      { status: 400 }
    )
  }

  try {
    const admin = createAdminClient()
    const { error: upsertError } = await admin
      .from('predictions')
      .upsert(payloads, { onConflict: 'user_id,contest_id,match_id' })

    if (upsertError) {
      return NextResponse.json(
        { error: `Supabase Save Error: ${upsertError.message}` },
        { status: 500 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Could not save predictions.',
      },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, saved: payloads.length })
}
