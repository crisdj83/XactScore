import { PageHeader } from '@/components/ui/page-header'

export const metadata = {
  title: 'Privacy Policy · XactScore',
  description: 'How XactScore collects, uses, and deletes account data.',
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-16 pt-6">
      <PageHeader
        title="Privacy Policy"
        description="Last updated: 14 September 2026. This policy explains what XactScore collects and how we handle it."
      />

      <section className="space-y-3 text-sm leading-6 text-slate-700 dark:text-zinc-300">
        <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">Who we are</h2>
        <p>
          XactScore (“we”) provides a Premier League score-prediction product at xactscore.app and
          related mobile apps. Contact:{' '}
          <a className="font-semibold text-xactscore-accent" href="mailto:support@xactscore.app">
            support@xactscore.app
          </a>
          .
        </p>

        <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">Data we collect</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Account data: email address, password (stored hashed by our auth provider), username.</li>
          <li>Profile data: favorite team, motto/quote, avatar image URL (including pending avatars).</li>
          <li>Contest data: league memberships, roles, predictions, and scores.</li>
          <li>User-generated content: messages and replies posted in contests you join.</li>
          <li>Technical data: session tokens needed to keep you signed in on your device.</li>
        </ul>

        <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">How we use data</h2>
        <p>
          We use this data to operate contests, show rankings, moderate avatars, deliver messages to
          league members, and secure accounts. We do not sell personal data. We do not use your data for
          cross-app tracking advertising.
        </p>

        <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">Processors</h2>
        <p>
          Authentication and database hosting are provided by Supabase. The website and mobile APIs are
          hosted on our production infrastructure for xactscore.app. Standard HTTPS encryption protects
          data in transit.
        </p>

        <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">Retention & deletion</h2>
        <p>
          You can delete your account in the app or on the website (Profile → Delete account), or by
          emailing support. Deletion removes your auth account and associated profile, memberships,
          predictions, and messages subject to cascading database rules. Contests you solely
          administer may be removed with your account.
        </p>

        <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">Your choices</h2>
        <p>
          You may update profile fields, sign out, request export of your data by contacting support, or
          delete your account. You may report abusive content and block users from the Messages screen;
          blocked users’ messages are hidden from your feed immediately.
        </p>

        <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">Children</h2>
        <p>
          XactScore is not directed to children under 13. Do not create an account if you are under 13.
        </p>

        <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">Changes</h2>
        <p>
          We may update this policy. Material changes will be reflected by updating the date above and,
          when appropriate, an in-app or site notice.
        </p>
      </section>
    </div>
  )
}
