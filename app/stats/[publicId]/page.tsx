import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buildMetadata } from '../../../lib/seo';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    publicId: string;
  };
}

// Mock function to fetch stats data
async function getStatsData(publicId: string) {
  // Replace with actual data fetching logic
  return {
    title: `Stats for ${publicId}`,
    description: `Statistics for public ID ${publicId}`,
    image: '/stats-image.png',
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { publicId } = params;
  const stats = await getStatsData(publicId);

  if (!stats) {
    return buildMetadata({
      title: 'Stats Not Found',
      description: 'The requested statistics could not be found.',
      noIndex: true,
    });
  }

  return buildMetadata({
    title: stats.title,
    description: stats.description,
    image: stats.image,
    url: `/stats/${publicId}`,
    noIndex: true, // As per requirements
  });
}

export default async function StatsPage({ params }: PageProps) {
  const { publicId } = params;
  const stats = await getStatsData(publicId);

  if (!stats) {
    notFound();
  }

  return (
    <div>
      <h1>{stats.title}</h1>
      <p>{stats.description}</p>
      {/* Render stats content */}
    </div>
  );
}