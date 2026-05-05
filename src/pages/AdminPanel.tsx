import { useState, useEffect } from 'react'
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
    icon: '📱',
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
      setNewProjectData({ name: '', description: '', icon: '📱' })
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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-slate-900 border-r border-slate-800 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-500 rounded-lg"></div>
              <h1 className="text-xl font-bold">Roadmap</h1>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Projects</h2>
              <button
                onClick={() => setShowNewProjectForm(true)}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                +
              </button>
            </div>
            <div className="space-y-2">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className={`relative group px-3 py-2 rounded-lg cursor-pointer transition ${
                    selectedProject?.id === project.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                  onClick={() => setSelectedProject(project)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{project.icon}</span>
                    <span className="text-sm truncate">{project.name}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteProject(project.id)
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800">
            <button
              onClick={handleLogout}
              className="text-sm text-slate-400 hover:text-slate-300 transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto">
          {selectedProject ? (
            <div className="p-8">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-3xl">
                    {selectedProject.icon}
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">{selectedProject.name}</h1>
                    <p className="text-slate-400">{selectedProject.description}</p>
                  </div>
                </div>
              </div>

              {/* Stages */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Roadmap Stages</h2>
                  <button
                    onClick={() => setShowNewStageForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition"
                  >
                    + Add Stage
                  </button>
                </div>

                {showNewStageForm && (
                  <form onSubmit={handleAddStage} className="mb-6 p-4 bg-slate-900 border border-slate-800 rounded">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <input
                        type="text"
                        value={newStageData.name}
                        onChange={(e) => setNewStageData({ ...newStageData, name: e.target.value })}
                        placeholder="Stage name"
                        className="col-span-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white"
                        required
                      />
                      <input
                        type="text"
                        value={newStageData.description}
                        onChange={(e) => setNewStageData({ ...newStageData, description: e.target.value })}
                        placeholder="Description"
                        className="col-span-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white"
                      />
                      <select
                        value={newStageData.status}
                        onChange={(e) => setNewStageData({ ...newStageData, status: e.target.value as any })}
                        className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white"
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
                        className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white"
                        maxLength={2}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowNewStageForm(false)}
                        className="px-3 py-1 bg-slate-800 text-white rounded hover:bg-slate-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-3">
                  {stages.map((stage) => (
                    <div key={stage.id} className="p-4 bg-slate-900 border border-slate-800 rounded hover:border-slate-700 transition">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{stage.name}</h3>
                          <p className="text-sm text-slate-400">{stage.description}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              stage.status === 'completed' ? 'bg-green-900 text-green-200' :
                              stage.status === 'in-progress' ? 'bg-blue-900 text-blue-200' :
                              stage.status === 'blocked' ? 'bg-orange-900 text-orange-200' :
                              'bg-slate-800 text-slate-300'
                            }`}>
                              {stage.status}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteStage(stage.id)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-400">No projects yet. Create one to get started.</p>
            </div>
          )}
        </div>
      </div>

      {/* New Project Modal */}
      {showNewProjectForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Create New Project</h2>
            <form onSubmit={handleAddProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Project Name</label>
                <input
                  type="text"
                  value={newProjectData.name}
                  onChange={(e) => setNewProjectData({ ...newProjectData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={newProjectData.description}
                  onChange={(e) => setNewProjectData({ ...newProjectData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded text-white focus:outline-none focus:border-blue-500 resize-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Icon (emoji)</label>
                <input
                  type="text"
                  value={newProjectData.icon}
                  onChange={(e) => setNewProjectData({ ...newProjectData, icon: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded text-white focus:outline-none focus:border-blue-500"
                  maxLength={2}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewProjectForm(false)}
                  className="flex-1 px-4 py-2 bg-slate-800 text-white rounded font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
