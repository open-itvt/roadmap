import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Mock API plugin for development
function mockApiPlugin() {
  return {
    name: 'mock-api',
    configResolved(config: any) {
      // Only apply in dev
      if (config.command !== 'serve') return
    },
    async transform(code: string, id: string) {
      return null
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    middlewareMode: false,
    middleware: [
      (req, res, next) => {
        // Mock API responses for /api routes
        if (!req.url?.startsWith('/api')) {
          next()
          return
        }

        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Credentials', 'true')
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        // Mock responses
        const mockResponses: Record<string, any> = {
          '/api/auth/me': {
            success: true,
            data: {
              isAuthenticated: false,
              isSetupComplete: false,
              adminExists: false,
            },
          },
        }

        const response = mockResponses[req.url!]
        if (response) {
          res.statusCode = 200
          res.end(JSON.stringify(response))
          return
        }

        // Default 404
        res.statusCode = 404
        res.end(JSON.stringify({ error: 'Not found' }))
      },
    ],
  },
})
