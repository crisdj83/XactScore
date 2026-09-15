'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Trophy,
  User as UserIcon,
  Home as HomeIcon,
  LogIn,
  MessageSquare,
  ShieldCheck,
  CircleHelp,
} from 'lucide-react'
import { useTranslations } from './LocaleProvider'
import { cn } from '@/lib/utils'
import { iosTabItem } from '@/lib/tab-styles'

type BottomNavProps = {
  isAdmin: boolean
  isLoggedIn: boolean
  unreadMessageCount: number
}

/**
 * iOS-style frosted glass bottom tab bar, shown only on mobile/tablet
 * viewports (hidden at the `lg` breakpoint where the top nav takes over).
 */
export default function BottomNav({ isAdmin, isLoggedIn, unreadMessageCount }: BottomNavProps) {
  const pathname = usePathname() || ''
  const t = useTranslations()

  useEffect(() => {
    const root = document.documentElement
    if (!root.classList.contains('android')) return

    const sync = () => {
      const viewport = window.visualViewport
      const inset = viewport
        ? Math.max(0, window.innerHeight - (viewport.offsetTop + viewport.height))
        : 0
      root.style.setProperty('--android-vv-bottom', `${Math.round(inset)}px`)
    }

    sync()
    window.visualViewport?.addEventListener('resize', sync)
    window.visualViewport?.addEventListener('scroll', sync)
    window.addEventListener('resize', sync)
    return () => {
      window.visualViewport?.removeEventListener('resize', sync)
      window.visualViewport?.removeEventListener('scroll', sync)
      window.removeEventListener('resize', sync)
    }
  }, [])

  const items = isLoggedIn
    ? [
        { href: '/', label: t('Dashboard'), short: t('Home'), icon: HomeIcon },
        { href: '/contests', label: t('Contests'), short: t('Leagues'), icon: Trophy },
        { href: '/profile', label: t('Profile'), short: t('Profile'), icon: UserIcon },
        { href: '/messages', label: t('Messages'), short: t('Messages'), icon: MessageSquare, badge: unreadMessageCount },
        { href: '/help', label: t('Help'), short: t('Help'), icon: CircleHelp },
        ...(isAdmin ? [{ href: '/admin', label: t('Admin'), short: t('Admin'), icon: ShieldCheck }] : []),
      ]
    : [
        { href: '/', label: t('Dashboard'), short: t('Home'), icon: HomeIcon },
        { href: '/help', label: t('Help'), short: t('Help'), icon: CircleHelp },
        { href: '/login', label: t('Sign In'), short: t('Sign In'), icon: LogIn },
      ]

  return (
    <nav
      aria-label="Primary"
      className="ios-tab-bar fixed bottom-0 left-0 z-50 w-full border-t border-slate-200 bg-white/90 pb-[max(env(safe-area-inset-bottom),1rem)] pt-2 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90 lg:hidden"
    >
      <div className="mx-auto flex max-w-2xl items-center gap-1 overflow-visible px-1.5 sm:gap-1.5 sm:px-2">
        {items.map(({ href, label, short, icon: Icon, badge }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              prefetch={false}
              aria-label={label}
              className={cn(
                iosTabItem,
                active ? 'ios-tab-item-active text-indigo-600 dark:text-xactscore-accent' : 'text-xactscore-muted hover:text-xactscore-text'
              )}
            >
              <span className="relative shrink-0">
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                {badge ? (
                  <span className="absolute -right-2 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black leading-none text-white ring-2 ring-zinc-950/70">
                    {badge > 9 ? '9+' : badge}
                  </span>
                ) : null}
              </span>
              <span className="max-w-full truncate leading-tight">{short}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
