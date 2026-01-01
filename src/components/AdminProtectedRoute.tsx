import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { UserRole } from '@/types/auth';

interface AdminProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: UserRole[];
}

const AdminProtectedRoute = ({ children, allowedRoles }: AdminProtectedRouteProps) => {
    const { user, loading, isAdmin, role } = useAuth();

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    // 1. Basic Admin Check
    if (!user || !isAdmin) {
        return <Navigate to="/" replace />;
    }

    // 2. Specific Role Check (if allowedRoles is provided)
    if (allowedRoles && !allowedRoles.includes(role)) {
        // User is an admin but doesn't have the SPECIFIC required role
        return <Navigate to="/dashboard" replace />; // Or a 403 page
    }

    return <>{children}</>;
};

export default AdminProtectedRoute;
