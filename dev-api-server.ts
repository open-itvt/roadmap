import http from 'http'
import { fileURLToPath } from 'url'
import path from 'path'

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
  '/api/auth/webauthn/auth/start': './api/auth/webauthn/auth/start.ts',
  '/api/auth/webauthn/auth/complete': './api/auth/webauthn/auth/complete.ts',
  '/api/auth/webauthn/register/start': './api/auth/webauthn/register/start.ts',
  '/api/auth/webauthn/register/complete': './api/auth/webauthn/register/complete.ts',
  '/api/admin/reset': './api/admin/reset.ts',
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

// Create server
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`)
  const pathname = url.pathname

  console.log(`${req.method} ${pathname}`)

  const handlerPath = routeMap[pathname]

  if (!handlerPath) {
    res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
    res.end(JSON.stringify({ error: 'Not found', success: false }))
    return
  }

  try {
    const handler = await getHandler(handlerPath)

    if (!handler) {
      res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
      res.end(JSON.stringify({ error: 'Handler not found', success: false }))
      return
    }

    // Parse body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(req.method || 'GET')) {
      const body = await parseBody(req)
      ;(req as any).body = body
    }

    // Call handler
    await handler(req, res)
  } catch (error: any) {
    console.error('Handler error:', error)
    res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
    res.end(JSON.stringify({ error: error.message || 'Internal server error', success: false }))
  }
})

const PORT = process.env.API_PORT || 3001
server.listen(PORT, () => {
  console.log(`API dev server listening on http://localhost:${PORT}`)
  console.log('Ready to accept requests')
})
