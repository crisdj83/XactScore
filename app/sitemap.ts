import type { MetadataRoute } from 'next'
import { siteUrl } from '../lib/urls'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl()
  return [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/help`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/help/install`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ]
}
