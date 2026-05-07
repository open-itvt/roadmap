import { Redis } from '@upstash/redis'

let client: Redis | null = null

function ensureClient(): Redis {
  if (client) return client
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    throw new Error('Missing Upstash Redis environment variables')
  }

  client = new Redis({ url, token })
  return client
}

const redis = {
  get: (key: string) => ensureClient().get(key),
  set: (key: string, value: any, options?: any) => ensureClient().set(key, value, options),
  del: (...keys: string[]) => ensureClient().del(...keys),
  keys: (pattern: string) => ensureClient().keys(pattern),
  expire: (key: string, ttl: number) => ensureClient().expire(key, ttl),
}

export default redis
