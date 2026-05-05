// Central CORS helper for simple dev server usage
export function handleCors(req: any, res: any) {
  const origin = req.headers.origin || ''
  const allowed = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173').split(',').map((s) => s.trim())

  // Always allow any origin in dev (includes localhost/127.0.0.1)
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  } else {
    res.setHeader('Access-Control-Allow-Origin', allowed[0] || '*')
  }

  // Always allow credentials in dev
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,PUT,DELETE,PATCH')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  res.setHeader('Access-Control-Max-Age', '86400')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return true
  }

  return false
}
