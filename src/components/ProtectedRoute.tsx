import { useAuth } from '@/contexts/AuthContext'
import { Navigate } from 'react-router-dom'
import { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
  requireSetup?: boolean
}

export function ProtectedRoute({ children, requireSetup = false }: ProtectedRouteProps) {
  const { isAuthenticated, isSetupComplete, loading, adminExists } = useAuth()

  const hasDevBypassToken =
    import.meta.env.MODE === 'development' &&
    typeof window !== 'undefined' &&
    localStorage.getItem('sessionToken')?.startsWith('dev:')

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    if (hasDevBypassToken) {
      return <>{children}</>
    }

    if (adminExists) {
      return <Navigate to="/auth/login" replace />
    }

    return <Navigate to="/auth/setup" replace />
  }

  if (requireSetup && !isSetupComplete) {
    return <Navigate to="/auth/setup" replace />
  }

  return <>{children}</>
}
