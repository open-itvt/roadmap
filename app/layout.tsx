import { Metadata } from 'next';
import { cookies } from 'next/headers';
import Script from 'next/script';
import { getSeoConfig, buildMetadata, getWebsiteJsonLd, getOrganizationJsonLd } from '../lib/seo';

export const metadata: Metadata = buildMetadata({});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = getSeoConfig();
  const cookieStore = cookies();
  const lang = cookieStore.get('lang')?.value || config.locale[0];

  const websiteJsonLd = getWebsiteJsonLd();
  const organizationJsonLd = getOrganizationJsonLd();

  return (
    <html lang={lang}>
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.GA_MEASUREMENT_ID}');
          `}
        </Script>
      </head>
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
      </body>
    </html>
  );
}