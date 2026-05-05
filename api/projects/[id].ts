import { getProjectById, updateProject, deleteProject } from '../../projects/_shared'

export default async function handler(req, res) {
  const { id } = req.query

  if (!id) {
    res.status(400).json({ error: 'Project ID is required' })
    return
  }

  try {
    if (req.method === 'GET') {
      const project = await getProjectById(String(id))
      if (!project) {
        res.status(404).json({ error: 'Project not found' })
        return
      }
      res.status(200).json({ success: true, data: project })
    } else if (req.method === 'PUT') {
      const updated = await updateProject(String(id), req.body)
      if (!updated) {
        res.status(404).json({ error: 'Project not found' })
        return
      }
      res.status(200).json({ success: true, data: updated })
    } else if (req.method === 'DELETE') {
      const deleted = await deleteProject(String(id))
      if (!deleted) {
        res.status(404).json({ error: 'Project not found' })
        return
      }
      res.status(200).json({ success: true })
    } else {
      res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('api/projects/[id] error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
