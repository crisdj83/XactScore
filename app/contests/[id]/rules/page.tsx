import { Target, Activity, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { createClient } from '../../../../lib/supabase/server'
import { getTranslations } from '../../../../lib/i18n'
import { getServerLocale } from '../../../../lib/i18n-server'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'

export default async function RulesPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const t = getTranslations(getServerLocale())
  const supabase = await createClient()
  const { data: contest } = await supabase
    .from('contests')
    .select('points_exact, points_close, points_result')
    .eq('id', id)
    .single()

  const pointsExact = Number(contest?.points_exact ?? 3)
  const pointsClose = Number(contest?.points_close ?? 1.5)
  const pointsResult = Number(contest?.points_result ?? 1)
  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title={t('Contest Rules & Scoring')}
        description={t('Everything you need to know to dominate the leaderboard.')}
      />

      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 md:p-8">
            <h3 className="mb-4 flex items-center gap-2.5 text-lg font-extrabold uppercase tracking-tight text-zinc-100">
              <div className="rounded-xl bg-xactscore-accent/10 p-2">
                <AlertCircle className="h-5 w-5 text-xactscore-accent" />
              </div>
              {t('How to Play')}
            </h3>
            <ul className="ml-7 list-disc space-y-3 text-sm font-medium text-zinc-400 marker:text-xactscore-accent">
              <li>{t('Navigate to the Predictions tab to see the upcoming Premier League fixtures.')}</li>
              <li>{t('Use the + and - buttons to set your predicted score for the Home and Away teams.')}</li>
              <li>{t('Your predictions are saved automatically as you change them.')}</li>
              <li>
                <strong className="text-zinc-100">{t('Lockout Time:')}</strong>{' '}
                {t(
                  'Picks lock 60 minutes before kickoff. You can change your score until then. After lock, the pick is final.'
                )}
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 md:p-8">
            <h3 className="mb-3 flex items-center gap-2.5 text-lg font-extrabold uppercase tracking-tight text-zinc-100">
              <div className="rounded-xl bg-xactscore-accent/10 p-2">
                <Target className="h-5 w-5 text-xactscore-accent" />
              </div>
              {t('Tiered Scoring System')}
            </h3>
            <p className="mb-6 text-sm text-zinc-500">
              {t(
                'Points are awarded after the final whistle based on how accurate your prediction was compared to the real-world result.'
              )}
            </p>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div className="group relative flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/60 p-5 transition-all hover:border-xactscore-accent">
                <Badge variant="accent" className="absolute right-0 top-0 rounded-none rounded-bl-xl">
                  +{pointsExact} PTS
                </Badge>
                <Target className="mb-3 h-7 w-7 text-xactscore-accent" />
                <h4 className="mb-1.5 font-extrabold uppercase tracking-tight text-zinc-100">
                  {t('Exact Score')}
                </h4>
                <p className="text-xs leading-relaxed text-zinc-400">
                  {t('You correctly predict the exact final score of the match.')}
                </p>
                <div className="mt-auto rounded-xl border border-zinc-800 bg-zinc-900 p-3 pt-4 text-xs text-zinc-500">
                  <span className="mb-1 block font-extrabold uppercase tracking-wider text-zinc-300">
                    {t('Example')}
                  </span>
                  {t('Predicted')} 2 - 1 <br />
                  {t('Actual')} 2 - 1
                </div>
              </div>

              <div className="group relative flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/60 p-5 transition-all hover:border-xactscore-accent">
                <Badge variant="accent" className="absolute right-0 top-0 rounded-none rounded-bl-xl">
                  +{pointsClose} PTS
                </Badge>
                <Activity className="mb-3 h-7 w-7 text-sky-400" />
                <h4 className="mb-1.5 font-extrabold uppercase tracking-tight text-zinc-100">
                  {t('Close Prediction')}
                </h4>
                <p className="text-xs leading-relaxed text-zinc-400">
                  {t(
                    'You predict the right outcome (Win/Draw/Loss), AND total goals scored is off by no more than 1.'
                  )}
                </p>
                <div className="mt-auto rounded-xl border border-zinc-800 bg-zinc-900 p-3 pt-4 text-xs text-zinc-500">
                  <span className="mb-1 block font-extrabold uppercase tracking-wider text-zinc-300">
                    {t('Example')}
                  </span>
                  {t('Predicted')} 1 - 0 (Total: 1) <br />
                  {t('Actual')} 2 - 0 (Total: 2)
                </div>
              </div>

              <div className="group relative flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/60 p-5 transition-all hover:border-zinc-600">
                <Badge className="absolute right-0 top-0 rounded-none rounded-bl-xl">
                  +{pointsResult} PT{pointsResult === 1 ? '' : 'S'}
                </Badge>
                <CheckCircle2 className="mb-3 h-7 w-7 text-zinc-400" />
                <h4 className="mb-1.5 font-extrabold uppercase tracking-tight text-zinc-100">
                  {t('Correct Result')}
                </h4>
                <p className="text-xs leading-relaxed text-zinc-400">
                  {t('You predict the right outcome (Win/Draw/Loss), but total goals are not close.')}
                </p>
                <div className="mt-auto rounded-xl border border-zinc-800 bg-zinc-900 p-3 pt-4 text-xs text-zinc-500">
                  <span className="mb-1 block font-extrabold uppercase tracking-wider text-zinc-300">
                    {t('Example')}
                  </span>
                  {t('Predicted')} 1 - 0 (Total: 1)
                  <br />
                  {t('Actual')} 4 - 0 (Total: 4)
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 md:p-8">
            <h3 className="mb-3 flex items-center gap-2.5 text-lg font-extrabold uppercase tracking-tight text-zinc-100">
              <div className="rounded-xl bg-xactscore-accent/10 p-2">
                <Clock className="h-5 w-5 text-xactscore-accent" />
              </div>
              {t('Leaderboard Tiebreakers')}
            </h3>
            <p className="mb-4 text-sm text-zinc-500">
              {t(
                'If two or more players have the exact same Total Points, the leaderboard will rank them based on:'
              )}
            </p>
            <ol className="ml-7 list-decimal space-y-2 text-sm font-bold text-zinc-300 marker:text-xactscore-accent">
              <li>
                {t('Highest number of Exact Scores')} (+{pointsExact} pts)
              </li>
              <li>
                {t('Highest number of Close Predictions')} (+{pointsClose} pts)
              </li>
              <li>{t('Highest overall prediction accuracy percentage')}</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
