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
  get: (...args: any[]) => ensureClient().get(...(args as [any, any?])),
  set: (...args: any[]) => ensureClient().set(...(args as [any, any, any?])),
  del: (...args: any[]) => ensureClient().del(...(args as [any])),
  keys: (...args: any[]) => ensureClient().keys(...(args as [any])),
  expire: (...args: any[]) => ensureClient().expire(...(args as [any, any])),
}

export default redis
