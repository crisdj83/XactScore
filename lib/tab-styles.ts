/** Shared frosted-glass tab / pill styles for nav uniformity */
export const tabBase =
  'inline-flex min-h-11 select-none items-center gap-1.5 rounded-full border px-3 text-[10px] font-bold uppercase tracking-wider outline-none transition-all duration-300 touch-manipulation [-webkit-tap-highlight-color:transparent] active:scale-95 focus-visible:outline-none sm:gap-2 sm:px-4 sm:text-xs'

export const tabActive =
  'border-transparent bg-transparent text-indigo-600 shadow-none backdrop-blur-md dark:border-xactscore-accent/35 dark:bg-xactscore-accent/10 dark:text-xactscore-accent'

export const tabInactive =
  'border-xactscore-border bg-xactscore-surface text-xactscore-muted backdrop-blur-sm hover:border-slate-200 hover:bg-slate-100 hover:text-xactscore-text dark:hover:border-white/15 dark:hover:bg-white/5 dark:hover:text-white'

/** Contest / hub tabs use rounded-xl but the same frosted selected look */
export const segmentBase =
  'inline-flex min-h-12 select-none items-center justify-center gap-1 rounded-xl border px-2 py-2.5 text-[10px] font-bold uppercase tracking-wider outline-none transition-all duration-300 touch-manipulation [-webkit-tap-highlight-color:transparent] active:scale-95 focus-visible:outline-none whitespace-nowrap sm:min-h-11 sm:gap-2 sm:text-xs md:px-4 md:text-sm'

export const segmentActive =
  'border-transparent bg-indigo-100 text-indigo-700 shadow-none backdrop-blur-md dark:border-xactscore-accent/35 dark:bg-xactscore-accent/10 dark:text-xactscore-accent'

export const segmentInactive =
  'border-transparent bg-transparent text-xactscore-muted hover:border-slate-200 hover:bg-slate-100 hover:text-xactscore-text dark:hover:bg-white/5 dark:hover:text-white'

/** iOS-style bottom tab bar item (mobile floating nav) */
export const iosTabItem =
  'flex min-h-12 min-w-0 flex-1 select-none flex-col items-center justify-center gap-0.5 rounded-full px-0.5 py-1.5 text-[9px] font-bold uppercase leading-tight tracking-normal transition-all duration-300 touch-manipulation [-webkit-tap-highlight-color:transparent] active:scale-90'
