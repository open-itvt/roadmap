import bcrypt from 'bcryptjs'
import redis from '../upstashClient'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const { sessionId, password } = req.body || {}
    if (!sessionId || !password) {
      res.status(400).json({ error: 'sessionId and password are required' })
      return
    }

    const key = `session:${sessionId}`
    const raw = await redis.get(key)
    if (!raw) {
      res.status(404).json({ error: 'session not found or expired' })
      return
    }

    const payload = JSON.parse(raw)
    if (!payload.totpVerified) {
      res.status(400).json({ error: 'TOTP not verified yet' })
      return
    }

    const username = payload.username
    const totpSecret = payload.totpSecret

    // hash password
    const salt = await bcrypt.genSalt(10)
    const hashed = await bcrypt.hash(password, salt)

    const adminKey = `admin:${username}`
    const adminRecord = {
      username,
      passwordHash: hashed,
      totpSecret,
      createdAt: Date.now(),
    }

    // store admin record
    await redis.set(adminKey, JSON.stringify(adminRecord))

    // remove temporary session
    await redis.del(key)

    res.status(200).json({ success: true })
  } catch (err) {
    console.error('set-password error', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}
