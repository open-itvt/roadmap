import { useState, useEffect } from 'react'
import {
  FaCode,
  FaChevronDown,
  FaBars,
  FaPlus,
  FaEdit,
  FaClone,
  FaTrashAlt,
  FaChevronLeft,
  FaChevronRight,
} from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { projectsApi, stagesApi } from '@/api/endpoints'
import type { Project, Stage } from '@/types'

export function AdminPanel() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [stages, setStages] = useState<Stage[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewProjectForm, setShowNewProjectForm] = useState(false)
  const [showNewStageForm, setShowNewStageForm] = useState(false)
  const [newProjectData, setNewProjectData] = useState({
    name: '',
    description: '',
    icon: '',
    priority: 'medium' as const,
    progress: 0,
    startDate: new Date().toISOString().split('T')[0],
    lastUpdate: new Date().toISOString(),
    teamSize: 0,
    technologies: [] as string[],
    goals: [] as string[],
  })
  const [newStageData, setNewStageData] = useState({
    name: '',
    description: '',
    status: 'pending' as const,
    icon: '',
  })

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    if (selectedProject) {
      loadStages(selectedProject.id)
    }
  }, [selectedProject])

  const loadProjects = async () => {
    try {
      const data = await projectsApi.getAll()
      setProjects(data)
      if (data.length > 0 && !selectedProject) {
        setSelectedProject(data[0])
      }
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStages = async (projectId: string) => {
    try {
      const data = await stagesApi.getByProjectId(projectId)
      setStages(data.sort((a, b) => a.order - b.order))
    } catch (error) {
      console.error('Failed to load stages:', error)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/auth/login', { replace: true })
  }

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const newProject = await projectsApi.create({
        ...newProjectData,
        status: 'active',
      })
      setProjects([...projects, newProject])
      setNewProjectData({ 
        name: '', 
        description: '', 
        icon: '',
        priority: 'medium',
        progress: 0,
        startDate: new Date().toISOString().split('T')[0],
        lastUpdate: new Date().toISOString(),
        teamSize: 0,
        technologies: [],
        goals: [],
      })
      setShowNewProjectForm(false)
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }

  const handleAddStage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProject) return

    try {
      const newStage = await stagesApi.create(selectedProject.id, {
        ...newStageData,
        order: stages.length,
      })
      setStages([...stages, newStage])
      setNewStageData({ name: '', description: '', status: 'pending', icon: '' })
      setShowNewStageForm(false)
    } catch (error) {
      console.error('Failed to create stage:', error)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm('Are you sure?')) return
    try {
      await projectsApi.delete(projectId)
      setProjects(projects.filter(p => p.id !== projectId))
      if (selectedProject?.id === projectId) {
        setSelectedProject(projects[0] || null)
      }
    } catch (error) {
      console.error('Failed to delete project:', error)
    }
  }

  const handleDeleteStage = async (stageId: string) => {
    if (!window.confirm('Are you sure?')) return
    if (!selectedProject) return
    try {
      await stagesApi.delete(selectedProject.id, stageId)
      setStages(stages.filter(s => s.id !== stageId))
    } catch (error) {
      console.error('Failed to delete stage:', error)
    }
  }

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
          <aside className="hidden lg:flex w-[288px] flex-col border-r border-white/6 bg-[#0b1118]">
          <div className="px-6 py-5 border-b border-white/6">
            <div className="flex items-center gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25">
                <span className="text-sm font-semibold">R</span>
              </div>
              <div>
                <div className="text-base font-semibold tracking-tight">Roadmap Admin</div>
                <div className="text-xs text-slate-400">Zarządzanie projektami</div>
              </div>
            </div>
          </div>

          <div className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Bieżący projekt</div>
          <div className="px-3 pb-4 space-y-2 overflow-y-auto">
            {projects.map((project) => (
              <div
                key={project.id}
                className={`group flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                  selectedProject?.id === project.id
                    ? 'border-violet-400/45 bg-violet-500/15 text-white shadow-[0_0_0_1px_rgba(139,92,246,0.18)]'
                    : 'border-transparent text-slate-300 hover:border-white/6 hover:bg-white/5'
                }`}
                onClick={() => setSelectedProject(project)}
              >
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/8 text-lg"><FaCode /></span>
                <span className="truncate text-sm font-medium">{project.name}</span>
                <FaChevronDown className="ml-auto text-slate-400" />
              </div>
            ))}
          </div>

          <div className="mt-auto border-t border-white/6 p-4">
            <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-4">
              <div className="text-sm font-medium text-white">Potrzebujesz pomocy?</div>
              <div className="mt-1 text-xs leading-5 text-slate-400">Zobacz dokumentację lub wróć do widoku publicznego.</div>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1120px] px-4 py-4 sm:px-6 lg:px-10 lg:py-8">
            <div className="mb-5 flex items-center justify-between gap-3 lg:hidden">
              <button className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-slate-200">
                <FaBars />
              </button>
              <div className="text-sm font-medium">Roadmap Admin</div>
              <button onClick={handleLogout} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-slate-300">Wyloguj</button>
            </div>

            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Projekty</h1>
                <p className="mt-1 text-sm text-slate-400">Zarządzaj wszystkimi projektami w roadmapie.</p>
              </div>
              <button
                onClick={() => setShowNewProjectForm(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/25 transition hover:bg-violet-400"
              >
                <FaPlus />
                <span className="hidden sm:inline">Dodaj projekt</span>
                <span className="sm:hidden">Dodaj</span>
              </button>
            </div>

            <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-4 sm:p-6 lg:p-7">
              <div className="rounded-3xl border border-white/6 bg-white/[0.03] p-4 sm:p-6 lg:p-7">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/6 text-left text-xs uppercase tracking-[0.2em] text-slate-500">
                      <th className="pb-4 font-medium">Nazwa projektu</th>
                      <th className="pb-4 font-medium">Opis (skrót)</th>
                      <th className="pb-4 font-medium">Liczba etapów</th>
                      <th className="pb-4 font-medium">Data utworzenia</th>
                      <th className="pb-4 font-medium text-right">Akcje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((project) => {
                      const stageCount = stages.filter((stage) => stage.projectId === project.id).length
                      return (
                        <tr
                          key={project.id}
                          onClick={() => setSelectedProject(project)}
                          className={`cursor-pointer border-b border-white/6 transition hover:bg-white/[0.03] ${selectedProject?.id === project.id ? 'bg-white/[0.03]' : ''}`}
                        >
                          <td className="py-4 pr-4">
                            <div className="flex items-center gap-3">
                              <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/8 text-base">{project.icon}</div>
                              <div>
                                <div className="font-medium text-white">{project.name}</div>
                                <div className="text-xs text-slate-500">{project.status}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 pr-4 text-slate-400">{project.description}</td>
                          <td className="py-4 pr-4 text-slate-300">{stageCount}</td>
                          <td className="py-4 pr-4 text-slate-300">{new Date(project.createdAt).toLocaleDateString('pl-PL')}</td>
                          <td className="py-4 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button className="rounded-lg border border-white/6 p-2 text-slate-300 hover:bg-white/5"><FaEdit /></button>
                              <button className="rounded-lg border border-white/6 p-2 text-slate-300 hover:bg-white/5"><FaClone /></button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteProject(project.id)
                                }}
                                className="rounded-lg border border-red-500/20 p-2 text-red-300 hover:bg-red-500/10"
                              >
                                <FaTrashAlt />
                                </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                <span>1–{projects.length} z {projects.length} projektów</span>
                <div className="flex items-center gap-2">
                  <button className="rounded-lg border border-white/8 px-2.5 py-1.5"><FaChevronLeft /></button>
                    <button className="rounded-lg border border-white/6 px-2.5 py-1.5"><FaChevronLeft /></button>
                  <button className="rounded-lg border border-violet-400/45 bg-violet-500/15 px-3 py-1.5 text-violet-200">1</button>
                    <button className="rounded-lg border border-white/6 px-2.5 py-1.5"><FaChevronRight /></button>
                </div>
              </div>
            </div>
          </div>

            {selectedProject ? (
                <div className="mt-6 rounded-3xl border border-white/6 bg-white/[0.03] p-4 sm:p-6 lg:p-7">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight">Etapy – {selectedProject.name}</h2>
                    <p className="mt-1 text-sm text-slate-400">Zarządzaj etapami roadmapy dla tego projektu.</p>
                  </div>
                  <button
                    onClick={() => setShowNewStageForm(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/25 transition hover:bg-violet-400"
                  >
                    <span>＋</span>
                    <span>Dodaj etap</span>
                  </button>
                </div>

                {showNewStageForm && (
                  <form onSubmit={handleAddStage} className="mb-6 rounded-2xl border border-white/6 bg-black/20 p-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <input
                        type="text"
                        value={newStageData.name}
                        onChange={(e) => setNewStageData({ ...newStageData, name: e.target.value })}
                        placeholder="Stage name"
                        className="col-span-2 rounded-xl border border-white/6 bg-[#0f141b] px-3 py-2 text-white outline-none placeholder:text-slate-500 focus:border-violet-400"
                        required
                      />
                      <input
                        type="text"
                        value={newStageData.description}
                        onChange={(e) => setNewStageData({ ...newStageData, description: e.target.value })}
                        placeholder="Description"
                        className="col-span-2 rounded-xl border border-white/6 bg-[#0f141b] px-3 py-2 text-white outline-none placeholder:text-slate-500 focus:border-violet-400"
                      />
                      <select
                        value={newStageData.status}
                        onChange={(e) => setNewStageData({ ...newStageData, status: e.target.value as any })}
                        className="rounded-xl border border-white/6 bg-[#0f141b] px-3 py-2 text-white outline-none focus:border-violet-400"
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="blocked">Blocked</option>
                      </select>
                      <input
                        type="text"
                        value={newStageData.icon}
                        onChange={(e) => setNewStageData({ ...newStageData, icon: e.target.value })}
                        placeholder="Icon"
                        className="rounded-xl border border-white/6 bg-[#0f141b] px-3 py-2 text-white outline-none focus:border-violet-400"
                        maxLength={2}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="rounded-xl bg-violet-500 px-4 py-2 text-sm font-medium text-white hover:bg-violet-400">
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowNewStageForm(false)}
                          className="rounded-xl border border-white/6 px-4 py-2 text-sm text-slate-200 hover:bg-white/5"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-3">
                  {stages.map((stage) => (
                      <div key={stage.id} className="rounded-2xl border border-white/6 bg-[#0f141b] p-4 transition hover:border-white/8">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="mb-1 flex items-center gap-3">
                              <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/8 text-sm">{(stage.icon && stage.icon.length <= 2) ? stage.icon : <FaCode />}</span>
                            <h3 className="font-semibold">{stage.name}</h3>
                              <span className="rounded-full border border-white/6 px-2 py-0.5 text-[11px] text-slate-400">{stage.order + 1}</span>
                          </div>
                          <p className="ml-11 text-sm text-slate-400">{stage.description}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className={`ml-11 rounded-full px-2.5 py-1 text-xs font-medium ${
                              stage.status === 'completed' ? 'bg-green-900 text-green-200' :
                              stage.status === 'in-progress' ? 'bg-blue-900 text-blue-200' :
                              stage.status === 'blocked' ? 'bg-orange-900 text-orange-200' :
                              'bg-slate-800 text-slate-300'
                            }`}>
                              {stage.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                            <button className="rounded-lg border border-white/6 p-2 hover:bg-white/5"><FaEdit /></button>
                            <button className="rounded-lg border border-white/6 p-2 hover:bg-white/5"><FaClone /></button>
                          <button onClick={() => handleDeleteStage(stage.id)} className="rounded-lg border border-red-500/20 p-2 text-red-300 hover:bg-red-500/10"><FaTrashAlt /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {showNewProjectForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0b1118] p-6 shadow-2xl shadow-black/50">
                  <h2 className="text-xl font-semibold">Create New Project</h2>
                  <form onSubmit={handleAddProject} className="mt-5 space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">Project Name</label>
                      <input
                        type="text"
                        value={newProjectData.name}
                        onChange={(e) => setNewProjectData({ ...newProjectData, name: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-[#0f141b] px-4 py-2.5 text-white outline-none focus:border-violet-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">Description</label>
                      <textarea
                        value={newProjectData.description}
                        onChange={(e) => setNewProjectData({ ...newProjectData, description: e.target.value })}
                        className="w-full resize-none rounded-xl border border-white/10 bg-[#0f141b] px-4 py-2.5 text-white outline-none focus:border-violet-400"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">Icon (optional)</label>
                      <input
                        type="text"
                        value={newProjectData.icon}
                        onChange={(e) => setNewProjectData({ ...newProjectData, icon: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-[#0f141b] px-4 py-2.5 text-white outline-none focus:border-violet-400"
                        maxLength={2}
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button type="submit" className="flex-1 rounded-xl bg-violet-500 px-4 py-2.5 font-medium text-white hover:bg-violet-400">Create</button>
                      <button type="button" onClick={() => setShowNewProjectForm(false)} className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-white hover:bg-white/5">Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
