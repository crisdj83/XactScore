import { getTranslations } from '../../lib/i18n'
import type { Locale } from '../../lib/i18n'

export default function ProductPreview({ locale }: { locale: Locale }) {
  const t = getTranslations(locale)

  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="pointer-events-none absolute -inset-8 rounded-[2rem] bg-slate-300/30 blur-3xl dark:bg-xactscore-accent/15" aria-hidden />
      <div className="content-panel relative space-y-3 p-3 dark:border-white/10 dark:!bg-[#111111]/90 dark:shadow-2xl dark:shadow-black/60">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:border-white/10 dark:bg-black/40 dark:shadow-none">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500 dark:text-xactscore-muted">
              {t('Your pick')}
            </p>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600 dark:text-xactscore-accent">
              ✓ {t('LOCKED')}
            </p>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex w-16 flex-col items-center gap-1.5">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-red-600 text-sm font-black text-white">
                A
              </span>
              <span className="text-xs font-bold uppercase tracking-wide text-slate-900 dark:text-white">ARS</span>
            </div>
            <div className="flex items-center gap-2 text-2xl font-black tabular-nums text-slate-900 dark:text-white">
              <span>2</span>
              <span className="text-zinc-500">–</span>
              <span>1</span>
            </div>
            <div className="flex w-16 flex-col items-center gap-1.5">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white">
                C
              </span>
              <span className="text-xs font-bold uppercase tracking-wide text-slate-900 dark:text-white">CHE</span>
            </div>
          </div>
          <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-xactscore-muted">
            {t('Locks 60 min before kickoff')}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:border-white/10 dark:bg-black/40 dark:shadow-none">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500 dark:text-xactscore-muted">
              {t('League table')}
            </p>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500 dark:text-xactscore-muted">
              GW 22
            </p>
          </div>
          <ul className="mt-3 space-y-1 text-sm">
            {[
              { place: '1', name: 'Alex', pts: '48', trophy: true },
              { place: '2', name: 'Sam', pts: '45' },
              { place: '3', name: 'You', pts: '44', you: true },
            ].map((row) => (
              <li
                key={row.place}
                className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${
                  row.you
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-xactscore-accent/10 dark:text-xactscore-accent dark:shadow-[0_0_24px_rgba(18,255,128,0.12)]'
                    : 'bg-white text-slate-900 dark:bg-transparent dark:text-white'
                }`}
              >
                <span className="font-bold">
                  <span
                    className={`mr-2 tabular-nums ${row.you ? 'dark:text-xactscore-accent' : 'text-zinc-500 dark:text-xactscore-muted'}`}
                  >
                    {row.place}
                  </span>
                  {row.trophy ? <span className="mr-1">🏆</span> : null}
                  {row.name}
                </span>
                <span className="font-black tabular-nums">
                  {row.pts} {t('pts')}
                </span>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </div>
  )
}
