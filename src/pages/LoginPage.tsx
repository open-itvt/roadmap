import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { authApi } from '@/api/auth'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [useWebAuthn, setUseWebAuthn] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await login(username, password, totpCode)
      navigate('/roadmap-manage', { replace: true })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleWebAuthnLogin = async () => {
    setLoading(true)
    setError('')

    try {
      const startResponse = await authApi.webAuthnStartAuth()
      
      // Convert server challenge to ArrayBuffer
      const challenge = Uint8Array.from(atob(startResponse.challenge), c => c.charCodeAt(0))
      
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: startResponse.timeout,
          userVerification: startResponse.userVerification as UserVerificationRequirement,
        },
      }) as any

      if (!credential) {
        throw new Error('WebAuthn authentication cancelled')
      }

      const response = await authApi.webAuthnCompleteAuth(startResponse.sessionId, {
        id: credential.id,
        rawId: credential.id,
        response: {
          clientDataJSON: credential.response.clientDataJSON,
          authenticatorData: credential.response.authenticatorData,
          signature: credential.response.signature,
        },
        type: credential.type,
      })

      localStorage.setItem('sessionToken', response.sessionToken)
      navigate('/roadmap-manage', { replace: true })
    } catch (err: any) {
      setError(err.message || 'WebAuthn authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Login</h1>
          <p className="text-slate-400">Manage your roadmap</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded text-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-300"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">2FA Code</label>
            <input
              type="text"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-center text-lg tracking-widest font-mono"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="px-2 bg-slate-950 text-slate-500">Or continue with</span>
          </div>
        </div>

        {/* WebAuthn / Passkey login */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleWebAuthnLogin}
            disabled={loading}
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded font-medium hover:border-slate-600 disabled:opacity-50 transition"
          >
            {loading ? 'Authenticating...' : '🔑 Passkey / WebAuthn'}
          </button>

          <button
            type="button"
            onClick={() => setUseWebAuthn(!useWebAuthn)}
            className="w-full px-4 py-2 bg-slate-900/50 text-slate-400 rounded text-sm hover:text-slate-300 transition"
          >
            {useWebAuthn ? 'Back to password login' : 'Need setup?'}
          </button>
        </div>
      </div>
    </div>
  )
}
