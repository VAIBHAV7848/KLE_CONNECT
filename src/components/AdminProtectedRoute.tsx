import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading, isAdmin } = useAuth();

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user || !isAdmin) {
        // Redirect to home if not an admin
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

export default AdminProtectedRoute;
