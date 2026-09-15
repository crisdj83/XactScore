import { Activity, CircleDot } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function XactScoreLogo({
  compact = false,
  hideWordmarkOnMobile = false,
}: {
  compact?: boolean
  hideWordmarkOnMobile?: boolean
}) {
  return (
    <div className={`flex items-center ${compact ? 'gap-2' : 'gap-3'}`}>
      <div
        className={`relative flex items-center justify-center rounded-2xl bg-black text-[#12ff80] shadow-lg shadow-[0_0_24px_rgba(18,255,128,0.25)] ${compact ? 'h-9 w-9' : 'h-14 w-14'}`}
      >
        <Activity className={compact ? 'h-5 w-5' : 'h-8 w-8'} strokeWidth={3} />
        <CircleDot
          className={`absolute ${compact ? 'right-1 top-1 h-2.5 w-2.5' : 'right-1.5 top-1.5 h-3.5 w-3.5'}`}
          fill="currentColor"
          strokeWidth={2.5}
        />
      </div>
      <span
        className={cn(
          'brand-wordmark whitespace-nowrap font-black leading-none tracking-[-0.06em] text-xactscore-text',
          compact ? 'text-[1.45rem] sm:text-3xl' : 'text-4xl md:text-5xl',
          hideWordmarkOnMobile && 'hidden sm:inline'
        )}
      >
        <span className="dark:text-white">Xact</span>
        <span className="dark:text-xactscore-accent">Score</span>
      </span>
    </div>
  )
}
