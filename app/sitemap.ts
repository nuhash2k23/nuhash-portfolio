import type { MetadataRoute } from 'next';
import { posts, projects, site } from '@/lib/content';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: site.url, lastModified: now, changeFrequency: 'monthly', priority: 1 },
    ...['/work', '/about', '/playground', '/blog'].map((path) => ({
      url: `${site.url}${path}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...posts
      .filter((p) => !p.draft)
      .map((p) => ({ url: `${site.url}/blog/${p.slug}`, lastModified: now, changeFrequency: 'yearly' as const, priority: 0.6 })),
    ...projects.map((p) => ({
      url: `${site.url}/work/${p.slug}`,
      lastModified: now,
      changeFrequency: 'yearly' as const,
      priority: 0.7,
    })),
  ];
}
