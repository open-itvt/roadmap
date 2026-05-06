import { updateLink, deleteLink, getLinksFromRedis, getStageById, getProjectById } from '../../../../_shared'

export default async function handler(req, res) {
  const { projectId, stageId, linkId } = req.query

  if (!projectId || !stageId || !linkId) {
    res.status(400).json({ error: 'Project ID, Stage ID and Link ID are required' })
    return
  }

  try {
    // Check if project exists
    const authHeader = req.headers.authorization as string | undefined
    const project = await getProjectById(String(projectId), authHeader)
    if (!project) {
      res.status(404).json({ error: 'Project not found' })
      return
    }

    // Check if stage exists and belongs to project
    const stage = await getStageById(String(stageId), authHeader)
    if (!stage || stage.projectId !== String(projectId)) {
      res.status(404).json({ error: 'Stage not found' })
      return
    }

    // Check if link exists and belongs to stage
    const links = await getLinksFromRedis(authHeader)
    const link = links.find(l => l.id === String(linkId) && l.stageId === String(stageId))
    if (!link) {
      res.status(404).json({ error: 'Link not found' })
      return
    }

    if (req.method === 'PUT') {
      const updated = await updateLink(String(linkId), req.body, authHeader)
      if (!updated) {
        res.status(404).json({ error: 'Link not found' })
        return
      }
      res.status(200).json({ success: true, data: updated })
    } else if (req.method === 'DELETE') {
      const deleted = await deleteLink(String(linkId), authHeader)
      if (!deleted) {
        res.status(404).json({ error: 'Link not found' })
        return
      }
      res.status(200).json({ success: true })
    } else {
      res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('api/projects/[projectId]/stages/[stageId]/links/[linkId] error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}