import { getLinksByStageId, createLink, getStageById, getProjectById } from '../../../_shared'

export default async function handler(req, res) {
  const { projectId, stageId } = req.query

  if (!projectId || !stageId) {
    res.status(400).json({ error: 'Project ID and Stage ID are required' })
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

    if (req.method === 'GET') {
      const links = await getLinksByStageId(String(stageId), authHeader)
      res.status(200).json({ success: true, data: links })
    } else if (req.method === 'POST') {
      const { url, title, description, type } = req.body
      if (!url || !title) {
        res.status(400).json({ error: 'url and title are required' })
        return
      }

      const newLink = await createLink(String(stageId), {
        url,
        title,
        description: description || '',
        type: type || 'other',
      }, authHeader)
      res.status(201).json({ success: true, data: newLink })
    } else {
      res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('api/projects/[projectId]/stages/[stageId]/links error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}