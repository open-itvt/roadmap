import {
  reorderStages,
  getProjectById,
} from '../../_shared'

export default async function handler(req: any, res: any) {
  const { projectId } = req.query

  if (!projectId) {
    res.status(400).json({ error: 'Project ID is required' })
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const project = await getProjectById(String(projectId))
    if (!project) {
      res.status(404).json({ error: 'Project not found' })
      return
    }

    const reordered = await reorderStages(String(projectId), req.body.stageIds)
    res.status(200).json({ success: true, data: reordered })
  } catch (error) {
    console.error('api/projects/[projectId]/stages/reorder error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}