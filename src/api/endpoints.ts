import apiClient from './client'
import type { ApiResponse, Project, Stage, ProjectCreatePayload, StageCreatePayload, Link } from '@/types'

// Projects API
export const projectsApi = {
  getAll: async (): Promise<Project[]> => {
    const { data } = await apiClient.get<ApiResponse<Project[]>>('/api/projects')
    return data.data || []
  },

  getById: async (id: string): Promise<Project> => {
    const { data } = await apiClient.get<ApiResponse<Project>>(`/api/projects/${id}`)
    return data.data!
  },

  create: async (project: ProjectCreatePayload): Promise<Project> => {
    const { data } = await apiClient.post<ApiResponse<Project>>('/api/projects', project)
    return data.data!
  },

  update: async (id: string, project: Partial<Project>): Promise<Project> => {
    const { data } = await apiClient.put<ApiResponse<Project>>(`/api/projects/${id}`, project)
    return data.data!
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/projects/${id}`)
  },
}

// Stages API
export const stagesApi = {
  getByProjectId: async (projectId: string): Promise<Stage[]> => {
    const { data } = await apiClient.get<ApiResponse<Stage[]>>(`/api/projects/${projectId}/stages`)
    return data.data || []
  },

  create: async (projectId: string, stage: StageCreatePayload): Promise<Stage> => {
    const { data } = await apiClient.post<ApiResponse<Stage>>(`/api/projects/${projectId}/stages`, stage)
    return data.data!
  },

  update: async (projectId: string, stageId: string, stage: Partial<Stage>): Promise<Stage> => {
    const { data } = await apiClient.put<ApiResponse<Stage>>(`/api/projects/${projectId}/stages/${stageId}`, stage)
    return data.data!
  },

  delete: async (projectId: string, stageId: string): Promise<void> => {
    await apiClient.delete(`/api/projects/${projectId}/stages/${stageId}`)
  },

  reorder: async (projectId: string, stageIds: string[]): Promise<Stage[]> => {
    const { data } = await apiClient.post<ApiResponse<Stage[]>>(`/api/projects/${projectId}/stages/reorder`, { stageIds })
    return data.data!
  },
}

export const initApi = {
  initialize: async (): Promise<void> => {
    await apiClient.post('/api/init', {})
  },
}

// Links API
export const linksApi = {
  getByStageId: async (projectId: string, stageId: string): Promise<Link[]> => {
    const { data } = await apiClient.get<ApiResponse<Link[]>>(`/api/projects/${projectId}/stages/${stageId}/links`)
    return data.data || []
  },

  create: async (projectId: string, stageId: string, link: Omit<Link, 'id' | 'stageId' | 'createdAt' | 'updatedAt'>): Promise<Link> => {
    const { data } = await apiClient.post<ApiResponse<Link>>(`/api/projects/${projectId}/stages/${stageId}/links`, link)
    return data.data!
  },

  update: async (projectId: string, stageId: string, linkId: string, link: Partial<Link>): Promise<Link> => {
    const { data } = await apiClient.put<ApiResponse<Link>>(`/api/projects/${projectId}/stages/${stageId}/links/${linkId}`, link)
    return data.data!
  },

  delete: async (projectId: string, stageId: string, linkId: string): Promise<void> => {
    await apiClient.delete(`/api/projects/${projectId}/stages/${stageId}/links/${linkId}`)
  },
}
