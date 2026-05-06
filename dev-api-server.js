import http from 'http'
import url from 'url'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Consolidated catch-all handler paths
const CATCH_ALL_ROUTES = [
  [/^\/api\/auth(\/.*)?$/, 'api/auth/[...path].ts', '/api/auth'],
  [/^\/api\/admin(\/.*)?$/, 'api/admin/[[...path]].ts', '/api/admin'],
  [/^\/api\/projects(\/.*)?$/, 'api/projects/[[...path]].ts', '/api/projects'],
]

// Load a handler by file path
async function loadHandler(filePath) {
  try {
    const module = await import(path.join(__dirname, filePath))
    return module.default
  } catch (error) {
    console.warn(`Warning: Could not load handler for ${filePath}:`, error.message)
    return null
  }
}

// Simple server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true)
  const pathname = parsedUrl.pathname

  // Log request
  console.log(`${req.method} ${pathname}`)

  let handler = null
  let pathSegments = []

  for (const [pattern, handlerPath, basePath] of CATCH_ALL_ROUTES) {
    if (pattern.test(pathname)) {
      handler = await loadHandler(handlerPath)
      const remaining = pathname.slice(basePath.length).replace(/^\//, '')
      pathSegments = remaining ? remaining.split('/') : []
      break
    }
  }

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
      req.query = { ...parsedUrl.query, ...(pathSegments.length > 0 ? { path: pathSegments } : {}) }
      handler(req, res)
    })
  } else {
    req.query = { ...parsedUrl.query, ...(pathSegments.length > 0 ? { path: pathSegments } : {}) }
    handler(req, res)
  }
})

const PORT = process.env.API_PORT || 3001
server.listen(PORT, () => {
  console.log(`API dev server listening on http://localhost:${PORT}`)
})

