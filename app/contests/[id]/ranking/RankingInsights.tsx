'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import {
  BarChart3,
  ChevronDown,
  EyeOff,
  TrendingUp,
  Users,
} from 'lucide-react'

type RankingPlayer = {
  id: string
  username: string
  totalPoints: number
  exactResults: number
  closeResults: number
  rightOutcome: number
  totalPlayed: number
  scoredMatches: number
  accuracy: number
}

type EvolutionRow = {
  matchday: number
  standings: Array<{ playerId: string; rank: number; points: number }>
}

type TrendPrediction = {
  userId: string
  username: string
  homeScore: number
  awayScore: number
  points: number | null
}

type PredictionTrend = {
  matchId: string
  matchday: number
  kickoff: string
  status: string
  homeTeam: { name: string; shortName?: string; crest?: string; rank?: number; form?: string }
  awayTeam: { name: string; shortName?: string; crest?: string; rank?: number; form?: string }
  actualScore: string | null
  revealed: boolean
  predictionCount: number
  averageHome: number | null
  averageAway: number | null
  homeWinPct: number
  drawPct: number
  awayWinPct: number
  popularScore: string | null
  predictions: TrendPrediction[]
}

type Labels = Record<string, string>

export default function RankingInsights({
  players,
  evolution,
  trends,
  labels,
}: {
  players: RankingPlayer[]
  evolution: EvolutionRow[]
  trends: PredictionTrend[]
  labels: Labels
}) {
  const [selectedPlayer, setSelectedPlayer] = useState('all')
  const [showAllTrends, setShowAllTrends] = useState(false)

  const selectedName = players.find(player => player.id === selectedPlayer)?.username
  const chartRows = evolution.filter(row => row.standings.length > 0)
  const maxRank = Math.max(players.length, 1)
  const chartWidth = 720
  const chartHeight = 260
  const chartPadding = { top: 24, right: 20, bottom: 34, left: 42 }
  const xFor = (index: number) => chartPadding.left + (
    chartRows.length > 1
      ? (index / (chartRows.length - 1)) * (chartWidth - chartPadding.left - chartPadding.right)
      : (chartWidth - chartPadding.left - chartPadding.right) / 2
  )
  const yFor = (rank: number) => chartPadding.top + (
    ((rank - 1) / Math.max(maxRank - 1, 1)) * (chartHeight - chartPadding.top - chartPadding.bottom)
  )

  const series = useMemo(() => players.map(player => ({
    player,
    points: chartRows.map(row => {
      const standing = row.standings.find(item => item.playerId === player.id)
      return standing ? { rank: standing.rank, points: standing.points } : { rank: players.length, points: 0 }
    }),
  })), [chartRows, players])

  const visibleTrends = showAllTrends ? trends : trends.slice(0, 12)
  const formatPercent = (value: number) => `${Math.round(value)}%`
  const formatAverage = (value: number | null) => value === null ? '—' : value.toFixed(1)

  return (
    <div className="mt-8 space-y-8">
      {false && <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xactscore-accent">
              <TrendingUp className="h-5 w-5" />
              <span className="text-xs font-black uppercase tracking-widest">{labels.evolution}</span>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight text-gray-900">{labels.evolutionTitle}</h3>
            <p className="mt-1 text-sm text-gray-500">{labels.evolutionDescription}</p>
          </div>
          {players.length > 0 && (
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500">
              {labels.focusPlayer}
              <select
                value={selectedPlayer}
                onChange={event => setSelectedPlayer(event.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-bold normal-case tracking-normal text-gray-900"
              >
                <option value="all">{labels.allPlayers}</option>
                {players.map(player => <option key={player.id} value={player.id}>{player.username}</option>)}
              </select>
            </label>
          )}
        </div>

        {chartRows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">
            {labels.noEvolution}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl bg-gray-950 p-3">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                role="img"
                aria-label={labels.evolutionTitle}
                className="h-auto min-w-[620px] w-full"
              >
                <title>{labels.evolutionTitle}</title>
                {[1, Math.ceil(maxRank / 2), maxRank].filter((rank, index, values) => values.indexOf(rank) === index).map(rank => (
                  <g key={rank}>
                    <line x1={chartPadding.left} x2={chartWidth - chartPadding.right} y1={yFor(rank)} y2={yFor(rank)} stroke="#374151" strokeDasharray="3 5" />
                    <text x={chartPadding.left - 10} y={yFor(rank) + 4} textAnchor="end" fill="#9ca3af" fontSize="11">{rank}</text>
                  </g>
                ))}
                {chartRows.map((row, index) => (
                  <text key={row.matchday} x={xFor(index)} y={chartHeight - 8} textAnchor="middle" fill="#9ca3af" fontSize="10">
                    {row.matchday}
                  </text>
                ))}
                {series.map(({ player, points }) => {
                  if (selectedPlayer !== 'all' && player.id !== selectedPlayer) return null
                  const colour = player.id === selectedPlayer ? '#12ff80' : '#34d399'
                  const line = points.map((point, index) => `${xFor(index)},${yFor(point.rank)}`).join(' ')
                  return (
                    <g key={player.id}>
                      <polyline points={line} fill="none" stroke={colour} strokeWidth={player.id === selectedPlayer ? 4 : 2} opacity={selectedPlayer === 'all' ? 0.6 : 1} strokeLinejoin="round" strokeLinecap="round" />
                      {points.map((point, index) => (
                        <circle key={`${player.id}-${index}`} cx={xFor(index)} cy={yFor(point.rank)} r={player.id === selectedPlayer ? 4 : 2.5} fill={colour}>
                          <title>{`${player.username}: ${labels.matchday} ${chartRows[index].matchday}, ${labels.rank} ${point.rank}, ${point.points} ${labels.points.toLowerCase()}`}</title>
                        </circle>
                      ))}
                    </g>
                  )
                })}
              </svg>
            </div>
            <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full min-w-[520px] text-sm">
                <thead className="bg-gray-950 text-left text-[10px] font-black uppercase tracking-wider text-gray-300">
                  <tr>
                    <th className="px-4 py-3">{labels.matchday}</th>
                    {selectedPlayer === 'all'
                      ? <><th className="px-4 py-3">{labels.leader}</th><th className="px-4 py-3 text-center">{labels.points}</th><th className="px-4 py-3 text-center">{labels.rank}</th></>
                      : <><th className="px-4 py-3">{selectedName || labels.player}</th><th className="px-4 py-3 text-center">{labels.points}</th><th className="px-4 py-3 text-center">{labels.rank}</th></>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {chartRows.map(row => {
                    const standings = [...row.standings].sort((a, b) => a.rank - b.rank)
                    const selected = selectedPlayer === 'all' ? standings[0] : standings.find(item => item.playerId === selectedPlayer)
                    const player = selected ? players.find(item => item.id === selected.playerId) : undefined
                    return (
                      <tr key={row.matchday} className="text-gray-700">
                        <td className="px-4 py-3 font-bold">{labels.matchday} {row.matchday}</td>
                        <td className="px-4 py-3 font-semibold">{player?.username || '—'}</td>
                        <td className="px-4 py-3 text-center font-black text-xactscore-accent">{selected?.points ?? 0}</td>
                        <td className="px-4 py-3 text-center font-black text-gray-900">{selected ? selected.rank : '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>}

      {false && <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
        <div className="mb-5">
          <div className="mb-1 flex items-center gap-2 text-xactscore-accent">
            <BarChart3 className="h-5 w-5" />
            <span className="text-xs font-black uppercase tracking-widest">{labels.predictionTrends}</span>
          </div>
          <h3 className="text-xl font-black uppercase tracking-tight text-gray-900">{labels.predictionTrendsTitle}</h3>
          <p className="mt-1 text-sm text-gray-500">{labels.predictionTrendsDescription}</p>
        </div>
        {trends.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">{labels.noTrends}</div>
        ) : (
          <div className="space-y-3">
            {visibleTrends.map(trend => (
              <details key={trend.matchId} className="group overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                <summary className="flex cursor-pointer list-none flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between [&::-webkit-details-marker]:hidden">
                  <div className="flex min-w-0 items-center gap-2">
                    {trend.homeTeam.crest && <Image src={trend.homeTeam.crest} alt="" width={28} height={28} className="h-7 w-7 object-contain" />}
                    {trend.homeTeam.rank && <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-black text-gray-600">#{trend.homeTeam.rank}</span>}
                    <span className="truncate font-bold text-gray-900">{trend.homeTeam.shortName || trend.homeTeam.name}</span>
                    <span className="text-xs font-black text-xactscore-accent">vs</span>
                    <span className="truncate font-bold text-gray-900">{trend.awayTeam.shortName || trend.awayTeam.name}</span>
                    {trend.awayTeam.rank && <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-black text-gray-600">#{trend.awayTeam.rank}</span>}
                    {trend.awayTeam.crest && <Image src={trend.awayTeam.crest} alt="" width={28} height={28} className="h-7 w-7 object-contain" />}
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold text-gray-500">
                    <span>{labels.matchday} {trend.matchday}</span>
                    <span>{trend.revealed ? `${trend.predictionCount} ${labels.predictions}` : labels.hidden}</span>
                    <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                  </div>
                </summary>
                <div className="border-t border-gray-200 bg-white px-4 py-4">
                  {!trend.revealed ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <EyeOff className="h-4 w-4" /> {labels.hiddenUntilReveal}
                    </div>
                  ) : (
                    <>
                      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-bold text-gray-500">
                        <span>{labels.form}: {trend.homeTeam.form || '—'} · {trend.homeTeam.shortName || trend.homeTeam.name} / {trend.awayTeam.form || '—'} · {trend.awayTeam.shortName || trend.awayTeam.name}</span>
                        {trend.actualScore && <span className="font-mono text-sm font-black text-gray-900">{labels.finalScore}: {trend.actualScore}</span>}
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                        <div className="rounded-lg bg-gray-50 p-3"><span className="block text-[10px] font-black uppercase text-gray-400">{labels.averageScore}</span><strong className="mt-1 block font-mono text-lg text-gray-900">{formatAverage(trend.averageHome)} : {formatAverage(trend.averageAway)}</strong></div>
                        <div className="rounded-lg bg-emerald-50 p-3"><span className="block text-[10px] font-black uppercase text-emerald-700">{trend.homeTeam.shortName || trend.homeTeam.name}</span><strong className="mt-1 block text-lg text-emerald-700">{formatPercent(trend.homeWinPct)}</strong></div>
                        <div className="rounded-lg bg-amber-50 p-3"><span className="block text-[10px] font-black uppercase text-amber-700">{labels.draw}</span><strong className="mt-1 block text-lg text-amber-700">{formatPercent(trend.drawPct)}</strong></div>
                        <div className="rounded-lg bg-blue-50 p-3"><span className="block text-[10px] font-black uppercase text-blue-700">{trend.awayTeam.shortName || trend.awayTeam.name}</span><strong className="mt-1 block text-lg text-blue-700">{formatPercent(trend.awayWinPct)}</strong></div>
                        <div className="rounded-lg bg-xactscore-accent/10 p-3"><span className="block text-[10px] font-black uppercase text-xactscore-accent">{labels.popularScore}</span><strong className="mt-1 block font-mono text-lg text-xactscore-accent">{trend.popularScore || '—'}</strong></div>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-b border-gray-100 pb-2 text-xs font-black uppercase tracking-wider text-gray-500">
                        <span className="flex items-center gap-2"><Users className="h-4 w-4" /> {labels.otherPredictions}</span>
                        <span>{trend.predictionCount} {labels.submitted}</span>
                      </div>
                      {trend.predictions.length > 0 ? (
                        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {trend.predictions.map(prediction => (
                            <div key={`${trend.matchId}-${prediction.userId}`} className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm">
                              <span className="min-w-0 flex-1 break-words font-semibold leading-snug text-gray-700 [overflow-wrap:anywhere]">{prediction.username}</span>
                              <span className="ml-0 flex shrink-0 items-center gap-2 font-mono font-black text-gray-900">
                                {prediction.homeScore} : {prediction.awayScore}
                                {prediction.points !== null && <span className="rounded-full bg-xactscore-accent px-1.5 py-0.5 font-sans text-[10px] text-xactscore-bg">+{prediction.points}</span>}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : <p className="mt-3 text-sm text-gray-500">{labels.noPredictions}</p>}
                    </>
                  )}
                </div>
              </details>
            ))}
            {trends.length > 12 && (
              <button type="button" onClick={() => setShowAllTrends(value => !value)} className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-xs font-black uppercase tracking-wider text-gray-700 transition-colors hover:border-xactscore-accent hover:text-xactscore-accent">
                {showAllTrends ? labels.showLess : `${labels.showAll} (${trends.length})`}
              </button>
            )}
          </div>
        )}
      </section>}

    </div>
  )
}
