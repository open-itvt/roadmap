import { getProjectsFromRedis, createProject } from './projects/_shared'

export default async function handler(req: any, res: any) {
  try {
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
  } catch (error) {
    console.error('api/projects error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
