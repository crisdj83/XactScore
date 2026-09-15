import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Crosshair, Activity, CheckCircle2, X, Trophy } from 'lucide-react'
import { createClient } from '../../../../../lib/supabase/server'
import { getTranslations } from '../../../../../lib/i18n'
import { getServerLocale } from '../../../../../lib/i18n-server'
import { getPLMatches } from '../../../../../lib/football'
import { isMatchInContestSeason, normalizeSeasonLength } from '../../../../../lib/contest-season'
import {
  calculatePoints,
  getOfficialScore,
  resolveContestScoring,
  type ContestScoring,
} from '../../../../../lib/scoring'
import { findFavoriteTeam } from '../../../../../lib/favorite-teams'
import { isUnoptimizedAvatar } from '../../../../../lib/soccer-avatar'
import {
  outcomeKindFromPoints,
  vibeFromOutcomes,
  type PredictionOutcomeKind,
} from '../../../../../lib/prediction-vibe'
import { PageHeader } from '@/components/ui/page-header'
import { cn } from '@/lib/utils'

type Match = {
  id: number | string
  matchday?: number
  utcDate: string
  status?: string
  homeTeam: { name: string; shortName?: string; crest?: string }
  awayTeam: { name: string; shortName?: string; crest?: string }
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

function pointsForPrediction(
  prediction: {
    predicted_home_score: number
    predicted_away_score: number
  },
  match: Match | undefined,
  scoring: ContestScoring
) {
  if (!match) return null
  const score = getOfficialScore(match)
  if (!score) return null
  return calculatePoints(
    prediction.predicted_home_score,
    prediction.predicted_away_score,
    score.home,
    score.away,
    scoring
  )
}

function ranksAfterFinishedMatches(
  memberIds: string[],
  finished: Match[],
  predictions: RpcPrediction[],
  matchById: Map<string, Match>,
  scoring: ContestScoring
) {
  const totals = new Map(memberIds.map((id) => [id, { points: 0, exact: 0, close: 0, scored: 0, correct: 0 }]))
  for (const match of finished) {
    for (const prediction of predictions) {
      if (String(prediction.match_id) !== String(match.id)) continue
      const result = pointsForPrediction(
        {
          predicted_home_score: prediction.predicted_home_score ?? 0,
          predicted_away_score: prediction.predicted_away_score ?? 0,
        },
        match,
        scoring
      )
      if (!result) continue
      const row = totals.get(prediction.user_id)
      if (!row) continue
      row.points += result.points
      row.scored += 1
      if (result.points > 0) row.correct += 1
      if (result.is_exact) row.exact += 1
      if (result.is_close) row.close += 1
    }
  }
  const ranked = memberIds
    .map((id) => {
      const row = totals.get(id)!
      return {
        id,
        ...row,
        accuracy: row.scored ? row.correct / row.scored : 0,
      }
    })
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.exact - a.exact ||
        b.close - a.close ||
        b.accuracy - a.accuracy ||
        a.id.localeCompare(b.id)
    )
  const ranks = new Map<string, number>()
  ranked.forEach((player) => {
    const firstEqual = ranked.findIndex(
      (item) =>
        item.points === player.points &&
        item.exact === player.exact &&
        item.close === player.close &&
        item.accuracy === player.accuracy
    )
    ranks.set(player.id, firstEqual + 1)
  })
  return ranks
}

function OutcomeIcon({ outcome }: { outcome: PredictionOutcomeKind }) {
  if (outcome === 'exact') return <Crosshair className="h-4 w-4 text-xactscore-accent" aria-hidden />
  if (outcome === 'close') return <Activity className="h-4 w-4 text-sky-500" aria-hidden />
  if (outcome === 'result') return <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden />
  return <X className="h-4 w-4 text-red-500" aria-hidden />
}

export default async function ContestMemberProfilePage(props: {
  params: Promise<{ id: string; userId: string }>
}) {
  const params = await props.params
  const t = getTranslations(getServerLocale())
  const supabase = await createClient()

  const { data: contest, error: contestError } = await supabase
    .from('contests')
    .select('id, name, season_length, points_exact, points_close, points_result')
    .eq('id', params.id)
    .single()

  if (contestError || !contest) notFound()

  const { data: membership } = await supabase
    .from('contest_members')
    .select('user_id')
    .eq('contest_id', params.id)
    .eq('user_id', params.userId)
    .maybeSingle()

  if (!membership) notFound()

  const { data: profile } = await supabase
    .from('users')
    .select('id, username, email, avatar_url, favorite_team, quote')
    .eq('id', params.userId)
    .single()

  if (!profile) notFound()

  const { data: membersRaw } = await supabase
    .from('contest_members')
    .select('user_id')
    .eq('contest_id', params.id)

  const memberIds = (membersRaw || []).map((row) => String(row.user_id))
  const scoring = resolveContestScoring(contest)
  const seasonLength = normalizeSeasonLength(contest.season_length)

  let matches: Match[] = []
  try {
    const data = await getPLMatches()
    matches = ((data.matches || []) as Match[]).filter((match) =>
      isMatchInContestSeason(match, seasonLength)
    )
  } catch {
    matches = []
  }

  const allowedMatchIds = matches.map((match) => match.id)
  const { data: rawPredictions } = allowedMatchIds.length
    ? await supabase.rpc('get_contest_predictions', {
        p_contest_id: params.id,
        p_match_ids: allowedMatchIds.map((id) => Number(id)),
      })
    : { data: [] }

  const predictions = (rawPredictions || []) as RpcPrediction[]
  const matchById = new Map(matches.map((match) => [String(match.id), match]))

  const finishedMatches = matches
    .filter((match) => match.status === 'FINISHED')
    .sort(
      (a, b) =>
        new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime() ||
        String(a.id).localeCompare(String(b.id))
    )

  const playedMatchdays = Array.from(
    new Set(finishedMatches.map((match) => Number(match.matchday)))
  ).sort((a, b) => a - b)

  let bestRank: number | null = null
  for (let i = 0; i < playedMatchdays.length; i += 1) {
    const throughMatchday = playedMatchdays[i]
    const slice = finishedMatches.filter((match) => Number(match.matchday) <= throughMatchday)
    const ranks = ranksAfterFinishedMatches(memberIds, slice, predictions, matchById, scoring)
    const rank = ranks.get(params.userId)
    if (rank != null) bestRank = bestRank == null ? rank : Math.min(bestRank, rank)
  }

  const currentRanks = ranksAfterFinishedMatches(
    memberIds,
    finishedMatches,
    predictions,
    matchById,
    scoring
  )
  const currentRank = currentRanks.get(params.userId) ?? null

  const userPredictions = predictions
    .filter((prediction) => prediction.user_id === params.userId)
    .map((prediction) => {
      const match = matchById.get(String(prediction.match_id))
      const result = pointsForPrediction(
        {
          predicted_home_score: prediction.predicted_home_score ?? 0,
          predicted_away_score: prediction.predicted_away_score ?? 0,
        },
        match,
        scoring
      )
      return { prediction, match, result }
    })
    .filter(
      (item) =>
        item.match &&
        ['FINISHED', 'IN_PLAY', 'PAUSED'].includes(item.match.status || '') &&
        item.result
    )
    .sort(
      (a, b) =>
        new Date(b.match!.utcDate).getTime() - new Date(a.match!.utcDate).getTime() ||
        String(b.match!.id).localeCompare(String(a.match!.id))
    )

  const lastThree = userPredictions.slice(0, 3)
  const outcomes = lastThree
    .map((item) => outcomeKindFromPoints(item.result?.points ?? null, scoring))
    .filter((value): value is PredictionOutcomeKind => Boolean(value))
  const vibe = vibeFromOutcomes(outcomes)

  const totalPoints = userPredictions.reduce((sum, item) => sum + (item.result?.points || 0), 0)
  const displayName =
    profile.username || profile.email?.split('@')[0] || t('Unknown Player')
  const favorite = findFavoriteTeam(profile.favorite_team)

  const vibeStyles =
    vibe.tone === 'praise'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100'
      : vibe.tone === 'roast'
        ? 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100'
        : vibe.tone === 'empty'
          ? 'border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200'
          : 'border-amber-200 bg-amber-50 text-amber-950 dark:border-xactscore-accent/30 dark:bg-xactscore-accent/10 dark:text-xactscore-accent'

  return (
    <div className="space-y-5 p-0 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/contests/${params.id}/ranking`}
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-xactscore-accent"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          {t('Back to table')}
        </Link>
      </div>

      <PageHeader title={displayName} description={profile.quote ? `"${profile.quote}"` : contest.name} />

      <section className="content-panel p-4 sm:p-6">
        <div className="flex items-center gap-4">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt=""
              width={72}
              height={72}
              className="h-16 w-16 shrink-0 rounded-full object-cover sm:h-[4.5rem] sm:w-[4.5rem]"
              unoptimized={isUnoptimizedAvatar(profile.avatar_url)}
            />
          ) : (
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-xactscore-accent/20 text-2xl font-black text-xactscore-accent sm:h-[4.5rem] sm:w-[4.5rem]">
              {displayName.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-black text-slate-900 dark:text-zinc-100">{displayName}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {favorite ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200">
                  <Image
                    src={favorite.crest}
                    alt=""
                    width={16}
                    height={16}
                    className="h-4 w-4 object-contain"
                    unoptimized
                  />
                  {favorite.name}
                </span>
              ) : (
                <span className="text-xs font-semibold text-xactscore-muted">{t('No favorite team')}</span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-3 text-center dark:border-white/10 dark:bg-black/20">
            <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500">{t('Best rank')}</p>
            <p className="mt-1 inline-flex items-center justify-center gap-1 text-lg font-black tabular-nums text-xactscore-accent">
              <Trophy className="h-4 w-4" aria-hidden />
              {bestRank != null ? bestRank : '—'}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-3 text-center dark:border-white/10 dark:bg-black/20">
            <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500">{t('Current rank')}</p>
            <p className="mt-1 text-lg font-black tabular-nums text-slate-900 dark:text-zinc-100">
              {currentRank != null ? currentRank : '—'}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-3 text-center dark:border-white/10 dark:bg-black/20">
            <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500">{t('Total Points')}</p>
            <p className="mt-1 text-lg font-black tabular-nums text-slate-900 dark:text-zinc-100">
              {totalPoints.toFixed(1).replace('.0', '')}
            </p>
          </div>
        </div>
      </section>

      <section className={cn('rounded-2xl border px-4 py-4 sm:px-5', vibeStyles)}>
        <p className="text-[10px] font-black uppercase tracking-wider opacity-70">{t('Scout report')}</p>
        <p className="mt-1.5 text-base font-bold leading-snug sm:text-lg">
          <span className="mr-1.5" aria-hidden>
            {vibe.emoji}
          </span>
          {t(vibe.message)}
        </p>
        <p className="mt-2 text-xs font-semibold opacity-70">{t('Based on last 3 scored predictions')}</p>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-black uppercase tracking-wider text-zinc-500">{t('Last 3 predictions')}</h3>
        {lastThree.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-xactscore-muted dark:border-white/10 dark:bg-white/5">
            {t('No scored predictions yet.')}
          </p>
        ) : (
          <ul className="space-y-2">
            {lastThree.map(({ prediction, match, result }) => {
              const outcome = outcomeKindFromPoints(result?.points ?? null, scoring) || 'zero'
              const official = match ? getOfficialScore(match) : null
              return (
                <li
                  key={`${prediction.match_id}`}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 dark:border-white/10 dark:bg-white/5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-zinc-100">
                      {match?.homeTeam.shortName || match?.homeTeam.name} vs{' '}
                      {match?.awayTeam.shortName || match?.awayTeam.name}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-zinc-500">
                      {t('Pick')}: {prediction.predicted_home_score ?? '—'} :{' '}
                      {prediction.predicted_away_score ?? '—'}
                      {official ? (
                        <>
                          {' · '}
                          {t('Final')}: {official.home} : {official.away}
                        </>
                      ) : null}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold',
                      outcome === 'exact' &&
                        'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-xactscore-accent',
                      outcome === 'close' &&
                        'border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300',
                      outcome === 'result' &&
                        'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
                      outcome === 'zero' &&
                        'border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300'
                    )}
                  >
                    <OutcomeIcon outcome={outcome} />
                    {result?.points == null ? '—' : `+${result.points}`}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
