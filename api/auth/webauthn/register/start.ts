import { generateRegistrationOptions } from '@simplewebauthn/server'
import { getAdminByUsername, getWebAuthnOrigin, getWebAuthnRpID } from '../../_shared'
import redis from '../../../upstashClient'
import { v4 as uuidv4 } from 'uuid'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const { username } = req.body || {}
    if (!username) {
      res.status(400).json({ error: 'username is required' })
      return
    }

    const admin = await getAdminByUsername(username)
    if (!admin) {
      res.status(404).json({ error: 'Admin not found' })
      return
    }

    const sessionId = uuidv4()
    const options = await generateRegistrationOptions({
      rpName: 'Roadmap Admin',
      rpID: getWebAuthnRpID(),
      userID: username,
      userName: username,
      timeout: 60000,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
      supportedAlgorithmIDs: [-7, -257],
    })

    await redis.set(
      `webauthn:registration:${sessionId}`,
      JSON.stringify({ username, options, createdAt: Date.now() }),
      { ex: 600 },
    )

    res.status(200).json({
      success: true,
      data: {
        sessionId,
        challenge: options.challenge,
        timeout: options.timeout,
        userVerification: options.authenticatorSelection?.userVerification || 'preferred',
        attestation: 'none',
      },
    })
  } catch (error) {
    console.error('webauthn/register/start error', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
