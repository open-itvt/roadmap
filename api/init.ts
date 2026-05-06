import { getProjectsFromRedis, saveProjectsToRedis, saveStagestoRedis } from './projects/_shared'
import type { Project, Stage } from '@/types'

function getAuthHeader(req: any): string | undefined {
  return req.headers.authorization as string | undefined
}

const SAMPLE_PROJECT: Project = {
  id: 'mobile-app-1',
  name: 'Aplikacja mobilna',
  description: 'Aplikacja mobilna dla klientów, która umożliwia zarządzanie zamówieniami, przeglądanie ofert i kontakt z obsługą',
  icon: '📱',
  status: 'active',
  priority: 'high',
  progress: 65,
  startDate: '2024-04-12',
  lastUpdate: new Date().toISOString(),
  teamSize: 4,
  technologies: ['React Native', 'TypeScript', 'Node.js', 'Expo'],
  goals: [
    'Stworzenie intuicyjnej aplikacji mobilnej',
    'Zapewnienie wysokiej wydajności i stabilności',
    'Integracja z systemami zewnętrznymi',
    'Wdrożenie w App Store i Google Play',
  ],
  createdAt: '2024-04-12T00:00:00Z',
  updatedAt: new Date().toISOString(),
}

const SAMPLE_STAGES: Stage[] = [
  {
    id: 'stage-1',
    projectId: 'mobile-app-1',
    name: 'Analiza wymagań',
    description: 'Zebranie i analiza wymagań projektowych',
    status: 'completed',
    icon: '✓',
    order: 1,
    progress: 100,
    createdAt: '2024-04-12T00:00:00Z',
    updatedAt: '2024-05-12T00:00:00Z',
  },
  {
    id: 'stage-2',
    projectId: 'mobile-app-1',
    name: 'Projekt UI/UX',
    description: 'Projektowanie interfejsu użytkownika',
    status: 'completed',
    icon: '✓',
    order: 2,
    progress: 100,
    createdAt: '2024-05-12T00:00:00Z',
    updatedAt: '2024-05-26T00:00:00Z',
  },
  {
    id: 'stage-3',
    projectId: 'mobile-app-1',
    name: 'Implementacja',
    description: 'Kodowanie i implementacja funkcjonalności',
    status: 'in-progress',
    icon: '●',
    order: 3,
    progress: 65,
    createdAt: '2024-05-26T00:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'stage-4',
    projectId: 'mobile-app-1',
    name: 'Testy',
    description: 'Testowanie aplikacji',
    status: 'pending',
    icon: '4',
    order: 4,
    createdAt: '2024-05-26T00:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'stage-5',
    projectId: 'mobile-app-1',
    name: 'Wdrożenie',
    description: 'Publikacja aplikacji w sklepach',
    status: 'pending',
    icon: '5',
    order: 5,
    createdAt: '2024-05-26T00:00:00Z',
    updatedAt: new Date().toISOString(),
  },
]

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    // Check if data already exists
    const authHeader = getAuthHeader(req)
    const existingProjects = await getProjectsFromRedis(authHeader)
    if (existingProjects.length > 0) {
      res.status(200).json({ success: true, message: 'Data already initialized' })
      return
    }

    // Initialize with sample data
    await saveProjectsToRedis([SAMPLE_PROJECT], authHeader)
    await saveStagestoRedis(SAMPLE_STAGES, authHeader)

    res.status(200).json({ 
      success: true, 
      message: 'Sample data initialized successfully',
      data: {
        project: SAMPLE_PROJECT,
        stages: SAMPLE_STAGES,
      }
    })
  } catch (error) {
    console.error('api/init error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
