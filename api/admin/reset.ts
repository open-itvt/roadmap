import redis from '../_upstashClient'
import { handleCors } from '../_cors'

export default async function handler(req: any, res: any) {
  if (handleCors(req, res)) return
  // Only allow POST
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    // Delete all admin records
    const adminKeys = await redis.keys('admin:*')
    for (const key of adminKeys) {
      await redis.del(String(key))
    }

    // Delete all session records
    const sessionKeys = await redis.keys('session:*')
    for (const key of sessionKeys) {
      await redis.del(String(key))
    }

    res.status(200).json({
      success: true,
      data: { message: 'Admin data reset successfully' },
    })
  } catch (error) {
    console.error('admin/reset error', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
