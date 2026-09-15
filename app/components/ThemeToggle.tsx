'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useTranslations } from './LocaleProvider'
import { cn } from '@/lib/utils'

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const t = useTranslations()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <span
        className="inline-flex h-11 w-11 shrink-0 rounded-full border border-xactscore-border bg-xactscore-surface"
        aria-hidden
      />
    )
  }

  const isDark = resolvedTheme !== 'light'

  return (
    <button
      type="button"
      aria-label={isDark ? t('Switch to light mode') : t('Switch to dark mode')}
      title={isDark ? t('Light mode') : t('Dark mode')}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative inline-flex h-11 w-11 shrink-0 select-none items-center justify-center overflow-hidden rounded-full border border-xactscore-border bg-xactscore-surface text-xactscore-text shadow-sm outline-none transition-all duration-300 touch-manipulation hover:border-slate-200 hover:bg-slate-100 active:scale-90 dark:hover:border-xactscore-accent/40 dark:hover:bg-xactscore-accent/10"
    >
      <Sun
        className={cn(
          'absolute h-4 w-4 text-amber-600 transition-all duration-300',
          isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
        )}
      />
      <Moon
        className={cn(
          'absolute h-4 w-4 text-xactscore-accent transition-all duration-300',
          isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
        )}
      />
    </button>
  )
}
