import { CircleDot, Goal, Medal, Trophy } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const ICONS: LucideIcon[] = [CircleDot, Goal, Trophy, Medal]

function iconIndex(value: string) {
  return Array.from(value).reduce((total, character) => total + character.charCodeAt(0), 0) % ICONS.length
}

export default function ContestIcon({ contestId, size = 'md' }: { contestId: string; size?: 'xs' | 'sm' | 'md' }) {
  const Icon = ICONS[iconIndex(contestId || 'xactscore')]
  const dimensions = size === 'xs' ? 'h-5 w-5' : size === 'sm' ? 'h-9 w-9' : 'h-12 w-12'
  const iconSize = size === 'xs' ? 'h-3 w-3' : size === 'sm' ? 'h-5 w-5' : 'h-6 w-6'
  const radius = size === 'xs' ? 'rounded-md' : 'rounded-xl'

  return (
    <span className={`inline-flex ${dimensions} shrink-0 items-center justify-center ${radius} border border-emerald-300/40 bg-gradient-to-br from-emerald-400 to-emerald-700 text-white shadow-lg dark:border-xactscore-accent/40 dark:from-xactscore-accent dark:to-emerald-700 dark:text-black`}>
      <Icon className={iconSize} aria-hidden="true" />
    </span>
  )
}
