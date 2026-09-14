import { login, signup } from './actions'
import Link from 'next/link'
import { Trophy } from 'lucide-react'
import { getTranslations } from '../../lib/i18n'
import { getServerLocale } from '../../lib/i18n-server'
import { loginPath, safeNextPath } from '../../lib/urls'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default async function LoginPage(props: {
  searchParams: Promise<{ message?: string; next?: string; mode?: string }>
}) {
  const searchParams = await props.searchParams
  const t = getTranslations(getServerLocale())
  const isSuccessMessage = searchParams?.message?.includes('Check your email')
  const next = safeNextPath(searchParams?.next)
  const isSignup = searchParams?.mode === 'signup'

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-start py-4 sm:justify-center sm:py-8">
      <Card>
        <CardContent className="p-6 md:p-8">
          <div className="mb-6 flex flex-col items-center">
            <div className="mb-3 rounded-xl border border-slate-200 bg-slate-100 p-3 dark:border-transparent dark:bg-zinc-950">
              <Trophy className="h-8 w-8 text-slate-600 dark:text-xactscore-accent" />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100">
              {t('Welcome to XactScore')}
            </h1>
            <p className="mt-1 text-center text-sm text-zinc-400">
              {next.startsWith('/join/')
                ? t('Sign in to join your league.')
                : t('Sign in to predict and compete')}
            </p>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-1.5 rounded-full border border-slate-200 bg-slate-100 p-1 dark:border-white/10 dark:bg-white/5">
            <Link
              href={loginPath({ next, message: searchParams?.message })}
              className={cn(
                'inline-flex h-11 min-h-11 select-none items-center justify-center rounded-full text-xs font-black uppercase tracking-wider transition touch-manipulation',
                !isSignup
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-amber-500 dark:text-zinc-950'
                  : 'text-slate-500 hover:text-slate-800 dark:text-orange-100/70 dark:hover:text-orange-50'
              )}
            >
              {t('Sign In')}
            </Link>
            <Link
              href={loginPath({ mode: 'signup', next, message: searchParams?.message })}
              className={cn(
                'inline-flex h-11 min-h-11 select-none items-center justify-center rounded-full text-xs font-black uppercase tracking-wider transition touch-manipulation',
                isSignup
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-amber-500 dark:text-zinc-950'
                  : 'text-slate-500 hover:text-slate-800 dark:text-orange-100/70 dark:hover:text-orange-50'
              )}
            >
              {t('Sign Up')}
            </Link>
          </div>

          <form className="flex w-full flex-col gap-4 text-zinc-100">
            <input type="hidden" name="next" value={next} />
            <div>
              <Label htmlFor="email">{t('Email')}</Label>
              <Input id="email" name="email" placeholder="you@example.com" required type="email" />
            </div>

            <div>
              <Label htmlFor="password">{t('Password')}</Label>
              <Input
                id="password"
                type="password"
                name="password"
                placeholder="••••••••"
                minLength={6}
              />
              <span className="mt-1 block text-xs text-zinc-500">
                {t('Password must be at least 6 characters.')}
              </span>
            </div>

            {searchParams?.message && (
              <div
                className={`rounded-xl p-3 text-center text-sm ${
                  isSuccessMessage
                    ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : 'border border-red-500/30 bg-red-500/10 text-red-300'
                }`}
              >
                {searchParams.message}
              </div>
            )}

            <button
              formAction={isSignup ? signup : login}
              className={cn(buttonVariants(), 'mt-1 w-full uppercase tracking-wider')}
            >
              {isSignup ? t('Sign Up') : t('Sign In')}
            </button>

            {!isSignup ? (
              <div className="text-center">
                <Link
                  href="/forgot-password"
                  className="inline-flex min-h-11 items-center justify-center text-sm text-slate-500 underline transition-colors hover:text-indigo-600 dark:hover:text-xactscore-accent"
                >
                  {t('Forgot Password?')}
                </Link>
              </div>
            ) : null}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
