'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { useTranslations } from './LocaleProvider'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const TEAMS = [
  { name: 'Arsenal', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/359.png' },
  { name: 'Aston Villa', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/362.png' },
  { name: 'Bournemouth', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/349.png' },
  { name: 'Brentford', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/337.png' },
  { name: 'Brighton', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/331.png' },
  { name: 'Chelsea', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/363.png' },
  { name: 'Crystal Palace', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/384.png' },
  { name: 'Everton', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/368.png' },
  { name: 'Fulham', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/370.png' },
  { name: 'Ipswich Town', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/379.png' },
  { name: 'Leicester City', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/375.png' },
  { name: 'Liverpool', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/364.png' },
  { name: 'Manchester City', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/382.png' },
  { name: 'Manchester United', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/360.png' },
  { name: 'Newcastle United', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/361.png' },
  { name: 'Nottingham Forest', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/393.png' },
  { name: 'Southampton', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/376.png' },
  { name: 'Tottenham Hotspur', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/367.png' },
  { name: 'West Ham United', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/371.png' },
  { name: 'Wolverhampton Wanderers', crest: 'https://a.espncdn.com/i/teamlogos/soccer/500/380.png' }
]

function compactClubName(name: string) {
  if (name.length <= 11) return name
  return name
    .replace(/\s+Wanderers$/i, '')
    .replace(/\s+Hotspur$/i, '')
    .replace(/\s+(City|Town)$/i, '')
}

export type ScoreData = {
  id: string | number;
  homeTeam: string;
  awayTeam: string;
  homeCrest?: string;
  awayCrest?: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string; 
}

export type NextMatchData = {
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeCrest?: string;
  awayCrest?: string;
  venue?: string | null;
}

export default function HeroBanner({ 
  nextMatch, 
  recentScores,
  predictHref = '/contests',
}: { 
  nextMatch: NextMatchData | null;
  recentScores: ScoreData[];
  predictHref?: string;
}) {
  const [timeLeft, setTimeLeft] = useState({ days: '00', hours: '00', minutes: '00', seconds: '00' })
  const t = useTranslations()

  useEffect(() => {
    if (!nextMatch?.date) return;

    const countdownDate = new Date(nextMatch.date).getTime()

    const updateCountdown = () => {
      const now = new Date().getTime()
      const distance = countdownDate - now

      if (distance <= 0) {
        setTimeLeft({ days: '00', hours: '00', minutes: '00', seconds: '00' })
        return
      }

      setTimeLeft({
        days: String(Math.floor(distance / (1000 * 60 * 60 * 24))).padStart(2, '0'),
        hours: String(Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(2, '0'),
        minutes: String(Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0'),
        seconds: String(Math.floor((distance % (1000 * 60)) / 1000)).padStart(2, '0')
      })
    }

    updateCountdown()
    const timer = setInterval(updateCountdown, 1000)

    return () => clearInterval(timer)
  }, [nextMatch])

  const getTeamLogo = (teamName: string) => {
    const team = TEAMS.find(t => t.name === teamName)
    return team ? team.crest : ''
  }

  const unit = (label: string, value: string, accent = false) => (
    <div className="flex flex-col items-center">
      <span className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-xactscore-accent">{label}</span>
      <div
        className={`flex min-w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white p-3 font-mono text-sm font-bold text-slate-900 sm:min-w-12 sm:text-base ${
          accent
            ? 'dark:border-xactscore-accent dark:bg-xactscore-accent/10 dark:text-xactscore-accent dark:shadow-none'
            : 'dark:border-white/80 dark:bg-black/20 dark:text-white dark:shadow-none'
        }`}
      >
        {value}
      </div>
    </div>
  )

  return (
    <div className="hero-score-card relative flex w-full flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:rounded-xl dark:border-white/10 dark:bg-gradient-to-bl dark:from-black dark:via-[#0a0a0a] dark:to-black dark:p-0 dark:shadow-2xl dark:shadow-black/40 sm:p-6 lg:flex-row">
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scroll-y {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        .animate-marquee-y {
          animation: scroll-y 28s linear infinite;
        }
        .animate-marquee-y:hover {
          animation-play-state: paused;
        }
        .hero-glass-veil {
          -webkit-mask-image: linear-gradient(to bottom, #000 0%, #000 48%, rgba(0,0,0,0.45) 72%, transparent 100%);
          mask-image: linear-gradient(to bottom, #000 0%, #000 48%, rgba(0,0,0,0.45) 72%, transparent 100%);
        }
        .scores-crossfade {
          -webkit-mask-image: linear-gradient(
            to bottom,
            transparent 0%,
            rgba(0,0,0,0.18) 10%,
            rgba(0,0,0,0.55) 20%,
            #000 34%,
            #000 70%,
            rgba(0,0,0,0.35) 88%,
            transparent 100%
          );
          mask-image: linear-gradient(
            to bottom,
            transparent 0%,
            rgba(0,0,0,0.18) 10%,
            rgba(0,0,0,0.55) 20%,
            #000 34%,
            #000 70%,
            rgba(0,0,0,0.35) 88%,
            transparent 100%
          );
        }
        @media (min-width: 1024px) {
          .hero-glass-veil {
            -webkit-mask-image: linear-gradient(to right, #000 0%, #000 46%, rgba(0,0,0,0.4) 72%, transparent 100%);
            mask-image: linear-gradient(to right, #000 0%, #000 46%, rgba(0,0,0,0.4) 72%, transparent 100%);
          }
          .scores-crossfade {
            -webkit-mask-image: linear-gradient(
              to right,
              transparent 0%,
              rgba(0,0,0,0.25) 8%,
              rgba(0,0,0,0.7) 18%,
              #000 32%,
              #000 100%
            ),
            linear-gradient(
              to bottom,
              #000 0%,
              #000 62%,
              rgba(0,0,0,0.45) 82%,
              transparent 100%
            );
            mask-image: linear-gradient(
              to right,
              transparent 0%,
              rgba(0,0,0,0.25) 8%,
              rgba(0,0,0,0.7) 18%,
              #000 32%,
              #000 100%
            ),
            linear-gradient(
              to bottom,
              #000 0%,
              #000 62%,
              rgba(0,0,0,0.45) 82%,
              transparent 100%
            );
            -webkit-mask-composite: source-in;
            mask-composite: intersect;
          }
        }
      `}} />

      <div className="relative z-10 w-full pb-6 text-zinc-900 dark:text-white lg:w-1/2 lg:pb-0 lg:pr-6">
        <div
          aria-hidden
          className="hero-glass-veil pointer-events-none absolute inset-0 bg-transparent dark:bg-white/[0.08]"
        />
        <div className="relative z-10 flex h-full flex-col justify-between p-1 sm:p-8 lg:p-10">
        <div>
          <p className="hero-headline mb-1 max-w-md text-[1.35rem] font-extrabold uppercase leading-[1.1] tracking-tight text-slate-900 sm:mb-3 sm:text-4xl lg:text-5xl dark:bg-none dark:bg-clip-border dark:text-white">
            <span className="block text-slate-900 sm:inline dark:text-white">
              {t('Call the scores.')}
            </span>{' '}
            <span className="block text-slate-900 sm:inline dark:text-xactscore-accent">{t('Own the table.')}</span>
          </p>
          <p className="mb-2 max-w-md text-sm font-medium leading-snug text-slate-600 dark:text-xactscore-muted sm:mb-4 sm:leading-6">
            {t('Call every Premier League score. Compete in your league. Climb the table.')}
          </p>
          <p className="text-xs font-extrabold uppercase tracking-widest text-zinc-500 dark:text-xactscore-accent">
            {t('Upcoming Match')}
          </p>
          {nextMatch ? (
            <>
              <div className="mt-2 flex min-w-0 flex-col gap-1 sm:grid sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center sm:gap-1.5">
                <span className="flex min-w-0 items-center gap-1.5">
                  {(nextMatch.homeCrest || getTeamLogo(nextMatch.homeTeam)) ? (
                    <img
                      src={nextMatch.homeCrest || getTeamLogo(nextMatch.homeTeam)}
                      alt=""
                      className="h-6 w-6 shrink-0 object-contain sm:h-7 sm:w-7"
                    />
                  ) : null}
                  <span className="min-w-0 text-[13px] font-bold uppercase leading-tight tracking-tight text-zinc-900 dark:text-white sm:truncate sm:text-xl sm:font-black">
                    {nextMatch.homeTeam}
                  </span>
                </span>
                <span className="pl-7 text-[10px] font-black uppercase text-zinc-400 sm:pl-0 sm:text-center dark:text-xactscore-accent">vs</span>
                <span className="flex min-w-0 items-center gap-1.5 sm:justify-end">
                  {(nextMatch.awayCrest || getTeamLogo(nextMatch.awayTeam)) ? (
                    <img
                      src={nextMatch.awayCrest || getTeamLogo(nextMatch.awayTeam)}
                      alt=""
                      className="h-6 w-6 shrink-0 object-contain sm:order-2 sm:h-7 sm:w-7"
                    />
                  ) : null}
                  <span className="min-w-0 text-[13px] font-bold uppercase leading-tight tracking-tight text-zinc-900 sm:text-right dark:text-white sm:truncate sm:text-xl sm:font-black">
                    {nextMatch.awayTeam}
                  </span>
                </span>
              </div>
              {nextMatch.venue ? (
                <p className="mt-1 flex min-w-0 items-center gap-1 text-xs font-medium text-zinc-500 dark:font-semibold dark:text-xactscore-accent/90">
                  <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                  <span className="truncate">{nextMatch.venue}</span>
                </p>
              ) : null}
            </>
          ) : (
            <h2 className="mt-2 text-base font-semibold uppercase leading-tight tracking-tight text-zinc-900 dark:font-black dark:text-white sm:text-xl">
              {t('Season Ended / No Fixtures')}
            </h2>
          )}
        </div>

        <div className="mt-3 sm:mt-8">
          <div className="mb-3 flex flex-wrap items-center gap-1.5 sm:mb-6 sm:gap-3">
            {unit(t('Days'), timeLeft.days)}
            <span className="text-sm font-black">:</span>
            {unit(t('Hours'), timeLeft.hours)}
            <span className="text-sm font-black">:</span>
            {unit(t('Mins'), timeLeft.minutes)}
            <span className="text-sm font-black">:</span>
            {unit(t('Secs'), timeLeft.seconds, true)}
          </div>

          <Link 
            href={predictHref} 
            className={cn(
              buttonVariants({ variant: 'default', size: 'sm' }),
              'rounded-full bg-gradient-to-r from-indigo-600 to-blue-500 px-6 py-3.5 font-bold uppercase tracking-wide text-white shadow-lg shadow-indigo-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-indigo-500/40 active:scale-95 dark:bg-xactscore-accent dark:text-black dark:shadow-[0_0_28px_rgba(18,255,128,0.28)] dark:hover:shadow-[0_0_28px_rgba(18,255,128,0.35)] sm:h-auto sm:min-h-11 sm:px-6 sm:text-xs'
            )}
          >
            {t('Make Predictions')}
          </Link>
        </div>
        </div>
      </div>

      {/* pointer-events-none: the -mt overlap + CSS transform marquee creates a
          stacking-context hit target that steals taps from Make Predictions on iOS. */}
      <div className="pointer-events-none relative z-0 -mt-8 h-[196px] w-full overflow-hidden bg-white sm:-mt-10 sm:h-[240px] lg:mt-0 lg:-ml-10 lg:h-auto lg:min-h-[360px] lg:w-1/2 dark:bg-transparent">
        {recentScores.length > 0 ? (
          <div className="scores-crossfade absolute inset-0 overflow-hidden">
            <div className="animate-marquee-y flex min-h-full w-full flex-col gap-2 p-2 pt-5 sm:gap-2.5 sm:p-5 sm:pt-8 lg:pt-6">
            {[...recentScores, ...recentScores].map((match, idx) => (
              <div
                key={`${match.id}-${idx}`}
                className="hero-match-row mb-2.5 flex min-h-[44px] items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-2.5 py-2 shadow-sm dark:mb-0 dark:rounded-lg dark:border-white/10 dark:bg-white/[0.06] dark:shadow-lg dark:shadow-black/20 sm:min-h-[52px] sm:justify-between sm:gap-2 sm:px-3.5 sm:py-3"
              >
                <span className="hero-match-status w-7 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:font-bold dark:text-xactscore-accent sm:w-8 sm:text-xs">
                  {match.status}
                </span>
                {(match.homeCrest || getTeamLogo(match.homeTeam)) ? (
                  <img src={match.homeCrest || getTeamLogo(match.homeTeam)} alt="" className="h-5 w-5 shrink-0 object-contain" />
                ) : null}
                <span className="min-w-0 flex-1 text-[11px] font-bold leading-tight text-slate-900 dark:text-zinc-100 sm:truncate sm:text-sm">{compactClubName(match.homeTeam)}</span>
                <span className="shrink-0 font-mono text-xs font-bold text-slate-900 dark:text-white sm:text-sm">
                  {match.homeScore ?? '-'}–{match.awayScore ?? '-'}
                </span>
                <span className="min-w-0 flex-1 text-right text-[11px] font-bold leading-tight text-slate-900 dark:text-zinc-100 sm:truncate sm:text-sm">{compactClubName(match.awayTeam)}</span>
                {(match.awayCrest || getTeamLogo(match.awayTeam)) ? (
                  <img src={match.awayCrest || getTeamLogo(match.awayTeam)} alt="" className="h-5 w-5 shrink-0 object-contain" />
                ) : null}
              </div>
            ))}
             </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-400">
            {t('No recent matches to display.')}
          </div>
        )}
      </div>

    </div>
  )
}
