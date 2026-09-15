'use client'

import { Languages } from 'lucide-react'
import { locales, type Locale } from '../../lib/i18n'
import { useLocale, useTranslations } from './LocaleProvider'
import { cn } from '@/lib/utils'
import { tabActive, tabBase } from '@/lib/tab-styles'

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale()
  const t = useTranslations()

  return (
    <label className={cn(tabBase, tabActive, 'h-11 min-h-11 shrink-0 gap-1 px-2 sm:gap-1.5 sm:px-3')}>
      <Languages className="hidden h-4 w-4 shrink-0 sm:block" aria-hidden="true" />
      <span className="sr-only">{t('Language')}</span>
      <select
        aria-label={t('Language')}
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
        className="h-11 min-h-11 cursor-pointer bg-transparent text-base font-bold uppercase tracking-wider text-zinc-900 outline-none dark:text-xactscore-muted"
      >
        {locales.map((item) => (
            <option key={item} value={item} className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">
            {item.toUpperCase()}
          </option>
        ))}
      </select>
    </label>
  )
}
