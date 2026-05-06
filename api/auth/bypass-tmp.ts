import { handleCors } from '../_cors'

export default async function handler(req, res) {
  if (handleCors(req, res)) return

  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    res.status(403).json({ error: 'This endpoint is only available in development mode' })
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const { username, password } = req.body || {}
    if (!username || !password) {
      res.status(400).json({ error: 'username and password are required' })
      return
    }

    const sessionToken = `dev:${username}`
    res.status(200).json({ 
      success: true, 
      data: { 
        sessionToken, 
        adminId: username,
        warning: '⚠️ 2FA bypassed (development only)'
      } 
    })
  } catch (error) {
    console.error('auth/bypass-tmp error', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
