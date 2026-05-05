import { useState, useEffect } from 'react'
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
              <button className="relative pb-3 font-medium text-violet-300 after:absolute after:inset-x-0 after:bottom-[-1px] after:h-[2px] after:rounded-full after:bg-violet-400">Roadmapa</button>
              <button className="pb-3 text-slate-400">GitHub</button>
            </div>

            {selectedProject ? (
              <ProjectContent project={selectedProject} />
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
    <div className="space-y-6 pb-10">
      <section className="rounded-3xl border border-white/8 bg-white/[0.03] p-4 sm:p-6 lg:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 text-3xl shadow-lg shadow-violet-500/20">
              {project.icon}
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{project.name}</h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">{project.description}</p>
            </div>
          </div>
          <a href="#" className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-slate-300 hover:bg-white/[0.05]">
            <span>GitHub</span>
            <span>↗</span>
          </a>
        </div>
      </section>

      {/* Roadmap Timeline */}
      <div className="space-y-4">
        {stages.map((stage, index) => (
          <div key={stage.id}>
            <div className="flex gap-4">
              {/* Timeline dot */}
              <div className="flex flex-col items-center">
                <div className={`grid h-12 w-12 place-items-center rounded-full text-lg font-semibold ring-1 ring-white/10 ${
                  stage.status === 'completed' ? 'bg-green-600 text-white' :
                  stage.status === 'in-progress' ? 'bg-blue-600 text-white' :
                  stage.status === 'blocked' ? 'bg-orange-500 text-white' :
                  'bg-slate-700 text-slate-400'
                }`}>
                  {stage.icon || (index + 1)}
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
      <div className="flex items-center justify-center gap-2 text-slate-500 text-sm mt-12 pt-6 border-t border-white/8">
        <span>🌐</span>
        <span>Każdy może przeglądać postępy</span>
      </div>
    </div>
  )
}
