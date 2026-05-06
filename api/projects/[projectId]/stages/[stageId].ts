import { getStageById, updateStage, deleteStage, getProjectById } from '../../_shared'

export default async function handler(req: any, res: any) {
  const { projectId, stageId } = req.query

  if (!projectId || !stageId) {
    res.status(400).json({ error: 'Project ID and Stage ID are required' })
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
      const stage = await getStageById(String(stageId))
      if (!stage || stage.projectId !== String(projectId)) {
        res.status(404).json({ error: 'Stage not found' })
        return
      }
      res.status(200).json({ success: true, data: stage })
    } else if (req.method === 'PUT') {
      const stage = await getStageById(String(stageId))
      if (!stage || stage.projectId !== String(projectId)) {
        res.status(404).json({ error: 'Stage not found' })
        return
      }

      const updated = await updateStage(String(stageId), req.body)
      if (!updated) {
        res.status(404).json({ error: 'Stage not found' })
        return
      }
      res.status(200).json({ success: true, data: updated })
    } else if (req.method === 'DELETE') {
      const stage = await getStageById(String(stageId))
      if (!stage || stage.projectId !== String(projectId)) {
        res.status(404).json({ error: 'Stage not found' })
        return
      }

      const deleted = await deleteStage(String(stageId))
      if (!deleted) {
        res.status(404).json({ error: 'Stage not found' })
        return
      }
      res.status(200).json({ success: true })
    } else {
      res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('api/projects/[projectId]/stages/[stageId] error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
