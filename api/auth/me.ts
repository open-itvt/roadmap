import { getSessionFromToken, getAdminByUsername } from './_shared'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined
    const session = await getSessionFromToken(token)

    if (!session) {
      res.status(200).json({ success: true, data: { isAuthenticated: false, isSetupComplete: false } })
      return
    }

    const admin = await getAdminByUsername(session.username)
    if (!admin) {
      res.status(200).json({ success: true, data: { isAuthenticated: false, isSetupComplete: false } })
      return
    }

    res.status(200).json({
      success: true,
      data: {
        isAuthenticated: true,
        adminId: admin.username,
        isSetupComplete: Boolean(admin.isSetupComplete ?? true),
      },
    })
  } catch (error) {
    console.error('auth/me error', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
