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
import redis from '../_upstashClient.js'
import { handleCors } from '../_cors.js'
import {
  getAllAdmins,
  getAdminByUsername,
  getWebAuthnOrigin,
  getWebAuthnRpID,
  issueSession,
  issueLocalAuthSession,
  saveAdmin,
  deleteSession,
  getSessionFromToken,
} from './_shared.js'

function isLocalAuthEnabled(): boolean {
  // Only enable LOCAL_AUTH in development mode, never in production
  return process.env.NODE_ENV === 'development' && String(process.env.LOCAL_AUTH || '').toLowerCase() === 'yes'
}

function getLocalAuthEnv() {
  return {
    admin: process.env.LOCAL_admin || process.env.LOCAL_ADMIN || '',
    pass: process.env.LOCAL_PASS || process.env.LOCAL_pass || '',
    otp: process.env.LOCAL_OTP || process.env.LOCAL_otp || '',
  }
}

function methodNotAllowed(res: any, method: string) {
  res.status(405).json({ error: 'Method not allowed', method })
  return
}

function getRouteSegments(req: any): string[] {
  const query = req?.query || {}
  const rawPath =
    query.path ??
    query['...path'] ??
    query['[...path]'] ??
    query.pathSegments

  if (Array.isArray(rawPath)) {
    return rawPath
      .map((part) => String(part).trim())
      .filter(Boolean)
  }

  if (typeof rawPath === 'string' && rawPath.trim()) {
    return rawPath
      .split('/')
      .map((part) => part.trim())
      .filter(Boolean)
  }

  const fallbackUrl = String(req?.url || '')
  const pathname = fallbackUrl.split('?')[0] || ''
  const base = '/api/auth/'

  if (pathname.startsWith(base)) {
    return pathname
      .slice(base.length)
      .split('/')
      .map((part) => decodeURIComponent(part).trim())
      .filter(Boolean)
  }

  return []
}

export default async function handler(req: any, res: any) {
  if (handleCors(req, res)) return

  try {
    // Helpful logging for debugging 405s on deployed platforms
    try {
      console.log('auth request', { method: req.method, url: req.url, query: req.query })
    } catch (e) {
      // ignore
    }

    const pathSegments: string[] = getRouteSegments(req)
    const route = pathSegments.join('/')

    console.log('auth route', { route, method: req.method })

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
      case 'debug/admins':
        return handleDebugAdmins(req, res)
      case 'debug/create-admin':
        return handleDebugCreateAdmin(req, res)
      case 'debug/delete-admin':
        return handleDebugDeleteAdmin(req, res)
      default:
        res.status(404).json({ error: 'Not found' })
    }
  } catch (err) {
    try {
      console.error('auth handler uncaught error', err)
    } catch (e) {
      // ignore
    }
    // Return a JSON error; Vercel may still emit FUNCTION_INVOCATION_FAILED for crashes,
    // but this helps surface errors in logs and returns an intelligible response.
    try {
      res.status(500).json({ error: 'Internal server error', detail: String((err as any)?.message || err) })
    } catch (e) {
      // If writing JSON fails, attempt plain text
      try {
        res.status(500).send(String((err as any)?.message || 'Internal server error'))
      } catch (e2) {
        // give up
      }
    }
  }
}

async function handleInit(req: any, res: any) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res, req.method)
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
  console.log('handleLogin called', { method: req.method, url: req.url })
  if (req.method !== 'POST') {
    console.log('method not POST, returning 405')
    return methodNotAllowed(res, req.method)
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

      const { sessionToken } = await issueLocalAuthSession(localAdmin)
      res.status(200).json({ success: true, data: { sessionToken, adminId: localAdmin } })
      return
    }

    const admin = await getAdminByUsername(username)
    if (!admin) {
      console.log('login: admin not found', { username })
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    const passwordMatches = await bcrypt.compare(password, admin.passwordHash)
    console.log('login: password compare result', { username, passwordMatches })
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
    console.log('login: totp verify result', { username, totpMatches })
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
    return methodNotAllowed(res, req.method)
  }

  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined
    const session = await getSessionFromToken(token)

    if (session) {
      if (session.localAuth) {
        res.status(200).json({ success: true })
        return
      }

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
    return methodNotAllowed(res, req.method)
  }

  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined
    const session = await getSessionFromToken(token)

    if (session?.localAuth) {
      res.status(200).json({
        success: true,
        data: {
          isAuthenticated: true,
          adminId: session.username,
          isSetupComplete: true,
          adminExists: true,
        },
      })
      return
    }

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

    const hasPasskey = Array.isArray(admin.webauthnCredentials) && admin.webauthnCredentials.length > 0

    res.status(200).json({
      success: true,
      data: {
        isAuthenticated: true,
        adminId: admin.username,
        isSetupComplete: Boolean(admin.isSetupComplete),
        adminExists,
        hasPasskey
      },
    })
  } catch (error) {
    console.error('auth/me error', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

async function handleVerifyTotp(req: any, res: any) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res, req.method)
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
    return methodNotAllowed(res, req.method)
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
    return methodNotAllowed(res, req.method)
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
      rpID: getWebAuthnRpID(req),
      userID: Buffer.from(username, 'utf8'),
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
    return methodNotAllowed(res, req.method)
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
      expectedOrigin: getWebAuthnOrigin(req),
      expectedRPID: getWebAuthnRpID(req),
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
      rpID: getWebAuthnRpID(req),
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
      expectedOrigin: getWebAuthnOrigin(req),
      expectedRPID: getWebAuthnRpID(req),
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

async function handleDebugAdmins(req: any, res: any) {
  if (req.method !== 'GET') {
    return methodNotAllowed(res, req.method)
  }

  try {
    const tokenHeader = String(req.headers['x-debug-token'] || '')
    const expected = String(process.env.DEBUG_ADMIN_LIST_TOKEN || '')

    // Require a secret token in production; allow if LOCAL_AUTH enabled for dev convenience
    if (!expected) {
      console.log('debug/admins: DEBUG_ADMIN_LIST_TOKEN not set; denying request')
      res.status(403).json({ error: 'Debug endpoint not enabled; set DEBUG_ADMIN_LIST_TOKEN' })
      return
    }

    if (!tokenHeader || tokenHeader !== expected) {
      console.log('debug/admins: invalid token', { provided: tokenHeader ? 'present' : 'missing' })
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    const admins = await getAllAdmins()
    const safe = admins.map((a: any) => ({ username: a.username, isSetupComplete: Boolean(a.isSetupComplete), createdAt: a.createdAt || null, updatedAt: a.updatedAt || null }))
    res.status(200).json({ success: true, data: safe })
  } catch (err) {
    console.error('debug/admins error', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

async function handleDebugCreateAdmin(req: any, res: any) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res, req.method)
  }

  try {
    const tokenHeader = String(req.headers['x-debug-token'] || '')
    const expected = String(process.env.DEBUG_ADMIN_LIST_TOKEN || '')

    if (!expected) {
      res.status(403).json({ error: 'Debug endpoint not enabled; set DEBUG_ADMIN_LIST_TOKEN' })
      return
    }

    if (!tokenHeader || tokenHeader !== expected) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    const { username, password } = req.body || {}
    if (!username || !password) {
      res.status(400).json({ error: 'username and password are required' })
      return
    }

    const existing = await getAdminByUsername(username)
    if (existing) {
      res.status(409).json({ error: 'Admin already exists' })
      return
    }

    const secretObj = speakeasy.generateSecret({ name: `Roadmap (${username})` })
    const totpSecret = secretObj.base32

    const salt = await bcrypt.genSalt(10)
    const hashed = await bcrypt.hash(password, salt)

    const adminRecord = {
      username,
      passwordHash: hashed,
      totpSecret,
      createdAt: Date.now(),
      isSetupComplete: true,
    }

    await saveAdmin(adminRecord)

    res.status(200).json({ success: true, data: { username, totpSecret } })
  } catch (err) {
    console.error('debug/create-admin error', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

async function handleDebugDeleteAdmin(req: any, res: any) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res, req.method)
  }

  try {
    const tokenHeader = String(req.headers['x-debug-token'] || '')
    const expected = String(process.env.DEBUG_ADMIN_LIST_TOKEN || '')

    if (!expected) {
      res.status(403).json({ error: 'Debug endpoint not enabled; set DEBUG_ADMIN_LIST_TOKEN' })
      return
    }

    if (!tokenHeader || tokenHeader !== expected) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    const { username } = req.body || {}
    if (!username) {
      res.status(400).json({ error: 'username is required' })
      return
    }

    const existing = await getAdminByUsername(username)
    if (!existing) {
      res.status(404).json({ error: 'Admin not found' })
      return
    }

    await redis.del(`admin:${username}`)
    res.status(200).json({ success: true, data: { username } })
  } catch (err) {
    console.error('debug/delete-admin error', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}
