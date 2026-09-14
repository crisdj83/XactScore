import Link from 'next/link'
import { Check, Minus } from 'lucide-react'
import { getTranslations } from '../../lib/i18n'
import type { Locale } from '../../lib/i18n'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const rows = [
  {
    label: 'Sports',
    xact: 'Premier League',
    superbru: '12+ sports and fantasy modes',
    prono: 'Football, rugby, and more',
  },
  {
    label: 'Scoring',
    xact: 'Exact score + custom points',
    superbru: 'Predictor + fantasy',
    prono: '1X2 or scores, custom rules',
  },
  {
    label: 'Focus',
    xact: 'Private leagues for friends',
    superbru: 'Public pools and fantasy modes',
    prono: 'Contests across several sports',
  },
] as const

export default function CompareSection({
  locale,
  showCta = false,
}: {
  locale: Locale
  showCta?: boolean
}) {
  const t = getTranslations(locale)

  return (
    <section id="compare" className="scroll-mt-28 space-y-5">
      <div className="max-w-2xl">
        <h2 className="text-xl font-semibold uppercase tracking-tight text-zinc-900 dark:font-black dark:text-zinc-100 sm:text-2xl">
          {t('How XactScore compares')}
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          {t('Built for a private Premier League table — not a sports megamenu.')}
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none">
        <div className="hidden grid-cols-4 gap-0 border-b border-slate-200 bg-white text-[11px] font-black uppercase tracking-wider text-zinc-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-400 sm:grid">
          <div className="px-4 py-3" />
          <div className="px-4 py-3 text-zinc-900 dark:text-xactscore-accent">XactScore</div>
          <div className="px-4 py-3">Superbru</div>
          <div className="px-4 py-3">PronoContest</div>
        </div>
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid gap-2 border-b border-zinc-200/50 px-4 py-4 last:border-b-0 dark:border-white/10 sm:grid-cols-4 sm:items-center sm:gap-0 sm:py-0"
          >
            <p className="text-[11px] font-black uppercase tracking-wider text-zinc-500 sm:px-0 sm:py-4">
              {t(row.label)}
            </p>
            <p className="flex items-start gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100 sm:px-4 sm:py-4">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <span>
                <span className="sm:hidden">XactScore · </span>
                {t(row.xact)}
              </span>
            </p>
            <p className="flex items-start gap-2 text-sm text-zinc-400 sm:px-4 sm:py-4">
              <Minus className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600" />
              <span>
                <span className="sm:hidden">Superbru · </span>
                {t(row.superbru)}
              </span>
            </p>
            <p className="flex items-start gap-2 text-sm text-zinc-400 sm:px-4 sm:py-4">
              <Minus className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600" />
              <span>
                <span className="sm:hidden">PronoContest · </span>
                {t(row.prono)}
              </span>
            </p>
          </div>
        ))}
      </div>

      {showCta ? (
        <Link href="/login?mode=signup" className={cn(buttonVariants(), 'uppercase tracking-wider')}>
          {t('Sign Up')}
        </Link>
      ) : null}
    </section>
  )
}
