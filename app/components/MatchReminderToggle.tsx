'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { useTranslations } from './LocaleProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '../../lib/supabase/client'
import { normalizeVapidPublicKey, vapidApplicationServerKey, vapidApplicationServerKeyBuffer } from '../../lib/vapid'
import { leadHoursLabel } from '../../lib/expo-push'

const LEAD_OPTIONS = [60, 120, 180, 240] as const
type LeadMinutes = (typeof LEAD_OPTIONS)[number]

function isStandaloneDisplay() {
  if (typeof window === 'undefined') return false
  const media = window.matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches
  const ios = 'standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  return media || ios
}

function isIosDevice() {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function normalizeLead(value: unknown): LeadMinutes {
  const n = Number(value)
  if (n === 60 || n === 120 || n === 180 || n === 240) return n
  return 120
}

export default function MatchReminderToggle() {
  const t = useTranslations()
  const bundledKey = normalizeVapidPublicKey(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '')
  const [vapidKey, setVapidKey] = useState(bundledKey)
  const [enabled, setEnabled] = useState(false)
  const [leadMinutes, setLeadMinutes] = useState<LeadMinutes>(120)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [iosNeedsInstall, setIosNeedsInstall] = useState(false)
  const [supported, setSupported] = useState(true)
  // Bump whenever the user toggles so a slow initial GET cannot overwrite the new state.
  const statusEpoch = useRef(0)

  useEffect(() => {
    const pushOk = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
    setIosNeedsInstall(isIosDevice() && !isStandaloneDisplay())
    if (!pushOk) {
      setSupported(false)
      return
    }

    const epoch = statusEpoch.current
    void fetch('/api/push/subscribe')
      .then((response) => response.json())
      .then((data: { enabled?: boolean; configured?: boolean; publicKey?: string }) => {
        const liveKey = normalizeVapidPublicKey(data.publicKey)
        if (liveKey) setVapidKey(liveKey)
        setSupported(data.configured !== false && Boolean(liveKey || bundledKey))
        if (epoch !== statusEpoch.current) return
        setEnabled(Boolean(data.enabled))
      })
      .catch(() => {
        setSupported(Boolean(bundledKey))
      })

    void createClient()
      .auth.getUser()
      .then(async ({ data: { user } }) => {
        if (!user) return
        const { data } = await createClient()
          .from('users')
          .select('reminder_lead_minutes, reminders_enabled')
          .eq('id', user.id)
          .maybeSingle()
        if (!data || epoch !== statusEpoch.current) return
        setLeadMinutes(normalizeLead(data.reminder_lead_minutes))
      })
      .catch(() => undefined)
  }, [bundledKey])

  async function saveLead(next: LeadMinutes, remindersOn: boolean) {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase
      .from('users')
      .update({
        reminder_lead_minutes: next,
        reminders_enabled: remindersOn,
      })
      .eq('id', user.id)
    if (error && (error.code === '42703' || error.message.includes('reminder_'))) {
      // Prefs migration not applied yet — push sub alone still works.
      return
    }
    if (error) throw new Error(error.message)
  }

  async function enable() {
    setMessage('')
    const key = vapidKey || bundledKey
    if (!key) {
      setMessage(t('Match reminders are not configured yet.'))
      return
    }
    if (iosNeedsInstall) {
      setMessage(t('On iPhone, install XactScore to your Home Screen first, then turn reminders on from that app icon.'))
      return
    }

    setPending(true)
    try {
      let bytes: Uint8Array<ArrayBuffer>
      let buffer: ArrayBuffer
      try {
        bytes = vapidApplicationServerKey(key)
        buffer = vapidApplicationServerKeyBuffer(key)
      } catch {
        setMessage(t('Push notifications are misconfigured. Check the VAPID public key.'))
        return
      }

      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setMessage(t('Notifications were blocked. Allow them in your phone settings, then try again.'))
        return
      }

      const registration =
        (await navigator.serviceWorker.getRegistration('/sw.js')) ||
        (await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }))
      await navigator.serviceWorker.ready

      const existing = await registration.pushManager.getSubscription()
      if (existing) await existing.unsubscribe()

      const subscription = await subscribePush(registration, bytes, buffer, key)

      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      })
      if (!response.ok) {
        throw new Error(t('Could not save reminder subscription'))
      }
      await saveLead(leadMinutes, true)
      statusEpoch.current += 1
      setEnabled(true)
    } catch (error) {
      if (isVapidSubscribeError(error)) {
        setMessage(t('Push notifications are misconfigured. Check the VAPID public key.'))
      } else {
        setMessage(error instanceof Error ? error.message : t('Could not enable match reminders'))
      }
    } finally {
      setPending(false)
    }
  }

  async function disable() {
    setMessage('')
    setPending(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      await subscription?.unsubscribe()
      await fetch('/api/push/subscribe', { method: 'DELETE' })
      await saveLead(leadMinutes, false)
      statusEpoch.current += 1
      setEnabled(false)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('Could not disable match reminders'))
    } finally {
      setPending(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-6 md:p-8">
        <div className="space-y-4">
          <div>
            <h3 className="mb-1 flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-lg dark:font-bold dark:text-zinc-100">
              <Bell className="h-5 w-5 text-xactscore-accent" /> {t('Notifications')}
            </h3>
            <p className="text-sm text-slate-500 dark:text-zinc-400">
              {t('Get a phone notification before kickoff if you still need to put scores in, and when someone posts in your league. Picks lock 60 minutes before kickoff.')}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">
              {t('Remind me')}
            </p>
            <div className="flex flex-wrap gap-2">
              {LEAD_OPTIONS.map((minutes) => {
                const selected = leadMinutes === minutes
                return (
                  <button
                    key={minutes}
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      setLeadMinutes(minutes)
                      void saveLead(minutes, enabled).catch(() => undefined)
                    }}
                    className={`min-h-10 rounded-xl border px-3 text-sm font-extrabold transition ${
                      selected
                        ? 'border-xactscore-accent bg-xactscore-accent/15 text-xactscore-accent'
                        : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300'
                    }`}
                  >
                    {leadHoursLabel(minutes).replace(' hours', 'h').replace(' hour', 'h')}
                  </button>
                )
              })}
            </div>
          </div>

          {!supported ? (
            <p className="text-sm text-zinc-500">{t('Match reminders are not configured yet.')}</p>
          ) : (
            <Button
              type="button"
              disabled={pending}
              onClick={() => void (enabled ? disable() : enable())}
              className="uppercase tracking-wider"
            >
              {pending ? '…' : enabled ? t('Turn notifications off') : t('Turn notifications on')}
            </Button>
          )}

          {iosNeedsInstall ? (
            <p className="text-sm text-zinc-500">
              {t('On iPhone, install XactScore to your Home Screen first, then turn reminders on from that app icon.')}{' '}
              <Link href="/help/install#ios" className="text-xactscore-accent underline">
                {t('Install on iPhone')}
              </Link>
            </p>
          ) : null}

          {message ? <p className="text-sm text-red-600 dark:text-red-300">{message}</p> : null}
        </div>
      </CardContent>
    </Card>
  )
}

function isVapidSubscribeError(error: unknown) {
  const raw = error instanceof Error ? `${error.name} ${error.message}` : String(error)
  return /invalid characters|atob|applicationServerKey|InvalidAccessError|DataError|Invalid raw ECDSA/i.test(raw)
}

async function subscribePush(
  registration: ServiceWorkerRegistration,
  bytes: Uint8Array<ArrayBuffer>,
  buffer: ArrayBuffer,
  key: string
) {
  const attempts: Array<string | BufferSource> = [bytes, buffer, key]
  let lastError: unknown
  for (const applicationServerKey of attempts) {
    try {
      return await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      })
    } catch (error) {
      lastError = error
      if (!isVapidSubscribeError(error)) throw error
    }
  }
  throw lastError instanceof Error ? lastError : new Error('VAPID_PUBLIC_KEY_INVALID')
}
