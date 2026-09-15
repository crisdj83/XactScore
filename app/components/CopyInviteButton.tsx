'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { useTranslations } from './LocaleProvider'
import { cn } from '@/lib/utils'

export default function CopyInviteButton({
  url,
  className,
  compact = false,
}: {
  url: string
  className?: string
  compact?: boolean
}) {
  const t = useTranslations()
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      aria-label={copied ? t('Copied') : t('Copy invite link')}
      title={copied ? t('Copied') : t('Copy invite link')}
      className={cn(
        'inline-flex select-none items-center justify-center gap-1.5 rounded-full transition touch-manipulation active:scale-95',
        compact
          ? 'h-11 w-11 shrink-0 border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-white/15 dark:bg-white/10 dark:text-xactscore-muted dark:hover:bg-white/20'
          : 'min-h-11 border border-white/15 bg-white/10 px-3 text-xs font-bold uppercase tracking-wider text-xactscore-muted hover:bg-white/20',
        className
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {compact ? null : copied ? t('Copied') : t('Copy invite link')}
    </button>
  )
}
