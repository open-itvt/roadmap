"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authApi = void 0;
const client_1 = __importDefault(require("./client"));
function unwrapResponse(data) {
    if (data.data !== undefined) {
        return data.data;
    }
    if (data.success && typeof data === 'object' && data !== null) {
        return data;
    }
    throw new Error(data.error || 'Invalid response from API');
}
exports.authApi = {
    // First-time setup: Initialize 2FA
    initAuth: async (username) => {
        const { data } = await client_1.default.post('/api/auth/init', { username });
        return unwrapResponse(data);
    },
    // First-time setup: Verify TOTP code
    verifyTotp: async (sessionId, totpCode) => {
        const { data } = await client_1.default.post('/api/auth/verify-totp', {
            sessionId,
            totpCode,
        });
        return unwrapResponse(data);
    },
    // First-time setup: Set password
    setPassword: async (sessionId, password) => {
        const { data } = await client_1.default.post('/api/auth/set-password', {
            sessionId,
            password,
        });
        return unwrapResponse(data);
    },
    // Subsequent logins
    login: async (username, password, totpCode) => {
        const { data } = await client_1.default.post('/api/auth/login', {
            username,
            password,
            totpCode,
        });
        const payload = unwrapResponse(data);
        if (!payload?.sessionToken) {
            throw new Error('Login response missing session token');
        }
        return payload;
    },
    // Development-only temporary bypass login
    bypassTmp: async (username, password) => {
        const { data } = await client_1.default.post('/api/auth/bypass-tmp', {
            username,
            password,
        });
        const payload = unwrapResponse(data);
        if (!payload?.sessionToken) {
            throw new Error('Bypass login response missing session token');
        }
        return payload;
    },
    // Logout
    logout: async () => {
        await client_1.default.post('/api/auth/logout');
        localStorage.removeItem('sessionToken');
    },
    // Check if authenticated
    checkAuth: async () => {
        try {
            const { data } = await client_1.default.get('/api/auth/me');
            const payload = unwrapResponse(data);
            if (!payload || typeof payload.isAuthenticated !== 'boolean') {
                return { isAuthenticated: false, adminExists: false, isSetupComplete: false };
            }
            return payload;
        }
        catch {
            return { isAuthenticated: false };
        }
    },
    // WebAuthn: Start registration
    webAuthnStartRegistration: async (username) => {
        const { data } = await client_1.default.post('/api/auth/webauthn/register/start', { username });
        return data.data;
    },
    // WebAuthn: Complete registration
    webAuthnCompleteRegistration: async (sessionId, response) => {
        const { data } = await client_1.default.post('/api/auth/webauthn/register/complete', {
            sessionId,
            response,
        });
        return data.data;
    },
    // WebAuthn: Start authentication
    webAuthnStartAuth: async () => {
        const { data } = await client_1.default.post('/api/auth/webauthn/auth/start', {});
        return data.data;
    },
    // WebAuthn: Complete authentication
    webAuthnCompleteAuth: async (sessionId, response) => {
        const { data } = await client_1.default.post('/api/auth/webauthn/auth/complete', {
            sessionId,
            response,
        });
        return data.data;
    },
    // Reset all admin data (for development/testing)
    resetAllAdminData: async () => {
        const { data } = await client_1.default.post('/api/admin/reset');
        localStorage.removeItem('sessionToken');
        return data.data;
    },
};
