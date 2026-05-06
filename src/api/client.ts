import axios, { AxiosInstance } from 'axios'

// Create axios instance with base configuration
import { API_BASE_URL } from '@/config/hosts'

function resolveBaseURL(): string {
  if (!API_BASE_URL) {
    return ''
  }

  if (typeof window === 'undefined') {
    return API_BASE_URL
  }

  try {
    const envUrl = new URL(API_BASE_URL)
    const currentOrigin = window.location.origin

    if (envUrl.origin === currentOrigin) {
      return ''
    }

    const samePort = envUrl.port === window.location.port
    const localhostAlias =
      (envUrl.hostname === 'localhost' && window.location.hostname === '127.0.0.1') ||
      (envUrl.hostname === '127.0.0.1' && window.location.hostname === 'localhost')

    if (samePort && localhostAlias) {
      return ''
    }
  } catch {
    // ignore invalid URL and fall back to configured value
  }

  return API_BASE_URL
}

const apiClient: AxiosInstance = axios.create({
  baseURL: resolveBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Request interceptor to add auth token
apiClient.interceptors.request.use((config) => {
  const sessionToken = localStorage.getItem('sessionToken')
  if (sessionToken) {
    config.headers.Authorization = `Bearer ${sessionToken}`
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear session and redirect to login
      localStorage.removeItem('sessionToken')
      window.location.href = '/auth/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient
