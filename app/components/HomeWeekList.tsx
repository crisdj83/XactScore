import Link from 'next/link'
import { ChevronRight, Trophy } from 'lucide-react'
import { getTranslations } from '../../lib/i18n'
import type { Locale } from '../../lib/i18n'

export type LeagueWeek = {
  contestId: string
  name: string
  openPicks: number
  rank: number | null
}

export default function HomeWeekList({
  locale,
  leagues,
}: {
  locale: Locale
  leagues: LeagueWeek[]
}) {
  const t = getTranslations(locale)
  const totalOpen = leagues.reduce((sum, league) => sum + league.openPicks, 0)

  if (leagues.length === 0) {
    return (
      <Link
        href="/contests"
        className="content-panel flex items-center justify-between gap-3 px-4 py-4 transition hover:shadow-md dark:border-xactscore-accent/40 dark:!bg-xactscore-accent/10"
      >
        <div>
          <p className="text-sm font-semibold uppercase tracking-tight text-zinc-900 dark:font-black dark:text-zinc-100">{t('Join a league')}</p>
          <p className="mt-1 text-sm text-zinc-400">{t('Create or join a league to start calling scores.')}</p>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 dark:text-xactscore-accent" />
      </Link>
    )
  }

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-xactscore-accent">{t('Your week')}</h2>
          <p className="mt-0.5 text-sm text-zinc-400">
            {totalOpen > 0
              ? t('Put your scores in before they lock.')
              : t('You are up to date. Check the table or wait for the next matchday.')}
          </p>
        </div>
        {totalOpen > 0 ? (
          <span className="rounded-full bg-xactscore-accent px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-xactscore-bg">
            {totalOpen} {totalOpen === 1 ? t('pick left') : t('picks left')}
          </span>
        ) : null}
      </div>

      <ul className="content-panel divide-y divide-slate-100 overflow-hidden dark:divide-white/10">
        {leagues.map((league) => (
          <li key={league.contestId}>
            <Link
              href={
                league.openPicks > 0
                  ? `/contests/${league.contestId}/predictions`
                  : `/contests/${league.contestId}/ranking`
              }
              className="flex min-h-14 items-center justify-between gap-3 p-3.5 transition-colors hover:bg-slate-50 dark:p-3 dark:hover:bg-white/[0.06]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-100 text-slate-600 dark:border-transparent dark:bg-zinc-950 dark:text-xactscore-accent">
                <Trophy className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900 dark:font-bold dark:text-zinc-100">{league.name}</p>
                <p className="text-xs text-zinc-500">
                  {league.openPicks > 0
                    ? `${league.openPicks} ${league.openPicks === 1 ? t('pick left') : t('picks left')}`
                    : t('All picks in')}
                  {league.rank ? ` · #${league.rank}` : ''}
                </p>
              </div>
              <span className="shrink-0 text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-xactscore-accent">
                {league.openPicks > 0 ? t('Put scores') : t('View table')}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
