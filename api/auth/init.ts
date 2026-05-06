import speakeasy from 'speakeasy'
import qrcode from 'qrcode'
import { v4 as uuidv4 } from 'uuid'
import redis from '../upstashClient'
import { handleCors } from '../_cors'
import { getAllAdmins } from './_shared'

export default async function handler(req: any, res: any) {
  if (handleCors(req, res)) return

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const existingAdmins = await getAllAdmins()
    if (existingAdmins.length > 0) {
      res.status(403).json({ error: 'Admin account already exists' })
      return
    }

    const { username } = req.body || {}
    if (!username) {
      res.status(400).json({ error: 'username is required' })
      return
    }

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({ name: `Roadmap (${username})` })
    const otpAuthUrl = secret.otpauth_url

    // Create QR code data URL
    const qrCodeDataUrl = await qrcode.toDataURL(otpAuthUrl)

    // Create temporary session for first-time setup
    const sessionId = uuidv4()
    const key = `session:${sessionId}`
    const payload = {
      username,
      totpSecret: secret.base32,
      createdAt: Date.now(),
      setupComplete: false,
    }

    await redis.set(key, JSON.stringify(payload))
    // expire after 15 minutes
    await redis.expire(key, 60 * 15)

    res.status(200).json({ success: true, data: { sessionId, qrCode: qrCodeDataUrl } })
  } catch (err) {
    console.error('auth/init error', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}
