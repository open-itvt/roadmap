"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthProvider = AuthProvider;
exports.useAuth = useAuth;
const react_1 = require("react");
const auth_1 = require("@/api/auth");
const AuthContext = (0, react_1.createContext)(undefined);
function AuthProvider({ children }) {
    const [state, setState] = (0, react_1.useState)({
        isAuthenticated: false,
        loading: true,
        adminExists: false,
    });
    // Check authentication on mount
    (0, react_1.useEffect)(() => {
        const checkAuth = async () => {
            try {
                const auth = await auth_1.authApi.checkAuth();
                setState({
                    isAuthenticated: auth.isAuthenticated,
                    adminId: auth.adminId,
                    isSetupComplete: auth.isSetupComplete,
                    adminExists: auth.adminExists ?? false,
                    loading: false,
                });
            }
            catch (error) {
                setState({
                    isAuthenticated: false,
                    loading: false,
                });
            }
        };
        checkAuth();
    }, []);
    const login = async (username, password, totpCode) => {
        try {
            const response = await auth_1.authApi.login(username, password, totpCode);
            localStorage.setItem('sessionToken', response.sessionToken);
            await checkAuth();
        }
        catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    };
    const logout = async () => {
        try {
            await auth_1.authApi.logout();
            setState({
                isAuthenticated: false,
                loading: false,
                adminExists: false,
            });
        }
        catch (error) {
            console.error('Logout failed:', error);
        }
    };
    const checkAuth = async () => {
        try {
            const auth = await auth_1.authApi.checkAuth();
            setState({
                isAuthenticated: auth.isAuthenticated,
                adminId: auth.adminId,
                isSetupComplete: auth.isSetupComplete,
                adminExists: auth.adminExists ?? false,
                loading: false,
            });
        }
        catch (error) {
            console.error('Auth check failed:', error);
            setState({
                isAuthenticated: false,
                loading: false,
            });
        }
    };
    return (<AuthContext.Provider value={{ ...state, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>);
}
function useAuth() {
    const context = (0, react_1.useContext)(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
