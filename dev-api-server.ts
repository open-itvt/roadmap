import dotenv from 'dotenv'
import http from 'http'
import { fileURLToPath } from 'url'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const __dirname = path.dirname(fileURLToPath(import.meta.url))

interface CatchAllRoute {
  pattern: RegExp
  handlerPath: string
  basePath: string
}

const handlersCache = new Map()

async function getHandler(handlerPath: string) {
  if (handlersCache.has(handlerPath)) {
    return handlersCache.get(handlerPath)
  }

  try {
    const module = await import(path.join(__dirname, handlerPath))
    handlersCache.set(handlerPath, module.default)
    return module.default
  } catch (error: any) {
    console.error(`Error loading ${handlerPath}:`, error.message)
    return null
  }
}

const CATCH_ALL_ROUTES: CatchAllRoute[] = [
  { pattern: /^\/api\/auth(\/.*)?$/, handlerPath: './api/auth/[...path].ts', basePath: '/api/auth' },
  { pattern: /^\/api\/admin(\/.*)?$/, handlerPath: './api/admin/[[...path]].ts', basePath: '/api/admin' },
  { pattern: /^\/api\/projects(\/.*)?$/, handlerPath: './api/projects/[[...path]].ts', basePath: '/api/projects' },
]

function parseBody(req: http.IncomingMessage): Promise<Record<string, any>> {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk.toString()
    })
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch {
        resolve({})
      }
    })
  })
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
}

async function getHandlerFromCache(handlerPath: string) {
  if (handlersCache.has(handlerPath)) {
    return handlersCache.get(handlerPath)
  }

  try {
    const module = await import(path.join(__dirname, handlerPath))
    const handler = module.default
    handlersCache.set(handlerPath, handler)
    return handler
  } catch (error: any) {
    console.error(`Error loading ${handlerPath}:`, error.message)
    return null
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`)
  const pathname = url.pathname

  ;(req as any).query = Object.fromEntries(url.searchParams.entries())
  console.log(`${req.method} ${pathname}`)

  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders)
    res.end()
    return
  }

  let resolvedHandlerPath: string | undefined
  let pathSegments: string[] = []

  for (const { pattern, handlerPath, basePath } of CATCH_ALL_ROUTES) {
    if (pattern.test(pathname)) {
      resolvedHandlerPath = handlerPath
      const remaining = pathname.slice(basePath.length).replace(/^\//, '')
      pathSegments = remaining ? remaining.split('/') : []
      break
    }
  }

  if (!resolvedHandlerPath) {
    res.writeHead(404, { 'Content-Type': 'application/json', ...corsHeaders })
    res.end(JSON.stringify({ error: 'Not found', success: false }))
    return
  }

  const parts = pathname.split('/').filter(Boolean)
  const query = (req as any).query || {}
  if (parts[0] === 'api' && parts[1] === 'projects') {
    if (parts.length === 3) {
      query.id = parts[2]
    }

    if (parts.length >= 4 && parts[3] === 'stages') {
      query.projectId = parts[2]
      if (parts.length === 5) {
        query.stageId = parts[4]
      }
    }
  }
  ;(req as any).query = query

  try {
    const handler = await getHandlerFromCache(resolvedHandlerPath)
    if (!handler) {
      res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders })
      res.end(JSON.stringify({ error: 'Handler not found', success: false }))
      return
    }

    if (['POST', 'PUT', 'PATCH'].includes(req.method || 'GET')) {
      const body = await parseBody(req)
      ;(req as any).body = body
    }

    const searchParams = Object.fromEntries(url.searchParams.entries())
    ;(req as any).query = { ...searchParams, ...(pathSegments.length > 0 ? { path: pathSegments } : {}) }

    const wrappedRes = Object.create(res)
    wrappedRes.status = function (code: number) {
      this.statusCode = code
      return this
    }
    wrappedRes.json = function (body: any) {
      if (!this.getHeader('Content-Type')) {
        this.setHeader('Content-Type', 'application/json')
      }
      this.end(JSON.stringify(body))
      return this
    }
    wrappedRes.send = function (body: any) {
      if (!this.getHeader('Content-Type')) {
        const isJson = typeof body === 'object'
        this.setHeader('Content-Type', isJson ? 'application/json' : 'text/plain')
      }
      this.end(typeof body === 'string' ? body : JSON.stringify(body))
      return this
    }
    wrappedRes.end = res.end.bind(res)

    await handler(req, wrappedRes)
  } catch (error: any) {
    console.error('Handler error:', error)
    res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders })
    res.end(JSON.stringify({ error: error.message || 'Internal server error', success: false }))
  }
})

const PORT = process.env.API_PORT || 3001
server.listen(PORT, () => {
  console.log(`API dev server listening on http://localhost:${PORT}`)
  console.log('Ready to accept requests')
})
