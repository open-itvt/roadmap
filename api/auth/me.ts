import { getSessionFromToken, getAdminByUsername, getAllAdmins } from './_shared'
import { handleCors } from '../_cors'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    if (handleCors(req, res)) return
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined
    const session = await getSessionFromToken(token)

    // Determine if any admin account exists in the system
    const admins = await getAllAdmins()
    const adminExists = admins.length > 0

    if (!session) {
      res.status(200).json({ success: true, data: { isAuthenticated: false, isSetupComplete: false, adminExists } })
      return
    }

    const admin = await getAdminByUsername(session.username)
    if (!admin) {
      res.status(200).json({ success: true, data: { isAuthenticated: false, isSetupComplete: false, adminExists } })
      return
    }

    res.status(200).json({
      success: true,
      data: {
        isAuthenticated: true,
        adminId: admin.username,
        isSetupComplete: Boolean(admin.isSetupComplete),
        adminExists,
      },
    })
  } catch (error) {
    console.error('auth/me error', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
