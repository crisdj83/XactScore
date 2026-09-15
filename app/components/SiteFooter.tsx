import Link from 'next/link'
import { getTranslations } from '../../lib/i18n'
import { getServerLocale } from '../../lib/i18n-server'

export default function SiteFooter() {
  const t = getTranslations(getServerLocale())

  return (
    <footer className="mt-auto flex flex-col items-center gap-3 px-3 py-8 text-center">
      <nav className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-black uppercase tracking-wider text-zinc-500">
        <Link href="/help" className="inline-flex min-h-11 items-center px-2 hover:text-zinc-200">
          {t('Help')}
        </Link>
        <Link href="/privacy" className="inline-flex min-h-11 items-center px-2 hover:text-zinc-200">
          Privacy
        </Link>
        <Link href="/terms" className="inline-flex min-h-11 items-center px-2 hover:text-zinc-200">
          Terms
        </Link>
        <Link href="/login" className="inline-flex min-h-11 items-center px-2 hover:text-zinc-200">
          {t('Sign In')}
        </Link>
        <Link href="/login?mode=signup" className="inline-flex min-h-11 items-center px-2 hover:text-zinc-200">
          {t('Sign Up')}
        </Link>
      </nav>
      <div className="flex items-center gap-3">
        <a
          href="https://instagram.com/cristiansfariac"
          target="_blank"
          rel="noreferrer"
          aria-label="Instagram"
          className="inline-flex h-11 w-11 items-center justify-center text-zinc-400 transition-colors hover:text-zinc-100"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-none stroke-current" strokeWidth="1.75">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="0.75" className="fill-current stroke-none" />
          </svg>
        </a>
        <a
          href="https://youtube.com/@SyntiX-Dj"
          target="_blank"
          rel="noreferrer"
          aria-label="YouTube"
          className="inline-flex h-11 w-11 items-center justify-center text-zinc-400 transition-colors hover:text-zinc-100"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-none stroke-current" strokeWidth="1.75">
            <rect x="3" y="6" width="18" height="12" rx="3" />
            <path d="m10 9 5 3-5 3z" className="fill-current stroke-none" />
          </svg>
        </a>
      </div>
      <p className="max-w-xl text-xs font-medium tracking-wide text-zinc-500 dark:text-white/60">
        Built with 10% skill, 90% Googling, and love from Sfariac Cristian.
      </p>
      <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-xactscore-accent/70">
        <span aria-hidden="true">©</span>
        <span>XactScore</span>
      </p>
    </footer>
  )
}
