import { CircleHelp, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { getTranslations } from '../../lib/i18n'
import { getServerLocale } from '../../lib/i18n-server'
import { PageHeader } from '@/components/ui/page-header'

const sections = [
  {
    title: 'Getting started',
    body: 'Create an account, choose a username, and head to the Contests page to join a league or create your own.',
  },
  {
    title: 'Making predictions',
    body: 'Open a contest and select Predictions to see the fixture calendar. Choose a score for both teams; you can change it until picks lock, 60 minutes before kickoff.',
  },
  {
    title: 'Scoring and rankings',
    body: 'You earn the most points for an exact score, with additional points for a close prediction or the correct result. Check Table to follow your progress against the rest of your league.',
  },
  {
    title: 'Contests and invites',
    body: 'Contest admins can choose full season, first half, or second half, customize scoring, and share an invite link with friends. You can belong to multiple contests at once.',
  },
  {
    title: 'Your profile',
    body: 'Use Profile to update your username, favorite Premier League team, avatar, and personal quote. Your profile helps your league recognize you.',
  },
  {
    title: 'Messages',
    body: 'Messages are discussions between members of your contests. Use them to talk about fixtures, banter, and league news.',
  },
  {
    title: 'Install the app',
    body: 'On iPhone, open this site in Safari, tap Share, then Add to Home Screen. On Android, open Chrome and choose Install app or Add to Home screen. XactScore then opens like an app, without the browser bar.',
  },
] as const

export default function HelpPage() {
  const t = getTranslations(getServerLocale())

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12 pt-2">
      <div className="flex items-center gap-3">
        <div className="rounded-xl border border-slate-200 bg-slate-100 p-2.5 text-slate-600 dark:border-transparent dark:bg-zinc-950 dark:text-xactscore-accent">
          <CircleHelp className="h-6 w-6" />
        </div>
        <PageHeader
          className="mb-0"
          title={t('Help')}
          description={t('Everything you need to get the most from XactScore.')}
        />
      </div>

      <div className="space-y-3">
        {sections.map((section) => (
          <details
            key={section.title}
            className="content-panel group"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-semibold text-zinc-900 marker:hidden dark:font-black dark:text-zinc-100">
              <span>{t(section.title)}</span>
              <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180 dark:text-xactscore-accent" />
            </summary>
            <div className="space-y-3 border-t border-zinc-800 px-5 pb-5 pt-4">
              <p className="text-sm leading-6 text-zinc-400">{t(section.body)}</p>
              {section.title === 'Install the app' ? (
                <Link
                  href="/help/install"
                  className="inline-flex text-sm font-bold text-indigo-600 hover:text-indigo-700 dark:text-orange-300 dark:hover:text-orange-200"
                >
                  {t('Open the full install guide')}
                </Link>
              ) : null}
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}
