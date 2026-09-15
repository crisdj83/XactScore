import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft, Smartphone } from 'lucide-react'
import { getTranslations } from '../../../lib/i18n'
import { getServerLocale } from '../../../lib/i18n-server'
import { PageHeader } from '@/components/ui/page-header'
import { AppleMark, PlayStoreMark } from '../../components/StoreMarks'

export async function generateMetadata(): Promise<Metadata> {
  const t = getTranslations(getServerLocale())
  return {
    title: t('Install the app'),
    description: t('Add XactScore to your phone in about a minute. It is a Progressive Web App — the same site you already use, opening like an app.'),
  }
}

type Step = {
  image: string
  alt: string
  title: string
  body: string
}

function StepCard({ step, index, stepLabel }: { step: Step; index: number; stepLabel: string }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-xl shadow-black/30">
      <div className="relative aspect-[3/4] bg-zinc-950">
        <Image
          src={step.image}
          alt={step.alt}
          fill
          sizes="(min-width: 768px) 320px, 100vw"
          className="object-cover object-top"
        />
      </div>
      <div className="space-y-2 border-t border-white/10 p-4 sm:p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-xactscore-accent">
          {stepLabel} {index + 1}
        </p>
        <h3 className="text-base font-black text-zinc-50">{step.title}</h3>
        <p className="text-sm leading-6 text-zinc-400">{step.body}</p>
      </div>
    </article>
  )
}

export default function InstallHelpPage() {
  const t = getTranslations(getServerLocale())

  const iosSteps: Step[] = [
    {
      image: '/images/pwa/ios-safari-share.png',
      alt: t('Safari toolbar with the Share button highlighted'),
      title: t('Open Safari and tap Share'),
      body: t('On iPhone or iPad, open XactScore in Safari (not Chrome). Tap the Share button — a square with an arrow pointing up — in the bottom toolbar.'),
    },
    {
      image: '/images/pwa/ios-add-to-home.png',
      alt: t('iOS share sheet with Add to Home Screen highlighted'),
      title: t('Choose Add to Home Screen'),
      body: t('Scroll the share sheet if needed, then tap Add to Home Screen. On the next screen, keep the name XactScore and tap Add in the top right.'),
    },
    {
      image: '/images/pwa/ios-home-screen.png',
      alt: t('iPhone home screen showing the XactScore app icon'),
      title: t('Launch it like an app'),
      body: t('Find the XactScore icon on your Home Screen. Open it and it runs full screen, without the Safari address bar.'),
    },
  ]

  const androidSteps: Step[] = [
    {
      image: '/images/pwa/android-chrome-menu.png',
      alt: t('Chrome browser with the three-dot menu highlighted'),
      title: t('Open Chrome and tap the menu'),
      body: t('On Android, open XactScore in Chrome. Tap the three-dot menu in the top-right corner of the browser.'),
    },
    {
      image: '/images/pwa/android-install-app.png',
      alt: t('Chrome menu with Install app highlighted'),
      title: t('Tap Install app'),
      body: t('Choose Install app or Add to Home screen. If Chrome shows an Install banner, you can use that instead. Confirm Install when asked.'),
    },
    {
      image: '/images/pwa/android-home-screen.png',
      alt: t('Android home screen showing the XactScore app icon'),
      title: t('Open XactScore from your apps'),
      body: t('The icon appears on your Home Screen and in the app drawer. Open it and XactScore runs like a normal Android app — still the same live site, not a Play Store listing.'),
    },
  ]

  return (
    <div className="mx-auto max-w-4xl space-y-10 pb-16 pt-2">
      <div className="flex flex-col gap-4">
        <Link
          href="/help"
          className="inline-flex w-fit items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400 transition hover:text-xactscore-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('Back to Help')}
        </Link>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-zinc-950 p-2.5 text-xactscore-accent">
            <Smartphone className="h-6 w-6" />
          </div>
          <PageHeader
            className="mb-0"
            title={t('Install the app')}
          />
        </div>
        <p className="text-sm leading-6 text-zinc-400">
          {t('Add XactScore to your phone in about a minute. It is a Progressive Web App — the same site you already use, opening like an app.')}
        </p>
        <p className="text-sm leading-6 text-zinc-400">
          {t('After you install it, open Profile and turn on Match reminders to get a ping about 2 hours before kickoff.')}
        </p>
      </div>

      <p className="rounded-2xl border border-xactscore-accent/25 bg-xactscore-accent/10 px-4 py-3 text-sm leading-6 text-xactscore-muted">
        {t('XactScore is not listed on the App Store or Google Play. The buttons use those familiar logos so you can pick iPhone or Android and follow the matching steps.')}
      </p>

      <section id="ios" className="scroll-mt-36 space-y-5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-100">
            <AppleMark className="h-6 w-6" />
          </span>
          <div>
            <h2 className="text-lg font-black text-zinc-50">{t('iPhone and iPad')}</h2>
            <p className="text-sm text-zinc-400">{t('Works in Safari on iOS 16.4 and later.')}</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {iosSteps.map((step, index) => (
            <StepCard key={step.image} step={step} index={index} stepLabel={t('Step')} />
          ))}
        </div>
      </section>

      <section id="android" className="scroll-mt-36 space-y-5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
            <PlayStoreMark className="h-6 w-6" />
          </span>
          <div>
            <h2 className="text-lg font-black text-zinc-50">{t('Android')}</h2>
            <p className="text-sm text-zinc-400">{t('Works in Chrome. Samsung Internet can install from its menu as well.')}</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {androidSteps.map((step, index) => (
            <StepCard key={step.image} step={step} index={index} stepLabel={t('Step')} />
          ))}
        </div>
      </section>
    </div>
  )
}
