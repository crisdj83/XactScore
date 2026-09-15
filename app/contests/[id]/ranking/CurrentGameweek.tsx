'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { BadgeDollarSign, Gauge, SlidersHorizontal, UserRound, Check, Crosshair, X } from 'lucide-react'
import { useTranslations } from '../../../components/LocaleProvider'
import { cn } from '@/lib/utils'
import { MemberLink } from '@/components/ui/member-link'
import { isUnoptimizedAvatar } from '../../../../lib/soccer-avatar'
import { teamTla } from '@/lib/team-tla'

type Fixture = {
  id: string
  matchday: number
  home: string
  away: string
  homeCrest?: string
  awayCrest?: string
  kickoff: string
  status: string
  score: string | null
  isLive: boolean
  liveMinute?: number | null
  homeScorers?: string[]
  awayScorers?: string[]
}

type Player = {
  id: string
  name: string
  prediction: string
  points: number | null
  avatar?: string | null
  outcome: 'zero' | 'close' | 'exact' | 'result'
}

function Crest({
  src,
  name,
  size = 40,
}: {
  src?: string
  name: string
  size?: number
}) {
  const inner = Math.round(size * 0.68)
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-white shadow-[0_1px_8px_rgb(0_0_0/0.35)]"
      style={{ width: size, height: size }}
      title={name}
    >
      {src ? (
        <Image src={src} alt="" width={inner} height={inner} draggable={false} className="pointer-events-none object-contain" />
      ) : (
        <span className="px-0.5 text-center text-[9px] font-semibold leading-none text-zinc-700 dark:font-black">
          {name.slice(0, 3).toUpperCase()}
        </span>
      )}
    </span>
  )
}

export default function CurrentGameweek({
  contestId,
  fixtures,
  playersByMatch,
  selectedMatchId,
}: {
  contestId: string
  fixtures: Fixture[]
  playersByMatch: Record<string, Player[]>
  selectedMatchId?: string
}) {
  const selectedFixtureFromUrl = selectedMatchId
    ? fixtures.find((fixture) => fixture.id === selectedMatchId)
    : undefined
  const defaultFixture =
    selectedFixtureFromUrl ||
    [...fixtures]
      .filter((fixture) => fixture.status === 'FINISHED')
      .sort((a, b) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime())[0] ||
    [...fixtures].sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()).at(-1) ||
    fixtures[0]
  const [selectedMatchday] = useState(defaultFixture?.matchday ?? 1)
  const t = useTranslations()

  const gameweekFixtures = useMemo(
    () =>
      fixtures
        .filter((fixture) => fixture.matchday === selectedMatchday)
        .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()),
    [fixtures, selectedMatchday]
  )

  const lastGameId = gameweekFixtures[gameweekFixtures.length - 1]?.id
  const [focusedMatchId, setFocusedMatchId] = useState(
    selectedFixtureFromUrl?.id && gameweekFixtures.some((fixture) => fixture.id === selectedFixtureFromUrl.id)
      ? selectedFixtureFromUrl.id
      : lastGameId
  )
  const [now, setNow] = useState<number | null>(null)
  const stripRef = useRef<HTMLDivElement>(null)
  const focusedMatchIdRef = useRef(focusedMatchId)
  focusedMatchIdRef.current = focusedMatchId

  const loopCopies = gameweekFixtures.length > 1 ? 3 : 1
  const stripItems = useMemo(
    () =>
      Array.from({ length: loopCopies }, (_, copy) =>
        gameweekFixtures.map((fixture) => ({ fixture, copy }))
      ).flat(),
    [gameweekFixtures, loopCopies]
  )

  useEffect(() => {
    setNow(Date.now())
  }, [])

  useEffect(() => {
    const strip = stripRef.current
    if (!strip || gameweekFixtures.length === 0) return

    const chips = () => strip.querySelectorAll<HTMLElement>('[data-fixture-id]')

    const setWidth = () => {
      const first = strip.querySelector<HTMLElement>('[data-copy="0"]')
      const second = strip.querySelector<HTMLElement>('[data-copy="1"]')
      if (!first || !second) return 0
      return second.offsetLeft - first.offsetLeft
    }

    const wrapIfNeeded = () => {
      if (loopCopies < 3) return 0
      const width = setWidth()
      if (width <= 0) return 0
      if (strip.scrollLeft < width * 0.5) {
        strip.scrollLeft += width
        return width
      }
      if (strip.scrollLeft >= width * 1.5) {
        strip.scrollLeft -= width
        return -width
      }
      return 0
    }

    const chipAtCenter = () => {
      const stripRect = strip.getBoundingClientRect()
      const center = stripRect.left + stripRect.width / 2
      let bestId = focusedMatchIdRef.current || ''
      let bestChip: HTMLElement | null = null
      let bestDist = Infinity
      chips().forEach((chip) => {
        const rect = chip.getBoundingClientRect()
        const dist = Math.abs(rect.left + rect.width / 2 - center)
        if (dist < bestDist) {
          bestDist = dist
          bestId = chip.dataset.fixtureId || ''
          bestChip = chip
        }
      })
      return { id: bestId, chip: bestChip }
    }

    let programmatic = false
    let programmaticTimer = 0
    const beginProgrammatic = (ms = 520) => {
      programmatic = true
      window.clearTimeout(programmaticTimer)
      programmaticTimer = window.setTimeout(() => {
        programmatic = false
      }, ms)
    }

    const scrollChipToCenter = (chip: HTMLElement, smooth: boolean) => {
      const stripRect = strip.getBoundingClientRect()
      const chipRect = chip.getBoundingClientRect()
      const delta =
        chipRect.left + chipRect.width / 2 - (stripRect.left + stripRect.width / 2)
      const max = Math.max(0, strip.scrollWidth - strip.clientWidth)
      if (smooth) beginProgrammatic()
      strip.scrollTo({
        left: Math.min(max, Math.max(0, strip.scrollLeft + delta)),
        behavior: smooth ? 'smooth' : 'auto',
      })
    }

    const middleChip = (id: string) =>
      strip.querySelector<HTMLElement>(
        `[data-copy="${loopCopies > 1 ? '1' : '0'}"][data-fixture-id="${CSS.escape(id)}"]`
      ) || strip.querySelector<HTMLElement>(`[data-fixture-id="${CSS.escape(id)}"]`)

    const centerFocused = (smooth: boolean) => {
      const selectedChip = middleChip(focusedMatchIdRef.current || '')
      if (selectedChip) scrollChipToCenter(selectedChip, smooth)
    }

    const showMatch = (id: string) => {
      if (!id) return
      focusedMatchIdRef.current = id
      setFocusedMatchId(id)
    }

    const normalizeToMiddle = () => {
      if (loopCopies < 3) return
      const { id } = chipAtCenter()
      const middle = id ? middleChip(id) : null
      if (middle) scrollChipToCenter(middle, false)
    }

    centerFocused(false)
    const frame = window.requestAnimationFrame(() => centerFocused(false))

    let pointerId: number | null = null
    let startX = 0
    let startLeft = 0
    let dragged = false
    let settleTimer = 0

    const onScroll = () => {
      if (programmatic) return
      wrapIfNeeded()
      const { id } = chipAtCenter()
      if (id && id !== focusedMatchIdRef.current) showMatch(id)
      if (pointerId !== null) return
      window.clearTimeout(settleTimer)
      settleTimer = window.setTimeout(() => {
        if (programmatic) return
        wrapIfNeeded()
        const settled = chipAtCenter()
        if (settled.chip) scrollChipToCenter(settled.chip, true)
        showMatch(settled.id)
        window.setTimeout(normalizeToMiddle, 520)
      }, 80)
    }

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return
      event.preventDefault()
      dragged = false
      pointerId = event.pointerId
      startX = event.clientX
      startLeft = strip.scrollLeft
      try {
        strip.setPointerCapture(event.pointerId)
      } catch {
        /* iOS Safari can throw InvalidStateError here; drag still works without capture */
      }
      strip.style.cursor = 'grabbing'
    }

    const onPointerMove = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return
      const dx = event.clientX - startX
      if (Math.abs(dx) < 8 && !dragged) return
      dragged = true
      strip.scrollLeft = startLeft - dx
      const jumped = wrapIfNeeded()
      if (jumped) startLeft += jumped
      const { id } = chipAtCenter()
      if (id && id !== focusedMatchIdRef.current) showMatch(id)
    }

    const onPointerUp = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return
      pointerId = null
      strip.style.cursor = ''
      try {
        strip.releasePointerCapture(event.pointerId)
      } catch {
        /* already released */
      }

      if (dragged) {
        wrapIfNeeded()
        const { id, chip } = chipAtCenter()
        if (chip) scrollChipToCenter(chip, true)
        showMatch(id)
        window.setTimeout(normalizeToMiddle, 520)
        return
      }

      const hit = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest('[data-fixture-id]') as HTMLElement | null
      if (!hit) return
      const id = hit.dataset.fixtureId || ''
      showMatch(id)
      scrollChipToCenter(hit, true)
      window.setTimeout(normalizeToMiddle, 520)
    }

    const onScrollEnd = () => {
      if (!programmatic) return
      programmatic = false
      window.clearTimeout(programmaticTimer)
      wrapIfNeeded()
      normalizeToMiddle()
    }

    const resize = new ResizeObserver(() => {
      if (programmatic) return
      centerFocused(false)
    })
    resize.observe(strip)

    strip.addEventListener('scroll', onScroll, { passive: true })
    strip.addEventListener('scrollend', onScrollEnd)
    strip.addEventListener('pointerdown', onPointerDown)
    strip.addEventListener('pointermove', onPointerMove)
    strip.addEventListener('pointerup', onPointerUp)
    strip.addEventListener('pointercancel', onPointerUp)

    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(settleTimer)
      window.clearTimeout(programmaticTimer)
      resize.disconnect()
      strip.removeEventListener('scroll', onScroll)
      strip.removeEventListener('scrollend', onScrollEnd)
      strip.removeEventListener('pointerdown', onPointerDown)
      strip.removeEventListener('pointermove', onPointerMove)
      strip.removeEventListener('pointerup', onPointerUp)
      strip.removeEventListener('pointercancel', onPointerUp)
    }
  }, [gameweekFixtures, loopCopies])

  const focusedIndex = gameweekFixtures.findIndex((fixture) => fixture.id === focusedMatchId)
  const selectedPlayers =
    focusedIndex >= 0 ? playersByMatch[gameweekFixtures[focusedIndex].id] || [] : []
  const selectedFixture = focusedIndex >= 0 ? gameweekFixtures[focusedIndex] : null
  const canReveal = selectedFixture && now !== null
    ? now >= new Date(selectedFixture.kickoff).getTime() - 30 * 60 * 1000
    : false
  const showSelectedScore = Boolean(
    selectedFixture &&
      (selectedFixture.isLive || selectedFixture.status === 'FINISHED') &&
      (selectedFixture.status === 'FINISHED' || canReveal)
  )

  return (
    <section className="content-panel mb-5 p-3 dark:border-xactscore-accent/40 sm:p-5 md:p-6">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:truncate dark:text-sm dark:font-black dark:tracking-wider dark:text-zinc-100 sm:dark:text-base">
          GW {selectedMatchday} · {t('Predictions')}
        </h3>
        {focusedIndex >= 0 ? (
          <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[10px] dark:font-bold dark:normal-case dark:tracking-normal dark:tabular-nums dark:text-zinc-500">
            {focusedIndex + 1} / {gameweekFixtures.length}
          </span>
        ) : null}
      </div>

      {gameweekFixtures.length > 1 ? (
        <div className="mt-3 min-w-0 max-w-full">
          <div
            ref={stripRef}
            className="relative flex h-[3.25rem] w-full min-w-0 cursor-grab touch-none items-center overflow-x-auto overscroll-x-contain rounded-2xl bg-slate-100 py-1 select-none active:cursor-grabbing [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden dark:bg-white/[0.08] sm:h-[3.5rem] sm:py-1.5"
            style={{ WebkitOverflowScrolling: 'touch' }}
            role="listbox"
            aria-label={t('Fixtures')}
          >
            {stripItems.map(({ fixture, copy }) => {
              const selected = fixture.id === focusedMatchId
              return (
                <button
                  key={`${copy}-${fixture.id}`}
                  type="button"
                  role="option"
                  tabIndex={-1}
                  aria-selected={selected}
                  data-fixture-id={fixture.id}
                  data-copy={String(copy)}
                  title={`${fixture.home} vs ${fixture.away}`}
                  aria-label={`${fixture.home} vs ${fixture.away}`}
                  className={cn(
                    'flex h-11 min-h-11 shrink-0 select-none items-center justify-center gap-1 whitespace-nowrap px-4 text-center text-sm sm:px-6',
                    selected
                      ? 'rounded-xl bg-white font-bold text-slate-900 shadow-sm dark:border-white/35 dark:bg-white/[0.1] dark:text-zinc-100 dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.28),0_0_0_1px_rgb(255_149_61/0.35)]'
                      : 'rounded-xl font-semibold text-slate-500 transition-colors hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                  )}
                >
                  <Crest src={fixture.homeCrest} name={fixture.home} size={18} />
                  <span className="text-xs font-bold tracking-wide">{teamTla({ name: fixture.home })}</span>
                  <span className="text-sm font-semibold text-slate-400">–</span>
                  <span className="text-xs font-bold tracking-wide">{teamTla({ name: fixture.away })}</span>
                  <Crest src={fixture.awayCrest} name={fixture.away} size={18} />
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-3">
        {selectedFixture ? (
          <div className="rounded-2xl border-0 bg-emerald-500/10 px-3 py-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:rounded-xl dark:border dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-none sm:px-4">
            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2 sm:gap-4">
              <div className="flex min-w-0 flex-col items-center gap-1.5">
                <Crest src={selectedFixture.homeCrest} name={selectedFixture.home} size={44} />
                <p className="w-full break-words text-center text-sm font-medium leading-tight text-slate-900 dark:text-xs dark:font-bold dark:text-zinc-100 sm:dark:text-sm">
                  {selectedFixture.home}
                </p>
                {showSelectedScore
                  ? (selectedFixture.homeScorers || []).map((scorer) => (
                      <p key={scorer} className="w-full break-words text-center text-xs leading-tight text-slate-500 dark:text-[10px] dark:text-zinc-500">
                        {scorer}
                      </p>
                    ))
                  : null}
              </div>

              <div className="flex flex-col items-center pt-1">
                <div className="flex items-center gap-1.5">
                  {selectedFixture.isLive ? (
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" title="Live" />
                  ) : null}
                  <span className="font-mono text-base font-semibold tabular-nums text-xactscore-accent dark:text-lg dark:font-black sm:dark:text-xl">
                    {showSelectedScore ? selectedFixture.score || '0 : 0' : '— : —'}
                  </span>
                </div>
                {!selectedFixture.isLive && selectedFixture.status === 'FINISHED' && showSelectedScore ? (
                  <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-500 dark:font-black">FT</span>
                ) : selectedFixture.isLive && typeof selectedFixture.liveMinute === 'number' ? (
                  <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-500 dark:font-black dark:text-emerald-400">
                    {`${selectedFixture.liveMinute}'`}
                  </span>
                ) : null}
              </div>

              <div className="flex min-w-0 flex-col items-center gap-1.5">
                <Crest src={selectedFixture.awayCrest} name={selectedFixture.away} size={44} />
                <p className="w-full break-words text-center text-sm font-medium leading-tight text-slate-900 dark:text-xs dark:font-bold dark:text-zinc-100 sm:dark:text-sm">
                  {selectedFixture.away}
                </p>
                {showSelectedScore
                  ? (selectedFixture.awayScorers || []).map((scorer) => (
                      <p key={scorer} className="w-full break-words text-center text-xs leading-tight text-slate-500 dark:text-[10px] dark:text-zinc-500">
                        {scorer}
                      </p>
                    ))
                  : null}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-400">No fixtures available for this gameweek.</p>
        )}
      </div>

      {focusedIndex >= 0 && (
        <div className="mt-4 border-t border-zinc-800 pt-3">
          <div className="mb-2 hidden items-center gap-2 px-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[10px] dark:font-black dark:tracking-wider dark:text-zinc-500 sm:grid sm:grid-cols-[4rem_minmax(0,1fr)_7rem_5rem]">
            <span className="flex items-center gap-1">
              <Gauge className="h-3.5 w-3.5" /> Rank
            </span>
            <span className="flex items-center gap-1">
              <UserRound className="h-3.5 w-3.5" /> User
            </span>
            <span className="flex items-center gap-1">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Pick
            </span>
            <span className="flex items-center gap-1">
              <BadgeDollarSign className="h-3.5 w-3.5" /> Points
            </span>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            {canReveal && selectedPlayers.length ? (
              selectedPlayers.map((player, index) => (
                <div
                  key={player.id}
                  className="group mb-2.5 flex min-h-10 items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-2.5 py-2.5 text-sm shadow-sm dark:mb-0 dark:rounded-lg dark:border-transparent dark:bg-zinc-950 dark:p-1.5 dark:px-3 dark:shadow-none sm:grid sm:grid-cols-[4rem_minmax(0,1fr)_7rem_5rem] sm:gap-2 sm:p-3.5"
                >
                  <span className="w-7 shrink-0 font-mono text-xs font-semibold text-xactscore-accent dark:font-black sm:w-auto sm:text-sm">
                    {index + 1}
                    {index === 0 ? 'st' : index === 1 ? 'nd' : index === 2 ? 'rd' : 'th'}
                  </span>
                  <MemberLink
                    href={`/contests/${contestId}/members/${player.id}`}
                    className="flex min-w-0 flex-1 items-center gap-1.5 no-underline sm:gap-2 sm:flex-none"
                  >
                    {player.avatar ? (
                      <Image
                        src={player.avatar}
                        alt=""
                        width={24}
                        height={24}
                        className="h-6 w-6 shrink-0 rounded-full object-cover sm:h-7 sm:w-7"
                        unoptimized={isUnoptimizedAvatar(player.avatar)}
                      />
                    ) : (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-xactscore-accent/20 text-xs font-semibold text-xactscore-accent dark:font-black sm:h-7 sm:w-7">
                        <UserRound className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1 break-words text-sm font-medium leading-snug [overflow-wrap:anywhere] group-hover:text-indigo-700 group-active:text-indigo-700 dark:font-bold dark:group-hover:text-xactscore-accent dark:group-active:text-xactscore-accent">
                      {player.name}
                    </span>
                  </MemberLink>
                  <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2 py-1 font-mono text-xs font-medium text-slate-900 dark:rounded-md dark:border-zinc-700 dark:bg-transparent dark:px-1.5 dark:py-0.5 dark:font-bold dark:text-zinc-200 sm:justify-self-start sm:px-2 sm:py-1 sm:text-sm">
                    {player.prediction}
                  </span>
                  <span
                    className={`inline-flex shrink-0 items-center gap-0.5 rounded-full border px-2 py-1 text-xs font-semibold sm:justify-self-start sm:gap-1 sm:px-2 sm:py-1 ${
                      player.outcome === 'exact'
                        ? 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:border-transparent dark:bg-xactscore-accent/15 dark:text-xactscore-accent dark:font-black'
                        : player.outcome === 'zero'
                          ? 'border-red-500/20 bg-red-500/10 text-red-600 dark:border-transparent dark:bg-red-400/15 dark:text-red-300 dark:font-black'
                          : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:border-transparent dark:bg-emerald-400/15 dark:text-emerald-300 dark:font-black'
                    }`}
                  >
                    {player.outcome === 'exact' ? (
                      <Crosshair className="h-3.5 w-3.5" />
                    ) : player.outcome === 'zero' ? (
                      <X className="h-3.5 w-3.5" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    {player.points === null ? '—' : `+${player.points}`}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-400">
                {canReveal
                  ? 'No predictions submitted for this match yet.'
                  : 'Predictions and points are hidden until 30 minutes before kickoff.'}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
