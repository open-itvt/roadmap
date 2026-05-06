import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  FaBars,
  FaCalendarAlt,
  FaCheckCircle,
  FaChevronDown,
  FaClone,
  FaCode,
  FaClock,
  FaCogs,
  FaDatabase,
  FaEdit,
  FaEllipsisV,
  FaFolderOpen,
  FaGlobe,
  FaInfoCircle,
  FaListUl,
  FaLock,
  FaMobileAlt,
  FaPaintBrush,
  FaPlus,
  FaRocket,
  FaTrashAlt,
  FaCloud,
  FaChartLine,
} from 'react-icons/fa'
import type { IconType } from 'react-icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { projectsApi, stagesApi } from '@/api/endpoints'
import type { Project, Stage } from '@/types'

const EMOJI_ICON_KEY_MAP: Record<string, string> = {
  '🚀': 'rocket',
  '⚙️': 'cogs',
  '📱': 'mobile',
  '☁️': 'cloud',
  '🔒': 'lock',
  '🗄️': 'database',
  '📊': 'chart',
  '🎨': 'design',
  '🌍': 'globe',
}

const PROJECT_ICON_COMPONENTS: Record<string, IconType> = {
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

const PROJECT_GRADIENTS = [
  'from-violet-500 to-indigo-500',
  'from-slate-500 to-slate-700',
  'from-emerald-500 to-emerald-700',
  'from-amber-500 to-orange-600',
]

function normalizeProjectIconInput(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  return EMOJI_ICON_KEY_MAP[trimmed] || trimmed
}

function renderProjectIcon(value: string): ReactNode {
  const trimmed = value?.trim() || ''
  if (!trimmed) return <FaFolderOpen />

  const Icon = PROJECT_ICON_COMPONENTS[trimmed.toLowerCase()]
  if (Icon) return <Icon />

  return trimmed
}

function renderStageIcon(value: string): ReactNode {
  const trimmed = value?.trim() || ''
  if (!trimmed) return <FaCode />

  if (trimmed === 'check') return <FaCheckCircle />
  if (trimmed === 'dot') return <FaClock />
  if (/^\d+$/.test(trimmed)) return trimmed

  return trimmed.length <= 2 ? trimmed : <FaCode />
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('pl-PL')
}

function getProjectStatusLabel(status: Project['status']): string {
  switch (status) {
    case 'active':
      return 'Aktywny'
    case 'completed':
      return 'Zakończony'
    case 'archived':
      return 'Archiwum'
    default:
      return status
  }
}

function getProjectStatusClass(status: Project['status']): string {
  switch (status) {
    case 'active':
      return 'border-emerald-500/20 bg-emerald-500/12 text-emerald-300'
    case 'completed':
      return 'border-sky-500/20 bg-sky-500/12 text-sky-300'
    case 'archived':
      return 'border-slate-500/20 bg-slate-500/15 text-slate-300'
    default:
      return 'border-slate-500/20 bg-slate-500/15 text-slate-300'
  }
}

function getStageStatusLabel(status: Stage['status']): string {
  switch (status) {
    case 'completed':
      return 'Zakończone'
    case 'in-progress':
      return 'W trakcie'
    case 'blocked':
      return 'Zablokowane'
    case 'pending':
    default:
      return 'Oczekujące'
  }
}

function getStageStatusClass(status: Stage['status']): string {
  switch (status) {
    case 'completed':
      return 'border-emerald-500/20 bg-emerald-500/15 text-emerald-300'
    case 'in-progress':
      return 'border-amber-500/20 bg-amber-500/15 text-amber-300'
    case 'blocked':
      return 'border-red-500/20 bg-red-500/15 text-red-300'
    case 'pending':
    default:
      return 'border-slate-500/20 bg-slate-500/15 text-slate-300'
  }
}

export function AdminPanelScreen() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [stages, setStages] = useState<Stage[]>([])
  const [loading, setLoading] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showNewProjectForm, setShowNewProjectForm] = useState(false)
  const [showNewStageForm, setShowNewStageForm] = useState(false)
  const [projectFormMode, setProjectFormMode] = useState<'create' | 'edit'>('create')
  const [projectFormProjectId, setProjectFormProjectId] = useState<string | null>(null)
  const [stageFormMode, setStageFormMode] = useState<'create' | 'edit'>('create')
  const [stageFormStageId, setStageFormStageId] = useState<string | null>(null)
  const [newProjectData, setNewProjectData] = useState({
    name: '',
    description: '',
    icon: '',
    priority: 'medium' as Project['priority'],
    progress: 0,
    startDate: new Date().toISOString().split('T')[0],
    lastUpdate: new Date().toISOString(),
    teamSize: 0,
    technologies: [] as string[],
    goals: [] as string[],
    status: 'active' as Project['status'],
  })
  const [newStageData, setNewStageData] = useState({
    name: '',
    description: '',
    status: 'pending' as Stage['status'],
    icon: '',
  })

  useEffect(() => {
    void loadProjects()
  }, [])

  useEffect(() => {
    if (selectedProject) {
      void loadStages(selectedProject.id)
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

  const resetProjectForm = (project?: Project) => {
    if (project) {
      setProjectFormMode('edit')
      setProjectFormProjectId(project.id)
      setNewProjectData({
        name: project.name,
        description: project.description,
        icon: project.icon,
        priority: project.priority,
        progress: project.progress,
        startDate: project.startDate,
        lastUpdate: project.lastUpdate,
        teamSize: project.teamSize,
        technologies: [...project.technologies],
        goals: [...project.goals],
        status: project.status,
      })
    } else {
      setProjectFormMode('create')
      setProjectFormProjectId(null)
      setNewProjectData({
        name: '',
        description: '',
        icon: '',
        priority: 'medium' as Project['priority'],
        progress: 0,
        startDate: new Date().toISOString().split('T')[0],
        lastUpdate: new Date().toISOString(),
        teamSize: 0,
        technologies: [],
        goals: [],
        status: 'active' as Project['status'],
      })
    }
    setShowNewProjectForm(true)
  }

  const resetStageForm = (stage?: Stage) => {
    if (stage) {
      setStageFormMode('edit')
      setStageFormStageId(stage.id)
      setNewStageData({
        name: stage.name,
        description: stage.description,
        status: stage.status,
        icon: stage.icon,
      })
    } else {
      setStageFormMode('create')
      setStageFormStageId(null)
      setNewStageData({ name: '', description: '', status: 'pending' as Stage['status'], icon: '' })
    }
    setShowNewStageForm(true)
  }

  const closeProjectForm = () => {
    setShowNewProjectForm(false)
    setProjectFormMode('create')
    setProjectFormProjectId(null)
  }

  const closeStageForm = () => {
    setShowNewStageForm(false)
    setStageFormMode('create')
    setStageFormStageId(null)
  }

  const handleProjectFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const normalizedIcon = normalizeProjectIconInput(newProjectData.icon)

    try {
      if (projectFormMode === 'edit' && projectFormProjectId) {
        const updatedProject = await projectsApi.update(projectFormProjectId, {
          ...newProjectData,
          icon: normalizedIcon,
        })
        setProjects(projects.map((project) => (project.id === projectFormProjectId ? updatedProject : project)))
        if (selectedProject?.id === projectFormProjectId) {
          setSelectedProject(updatedProject)
        }
      } else {
        const newProject = await projectsApi.create({
          ...newProjectData,
          icon: normalizedIcon,
          status: newProjectData.status,
        })
        setProjects([...projects, newProject])
      }
      closeProjectForm()
    } catch (error) {
      console.error('Failed to save project:', error)
    }
  }

  const handleStageFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProject) return

    try {
      if (stageFormMode === 'edit' && stageFormStageId) {
        const updatedStage = await stagesApi.update(selectedProject.id, stageFormStageId, {
          ...newStageData,
        })
        setStages(stages.map((stage) => (stage.id === stageFormStageId ? updatedStage : stage)))
      } else {
        const newStage = await stagesApi.create(selectedProject.id, {
          ...newStageData,
          order: stages.length,
        })
        setStages([...stages, newStage])
      }
      closeStageForm()
    } catch (error) {
      console.error('Failed to save stage:', error)
    }
  }

  const handleDuplicateProject = async (project: Project) => {
    try {
      const duplicatedProject = await projectsApi.create({
        name: `${project.name} (kopia)`,
        description: project.description,
        icon: project.icon,
        status: project.status,
        priority: project.priority,
        progress: project.progress,
        startDate: project.startDate,
        lastUpdate: new Date().toISOString(),
        teamSize: project.teamSize,
        technologies: [...project.technologies],
        goals: [...project.goals],
      })
      setProjects([...projects, duplicatedProject])
    } catch (error) {
      console.error('Failed to duplicate project:', error)
    }
  }

  const handleDuplicateStage = async (stage: Stage) => {
    if (!selectedProject) return
    try {
      const duplicatedStage = await stagesApi.create(selectedProject.id, {
        name: `${stage.name} (kopia)`,
        description: stage.description,
        status: stage.status,
        icon: stage.icon,
        order: stages.length,
      })
      setStages([...stages, duplicatedStage])
    } catch (error) {
      console.error('Failed to duplicate stage:', error)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm('Are you sure?')) return
    try {
      await projectsApi.delete(projectId)
      const nextProjects = projects.filter((project) => project.id !== projectId)
      setProjects(nextProjects)
      if (selectedProject?.id === projectId) {
        setSelectedProject(nextProjects[0] || null)
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
      setStages(stages.filter((stage) => stage.id !== stageId))
    } catch (error) {
      console.error('Failed to delete stage:', error)
    }
  }

  const selectedProjectStages = selectedProject ? stages.filter((stage) => stage.projectId === selectedProject.id) : []

  const sidebarContent = (
    <>
      <div className="border-b border-[#1b2330] px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25">
            <span className="text-sm font-bold">R</span>
          </div>
          <div>
            <div className="text-base font-semibold tracking-tight text-white">Roadmap Admin</div>
            <div className="text-xs text-slate-400">Zarządzanie roadmapą</div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Zarządzanie</div>
        <div className="space-y-1.5">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl border border-violet-400/30 bg-violet-500/18 px-3 py-2.5 text-left text-sm font-medium text-white shadow-[0_0_0_1px_rgba(139,92,246,0.15)]"
          >
            <FaListUl className="text-violet-200" />
            Projekty
          </button>
          <a
            href="/"
            className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left text-sm font-medium text-slate-300 transition hover:border-white/8 hover:bg-white/5"
          >
            <FaGlobe className="text-slate-400" />
            Podgląd publiczny
            <span className="ml-auto text-slate-500">↗</span>
          </a>
        </div>
      </div>

      <div className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Bieżący projekt</div>
      <div className="px-3">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5 text-left transition hover:border-white/12 hover:bg-white/[0.05]"
        >
          <span className={`grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br ${PROJECT_GRADIENTS[0]} text-white shadow-lg shadow-violet-500/20`}>
            {renderProjectIcon(selectedProject?.icon || '')}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-white">{selectedProject?.name || 'Wybierz projekt'}</span>
          </span>
          <FaChevronDown className="text-slate-400" />
        </button>
      </div>

      <div className="px-3 py-4">
        <div className="space-y-1.5">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl border border-violet-400/30 bg-violet-500/15 px-3 py-2.5 text-left text-sm font-medium text-white"
          >
            <FaListUl className="text-violet-200" />
            Etapy
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left text-sm font-medium text-slate-300 transition hover:border-white/8 hover:bg-white/5"
          >
            <FaInfoCircle className="text-slate-400" />
            Szczegóły projektu
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left text-sm font-medium text-slate-300 transition hover:border-white/8 hover:bg-white/5"
          >
            <FaCode className="text-slate-400" />
            Linki (GitHub)
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left text-sm font-medium text-slate-300 transition hover:border-white/8 hover:bg-white/5"
          >
            <FaCogs className="text-slate-400" />
            Ustawienia
          </button>
        </div>
      </div>

      <div className="mt-auto border-t border-white/8 p-4">
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3.5">
          <div className="text-xs font-semibold text-white">Potrzebujesz pomocy?</div>
          <div className="mt-1 text-xs leading-5 text-slate-400">Zobacz dokumentację lub wróć do publicznego widoku.</div>
          <a href="/" className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-violet-300 transition hover:text-violet-200">
            Zobacz dokumentację
            <span>↗</span>
          </a>
        </div>
      </div>
    </>
  )

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0d12] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.12),transparent_40%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.08),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.015),transparent_28%)]" />
      <div className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-violet-500/8 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-cyan-500/8 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-[1440px] overflow-hidden border border-[#1b2330] bg-[#0b0f14] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_28px_90px_rgba(0,0,0,0.58)] lg:m-4 lg:rounded-[28px]">
        <aside className="hidden w-[288px] flex-col border-r border-[#1b2330] bg-[#0b1118] lg:flex">{sidebarContent}</aside>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1160px] px-4 py-4 sm:px-6 lg:px-10 lg:py-8">
            <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((current) => !current)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-100"
                aria-label="Open navigation"
              >
                <FaBars />
              </button>
              <div className="min-w-0 flex-1 text-center">
                <div className="truncate text-sm font-semibold text-white">Roadmap Admin</div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-slate-300"
              >
                Wyloguj
              </button>
            </div>

            {isMobileMenuOpen && (
              <div className="fixed inset-0 z-50 lg:hidden">
                <button
                  type="button"
                  className="absolute inset-0 bg-black/65 backdrop-blur-[1px]"
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Close navigation backdrop"
                />
                <aside className="absolute inset-y-0 left-0 flex h-full w-[86vw] max-w-sm flex-col border-r border-[#1b2330] bg-[#0b1118] shadow-2xl shadow-black/60">
                  {sidebarContent}
                </aside>
              </div>
            )}

            <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start md:gap-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#1b2330] bg-white/[0.03] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Roadmap Admin</div>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Projekty</h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-400">Zarządzaj wszystkimi projektami w roadmapie.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => resetProjectForm()}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:from-indigo-400 hover:to-violet-400"
                >
                  <FaPlus />
                  <span>Dodaj projekt</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="hidden rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06] lg:inline-flex"
                >
                  Wyloguj
                </button>
              </div>
            </div>

            <section className="hidden rounded-3xl border border-[#1b2330] bg-[#0c1117]/95 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] lg:block">
              <div className="flex items-center justify-between gap-4 border-b border-[#1b2330] px-4 py-4 sm:px-6">
                <div>
                  <h2 className="text-lg font-semibold text-white sm:text-xl">Lista projektów</h2>
                  <p className="mt-1 text-sm text-slate-400">Szybki podgląd wszystkich pozycji w roadmapie.</p>
                </div>
                <div className="hidden items-center gap-3 text-xs text-slate-500 sm:flex">
                  <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5">{projects.length ? `1-${projects.length} z ${projects.length} projektów` : '0 projektów'}</span>
                </div>
              </div>

              <div className="space-y-3 px-4 py-4 md:hidden">
                {projects.map((project, index) => {
                  const stageCount = stages.filter((stage) => stage.projectId === project.id).length
                  const isSelected = selectedProject?.id === project.id
                  return (
                    <div
                      key={project.id}
                      onClick={() => setSelectedProject(project)}
                      className={`rounded-[22px] border p-4 transition ${
                        isSelected ? 'border-violet-400/30 bg-violet-500/10' : 'border-[#1b2330] bg-[#0f141b]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`grid h-11 w-11 flex-shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${PROJECT_GRADIENTS[index % PROJECT_GRADIENTS.length]} text-white shadow-lg shadow-black/20`}>
                          {renderProjectIcon(project.icon)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="truncate text-sm font-semibold text-white">{project.name}</h3>
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getProjectStatusClass(project.status)}`}>
                              {getProjectStatusLabel(project.status)}
                            </span>
                          </div>
                          <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-400">{project.description}</p>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-400">
                        <div className="rounded-xl border border-[#1b2330] bg-black/20 px-3 py-2">
                          <div className="uppercase tracking-[0.18em] text-slate-500">Etapy</div>
                          <div className="mt-1 text-sm text-slate-200">{stageCount}</div>
                        </div>
                        <div className="rounded-xl border border-[#1b2330] bg-black/20 px-3 py-2">
                          <div className="uppercase tracking-[0.18em] text-slate-500">Data</div>
                          <div className="mt-1 text-sm text-slate-200">{formatDate(project.createdAt)}</div>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#1b2330] bg-white/[0.02] px-3 py-2 text-sm text-slate-200"
                          onClick={(e) => {
                            e.stopPropagation()
                            resetProjectForm(project)
                          }}
                        >
                          <FaEdit />
                          Edytuj
                        </button>
                        <button
                          type="button"
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#1b2330] bg-white/[0.02] px-3 py-2 text-sm text-slate-200"
                          onClick={(e) => {
                            e.stopPropagation()
                            void handleDuplicateProject(project)
                          }}
                        >
                          <FaClone />
                          Kopiuj
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            void handleDeleteProject(project.id)
                          }}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-300"
                          aria-label={`Delete project ${project.name}`}
                        >
                          <FaTrashAlt />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="hidden border-b border-[#1b2330] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 md:grid md:grid-cols-[minmax(0,1.6fr)_minmax(0,2.1fr)_110px_120px_110px] md:items-center md:gap-4 md:px-6">
                <div>Nazwa projektu</div>
                <div>Opis (skrót)</div>
                <div>Liczba etapów</div>
                <div>Data utworzenia</div>
                <div className="text-right">Akcje</div>
              </div>

              <div className="hidden divide-y divide-[#1b2330] md:block">
                {projects.map((project, index) => {
                  const stageCount = stages.filter((stage) => stage.projectId === project.id).length
                  const isSelected = selectedProject?.id === project.id
                  return (
                    <div
                      key={project.id}
                      onClick={() => setSelectedProject(project)}
                      className={`group cursor-pointer px-4 py-4 transition sm:px-6 ${isSelected ? 'bg-violet-500/8' : 'hover:bg-white/[0.03]'}`}
                    >
                      <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1.6fr)_minmax(0,2.1fr)_110px_120px_110px] md:items-center md:gap-4">
                        <button type="button" className="flex min-w-0 items-center gap-3 text-left" onClick={() => setSelectedProject(project)}>
                          <span className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${PROJECT_GRADIENTS[index % PROJECT_GRADIENTS.length]} text-white shadow-lg shadow-black/20`}>
                            {renderProjectIcon(project.icon)}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="truncate text-sm font-semibold text-white">{project.name}</h3>
                              <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getProjectStatusClass(project.status)}`}>{getProjectStatusLabel(project.status)}</span>
                            </div>
                            <div className="mt-1 text-xs text-slate-500 md:hidden">{formatDate(project.createdAt)}</div>
                          </div>
                        </button>

                        <p className="line-clamp-2 text-sm leading-6 text-slate-400">{project.description}</p>

                        <div className="flex items-center gap-2 text-sm text-slate-300 md:justify-start">
                          <span className="md:hidden text-xs uppercase tracking-[0.18em] text-slate-500">Etapy:</span>
                          <span>{stageCount}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-slate-300 md:justify-start">
                          <FaCalendarAlt className="text-slate-500 md:hidden" />
                          <span>{formatDate(project.createdAt)}</span>
                        </div>

                        <div className="flex items-center gap-2 md:justify-end">
                          <button
                            type="button"
                            className="rounded-lg border border-white/8 p-2 text-slate-300 transition hover:border-white/12 hover:bg-white/[0.04]"
                            aria-label={`Edit project ${project.name}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              resetProjectForm(project)
                            }}
                          >
                            <FaEdit />
                          </button>
                          <button
                            type="button"
                            className="rounded-lg border border-white/8 p-2 text-slate-300 transition hover:border-white/12 hover:bg-white/[0.04]"
                            aria-label={`Clone project ${project.name}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              void handleDuplicateProject(project)
                            }}
                          >
                            <FaClone />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              void handleDeleteProject(project.id)
                            }}
                            className="rounded-lg border border-red-500/20 p-2 text-red-300 transition hover:bg-red-500/10"
                            aria-label={`Delete project ${project.name}`}
                          >
                            <FaTrashAlt />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {!projects.length && <div className="px-6 py-12 text-center text-sm text-slate-400">Brak projektów do wyświetlenia.</div>}
              </div>

              <div className="hidden items-center justify-between gap-4 border-t border-[#1b2330] px-4 py-4 text-sm text-slate-400 sm:px-6 md:flex">
                <div>{projects.length ? `1-${projects.length} z ${projects.length} projektów` : '0 projektów'}</div>
                <div className="flex items-center gap-2">
                  <button type="button" className="rounded-lg border border-[#1b2330] p-2 transition hover:bg-white/[0.04]" aria-label="Previous page">
                    <span className="text-slate-400">‹</span>
                  </button>
                  <span className="rounded-lg border border-violet-400/40 bg-violet-500/12 px-3 py-1.5 text-sm font-semibold text-violet-200">1</span>
                  <button type="button" className="rounded-lg border border-[#1b2330] p-2 transition hover:bg-white/[0.04]" aria-label="Next page">
                    <span className="text-slate-400">›</span>
                  </button>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-[#1b2330] bg-[#0c1117]/95 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
              <div className="flex flex-col gap-4 border-b border-[#1b2330] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <h2 className="text-xl font-semibold text-white sm:text-2xl">Etapy</h2>
                  <p className="mt-1 text-sm text-slate-400">Zarządzaj etapami roadmapy dla tego projektu.</p>
                </div>
                <button
                  onClick={() => resetStageForm()}
                  disabled={!selectedProject}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:from-indigo-400 hover:to-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FaPlus />
                  <span>Dodaj etap</span>
                </button>
              </div>

              <div className="space-y-2.5 p-4 sm:space-y-3 sm:p-6">
                {!selectedProject && (
                  <div className="rounded-2xl border border-[#1b2330] bg-white/[0.03] p-6 text-sm text-slate-400">
                    Wybierz projekt, aby zobaczyć jego etapy.
                  </div>
                )}

                {selectedProjectStages.map((stage) => (
                  <div key={stage.id} className="rounded-2xl border border-[#1b2330] bg-white/[0.03] p-4 transition hover:border-slate-700 hover:bg-white/[0.05] sm:p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-shrink-0 items-center gap-2.5">
                        <span className={`grid h-10 w-10 flex-shrink-0 place-items-center rounded-full border text-sm font-semibold ${
                          stage.status === 'completed'
                            ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                            : stage.status === 'in-progress'
                              ? 'border-amber-500/30 bg-amber-500/15 text-amber-300'
                              : stage.status === 'blocked'
                                ? 'border-red-500/30 bg-red-500/15 text-red-300'
                                : 'border-slate-500/30 bg-slate-500/15 text-slate-300'
                        }`}>
                          {renderStageIcon(stage.icon)}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h3 className="text-base font-semibold text-white sm:text-lg">{stage.name}</h3>
                          <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold leading-none ${getStageStatusClass(stage.status)}`}>
                            {getStageStatusLabel(stage.status)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm leading-5 text-slate-400 sm:mt-1.5 sm:text-base">{stage.description}</p>
                        <div className="mt-3 flex items-center gap-4 text-xs text-slate-500 sm:hidden">
                          <div className="flex items-center gap-1">
                            <FaCalendarAlt />
                            <span>{formatDate(stage.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => void handleDeleteStage(stage.id)}
                        className="mt-0.5 flex-shrink-0 rounded-lg border border-slate-600/40 p-2 text-slate-400 transition hover:border-slate-500 hover:bg-white/[0.04] sm:hidden"
                        aria-label={`Delete stage ${stage.name}`}
                      >
                        <FaTrashAlt className="text-xs" />
                      </button>
                    </div>

                    <div className="mt-4 hidden items-center justify-between gap-3 sm:flex sm:mt-4">
                      <div className="text-xs text-slate-500">
                        <div className="uppercase tracking-[0.15em]">Data</div>
                        <div className="mt-1 text-sm text-slate-300">{formatDate(stage.createdAt)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="rounded-lg border border-[#1b2330] p-2 text-slate-300 transition hover:border-slate-700 hover:bg-white/[0.04]"
                          aria-label={`Edit stage ${stage.name}`}
                          onClick={() => resetStageForm(stage)}
                        >
                          <FaEdit />
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-[#1b2330] p-2 text-slate-300 transition hover:border-slate-700 hover:bg-white/[0.04]"
                          aria-label={`Clone stage ${stage.name}`}
                          onClick={() => void handleDuplicateStage(stage)}
                        >
                          <FaClone />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteStage(stage.id)}
                          className="rounded-lg border border-red-500/20 p-2 text-red-300 transition hover:bg-red-500/10"
                          aria-label={`Delete stage ${stage.name}`}
                        >
                          <FaTrashAlt />
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-[#1b2330] p-2 text-slate-400 transition hover:border-slate-700 hover:bg-white/[0.04]"
                          aria-label={`More actions for ${stage.name}`}
                        >
                          <FaEllipsisV />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {selectedProject && !selectedProjectStages.length && (
                  <div className="rounded-2xl border border-[#1b2330] bg-white/[0.03] p-6 text-center text-sm text-slate-400">
                    Ten projekt nie ma jeszcze etapów.
                  </div>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>

      {showNewProjectForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-[28px] border border-[#1b2330] bg-gradient-to-b from-[#101620] to-[#0b1118] p-7 shadow-2xl shadow-black/60">
            <h2 className="text-2xl font-semibold text-white">{projectFormMode === 'edit' ? 'Edytuj projekt' : 'Nowy projekt'}</h2>
            <form onSubmit={handleProjectFormSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-white">Nazwa projektu</label>
                <input
                  type="text"
                  value={newProjectData.name}
                  onChange={(e) => setNewProjectData({ ...newProjectData, name: e.target.value })}
                  className="w-full rounded-xl border border-[#1b2330] bg-[#0f141b] px-4 py-2.5 text-white outline-none placeholder:text-slate-500 focus:border-violet-400"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-white">Opis</label>
                <textarea
                  value={newProjectData.description}
                  onChange={(e) => setNewProjectData({ ...newProjectData, description: e.target.value })}
                  className="w-full resize-none rounded-xl border border-[#1b2330] bg-[#0f141b] px-4 py-2.5 text-white outline-none placeholder:text-slate-500 focus:border-violet-400"
                  rows={3}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-white">Ikona / emoji</label>
                <input
                  type="text"
                  value={newProjectData.icon}
                  onChange={(e) => setNewProjectData({ ...newProjectData, icon: e.target.value })}
                  placeholder="np. 🚀, ⚙️, 📱, ☁️"
                  className="w-full rounded-xl border border-[#1b2330] bg-[#0f141b] px-4 py-2.5 text-white outline-none placeholder:text-slate-500 focus:border-violet-400"
                  maxLength={12}
                />
                <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-400">
                  <span>Podgląd:</span>
                  <span className="grid h-8 w-8 place-items-center rounded-lg border border-[#1b2330] bg-white/[0.02] text-base">{renderProjectIcon(normalizeProjectIconInput(newProjectData.icon))}</span>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 rounded-xl bg-violet-500 px-4 py-2.5 font-semibold text-white transition hover:bg-violet-600">
                  {projectFormMode === 'edit' ? 'Zapisz zmiany' : 'Utwórz'}
                </button>
                <button type="button" onClick={closeProjectForm} className="flex-1 rounded-xl border border-[#1b2330] px-4 py-2.5 text-white transition hover:bg-white/5">
                  Anuluj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showNewStageForm && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-[28px] border border-[#1b2330] bg-gradient-to-b from-[#101620] to-[#0b1118] p-7 shadow-2xl shadow-black/60">
            <h2 className="text-2xl font-semibold text-white">{stageFormMode === 'edit' ? 'Edytuj etap' : 'Nowy etap'}</h2>
            <p className="mt-2 text-sm text-slate-400">Projekt: {selectedProject.name}</p>
            <form onSubmit={handleStageFormSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-white">Nazwa etapu</label>
                <input
                  type="text"
                  value={newStageData.name}
                  onChange={(e) => setNewStageData({ ...newStageData, name: e.target.value })}
                  className="w-full rounded-xl border border-[#1b2330] bg-[#0f141b] px-4 py-2.5 text-white outline-none placeholder:text-slate-500 focus:border-violet-400"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-white">Opis</label>
                <textarea
                  value={newStageData.description}
                  onChange={(e) => setNewStageData({ ...newStageData, description: e.target.value })}
                  className="w-full resize-none rounded-xl border border-[#1b2330] bg-[#0f141b] px-4 py-2.5 text-white outline-none placeholder:text-slate-500 focus:border-violet-400"
                  rows={3}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-white">Status</label>
                  <select
                    value={newStageData.status}
                    onChange={(e) => setNewStageData({ ...newStageData, status: e.target.value as typeof newStageData.status })}
                    className="w-full rounded-xl border border-[#1b2330] bg-[#0f141b] px-4 py-2.5 text-white outline-none focus:border-violet-400"
                  >
                    <option value="pending">Oczekujące</option>
                    <option value="in-progress">W trakcie</option>
                    <option value="completed">Zakończone</option>
                    <option value="blocked">Zablokowane</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-white">Ikona / skrót</label>
                  <input
                    type="text"
                    value={newStageData.icon}
                    onChange={(e) => setNewStageData({ ...newStageData, icon: e.target.value })}
                    placeholder="check, dot, 1, 2"
                    className="w-full rounded-xl border border-[#1b2330] bg-[#0f141b] px-4 py-2.5 text-white outline-none placeholder:text-slate-500 focus:border-violet-400"
                    maxLength={12}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 rounded-xl bg-violet-500 px-4 py-2.5 font-semibold text-white transition hover:bg-violet-600">
                  {stageFormMode === 'edit' ? 'Zapisz zmiany' : 'Zapisz'}
                </button>
                <button type="button" onClick={closeStageForm} className="flex-1 rounded-xl border border-[#1b2330] px-4 py-2.5 text-white transition hover:bg-white/5">
                  Anuluj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
