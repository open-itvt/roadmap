import {
  getProjectsFromRedis,
  createProject,
  duplicateProjectWithRelations,
  getProjectById,
} from './_shared.js'

export default async function handler(req: any, res: any) {
  try {
    if (req.method === 'GET') {
      const projects = await getProjectsFromRedis()
      res.status(200).json({ success: true, data: projects })
      return
    }

    if (req.method === 'POST') {
      const { name, description, icon, status, priority, teamSize, technologies, goals, duplicateFromProjectId } = req.body
      if (!name || !description) {
        res.status(400).json({ error: 'name and description are required' })
        return
      }

      const createPayload = {
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
      }

      if (duplicateFromProjectId) {
        const sourceProject = await getProjectById(String(duplicateFromProjectId))
        if (!sourceProject) {
          res.status(404).json({ error: 'Source project not found' })
          return
        }
      }

      const newProject = duplicateFromProjectId
        ? await duplicateProjectWithRelations(createPayload, String(duplicateFromProjectId))
        : await createProject(createPayload)

      res.status(201).json({ success: true, data: newProject })
      return
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('api/projects error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}