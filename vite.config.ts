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
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
