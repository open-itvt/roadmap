import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { authApi } from '@/api/auth'

const DEV_BYPASS_USERNAME = 'admin'
const DEV_BYPASS_PASSWORD = '22377755111+'

export function DevBypassPage() {
  const navigate = useNavigate()
  const { checkAuth } = useAuth()
  const [message, setMessage] = useState('Signing you in...')

  useEffect(() => {
    const runBypass = async () => {
      if (import.meta.env.MODE !== 'development') {
        setMessage('This temporary bypass is only available in development.')
        return
      }

      try {
        const response = await authApi.bypassTmp(DEV_BYPASS_USERNAME, DEV_BYPASS_PASSWORD)
        localStorage.setItem('sessionToken', response.sessionToken)
        await checkAuth()
        navigate('/roadmap-manage', { replace: true })
      } catch (error) {
        console.error('Dev bypass login failed:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        setMessage(`Bypass login failed: ${errorMessage}`)
      }
    }

    void runBypass()
  }, [navigate])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center shadow-2xl">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />
        <h1 className="text-2xl font-bold">Temporary Dev Login</h1>
        <p className="mt-2 text-slate-400">{message}</p>
        <p className="mt-4 text-xs text-slate-500">This route only bypasses 2FA in development.</p>
      </div>
    </div>
  )
}