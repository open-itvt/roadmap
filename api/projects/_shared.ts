import redis from '../upstashClient'
import { v4 as uuid } from 'uuid'
import type { Project, Stage, Link } from '@/types'

function parseRedisValue<T>(value: unknown): T | null {
  if (value == null) return null
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T
    } catch {
      return null
    }
  }

  if (typeof value === 'object') {
    return value as T
  }

  try {
    return JSON.parse(String(value)) as T
  } catch {
    return null
  }
}

function getStoragePrefix(authHeader?: string): string {
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader || ''

  if (process.env.NODE_ENV === 'development' && token.startsWith('dev:')) {
    return 'demo_'
  }

  return ''
}

function getProjectKey(authHeader?: string): string {
  return `${getStoragePrefix(authHeader)}projects`
}

function getStageKey(authHeader?: string): string {
  return `${getStoragePrefix(authHeader)}stages`
}

// Project operations
export async function getProjectsFromRedis(authHeader?: string): Promise<Project[]> {
  try {
    const data = await redis.get(getProjectKey(authHeader))
    return parseRedisValue<Project[]>(data) || []
  } catch {
    return []
  }
}

export async function saveProjectsToRedis(projects: Project[], authHeader?: string): Promise<void> {
  await redis.set(getProjectKey(authHeader), JSON.stringify(projects))
}

export async function getProjectById(id: string, authHeader?: string): Promise<Project | null> {
  const projects = await getProjectsFromRedis(authHeader)
  return projects.find(p => p.id === id) || null
}

export async function createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>, authHeader?: string): Promise<Project> {
  const projects = await getProjectsFromRedis(authHeader)
  const now = new Date().toISOString()
  const newProject: Project = {
    ...project,
    id: uuid(),
    createdAt: now,
    updatedAt: now,
  }
  projects.push(newProject)
  await saveProjectsToRedis(projects, authHeader)
  return newProject
}

export async function updateProject(id: string, updates: Partial<Project>, authHeader?: string): Promise<Project | null> {
  const projects = await getProjectsFromRedis(authHeader)
  const projectIndex = projects.findIndex(p => p.id === id)
  if (projectIndex === -1) return null

  const updated: Project = {
    ...projects[projectIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  projects[projectIndex] = updated
  await saveProjectsToRedis(projects, authHeader)
  return updated
}

export async function deleteProject(id: string, authHeader?: string): Promise<boolean> {
  const projects = await getProjectsFromRedis(authHeader)
  const filtered = projects.filter(p => p.id !== id)
  if (filtered.length === projects.length) return false
  await saveProjectsToRedis(filtered, authHeader)
  // Also delete all stages for this project
  await deleteProjectStages(id, authHeader)
  return true
}

// Stages operations
export async function getStagesFromRedis(authHeader?: string): Promise<Stage[]> {
  try {
    const data = await redis.get(getStageKey(authHeader))
    return parseRedisValue<Stage[]>(data) || []
  } catch {
    return []
  }
}

export async function saveStagestoRedis(stages: Stage[], authHeader?: string): Promise<void> {
  await redis.set(getStageKey(authHeader), JSON.stringify(stages))
}

export async function getStagesByProjectId(projectId: string, authHeader?: string): Promise<Stage[]> {
  const stages = await getStagesFromRedis(authHeader)
  return stages.filter(s => s.projectId === projectId).sort((a, b) => a.order - b.order)
}

export async function getStageById(id: string, authHeader?: string): Promise<Stage | null> {
  const stages = await getStagesFromRedis(authHeader)
  return stages.find(s => s.id === id) || null
}

export async function createStage(projectId: string, stage: Omit<Stage, 'id' | 'createdAt' | 'updatedAt'>, authHeader?: string): Promise<Stage> {
  const stages = await getStagesFromRedis(authHeader)
  const now = new Date().toISOString()
  const newStage: Stage = {
    ...stage,
    id: uuid(),
    projectId,
    createdAt: now,
    updatedAt: now,
  }
  stages.push(newStage)
  await saveStagestoRedis(stages, authHeader)
  return newStage
}

export async function updateStage(stageId: string, updates: Partial<Stage>, authHeader?: string): Promise<Stage | null> {
  const stages = await getStagesFromRedis(authHeader)
  const stageIndex = stages.findIndex(s => s.id === stageId)
  if (stageIndex === -1) return null

  const updated: Stage = {
    ...stages[stageIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  stages[stageIndex] = updated
  await saveStagestoRedis(stages, authHeader)
  return updated
}

export async function deleteStage(id: string, authHeader?: string): Promise<boolean> {
  const stages = await getStagesFromRedis(authHeader)
  const filtered = stages.filter(s => s.id !== id)
  if (filtered.length === stages.length) return false
  await saveStagestoRedis(filtered, authHeader)
  return true
}

export async function deleteProjectStages(projectId: string, authHeader?: string): Promise<void> {
  const stages = await getStagesFromRedis(authHeader)
  const filtered = stages.filter(s => s.projectId !== projectId)
  await saveStagestoRedis(filtered, authHeader)
}

export async function reorderStages(projectId: string, stageIds: string[], authHeader?: string): Promise<Stage[]> {
  const stages = await getStagesFromRedis(authHeader)
  const projectStages = stages.filter(s => s.projectId === projectId)
  const otherStages = stages.filter(s => s.projectId !== projectId)

  const reordered = stageIds.map((id, order) => {
    const stage = projectStages.find(s => s.id === id)
    if (stage) {
      return { ...stage, order, updatedAt: new Date().toISOString() }
    }
    return null
  }).filter(Boolean) as Stage[]

  const allStages = [...otherStages, ...reordered]
  await saveStagestoRedis(allStages, authHeader)
  return reordered
}

function getLinkKey(authHeader?: string): string {
  return `${getStoragePrefix(authHeader)}links`
}

// Links operations
export async function getLinksFromRedis(authHeader?: string): Promise<Link[]> {
  try {
    const data = await redis.get(getLinkKey(authHeader))
    return parseRedisValue<Link[]>(data) || []
  } catch {
    return []
  }
}

export async function saveLinksToRedis(links: Link[], authHeader?: string): Promise<void> {
  await redis.set(getLinkKey(authHeader), JSON.stringify(links))
}

export async function getLinksByStageId(stageId: string, authHeader?: string): Promise<Link[]> {
  const links = await getLinksFromRedis(authHeader)
  return links.filter(l => l.stageId === stageId)
}

export async function createLink(stageId: string, link: Omit<Link, 'id' | 'stageId' | 'createdAt' | 'updatedAt'>, authHeader?: string): Promise<Link> {
  const links = await getLinksFromRedis(authHeader)
  const now = new Date().toISOString()
  const newLink: Link = {
    ...link,
    id: uuid(),
    stageId,
    createdAt: now,
    updatedAt: now,
  }
  links.push(newLink)
  await saveLinksToRedis(links, authHeader)
  return newLink
}

export async function updateLink(linkId: string, updates: Partial<Link>, authHeader?: string): Promise<Link | null> {
  const links = await getLinksFromRedis(authHeader)
  const linkIndex = links.findIndex(l => l.id === linkId)
  if (linkIndex === -1) return null

  const updated: Link = {
    ...links[linkIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  links[linkIndex] = updated
  await saveLinksToRedis(links, authHeader)
  return updated
}

export async function deleteLink(id: string, authHeader?: string): Promise<boolean> {
  const links = await getLinksFromRedis(authHeader)
  const filtered = links.filter(l => l.id !== id)
  if (filtered.length === links.length) return false
  await saveLinksToRedis(filtered, authHeader)
  return true
}

export async function deleteStageLinks(stageId: string, authHeader?: string): Promise<void> {
  const links = await getLinksFromRedis(authHeader)
  const filtered = links.filter(l => l.stageId !== stageId)
  await saveLinksToRedis(filtered, authHeader)
}
