import { createClient } from '../lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import HeroBanner from './components/HeroBanner'
import MarketingLanding from './components/MarketingLanding'
import HomeWeekList, { type LeagueWeek } from './components/HomeWeekList'
import { getPLMatches } from '../lib/football'
import { getMatchVenues } from '../lib/goal-api'
import { getTranslations } from '../lib/i18n'
import { getServerLocale } from '../lib/i18n-server'
import { findFavoriteTeam } from '../lib/favorite-teams'
import { isMatchInContestSeason } from '../lib/contest-season'
import { getActiveMatchday, isOpenForPrediction } from '../lib/scoring'

type PLMatch = {
  id: number | string
  utcDate: string
  status?: string
  matchday?: number | null
  venue?: string
  stadium?: string
  homeTeam: { name: string; shortName?: string; crest?: string }
  awayTeam: { name: string; shortName?: string; crest?: string }
  score?: {
    fullTime?: { home?: number | null; away?: number | null }
    halfTime?: { home?: number | null; away?: number | null }
  }
}

async function fetchPLData() {
  try {
    const data = await getPLMatches()
    const matches = ((data.matches || []) as PLMatch[])

    const recentMatchesRaw = matches
      .filter((m) => ['FINISHED', 'IN_PLAY', 'PAUSED'].includes(m.status || ''))
      .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())
      .slice(0, 5)

    const recentScores = recentMatchesRaw.map((m) => ({
      id: m.id,
      homeTeam: m.homeTeam.shortName || m.homeTeam.name,
      awayTeam: m.awayTeam.shortName || m.awayTeam.name,
      homeCrest: m.homeTeam.crest,
      awayCrest: m.awayTeam.crest,
      homeScore: m.score?.fullTime?.home ?? m.score?.halfTime?.home ?? 0,
      awayScore: m.score?.fullTime?.away ?? m.score?.halfTime?.away ?? 0,
      status: m.status === 'FINISHED' ? 'FT' : 'LIVE',
    }))

    const now = Date.now()
    const nextMatchRaw = matches
      .filter((m) => ['SCHEDULED', 'TIMED'].includes(m.status || ''))
      .filter((m) => new Date(m.utcDate).getTime() > now)
      .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())[0]

    let nextMatch = null
    if (nextMatchRaw) {
      const venues = await getMatchVenues([nextMatchRaw])
      nextMatch = {
        date: nextMatchRaw.utcDate,
        homeTeam: nextMatchRaw.homeTeam.shortName || nextMatchRaw.homeTeam.name,
        awayTeam: nextMatchRaw.awayTeam.shortName || nextMatchRaw.awayTeam.name,
        homeCrest: nextMatchRaw.homeTeam.crest,
        awayCrest: nextMatchRaw.awayTeam.crest,
        venue: venues.get(String(nextMatchRaw.id)) || nextMatchRaw.venue || nextMatchRaw.stadium || null,
      }
    }

    return { matches, recentScores, nextMatch }
  } catch (error) {
    console.error('API Fetch Error:', error)
    return { matches: [] as PLMatch[], recentScores: [], nextMatch: null }
  }
}

export default async function Home(props: { searchParams: Promise<{ success?: string }> }) {
  const searchParams = await props.searchParams
  const locale = getServerLocale()
  const t = getTranslations(locale)
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const { recentScores, nextMatch } = await fetchPLData()
    return <MarketingLanding locale={locale} nextMatch={nextMatch} recentScores={recentScores} />
  }

  const [{ data: profile }, { data: myContests }, plData] = await Promise.all([
    supabase.from('users').select('username, email, avatar_url, favorite_team, is_global_admin').eq('id', user.id).maybeSingle(),
    supabase.from('contest_members').select(`
      contest_id,
      role,
      contests (
        name,
        contest_key,
        season_length,
        created_at
      )
    `).eq('user_id', user.id),
    fetchPLData(),
  ])
  const { matches, recentScores, nextMatch } = plData
  const contestIds = (myContests || []).map((membership) => membership.contest_id)
  const { data: contestPredictions } = contestIds.length
    ? await supabase
        .from('predictions')
        .select('contest_id, user_id, points, match_id, predicted_home_score')
        .in('contest_id', contestIds)
    : { data: [] }

  const now = Date.now()
  const leagues: LeagueWeek[] = (myContests || []).map((membership) => {
    const contest = membership.contests as {
      name?: string
      season_length?: string
      created_at?: string
    } | null
    const members = new Map<string, number>()
    ;(contestPredictions || [])
      .filter((prediction) => prediction.contest_id === membership.contest_id)
      .forEach((prediction) =>
        members.set(prediction.user_id, (members.get(prediction.user_id) || 0) + (Number(prediction.points) || 0))
      )
    const sortedScores = Array.from(members.entries()).sort((a, b) => b[1] - a[1])
    const rank = sortedScores.findIndex(([userId]) => userId === user.id) + 1
    const predicted = new Set(
      (contestPredictions || [])
        .filter(
          (prediction) =>
            prediction.contest_id === membership.contest_id &&
            prediction.user_id === user.id &&
            prediction.predicted_home_score !== null &&
            prediction.predicted_home_score !== undefined
        )
        .map((prediction) => String(prediction.match_id))
    )
    const seasonMatches = matches.filter((match) => isMatchInContestSeason(match, contest?.season_length))
    const matchday = getActiveMatchday(seasonMatches, now)
    const openPicks =
      matchday == null
        ? 0
        : seasonMatches.filter(
            (match) =>
              Number(match.matchday) === matchday &&
              isOpenForPrediction(match, now) &&
              !predicted.has(String(match.id))
          ).length

    return {
      contestId: membership.contest_id,
      name: contest?.name || t('Contests'),
      openPicks,
      rank: rank || null,
    }
  })

  const bestRanking = leagues.reduce<{ rank: number } | null>((best, league) => {
    if (!league.rank) return best
    return !best || league.rank < best.rank ? { rank: league.rank } : best
  }, null)

  const firstOpen = leagues.find((league) => league.openPicks > 0)
  const predictHref = firstOpen
    ? `/contests/${firstOpen.contestId}/predictions`
    : leagues[0]
      ? `/contests/${leagues[0].contestId}/predictions`
      : '/contests'

  const selectedTeamData = findFavoriteTeam(profile?.favorite_team)

  return (
    <div className="space-y-3 pb-4 sm:space-y-6 sm:pb-8">
      {searchParams?.success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 dark:border-xactscore-accent/50 dark:bg-xactscore-accent/15 dark:text-xactscore-accent">
          {t(searchParams.success)}
        </div>
      )}

      <HomeWeekList locale={locale} leagues={leagues} />

      <HeroBanner nextMatch={nextMatch} recentScores={recentScores} predictHref={predictHref} />

      <div className="flex items-center gap-2.5 rounded-[28px] border border-slate-200 bg-white px-3 py-2.5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:rounded-xl dark:border-zinc-800 dark:bg-gradient-to-br dark:from-black dark:via-[#0a0a0a] dark:to-black dark:shadow-lg dark:shadow-black/30 sm:gap-4 sm:px-5 sm:py-4">
        {profile?.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt=""
            width={48}
            height={48}
            className="h-10 w-10 shrink-0 rounded-full border border-slate-200 bg-white object-cover dark:border-zinc-700 dark:bg-zinc-800 sm:h-12 sm:w-12"
            unoptimized
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-xactscore-accent text-sm font-bold text-xactscore-bg sm:h-12 sm:w-12 sm:text-lg">
            {profile?.username ? profile.username.charAt(0).toUpperCase() : profile?.email?.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden sm:gap-3">
          <p className="min-w-0 max-w-[7.5rem] truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100 sm:max-w-none sm:text-base">
            {profile?.username || t('No username set')}
          </p>
          {profile?.is_global_admin && (
            <span title="Global Admin" className="flex shrink-0 items-center">
              <ShieldCheck className="h-3.5 w-3.5 text-xactscore-accent" />
            </span>
          )}
          <span className="hidden h-3 w-px shrink-0 bg-white/20 sm:block" aria-hidden />
          <span
            className="inline-flex min-w-0 items-center gap-1 text-sm font-medium text-zinc-500 dark:text-zinc-200"
            title={t('Favorite Team:')}
          >
            {selectedTeamData ? (
              <Image
                src={selectedTeamData.crest}
                alt=""
                width={16}
                height={16}
                className="h-4 w-4 shrink-0 object-contain"
              />
            ) : null}
            <span className="truncate font-semibold">
              {profile?.favorite_team || t('Not selected')}
            </span>
          </span>
          <span className="h-3 w-px shrink-0 bg-white/20" aria-hidden />
          <span className="shrink-0 text-sm text-zinc-500 dark:text-zinc-300" title={t('Best league ranking:')}>
            <span className="font-medium text-zinc-500 dark:text-zinc-400">{t('Best rank')}</span>
            {' '}
            <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
              {bestRanking ? `#${bestRanking.rank}` : '—'}
            </span>
          </span>
        </div>
        <Link
          href="/profile"
          className="shrink-0 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 backdrop-blur-sm transition hover:border-slate-300 hover:bg-slate-200 sm:px-3 sm:py-1.5 dark:border-white/25 dark:bg-white/10 dark:text-xactscore-muted dark:hover:border-white/40 dark:hover:bg-white/20"
        >
          {t('Edit')}
        </Link>
      </div>
    </div>
  )
}
