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

// Route mapping
const routeMap: Record<string, string> = {
  '/api/auth/me': './api/auth/me.ts',
  '/api/auth/init': './api/auth/init.ts',
  '/api/auth/login': './api/auth/login.ts',
  '/api/auth/logout': './api/auth/logout.ts',
  '/api/auth/verify-totp': './api/auth/verify-totp.ts',
  '/api/auth/set-password': './api/auth/set-password.ts',
  '/api/auth/bypass-tmp': './api/auth/bypass-tmp.ts',
  '/api/auth/webauthn/auth/start': './api/auth/webauthn/auth/start.ts',
  '/api/auth/webauthn/auth/complete': './api/auth/webauthn/auth/complete.ts',
  '/api/auth/webauthn/register/start': './api/auth/webauthn/register/start.ts',
  '/api/auth/webauthn/register/complete': './api/auth/webauthn/register/complete.ts',
  '/api/admin/reset': './api/admin/reset.ts',
  '/api/init': './api/init.ts',
  '/api/projects': './api/projects.ts',
}

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

  // expose parsed query params on the request like Express (handlers expect req.query)
  ;(req as any).query = Object.fromEntries(url.searchParams.entries())
  console.log(`${req.method} ${pathname}`)

  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders)
    res.end()
    return
  }

  // Support dynamic project routes (e.g. /api/projects/:id and /api/projects/:projectId/stages)
  let handlerPath = routeMap[pathname]
  if (!handlerPath) {
    const parts = pathname.split('/').filter(Boolean) // ['api','projects', ...]
    if (parts[0] === 'api' && parts[1] === 'projects') {
      // /api/projects/:id
      if (parts.length === 3) {
        handlerPath = './api/projects/[id].ts'
      }

      // /api/projects/:projectId/stages
      if (parts.length >= 4 && parts[3] === 'stages') {
        if (parts.length === 4) {
          handlerPath = './api/projects/[projectId]/stages.ts'
        } else if (parts.length === 5) {
          handlerPath = './api/projects/[projectId]/stages/[stageId].ts'
        }
      }
    }
  }

  if (!handlerPath) {
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
    const handler = await getHandler(handlerPath)

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
