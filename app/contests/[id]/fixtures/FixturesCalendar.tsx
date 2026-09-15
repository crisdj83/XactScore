'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Clock, Sparkles, MapPin } from 'lucide-react'
import { useTranslations } from '../../../components/LocaleProvider'
import MatchdayStrip from '../../../components/MatchdayStrip'
import { ScoreBadge } from '@/components/ui/badge'
import { FitTeamName, TeamNameFitGroup } from '@/components/ui/fit-team-name'

export type Match = {
  id: number | string
  matchday: number
  utcDate: string
  status: string
  homeTeam: { id?: number | string; name: string; shortName?: string; tla?: string; crest?: string }
  awayTeam: { id?: number | string; name: string; shortName?: string; tla?: string; crest?: string }
  score?: {
    fullTime?: { home?: number | null; away?: number | null }
  }
  venue?: string | null
}

export default function FixturesCalendar({
  matches,
  contestId,
  locale,
}: {
  matches: Match[]
  contestId: string
  locale: string
}) {
  const t = useTranslations()

  const matchdays = useMemo(() => {
    const set = new Set<number>()
    matches.forEach((m) => {
      if (typeof m.matchday === 'number' && !isNaN(m.matchday)) {
        set.add(m.matchday)
      }
    })
    return Array.from(set).sort((a, b) => a - b)
  }, [matches])

  const currentMatchday = useMemo(() => {
    if (matchdays.length === 0) return 1

    const now = Date.now()
    const liveMatch = matches.find((m) => ['IN_PLAY', 'PAUSED'].includes(m.status))
    if (liveMatch) return Number(liveMatch.matchday)

    const upcomingMatch = matches
      .filter((m) => ['TIMED', 'SCHEDULED'].includes(m.status) && new Date(m.utcDate).getTime() > now)
      .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())[0]
    if (upcomingMatch) return Number(upcomingMatch.matchday)

    const finishedMatches = matches
      .filter((m) => m.status === 'FINISHED')
      .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())
    if (finishedMatches.length > 0) return Number(finishedMatches[0].matchday)

    return matchdays[0]
  }, [matches, matchdays])

  const [selectedMatchday, setSelectedMatchday] = useState<number>(currentMatchday)

  useEffect(() => {
    setSelectedMatchday(currentMatchday)
  }, [currentMatchday])

  const selectedFixtures = useMemo(() => {
    return matches.filter((m) => Number(m.matchday) === selectedMatchday)
  }, [matches, selectedMatchday])

  if (matchdays.length === 0) {
    return null
  }

  const isCurrentGameweekSelected = selectedMatchday === currentMatchday

  return (
    <div className="space-y-4">
      <MatchdayStrip
        matchdays={matchdays}
        selected={selectedMatchday}
        onSelect={setSelectedMatchday}
      />
      <div className="-mt-3 mb-1 flex justify-center">
        {isCurrentGameweekSelected ? (
          <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-xactscore-accent/40 dark:bg-xactscore-accent/20 dark:text-[10px] dark:font-black dark:tracking-widest dark:text-xactscore-accent">
            {t('Current Gameweek')}
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setSelectedMatchday(currentMatchday)}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-slate-500 transition-colors hover:bg-slate-50 active:scale-95 dark:border-xactscore-accent/30 dark:bg-xactscore-accent/10 dark:text-[10px] dark:font-bold dark:normal-case dark:tracking-normal dark:text-xactscore-accent dark:hover:bg-xactscore-accent/20"
          >
            <Sparkles className="h-3 w-3" />
            <span>
              {t('GW')} {currentMatchday}
            </span>
          </button>
        )}
      </div>

      <section className="content-panel space-y-2 overflow-hidden p-2 dark:space-y-0 dark:p-0">
        <TeamNameFitGroup resetKey={selectedMatchday}>
        <div className="space-y-2 dark:space-y-0 dark:divide-y dark:divide-zinc-800">
          {selectedFixtures.map((match) => {
            const score = match.score?.fullTime
            const hasScore =
              score?.home !== null &&
              score?.home !== undefined &&
              score?.away !== null &&
              score?.away !== undefined
            return (
              <Link
                key={match.id}
                href={`/contests/${contestId}/predictions/${match.id}`}
                className="prediction-fixture-content fixture-calendar-game mb-2.5 flex min-h-[52px] items-center justify-between gap-3 overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-500/5 p-3.5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-200 dark:mb-0 dark:min-h-[72px] dark:flex-col dark:gap-3 dark:rounded-none dark:border-0 dark:bg-transparent dark:px-4 dark:py-4 dark:shadow-none dark:hover:bg-zinc-800/50 dark:hover:shadow-none sm:grid sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center sm:gap-4 sm:px-5"
              >
                <span className="flex min-w-0 flex-1 items-center gap-2 text-sm font-medium text-slate-900 dark:font-bold dark:text-zinc-100 sm:justify-end sm:text-right">
                  {match.homeTeam.crest ? (
                    <Image
                      src={match.homeTeam.crest}
                      alt=""
                      width={28}
                      height={28}
                      className="h-7 w-7 shrink-0 object-contain sm:order-2"
                    />
                  ) : null}
                  <FitTeamName
                    name={match.homeTeam.name}
                    shortName={match.homeTeam.shortName}
                    tla={match.homeTeam.tla}
                    align="right"
                    className="min-w-0 flex-1 sm:order-1 sm:text-right"
                  />
                </span>

                <span className="flex min-w-24 flex-col items-center gap-1 self-center">
                  {hasScore ? (
                    <ScoreBadge className="font-mono text-base">
                      {score.home} : {score.away}
                    </ScoreBadge>
                  ) : (
                    <span className="text-sm font-semibold text-slate-500 dark:font-black dark:text-xactscore-accent">vs</span>
                  )}
                  <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <Clock className="h-3 w-3" />
                    {new Date(match.utcDate).toLocaleString(locale, {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {match.venue ? (
                    <span className="flex max-w-[11rem] items-center gap-1 text-xs font-medium normal-case tracking-normal text-slate-500">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="min-w-0 break-words">{match.venue}</span>
                    </span>
                  ) : null}
                </span>

                <span className="flex min-w-0 flex-1 items-center gap-2 text-sm font-medium text-slate-900 dark:font-bold dark:text-zinc-100">
                  {match.awayTeam.crest ? (
                    <Image
                      src={match.awayTeam.crest}
                      alt=""
                      width={28}
                      height={28}
                      className="h-7 w-7 shrink-0 object-contain"
                    />
                  ) : null}
                  <FitTeamName
                    name={match.awayTeam.name}
                    shortName={match.awayTeam.shortName}
                    tla={match.awayTeam.tla}
                    className="min-w-0 flex-1"
                  />
                </span>
              </Link>
            )
          })}
        </div>
        </TeamNameFitGroup>
      </section>
    </div>
  )
}
