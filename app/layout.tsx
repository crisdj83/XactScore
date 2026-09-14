import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Navbar from "./components/Navbar";
import SiteFooter from "./components/SiteFooter";
import ServiceWorkerRegister from "./components/ServiceWorkerRegister";
import ThemeProvider from "./components/ThemeProvider";
import { LocaleProvider } from "./components/LocaleProvider";
import { getServerLocale } from "../lib/i18n-server";
import { defaultLocale, getTranslations } from "../lib/i18n";
import { siteUrl } from "../lib/urls";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const viewport: Viewport = {
  themeColor: "#E2E8F0",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export async function generateMetadata(): Promise<Metadata> {
  let locale = defaultLocale
  try {
    locale = getServerLocale()
  } catch {
    locale = defaultLocale
  }
  const t = getTranslations(locale);
  const base = siteUrl();
  const title = t("XactScore | Premier League Predictions");
  const description = t("Private Premier League prediction leagues. Exact scores with friends.");
  return {
    metadataBase: new URL(base),
    title,
    description,
    applicationName: "XactScore",
    keywords: [
      "Premier League",
      "score predictions",
      "football predictor",
      "private league",
      "XactScore",
      "office football predictor",
      "Superbru alternative",
      "PronoContest alternative",
    ],
    alternates: { canonical: base },
    openGraph: {
      type: "website",
      url: base,
      siteName: "XactScore",
      title,
      description,
      images: [{ url: "/icons/icon-512.png", width: 512, height: 512, alt: "XactScore" }],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: ["/icons/icon-512.png"],
    },
    appleWebApp: {
      capable: true,
      title: "XactScore",
      statusBarStyle: "default",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let locale = defaultLocale
  try {
    locale = getServerLocale()
  } catch {
    locale = defaultLocale
  }
  return (
    <html
      lang={locale}
      className={`${inter.variable} ${inter.className} min-h-[100dvh] overscroll-none bg-slate-200 dark:bg-zinc-900`}
      suppressHydrationWarning
    >
      <body className="flex min-h-[100dvh] flex-col overscroll-none bg-slate-200 text-xactscore-text transition-colors duration-300 dark:bg-zinc-900">
        <Script id="device-class" strategy="beforeInteractive">
          {`(function(){var ua=navigator.userAgent||"";var ios=/iP(hone|ad|od)/.test(ua)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);document.documentElement.classList.toggle("android",/Android/i.test(ua));document.documentElement.classList.toggle("ios",ios)})()`}
        </Script>
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function(){try{var stored=localStorage.getItem("xactscore-theme");var theme=stored||"dark";if(theme==="system"){theme=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}var dark=theme==="dark";if(dark){document.documentElement.classList.add("dark")}else{document.documentElement.classList.remove("dark")}var color=dark?"#18181b":"#E2E8F0";document.documentElement.style.backgroundColor=color;var metas=document.querySelectorAll('meta[name="theme-color"]');if(!metas.length){var m=document.createElement("meta");m.setAttribute("name","theme-color");m.setAttribute("content",color);document.head.appendChild(m)}else{metas.forEach(function(meta){meta.removeAttribute("media");meta.setAttribute("content",color)})}}catch(e){document.documentElement.classList.add("dark")}})();`}
        </Script>
        <ThemeProvider>
          <LocaleProvider initialLocale={locale}>
            <Navbar />
            <main className="mx-auto w-full flex-grow px-3 py-5 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] sm:px-5 sm:py-6 lg:px-8 lg:py-8 lg:pb-8 xl:px-10">
              {children}
            </main>
            <div className="hidden lg:block">
              <SiteFooter />
            </div>
          </LocaleProvider>
        </ThemeProvider>
        <ServiceWorkerRegister />
        <Analytics />
      </body>
    </html>
  );
}
