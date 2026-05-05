import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { projectsApi } from '@/api/endpoints'
import type { Project } from '@/types'

export function PublicView() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await projectsApi.getAll()
        setProjects(data)
        if (data.length > 0) {
          setSelectedProject(data[0])
        }
      } catch (error) {
        console.error('Failed to load projects:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProjects()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-6 overflow-y-auto">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-6 h-6 bg-blue-500 rounded-lg"></div>
            <h1 className="text-xl font-bold">Roadmap</h1>
          </div>

          <div className="mb-6">
            <h2 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3">Projects</h2>
            <div className="space-y-2">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition ${
                    selectedProject?.id === project.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{project.icon}</span>
                    <span className="text-sm">{project.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800">
            <a href="/auth/login" className="text-xs text-slate-500 hover:text-slate-400">Admin Panel</a>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto">
          {selectedProject ? (
            <ProjectContent project={selectedProject} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-400">Select a project to view</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ProjectContent({ project }: { project: Project }) {
  const [stages, setStages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStages = async () => {
      try {
        const { stagesApi } = await import('@/api/endpoints')
        const data = await stagesApi.getByProjectId(project.id)
        setStages(data.sort((a, b) => a.order - b.order))
      } catch (error) {
        console.error('Failed to load stages:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStages()
  }, [project.id])

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-3xl">
            {project.icon}
          </div>
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <p className="text-slate-400">{project.description}</p>
          </div>
        </div>
        <a href="#" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300 border border-slate-700 rounded px-3 py-1">
          <span>🔗</span>
          <span>GitHub</span>
        </a>
      </div>

      {/* Roadmap Timeline */}
      <div className="space-y-4 max-w-3xl">
        {stages.map((stage, index) => (
          <div key={stage.id}>
            <div className="flex gap-4">
              {/* Timeline dot */}
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold ${
                  stage.status === 'completed' ? 'bg-green-600 text-white' :
                  stage.status === 'in-progress' ? 'bg-blue-600 text-white' :
                  stage.status === 'blocked' ? 'bg-orange-500 text-white' :
                  'bg-slate-700 text-slate-400'
                }`}>
                  {stage.icon || (index + 1)}
                </div>
                {index < stages.length - 1 && (
                  <div className="w-1 h-12 bg-slate-700 my-2"></div>
                )}
              </div>

              {/* Stage card */}
              <div className="flex-1 pb-4">
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 hover:border-slate-600 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">{stage.name}</h3>
                      <p className="text-slate-400 text-sm mb-2">{stage.description}</p>
                    </div>
                    <div className="ml-4 text-right">
                      <span className={`inline-block px-3 py-1 rounded text-xs font-medium ${
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
                      {stage.status === 'in-progress' && stage.progress && (
                        <p className="text-slate-400 text-xs mt-1">Postęp: {stage.progress}%</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center gap-2 text-slate-500 text-sm mt-12 pt-6 border-t border-slate-800">
        <span>🌐</span>
        <span>Każdy może przeglądać postępy</span>
      </div>
    </div>
  )
}
