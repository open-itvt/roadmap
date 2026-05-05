import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { AuthState } from '@/types'
import { authApi } from '@/api/auth'

interface AuthContextType extends AuthState {
  login: (username: string, password: string, totpCode: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    loading: true,
  })

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const auth = await authApi.checkAuth()
        setState({
          isAuthenticated: auth.isAuthenticated,
          adminId: auth.adminId,
          isSetupComplete: auth.isSetupComplete,
          loading: false,
        })
      } catch (error) {
        setState({
          isAuthenticated: false,
          loading: false,
        })
      }
    }

    checkAuth()
  }, [])

  const login = async (username: string, password: string, totpCode: string) => {
    try {
      const response = await authApi.login(username, password, totpCode)
      localStorage.setItem('sessionToken', response.sessionToken)
      setState({
        isAuthenticated: true,
        adminId: response.adminId,
        isSetupComplete: true,
        loading: false,
      })
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
      setState({
        isAuthenticated: false,
        loading: false,
      })
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const checkAuth = async () => {
    try {
      const auth = await authApi.checkAuth()
      setState({
        isAuthenticated: auth.isAuthenticated,
        adminId: auth.adminId,
        isSetupComplete: auth.isSetupComplete,
        loading: false,
      })
    } catch (error) {
      console.error('Auth check failed:', error)
      setState({
        isAuthenticated: false,
        loading: false,
      })
    }
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
