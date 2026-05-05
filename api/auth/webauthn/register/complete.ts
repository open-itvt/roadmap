import { verifyRegistrationResponse } from '@simplewebauthn/server'
import redis from '../../../../upstashClient'
import { getAdminByUsername, getWebAuthnOrigin, getWebAuthnRpID, saveAdmin } from '../../../auth/_shared'
import { handleCors } from '../../../../_cors'

export default async function handler(req, res) {
  if (handleCors(req, res)) return

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const { sessionId, response } = req.body || {}
    if (!sessionId || !response) {
      res.status(400).json({ error: 'sessionId and response are required' })
      return
    }

    const raw = await redis.get(`webauthn:registration:${sessionId}`)
    if (!raw) {
      res.status(404).json({ error: 'registration session not found or expired' })
      return
    }

    const pending = JSON.parse(String(raw)) as { username: string; options: any }
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: pending.options.challenge,
      expectedOrigin: getWebAuthnOrigin(),
      expectedRPID: getWebAuthnRpID(),
      requireUserVerification: true,
    })

    if (!verification.verified || !verification.registrationInfo) {
      res.status(400).json({ error: 'WebAuthn registration failed' })
      return
    }

    const admin = (await getAdminByUsername(pending.username)) ?? {
      username: pending.username,
      passwordHash: '',
      totpSecret: '',
      webauthnCredentials: [],
      createdAt: Date.now(),
      isSetupComplete: true,
    }

    admin.webauthnCredentials = admin.webauthnCredentials || []
    admin.webauthnCredentials.push({
      id: verification.registrationInfo.credentialID,
      credentialId: verification.registrationInfo.credentialID,
      publicKey: Buffer.from(verification.registrationInfo.credentialPublicKey).toString('base64'),
      signCount: verification.registrationInfo.counter,
      transports: response?.response?.transports || [],
      createdAt: Date.now(),
    })
    admin.updatedAt = Date.now()

    await saveAdmin(admin)
    await redis.del(`webauthn:registration:${sessionId}`)

    res.status(200).json({ success: true })
  } catch (error) {
    console.error('webauthn/register/complete error', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
