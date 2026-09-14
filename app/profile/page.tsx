'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { updateProfile, changePassword, deleteAccount } from './actions'
import { User, Shield, Image as ImageIcon, RefreshCw, Clock, ChevronDown, Lock, Trash2 } from 'lucide-react'
import MatchReminderToggle from '../components/MatchReminderToggle'
import { createClient } from '../../lib/supabase/client'
import { useTranslations } from '../components/LocaleProvider'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import {
  PREMIER_LEAGUE_TEAMS,
  WORLD_TEAMS,
  findFavoriteTeam,
  type FavoriteTeam,
} from '../../lib/favorite-teams'
import { soccerAvatarPath } from '../../lib/soccer-avatar'
import Image from 'next/image'

function FavoriteTeamGroup({
  label,
  teams,
  onSelect,
}: {
  label: string
  teams: FavoriteTeam[]
  onSelect: (name: string) => void
}) {
  return (
    <>
      <div className="sticky top-0 z-[1] border-y border-slate-100 bg-slate-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-[10px] dark:font-bold dark:tracking-wider">
        {label}
      </div>
      {teams.map((team) => (
        <div
          key={team.name}
          className="flex cursor-pointer items-center gap-3 px-4 py-2 transition-colors hover:bg-slate-100 dark:hover:bg-zinc-800"
          onClick={() => onSelect(team.name)}
        >
          <Image src={team.crest} alt="" width={24} height={24} className="h-6 w-6 object-contain" />
          <span className="text-sm font-medium text-slate-900 dark:text-zinc-200">{team.name}</span>
        </div>
      ))}
    </>
  )
}

function ProfileBanners() {
  const searchParams = useSearchParams()
  const t = useTranslations()
  const success = searchParams.get('success')
  const error = searchParams.get('error')
  if (!success && !error) return null
  return (
    <div className="space-y-3">
      {success ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-300">
          {t(success)}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-medium text-red-300">
          {t(error)}
        </div>
      ) : null}
    </div>
  )
}

function ProfileLoadingSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-[calc(8rem+env(safe-area-inset-bottom,0px))] pt-2">
      <div className="mb-8 space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-64" />
      </div>
      <Card>
        <CardContent className="space-y-8 p-6 md:p-8">
          <div className="flex flex-col items-start gap-6 md:flex-row">
            <Skeleton className="h-32 w-32 rounded-xl" />
            <div className="w-full flex-1 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-48" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-11 w-36" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ProfilePageInner() {
  const router = useRouter()
  const t = useTranslations()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [profile, setProfile] = useState<{
    id: string
    email: string | null
    username: string | null
    avatar_url: string | null
    pending_avatar_url: string | null
    favorite_team: string | null
    country: string | null
    quote: string | null
    is_global_admin: boolean | null
  } | null>(null)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [isPending, setIsPending] = useState(false)

  const [favoriteTeam, setFavoriteTeam] = useState('')
  const [motto, setMotto] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      try {
        const supabase = createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError) throw authError
        if (!user) {
          router.replace('/login')
          return
        }

        const { data, error: profileError } = await supabase
          .from('users')
          .select('id, email, username, avatar_url, pending_avatar_url, favorite_team, country, quote, is_global_admin')
          .eq('id', user.id)
          .single()
        if (profileError) throw profileError

        setProfile(data)
        setFavoriteTeam(data?.favorite_team || '')
        setMotto(data?.quote || '')
        if (data?.pending_avatar_url) {
          setAvatarUrl(data.pending_avatar_url)
          setIsPending(true)
        } else {
          setAvatarUrl(data?.avatar_url || '')
        }
      } catch (error) {
        console.error('Profile load error:', error)
        setLoadError(error instanceof Error ? error.message : 'Unable to load your profile.')
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [router])

  const generateRandomAvatar = () => {
    const randomSeed = Math.random().toString(36).slice(2, 10)
    setAvatarUrl(soccerAvatarPath(randomSeed, favoriteTeam || undefined))
    setIsPending(false)
  }

  const selectedTeamData = findFavoriteTeam(favoriteTeam)

  if (loading) return <ProfileLoadingSkeleton />
  if (loadError) {
    return (
      <div className="mx-auto mt-8 max-w-md rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center text-red-300">
        <p className="font-bold">{t('Could not load your profile')}</p>
        <p className="mt-1 text-sm">{loadError}</p>
        <Button onClick={() => window.location.reload()} className="mt-4 uppercase tracking-wider">
          {t('Try Again')}
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-[calc(8rem+env(safe-area-inset-bottom,0px))] pt-2">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Breadcrumb items={[{ label: t('Your Profile') }]} className="mb-2 hidden md:flex" />
          <h1 className="flex items-center gap-3 text-xl font-semibold uppercase tracking-tight text-slate-900 md:text-2xl dark:text-3xl dark:font-black dark:text-zinc-100 md:dark:text-4xl">
            <User className="h-6 w-6 text-xactscore-accent md:h-7 md:w-7" />
            {t('Your Profile')}
          </h1>
        </div>
      </div>

      <Suspense fallback={null}>
        <ProfileBanners />
      </Suspense>

      <Card className={showDropdown ? 'relative z-20 overflow-visible' : 'overflow-visible'}>
        <CardContent className="overflow-visible p-6 md:p-8">
          <form action={updateProfile} className="space-y-8">
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-lg dark:font-bold dark:text-zinc-100">
                <ImageIcon className="h-5 w-5 text-xactscore-accent" /> {t('Profile Picture / Logo')}
              </h3>

              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="relative w-fit shrink-0">
                  <div
                    className={`flex h-32 w-32 items-center justify-center overflow-hidden rounded-xl border-2 bg-zinc-950
                    ${isPending ? 'border-amber-400/60 opacity-75' : 'border-dashed border-zinc-700'}
                  `}
                  >
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt="Profile Preview"
                        width={128}
                        height={128}
                        className="h-full w-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="text-sm text-zinc-500">{t('No Image')}</span>
                    )}
                  </div>

                  {isPending && (
                    <Badge variant="accent" className="absolute -bottom-3 -right-3 flex items-center gap-1 shadow-sm">
                      <Clock className="h-3 w-3" /> {t('Pending')}
                    </Badge>
                  )}
                </div>

                <input type="hidden" name="avatar_url" value={avatarUrl} />

                <Button
                  type="button"
                  variant="secondary"
                  onClick={generateRandomAvatar}
                  className="h-auto min-h-11 w-full max-w-full whitespace-normal px-3 text-left leading-snug sm:w-auto"
                >
                  <RefreshCw className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 text-wrap">{t('Auto-Generate Avatar')}</span>
                </Button>
              </div>
            </div>

            <hr className="border-zinc-800" />

            <div className="relative grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <Label htmlFor="username">{t('Username')}</Label>
                <Input
                  id="username"
                  type="text"
                  name="username"
                  defaultValue={profile?.username || ''}
                  required
                  placeholder="ScoreMaster99"
                />
              </div>

              <div className={`relative ${showDropdown ? 'z-30' : ''}`}>
                <Label className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-xactscore-accent" /> {t('Favorite Team')}
                </Label>

                <input type="hidden" name="favorite_team" value={favoriteTeam} />

                <button
                  type="button"
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="focus-frost flex h-11 w-full items-center justify-between rounded-xl border-0 bg-slate-100 px-4 py-2 text-left text-base text-slate-900 outline-none ring-0 transition-[border-color,box-shadow] focus:ring-0 dark:border dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-100"
                >
                  <div className="flex items-center gap-3">
                    {selectedTeamData ? (
                      <>
                        <Image
                          src={selectedTeamData.crest}
                          alt={selectedTeamData.name}
                          width={20}
                          height={20}
                          className="h-5 w-5 object-contain"
                        />
                        <span>{selectedTeamData.name}</span>
                      </>
                    ) : favoriteTeam ? (
                      <span>{favoriteTeam}</span>
                    ) : (
                      <span className="text-zinc-500">{t('Select a team...')}</span>
                    )}
                  </div>
                  <ChevronDown className={`h-4 w-4 text-zinc-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />

                    <div className="absolute bottom-full z-50 mb-1 max-h-[min(20rem,calc(100dvh-10rem))] w-full overflow-y-auto rounded-xl border-0 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:border dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-lg dark:shadow-black/40">
                      <div
                        className="flex cursor-pointer items-center gap-3 border-b border-slate-100 px-4 py-3 text-slate-500 hover:bg-slate-100 dark:border-zinc-800 dark:hover:bg-zinc-800"
                        onClick={() => {
                          setFavoriteTeam('')
                          setShowDropdown(false)
                        }}
                      >
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] dark:bg-zinc-800">
                          ⚽
                        </div>
                        {t('None')}
                      </div>

                      <FavoriteTeamGroup
                        label={t('Premier League')}
                        teams={PREMIER_LEAGUE_TEAMS}
                        onSelect={(name) => {
                          setFavoriteTeam(name)
                          setShowDropdown(false)
                        }}
                      />
                      <FavoriteTeamGroup
                        label={t('World clubs')}
                        teams={WORLD_TEAMS}
                        onSelect={(name) => {
                          setFavoriteTeam(name)
                          setShowDropdown(false)
                        }}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="quote">{t('Player motto')}</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="quote"
                    type="text"
                    name="quote"
                    value={motto}
                    maxLength={18}
                    onChange={(event) => setMotto(event.target.value.slice(0, 18))}
                    placeholder={t('Enter a short motto')}
                    className="min-w-0 flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      setMotto(
                        ['Play to win', 'Trust the process', 'Never stop scoring', 'Own the table'][
                          Math.floor(Math.random() * 4)
                        ]
                      )
                    }
                  >
                    {t('Generate motto')}
                  </Button>
                </div>
                <p className="text-xs font-semibold tracking-wide text-slate-500">{motto.length}/18</p>
              </div>
            </div>

            <div className="flex justify-end border-t border-zinc-800 pt-4">
              <Button type="submit" className="relative z-0 uppercase tracking-wider">
                {t('Save Profile')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <MatchReminderToggle />

      <Card>
        <CardContent className="p-6 md:p-8">
          <form action={changePassword} className="space-y-6">
            <div>
              <h3 className="mb-1 flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-lg dark:font-bold dark:text-zinc-100">
                <Lock className="h-5 w-5 text-xactscore-accent" /> {t('Settings')}
              </h3>
              <p className="text-sm text-slate-500 dark:text-zinc-400">{t('Change Password')}</p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label htmlFor="current_password">{t('Current Password')}</Label>
                <Input
                  id="current_password"
                  type="password"
                  name="current_password"
                  autoComplete="current-password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                />
              </div>
              <div>
                <Label htmlFor="new_password">{t('New Password')}</Label>
                <Input
                  id="new_password"
                  type="password"
                  name="new_password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                />
                <span className="mt-1 block text-xs text-zinc-500">
                  {t('Password must be at least 6 characters.')}
                </span>
              </div>
              <div>
                <Label htmlFor="confirm_password">{t('Confirm new password')}</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  name="confirm_password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex justify-end border-t border-zinc-800 pt-4">
              <Button type="submit" className="uppercase tracking-wider">
                {t('Update Password')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-red-500/30">
        <CardContent className="space-y-4 p-6 md:p-8">
          <div>
            <h3 className="mb-1 flex items-center gap-2 text-base font-semibold text-red-300">
              <Trash2 className="h-5 w-5" /> {t('Delete account')}
            </h3>
            <p className="text-sm text-slate-500 dark:text-zinc-400">
              Permanently deletes your account, profile, predictions, messages, and leagues you
              administer. This cannot be undone.
            </p>
          </div>
          <form
            action={deleteAccount}
            onSubmit={(event) => {
              if (
                !window.confirm(
                  'Delete your account permanently? This cannot be undone.',
                )
              ) {
                event.preventDefault()
              }
            }}
          >
            <Button type="submit" variant="destructive" className="uppercase tracking-wider">
              <Trash2 className="h-4 w-4" /> {t('Delete account')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileLoadingSkeleton />}>
      <ProfilePageInner />
    </Suspense>
  )
}
