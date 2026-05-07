import {
  getProjectsFromRedis,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  getStagesByProjectId,
  createStage,
  reorderStages,
  getStageById,
  updateStage,
  deleteStage,
} from './_shared'

export default async function handler(req: any, res: any) {
  const segments: string[] = Array.isArray(req.query.path)
    ? req.query.path
    : req.query.path
    ? [req.query.path]
    : []

  try {
    // /api/projects
    if (segments.length === 0) {
      if (req.method === 'GET') {
        const projects = await getProjectsFromRedis()
        res.status(200).json({ success: true, data: projects })
      } else if (req.method === 'POST') {
        const { name, description, icon, status, priority, teamSize, technologies, goals } = req.body
        if (!name || !description) {
          res.status(400).json({ error: 'name and description are required' })
          return
        }
        const newProject = await createProject({
          name,
          description,
          icon: icon || '📱',
          status: status || 'active',
          priority: priority || 'medium',
          progress: 0,
          startDate: new Date().toISOString().split('T')[0],
          lastUpdate: new Date().toISOString(),
          teamSize: teamSize || 0,
          technologies: technologies || [],
          goals: goals || [],
        })
        res.status(201).json({ success: true, data: newProject })
      } else {
        res.status(405).json({ error: 'Method not allowed' })
      }
      return
    }

    const [projectId, resource, resourceId] = segments

    // /api/projects/:projectId
    if (!resource) {
      const project = await getProjectById(projectId)
      if (!project) {
        res.status(404).json({ error: 'Project not found' })
        return
      }
      if (req.method === 'GET') {
        res.status(200).json({ success: true, data: project })
      } else if (req.method === 'PUT') {
        const updated = await updateProject(projectId, req.body)
        if (!updated) {
          res.status(404).json({ error: 'Project not found' })
          return
        }
        res.status(200).json({ success: true, data: updated })
      } else if (req.method === 'DELETE') {
        const deleted = await deleteProject(projectId)
        if (!deleted) {
          res.status(404).json({ error: 'Project not found' })
          return
        }
        res.status(200).json({ success: true })
      } else {
        res.status(405).json({ error: 'Method not allowed' })
      }
      return
    }

    if (resource !== 'stages') {
      res.status(404).json({ error: 'Not found' })
      return
    }

    // Check project exists for all /stages routes
    const project = await getProjectById(projectId)
    if (!project) {
      res.status(404).json({ error: 'Project not found' })
      return
    }

    // /api/projects/:projectId/stages/reorder
    if (resourceId === 'reorder') {
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' })
        return
      }
      const reordered = await reorderStages(projectId, req.body.stageIds)
      res.status(200).json({ success: true, data: reordered })
      return
    }

    // /api/projects/:projectId/stages/:stageId
    if (resourceId) {
      const stage = await getStageById(resourceId)
      if (!stage || stage.projectId !== projectId) {
        res.status(404).json({ error: 'Stage not found' })
        return
      }
      if (req.method === 'GET') {
        res.status(200).json({ success: true, data: stage })
      } else if (req.method === 'PUT') {
        const updated = await updateStage(resourceId, req.body)
        if (!updated) {
          res.status(404).json({ error: 'Stage not found' })
          return
        }
        res.status(200).json({ success: true, data: updated })
      } else if (req.method === 'DELETE') {
        const deleted = await deleteStage(resourceId)
        if (!deleted) {
          res.status(404).json({ error: 'Stage not found' })
          return
        }
        res.status(200).json({ success: true })
      } else {
        res.status(405).json({ error: 'Method not allowed' })
      }
      return
    }

    // /api/projects/:projectId/stages
    if (req.method === 'GET') {
      const stages = await getStagesByProjectId(projectId)
      res.status(200).json({ success: true, data: stages })
    } else if (req.method === 'POST') {
      const { name, description, icon, status, order } = req.body
      if (!name || !description) {
        res.status(400).json({ error: 'name and description are required' })
        return
      }
      const stages = await getStagesByProjectId(projectId)
      const newOrder = order || stages.length + 1
      const newStage = await createStage(projectId, {
        name,
        description,
        icon: icon || '◻',
        status: status || 'pending',
        order: newOrder,
      })
      res.status(201).json({ success: true, data: newStage })
    } else {
      res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('api/projects error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
