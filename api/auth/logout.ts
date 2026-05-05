import { deleteSession, getSessionFromToken } from './_shared'
import { handleCors } from '../_cors'

export default async function handler(req, res) {
  if (handleCors(req, res)) return

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined
    const session = await getSessionFromToken(token)

    if (session) {
      await deleteSession(session.sessionId)
    }

    res.status(200).json({ success: true })
  } catch (error) {
    console.error('auth/logout error', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
