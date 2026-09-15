import { PageHeader } from '@/components/ui/page-header'

export const metadata = {
  title: 'Terms of Use · XactScore',
  description: 'Terms for using XactScore contests, predictions, and messages.',
}

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-16 pt-6">
      <PageHeader
        title="Terms of Use"
        description="Last updated: 14 September 2026. By creating an account you agree to these terms."
      />

      <section className="space-y-3 text-sm leading-6 text-slate-700 dark:text-zinc-300">
        <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">Service</h2>
        <p>
          XactScore is a free, ad-free prediction game. Features may change. We may suspend accounts that
          abuse the service, harass others, or attempt to disrupt contests.
        </p>

        <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">Accounts</h2>
        <p>
          You are responsible for your credentials and activity. Provide accurate information. One person
          should not create accounts solely to manipulate rankings.
        </p>

        <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">User content</h2>
        <p>
          Messages, avatars, mottos, and usernames must not include illegal, hateful, sexual involving
          minors, or harassing content. We may remove content and restrict accounts. Contest admins and
          global admins may moderate within their scope. You can report content and block users from the
          app; blocked users’ posts are hidden from your feed.
        </p>

        <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">Predictions</h2>
        <p>
          Predictions lock on published timing rules. Scoring follows each contest’s settings. Results
          depend on official match data sources and may be corrected if upstream data changes.
        </p>

        <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">Disclaimer</h2>
        <p>
          The service is provided “as is” without warranties. To the fullest extent permitted by law we
          are not liable for indirect damages arising from use of the service.
        </p>

        <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">Contact</h2>
        <p>
          Questions:{' '}
          <a className="font-semibold text-xactscore-accent" href="mailto:support@xactscore.app">
            support@xactscore.app
          </a>
          .
        </p>
      </section>
    </div>
  )
}
