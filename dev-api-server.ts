import dotenv from 'dotenv'
import http from 'http'
import { fileURLToPath } from 'url'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Dynamically import and cache handlers
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

// Consolidated catch-all handler paths
const CATCH_ALL_ROUTES: [RegExp, string, string][] = [
  [/^\/api\/auth(\/.*)?$/, './api/auth/[...path].ts', '/api/auth'],
  [/^\/api\/admin(\/.*)?$/, './api/admin/[[...path]].ts', '/api/admin'],
  [/^\/api\/projects(\/.*)?$/, './api/projects/[[...path]].ts', '/api/projects'],
]

// Parse JSON body
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

// Create server
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`)
  const pathname = url.pathname

  console.log(`${req.method} ${pathname}`)

  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders)
    res.end()
    return
  }

  let resolvedHandlerPath: string | undefined
  let pathSegments: string[] = []

  for (const [pattern, handlerPath, basePath] of CATCH_ALL_ROUTES) {
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

  try {
    const handler = await getHandler(resolvedHandlerPath)

    if (!handler) {
      res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders })
      res.end(JSON.stringify({ error: 'Handler not found', success: false }))
      return
    }

    // Parse body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(req.method || 'GET')) {
      const body = await parseBody(req)
      ;(req as any).body = body
    }

    // Merge path segments and search params into query
    const searchParams = Object.fromEntries(url.searchParams.entries())
    ;(req as any).query = { ...searchParams, ...(pathSegments.length > 0 ? { path: pathSegments } : {}) }

    // Wrap response for Express-like handlers
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

    // Call handler
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
