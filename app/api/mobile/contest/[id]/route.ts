import { NextResponse } from 'next/server'
import { authenticateMobileRequest } from '../../../../../lib/mobile-auth'
import { getPLMatches, getPLStandings } from '../../../../../lib/football'
import { isMatchInContestSeason } from '../../../../../lib/contest-season'
import {
  calculatePoints,
  getActiveMatchday,
  getOfficialScore,
  isPredictionLocked,
  isPredictionRevealable,
  resolveContestScoring,
} from '../../../../../lib/scoring'

type PLMatch = {
  id: number | string
  utcDate: string
  status?: string
  matchday?: number | null
  venue?: string
  stadium?: string
  homeTeam: {
    id?: number | string
    name: string
    shortName?: string
    tla?: string
    crest?: string
  }
  awayTeam: {
    id?: number | string
    name: string
    shortName?: string
    tla?: string
    crest?: string
  }
  score?: {
    fullTime?: { home?: number | null; away?: number | null }
    halfTime?: { home?: number | null; away?: number | null }
  }
}

type RpcPrediction = {
  user_id: string
  match_id: number | string
  predicted_home_score: number | null
  predicted_away_score: number | null
  points?: number | null
  is_exact?: boolean | null
  is_correct?: boolean | null
}

function mapMatch(match: PLMatch) {
  const official = getOfficialScore(match)
  return {
    id: String(match.id),
    utcDate: match.utcDate,
    status: match.status || 'SCHEDULED',
    matchday: Number(match.matchday) || 0,
    venue: match.venue || match.stadium || null,
    homeTeam: match.homeTeam.shortName || match.homeTeam.name,
    awayTeam: match.awayTeam.shortName || match.awayTeam.name,
    homeCrest: match.homeTeam.crest || null,
    awayCrest: match.awayTeam.crest || null,
    homeTla: match.homeTeam.tla || null,
    awayTla: match.awayTeam.tla || null,
    homeScore: official?.home ?? null,
    awayScore: official?.away ?? null,
    locked: isPredictionLocked(match.utcDate),
    revealable: isPredictionRevealable(match.utcDate),
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateMobileRequest(request)
  if (!auth.ok) return auth.response

  const { id: contestId } = await context.params
  const { supabase, user } = auth

  const { data: membership, error: membershipError } = await supabase
    .from('contest_members')
    .select(
      `
      role,
      contests (
        id,
        name,
        contest_key,
        season_length,
        is_open,
        is_public,
        points_exact,
        points_close,
        points_result
      )
    `
    )
    .eq('contest_id', contestId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (membershipError || !membership) {
    return NextResponse.json({ error: 'You do not have access to this contest.' }, { status: 403 })
  }

  const contestRaw = Array.isArray(membership.contests)
    ? membership.contests[0]
    : membership.contests

  if (!contestRaw) {
    return NextResponse.json({ error: 'Contest not found.' }, { status: 404 })
  }

  const scoring = resolveContestScoring(contestRaw)

  let plMatches: PLMatch[] = []
  let standingsRows: Array<{
    position: number
    team: string
    played: number
    won: number
    draw: number
    lost: number
    points: number
    crest?: string | null
  }> = []

  try {
    const [matchData, standingsData] = await Promise.all([
      getPLMatches(),
      getPLStandings().catch(() => null),
    ])
    plMatches = ((matchData.matches || []) as PLMatch[]).filter((match) =>
      isMatchInContestSeason(match, contestRaw.season_length)
    )

    const table = standingsData?.standings?.find(
      (block: { type?: string }) => block.type === 'TOTAL'
    )?.table
    if (Array.isArray(table)) {
      standingsRows = table.map(
        (row: {
          position?: number
          playedGames?: number
          won?: number
          draw?: number
          lost?: number
          points?: number
          team?: { name?: string; crest?: string }
        }) => ({
          position: Number(row.position) || 0,
          team: row.team?.name || '—',
          played: Number(row.playedGames) || 0,
          won: Number(row.won) || 0,
          draw: Number(row.draw) || 0,
          lost: Number(row.lost) || 0,
          points: Number(row.points) || 0,
          crest: row.team?.crest || null,
        })
      )
    }
  } catch (error) {
    console.error('mobile contest PL fetch failed', error)
  }

  const matchIds = plMatches.map((match) => Number(match.id)).filter((id) => Number.isFinite(id))
  const activeMatchday =
    getActiveMatchday(plMatches) ??
    (plMatches.length
      ? Math.max(...plMatches.map((m) => Number(m.matchday) || 0))
      : 1)

  const matchdays = Array.from(
    new Set(plMatches.map((match) => Number(match.matchday) || 0).filter((md) => md > 0))
  ).sort((a, b) => a - b)

  const [{ data: members }, { data: rpcPredictions }, { data: myPredictionRows }] =
    await Promise.all([
      supabase
        .from('contest_members')
        .select('user_id, role, users(username, email, quote, avatar_url)')
        .eq('contest_id', contestId),
      matchIds.length
        ? supabase.rpc('get_contest_predictions', {
            p_contest_id: contestId,
            p_match_ids: matchIds,
          })
        : Promise.resolve({ data: [] as RpcPrediction[] }),
      supabase
        .from('predictions')
        .select('match_id, predicted_home_score, predicted_away_score')
        .eq('contest_id', contestId)
        .eq('user_id', user.id),
    ])

  const memberList = (members || []).map((row) => {
    const profile = Array.isArray(row.users) ? row.users[0] : row.users
    return {
      userId: row.user_id as string,
      role: row.role as string,
      username: profile?.username ?? null,
      email: profile?.email ?? null,
      quote: profile?.quote ?? null,
      avatarUrl: profile?.avatar_url ?? null,
      displayName:
        profile?.username || profile?.email?.split('@')[0] || 'Unknown Player',
    }
  })

  const allPredictions = ((rpcPredictions || []) as RpcPrediction[]).map((row) => ({
    userId: row.user_id,
    matchId: String(row.match_id),
    home: row.predicted_home_score,
    away: row.predicted_away_score,
  }))

  const myPredictions: Record<string, { home: number; away: number }> = {}
  for (const row of myPredictionRows || []) {
    if (row.predicted_home_score == null || row.predicted_away_score == null) continue
    myPredictions[String(row.match_id)] = {
      home: Number(row.predicted_home_score),
      away: Number(row.predicted_away_score),
    }
  }

  const matchById = new Map(plMatches.map((match) => [String(match.id), match]))
  const playedStatuses = new Set(['FINISHED', 'IN_PLAY', 'PAUSED'])

  const ranking = memberList
    .map((member) => {
      let totalPoints = 0
      let exact = 0
      let close = 0
      let result = 0
      let played = 0

      for (const prediction of allPredictions) {
        if (prediction.userId !== member.userId) continue
        if (prediction.home == null || prediction.away == null) continue
        const match = matchById.get(prediction.matchId)
        if (!match || !playedStatuses.has(match.status || '')) continue
        const score = getOfficialScore(match)
        if (!score) continue
        played += 1
        const outcome = calculatePoints(
          prediction.home,
          prediction.away,
          score.home,
          score.away,
          scoring
        )
        totalPoints += outcome.points
        if (outcome.is_exact) exact += 1
        else if (outcome.is_close) close += 1
        else if (outcome.is_correct) result += 1
      }

      return {
        userId: member.userId,
        displayName: member.displayName,
        avatarUrl: member.avatarUrl,
        quote: member.quote,
        totalPoints,
        exact,
        close,
        result,
        played,
      }
    })
    .sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints
      if (b.exact !== a.exact) return b.exact - a.exact
      if (b.close !== a.close) return b.close - a.close
      return a.displayName.localeCompare(b.displayName)
    })
    .map((row, index) => ({ ...row, rank: index + 1 }))

  return NextResponse.json({
    contest: {
      id: contestRaw.id,
      name: contestRaw.name,
      contestKey: contestRaw.contest_key,
      seasonLength: contestRaw.season_length,
      isOpen: contestRaw.is_open !== false,
      isPublic: contestRaw.is_public === true,
      scoring,
    },
    role: membership.role,
    userId: user.id,
    activeMatchday,
    matchdays,
    matches: plMatches.map(mapMatch),
    myPredictions,
    predictions: allPredictions,
    members: memberList,
    ranking,
    standings: standingsRows,
  })
}
