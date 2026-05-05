const webCrypto = globalThis.crypto

async function deriveWebCryptoHash(password: string, salt: Uint8Array): Promise<string> {
  const encoder = new TextEncoder()
  const keyMaterial = await webCrypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )

  const bits = await webCrypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-512',
    },
    keyMaterial,
    512,
  )

  return Array.from(new Uint8Array(bits)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Generate a random string of specified length
 */
export function generateRandomString(length: number = 16): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const randomValues = new Uint8Array(length)
  webCrypto.getRandomValues(randomValues)
  let result = ''
  for (let index = 0; index < length; index += 1) {
    result += charset[randomValues[index] % charset.length]
  }
  return result
}

/**
 * Generate a random password (uppercase, lowercase, numbers, special chars)
 */
export function generateRandomPassword(length: number = 16): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  const randomValues = new Uint8Array(length)
  webCrypto.getRandomValues(randomValues)
  for (let i = 0; i < length; i++) {
    password += charset[randomValues[i] % charset.length]
  }
  return password
}

/**
 * Hash a password using PBKDF2
 */
export async function hashPassword(password: string, salt?: string): Promise<string> {
  const saltBytes = salt ? Uint8Array.from(salt.match(/.{1,2}/g)?.map((part) => Number.parseInt(part, 16)) ?? []) : webCrypto.getRandomValues(new Uint8Array(32))
  const hash = await deriveWebCryptoHash(password, saltBytes)
  return `${Array.from(saltBytes).map((byte) => byte.toString(16).padStart(2, '0')).join('')}:${hash}`
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt] = hash.split(':')
  const hashToCheck = await hashPassword(password, salt)
  return hashToCheck === hash
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isStrong: boolean
  feedback: string[]
} {
  const feedback: string[] = []

  if (password.length < 12) {
    feedback.push('Password should be at least 12 characters long')
  }

  if (!/[A-Z]/.test(password)) {
    feedback.push('Password should contain uppercase letters')
  }

  if (!/[a-z]/.test(password)) {
    feedback.push('Password should contain lowercase letters')
  }

  if (!/\d/.test(password)) {
    feedback.push('Password should contain numbers')
  }

  if (!/[!@#$%^&*]/.test(password)) {
    feedback.push('Password should contain special characters')
  }

  return {
    isStrong: feedback.length === 0,
    feedback,
  }
}
