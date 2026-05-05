// Type definitions for the application

export interface Project {
  id: string
  name: string
  description: string
  icon: string
  status: 'active' | 'completed' | 'archived'
  priority: 'high' | 'medium' | 'low'
  progress: number
  startDate: string
  lastUpdate: string
  teamSize: number
  technologies: string[]
  goals: string[]
  createdAt: string
  updatedAt: string
}

export interface Stage {
  id: string
  projectId: string
  name: string
  description: string
  status: 'pending' | 'in-progress' | 'completed' | 'blocked'
  icon: string
  order: number
  progress?: number
  createdAt: string
  updatedAt: string
}

// Type aliases for creation payloads (excluding auto-generated fields)
export type ProjectCreatePayload = Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
export type StageCreatePayload = Omit<Stage, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>

export interface AdminUser {
  id: string
  username: string
  email?: string
  passwordHash: string
  totpSecret?: string
  webauthnCredentials: WebAuthnCredential[]
  createdAt: string
  updatedAt: string
  lastLogin?: string
  isSetupComplete: boolean
}

export interface WebAuthnCredential {
  id: string
  credentialId: string
  publicKey: string
  signCount: number
  transports?: AuthenticatorTransport[]
  createdAt: string
}

export interface SessionData {
  adminId: string
  sessionId: string
  expiresAt: number
  createdAt: number
}

export interface AuthState {
  isAuthenticated: boolean
  adminId?: string
  isSetupComplete?: boolean
  loading: boolean
}

export type AuthenticatorTransport = 'usb' | 'nfc' | 'ble' | 'internal' | 'hybrid'

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}
