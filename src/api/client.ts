import axios, { AxiosInstance } from 'axios'

// Create axios instance with base configuration
import { API_BASE_URL } from '@/config/hosts'

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL || '',
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
