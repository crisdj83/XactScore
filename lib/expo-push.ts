/** Expo Push API helper for mobile match reminders. */

export type ExpoPushMessage = {
  to: string
  title: string
  body: string
  data?: Record<string, string>
  sound?: 'default' | null
  channelId?: string
}

type ExpoTicket = {
  status?: string
  id?: string
  message?: string
  details?: { error?: string }
}

export async function sendExpoPush(messages: ExpoPushMessage[]) {
  if (!messages.length) return { tickets: [] as ExpoTicket[], invalidTokens: [] as string[] }

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Expo push failed (${response.status}): ${text.slice(0, 200)}`)
  }

  const json = (await response.json()) as { data?: ExpoTicket | ExpoTicket[] }
  const tickets = Array.isArray(json.data) ? json.data : json.data ? [json.data] : []
  const invalidTokens: string[] = []

  tickets.forEach((ticket, index) => {
    if (ticket.status === 'error') {
      const err = ticket.details?.error || ''
      if (err === 'DeviceNotRegistered' || err === 'InvalidCredentials') {
        const token = messages[index]?.to
        if (token) invalidTokens.push(token)
      }
    }
  })

  return { tickets, invalidTokens }
}

export function leadHoursLabel(minutes: number) {
  const hours = Math.max(1, Math.round(minutes / 60))
  return hours === 1 ? '1 hour' : `${hours} hours`
}
