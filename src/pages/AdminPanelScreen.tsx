import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  FaBars,
  FaCheckCircle,
  FaChevronDown,
  FaClone,
  FaCode,
  FaClock,
  FaCogs,
  FaDatabase,
  FaEdit,
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

interface ManagementTabContentProps {
  projects: Project[]
  stages: Stage[]
  selectedProject: Project | null
  setSelectedProject: (project: Project) => void
  resetProjectForm: (project?: Project) => void
  resetStageForm: (stage?: Stage) => void
  handleDuplicateProject: (project: Project) => Promise<void>
  handleDuplicateStage: (stage: Stage) => Promise<void>
  handleDeleteProject: (id: string) => Promise<void>
  handleDeleteStage: (id: string) => Promise<void>
  selectedProjectStages: Stage[]
}

function ManagementTabContent({
  projects,
  stages,
  selectedProject,
  setSelectedProject,
  resetProjectForm,
  resetStageForm,
  handleDuplicateProject,
  handleDuplicateStage,
  handleDeleteProject,
  handleDeleteStage,
  selectedProjectStages,
}: ManagementTabContentProps) {
  const stageCountByProject = (projectId: string) => stages.filter((s) => s.projectId === projectId).length

  return (
    <div className="space-y-6 pb-10">
      {/* Projects section */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-white">Projekty</h2>
            <p className="mt-0.5 text-xs sm:text-sm text-slate-400">Zarządzaj wszystkimi projektami</p>
          </div>
          <button
            onClick={() => resetProjectForm()}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:from-indigo-400 hover:to-violet-400 flex-shrink-0"
          >
            <FaPlus className="text-sm" />
            <span>Dodaj projekt</span>
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-800/80 bg-[#0f141b]">
            <p className="text-slate-400">Brak projektów. Utwórz swój pierwszy projekt.</p>
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, index) => {
              const stageCount = stageCountByProject(project.id)
              return (
                <div
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className={`cursor-pointer rounded-2xl border-1 transition ${
                    selectedProject?.id === project.id
                      ? 'border-violet-400/45 bg-violet-500/15'
                      : 'border-slate-800/80 bg-[#0f141b] hover:border-slate-700/80'
                  } p-4 shadow-[0_12px_28px_rgba(0,0,0,0.18)]`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={`grid h-8 w-8 sm:h-10 sm:w-10 place-items-center rounded-lg sm:rounded-xl bg-gradient-to-br ${PROJECT_GRADIENTS[index % PROJECT_GRADIENTS.length]} text-white shadow-lg shadow-black/20 flex-shrink-0`}>
                      {renderProjectIcon(project.icon)}
                    </span>
                    <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${
                      project.status === 'active'
                        ? 'border-emerald-500/20 bg-emerald-500/12 text-emerald-300'
                        : project.status === 'completed'
                          ? 'border-sky-500/20 bg-sky-500/12 text-sky-300'
                          : 'border-slate-500/20 bg-slate-500/15 text-slate-300'
                    }`}>
                      {getProjectStatusLabel(project.status)}
                    </span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-semibold text-white mb-1 truncate">{project.name}</h3>
                  <p className="line-clamp-2 text-xs text-slate-400 mb-3">{project.description}</p>

                  <div className="mb-4 grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-slate-800/50 bg-white/[0.03] px-2 py-1.5">
                      <div className="text-[9px] uppercase tracking-[0.1em] text-slate-500">Etapy</div>
                      <div className="mt-0.5 text-sm font-semibold text-white">{stageCount}</div>
                    </div>
                    <div className="rounded-lg border border-slate-800/50 bg-white/[0.03] px-2 py-1.5">
                      <div className="text-[9px] uppercase tracking-[0.1em] text-slate-500">Data</div>
                      <div className="mt-0.5 text-sm font-semibold text-white">{formatDate(project.createdAt)}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="flex-1 rounded-lg border border-slate-700/80 p-1.5 text-slate-300 transition hover:border-slate-600 hover:bg-white/[0.04]"
                      onClick={(e) => {
                        e.stopPropagation()
                        resetProjectForm(project)
                      }}
                      title="Edytuj projekt"
                    >
                      <FaEdit className="mx-auto" />
                    </button>
                    <button
                      type="button"
                      className="flex-1 rounded-lg border border-slate-700/80 p-1.5 text-slate-300 transition hover:border-slate-600 hover:bg-white/[0.04]"
                      onClick={(e) => {
                        e.stopPropagation()
                        void handleDuplicateProject(project)
                      }}
                      title="Powiel projekt"
                    >
                      <FaClone className="mx-auto" />
                    </button>
                    <button
                      type="button"
                      className="flex-1 rounded-lg border border-red-500/20 p-1.5 text-red-300 transition hover:bg-red-500/10"
                      onClick={(e) => {
                        e.stopPropagation()
                        void handleDeleteProject(project.id)
                      }}
                      title="Usuń projekt"
                    >
                      <FaTrashAlt className="mx-auto" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Stages section - only show if project is selected */}
      {selectedProject && (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Etapy</h2>
            <p className="mt-1 text-sm text-slate-400">
              {selectedProject
                ? `Zarządzaj etapami dla "${selectedProject.name}"`
                : 'Wybierz projekt, aby zarządzać etapami'}
            </p>
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

        {!selectedProject ? (
          <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-800/80 bg-[#0f141b]">
            <p className="text-slate-400">Wybierz projekt z listy po lewej, aby zarządzać etapami</p>
          </div>
        ) : selectedProjectStages.length === 0 ? (
          <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-800/80 bg-[#0f141b]">
            <p className="text-slate-400">Ten projekt nie ma jeszcze etapów</p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedProjectStages.map((stage) => (
              <div
                key={stage.id}
                className="rounded-2xl border-1 border-slate-800/80 bg-[#0f141b] p-4 shadow-[0_12px_28px_rgba(0,0,0,0.18)] transition hover:border-slate-700/80"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <span
                      className={`grid h-10 w-10 place-items-center rounded-full border text-sm font-semibold ${
                        stage.status === 'completed'
                          ? 'border-green-600/30 bg-green-900/30 text-green-200'
                          : stage.status === 'in-progress'
                            ? 'border-amber-600/30 bg-amber-900/30 text-amber-200'
                            : stage.status === 'blocked'
                              ? 'border-orange-500/30 bg-orange-900/30 text-orange-200'
                              : 'border-slate-700/30 bg-slate-800/30 text-slate-300'
                      }`}
                    >
                      {renderStageIcon(stage.icon)}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-white">{stage.name}</h3>
                      <span
                        className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${
                          stage.status === 'completed'
                            ? 'border-green-600/20 bg-green-900/30 text-green-200'
                            : stage.status === 'in-progress'
                              ? 'border-amber-600/20 bg-amber-900/30 text-amber-200'
                              : stage.status === 'blocked'
                                ? 'border-orange-500/20 bg-orange-900/30 text-orange-200'
                                : 'border-slate-700/20 bg-slate-800/30 text-slate-300'
                        }`}
                      >
                        {getStageStatusLabel(stage.status)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">{stage.description}</p>
                    <div className="text-xs text-slate-500">{formatDate(stage.createdAt)}</div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      className="rounded-lg border border-slate-700/80 p-1.5 text-slate-300 transition hover:border-slate-600 hover:bg-white/[0.04]"
                      onClick={() => resetStageForm(stage)}
                      title="Edytuj etap"
                    >
                      <FaEdit className="text-xs" />
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-slate-700/80 p-1.5 text-slate-300 transition hover:border-slate-600 hover:bg-white/[0.04]"
                      onClick={() => void handleDuplicateStage(stage)}
                      title="Powiel etap"
                    >
                      <FaClone className="text-xs" />
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-red-500/20 p-1.5 text-red-300 transition hover:bg-red-500/10"
                      onClick={() => void handleDeleteStage(stage.id)}
                      title="Usuń etap"
                    >
                      <FaTrashAlt className="text-xs" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      )}
    </div>
  )
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
  const [activeTab, setActiveTab] = useState<'management' | 'details' | 'links' | 'settings'>('management')

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
            className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left text-sm font-medium text-slate-300 transition hover:border-slate-700/30 hover:bg-white/5"
          >
            <FaGlobe className="text-slate-400" />
            Podgląd publiczny
            <span className="ml-auto text-slate-500">↗</span>
          </a>
        </div>
      </div>

      {selectedProject && (
        <>
      <div className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Bieżący projekt</div>
      <div className="px-3">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl border border-slate-700/30 bg-white/[0.03] px-3 py-2.5 text-left transition hover:border-slate-700/40 hover:bg-white/[0.05]"
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
            className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left text-sm font-medium text-slate-300 transition hover:border-slate-700/30 hover:bg-white/5"
          >
            <FaInfoCircle className="text-slate-400" />
            Szczegóły projektu
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left text-sm font-medium text-slate-300 transition hover:border-slate-700/30 hover:bg-white/5"
          >
            <FaCode className="text-slate-400" />
            Linki (GitHub)
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left text-sm font-medium text-slate-300 transition hover:border-slate-700/30 hover:bg-white/5"
          >
            <FaCogs className="text-slate-400" />
            Ustawienia
          </button>
        </div>
      </div>
        </>
      )}

      <div className="mt-auto border-t border-slate-700/30 p-4">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-xl border border-slate-700/30 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-700/40 hover:bg-white/[0.05]"
        >
          Wyloguj
        </button>
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
    <div className="min-h-screen bg-[#0a0d12] text-slate-100 flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-72 flex-shrink-0 flex-col border-r border-slate-800/80 bg-[#0b1118] lg:sticky lg:top-0 lg:h-screen lg:overflow-hidden">
        {sidebarContent}
      </aside>

      {/* Mobile overlay sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/65"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close navigation backdrop"
          />
          <aside className="absolute inset-y-0 left-0 flex h-full w-[86vw] max-w-sm flex-col border-r border-slate-800/80 bg-[#0b1118] shadow-2xl shadow-black/60">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-4xl px-3 py-3 sm:px-6 sm:py-4 lg:px-8 lg:py-8">
          {/* Mobile top bar */}
          <div className="mb-4 flex items-start justify-between gap-3 lg:hidden">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700/80 bg-white/[0.04] text-slate-100 flex-shrink-0"
              aria-label="Open navigation"
            >
              <FaBars />
            </button>
            <div className="flex flex-row items-center gap-2">
              <div className="min-w-0 text-right flex-1">
                <div className="truncate text-sm font-semibold text-white">Roadmap Admin</div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700/80 bg-white/[0.04] text-slate-100 flex-shrink-0"
                aria-label="Logout"
              >
                <span className="text-xs">Wyjdź</span>
              </button>
            </div>
          </div>

          {/* Header */}
          <div className="mb-6 hidden flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:flex">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Roadmap Admin</h1>
              <p className="mt-1 text-sm text-slate-400">Zarządzaj projektami i etapami roadmapy</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-4 sm:mb-6 flex items-center gap-4 sm:gap-6 border-b border-slate-700/20 text-xs sm:text-sm overflow-x-auto">
            <button
              onClick={() => setActiveTab('management')}
              className={`relative pb-3 font-medium transition whitespace-nowrap ${
                activeTab === 'management'
                  ? 'text-violet-300 after:absolute after:inset-x-0 after:bottom-[-1px] after:h-[2px] after:rounded-full after:bg-violet-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Zarządzanie
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`relative pb-3 font-medium transition whitespace-nowrap ${
                activeTab === 'details'
                  ? 'text-violet-300 after:absolute after:inset-x-0 after:bottom-[-1px] after:h-[2px] after:rounded-full after:bg-violet-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Szczegóły projektu
            </button>
            <button
              onClick={() => setActiveTab('links')}
              className={`relative pb-3 font-medium transition whitespace-nowrap ${
                activeTab === 'links'
                  ? 'text-violet-300 after:absolute after:inset-x-0 after:bottom-[-1px] after:h-[2px] after:rounded-full after:bg-violet-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Linki (GitHub)
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`relative pb-3 font-medium transition whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'text-violet-300 after:absolute after:inset-x-0 after:bottom-[-1px] after:h-[2px] after:rounded-full after:bg-violet-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Ustawienia
            </button>
          </div>

          {/* Tab content */}
          {activeTab === 'management' && (
            <ManagementTabContent
              projects={projects}
              stages={stages}
              selectedProject={selectedProject}
              setSelectedProject={setSelectedProject}
              resetProjectForm={resetProjectForm}
              resetStageForm={resetStageForm}
              handleDuplicateProject={handleDuplicateProject}
              handleDuplicateStage={handleDuplicateStage}
              handleDeleteProject={handleDeleteProject}
              handleDeleteStage={handleDeleteStage}
              selectedProjectStages={selectedProjectStages}
            />
          )}

          {activeTab === 'details' && (
            <div className="flex min-h-96 items-center justify-center rounded-3xl border border-slate-700/20 bg-white/[0.03]">
              <p className="text-slate-400">Szczegóły projektu - wkrótce dostępne</p>
            </div>
          )}

          {activeTab === 'links' && (
            <div className="flex min-h-96 items-center justify-center rounded-3xl border border-slate-700/20 bg-white/[0.03]">
              <p className="text-slate-400">Linki projektu - wkrótce dostępne</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="flex min-h-96 items-center justify-center rounded-3xl border border-slate-700/20 bg-white/[0.03]">
              <p className="text-slate-400">Ustawienia - wkrótce dostępne</p>
            </div>
          )}
        </div>
      </main>

      {showNewProjectForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-[20px] sm:rounded-[28px] border border-slate-700/30 bg-gradient-to-b from-[#101620] to-[#0b1118] p-5 sm:p-8 shadow-2xl shadow-black/60">
            <div className="mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-white">{projectFormMode === 'edit' ? 'Edytuj projekt' : 'Nowy projekt'}</h2>
              <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-slate-400">
                {projectFormMode === 'edit' ? 'Zaktualizuj szczegóły projektu' : 'Utwórz nowy projekt w roadmapie'}
              </p>
            </div>

            <form onSubmit={handleProjectFormSubmit} className="space-y-4 sm:space-y-5">
              <div>
                <label className="mb-1.5 sm:mb-2.5 flex items-center gap-2 text-xs sm:text-sm font-semibold text-white">
                  <span className="text-violet-300">●</span> Nazwa projektu
                </label>
                <input
                  type="text"
                  value={newProjectData.name}
                  onChange={(e) => setNewProjectData({ ...newProjectData, name: e.target.value })}
                  placeholder="np. Aplikacja mobilna"
                  className="w-full rounded-lg sm:rounded-xl border border-slate-700/30 bg-white/[0.03] px-3 sm:px-4 py-2 sm:py-3 text-sm text-white outline-none placeholder:text-slate-500 transition focus:border-violet-400/60 focus:bg-white/[0.05]"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 sm:mb-2.5 flex items-center gap-2 text-xs sm:text-sm font-semibold text-white">
                  <span className="text-violet-300">●</span> Opis
                </label>
                <textarea
                  value={newProjectData.description}
                  onChange={(e) => setNewProjectData({ ...newProjectData, description: e.target.value })}
                  placeholder="Opisz cel i zakres tego projektu..."
                  className="w-full resize-none rounded-lg sm:rounded-xl border border-slate-700/30 bg-white/[0.03] px-3 sm:px-4 py-2 sm:py-3 text-sm text-white outline-none placeholder:text-slate-500 transition focus:border-violet-400/60 focus:bg-white/[0.05]"
                  rows={2}
                />
              </div>

              <div>
                <label className="mb-1.5 sm:mb-2.5 flex items-center gap-2 text-xs sm:text-sm font-semibold text-white">
                  <span className="text-violet-300">●</span> Ikona / emoji
                </label>
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2 sm:grid-cols-5">
                  {Object.keys(PROJECT_ICON_COMPONENTS).map((iconKey) => (
                    <button
                      key={iconKey}
                      type="button"
                      onClick={() => setNewProjectData({ ...newProjectData, icon: iconKey })}
                      className={`flex h-9 sm:h-10 items-center justify-center rounded-lg border text-sm sm:text-base transition ${
                        newProjectData.icon === iconKey
                          ? 'border-violet-400 bg-violet-500/20 text-violet-300'
                          : 'border-slate-700/30 bg-white/[0.03] text-slate-400 hover:border-slate-700/50 hover:bg-white/[0.05] hover:text-slate-300'
                      }`}
                      title={iconKey}
                    >
                      {renderProjectIcon(iconKey)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 sm:gap-3 pt-1 sm:pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-lg sm:rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:from-indigo-400 hover:to-violet-400"
                >
                  {projectFormMode === 'edit' ? 'Zapisz' : 'Utwórz'}
                </button>
                <button
                  type="button"
                  onClick={closeProjectForm}
                  className="flex-1 rounded-lg sm:rounded-xl border border-slate-700/30 bg-white/[0.03] px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base font-medium text-slate-300 transition hover:border-slate-700/50 hover:bg-white/[0.05]"
                >
                  Anuluj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showNewStageForm && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-[20px] sm:rounded-[28px] border border-slate-700/30 bg-gradient-to-b from-[#101620] to-[#0b1118] p-5 sm:p-8 shadow-2xl shadow-black/60">
            <div className="mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-white">{stageFormMode === 'edit' ? 'Edytuj etap' : 'Nowy etap'}</h2>
              <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-slate-400">Projekt: <span className="font-medium text-violet-300 truncate">{selectedProject.name}</span></p>
            </div>

            <form onSubmit={handleStageFormSubmit} className="space-y-4 sm:space-y-5">
              <div>
                <label className="mb-1.5 sm:mb-2.5 flex items-center gap-2 text-xs sm:text-sm font-semibold text-white">
                  <span className="text-violet-300">●</span> Nazwa etapu
                </label>
                <input
                  type="text"
                  value={newStageData.name}
                  onChange={(e) => setNewStageData({ ...newStageData, name: e.target.value })}
                  placeholder="np. Implementacja"
                  className="w-full rounded-lg sm:rounded-xl border border-slate-700/30 bg-white/[0.03] px-3 sm:px-4 py-2 sm:py-3 text-sm text-white outline-none placeholder:text-slate-500 transition focus:border-violet-400/60 focus:bg-white/[0.05]"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 sm:mb-2.5 flex items-center gap-2 text-xs sm:text-sm font-semibold text-white">
                  <span className="text-violet-300">●</span> Opis
                </label>
                <textarea
                  value={newStageData.description}
                  onChange={(e) => setNewStageData({ ...newStageData, description: e.target.value })}
                  placeholder="Opisz co zostanie wykonane w tym etapie..."
                  className="w-full resize-none rounded-lg sm:rounded-xl border border-slate-700/30 bg-white/[0.03] px-3 sm:px-4 py-2 sm:py-3 text-sm text-white outline-none placeholder:text-slate-500 transition focus:border-violet-400/60 focus:bg-white/[0.05]"
                  rows={2}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 sm:mb-2.5 flex items-center gap-2 text-xs sm:text-sm font-semibold text-white">
                    <span className="text-violet-300">●</span> Status
                  </label>
                  <select
                    value={newStageData.status}
                    onChange={(e) => setNewStageData({ ...newStageData, status: e.target.value as typeof newStageData.status })}
                    className="w-full rounded-lg sm:rounded-xl border border-slate-700/30 bg-white/[0.03] px-3 sm:px-4 py-2 sm:py-3 text-sm text-white outline-none transition focus:border-violet-400/60 focus:bg-white/[0.05]"
                  >
                    <option value="pending">Oczekujące</option>
                    <option value="in-progress">W trakcie</option>
                    <option value="completed">Zakończone</option>
                    <option value="blocked">Zablokowane</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 sm:mb-2.5 flex items-center gap-2 text-xs sm:text-sm font-semibold text-white">
                    <span className="text-violet-300">●</span> Ikona / skrót
                  </label>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {['check', 'dot', '1', '2', '3', '4', '5'].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setNewStageData({ ...newStageData, icon: option })}
                        className={`flex h-8 sm:h-9 w-8 sm:w-9 items-center justify-center rounded-lg border text-xs sm:text-sm font-medium transition ${
                          newStageData.icon === option
                            ? 'border-violet-400 bg-violet-500/20 text-violet-300'
                            : 'border-slate-700/30 bg-white/[0.03] text-slate-400 hover:border-slate-700/50 hover:bg-white/[0.05] hover:text-slate-300'
                        }`}
                        title={option}
                      >
                        {renderStageIcon(option)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 sm:gap-3 pt-1 sm:pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-lg sm:rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:from-indigo-400 hover:to-violet-400"
                >
                  {stageFormMode === 'edit' ? 'Zapisz' : 'Utwórz'}
                </button>
                <button
                  type="button"
                  onClick={closeStageForm}
                  className="flex-1 rounded-lg sm:rounded-xl border border-slate-700/30 bg-white/[0.03] px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base font-medium text-slate-300 transition hover:border-slate-700/50 hover:bg-white/[0.05]"
                >
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
