import { createClient } from '../../../lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users } from 'lucide-react'
import { getTranslations } from '../../../lib/i18n'
import { getServerLocale } from '../../../lib/i18n-server'
import ContestIcon from '../../components/ContestIcon'
import { Button, buttonVariants } from '@/components/ui/button'
import { ScoreBadge } from '@/components/ui/badge'
import { EmptyState, PageHeader } from '@/components/ui/page-header'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { RankTable, type RankColumn } from '@/components/ui/rank-table'
import { joinPublicContest } from '../actions'

type PublicContestRow = {
  id: string
  name: string
  players: number
  rank: number
  joined: boolean
}

function JoinAction({ contestId, joined, joinLabel, openLabel, compact = false }: {
  contestId: string
  joined: boolean
  joinLabel: string
  openLabel: string
  compact?: boolean
}) {
  if (joined) {
    return (
      <Link
        href={`/contests/${contestId}`}
        className={compact
          ? 'inline-flex min-h-11 select-none items-center px-3 py-2 text-xs font-black uppercase tracking-wider text-xactscore-accent touch-manipulation hover:text-white'
          : 'inline-flex h-11 min-h-11 items-center rounded-full border border-white/15 bg-white/[0.07] px-3 text-xs font-black uppercase tracking-wider text-xactscore-accent backdrop-blur-md hover:bg-white/12'}
      >
        {openLabel}
      </Link>
    )
  }
  return (
    <form action={joinPublicContest}>
      <input type="hidden" name="contest_id" value={contestId} />
      {compact ? (
        <button
          type="submit"
          className="inline-flex min-h-11 select-none items-center px-3 py-2 text-xs font-black uppercase tracking-wider text-xactscore-accent touch-manipulation hover:text-white"
        >
          {joinLabel}
        </button>
      ) : (
        <Button
          type="submit"
          size="sm"
          className="min-h-11 rounded-full px-3 text-xs uppercase tracking-wider"
        >
          {joinLabel}
        </Button>
      )}
    </form>
  )
}

export default async function PublicContestsPage(props: {
  searchParams: Promise<{ error?: string }>
}) {
  const searchParams = await props.searchParams
  const t = getTranslations(getServerLocale())
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  const { data: contests, error: contestsError } = await supabase
    .from('contests')
    .select('id, name, created_at')
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  if (contestsError && !/is_public/.test(contestsError.message || '')) {
    throw new Error(`Unable to load public contests: ${contestsError.message}`)
  }
  const publicContests = contestsError ? [] : contests || []

  const contestIds = publicContests.map(contest => contest.id)
  const [{ data: members }, { data: myMemberships }] = await Promise.all([
    contestIds.length
      ? supabase.from('contest_members').select('contest_id').in('contest_id', contestIds)
      : Promise.resolve({ data: [] as { contest_id: string }[] }),
    contestIds.length
      ? supabase
          .from('contest_members')
          .select('contest_id')
          .eq('user_id', user.id)
          .in('contest_id', contestIds)
      : Promise.resolve({ data: [] as { contest_id: string }[] }),
  ])

  const memberCounts = new Map<string, number>()
  for (const member of members || []) {
    memberCounts.set(member.contest_id, (memberCounts.get(member.contest_id) || 0) + 1)
  }
  const joinedIds = new Set((myMemberships || []).map(membership => membership.contest_id))

  const ranked: PublicContestRow[] = publicContests
    .map(contest => ({
      id: contest.id,
      name: contest.name,
      players: memberCounts.get(contest.id) || 0,
      joined: joinedIds.has(contest.id),
      rank: 0,
    }))
    .sort((a, b) => b.players - a.players || a.name.localeCompare(b.name))
    .map((contest, _, all) => ({
      ...contest,
      rank: all.findIndex(other => other.players === contest.players) + 1,
    }))

  const columns: RankColumn<PublicContestRow>[] = [
    {
      key: 'rank',
      header: t('Rank'),
      headerClassName: 'text-center w-16',
      className: 'text-center',
      cell: contest => (
        <span className="font-mono text-sm font-bold text-zinc-100">{contest.rank}.</span>
      ),
    },
    {
      key: 'contest',
      header: t('Contest Name'),
      mobilePrimary: true,
      cell: contest => (
        <div className="flex min-w-0 items-center gap-2.5">
          <ContestIcon contestId={contest.id} size="xs" />
          <div className="truncate font-bold text-zinc-100">{contest.name}</div>
        </div>
      ),
    },
    {
      key: 'players',
      header: (
        <span className="inline-flex items-center gap-1">
          <Users className="h-4 w-4 text-xactscore-accent" />
          {t('Players')}
        </span>
      ),
      headerClassName: 'text-center',
      className: 'text-center',
      cell: contest => (
        <ScoreBadge className="text-base">{contest.players}</ScoreBadge>
      ),
    },
    {
      key: 'action',
      header: t('Join Contest'),
      headerClassName: 'text-right',
      className: 'text-right',
      hideOnMobile: true,
      cell: contest => (
        <div className="flex justify-end">
          <JoinAction
            contestId={contest.id}
            joined={contest.joined}
            joinLabel={t('Join Contest')}
            openLabel={t('Open')}
          />
        </div>
      ),
    },
  ]

  return (
    <div className="mx-auto w-full space-y-6 pt-2 sm:pt-6">
      <div>
        <Breadcrumb
          items={[
            { label: t('Contest Hub'), href: '/contests' },
            { label: t('Public contests') },
          ]}
          className="mb-3"
        />
        <PageHeader
          title={t('Public contests')}
          description={t('Browse public contests that anyone can join without a key.')}
        />
      </div>

      {searchParams.error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-medium text-red-300">
          {searchParams.error}
        </div>
      ) : null}

      {ranked.length === 0 ? (
        <EmptyState
          title={t('No public contests yet')}
          description={t('Be the first to create a public prediction league.')}
          action={
            <Link href="/contests" className={buttonVariants({ variant: 'link' })}>
              {t('Create Contest')}
            </Link>
          }
        />
      ) : (
        <RankTable
          rows={ranked}
          columns={columns}
          getRowKey={contest => contest.id}
          emptyMessage={t('No public contests yet')}
          mobileSingleLine
          mobileRank={contest => (
            <span className="text-[13px] font-bold tabular-nums text-zinc-400">{contest.rank}.</span>
          )}
          mobileTitle={contest => (
            <span className="flex min-w-0 items-center gap-1.5">
              <ContestIcon contestId={contest.id} size="xs" />
              <span className="min-w-0 truncate">{contest.name}</span>
            </span>
          )}
          mobileStats={contest => (
            <span className="inline-flex items-center overflow-hidden rounded-full border border-white/[0.08] bg-white/[0.05] shadow-[inset_0_1px_0_rgb(255_255_255/0.07)] backdrop-blur-md">
              <JoinAction
                contestId={contest.id}
                joined={contest.joined}
                joinLabel={t('Join Contest')}
                openLabel={t('Open')}
                compact
              />
              <span className="h-4 w-px shrink-0 bg-white/25" aria-hidden />
              <span
                className="inline-flex min-w-[3.5rem] shrink-0 items-center justify-center gap-0.5 py-0.5 text-sm font-black tabular-nums leading-none text-xactscore-accent"
                title={t('Players')}
              >
                {contest.players}
                <Users className="h-3 w-3 text-xactscore-accent/80" aria-hidden />
              </span>
            </span>
          )}
        />
      )}
    </div>
  )
}
