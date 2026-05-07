"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DemoPage = DemoPage;
const react_1 = require("react");
const react_router_dom_1 = require("react-router-dom");
const AuthContext_1 = require("@/contexts/AuthContext");
const auth_1 = require("@/api/auth");
const endpoints_1 = require("@/api/endpoints");
const DEV_BYPASS_USERNAME = 'admin';
const DEV_BYPASS_PASSWORD = '22377755111+';
function DemoPage() {
    const navigate = (0, react_router_dom_1.useNavigate)();
    const { checkAuth } = (0, AuthContext_1.useAuth)();
    const [message, setMessage] = (0, react_1.useState)('Preparing demo...');
    (0, react_1.useEffect)(() => {
        const runDemo = async () => {
            if (import.meta.env.MODE !== 'development') {
                setMessage('Demo only available in development.');
                return;
            }
            try {
                const response = await auth_1.authApi.bypassTmp(DEV_BYPASS_USERNAME, DEV_BYPASS_PASSWORD);
                localStorage.setItem('sessionToken', response.sessionToken);
                await endpoints_1.initApi.initialize();
                await checkAuth();
                navigate('/roadmap-manage', { replace: true });
            }
            catch (error) {
                console.error('Demo login failed:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                setMessage(`Demo login failed: ${errorMessage}`);
            }
        };
        void runDemo();
    }, [checkAuth, navigate]);
    return (<div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center shadow-2xl">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500"/>
        <h1 className="text-2xl font-bold">Demo Preview</h1>
        <p className="mt-2 text-slate-400">{message}</p>
        <p className="mt-4 text-xs text-slate-500">Signing in as development admin…</p>
      </div>
    </div>);
}
exports.default = DemoPage;
