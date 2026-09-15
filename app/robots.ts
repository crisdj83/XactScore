import type { MetadataRoute } from 'next'
import { siteUrl } from '../lib/urls'

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl()
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login', '/help', '/help/install'],
      disallow: ['/contests', '/profile', '/messages', '/admin', '/join', '/api', '/forgot-password'],
    },
    sitemap: `${base}/sitemap.xml`,
  }
}
