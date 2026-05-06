import { MetadataRoute } from 'next';
import { getSeoBaseUrl } from '../lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSeoBaseUrl();

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    // Add more URLs as needed, e.g., from dynamic routes
  ];
}