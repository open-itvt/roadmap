import bcrypt from 'bcryptjs'
import speakeasy from 'speakeasy'
import { getAdminByUsername, issueSession } from './_shared'
import { handleCors } from '../_cors'

export default async function handler(req, res) {
  if (handleCors(req, res)) return

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

    const token = String(totpCode).trim()

    // DEV: Allow bypass with code '000000' in development
    const isDev = process.env.NODE_ENV === 'development'
    const devBypassCode = '000000'
    let totpMatches = isDev && token === devBypassCode

    // Verify TOTP if not using dev bypass
    if (!totpMatches) {
      totpMatches = speakeasy.totp.verify({
        secret: admin.totpSecret,
        encoding: 'base32',
        token,
        window: 2,
        step: 30,
      })
    }

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
