import { LogOut } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '../../lib/supabase/server'
import { signOut } from '../actions'
import NavLinks from './NavLinks'
import BottomNav from './BottomNav'
import LanguageSwitcher from './LanguageSwitcher'
import ThemeToggle from './ThemeToggle'
import InstallPwaBar from './InstallPwaBar'
import { getTranslations, defaultLocale } from '../../lib/i18n'
import { getServerLocale } from '../../lib/i18n-server'
import { loginPath } from '../../lib/urls'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default async function Navbar() {
  let t = getTranslations(defaultLocale)
  try {
    t = getTranslations(getServerLocale())
  } catch {
    /* keep default locale */
  }
  let user: { id: string } | null = null
  let unreadMessageCount = 0
  let isAdmin = false

  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data.user
    if (user) {
      const { data: memberships } = await supabase.from('contest_members').select('contest_id').eq('user_id', user.id)
      const contestIds = (memberships || []).map((membership) => membership.contest_id)
      const [{ data: profile }, { data: messageReadState }] = await Promise.all([
        supabase.from('users').select('is_global_admin').eq('id', user.id).maybeSingle(),
        supabase.from('message_reads').select('last_read_at').eq('user_id', user.id).maybeSingle(),
      ])
      isAdmin = profile?.is_global_admin === true
      const lastRead = messageReadState?.last_read_at || '1970-01-01T00:00:00.000Z'

      const [{ count: newMessageCount }, { count: newReplyCount }] = await Promise.all([
        contestIds.length
          ? supabase
              .from('messages')
              .select('id', { count: 'exact', head: true })
              .in('contest_id', contestIds)
              .gt('created_at', lastRead)
          : Promise.resolve({ count: 0 }),
        contestIds.length
          ? supabase
              .from('message_replies')
              .select('id, messages!inner(contest_id)', { count: 'exact', head: true })
              .in('messages.contest_id', contestIds)
              .gt('created_at', lastRead)
          : Promise.resolve({ count: 0 }),
      ])
      unreadMessageCount = (newMessageCount || 0) + (newReplyCount || 0)
    }
  } catch (error) {
    console.error('Navbar failed to load session:', error)
  }

  return (
    <>
      <header className="sticky top-0 left-0 z-50 w-full border-b border-slate-200 bg-white/90 px-4 pb-3 pt-[max(env(safe-area-inset-top),1rem)] backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
        <div className="app-topbar flex w-full min-w-0 flex-nowrap items-center gap-1.5">
          <NavLinks isAdmin={isAdmin} isLoggedIn={Boolean(user)} unreadMessageCount={unreadMessageCount} />

          <div className="app-topbar-actions ml-auto flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
            {user ? (
              <form action={signOut} className="inline-flex shrink-0">
                <button
                  type="submit"
                  title={t('Sign Out')}
                  aria-label={t('Sign Out')}
                  className="inline-flex h-11 w-11 shrink-0 select-none items-center justify-center rounded-full border border-xactscore-border bg-xactscore-surface text-xactscore-text shadow-sm outline-none transition-all duration-300 touch-manipulation hover:border-slate-200 hover:bg-slate-100 active:scale-90 dark:border-xactscore-accent/30 dark:bg-xactscore-accent/10 dark:text-xactscore-accent dark:hover:border-xactscore-accent/40 dark:hover:bg-xactscore-accent/20"
                >
                  <LogOut className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
                </button>
              </form>
            ) : (
              <span className="inline-flex shrink-0 items-center overflow-hidden rounded-full border border-slate-200 bg-slate-50 dark:border-white/15 dark:bg-white/5">
                <Link
                  href={loginPath()}
                  className="inline-flex h-11 min-h-11 select-none items-center px-3 text-xs font-black uppercase tracking-wider text-slate-700 touch-manipulation dark:text-xactscore-muted"
                >
                  {t('Sign In')}
                </Link>
                <Link
                  href={loginPath({ mode: 'signup' })}
                  className={cn(
                    buttonVariants({ size: 'sm' }),
                    'h-11 min-h-11 rounded-none rounded-r-full px-3 text-xs uppercase tracking-wider'
                  )}
                >
                  {t('Sign Up')}
                </Link>
              </span>
            )}
          </div>
        </div>
        <InstallPwaBar />
      </header>
      <BottomNav isAdmin={isAdmin} isLoggedIn={Boolean(user)} unreadMessageCount={unreadMessageCount} />
    </>
  )
}
