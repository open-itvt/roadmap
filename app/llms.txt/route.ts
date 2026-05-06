import { NextResponse } from 'next/server';
import { getSeoConfig, getSeoBaseUrl } from '../../lib/seo';

export const dynamic = 'force-static';

export async function GET() {
  const config = getSeoConfig();
  const baseUrl = getSeoBaseUrl();

  const content = `# ${config.siteName}

${config.description}

## Important URLs
- Home: ${baseUrl}
- Sitemap: ${baseUrl}/sitemap.xml

## Keywords
${config.keywords.join(', ')}

This is a roadmap management application for planning and tracking projects.
`;

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}