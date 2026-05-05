import bcrypt from 'bcryptjs'
import speakeasy from 'speakeasy'
import { getAdminByUsername, issueSession } from './_shared'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const { username, password, totpCode } = req.body || {}
    if (!username || !password || !totpCode) {
      res.status(400).json({ error: 'username, password and totpCode are required' })
      return
    }

    const admin = await getAdminByUsername(username)
    if (!admin) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    const passwordMatches = await bcrypt.compare(password, admin.passwordHash)
    if (!passwordMatches) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    const totpMatches = speakeasy.totp.verify({
      secret: admin.totpSecret,
      encoding: 'base32',
      token: String(totpCode),
      window: 1,
    })

    if (!totpMatches) {
      res.status(401).json({ error: 'Invalid TOTP code' })
      return
    }

    const { sessionToken } = await issueSession(admin)
    res.status(200).json({ success: true, data: { sessionToken, adminId: admin.username } })
  } catch (error) {
    console.error('auth/login error', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
