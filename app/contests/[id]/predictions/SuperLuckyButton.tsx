'use client'

import { useEffect, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Dices } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { useTranslations } from '../../../components/LocaleProvider'
import { cn } from '@/lib/utils'
import { saveGameweekPredictions } from './actions'

function randomGoal() {
  if (Math.random() < 0.75) {
    return Math.floor(Math.random() * 3)
  }
  return Math.floor(Math.random() * 6)
}

export default function SuperLuckyButton({
  contestId,
  matchIds,
}: {
  contestId: string
  matchIds: string[]
}) {
  const t = useTranslations()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [rolling, setRolling] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [, startTransition] = useTransition()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (matchIds.length === 0 || !mounted) return null

  const fillGameweek = async () => {
    setRolling(true)
    try {
      await saveGameweekPredictions(
        contestId,
        matchIds.map(matchId => ({
          matchId,
          homeScore: randomGoal(),
          awayScore: randomGoal(),
        }))
      )
      startTransition(() => {
        router.refresh()
      })
    } finally {
      window.setTimeout(() => setRolling(false), 450)
    }
  }

  return createPortal(
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] left-1/2 z-50 flex min-h-12 -translate-x-1/2 transform select-none items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 font-bold text-white shadow-[0_8px_30px_rgba(79,70,229,0.4)] transition-all duration-200 touch-manipulation hover:bg-indigo-700 active:scale-95 dark:bg-xactscore-accent dark:text-black dark:shadow-[0_0_28px_rgba(18,255,128,0.28)] dark:hover:brightness-110 lg:bottom-8"
        aria-label={t("I'm lucky")}
      >
        <Dices className={cn('h-5 w-5 text-white dark:text-black', rolling && 'animate-spin')} />
        <span className="text-sm font-bold uppercase tracking-wide dark:text-black">
          {t("I'm lucky")}
        </span>
      </button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={t('ATTENTION!')}
        titleClassName="text-center text-xl font-black uppercase tracking-[0.2em] text-xactscore-accent"
        description={t(
          "You're handing the whole gameweek to fate. Unlocked matches get a fresh roll and your current picks for those games get benched. No refunds, only glory."
        )}
        confirmLabel={t('Yes')}
        cancelLabel={t('No')}
        onConfirm={fillGameweek}
      />
    </>,
    document.body
  )
}
