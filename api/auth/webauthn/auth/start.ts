import { generateAuthenticationOptions } from '@simplewebauthn/server'
import { getAllAdmins, getWebAuthnRpID } from '../../_shared'
import redis from '../../../upstashClient'
import { v4 as uuidv4 } from 'uuid'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const admins = await getAllAdmins()
    const allowCredentials = admins.flatMap((admin) =>
      (admin.webauthnCredentials || []).map((credential) => ({
        id: credential.credentialId,
        type: 'public-key' as const,
        transports: credential.transports as any,
      })),
    )

    const sessionId = uuidv4()
    const options = await generateAuthenticationOptions({
      rpID: getWebAuthnRpID(),
      timeout: 60000,
      userVerification: 'preferred',
      allowCredentials,
    })

    await redis.set(
      `webauthn:authentication:${sessionId}`,
      JSON.stringify({ options, createdAt: Date.now() }),
      { ex: 600 },
    )

    res.status(200).json({
      success: true,
      data: {
        sessionId,
        challenge: options.challenge,
        timeout: options.timeout,
        userVerification: options.userVerification,
        attestation: 'none',
      },
    })
  } catch (error) {
    console.error('webauthn/auth/start error', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
