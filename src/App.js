"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_router_dom_1 = require("react-router-dom");
const AuthContext_1 = require("@/contexts/AuthContext");
const ProtectedRoute_1 = require("@/components/ProtectedRoute");
const PublicView_1 = require("@/pages/PublicView");
const LoginPage_1 = require("@/pages/LoginPage");
const SetupPage_1 = require("@/pages/SetupPage");
const AdminPanelScreen_1 = require("@/pages/AdminPanelScreen");
const DevBypassPage_1 = require("@/pages/DevBypassPage");
const DemoPage_1 = require("@/pages/DemoPage");
function SetupRoute({ children }) {
    const { adminExists, loading } = (0, AuthContext_1.useAuth)();
    if (loading) {
        return (<div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>);
    }
    if (adminExists) {
        return <react_router_dom_1.Navigate to="/auth/login" replace/>;
    }
    return <>{children}</>;
}
function HomeRoute() {
    const { isAuthenticated, loading } = (0, AuthContext_1.useAuth)();
    if (loading) {
        return (<div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>);
    }
    if (isAuthenticated) {
        return <react_router_dom_1.Navigate to="/roadmap-manage" replace/>;
    }
    return <PublicView_1.PublicView />;
}
function App() {
    return (<react_router_dom_1.BrowserRouter>
      <AuthContext_1.AuthProvider>
        <react_router_dom_1.Routes>
          {/* Public routes */}
          <react_router_dom_1.Route path="/" element={<HomeRoute />}/>
          <react_router_dom_1.Route path="/auth/login" element={<LoginPage_1.LoginPage />}/>
          <react_router_dom_1.Route path="/auth/bypass-tmp" element={<DevBypassPage_1.DevBypassPage />}/>
          <react_router_dom_1.Route path="/demo" element={<DemoPage_1.DemoPage />}/>
          <react_router_dom_1.Route path="/auth/setup/*" element={<SetupRoute><SetupPage_1.SetupPage /></SetupRoute>}/>

          {/* Protected routes */}
          <react_router_dom_1.Route path="/roadmap-manage" element={<ProtectedRoute_1.ProtectedRoute requireSetup={true}>
                <AdminPanelScreen_1.AdminPanelScreen />
              </ProtectedRoute_1.ProtectedRoute>}/>

          {/* Catch all */}
          <react_router_dom_1.Route path="*" element={<react_router_dom_1.Navigate to="/" replace/>}/>
        </react_router_dom_1.Routes>
      </AuthContext_1.AuthProvider>
    </react_router_dom_1.BrowserRouter>);
}
exports.default = App;
