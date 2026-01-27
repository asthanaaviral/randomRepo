
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import LoginPage from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import ComposePage from '@/pages/ComposePage';
import EmailDetailPage from '@/pages/EmailDetailPage';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Placeholder ID - must be replaced!
const GOOGLE_CLIENT_ID = "GOOGLE_CLIENT_ID_PLACEHOLDER";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
};

const AppRoutes = () => {
    const { user } = useAuth();
    return (
        <Routes>
            <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
            <Route
                path="/compose"
                element={
                    <ProtectedRoute>
                        <ComposePage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/emails/:id"
                element={
                    <ProtectedRoute>
                        <EmailDetailPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }
            />
            <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
        </Routes>
    )
}

function App() {
    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <AuthProvider>
                <Router>
                    <AppRoutes />
                </Router>
            </AuthProvider>
        </GoogleOAuthProvider>
    )
}

export default App
