"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProtectedRoute = ProtectedRoute;
const AuthContext_1 = require("@/contexts/AuthContext");
const react_router_dom_1 = require("react-router-dom");
function ProtectedRoute({ children, requireSetup = false }) {
    const { isAuthenticated, isSetupComplete, loading, adminExists } = (0, AuthContext_1.useAuth)();
    const hasDevBypassToken = import.meta.env.MODE === 'development' &&
        typeof window !== 'undefined' &&
        localStorage.getItem('sessionToken')?.startsWith('dev:');
    if (loading) {
        return (<div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>);
    }
    if (!isAuthenticated) {
        if (hasDevBypassToken) {
            return <>{children}</>;
        }
        if (adminExists) {
            return <react_router_dom_1.Navigate to="/auth/login" replace/>;
        }
        return <react_router_dom_1.Navigate to="/auth/setup" replace/>;
    }
    if (requireSetup && !isSetupComplete) {
        return <react_router_dom_1.Navigate to="/auth/setup" replace/>;
    }
    return <>{children}</>;
}
