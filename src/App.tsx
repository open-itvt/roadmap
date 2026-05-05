import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { PublicView } from '@/pages/PublicView'
import { LoginPage } from '@/pages/LoginPage'
import { SetupPage } from '@/pages/SetupPage'
import { AdminPanel } from '@/pages/AdminPanel'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<PublicView />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/setup" element={<SetupPage />} />

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
