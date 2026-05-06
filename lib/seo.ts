import fs from 'fs';
import path from 'path';
import { Metadata } from 'next';

export interface SeoConfig {
  siteName: string;
  defaultTitle: string;
  titleTemplate: string;
  description: string;
  keywords: string[];
  authors: { name: string }[];
  baseUrl: string;
  twitterHandle: string;
  defaultOgImage: string;
  locale: string[];
  robots: {
    index: boolean;
    follow: boolean;
    googleBot: {
      'max-image-preview': string;
      'max-snippet': number;
      'max-video-preview': number;
    };
  };
}

let seoConfig: SeoConfig | null = null;

export function getSeoConfig(): SeoConfig {
  if (!seoConfig) {
    const filePath = path.join(process.cwd(), 'seo.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    seoConfig = JSON.parse(fileContents);
  }
  return seoConfig;
}

export function getSeoBaseUrl(): string {
  const config = getSeoConfig();
  return process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL || config.baseUrl;
}

export function buildMetadata({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  noIndex = false,
}: {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  noIndex?: boolean;
}): Metadata {
  const config = getSeoConfig();
  const baseUrl = getSeoBaseUrl();

  const fullTitle = title ? config.titleTemplate.replace('%s', title).replace('%siteName%', config.siteName) : config.defaultTitle;
  const fullDescription = description || config.description;
  const fullKeywords = keywords || config.keywords;
  const fullImage = image ? `${baseUrl}${image}` : `${baseUrl}${config.defaultOgImage}`;
  const canonicalUrl = url ? `${baseUrl}${url}` : baseUrl;

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: fullTitle,
      template: config.titleTemplate.replace('%siteName%', config.siteName),
    },
    description: fullDescription,
    keywords: fullKeywords,
    authors: config.authors,
    openGraph: {
      title: fullTitle,
      description: fullDescription,
      url: canonicalUrl,
      siteName: config.siteName,
      images: [
        {
          url: fullImage,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
      locale: config.locale[0],
      type,
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: fullDescription,
      images: [fullImage],
      creator: config.twitterHandle,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : config.robots,
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export function getWebsiteJsonLd() {
  const config = getSeoConfig();
  const baseUrl = getSeoBaseUrl();

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: config.siteName,
    description: config.description,
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function getOrganizationJsonLd() {
  const config = getSeoConfig();
  const baseUrl = getSeoBaseUrl();

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: config.siteName,
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    sameAs: [
      `https://twitter.com/${config.twitterHandle.replace('@', '')}`,
    ],
  };
}