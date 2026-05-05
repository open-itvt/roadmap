// Centralized API base configuration for frontend
export const API_BASE_URL = (import.meta.env as Record<string, any>).VITE_API_BASE_URL ?? ''
export const DEFAULT_ALLOWED_ORIGINS = (import.meta.env as Record<string, any>).VITE_ALLOWED_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173'
