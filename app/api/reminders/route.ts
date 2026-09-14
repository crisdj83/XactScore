import { NextResponse } from 'next/server'
import { getPLMatches } from '../../../lib/football'
import { isMatchInContestSeason } from '../../../lib/contest-season'
import { isCronAuthorized } from '../../../lib/cron-auth'
import { leadHoursLabel, sendExpoPush } from '../../../lib/expo-push'
import { createAdminClient } from '../../../lib/supabase/admin'
import { isPushConfigured, sendWebPush } from '../../../lib/web-push'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** Widest lead (4h) + window padding so all prefs fit one fixture scan. */
const MAX_LEAD_MS = 4 * 60 * 60 * 1000
const WINDOW_MS = 30 * 60 * 1000
const DEFAULT_LEAD_MINUTES = 120

type UpcomingMatch = {
  id: number
  utcDate: string
  matchday?: number | null
  status?: string
  homeTeam?: { name?: string; shortName?: string }
  awayTeam?: { name?: string; shortName?: string }
}

type Membership = {
  user_id: string
  contest_id: string
  contests: { id: string; season_length: string | null } | { id: string; season_length: string | null }[] | null
}

function contestFromMembership(membership: Membership) {
  return Array.isArray(membership.contests) ? membership.contests[0] : membership.contests
}

function matchLabel(match: UpcomingMatch) {
  const home = match.homeTeam?.shortName || match.homeTeam?.name || 'Home'
  const away = match.awayTeam?.shortName || match.awayTeam?.name || 'Away'
  return `${home} vs ${away}`
}

function normalizeLeadMinutes(value: unknown) {
  const n = Number(value)
  if (n === 60 || n === 120 || n === 180 || n === 240) return n
  return DEFAULT_LEAD_MINUTES
}

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 })
  }

  let admin
  try {
    admin = createAdminClient()
  } catch {
    return NextResponse.json({ error: 'Server configuration error: Missing Supabase keys' }, { status: 500 })
  }

  const webPushReady = isPushConfigured()

  try {
    const data = await getPLMatches()
    const now = Date.now()
    const horizonEnd = now + MAX_LEAD_MS + WINDOW_MS

    const upcomingPool = ((data.matches || []) as UpcomingMatch[]).filter((match) => {
      if (!['TIMED', 'SCHEDULED'].includes(String(match.status || ''))) return false
      const kickoff = new Date(match.utcDate).getTime()
      return Number.isFinite(kickoff) && kickoff >= now && kickoff <= horizonEnd
    })

    if (upcomingPool.length === 0) {
      return NextResponse.json({ success: true, sent: 0, matches: 0 })
    }

    const matchIds = upcomingPool.map((match) => Number(match.id)).filter((id) => Number.isFinite(id))

    const [{ data: subscriptions }, { data: expoTokens }] = await Promise.all([
      webPushReady
        ? admin.from('push_subscriptions').select('user_id, endpoint, p256dh, auth')
        : Promise.resolve({ data: [] as Array<{ user_id: string; endpoint: string; p256dh: string; auth: string }> }),
      admin.from('expo_push_tokens').select('user_id, token, platform').then(
        (res) => res,
        () => ({ data: [] as Array<{ user_id: string; token: string; platform: string }> }),
      ),
    ])

    const webUserIds = new Set((subscriptions || []).map((row) => row.user_id as string))
    const expoUserIds = new Set((expoTokens || []).map((row) => row.user_id as string))
    const candidateIds = Array.from(new Set([...Array.from(webUserIds), ...Array.from(expoUserIds)]))

    if (candidateIds.length === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
        subscribers: 0,
        matches: upcomingPool.length,
        skipped: webPushReady ? undefined : 'No Expo tokens and web push not configured',
      })
    }

    const [{ data: prefs }, { data: memberships }, { data: predictions }, { data: alreadySent }] =
      await Promise.all([
        admin
          .from('users')
          .select('id, reminder_lead_minutes, reminders_enabled')
          .in('id', candidateIds)
          .then(
            (res) => res,
            () => ({ data: [] as Array<{ id: string; reminder_lead_minutes: number; reminders_enabled: boolean }> }),
          ),
        admin
          .from('contest_members')
          .select('user_id, contest_id, contests(id, season_length)')
          .in('user_id', candidateIds),
        admin
          .from('predictions')
          .select('user_id, contest_id, match_id')
          .in('user_id', candidateIds)
          .in('match_id', matchIds),
        admin
          .from('match_reminders')
          .select('user_id, match_id')
          .in('user_id', candidateIds)
          .in('match_id', matchIds),
      ])

    const prefsByUser = new Map(
      (prefs || []).map((row) => [
        row.id as string,
        {
          leadMinutes: normalizeLeadMinutes(row.reminder_lead_minutes),
          enabled: row.reminders_enabled === true,
        },
      ]),
    )

    const predicted = new Set(
      (predictions || []).map((row) => `${row.user_id}:${row.contest_id}:${Number(row.match_id)}`),
    )
    const sent = new Set((alreadySent || []).map((row) => `${row.user_id}:${Number(row.match_id)}`))
    const membershipsByUser = new Map<string, Membership[]>()
    for (const membership of (memberships || []) as Membership[]) {
      const list = membershipsByUser.get(membership.user_id) || []
      list.push(membership)
      membershipsByUser.set(membership.user_id, list)
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://xactscore.app'
    let sentCount = 0
    const invalidExpoTokens: string[] = []

    for (const userId of candidateIds) {
      const hasWeb = webUserIds.has(userId)
      const hasExpo = expoUserIds.has(userId)
      if (!hasWeb && !hasExpo) continue

      const pref = prefsByUser.get(userId) || {
        leadMinutes: DEFAULT_LEAD_MINUTES,
        enabled: false,
      }

      // Expo-only users must opt in. Web Push subscription remains legacy opt-in.
      if (hasExpo && !hasWeb && !pref.enabled) continue
      // Explicit mobile disable should stop Expo; web sub alone still fires.
      if (hasExpo && hasWeb && prefsByUser.has(userId) && !pref.enabled) {
        // Still allow web delivery below; Expo skipped if disabled.
      }

      const leadMs = pref.leadMinutes * 60 * 1000
      const windowStart = now + leadMs - WINDOW_MS
      const windowEnd = now + leadMs + WINDOW_MS

      const upcoming = upcomingPool.filter((match) => {
        const kickoff = new Date(match.utcDate).getTime()
        return kickoff >= windowStart && kickoff <= windowEnd
      })
      if (upcoming.length === 0) continue

      const userMemberships = membershipsByUser.get(userId) || []
      const missing: UpcomingMatch[] = []
      let deepLinkContestId: string | null = null

      for (const match of upcoming) {
        if (sent.has(`${userId}:${Number(match.id)}`)) continue
        const relevant = userMemberships.filter((membership) => {
          const contest = contestFromMembership(membership)
          return contest && isMatchInContestSeason(match, contest.season_length)
        })
        if (relevant.length === 0) continue

        const needsPick = relevant.some(
          (membership) => !predicted.has(`${userId}:${membership.contest_id}:${Number(match.id)}`),
        )
        if (!needsPick) continue

        missing.push(match)
        if (!deepLinkContestId) deepLinkContestId = relevant[0].contest_id
        else if (deepLinkContestId !== relevant[0].contest_id) deepLinkContestId = 'many'
      }

      if (missing.length === 0) continue

      const leadLabel = leadHoursLabel(pref.leadMinutes)
      const title = 'XactScore'
      const body =
        missing.length === 1
          ? `${matchLabel(missing[0])} kicks off in about ${leadLabel}. Put your score in before picks lock.`
          : `${missing.length} matches kick off in about ${leadLabel}. Put your scores in before they lock.`
      const path =
        deepLinkContestId && deepLinkContestId !== 'many'
          ? `/contests/${deepLinkContestId}/predictions`
          : '/contests'
      const url = `${siteUrl}${path}`

      let delivered = false

      if (webPushReady && hasWeb) {
        const userSubs = (subscriptions || []).filter((row) => row.user_id === userId)
        for (const sub of userSubs) {
          try {
            const result = await sendWebPush(
              { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
              { title, body, url, tag: 'xactscore-reminders' },
            )
            if (!result.gone) delivered = true
          } catch {
            // Keep trying other devices.
          }
        }
      }

      if (hasExpo && pref.enabled) {
        const tokens = (expoTokens || [])
          .filter((row) => row.user_id === userId)
          .map((row) => row.token as string)
        if (tokens.length) {
          try {
            const result = await sendExpoPush(
              tokens.map((to) => ({
                to,
                title,
                body,
                sound: 'default' as const,
                data: { url: path },
              })),
            )
            if (result.tickets.some((t) => t.status === 'ok')) delivered = true
            invalidExpoTokens.push(...result.invalidTokens)
          } catch {
            // Expo send failed for this user; web may still have delivered.
          }
        }
      }

      if (!delivered) continue

      await admin.from('match_reminders').upsert(
        missing.map((match) => ({
          user_id: userId,
          match_id: Number(match.id),
        })),
        { onConflict: 'user_id,match_id' },
      )
      sentCount += 1
    }

    if (invalidExpoTokens.length) {
      await admin.from('expo_push_tokens').delete().in('token', Array.from(new Set(invalidExpoTokens)))
    }

    return NextResponse.json({
      success: true,
      sent: sentCount,
      matches: upcomingPool.length,
      subscribers: candidateIds.length,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Reminders failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
