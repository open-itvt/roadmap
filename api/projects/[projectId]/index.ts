import {
  getProjectById,
  updateProject,
  deleteProject,
} from '../_shared.js'

export default async function handler(req: any, res: any) {
  const { projectId } = req.query

  if (!projectId) {
    res.status(400).json({ error: 'Project ID is required' })
    return
  }

  try {
    const project = await getProjectById(String(projectId))
    if (!project) {
      res.status(404).json({ error: 'Project not found' })
      return
    }

    if (req.method === 'GET') {
      res.status(200).json({ success: true, data: project })
      return
    }

    if (req.method === 'PUT') {
      const updated = await updateProject(String(projectId), req.body)
      if (!updated) {
        res.status(404).json({ error: 'Project not found' })
        return
      }
      res.status(200).json({ success: true, data: updated })
      return
    }

    if (req.method === 'DELETE') {
      const deleted = await deleteProject(String(projectId))
      if (!deleted) {
        res.status(404).json({ error: 'Project not found' })
        return
      }
      res.status(200).json({ success: true })
      return
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('api/projects/[projectId] error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}