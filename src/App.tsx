import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ReactNode } from 'react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { PublicView } from '@/pages/PublicView'
import { LoginPage } from '@/pages/LoginPage'
import { SetupPage } from '@/pages/SetupPage'
import { AdminPanel } from '@/pages/AdminPanel'
import { DevBypassPage } from '@/pages/DevBypassPage'

function SetupRoute({ children }: { children: ReactNode }) {
  const { adminExists, loading } = useAuth()

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

  if (adminExists) {
    return <Navigate to="/auth/login" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<PublicView />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/bypass-tmp" element={<DevBypassPage />} />
          <Route path="/auth/setup/*" element={<SetupRoute><SetupPage /></SetupRoute>} />

          {/* Protected routes */}
          <Route
            path="/roadmap-manage"
            element={
              <ProtectedRoute requireSetup={true}>
                <AdminPanel />
              </ProtectedRoute>
            }
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
