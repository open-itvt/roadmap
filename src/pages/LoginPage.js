"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginPage = LoginPage;
const react_1 = require("react");
const fa_1 = require("react-icons/fa");
const react_router_dom_1 = require("react-router-dom");
const AuthContext_1 = require("@/contexts/AuthContext");
const auth_1 = require("@/api/auth");
function LoginPage() {
    const navigate = (0, react_router_dom_1.useNavigate)();
    const { login } = (0, AuthContext_1.useAuth)();
    const [username, setUsername] = (0, react_1.useState)('');
    const [password, setPassword] = (0, react_1.useState)('');
    const [totpCode, setTotpCode] = (0, react_1.useState)('');
    const [showPassword, setShowPassword] = (0, react_1.useState)(false);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)('');
    const base64UrlToBuffer = (value) => {
        const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
        const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
        const binary = atob(padded);
        const buffer = new Uint8Array(binary.length);
        for (let index = 0; index < binary.length; index += 1) {
            buffer[index] = binary.charCodeAt(index);
        }
        return buffer.buffer;
    };
    const bufferToBase64Url = (value) => {
        const bytes = new Uint8Array(value);
        let binary = '';
        for (const byte of bytes) {
            binary += String.fromCharCode(byte);
        }
        return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    };
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await login(username, password, totpCode);
            navigate('/roadmap-manage', { replace: true });
        }
        catch (err) {
            const rawError = err?.response?.data?.error || 'Login failed. Please try again.';
            setError(typeof rawError === 'string' ? rawError : String(rawError));
        }
        finally {
            setLoading(false);
        }
    };
    const handleWebAuthnLogin = async () => {
        setLoading(true);
        setError('');
        try {
            const startResponse = await auth_1.authApi.webAuthnStartAuth();
            const challenge = base64UrlToBuffer(startResponse.challenge);
            const credential = await navigator.credentials.get({
                publicKey: {
                    challenge,
                    timeout: startResponse.timeout,
                    userVerification: startResponse.userVerification,
                },
            });
            if (!credential) {
                throw new Error('WebAuthn authentication cancelled');
            }
            const publicKeyCredential = credential;
            const assertion = publicKeyCredential.response;
            const response = await auth_1.authApi.webAuthnCompleteAuth(startResponse.sessionId, {
                id: publicKeyCredential.id,
                rawId: bufferToBase64Url(publicKeyCredential.rawId),
                response: {
                    clientDataJSON: bufferToBase64Url(assertion.clientDataJSON),
                    authenticatorData: bufferToBase64Url(assertion.authenticatorData),
                    signature: bufferToBase64Url(assertion.signature),
                    userHandle: assertion.userHandle ? bufferToBase64Url(assertion.userHandle) : undefined,
                },
                type: publicKeyCredential.type,
            });
            localStorage.setItem('sessionToken', response.sessionToken);
            navigate('/roadmap-manage', { replace: true });
        }
        catch (err) {
            setError(err?.message || 'WebAuthn authentication failed');
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Login</h1>
          <p className="text-slate-400">Manage your roadmap</p>
        </div>

        {error && (<div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded text-red-200 text-sm">
            {error}
          </div>)}

        <form onSubmit={handleLogin} className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" required autoComplete="username"/>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" required autoComplete="current-password"/>
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-300">
                {showPassword ? <fa_1.FaEye /> : <fa_1.FaEyeSlash />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">2FA Code</label>
            <input type="text" value={totpCode} onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" maxLength={6} className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-center text-lg tracking-widest font-mono" required/>
          </div>

          <button type="submit" disabled={loading} className="w-full px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50 transition">
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
          <button type="button" onClick={handleWebAuthnLogin} disabled={loading} className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded font-medium hover:border-slate-600 disabled:opacity-50 transition">
            {loading ? 'Authenticating...' : (<><fa_1.FaKey className="inline-block mr-2"/> Passkey / WebAuthn</>)}
          </button>

        </div>
      </div>
    </div>);
}
