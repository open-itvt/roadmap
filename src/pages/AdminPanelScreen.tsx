import { useCallback, useEffect, useState } from 'react'
import {
  FaBars,
  FaChevronDown,
  FaClone,
  FaCode,
  FaCogs,
  FaEdit,
  FaGlobe,
  FaLock,
  FaInfoCircle,
  FaListUl,
  FaPlus,
  FaTrashAlt,
  FaExternalLinkAlt,
  FaStickyNote,
  FaKey,
} from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { projectsApi, stagesApi, linksApi } from '@/api/endpoints'
import { authApi } from '@/api/auth'
import type { Link, Project, Stage } from '@/types'
import { renderProjectIcon, renderStageIcon, normalizeProjectIconInput, PROJECT_ICON_COMPONENTS } from '@/utils/icons'
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const PROJECT_GRADIENTS = [
  'from-violet-500 to-indigo-500',
  'from-slate-500 to-slate-700',
  'from-emerald-500 to-emerald-700',
  'from-amber-500 to-orange-600',
]

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

interface SortableStageItemProps {
  stage: Stage
  index: number
  selectedStage: Stage | null
  editingStage: Stage | null
  canDeleteStage: boolean
  setSelectedStage: (stage: Stage) => void
  setEditingStage: (stage: Stage | null) => void
  handleDeleteStage: (id: string) => Promise<void>
}

function SortableStageItem({
  stage,
  index,
  selectedStage,
  editingStage,
  canDeleteStage,
  setSelectedStage,
  setEditingStage,
  handleDeleteStage,
}: SortableStageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: stage.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-2xl border-1 p-4 shadow-[0_12px_28px_rgba(0,0,0,0.18)] transition cursor-pointer ${
        editingStage?.id === stage.id
          ? 'border-violet-400/45 bg-violet-500/15'
          : selectedStage?.id === stage.id
            ? 'border-blue-400/45 bg-blue-500/15'
            : 'border-slate-800/80 bg-[#0f141b] hover:border-slate-700/80'
      }`}
      onClick={() => {
        if (selectedStage?.id === stage.id) {
          setEditingStage(stage)
        } else {
          setSelectedStage(stage)
          setEditingStage(null)
        }
      }}
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
            {index + 1}
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
          {stage.progress ? <div className="text-xs text-slate-500 mb-1">Postęp: {stage.progress}%</div> : null}
          <div className="text-xs text-slate-500">{formatDate(stage.createdAt)}</div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            className="rounded-lg border border-slate-700/80 p-1.5 text-slate-300 transition hover:border-slate-600 hover:bg-white/[0.04]"
            {...attributes}
            {...listeners}
            title="Przeciągnij, aby zmienić kolejność"
          >
            <FaListUl className="text-xs" />
          </button>
          {canDeleteStage && (
            <button
              type="button"
              className="rounded-lg border border-red-500/20 p-1.5 text-red-300 transition hover:bg-red-500/10"
              onClick={(e) => {
                e.stopPropagation()
                void handleDeleteStage(stage.id)
              }}
              title="Usuń etap"
            >
              <FaTrashAlt className="text-xs" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

interface ManagementTabContentProps {
  projects: Project[]
  stages: Stage[]
  selectedProject: Project | null
  setSelectedProject: (project: Project) => void
  resetProjectForm: (project?: Project) => void
  resetStageForm: (stage?: Stage) => void
  handleDuplicateProject: (project: Project) => Promise<void>
  handleDeleteStage: (id: string) => Promise<void>
  selectedProjectStages: Stage[]
  editingStage: Stage | null
  setEditingStage: (stage: Stage | null) => void
  handleSaveStageChanges: () => Promise<void>
  sensors: any[]
  handleDragEnd: (event: DragEndEvent) => void
  selectedStage: Stage | null
  setSelectedStage: (stage: Stage) => void
}

function ManagementTabContent({
  projects,
  stages,
  selectedProject,
  setSelectedProject,
  resetProjectForm,
  resetStageForm,
  handleDuplicateProject,
  handleDeleteStage,
  selectedProjectStages,
  editingStage,
  setEditingStage,
  handleSaveStageChanges,
  sensors,
  handleDragEnd,
  selectedStage,
  setSelectedStage,
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
          <div className="space-y-4">
            {editingStage ? (
              <div className="rounded-3xl border border-slate-700/20 bg-white/[0.03] p-6 sm:p-8">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FaEdit className="text-violet-300" />
                    <span className="text-sm font-semibold text-slate-300">Edytuj etap</span>
                  </div>
                  <button onClick={() => setEditingStage(null)} className="text-slate-400 hover:text-slate-300">×</button>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-white">Nazwa etapu</label>
                    <input
                      type="text"
                      value={editingStage.name}
                      onChange={(e) => setEditingStage({ ...editingStage, name: e.target.value })}
                      className="w-full rounded-xl border border-slate-700/30 bg-white/[0.03] px-4 py-3 text-white outline-none transition focus:border-violet-400/60 focus:bg-white/[0.05]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-white">Opis</label>
                    <textarea
                      value={editingStage.description}
                      onChange={(e) => setEditingStage({ ...editingStage, description: e.target.value })}
                      className="w-full resize-none rounded-xl border border-slate-700/30 bg-white/[0.03] px-4 py-3 text-white outline-none transition focus:border-violet-400/60 focus:bg-white/[0.05]"
                      rows={2}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-white">Status</label>
                      <select
                        value={editingStage.status}
                        onChange={(e) => setEditingStage({ ...editingStage, status: e.target.value as Stage['status'] })}
                        className="w-full rounded-xl border border-slate-700/30 bg-white/[0.03] px-4 py-3 text-white outline-none transition focus:border-violet-400/60"
                      >
                        <option value="pending">Oczekujące</option>
                        <option value="in-progress">W trakcie</option>
                        <option value="completed">Zakończone</option>
                        <option value="blocked">Zablokowane</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-white">Postęp (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={editingStage.progress || 0}
                        onChange={(e) => setEditingStage({ ...editingStage, progress: parseInt(e.target.value) || 0 })}
                        className="w-full rounded-xl border border-slate-700/30 bg-white/[0.03] px-4 py-3 text-white outline-none transition focus:border-violet-400/60 focus:bg-white/[0.05]"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-white">Ikona / skrót</label>
                      <div className="flex flex-wrap gap-2">
                        {['check', 'dot', '1', '2', '3', '4', '5'].map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setEditingStage({ ...editingStage, icon: option })}
                            className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-medium transition ${
                              editingStage.icon === option
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

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-white">Kolejność (ikona będzie przypisana automatycznie)</label>
                      <input
                        type="number"
                        min="1"
                        value={editingStage.order}
                        onChange={(e) => setEditingStage({ ...editingStage, order: parseInt(e.target.value) || 1 })}
                        className="w-full rounded-xl border border-slate-700/30 bg-white/[0.03] px-4 py-3 text-white outline-none transition focus:border-violet-400/60 focus:bg-white/[0.05]"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSaveStageChanges}
                      className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-3 font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:from-indigo-400 hover:to-violet-400"
                    >
                      Zapisz zmiany
                    </button>
                    <button
                      onClick={() => setEditingStage(null)}
                      className="flex-1 rounded-xl border border-slate-700/30 bg-white/[0.03] px-4 py-3 font-medium text-slate-300 transition hover:border-slate-700/50 hover:bg-white/[0.05]"
                    >
                      Anuluj
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={selectedProjectStages.map(s => s.id)}
                strategy={verticalListSortingStrategy}
              >
                {selectedProjectStages.map((stage, index) => (
                  <SortableStageItem
                    key={stage.id}
                    stage={stage}
                    index={index}
                    selectedStage={selectedStage}
                    editingStage={editingStage}
                    canDeleteStage={!selectedProject?.isLocked}
                    setSelectedStage={setSelectedStage}
                    setEditingStage={setEditingStage}
                    handleDeleteStage={handleDeleteStage}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        )}
      </section>
      )}
    </div>
  )
}

export function AdminPanelScreen() {
  const navigate = useNavigate()
  const { logout, adminId, hasPasskey, checkAuth } = useAuth()
  const [passkeyLoading, setPasskeyLoading] = useState(false)
  const [passkeyError, setPasskeyError] = useState<string | null>(null)
  const [passkeySupported, setPasskeySupported] = useState<boolean | null>(null)
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
    icon: 'rocket',
    privateNotes: '',
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
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [editingStage, setEditingStage] = useState<Stage | null>(null)
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null)
  const [selectedLinkStageId, setSelectedLinkStageId] = useState<string>('')
  const [stageLinks, setStageLinks] = useState<Link[]>([])
  const [projectLinks, setProjectLinks] = useState<Link[]>([])
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null)
  const [linkFormData, setLinkFormData] = useState<{
    title: string
    url: string
    description: string
    type: Link['type']
  }>({
    title: '',
    url: 'https://',
    description: '',
    type: 'other',
  })
  const [activeTab, setActiveTab] = useState<'management' | 'details' | 'links' | 'settings' | 'notes' | 'demo'>(
    (typeof window !== 'undefined' && localStorage.getItem('roadmap-admin-active-tab')) as 'management' | 'details' | 'links' | 'settings' | 'notes' | 'demo' || 'management'
  )

  const handleTabChange = (tab: 'management' | 'details' | 'links' | 'settings' | 'notes' | 'demo') => {
    setActiveTab(tab)
    if (typeof window !== 'undefined') {
      localStorage.setItem('roadmap-admin-active-tab', tab)
    }
    setIsMobileMenuOpen(false)
  }

  const base64UrlToBuffer = (value: string): ArrayBuffer => {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    const binary = atob(padded)
    const buffer = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index += 1) {
      buffer[index] = binary.charCodeAt(index)
    }
    return buffer.buffer
  }

  const bufferToBase64Url = (value: ArrayBuffer): string => {
    const bytes = new Uint8Array(value)
    let binary = ''
    for (const byte of bytes) {
      binary += String.fromCharCode(byte)
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
  }

  useEffect(() => {
    let cancelled = false

    const checkPasskeySupport = async () => {
      const supported =
        typeof window !== 'undefined' &&
        window.isSecureContext &&
        typeof window.PublicKeyCredential !== 'undefined' &&
        typeof navigator.credentials?.create === 'function'

      if (!supported) {
        if (!cancelled) {
          setPasskeySupported(false)
        }
        return
      }

      try {
        const platformAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.()
        if (!cancelled) {
          setPasskeySupported(platformAvailable !== false)
        }
      } catch {
        if (!cancelled) {
          setPasskeySupported(true)
        }
      }
    }

    void checkPasskeySupport()

    return () => {
      cancelled = true
    }
  }, [])

  const handleRegisterPasskey = async () => {
    if (!adminId) return
    setPasskeyLoading(true)
    setPasskeyError(null)

    try {
      const start = await authApi.webAuthnStartRegistration(adminId)
      const challenge = base64UrlToBuffer(start.challenge)

      const publicKey: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: { name: 'Roadmap Admin' },
        user: {
          id: new TextEncoder().encode(adminId),
          name: adminId,
          displayName: adminId,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },
          { alg: -257, type: 'public-key' },
        ],
        timeout: start.timeout,
        authenticatorSelection: { residentKey: 'preferred', userVerification: start.userVerification as UserVerificationRequirement },
        attestation: (start as any).attestation || 'none',
      }

      // @ts-ignore
      const credential = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential
      if (!credential) {
        throw new Error('Credential creation cancelled')
      }

      const attestation = credential.response as AuthenticatorAttestationResponse

      const response = {
        id: credential.id,
        rawId: bufferToBase64Url(credential.rawId),
        response: {
          clientDataJSON: bufferToBase64Url(attestation.clientDataJSON),
          attestationObject: bufferToBase64Url(attestation.attestationObject),
        },
        type: credential.type,
      }

      await authApi.webAuthnCompleteRegistration(start.sessionId, response)

      await checkAuth()
      alert('Passkey zapisany pomyślnie')
    } catch (err: any) {
      setPasskeyError((err as Error)?.message || 'Rejestracja passkey nie powiodła się')
      console.error('passkey registration error', err)
    } finally {
      setPasskeyLoading(false)
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = selectedProjectStages.findIndex((stage) => stage.id === active.id)
      const newIndex = selectedProjectStages.findIndex((stage) => stage.id === over.id)

      const reorderedStages = arrayMove(selectedProjectStages, oldIndex, newIndex)

      // Update order and auto-assign icons based on new position
      const updatedStages = reorderedStages.map((stage, index) => ({
        ...stage,
        order: index + 1,
        icon: String((index + 1).toString()),
      }))

      setStages(updatedStages)

      // Save to backend
      void Promise.all(
        updatedStages.map((stage) =>
          stagesApi.update(selectedProject!.id, stage.id, { order: stage.order, icon: stage.icon })
        )
      )
    }
  }

  useEffect(() => {
    if (selectedProject) {
      void loadStages(selectedProject.id)
      setEditingProject(selectedProject)
    }
  }, [selectedProject])

  const loadProjects = useCallback(async () => {
    try {
      const data = await projectsApi.getAll()
      setProjects(data)

      if (data.length > 0) {
        const allStages = await Promise.all(
          data.map(async (project) => {
            try {
              return await stagesApi.getByProjectId(project.id)
            } catch (error) {
              console.error(`Failed to load stages for project ${project.id}:`, error)
              return [] as Stage[]
            }
          })
        )

        setStages(allStages.flat().sort((left, right) => left.order - right.order))
      }

      if (data.length > 0 && !selectedProject) {
        setSelectedProject(data[0])
      }
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedProject])

  useEffect(() => {
    void loadProjects()
  }, [loadProjects])

  const loadStages = async (projectId: string) => {
    try {
      const data = await stagesApi.getByProjectId(projectId)
      setStages(data.sort((a, b) => a.order - b.order))
    } catch (error) {
      console.error('Failed to load stages:', error)
    }
  }

  const normalizeLinkUrl = (rawValue: string): string => {
    const trimmed = rawValue.trim()
    if (!trimmed) return ''
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed
    }
    return `https://${trimmed}`
  }

  const resetLinkForm = () => {
    setEditingLinkId(null)
    setLinkFormData({
      title: '',
      url: 'https://',
      description: '',
      type: 'other',
    })
  }

  const loadLinksForStage = useCallback(async (projectId: string, stageId: string) => {
    try {
      const links = await linksApi.getByStageId(projectId, stageId)
      setStageLinks(links)
    } catch (error) {
      console.error('Failed to load links:', error)
      setStageLinks([])
    }
  }, [])

  const loadProjectLinks = useCallback(async (projectId: string) => {
    try {
      const projectStages = stages.filter((s) => s.projectId === projectId)
      const all = await Promise.all(projectStages.map((s) => linksApi.getByStageId(projectId, s.id).catch(() => [] as Link[])))
      const allLinks = all.flat()
      const seen = new Set<string>()
      const githubLinks = allLinks.filter((l) => l.type === 'github' && !seen.has(l.url) && (seen.add(l.url), true))
      setProjectLinks(githubLinks)
    } catch (error) {
      console.error('Failed to load project links:', error)
      setProjectLinks([])
    }
  }, [stages])

  useEffect(() => {
    if (!selectedProject) {
      setSelectedLinkStageId('')
      setStageLinks([])
      resetLinkForm()
      return
    }

    const currentProjectStages = stages
      .filter((stage) => stage.projectId === selectedProject.id)
      .sort((a, b) => a.order - b.order)

    if (currentProjectStages.length === 0) {
      setSelectedLinkStageId('')
      setStageLinks([])
      resetLinkForm()
      return
    }

    const selectedStageExists = currentProjectStages.some((stage) => stage.id === selectedLinkStageId)
    const nextStageId = selectedStageExists ? selectedLinkStageId : currentProjectStages[0].id

    if (nextStageId !== selectedLinkStageId) {
      setSelectedLinkStageId(nextStageId)
      return
    }

    void loadLinksForStage(selectedProject.id, nextStageId)
    void loadProjectLinks(selectedProject.id)
  }, [selectedProject, selectedLinkStageId, stages, loadLinksForStage])

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedProject || !selectedLinkStageId) return

    const normalizedUrl = normalizeLinkUrl(linkFormData.url)
    if (!normalizedUrl || !linkFormData.title.trim()) return

    try {
      if (editingLinkId) {
        const updated = await linksApi.update(selectedProject.id, selectedLinkStageId, editingLinkId, {
          title: linkFormData.title.trim(),
          url: normalizedUrl,
          description: linkFormData.description.trim(),
          type: linkFormData.type,
        })
        setStageLinks((current) => current.map((link) => (link.id === updated.id ? updated : link)))
      } else {
        const created = await linksApi.create(selectedProject.id, selectedLinkStageId, {
          title: linkFormData.title.trim(),
          url: normalizedUrl,
          description: linkFormData.description.trim(),
          type: linkFormData.type,
        })
        setStageLinks((current) => [...current, created])
      }
      resetLinkForm()
    } catch (error) {
      console.error('Failed to save link:', error)
    }
  }

  const handleEditLink = (link: Link) => {
    setEditingLinkId(link.id)
    setLinkFormData({
      title: link.title,
      url: link.url,
      description: link.description || '',
      type: link.type,
    })
  }

  const handleDeleteLink = async (linkId: string) => {
    if (!selectedProject || !selectedLinkStageId) return
    if (!window.confirm('Czy na pewno chcesz usunąć ten link?')) return

    try {
      await linksApi.delete(selectedProject.id, selectedLinkStageId, linkId)
      setStageLinks((current) => current.filter((link) => link.id !== linkId))
      if (editingLinkId === linkId) {
        resetLinkForm()
      }
    } catch (error) {
      console.error('Failed to delete link:', error)
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
          privateNotes: project.privateNotes || '',
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
          icon: 'rocket',
          privateNotes: '',
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
          privateNotes: '',
        status: project.status,
        priority: project.priority,
        progress: project.progress,
        startDate: project.startDate,
        lastUpdate: new Date().toISOString(),
        teamSize: project.teamSize,
        technologies: [...project.technologies],
        goals: [...project.goals],
        duplicateFromProjectId: project.id,
      })
      setProjects([...projects, duplicatedProject])
      setSelectedProject(duplicatedProject)
    } catch (error) {
      console.error('Failed to duplicate project:', error)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm('Czy jesteś tego pewien?')) return
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
    if (!window.confirm('Czy jesteś tego pewien?')) return
    if (!selectedProject) return
    if (selectedProject.isLocked) return
    try {
      await stagesApi.delete(selectedProject.id, stageId)
      setStages(stages.filter((stage) => stage.id !== stageId))
    } catch (error) {
      console.error('Failed to delete stage:', error)
    }
  }

  const handleSaveProjectChanges = async () => {
    if (!editingProject) return
    try {
      const updated = await projectsApi.update(editingProject.id, editingProject)
      setSelectedProject(updated)
      setProjects(projects.map((p) => (p.id === updated.id ? updated : p)))
    } catch (error) {
      console.error('Failed to save project:', error)
    }
  }

  const handleLockProject = async () => {
    if (!selectedProject || selectedProject.isLocked) return
    try {
      const updated = await projectsApi.update(selectedProject.id, { isLocked: true })
      setSelectedProject(updated)
      setProjects(projects.map((project) => (project.id === updated.id ? updated : project)))
      setEditingProject(updated)
    } catch (error) {
      console.error('Failed to lock project:', error)
    }
  }

  const handleUnlockProject = async () => {
    if (!selectedProject || !selectedProject.isLocked) return
    if (!window.confirm('Czy na pewno chcesz odblokować projekt?')) return
    try {
      const updated = await projectsApi.update(selectedProject.id, { isLocked: false })
      setSelectedProject(updated)
      setProjects(projects.map((project) => (project.id === updated.id ? updated : project)))
      setEditingProject(updated)
    } catch (error) {
      console.error('Failed to unlock project:', error)
    }
  }

  const handleSaveStageChanges = async () => {
    if (!editingStage || !selectedProject) return
    try {
      const stageIndex = selectedProjectStages.findIndex((s) => s.id === editingStage.id)
      const stageNumber = String((stageIndex + 1).toString())
      
      const stageWithAutoIcon = {
        ...editingStage,
        icon: stageNumber
      }
      
      const updated = await stagesApi.update(selectedProject.id, editingStage.id, stageWithAutoIcon)
      setStages(stages.map((s) => (s.id === updated.id ? updated : s)))
      setEditingStage(null)
    } catch (error) {
      console.error('Failed to save stage:', error)
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
            onClick={() => handleTabChange('management')}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
              activeTab === 'management'
                ? 'border border-violet-400/30 bg-violet-500/18 text-white shadow-[0_0_0_1px_rgba(139,92,246,0.15)]'
                : 'border border-transparent text-slate-300 hover:border-slate-700/30 hover:bg-white/5'
            }`}
          >
            <FaListUl className="text-violet-200" />
            Projekty
          </button>
          <a
            href="/"
            className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left text-sm font-medium text-slate-300 transition hover:border-slate-700/30 hover:bg-white/5"
          >
            <FaGlobe className="text-slate-400" />
            Podgląd (publiczny)
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
          onClick={() => setSelectedProject(selectedProject)}
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
            onClick={() => handleTabChange('management')}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
              activeTab === 'management'
                ? 'border border-violet-400/30 bg-violet-500/15 text-white'
                : 'border border-transparent text-slate-300 hover:border-slate-700/30 hover:bg-white/5'
            }`}
          >
            <FaListUl className="text-violet-200" />
            Etapy
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('details')}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
              activeTab === 'details'
                ? 'border border-violet-400/30 bg-violet-500/15 text-white'
                : 'border border-transparent text-slate-300 hover:border-slate-700/30 hover:bg-white/5'
            }`}
          >
            <FaInfoCircle className="text-slate-400" />
            Szczegóły projektu
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('links')}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
              activeTab === 'links'
                ? 'border border-violet-400/30 bg-violet-500/15 text-white'
                : 'border border-transparent text-slate-300 hover:border-slate-700/30 hover:bg-white/5'
            }`}
          >
            <FaCode className="text-slate-400" />
            Linki (GitHub)
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('settings')}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
              activeTab === 'settings'
                ? 'border border-violet-400/30 bg-violet-500/15 text-white'
                : 'border border-transparent text-slate-300 hover:border-slate-700/30 hover:bg-white/5'
            }`}
          >
            <FaCogs className="text-slate-400" />
            Ustawienia
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('notes')}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
              activeTab === 'notes'
                ? 'border border-violet-400/30 bg-violet-500/15 text-white'
                : 'border border-transparent text-slate-300 hover:border-slate-700/30 hover:bg-white/5'
            }`}
          >
            <FaStickyNote className="text-slate-400" />
            Prywatne notatki
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('demo')}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
              activeTab === 'demo'
                ? 'border border-violet-400/30 bg-violet-500/15 text-white'
                : 'border border-transparent text-slate-300 hover:border-slate-700/30 hover:bg-white/5'
            }`}
          >
            <FaExternalLinkAlt className="text-slate-400" />
            Demo
          </button>

          {adminId && !hasPasskey && passkeySupported && (
            <>
              <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 mt-2">Logowanie</div>
              <button
                type="button"
                onClick={handleRegisterPasskey}
                disabled={passkeyLoading}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${passkeyLoading ? 'opacity-60 cursor-wait' : 'border border-transparent text-slate-300 hover:border-slate-700/30 hover:bg-white/5'}`}
              >
                <FaKey className="text-slate-400" />
                Zapisz passkey
              </button>
              {passkeyError && <div className="px-3 text-xs text-red-400">{passkeyError}</div>}
            </>
          )}
          {adminId && !hasPasskey && passkeySupported === false && (
            <div className="px-3 py-2 text-xs text-slate-500">
              To urządzenie albo przeglądarka nie wspiera rejestracji passkey.
            </div>
          )}
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
                <div className="text-sm font-semibold text-white">Roadmap Admin</div>
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="mb-6 hidden flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:flex">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Roadmap Admin</h1>
              <p className="mt-1 text-sm text-slate-400">Zarządzaj projektami i etapami roadmapy</p>
            </div>
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
              handleDeleteStage={handleDeleteStage}
              selectedProjectStages={selectedProjectStages}
              editingStage={editingStage}
              setEditingStage={setEditingStage}
              handleSaveStageChanges={handleSaveStageChanges}
              sensors={sensors}
              handleDragEnd={handleDragEnd}
              selectedStage={selectedStage}
              setSelectedStage={setSelectedStage}
            />
          )}

          {activeTab === 'details' && editingProject && (
            <div className="space-y-6 pb-10">
              <section className="rounded-3xl border border-slate-700/20 bg-white/[0.03] p-6 sm:p-8">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FaEdit className="text-violet-300" />
                    <span className="text-sm font-semibold text-slate-300">Edytuj projekt</span>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-white">Nazwa</label>
                    <input
                      type="text"
                      value={editingProject.name}
                      onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                      className="w-full rounded-xl border border-slate-600/50 bg-slate-900/70 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition focus:border-violet-400/60 focus:bg-slate-900/85"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-white">Opis</label>
                    <textarea
                      value={editingProject.description}
                      onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                      className="w-full resize-none rounded-xl border border-slate-600/50 bg-slate-900/70 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition focus:border-violet-400/60 focus:bg-slate-900/85"
                      rows={3}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-white">Status</label>
                      <select
                        value={editingProject.status}
                        onChange={(e) => setEditingProject({ ...editingProject, status: e.target.value as Project['status'] })}
                        className="w-full rounded-xl border border-slate-600/50 bg-slate-900/70 px-5 py-3 text-white outline-none transition focus:border-violet-400/60"
                      >
                        <option value="active">Aktywny</option>
                        <option value="completed">Ukończony</option>
                        <option value="archived">Zarchiwizowany</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-white">Priorytet</label>
                      <select
                        value={editingProject.priority}
                        onChange={(e) => setEditingProject({ ...editingProject, priority: e.target.value as Project['priority'] })}
                        className="w-full rounded-xl border border-slate-600/50 bg-slate-900/70 px-4 py-3 text-white outline-none transition focus:border-violet-400/60"
                      >
                        <option value="high">Wysoki</option>
                        <option value="medium">Średni</option>
                        <option value="low">Niski</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-white">Postęp (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={editingProject.progress}
                        onChange={(e) => setEditingProject({ ...editingProject, progress: parseInt(e.target.value) || 0 })}
                        className="w-full rounded-xl border border-slate-600/50 bg-slate-900/70 px-4 py-3 text-white outline-none transition focus:border-violet-400/60 focus:bg-slate-900/85"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-white">Rozmiar zespołu</label>
                      <input
                        type="number"
                        min="0"
                        value={editingProject.teamSize}
                        onChange={(e) => setEditingProject({ ...editingProject, teamSize: parseInt(e.target.value) || 0 })}
                        className="w-full rounded-xl border border-slate-600/50 bg-slate-900/70 px-4 py-3 text-white outline-none transition focus:border-violet-400/60 focus:bg-slate-900/85"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-white">Data startu</label>
                      <input
                        type="date"
                        value={editingProject.startDate}
                        onChange={(e) => setEditingProject({ ...editingProject, startDate: e.target.value })}
                        className="w-full rounded-xl border border-slate-600/50 bg-slate-900/70 px-4 py-3 text-white outline-none transition focus:border-violet-400/60 focus:bg-slate-900/85"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-white">Technologie (oddzielone przecinkami)</label>
                    <textarea
                      value={editingProject.technologies.join(', ')}
                      onChange={(e) => setEditingProject({ ...editingProject, technologies: e.target.value.split(',').map((t) => t.trim()).filter((t) => t) })}
                      placeholder="React, TypeScript, Node.js"
                      className="w-full resize-none rounded-xl border border-slate-600/50 bg-slate-900/70 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition focus:border-violet-400/60 focus:bg-slate-900/85"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-white">Cele projektu (każdy cel w nowej linii)</label>
                    <textarea
                      value={editingProject.goals.join('\n')}
                      onChange={(e) => setEditingProject({ ...editingProject, goals: e.target.value.split('\n').filter((g) => g.trim()) })}
                      placeholder="Cel 1&#10;Cel 2&#10;Cel 3"
                      className="w-full resize-none rounded-xl border border-slate-600/50 bg-slate-900/70 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition focus:border-violet-400/60 focus:bg-slate-900/85"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSaveProjectChanges}
                      className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-3 font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:from-indigo-400 hover:to-violet-400"
                    >
                      Zapisz zmiany
                    </button>
                    <button
                      onClick={() => setEditingProject(selectedProject)}
                      className="flex-1 rounded-xl border border-slate-700/30 bg-white/[0.03] px-4 py-3 font-medium text-slate-300 transition hover:border-slate-700/50 hover:bg-white/[0.05]"
                    >
                      Anuluj
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'links' && (
            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-700/20 bg-white/[0.03] p-6 sm:p-8">
                <h3 className="text-lg font-semibold text-white mb-2">Linki etapów</h3>
                <p className="text-sm text-slate-400 mb-6">Dodane tu linki pojawią się na publicznej roadmapie użytkownika pod "/".</p>

                <div className="mb-6 rounded-2xl border border-slate-700/30 bg-white/[0.02] p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <FaCode className="text-slate-300" />
                    <div>
                      <div className="text-sm font-medium text-white">Link projektu</div>
                      <div className="text-xs text-slate-400">Skompilowane linki GitHub z etapów projektu</div>
                    </div>
                  </div>
                  {projectLinks.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {projectLinks.map((link) => (
                        <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-slate-800/50 px-3 py-2 text-sm font-medium text-slate-200">
                          <FaExternalLinkAlt className="text-xs" />
                          {link.title}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-400">Brak linków projektu. Dodaj linki do etapów, aby występowały tutaj.</div>
                  )}
                </div>

                {!selectedProject ? (
                  <div className="rounded-2xl border border-slate-700/30 bg-white/[0.02] p-4 text-center">
                    <p className="text-sm text-slate-400">Najpierw wybierz projekt.</p>
                  </div>
                ) : selectedProjectStages.length === 0 ? (
                  <div className="rounded-2xl border border-slate-700/30 bg-white/[0.02] p-4 text-center">
                    <p className="text-sm text-slate-400">Projekt nie ma etapów. Dodaj etap, aby przypisać link.</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-white">Etap</label>
                      <select
                        value={selectedLinkStageId}
                        onChange={(e) => {
                          setSelectedLinkStageId(e.target.value)
                          resetLinkForm()
                        }}
                        className="w-full rounded-xl border border-slate-600/50 bg-slate-900/70 px-4 py-3 text-white outline-none transition focus:border-violet-400/60"
                      >
                        {selectedProjectStages.map((stage) => (
                          <option key={stage.id} value={stage.id}>
                            {stage.order}. {stage.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <form onSubmit={handleLinkSubmit} className="space-y-4 rounded-2xl border border-slate-700/30 bg-white/[0.02] p-4">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-white">Tytuł linku</label>
                        <input
                          type="text"
                          value={linkFormData.title}
                          onChange={(e) => setLinkFormData((current) => ({ ...current, title: e.target.value }))}
                          placeholder="np. Repozytorium GitHub"
                          className="w-full rounded-xl border border-slate-600/50 bg-slate-900/70 px-4 py-3 text-white outline-none transition focus:border-violet-400/60 focus:bg-slate-900/85"
                          required
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-white">URL</label>
                        <input
                          type="text"
                          value={linkFormData.url}
                          onChange={(e) => setLinkFormData((current) => ({ ...current, url: e.target.value }))}
                          placeholder="https://github.com/..."
                          className="w-full rounded-xl border border-slate-600/50 bg-slate-900/70 px-4 py-3 text-white outline-none transition focus:border-violet-400/60 focus:bg-slate-900/85"
                          required
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-white">Typ</label>
                          <select
                            value={linkFormData.type}
                            onChange={(e) => setLinkFormData((current) => ({ ...current, type: e.target.value as Link['type'] }))}
                            className="w-full rounded-xl border border-slate-600/50 bg-slate-900/70 px-4 py-3 text-white outline-none transition focus:border-violet-400/60"
                          >
                            <option value="github">GitHub</option>
                            <option value="demo">Demo</option>
                            <option value="docs">Docs</option>
                            <option value="other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-semibold text-white">Opis</label>
                          <input
                            type="text"
                            value={linkFormData.description}
                            onChange={(e) => setLinkFormData((current) => ({ ...current, description: e.target.value }))}
                            placeholder="opcjonalnie"
                            className="w-full rounded-xl border border-slate-600/50 bg-slate-900/70 px-4 py-3 text-white outline-none transition focus:border-violet-400/60 focus:bg-slate-900/85"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="submit"
                          className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:from-indigo-400 hover:to-violet-400"
                        >
                          {editingLinkId ? 'Zapisz link' : 'Dodaj link'}
                        </button>
                        {editingLinkId ? (
                          <button
                            type="button"
                            onClick={resetLinkForm}
                            className="rounded-xl border border-slate-700/30 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-700/50 hover:bg-white/[0.05]"
                          >
                            Anuluj edycję
                          </button>
                        ) : null}
                      </div>
                    </form>

                    <div className="space-y-3">
                      {stageLinks.length === 0 ? (
                        <div className="rounded-2xl border border-slate-700/30 bg-white/[0.02] p-4 text-center">
                          <p className="text-sm text-slate-400">Brak linków dla tego etapu.</p>
                        </div>
                      ) : (
                        stageLinks.map((link) => (
                          <div key={link.id} className="rounded-2xl border border-slate-700/30 bg-white/[0.02] p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-white">{link.title}</p>
                                <a
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-1 block truncate text-xs text-violet-300 hover:text-violet-200"
                                >
                                  {link.url}
                                </a>
                                {link.description ? <p className="mt-1 text-xs text-slate-400">{link.description}</p> : null}
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleEditLink(link)}
                                  className="rounded-lg border border-slate-700/80 p-1.5 text-slate-300 transition hover:border-slate-600 hover:bg-white/[0.04]"
                                  title="Edytuj link"
                                >
                                  <FaEdit className="text-xs" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleDeleteLink(link.id)}
                                  className="rounded-lg border border-red-500/20 p-1.5 text-red-300 transition hover:bg-red-500/10"
                                  title="Usuń link"
                                >
                                  <FaTrashAlt className="text-xs" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && selectedProject && (
            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-700/20 bg-white/[0.03] p-6 sm:p-8">
                <h3 className="text-lg font-semibold text-white mb-2">Ustawienia projektu</h3>
                <p className="text-sm text-slate-400 mb-6">{selectedProject.name}</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-700/20 bg-white/[0.02] p-4">
                    <div className="text-xs font-semibold text-slate-400 mb-2 uppercase">Status</div>
                    <p className="text-sm text-white capitalize">{selectedProject.status === 'active' ? 'Aktywny' : selectedProject.status === 'completed' ? 'Ukończony' : 'Zarchiwizowany'}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-700/20 bg-white/[0.02] p-4">
                    <div className="text-xs font-semibold text-slate-400 mb-2 uppercase">Priorytet</div>
                    <p className="text-sm text-white capitalize">{selectedProject.priority === 'high' ? 'Wysoki' : selectedProject.priority === 'medium' ? 'Średni' : 'Niski'}</p>
                  </div>
                </div>
                {selectedProject.isLocked && (
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-700/30 bg-slate-800/50 px-3 py-1.5 text-xs font-medium text-slate-300">
                    <FaLock className="text-slate-400" />
                    <span>Projekt zablokowany</span>
                  </div>
                )}
              </div>
              <div className="rounded-3xl border border-slate-700/20 bg-white/[0.03] p-6 sm:p-8">
                <h4 className="text-sm font-semibold text-slate-300 mb-3">Szybkie akcje</h4>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => resetProjectForm(selectedProject)} className="inline-flex items-center gap-2 rounded-xl bg-slate-700/30 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-700/50">
                    <FaEdit className="text-sm" />
                    <span>Edytuj projekt</span>
                  </button>
                  <button onClick={() => handleDuplicateProject(selectedProject)} className="inline-flex items-center gap-2 rounded-xl bg-slate-700/30 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-700/50">
                    <FaClone className="text-sm" />
                    <span>Duplikuj</span>
                  </button>
                  {!selectedProject.isLocked && (
                    <button onClick={handleLockProject} className="inline-flex items-center gap-2 rounded-xl border border-slate-600/40 bg-slate-700/20 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500/60 hover:bg-slate-700/40">
                      <FaLock className="text-sm" />
                      <span>Zablokuj</span>
                    </button>
                  )}
                  {selectedProject.isLocked && (
                    <button onClick={handleUnlockProject} className="inline-flex items-center gap-2 rounded-xl border border-slate-600/40 bg-emerald-700/20 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:border-emerald-500/60 hover:bg-emerald-700/40">
                      <FaLock className="text-sm" />
                      <span>Odblokuj</span>
                    </button>
                  )}
                  {!selectedProject.isLocked && (
                    <button onClick={() => handleDeleteProject(selectedProject.id)} className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20 hover:border-red-500/30">
                      <FaTrashAlt className="text-sm" />
                      <span>Usuń projekt</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notes' && selectedProject && (
            <div className="space-y-4 pb-10">
              <div className="rounded-3xl border border-slate-700/20 bg-white/[0.03] p-6 sm:p-8">
                <div className="mb-4 flex items-center gap-2">
                  <FaStickyNote className="text-violet-300" />
                  <h3 className="text-lg font-semibold text-white">Prywatne notatki</h3>
                </div>
                <p className="mb-6 text-sm text-slate-400">
                  Notatki są widoczne tylko w panelu admina i nie pojawiają się na publicznej stronie roadmapy.
                </p>
                <div className="space-y-4">
                  <textarea
                    value={editingProject?.privateNotes || ''}
                    onChange={(e) => setEditingProject((current) => (current ? { ...current, privateNotes: e.target.value } : current))}
                    placeholder="Zapisz tu ważne informacje o projekcie, decyzje zespołu, ryzyka albo przypomnienia dla siebie..."
                    className="min-h-48 w-full rounded-xl border border-slate-600/50 bg-gray-950 px-4 py-3 text-sm leading-6 text-white placeholder:text-slate-500 outline-none transition focus:border-violet-400/60 focus:bg-gray-900"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveProjectChanges}
                      className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:from-indigo-400 hover:to-violet-400"
                    >
                      Zapisz notatki
                    </button>
                    <button
                      onClick={() => setEditingProject(selectedProject)}
                      className="rounded-xl border border-slate-700/30 bg-white/[0.03] px-4 py-3 text-sm font-medium text-slate-300 transition hover:border-slate-700/50 hover:bg-white/[0.05]"
                    >
                      Cofnij zmiany
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'demo' && (
            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-700/20 bg-white/[0.03] p-6 sm:p-8">
                <h2 className="text-lg sm:text-xl font-semibold text-white mb-2">Podgląd publiczny</h2>
                <p className="text-sm text-slate-400 mb-4">Przejdź do publicznego widoku roadmapy, aby zobaczyć jak wyglądają Twoje projekty dla użytkowników.</p>
                <a
                  href="/demo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:from-indigo-400 hover:to-violet-400"
                >
                  <FaGlobe />
                  <span>Otwórz podgląd</span>
                  <span className="ml-1">↗</span>
                </a>
              </div>
              <div className="rounded-3xl border border-slate-700/20 bg-white/[0.03] p-6 sm:p-8">
                <h3 className="text-sm font-semibold text-slate-300 mb-2">O widoku demo</h3>
                <p className="text-xs sm:text-sm text-slate-400">Ten widok pokazuje Twoją roadmapę dokładnie tak jak widzą ją odwiedzający. Zawiera wszystkie projekty, etapy i ich status.</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {showNewProjectForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-[20px] sm:rounded-[28px] border border-slate-600/50 bg-gradient-to-b from-[#1a1f2e] to-[#141820] p-5 sm:p-8 shadow-2xl shadow-black/60">
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
          <div className="w-full max-w-sm rounded-[20px] sm:rounded-[28px] border border-slate-600/50 bg-gradient-to-b from-[#1a1f2e] to-[#141820] p-5 sm:p-8 shadow-2xl shadow-black/60">
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
