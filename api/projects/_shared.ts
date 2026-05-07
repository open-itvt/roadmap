import redis from '../_upstashClient'
import { v4 as uuid } from 'uuid'
import type { Project, Stage, Link } from '@/types'

export async function getProjectsFromRedis(): Promise<Project[]> {
  try {
    const data = await redis.get('projects')
    return data ? JSON.parse(String(data)) : []
  } catch {
    return []
  }
}

export async function saveProjectsToRedis(projects: Project[]): Promise<void> {
  await redis.set('projects', JSON.stringify(projects))
}

export async function getProjectById(id: string): Promise<Project | null> {
  const projects = await getProjectsFromRedis()
  return projects.find((p) => p.id === id) || null
}

export async function createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
  const projects = await getProjectsFromRedis()
  const now = new Date().toISOString()
  const newProject: Project = {
    ...project,
    id: uuid(),
    createdAt: now,
    updatedAt: now,
  }

  projects.push(newProject)
  await saveProjectsToRedis(projects)
  return newProject
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
  const projects = await getProjectsFromRedis()
  const projectIndex = projects.findIndex((p) => p.id === id)
  if (projectIndex === -1) return null

  const updated: Project = {
    ...projects[projectIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  projects[projectIndex] = updated
  await saveProjectsToRedis(projects)
  return updated
}

export async function deleteProject(id: string): Promise<boolean> {
  const projects = await getProjectsFromRedis()
  const filtered = projects.filter((p) => p.id !== id)
  if (filtered.length === projects.length) return false
  await saveProjectsToRedis(filtered)
  await deleteProjectStages(id)
  return true
}

export async function getStagesFromRedis(): Promise<Stage[]> {
  try {
    const data = await redis.get('stages')
    return data ? JSON.parse(String(data)) : []
  } catch {
    return []
  }
}

export async function saveStagestoRedis(stages: Stage[]): Promise<void> {
  await redis.set('stages', JSON.stringify(stages))
}

export async function getStagesByProjectId(projectId: string): Promise<Stage[]> {
  const stages = await getStagesFromRedis()
  return stages.filter((s) => s.projectId === projectId).sort((a, b) => a.order - b.order)
}

export async function getStageById(id: string): Promise<Stage | null> {
  const stages = await getStagesFromRedis()
  return stages.find((s) => s.id === id) || null
}

export async function createStage(
  projectId: string,
  stage: Omit<Stage, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>,
): Promise<Stage> {
  const stages = await getStagesFromRedis()
  const now = new Date().toISOString()
  const newStage: Stage = {
    ...stage,
    id: uuid(),
    projectId,
    createdAt: now,
    updatedAt: now,
  }

  stages.push(newStage)
  await saveStagestoRedis(stages)
  return newStage
}

export async function updateStage(stageId: string, updates: Partial<Stage>): Promise<Stage | null> {
  const stages = await getStagesFromRedis()
  const stageIndex = stages.findIndex((s) => s.id === stageId)
  if (stageIndex === -1) return null

  const updated: Stage = {
    ...stages[stageIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  stages[stageIndex] = updated
  await saveStagestoRedis(stages)
  return updated
}

export async function deleteStage(id: string): Promise<boolean> {
  const stages = await getStagesFromRedis()
  const filtered = stages.filter((s) => s.id !== id)
  if (filtered.length === stages.length) return false
  await saveStagestoRedis(filtered)
  return true
}

export async function deleteProjectStages(projectId: string): Promise<void> {
  const stages = await getStagesFromRedis()
  const filtered = stages.filter((s) => s.projectId !== projectId)
  await saveStagestoRedis(filtered)
}

export async function reorderStages(projectId: string, stageIds: string[]): Promise<Stage[]> {
  const stages = await getStagesFromRedis()
  const projectStages = stages.filter((s) => s.projectId === projectId)
  const otherStages = stages.filter((s) => s.projectId !== projectId)

  const reordered = stageIds
    .map((id, order) => {
      const stage = projectStages.find((s) => s.id === id)
      if (stage) {
        return { ...stage, order, updatedAt: new Date().toISOString() }
      }
      return null
    })
    .filter(Boolean) as Stage[]

  const allStages = [...otherStages, ...reordered]
  await saveStagestoRedis(allStages)
  return reordered
}

function getLinkKey(): string {
  return 'links'
}

export async function getLinksFromRedis(): Promise<Link[]> {
  try {
    const data = await redis.get(getLinkKey())
    return data ? JSON.parse(String(data)) : []
  } catch {
    return []
  }
}

export async function saveLinksToRedis(links: Link[]): Promise<void> {
  await redis.set(getLinkKey(), JSON.stringify(links))
}

export async function getLinksByStageId(stageId: string): Promise<Link[]> {
  const links = await getLinksFromRedis()
  return links.filter((l) => l.stageId === stageId)
}

export async function createLink(
  stageId: string,
  link: Omit<Link, 'id' | 'stageId' | 'createdAt' | 'updatedAt'>,
): Promise<Link> {
  const links = await getLinksFromRedis()
  const now = new Date().toISOString()
  const newLink: Link = {
    ...link,
    id: uuid(),
    stageId,
    createdAt: now,
    updatedAt: now,
  }

  links.push(newLink)
  await saveLinksToRedis(links)
  return newLink
}

export async function updateLink(linkId: string, updates: Partial<Link>): Promise<Link | null> {
  const links = await getLinksFromRedis()
  const linkIndex = links.findIndex((l) => l.id === linkId)
  if (linkIndex === -1) return null

  const updated: Link = {
    ...links[linkIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  links[linkIndex] = updated
  await saveLinksToRedis(links)
  return updated
}

export async function deleteLink(linkId: string): Promise<boolean> {
  const links = await getLinksFromRedis()
  const filtered = links.filter((l) => l.id !== linkId)
  if (filtered.length === links.length) return false
  await saveLinksToRedis(filtered)
  return true
}

export async function deleteStageLinks(stageId: string): Promise<void> {
  const links = await getLinksFromRedis()
  const filtered = links.filter((l) => l.stageId !== stageId)
  await saveLinksToRedis(filtered)
}
