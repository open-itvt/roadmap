import bcrypt from 'bcryptjs'
import speakeasy from 'speakeasy'
import { Redis } from '@upstash/redis'

const url = process.env.UPSTASH_REDIS_REST_URL
const token = process.env.UPSTASH_REDIS_REST_TOKEN

if (!url || !token) {
  console.error('Error: Missing Upstash Redis environment variables')
  console.error('Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN')
  process.exit(1)
}

async function createTestAdmin() {
  try {
    const redis = new Redis({ url, token })

    const username = 'admin'
    const password = '22377755111+'

    // Check if admin already exists
    const existing = await redis.get(`admin:${username}`)
    if (existing) {
      console.log(`Admin account '${username}' already exists`)
      process.exit(0)
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({ name: `Roadmap (${username})` })

    // Create admin record
    const adminRecord = {
      username,
      passwordHash,
      totpSecret: secret.base32,
      createdAt: Date.now(),
      isSetupComplete: true,
    }

    // Save to Redis
    await redis.set(`admin:${username}`, JSON.stringify(adminRecord))

    console.log('✓ Test admin account created successfully!')
    console.log(`Username: ${username}`)
    console.log(`Password: ${password}`)
    console.log(`TOTP Secret: ${secret.base32}`)
    console.log(`\n🔑 DEV MODE - Use code '000000' to bypass 2FA (when NODE_ENV=development)`)
    console.log(`\n📱 Or scan QR code in authenticator app:`)
    console.log(`otpauth://totp/Roadmap%20(${username})?secret=${secret.base32}&issuer=Roadmap`)
  } catch (error) {
    console.error('Error creating test admin:', error)
    process.exit(1)
  }
}

createTestAdmin()
