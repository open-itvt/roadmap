import redis from '../_upstashClient'
import { handleCors } from '../_cors'
import { getProjectsFromRedis, saveProjectsToRedis, saveStagestoRedis } from '../projects/_shared'
import type { Project, Stage } from '@/types'

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

export default async function handler(req: any, res: any) {
  if (handleCors(req, res)) return

  const segments: string[] = Array.isArray(req.query.path)
    ? req.query.path
    : req.query.path
    ? [req.query.path]
    : []

  const route = segments.join('/')

  switch (route) {
    case 'reset':
      return handleReset(req, res)
    case 'init':
      return handleInit(req, res)
    default:
      res.status(404).json({ error: 'Not found' })
  }
}

async function handleReset(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const adminKeys = await redis.keys('admin:*')
    for (const key of adminKeys) {
      await redis.del(String(key))
    }

    const sessionKeys = await redis.keys('session:*')
    for (const key of sessionKeys) {
      await redis.del(String(key))
    }

    res.status(200).json({
      success: true,
      data: { message: 'Admin data reset successfully' },
    })
  } catch (error) {
    console.error('admin/reset error', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

async function handleInit(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const existingProjects = await getProjectsFromRedis()
    if (existingProjects.length > 0) {
      res.status(200).json({ success: true, message: 'Data already initialized' })
      return
    }

    await saveProjectsToRedis([SAMPLE_PROJECT])
    await saveStagestoRedis(SAMPLE_STAGES)

    res.status(200).json({
      success: true,
      message: 'Sample data initialized successfully',
      data: {
        project: SAMPLE_PROJECT,
        stages: SAMPLE_STAGES,
      },
    })
  } catch (error) {
    console.error('admin/init error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
