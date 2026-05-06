import { getStagesByProjectId, createStage, reorderStages, getProjectById } from '../_shared'

export default async function handler(req: any, res: any) {
  const { projectId } = req.query

  if (!projectId) {
    res.status(400).json({ error: 'Project ID is required' })
    return
  }

  try {
    // Check if project exists
    const project = await getProjectById(String(projectId))
    if (!project) {
      res.status(404).json({ error: 'Project not found' })
      return
    }

    if (req.method === 'GET') {
      const stages = await getStagesByProjectId(String(projectId))
      res.status(200).json({ success: true, data: stages })
    } else if (req.method === 'POST') {
      const { name, description, icon, status, order } = req.body
      if (!name || !description) {
        res.status(400).json({ error: 'name and description are required' })
        return
      }

      const stages = await getStagesByProjectId(String(projectId))
      const newOrder = order || stages.length + 1

      const newStage = await createStage(String(projectId), {
        name,
        description,
        icon: icon || '◻',
        status: status || 'pending',
        order: newOrder,
      })
      res.status(201).json({ success: true, data: newStage })
    } else if (req.method === 'POST' && req.body.stageIds) {
      // Reorder stages
      const reordered = await reorderStages(String(projectId), req.body.stageIds)
      res.status(200).json({ success: true, data: reordered })
    } else {
      res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('api/projects/[projectId]/stages error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
