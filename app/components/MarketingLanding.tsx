import Link from 'next/link'
import Image from 'next/image'
import { Bell, Link2, Trophy, Users, Target, BarChart2 } from 'lucide-react'
import { getTranslations } from '../../lib/i18n'
import type { Locale } from '../../lib/i18n'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { siteUrl, loginPath } from '../../lib/urls'
import LandingJoinForm from './LandingJoinForm'
import ProductPreview from './ProductPreview'
import CompareSection from './CompareSection'
import type { NextMatchData, ScoreData } from './HeroBanner'

const reasons = [
  {
    icon: Link2,
    title: 'Private leagues, invite links.',
    body: 'Share one link with your office, family, or friends group. Everyone joins the same table.',
  },
  {
    icon: Users,
    title: 'Your group, your table.',
    body: 'One league for your crew — shared ranking, custom points, and banter in Messages.',
  },
  {
    icon: Target,
    title: 'One sport. Exact scores.',
    body: 'No 12-sport maze. Just Premier League scores, a private table, and custom points.',
  },
  {
    icon: Bell,
    title: 'Picks that actually get in.',
    body: 'Invite link, 60-minute lock, and a reminder before kickoff if you still have scores to put in.',
  },
] as const

const steps = [
  {
    icon: Users,
    title: 'Join a league',
    body: 'Create a private league or enter a friend’s invite link. Ready in under a minute.',
  },
  {
    icon: Target,
    title: 'Pick the score',
    body: 'Call every Premier League score before picks lock, one hour before kickoff.',
  },
  {
    icon: BarChart2,
    title: 'Climb the table',
    body: 'Exact score pays most. Close calls and the right result still keep you in the race.',
  },
] as const

const faqs = [
  {
    q: 'What do I need to play?',
    a: 'An account, a league invite or your own league, and score picks before the 60-minute lock.',
  },
  {
    q: 'How do I invite friends?',
    a: 'Create a league, copy the invite link, and send it. They join at xactscore.app/join/your-key.',
  },
  {
    q: 'When do picks lock?',
    a: 'Sixty minutes before kickoff. You can change your score until then.',
  },
  {
    q: 'Do I need an app store?',
    a: 'No. Open xactscore.app in Safari or Chrome and add it to your Home Screen. It runs like an app.',
  },
  {
    q: 'Is this like Superbru or PronoContest?',
    a: 'Same idea — predict Premier League scores with friends — focused on one sport and a private table, not a sports megamenu.',
  },
] as const

export default function MarketingLanding({
  locale,
  nextMatch,
  recentScores,
}: {
  locale: Locale
  nextMatch: NextMatchData | null
  recentScores: ScoreData[]
}) {
  const t = getTranslations(locale)
  const origin = siteUrl()

  return (
    <div className="mx-auto max-w-5xl space-y-10 pb-10 pt-1 sm:space-y-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'WebApplication',
                name: 'XactScore',
                url: origin,
                applicationCategory: 'GameApplication',
                operatingSystem: 'Web',
                offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
                description: t('Predict Premier League scores with friends. No transfers, no squads — just the score, your league, and the table.'),
              },
              {
                '@type': 'FAQPage',
                mainEntity: faqs.map((faq) => ({
                  '@type': 'Question',
                  name: t(faq.q),
                  acceptedAnswer: { '@type': 'Answer', text: t(faq.a) },
                })),
              },
            ],
          }),
        }}
      />

      <section className="hero-score-card relative overflow-hidden rounded-3xl bg-white p-6 shadow-xl shadow-slate-200/50 dark:border-white/10 dark:bg-gradient-to-br dark:from-black dark:via-[#0a0a0a] dark:to-black dark:shadow-2xl sm:px-10 sm:py-12">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-100/80 bg-[#F1F4F9] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:border-white/15 dark:bg-white/10 dark:text-xactscore-muted">
              <Trophy className="h-3.5 w-3.5 text-slate-500 dark:text-xactscore-accent" />
              {t('Premier League predictions')}
            </div>
            <h1 className="max-w-xl text-[1.35rem] font-extrabold uppercase leading-[1.1] tracking-tight text-slate-900 sm:text-5xl dark:bg-none dark:bg-clip-border dark:text-white">
              <span className="block text-slate-900 sm:inline dark:text-white">
                {t('Call the scores.')}
              </span>{' '}
              <span className="block text-slate-900 sm:inline dark:text-xactscore-accent">{t('Own the table.')}</span>
            </h1>
            <p className="mt-4 max-w-lg text-sm font-medium leading-6 text-zinc-500 dark:text-white/90 sm:text-base">
              {t('Private Premier League leagues for friends, offices, and family.')}{' '}
              {t('Predict Premier League scores with friends. No transfers, no squads — just the score, your league, and the table.')}
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
              <Link href={loginPath()} className={cn(buttonVariants(), 'w-full rounded-full bg-gradient-to-r from-indigo-600 to-blue-500 px-6 py-3.5 font-bold uppercase tracking-wide text-white shadow-lg shadow-indigo-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-indigo-500/40 active:scale-95 dark:bg-xactscore-accent dark:text-black dark:shadow-[0_0_28px_rgba(18,255,128,0.28)] dark:hover:shadow-[0_0_28px_rgba(18,255,128,0.35)] sm:w-auto')}>
                {t('Sign In')}
              </Link>
              <Link
                href={loginPath({ mode: 'signup' })}
                className={cn(buttonVariants({ variant: 'glass' }), 'w-full rounded-full uppercase tracking-wider sm:w-auto')}
              >
                {t('Sign Up')}
              </Link>
            </div>
            <p className="mt-3 text-sm font-medium text-zinc-500">
              <Link href="#join" className="underline-offset-4 hover:underline dark:text-xactscore-muted">
                {t('Have an invite?')}
              </Link>
            </p>
          </div>
          <ProductPreview locale={locale} />
        </div>
      </section>

      {nextMatch || recentScores.length ? (
        <section className="grid gap-3 sm:grid-cols-2">
          {nextMatch ? (
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500 dark:text-xactscore-accent">{t('Next up')}</p>
              <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:rounded-none dark:border-0 dark:bg-transparent dark:p-0 dark:shadow-none">
                <span className="flex min-w-0 items-center gap-2 text-sm font-bold text-slate-900 dark:font-bold dark:text-zinc-100">
                  {nextMatch.homeCrest ? (
                    <Image src={nextMatch.homeCrest} alt="" width={22} height={22} className="h-5 w-5 object-contain" />
                  ) : null}
                  <span className="truncate">{nextMatch.homeTeam}</span>
                </span>
                <span className="text-xs font-semibold text-slate-500">{t('vs')}</span>
                <span className="flex min-w-0 items-center justify-end gap-2 text-sm font-bold text-slate-900 dark:font-bold dark:text-zinc-100">
                  <span className="truncate">{nextMatch.awayTeam}</span>
                  {nextMatch.awayCrest ? (
                    <Image src={nextMatch.awayCrest} alt="" width={22} height={22} className="h-5 w-5 object-contain" />
                  ) : null}
                </span>
              </div>
            </article>
          ) : null}
          {recentScores[0] ? (
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500 dark:text-xactscore-accent">{t('Recent results')}</p>
              <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:rounded-none dark:border-0 dark:bg-transparent dark:p-0 dark:shadow-none">
                <span className="truncate text-sm font-bold text-slate-900 dark:font-bold dark:text-zinc-100">{recentScores[0].homeTeam}</span>
                <span className="tabular-nums text-sm font-bold text-slate-900 dark:text-xactscore-accent">
                  {recentScores[0].homeScore}–{recentScores[0].awayScore}
                </span>
                <span className="truncate text-right text-sm font-bold text-slate-900 dark:font-bold dark:text-zinc-100">{recentScores[0].awayTeam}</span>
              </div>
            </article>
          ) : null}
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-3">
        {steps.map(({ icon: Icon, title, body }) => (
          <article key={title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-lg dark:shadow-black/20">
            <div className="mb-3 inline-flex rounded-xl bg-slate-100 p-2.5 text-slate-600 dark:bg-xactscore-accent/15 dark:text-xactscore-accent">
              <Icon className="h-5 w-5" />
            </div>
            <h2 className="text-sm font-semibold uppercase tracking-tight text-zinc-900 dark:font-black dark:text-zinc-100">{t(title)}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">{t(body)}</p>
          </article>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold uppercase tracking-tight text-zinc-900 dark:font-black dark:text-zinc-100 sm:text-2xl">
          {t('Why groups switch')}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {reasons.map(({ icon: Icon, title, body }) => (
            <article key={title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none">
              <div className="mb-3 inline-flex rounded-xl bg-slate-100 p-2.5 text-slate-600 dark:bg-xactscore-accent/15 dark:text-xactscore-accent">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold uppercase tracking-tight text-zinc-900 dark:font-black dark:text-zinc-100">{t(title)}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{t(body)}</p>
            </article>
          ))}
        </div>
      </section>

      <CompareSection locale={locale} />

      <section id="join" className="scroll-mt-28 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none sm:p-8">
        <div className="mb-4 flex items-center gap-2 text-slate-600 dark:text-xactscore-accent">
          <Link2 className="h-5 w-5" />
          <h2 className="text-sm font-semibold uppercase tracking-tight text-zinc-900 dark:font-black dark:text-zinc-100">{t('Have an invite?')}</h2>
        </div>
        <p className="mb-4 max-w-xl text-sm leading-6 text-zinc-400">
          {t('Create a private league or enter a friend’s invite link. Ready in under a minute.')}
        </p>
        <LandingJoinForm />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold uppercase tracking-tight text-zinc-900 dark:font-black dark:text-zinc-100 sm:text-2xl">
          {t('Frequently asked questions')}
        </h2>
        {faqs.map((faq) => (
          <details key={faq.q} className="group rounded-3xl border border-slate-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none">
            <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold uppercase tracking-tight text-zinc-900 marker:hidden dark:font-black dark:text-zinc-100">
              {t(faq.q)}
            </summary>
            <p className="border-t border-zinc-200/50 px-5 py-4 text-sm font-medium leading-6 text-zinc-500 dark:border-white/10 dark:text-zinc-400">{t(faq.a)}</p>
          </details>
        ))}
      </section>

      <div className="rounded-3xl border border-slate-200 bg-white px-5 py-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:border-xactscore-accent/20 dark:bg-gradient-to-br dark:from-black/30 dark:to-black dark:shadow-none sm:px-10">
        <p className="text-xl font-extrabold uppercase tracking-tight text-zinc-900 dark:font-black dark:text-white sm:text-2xl">{t('Switch from Superbru or PronoContest')}</p>
        <p className="mx-auto mt-2 max-w-lg text-sm font-medium text-zinc-500 dark:text-white/80">
          {t('Built for a private Premier League table — not a sports megamenu.')}
        </p>
        <Link href={loginPath({ mode: 'signup' })} className={cn(buttonVariants(), 'mt-5 uppercase tracking-wider')}>
          {t('Sign Up')}
        </Link>
      </div>
    </div>
  )
}
