import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  FaRocket,
  FaCogs,
  FaMobileAlt,
  FaCloud,
  FaLock,
  FaDatabase,
  FaChartLine,
  FaPaintBrush,
  FaGlobe,
  FaFolderOpen,
} from 'react-icons/fa'
import { projectsApi, stagesApi } from '@/api/endpoints'
import type { Project, Stage } from '@/types'

const PROJECT_ICON_COMPONENTS: Record<string, React.ComponentType> = {
  rocket: FaRocket,
  cogs: FaCogs,
  mobile: FaMobileAlt,
  cloud: FaCloud,
  lock: FaLock,
  database: FaDatabase,
  chart: FaChartLine,
  design: FaPaintBrush,
  globe: FaGlobe,
}

function renderProjectIcon(value: string) {
  const trimmed = value?.trim() || ''
  if (!trimmed) return <FaFolderOpen />

  const Icon = PROJECT_ICON_COMPONENTS[trimmed.toLowerCase()]
  if (Icon) return <Icon />

  return trimmed
}

export function ProjectView() {
  const { projectId } = useParams<{ projectId: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [stages, setStages] = useState<Stage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      if (!projectId) return
      try {
        const [projectData, stagesData] = await Promise.all([
          projectsApi.getById(projectId),
          stagesApi.getByProjectId(projectId),
        ])
        setProject(projectData)
        setStages(stagesData.sort((a, b) => a.order - b.order))
      } catch (error) {
        console.error('Failed to load project:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [projectId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-400">Project not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Project Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-2xl">
              {renderProjectIcon(project.icon)}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{project.name}</h1>
              <p className="text-slate-400">{project.description}</p>
            </div>
          </div>
        </div>

        {/* Roadmap Timeline */}
        <div className="space-y-4">
          {stages.map((stage, index) => (
            <div key={stage.id}>
              <div className="flex gap-4">
                {/* Timeline connector */}
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-semibold ${
                    stage.status === 'completed' ? 'bg-green-500 text-white' :
                    stage.status === 'in-progress' ? 'bg-blue-500 text-white' :
                    stage.status === 'blocked' ? 'bg-orange-500 text-white' :
                    'bg-slate-700 text-slate-400'
                  }`}>
                    {stage.icon || index + 1}
                  </div>
                  {index < stages.length - 1 && (
                    <div className="w-1 h-12 bg-slate-700 my-2"></div>
                  )}
                </div>

                {/* Stage content */}
                <div className="flex-1 pb-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold">{stage.name}</h3>
                        <p className="text-slate-400 text-sm">{stage.description}</p>
                      </div>
                      <span className={`px-3 py-1 rounded text-xs font-medium whitespace-nowrap ml-2 ${
                        stage.status === 'completed' ? 'bg-green-900 text-green-200' :
                        stage.status === 'in-progress' ? 'bg-blue-900 text-blue-200' :
                        stage.status === 'blocked' ? 'bg-orange-900 text-orange-200' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {stage.status === 'completed' && 'Zakończone'}
                        {stage.status === 'in-progress' && 'W trakcie'}
                        {stage.status === 'blocked' && 'Zablokowane'}
                        {stage.status === 'pending' && 'Oczekujące'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
