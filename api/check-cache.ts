import { handleCors } from './_cors.js'

function getRequestHeader(req: any, name: string): string | null {
  const headers = req?.headers || {}
  const value = headers[name] ?? headers[String(name).toLowerCase()]

  if (typeof value === 'string') {
    return value
  }

  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return null
}

export default async function handler(req: any, res: any) {
  if (handleCors(req, res)) return

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  res.setHeader('Vary', 'Origin, Accept, Cache-Control')

  const response = {
    success: true,
    data: {
      route: '/api/check-cache',
      checkedAt: new Date().toISOString(),
      environment: process.env.VERCEL ? 'production-or-preview' : 'local',
      requestHeaders: {
        'cf-cache-status': getRequestHeader(req, 'cf-cache-status'),
        'x-vercel-cache': getRequestHeader(req, 'x-vercel-cache'),
        'cache-control': getRequestHeader(req, 'cache-control'),
        pragma: getRequestHeader(req, 'pragma'),
        age: getRequestHeader(req, 'age'),
        via: getRequestHeader(req, 'via'),
      },
      cacheHeaders: {
        'cache-control': 'no-store, no-cache, must-revalidate, max-age=0',
        pragma: 'no-cache',
        expires: '0',
      },
      note: 'This endpoint is intentionally non-cacheable and returns cache-related request headers for diagnostics.',
    },
  }

  if (req.method === 'HEAD') {
    res.status(200).end()
    return
  }

  res.status(200).json(response)
}