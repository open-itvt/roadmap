import speakeasy from 'speakeasy'
import redis from '../upstashClient'
import { handleCors } from '../_cors'

export default async function handler(req: any, res: any) {
  if (handleCors(req, res)) return

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const { sessionId, totpCode } = req.body || {}
    if (!sessionId || !totpCode) {
      res.status(400).json({ error: 'sessionId and totpCode are required' })
      return
    }

    const key = `session:${sessionId}`
    const raw = await redis.get(key)
    if (!raw) {
      res.status(404).json({ error: 'session not found or expired' })
      return
    }

    const payload = JSON.parse(String(raw))
    const secret = payload.totpSecret
    const token = String(totpCode).trim()

    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2,
      step: 30,
    })

    if (!verified) {
      res.status(400).json({ success: false, error: 'Invalid TOTP code' })
      return
    }

    // mark session as totp-verified (still waiting for password)
    payload.totpVerified = true
    await redis.set(key, JSON.stringify(payload))
    await redis.expire(key, 60 * 15)

    res.status(200).json({ success: true, data: { success: true } })
  } catch (err) {
    console.error('verify-totp error', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}
