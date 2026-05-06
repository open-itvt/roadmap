import apiClient from './client'
import type { ApiResponse } from '@/types'

export interface InitAuthRequest {
  username: string
}

export interface InitAuthResponse {
  sessionId: string
  qrCode: string
}

export interface VerifyTotpRequest {
  sessionId: string
  totpCode: string
}

export interface SetPasswordRequest {
  sessionId: string
  password: string
}

export interface LoginRequest {
  username: string
  password: string
  totpCode: string
}

export interface LoginResponse {
  sessionToken: string
  adminId: string
}

function unwrapResponse<T>(data: ApiResponse<T>): T {
  if (data.data !== undefined) {
    return data.data
  }

  if (data.success && typeof data === 'object' && data !== null) {
    return data as unknown as T
  }

  throw new Error(data.error || 'Invalid response from API')
}

export interface WebAuthnStartResponse {
  sessionId: string
  challenge: string
  timeout: number
  userVerification: string
  attestation: string
}

export interface WebAuthnVerifyRequest {
  sessionId: string
  response: any // Credential response from browser
}

export const authApi = {
  // First-time setup: Initialize 2FA
  initAuth: async (username: string): Promise<InitAuthResponse> => {
    const { data } = await apiClient.post<ApiResponse<InitAuthResponse>>('/api/auth/init', { username })
    return unwrapResponse<InitAuthResponse>(data)
  },

  // First-time setup: Verify TOTP code
  verifyTotp: async (sessionId: string, totpCode: string): Promise<{ success: boolean }> => {
    const { data } = await apiClient.post<ApiResponse<{ success: boolean }>>('/api/auth/verify-totp', {
      sessionId,
      totpCode,
    })
    return unwrapResponse<{ success: boolean }>(data)
  },

  // First-time setup: Set password
  setPassword: async (sessionId: string, password: string): Promise<{ success: boolean }> => {
    const { data } = await apiClient.post<ApiResponse<{ success: boolean }>>('/api/auth/set-password', {
      sessionId,
      password,
    })
    return unwrapResponse<{ success: boolean }>(data)
  },

  // Subsequent logins
  login: async (username: string, password: string, totpCode: string): Promise<LoginResponse> => {
    const { data } = await apiClient.post<ApiResponse<LoginResponse>>('/api/auth/login', {
      username,
      password,
      totpCode,
    })
    const payload = unwrapResponse<LoginResponse>(data)
    if (!payload?.sessionToken) {
      throw new Error('Login response missing session token')
    }
    return payload
  },

  // Logout
  logout: async (): Promise<void> => {
    await apiClient.post('/api/auth/logout')
    localStorage.removeItem('sessionToken')
  },

  // Check if authenticated
  checkAuth: async (): Promise<{ isAuthenticated: boolean; adminId?: string; isSetupComplete?: boolean; adminExists?: boolean }> => {
    try {
      const { data } = await apiClient.get<ApiResponse<{ isAuthenticated: boolean; adminId?: string; isSetupComplete?: boolean; adminExists?: boolean }>>('/api/auth/me')
      return data.data!
    } catch {
      return { isAuthenticated: false }
    }
  },

  // WebAuthn: Start registration
  webAuthnStartRegistration: async (username: string): Promise<WebAuthnStartResponse> => {
    const { data } = await apiClient.post<ApiResponse<WebAuthnStartResponse>>('/api/auth/webauthn/register/start', { username })
    return data.data!
  },

  // WebAuthn: Complete registration
  webAuthnCompleteRegistration: async (sessionId: string, response: any): Promise<{ success: boolean }> => {
    const { data } = await apiClient.post<ApiResponse<{ success: boolean }>>('/api/auth/webauthn/register/complete', {
      sessionId,
      response,
    })
    return data.data!
  },

  // WebAuthn: Start authentication
  webAuthnStartAuth: async (): Promise<WebAuthnStartResponse> => {
    const { data } = await apiClient.post<ApiResponse<WebAuthnStartResponse>>('/api/auth/webauthn/auth/start', {})
    return data.data!
  },

  // WebAuthn: Complete authentication
  webAuthnCompleteAuth: async (sessionId: string, response: any): Promise<LoginResponse> => {
    const { data } = await apiClient.post<ApiResponse<LoginResponse>>('/api/auth/webauthn/auth/complete', {
      sessionId,
      response,
    })
    return data.data!
  },

  // Reset all admin data (for development/testing)
  resetAllAdminData: async (): Promise<{ success: boolean }> => {
    const { data } = await apiClient.post<ApiResponse<{ success: boolean }>>('/api/admin/reset')
    localStorage.removeItem('sessionToken')
    return data.data!
  },
}
