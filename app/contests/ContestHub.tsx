'use client'

import { useState } from 'react'
import { Trophy, Plus, Search, ChevronRight, Globe, Lock } from 'lucide-react'
import Link from 'next/link'
import { createContest, joinContest } from './actions'
import { useTranslations } from '../components/LocaleProvider'
import ContestIcon from '../components/ContestIcon'
import { Card, CardContent } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { EmptyState, PageHeader } from '@/components/ui/page-header'
import { cn } from '@/lib/utils'
import { segmentActive, segmentBase, segmentInactive } from '@/lib/tab-styles'
import { getSeasonLengthLabelKey, isValidSeasonLength, type ContestSeasonLength } from '../../lib/contest-season'

export default function ContestHub({ myContests, messages }: any) {
  const initialTab =
    messages?.tab === 'create'
      ? 'create'
      : messages?.tab === 'join' || messages?.key
        ? 'join'
        : 'my_contests'
  const [activeTab, setActiveTab] = useState<'my_contests' | 'join' | 'create'>(initialTab)
  const [visibility, setVisibility] = useState<'public' | 'private'>(
    messages?.visibility === 'public' ? 'public' : 'private'
  )
  const [seasonLength, setSeasonLength] = useState<ContestSeasonLength>(
    isValidSeasonLength(messages?.season_length) ? messages.season_length : 'full'
  )
  const t = useTranslations()

  const tabClass = (tab: typeof activeTab) =>
    cn(segmentBase, 'flex-1 text-[10px] sm:text-xs md:text-sm', activeTab === tab ? segmentActive : segmentInactive)

  return (
    <div className="mx-auto w-full space-y-6 pt-2 sm:pt-6">
      <PageHeader
        title={t('Contest Hub')}
        actions={
          <div className="rounded-xl bg-xactscore-accent p-2.5 text-xactscore-bg shadow">
            <Trophy className="h-6 w-6" />
          </div>
        }
      />

      {messages?.error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-medium text-red-300">
          {messages.error}
        </div>
      )}

      <div className="content-panel flex gap-1.5 p-1.5 dark:!bg-zinc-950/70">
        <button type="button" onClick={() => setActiveTab('my_contests')} className={tabClass('my_contests')}>
          <Trophy className="h-4 w-4 shrink-0" />
          <span className="hidden xs:inline sm:inline">{t('My Contests')}</span>
          <span className="sm:hidden">Mine</span>
        </button>
        <button type="button" onClick={() => setActiveTab('join')} className={tabClass('join')}>
          <Search className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">{t('Join Contest')}</span>
          <span className="sm:hidden">Join</span>
        </button>
        <button type="button" onClick={() => setActiveTab('create')} className={tabClass('create')}>
          <Plus className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">{t('Create Contest')}</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      <Card>
        <CardContent className="p-5 md:p-8">
          {activeTab === 'my_contests' && (
            <div className="space-y-4">
              <h2 className="mb-4 text-lg font-extrabold uppercase tracking-tight text-zinc-900 dark:text-zinc-100">
                {t('Your Active Contests')}
              </h2>

              {myContests.length === 0 ? (
                <EmptyState
                  title={t('No contests yet')}
                  description={t(
                    "You haven't joined any prediction leagues. Join an existing one or create your own!"
                  )}
                  action={
                    <Button type="button" variant="link" onClick={() => setActiveTab('join')}>
                      {t('Find a contest to join →')}
                    </Button>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {myContests.map((membership: any) => (
                    <Link
                      key={membership.contest_id}
                      href={`/contests/${membership.contest_id}`}
                      className="content-panel group flex min-h-[120px] cursor-pointer flex-col p-5 transition-all hover:shadow-md dark:!bg-zinc-950/50 dark:hover:border-xactscore-accent"
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-start gap-3">
                          <ContestIcon contestId={membership.contest_id} size="sm" />
                          <div className="min-w-0">
                            <h3 className="truncate text-lg font-bold text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-zinc-100 dark:group-hover:text-xactscore-accent">
                              {membership.contests.name}
                            </h3>
                            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-zinc-500">
                              {t('Season')}:{' '}
                              {t(getSeasonLengthLabelKey(membership.contests.season_length))}
                            </p>
                          </div>
                        </div>
                        <Badge variant={membership.role === 'admin' ? 'accent' : 'muted'}>
                          {membership.role === 'admin' ? t('Admin') : t('Member')}
                        </Badge>
                      </div>
                      <div className="mt-auto flex items-center justify-between border-t border-zinc-800 pt-4 text-sm">
                        {membership.contests.is_public ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-slate-600 dark:rounded dark:border-transparent dark:bg-zinc-900 dark:text-xactscore-accent">
                            <Globe className="h-3 w-3" />
                            {t('Public')}
                          </span>
                        ) : (
                          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-500 dark:rounded dark:border-transparent dark:bg-zinc-900 dark:text-zinc-400">
                            {t('Key:')}{' '}
                            <span className="font-mono font-bold text-zinc-200">
                              {membership.contests.contest_key}
                            </span>
                          </span>
                        )}
                        <span className="flex items-center text-xs font-bold uppercase tracking-wider text-xactscore-accent group-hover:text-xactscore-accent">
                          {t('Dashboard')} <ChevronRight className="ml-0.5 h-4 w-4" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'join' && (
            <div className="mx-auto max-w-md space-y-8 py-4">
              <div className="text-center">
                <Globe className="mx-auto mb-3 h-10 w-10 text-slate-400 dark:text-xactscore-accent" />
                <h2 className="text-xl font-extrabold uppercase tracking-tight text-zinc-900 dark:text-zinc-100">
                  {t('Join Public')}
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  {t('Browse public contests that anyone can join without a key.')}
                </p>
                <Link
                  href="/contests/public"
                  className={cn(buttonVariants(), 'mt-4 w-full uppercase tracking-wider')}
                >
                  {t('Join Public')}
                </Link>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden>
                  <div className="w-full border-t border-zinc-800" />
                </div>
                <div className="relative flex justify-center">
                  <span className="rounded-full border border-slate-200 bg-white px-3 text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:rounded-none dark:border-transparent dark:bg-zinc-900">
                    {t('or')}
                  </span>
                </div>
              </div>

              <div className="text-center">
                <Lock className="mx-auto mb-3 h-10 w-10 text-slate-400 dark:text-xactscore-accent" />
                <h2 className="text-xl font-extrabold uppercase tracking-tight text-zinc-900 dark:text-zinc-100">
                  {t('Join a Private Contest')}
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  {t('Enter the 7-character invitation key provided by the contest administrator.')}
                </p>
              </div>
              <form action={joinContest} className="space-y-4">
                <div>
                  <Label htmlFor="contest_key">{t('Contest Key *')}</Label>
                  <Input
                    id="contest_key"
                    type="text"
                    name="contest_key"
                    required
                    placeholder="e.g. btyfwtx"
                    defaultValue={messages?.key || ''}
                    className="text-center font-mono text-lg uppercase tracking-widest"
                  />
                </div>
                <Button type="submit" variant="secondary" className="w-full uppercase tracking-wider">
                  {t('Join Private')}
                </Button>
              </form>
            </div>
          )}

          {activeTab === 'create' && (
            <div className="mx-auto max-w-md py-4">
              <div className="mb-6 text-center">
                <Plus className="mx-auto mb-3 h-10 w-10 text-slate-400 dark:text-xactscore-accent" />
                <h2 className="text-xl font-extrabold uppercase tracking-tight text-zinc-900 dark:text-zinc-100">
                  {t('Create a New Contest')}
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  {t('Create your own prediction league and invite your friends to compete.')}
                </p>
              </div>
              <form action={createContest} className="space-y-4">
                <input type="hidden" name="visibility" value={visibility} />
                <div>
                  <Label htmlFor="name">{t('Contest Name *')}</Label>
                  <Input
                    id="name"
                    type="text"
                    name="name"
                    required
                    defaultValue={messages?.name || ''}
                    placeholder="e.g. Office Premier League 24/25"
                  />
                </div>
                <div>
                  <Label>{t('Season Length')}</Label>
                  <p className="mb-2 text-xs text-zinc-500">
                    {t('Choose full season, first half, or second half of the Premier League.')}
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {([
                      { value: 'full', title: t('Full season'), detail: t('All 38 Premier League matchdays.') },
                      { value: 'first_half', title: t('First half'), detail: t('The first 19 Premier League matchdays.') },
                      { value: 'second_half', title: t('Second half'), detail: t('Matchdays 20 through 38.') },
                    ] as const).map(option => (
                      <label
                        key={option.value}
                        className={cn(
                          'min-h-12 cursor-pointer select-none rounded-xl border px-3 py-3 text-left transition touch-manipulation',
                          seasonLength === option.value
                            ? 'border-0 bg-indigo-100 text-indigo-700 dark:border dark:border-xactscore-accent/50 dark:bg-xactscore-accent/15'
                            : 'border-slate-200 bg-white hover:border-slate-300 dark:border-zinc-800 dark:bg-zinc-950/60 dark:hover:border-zinc-600'
                        )}
                      >
                        <input
                          type="radio"
                          name="season_length"
                          value={option.value}
                          checked={seasonLength === option.value}
                          onChange={() => setSeasonLength(option.value)}
                          className="sr-only"
                        />
                        <p className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">{option.title}</p>
                        <p className="mt-1 text-[11px] leading-snug text-zinc-500">{option.detail}</p>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVisibility('public')}
                    className={cn(
                      'min-h-12 select-none rounded-xl border px-3 py-3 text-left transition touch-manipulation',
                      visibility === 'public'
                        ? 'border-0 bg-indigo-100 text-indigo-700 dark:border dark:border-xactscore-accent/50 dark:bg-xactscore-accent/15'
                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-zinc-800 dark:bg-zinc-950/60 dark:hover:border-zinc-600'
                    )}
                  >
                    <Globe className="mb-1.5 h-4 w-4 text-slate-500 dark:text-xactscore-accent" />
                    <p className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">{t('Public')}</p>
                    <p className="mt-1 text-[11px] leading-snug text-zinc-500">
                      {t('Anyone can join this league. No invite key needed.')}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibility('private')}
                    className={cn(
                      'min-h-12 select-none rounded-xl border px-3 py-3 text-left transition touch-manipulation',
                      visibility === 'private'
                        ? 'border-0 bg-indigo-100 text-indigo-700 dark:border dark:border-xactscore-accent/50 dark:bg-xactscore-accent/15'
                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-zinc-800 dark:bg-zinc-950/60 dark:hover:border-zinc-600'
                    )}
                  >
                    <Lock className="mb-1.5 h-4 w-4 text-slate-500 dark:text-xactscore-accent" />
                    <p className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">{t('Private')}</p>
                    <p className="mt-1 text-[11px] leading-snug text-zinc-500">
                      {t('Only people with the invite key can join.')}
                    </p>
                  </button>
                </div>
                <Button type="submit" className="w-full uppercase tracking-wider">
                  {visibility === 'public' ? t('Create Public Contest') : t('Create & Generate Key')}
                </Button>
                <p className="mt-4 text-center text-[11px] text-zinc-500">
                  {t('You will automatically become the Admin. You can customize settings after creation.')}
                </p>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
