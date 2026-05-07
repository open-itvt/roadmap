import speakeasy from 'speakeasy'
import qrcode from 'qrcode'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server'
import redis from '../_upstashClient'
import { handleCors } from '../_cors'
import {
  getAllAdmins,
  getAdminByUsername,
  getWebAuthnOrigin,
  getWebAuthnRpID,
  issueSession,
  saveAdmin,
  deleteSession,
  getSessionFromToken,
} from './_shared'

function isLocalAuthEnabled(): boolean {
  return String(process.env.LOCAL_AUTH || '').toLowerCase() === 'yes'
}

function getLocalAuthEnv() {
  return {
    admin: process.env.LOCAL_admin || process.env.LOCAL_ADMIN || '',
    pass: process.env.LOCAL_PASS || process.env.LOCAL_pass || '',
    otp: process.env.LOCAL_OTP || process.env.LOCAL_otp || '',
  }
}

export default async function handler(req: any, res: any) {
  if (handleCors(req, res)) return

  const pathSegments: string[] = Array.isArray(req.query.path)
    ? req.query.path
    : req.query.path
    ? [req.query.path]
    : []
  const route = pathSegments.join('/')

  switch (route) {
    case 'init':
      return handleInit(req, res)
    case 'login':
      return handleLogin(req, res)
    case 'logout':
      return handleLogout(req, res)
    case 'me':
      return handleMe(req, res)
    case 'verify-totp':
      return handleVerifyTotp(req, res)
    case 'set-password':
      return handleSetPassword(req, res)
    case 'webauthn/register/start':
      return handleWebAuthnRegisterStart(req, res)
    case 'webauthn/register/complete':
      return handleWebAuthnRegisterComplete(req, res)
    case 'webauthn/auth/start':
      return handleWebAuthnAuthStart(req, res)
    case 'webauthn/auth/complete':
      return handleWebAuthnAuthComplete(req, res)
    default:
      res.status(404).json({ error: 'Not found' })
  }
}

async function handleInit(req: any, res: any) {
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

    const secret = speakeasy.generateSecret({ name: `Roadmap (${username})` })
    const otpAuthUrl = secret.otpauth_url
    if (!otpAuthUrl) {
      res.status(500).json({ error: 'Failed to generate TOTP URL' })
      return
    }

    const qrCodeDataUrl = await qrcode.toDataURL(otpAuthUrl)
    const sessionId = uuidv4()
    const key = `session:${sessionId}`
    const payload = {
      username,
      totpSecret: secret.base32,
      createdAt: Date.now(),
      setupComplete: false,
    }

    await redis.set(key, JSON.stringify(payload))
    await redis.expire(key, 60 * 15)

    res.status(200).json({ success: true, data: { sessionId, qrCode: qrCodeDataUrl } })
  } catch (err) {
    console.error('auth/init error', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

async function handleLogin(req: any, res: any) {
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

    if (isLocalAuthEnabled()) {
      const { admin: localAdmin, pass: localPass, otp: localOtp } = getLocalAuthEnv()

      if (!localAdmin || !localPass || !localOtp) {
        res.status(500).json({ error: 'LOCAL_AUTH is enabled but LOCAL_admin/LOCAL_ADMIN, LOCAL_PASS/LOCAL_pass or LOCAL_OTP/LOCAL_otp is missing' })
        return
      }

      if (String(username).trim() !== String(localAdmin).trim()) {
        res.status(401).json({ error: 'Invalid LOCAL_AUTH username' })
        return
      }

      if (String(password) !== String(localPass)) {
        res.status(401).json({ error: 'Invalid LOCAL_AUTH password' })
        return
      }

      if (String(totpCode).trim() !== String(localOtp).trim()) {
        res.status(401).json({ error: 'Invalid LOCAL_AUTH OTP code' })
        return
      }

      // Ensure /auth/me resolves this user as a valid admin after login.
      const existingAdmin = await getAdminByUsername(localAdmin)
      if (!existingAdmin) {
        await saveAdmin({
          username: localAdmin,
          passwordHash: 'local-auth',
          totpSecret: 'local-auth',
          createdAt: Date.now(),
          isSetupComplete: true,
        })
      }

      const admin = (await getAdminByUsername(localAdmin)) || {
        username: localAdmin,
        passwordHash: 'local-auth',
        totpSecret: 'local-auth',
        createdAt: Date.now(),
        isSetupComplete: true,
      }

      const { sessionToken } = await issueSession(admin)
      res.status(200).json({ success: true, data: { sessionToken, adminId: localAdmin } })
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
    const totpMatches = speakeasy.totp.verify({
      secret: admin.totpSecret,
      encoding: 'base32',
      token,
      window: 2,
      step: 30,
    })

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

async function handleLogout(req: any, res: any) {
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

async function handleMe(req: any, res: any) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined
    const session = await getSessionFromToken(token)

    const admins = await getAllAdmins()
    const adminExists = admins.length > 0

    if (!session) {
      res.status(200).json({ success: true, data: { isAuthenticated: false, isSetupComplete: false, adminExists } })
      return
    }

    const admin = await getAdminByUsername(session.username)
    if (!admin) {
      res.status(200).json({ success: true, data: { isAuthenticated: false, isSetupComplete: false, adminExists } })
      return
    }

    res.status(200).json({
      success: true,
      data: {
        isAuthenticated: true,
        adminId: admin.username,
        isSetupComplete: Boolean(admin.isSetupComplete),
        adminExists,
      },
    })
  } catch (error) {
    console.error('auth/me error', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

async function handleVerifyTotp(req: any, res: any) {
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

    payload.totpVerified = true
    await redis.set(key, JSON.stringify(payload))
    await redis.expire(key, 60 * 15)

    res.status(200).json({ success: true, data: { success: true } })
  } catch (err) {
    console.error('verify-totp error', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

async function handleSetPassword(req: any, res: any) {
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

    const payload = JSON.parse(String(raw))
    if (!payload.totpVerified) {
      res.status(400).json({ error: 'TOTP not verified yet' })
      return
    }

    const username = payload.username
    const totpSecret = payload.totpSecret

    const salt = await bcrypt.genSalt(10)
    const hashed = await bcrypt.hash(password, salt)

    const adminKey = `admin:${username}`
    const adminRecord = {
      username,
      passwordHash: hashed,
      totpSecret,
      createdAt: Date.now(),
      isSetupComplete: true,
    }

    await redis.set(adminKey, JSON.stringify(adminRecord))
    await redis.del(key)

    res.status(200).json({ success: true, data: { success: true } })
  } catch (err) {
    console.error('set-password error', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

async function handleWebAuthnRegisterStart(req: any, res: any) {
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

async function handleWebAuthnRegisterComplete(req: any, res: any) {
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
    admin.isSetupComplete = true

    await saveAdmin(admin)
    await redis.del(`webauthn:registration:${sessionId}`)

    res.status(200).json({ success: true, data: { success: true } })
  } catch (error) {
    console.error('webauthn/register/complete error', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

async function handleWebAuthnAuthStart(req: any, res: any) {
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

async function handleWebAuthnAuthComplete(req: any, res: any) {
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
