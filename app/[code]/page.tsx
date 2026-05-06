import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buildMetadata } from '../../lib/seo';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    code: string;
  };
}

// Mock function to fetch project data
async function getProjectData(code: string) {
  // Replace with actual data fetching logic
  return {
    title: `Project ${code}`,
    description: `Details for project ${code}`,
    image: '/project-image.png',
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = params;
  const project = await getProjectData(code);

  if (!project) {
    return buildMetadata({
      title: 'Project Not Found',
      description: 'The requested project could not be found.',
      noIndex: true,
    });
  }

  return buildMetadata({
    title: project.title,
    description: project.description,
    image: project.image,
    url: `/${code}`,
    noIndex: true, // As per requirements
  });
}

export default async function ProjectPage({ params }: PageProps) {
  const { code } = params;
  const project = await getProjectData(code);

  if (!project) {
    notFound();
  }

  return (
    <div>
      <h1>{project.title}</h1>
      <p>{project.description}</p>
      {/* Render project content */}
    </div>
  );
}