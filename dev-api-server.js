import http from 'http'
import url from 'url'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Handler mapping for API routes
const handlers = {}

// Map routes from /api folder structure
// e.g., api/auth/me.ts -> /api/auth/me
const routeMap = {
  '/api/auth/me': 'api/auth/me.ts',
  '/api/auth/init': 'api/auth/init.ts',
  '/api/auth/login': 'api/auth/login.ts',
  '/api/auth/logout': 'api/auth/logout.ts',
  '/api/auth/verify-totp': 'api/auth/verify-totp.ts',
  '/api/auth/set-password': 'api/auth/set-password.ts',
  '/api/auth/bypass-tmp': 'api/auth/bypass-tmp.ts',
  '/api/auth/webauthn/auth/start': 'api/auth/webauthn/auth/start.ts',
  '/api/auth/webauthn/auth/complete': 'api/auth/webauthn/auth/complete.ts',
  '/api/auth/webauthn/register/start': 'api/auth/webauthn/register/start.ts',
  '/api/auth/webauthn/register/complete': 'api/auth/webauthn/register/complete.ts',
  '/api/admin/reset': 'api/admin/reset.ts',
  '/api/projects': 'api/projects.ts',
}

// Load handlers dynamically
async function loadHandlers() {
  for (const [route, filePath] of Object.entries(routeMap)) {
    try {
      const module = await import(path.join(__dirname, filePath))
      handlers[route] = module.default
    } catch (error) {
      console.warn(`Warning: Could not load handler for ${route}:`, error.message)
    }
  }
}

// Simple server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true)
  const pathname = parsedUrl.pathname

  // Log request
  console.log(`${req.method} ${pathname}`)

  // Find matching handler
  const handler = handlers[pathname]

  if (!handler) {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Not found' }))
    return
  }

  // Parse body for POST/PUT/PATCH
  let body = ''
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    req.on('data', (chunk) => {
      body += chunk.toString()
    })
    req.on('end', () => {
      try {
        req.body = body ? JSON.parse(body) : {}
      } catch {
        req.body = {}
      }
      handler(req, res)
    })
  } else {
    handler(req, res)
  }
})

// Load handlers and start server
await loadHandlers()

const PORT = process.env.API_PORT || 3001
server.listen(PORT, () => {
  console.log(`API dev server listening on http://localhost:${PORT}`)
})
