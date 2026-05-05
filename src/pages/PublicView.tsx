import { useState, useEffect } from 'react'
import { projectsApi } from '@/api/endpoints'
import type { Project } from '@/types'

export function PublicView() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [activeTab, setActiveTab] = useState<'roadmap' | 'details'>('roadmap')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProjects = async () => {
      try {
        // Initialize sample data if needed
        try {
          await fetch('/api/init', { method: 'POST' })
        } catch (e) {
          // Initialization may fail if data already exists, that's ok
        }

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
    <div className="min-h-screen bg-[#0a0d12] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1440px] border border-white/10 bg-[#0b0f14] shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_30px_90px_rgba(0,0,0,0.55)] lg:rounded-2xl lg:m-4 overflow-hidden">
        <aside className="hidden lg:flex w-[288px] flex-col border-r border-white/8 bg-[#0b1118]">
          <div className="px-6 py-5 border-b border-white/6">
            <div className="flex items-center gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25">
                <span className="text-sm font-semibold">R</span>
              </div>
              <div>
                <div className="text-base font-semibold tracking-tight">Roadmap</div>
                <div className="text-xs text-slate-400">Public view</div>
              </div>
            </div>
          </div>

          <div className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Projekty</div>
          <div className="px-3 pb-4 space-y-2 overflow-y-auto">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className={`group flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                  selectedProject?.id === project.id
                    ? 'border-violet-400/45 bg-violet-500/15 text-white shadow-[0_0_0_1px_rgba(139,92,246,0.18)]'
                    : 'border-transparent text-slate-300 hover:border-white/8 hover:bg-white/5'
                }`}
              >
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/8 text-lg">
                  {project.icon}
                </span>
                <span className="truncate text-sm font-medium">{project.name}</span>
              </button>
            ))}
          </div>

          <div className="mt-auto border-t border-white/8 p-4">
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              <div className="text-sm font-medium text-white">Projekt publiczny</div>
              <div className="mt-1 text-xs leading-5 text-slate-400">Każdy może przeglądać postępy</div>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1080px] px-4 py-4 sm:px-6 lg:px-10 lg:py-8">
            <div className="mb-5 flex items-center justify-between gap-3 lg:hidden">
              <button className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-slate-200">
                <span className="text-lg">☰</span>
              </button>
              <div className="text-sm font-medium">Roadmapa</div>
              <a href="/auth/login" className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-slate-300">GitHub</a>
            </div>

            <div className="mb-6 hidden lg:flex items-center justify-between">
              <div>
                <div className="text-2xl font-semibold tracking-tight">Roadmapa</div>
                <div className="mt-1 text-sm text-slate-400">Śledź postęp prac dla wybranego projektu</div>
              </div>
              <a href="/auth/login" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300 hover:bg-white/[0.06]">
                <span>GitHub</span>
                <span>↗</span>
              </a>
            </div>

            <div className="mb-5 rounded-2xl border border-white/8 bg-white/[0.03] p-3 lg:hidden">
              <div className="flex items-center justify-between rounded-xl border border-white/8 bg-black/20 px-3 py-2.5">
                <div className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/8 text-lg">{selectedProject?.icon ?? '◻'}</span>
                  <div>
                    <div className="text-sm font-medium">{selectedProject?.name ?? 'Wybierz projekt'}</div>
                    <div className="text-xs text-slate-400">Bieżący projekt</div>
                  </div>
                </div>
                <span className="text-slate-400">⌄</span>
              </div>
            </div>

            <div className="mb-6 flex items-center gap-6 border-b border-white/8 text-sm">
              <button 
                onClick={() => setActiveTab('roadmap')}
                className={`relative pb-3 font-medium transition ${
                  activeTab === 'roadmap' 
                    ? 'text-violet-300 after:absolute after:inset-x-0 after:bottom-[-1px] after:h-[2px] after:rounded-full after:bg-violet-400'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                Roadmapa
              </button>
              <button 
                onClick={() => setActiveTab('details')}
                className={`pb-3 font-medium transition ${
                  activeTab === 'details' 
                    ? 'text-violet-300 after:absolute after:inset-x-0 after:bottom-[-1px] after:h-[2px] after:rounded-full after:bg-violet-400'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                Szczegóły
              </button>
              <button className="pb-3 text-slate-400">GitHub</button>
            </div>

            {selectedProject ? (
              activeTab === 'roadmap' ? (
                <RoadmapContent project={selectedProject} />
              ) : (
                <DetailsContent project={selectedProject} />
              )
            ) : (
              <div className="flex min-h-[60vh] items-center justify-center rounded-3xl border border-white/8 bg-white/[0.03]">
                <p className="text-slate-400">Select a project to view</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

function RoadmapContent({ project }: { project: Project }) {
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
    <div className="space-y-6 pb-10">
      {/* Roadmap Timeline */}
      <div className="space-y-4">
        {stages.map((stage, index) => (
          <div key={stage.id}>
            <div className="flex gap-4">
              {/* Timeline dot */}
              <div className="flex flex-col items-center">
                <div className={`grid h-12 w-12 place-items-center rounded-full text-lg font-semibold ring-1 ring-white/10 ${
                  stage.status === 'completed' ? 'bg-green-600 text-white' :
                  stage.status === 'in-progress' ? 'bg-amber-600 text-white' :
                  stage.status === 'blocked' ? 'bg-orange-500 text-white' :
                  'bg-slate-700 text-slate-400'
                }`}>
                  {stage.status === 'completed' ? '✓' : stage.status === 'in-progress' ? '●' : stage.icon || (index + 1)}
                </div>
                {index < stages.length - 1 && (
                  <div className="w-px h-12 bg-gradient-to-b from-white/25 to-white/5 my-2"></div>
                )}
              </div>

              {/* Stage card */}
              <div className="flex-1 pb-4">
                <div className="rounded-2xl border border-white/8 bg-[#0f141b] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] transition hover:border-white/12">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">{stage.name}</h3>
                      <p className="text-slate-400 text-sm mb-2">{stage.description}</p>
                    </div>
                    <div className="ml-4 text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        stage.status === 'completed' ? 'bg-green-900 text-green-200' :
                        stage.status === 'in-progress' ? 'bg-amber-900 text-amber-200' :
                        stage.status === 'blocked' ? 'bg-orange-900 text-orange-200' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {stage.status === 'completed' && 'Zakończone'}
                        {stage.status === 'in-progress' && 'W trakcie'}
                        {stage.status === 'blocked' && 'W trakcie'}
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
      <div className="flex items-center justify-center gap-2 text-slate-500 text-sm mt-12 pt-6 border-t border-white/8">
        <span>🌐</span>
        <span>Każdy może przeglądać postępy</span>
      </div>
    </div>
  )
}

function DetailsContent({ project }: { project: Project }) {
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return { label: 'Aktywny', color: 'text-green-400 bg-green-900/30' }
      case 'completed':
        return { label: 'Ukończony', color: 'text-blue-400 bg-blue-900/30' }
      case 'archived':
        return { label: 'Zarchiwizowany', color: 'text-slate-400 bg-slate-800/30' }
      default:
        return { label: 'Nieznany', color: 'text-slate-400 bg-slate-800/30' }
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return { label: 'Wysoki', color: 'text-red-400 bg-red-900/30' }
      case 'medium':
        return { label: 'Średni', color: 'text-yellow-400 bg-yellow-900/30' }
      case 'low':
        return { label: 'Niski', color: 'text-green-400 bg-green-900/30' }
      default:
        return { label: 'Nieznany', color: 'text-slate-400 bg-slate-800/30' }
    }
  }

  const statusStyle = getStatusLabel(project.status)
  const priorityStyle = getPriorityLabel(project.priority)

  return (
    <div className="space-y-6 pb-10">
      {/* Description Section */}
      <div className="rounded-2xl border border-white/8 bg-[#0f141b] p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/10">
            <span className="text-lg">📄</span>
          </span>
          <h3 className="text-lg font-semibold">Opis</h3>
        </div>
        <p className="text-slate-300 leading-relaxed">{project.description}</p>
      </div>

      {/* Status & Priority Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status */}
        <div className="rounded-2xl border border-white/8 bg-[#0f141b] p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">✓</span>
            <span className="text-xs font-semibold text-slate-400 uppercase">Status</span>
          </div>
          <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusStyle.color}`}>
            {statusStyle.label}
          </div>
          <p className="text-xs text-slate-500 mt-2">{new Date(project.startDate).toLocaleDateString('pl-PL')}</p>
        </div>

        {/* Progress */}
        <div className="rounded-2xl border border-white/8 bg-[#0f141b] p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">📊</span>
            <span className="text-xs font-semibold text-slate-400 uppercase">Postęp ogólny</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{project.progress}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-violet-500 to-indigo-500 h-full rounded-full transition-all"
              style={{ width: `${project.progress}%` }}
            ></div>
          </div>
        </div>

        {/* Last Update */}
        <div className="rounded-2xl border border-white/8 bg-[#0f141b] p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🕐</span>
            <span className="text-xs font-semibold text-slate-400 uppercase">Ostatnia aktualizacja</span>
          </div>
          <p className="text-sm text-slate-300">{new Date(project.lastUpdate).toLocaleDateString('pl-PL')}</p>
          <p className="text-xs text-slate-500 mt-1">{new Date(project.lastUpdate).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </div>

      {/* Team & Technologies Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Team */}
        <div className="rounded-2xl border border-white/8 bg-[#0f141b] p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">👥</span>
            <span className="text-xs font-semibold text-slate-400 uppercase">Zespół</span>
          </div>
          <p className="text-2xl font-bold text-white">{project.teamSize}</p>
          <p className="text-xs text-slate-500 mt-1">członków zespołu</p>
        </div>

        {/* Priority */}
        <div className="rounded-2xl border border-white/8 bg-[#0f141b] p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">⚡</span>
            <span className="text-xs font-semibold text-slate-400 uppercase">Priorytet</span>
          </div>
          <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${priorityStyle.color}`}>
            {priorityStyle.label}
          </div>
        </div>
      </div>

      {/* Technologies */}
      {project.technologies && project.technologies.length > 0 && (
        <div className="rounded-2xl border border-white/8 bg-[#0f141b] p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-lg">💻</span>
            <h3 className="text-lg font-semibold">Technologie</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {project.technologies.map((tech) => (
              <span 
                key={tech}
                className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-slate-300 border border-white/20"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Project Goals */}
      {project.goals && project.goals.length > 0 && (
        <div className="rounded-2xl border border-white/8 bg-[#0f141b] p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-lg">🎯</span>
            <h3 className="text-lg font-semibold">Cele projektu</h3>
          </div>
          <ul className="space-y-2">
            {project.goals.map((goal, index) => (
              <li key={index} className="flex items-start gap-3 text-slate-300">
                <span className="flex-shrink-0 w-5 h-5 rounded-full border border-white/30 flex items-center justify-center mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-white/60"></span>
                </span>
                <span>{goal}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-center gap-2 text-slate-500 text-sm mt-8 pt-6 border-t border-white/8">
        <span>🌐</span>
        <span>Każdy może przeglądać postępy</span>
      </div>
    </div>
  )
}
