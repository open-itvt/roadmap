import { useState } from 'react'
import { FaEye, FaEyeSlash, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import { authApi } from '@/api/auth'
import { generateRandomPassword, validatePasswordStrength } from '@/utils/crypto'

export function SetupPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'init' | 'totp' | 'password'>('init')
  const [username, setUsername] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [passwordStrength, setPasswordStrength] = useState({ isStrong: false, feedback: [] as string[] })

  const handleInitAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await authApi.initAuth(username)
      setSessionId(response.sessionId)
      setQrCode(response.qrCode)
      setStep('totp')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to initialize authentication')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyTotp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await authApi.verifyTotp(sessionId, totpCode)
      setStep('password')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid TOTP code')
    } finally {
      setLoading(false)
    }
  }

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!passwordStrength.isStrong) {
      setError('Password does not meet security requirements')
      return
    }

    setLoading(true)
    setError('')

    try {
      await authApi.setPassword(sessionId, password)
      navigate('/auth/login', { replace: true })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to set password')
    } finally {
      setLoading(false)
    }
  }

  const handleGeneratePassword = () => {
    const newPassword = generateRandomPassword(16)
    setPassword(newPassword)
    setPasswordStrength(validatePasswordStrength(newPassword))
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value
    setPassword(newPassword)
    setPasswordStrength(validatePasswordStrength(newPassword))
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Setup Admin Account</h1>
          <p className="text-slate-400">Configure your authentication</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Initialize Auth */}
        {step === 'init' && (
          <form onSubmit={handleInitAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Admin Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading ? 'Processing...' : 'Next'}
            </button>
          </form>
        )}

        {/* Step 2: Verify TOTP */}
        {step === 'totp' && (
          <form onSubmit={handleVerifyTotp} className="space-y-6">
            <div className="bg-slate-900 p-6 rounded border border-slate-800 flex justify-center">
              <div className="bg-white p-4 rounded">
                <img
                  src={qrCode}
                  alt="TOTP QR code"
                  className="h-[200px] w-[200px]"
                />
              </div>
            </div>

            <div>
              <p className="text-sm text-slate-400 mb-4">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, Microsoft Authenticator, etc.)
              </p>
              <label className="block text-sm font-medium mb-2">Enter the 6-digit code</label>
              <input
                type="text"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-center text-2xl tracking-widest font-mono"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || totpCode.length !== 6}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>
        )}

        {/* Step 3: Set Password */}
        {step === 'password' && (
          <form onSubmit={handleSetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Admin Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Create a strong password"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-300"
                >
                  {showPassword ? <FaEye /> : <FaEyeSlash />}
                </button>
              </div>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="mt-2 text-sm text-blue-400 hover:text-blue-300 underline"
              >
                Generate random password
              </button>
            </div>

            {/* Password strength feedback */}
            {password && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`h-2 flex-1 rounded ${passwordStrength.isStrong ? 'bg-green-600' : 'bg-orange-600'}`}></div>
                  <span className="text-xs font-medium">
                    {passwordStrength.isStrong ? (<><FaCheckCircle className="inline-block mr-1" /> Strong</>) : (<><FaExclamationTriangle className="inline-block mr-1" /> Weak</>)}
                  </span>
                </div>
                {passwordStrength.feedback.length > 0 && (
                  <ul className="text-xs text-slate-400 space-y-1">
                    {passwordStrength.feedback.map((item, i) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !passwordStrength.isStrong}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading ? 'Setting up...' : 'Complete Setup'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
