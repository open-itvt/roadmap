import { verifyAuthenticationResponse } from '@simplewebauthn/server'
import redis from '../../../../upstashClient'
import { getAllAdmins, getWebAuthnOrigin, getWebAuthnRpID, issueSession, saveAdmin } from '../../../auth/_shared'

export default async function handler(req, res) {
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

    const raw = await redis.get(`webauthn:authentication:${sessionId}`)
    if (!raw) {
      res.status(404).json({ error: 'authentication session not found or expired' })
      return
    }

    const pending = JSON.parse(String(raw)) as { options: any; createdAt: number }
    const admins = await getAllAdmins()

    const credentialId = response?.id || response?.rawId
    const admin = admins.find((candidate) =>
      (candidate.webauthnCredentials || []).some((credential) => credential.credentialId === credentialId),
    )

    if (!admin) {
      res.status(401).json({ error: 'No matching WebAuthn credential found' })
      return
    }

    const credential = admin.webauthnCredentials?.find((item) => item.credentialId === credentialId)
    if (!credential) {
      res.status(401).json({ error: 'WebAuthn credential not found' })
      return
    }

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: pending.options.challenge,
      expectedOrigin: getWebAuthnOrigin(),
      expectedRPID: getWebAuthnRpID(),
      authenticator: {
        credentialID: Buffer.from(credential.credentialId, 'base64'),
        credentialPublicKey: Buffer.from(credential.publicKey, 'base64'),
        counter: credential.signCount,
      },
      requireUserVerification: true,
    })

    if (!verification.verified || !verification.authenticationInfo) {
      res.status(400).json({ error: 'WebAuthn authentication failed' })
      return
    }

    credential.signCount = verification.authenticationInfo.newCounter
    admin.updatedAt = Date.now()
    await saveAdmin(admin)

    const { sessionToken } = await issueSession(admin)
    await redis.del(`webauthn:authentication:${sessionId}`)

    res.status(200).json({ success: true, data: { sessionToken, adminId: admin.username } })
  } catch (error) {
    console.error('webauthn/auth/complete error', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
