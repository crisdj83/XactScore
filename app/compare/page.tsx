import type { Metadata } from 'next'
import Link from 'next/link'
import CompareSection from '../components/CompareSection'
import { getTranslations } from '../../lib/i18n'
import { getServerLocale } from '../../lib/i18n-server'
import { siteUrl } from '../../lib/urls'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export async function generateMetadata(): Promise<Metadata> {
  const t = getTranslations(getServerLocale())
  const title = t('XactScore vs Superbru and PronoContest')
  const description = t('A private Premier League predictor for friends and offices.')
  return {
    title,
    description,
    alternates: { canonical: `${siteUrl()}/compare` },
    openGraph: { title, description, url: `${siteUrl()}/compare` },
  }
}

export default function ComparePage() {
  const locale = getServerLocale()
  const t = getTranslations(locale)

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12 pt-2">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-300">{t('Compare')}</p>
        <h1 className="mt-2 max-w-2xl text-3xl font-black uppercase leading-none tracking-tight text-zinc-100 sm:text-4xl">
          {t('XactScore vs Superbru and PronoContest')}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">
          {t('A private Premier League predictor for friends and offices.')}
        </p>
      </div>
      <CompareSection locale={locale} showCta />
      <p className="text-sm text-zinc-500">
        <Link href="/" className={cn(buttonVariants({ variant: 'ghost' }), 'px-0')}>
          {t('Back to home')}
        </Link>
      </p>
    </div>
  )
}
