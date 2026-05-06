import jwt from 'jsonwebtoken'
import redis from '../_upstashClient'

export interface AdminRecord {
  username: string
  passwordHash: string
  totpSecret: string
  webauthnCredentials?: Array<{
    id: string
    credentialId: string
    publicKey: string
    signCount: number
    transports?: string[]
    createdAt: number
  }>
  createdAt: number
  updatedAt?: number
  isSetupComplete?: boolean
}

export interface SessionRecord {
  sessionId: string
  adminId: string
  username: string
  createdAt: number
  expiresAt: number
}

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('Missing JWT_SECRET environment variable')
  }

  return secret
}

export function getWebAuthnOrigin(): string {
  return process.env.WEBAUTHN_ORIGIN || 'http://localhost:5173'
}

export function getWebAuthnRpID(): string {
  return process.env.WEBAUTHN_RP_ID || 'localhost'
}

export async function getAdminByUsername(username: string): Promise<AdminRecord | null> {
  const raw = await redis.get(`admin:${username}`)
  if (!raw) return null
  return JSON.parse(String(raw)) as AdminRecord
}

export async function getAllAdmins(): Promise<AdminRecord[]> {
  const keys = await redis.keys('admin:*')
  const admins: AdminRecord[] = []

  for (const key of keys) {
    const raw = await redis.get(String(key))
    if (raw) {
      admins.push(JSON.parse(String(raw)) as AdminRecord)
    }
  }

  return admins
}

export async function saveAdmin(admin: AdminRecord): Promise<void> {
  await redis.set(`admin:${admin.username}`, JSON.stringify(admin))
}

export async function issueSession(admin: AdminRecord): Promise<{ sessionToken: string; sessionId: string }> {
  const sessionId = crypto.randomUUID()
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000
  const sessionRecord: SessionRecord = {
    sessionId,
    adminId: admin.username,
    username: admin.username,
    createdAt: Date.now(),
    expiresAt,
  }

  await redis.set(`session:${sessionId}`, JSON.stringify(sessionRecord), {
    ex: SESSION_TTL_SECONDS,
  })

  const sessionToken = jwt.sign(
    {
      sub: admin.username,
      sid: sessionId,
    },
    getJwtSecret(),
    {
      expiresIn: `${SESSION_TTL_SECONDS}s`,
    },
  )

  return { sessionToken, sessionId }
}

export async function getSessionFromToken(token?: string): Promise<SessionRecord | null> {
  if (!token) return null

  try {
    const payload = jwt.verify(token, getJwtSecret()) as jwt.JwtPayload & { sid?: string }
    const sessionId = payload.sid
    if (!sessionId) return null

    const raw = await redis.get(`session:${sessionId}`)
    if (!raw) return null

    return JSON.parse(String(raw)) as SessionRecord
  } catch {
    return null
  }
}

export async function deleteSession(sessionId: string): Promise<void> {
  await redis.del(`session:${sessionId}`)
}
