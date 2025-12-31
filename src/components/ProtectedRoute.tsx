import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import { database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading, isAdmin } = useAuth();
    const [isLockdownActive, setIsLockdownActive] = useState(false);

    useEffect(() => {
        // Listen to Firebase Realtime Database for global lockdown status
        const lockdownRef = ref(database, 'system/lockdown');
        const unsubscribe = onValue(lockdownRef, (snapshot) => {
            const status = snapshot.val();
            setIsLockdownActive(status === true);
        });

        // Cleanup listener on unmount
        return () => unsubscribe();
    }, []);

    // FIRST: Check if loading
    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    // SECOND: Check if user is logged in - if not, redirect to login
    if (!user) {
        return <Navigate to="/auth" replace />;
    }

    // THIRD: Only NOW check lockdown (user is already authenticated)
    // Block non-admin users during lockdown
    if (isLockdownActive && !isAdmin) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full glass rounded-3xl p-8 border border-red-500/30 bg-gradient-to-br from-red-600/10 to-transparent text-center"
                >
                    <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6 border-2 border-red-500/30">
                        <ShieldAlert className="w-10 h-10 text-red-400 animate-pulse" />
                    </div>
                    <h1 className="text-2xl font-bold text-red-400 mb-3">
                        🚨 Emergency Lockdown Active
                    </h1>
                    <p className="text-gray-400 mb-6">
                        The KLE Connect platform is currently under emergency lockdown due to security protocols.
                        All student access has been temporarily suspended.
                    </p>
                    <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                        <p className="text-xs text-gray-500">
                            Please contact your campus administrator for more information.
                            Normal operations will resume once the lockdown is lifted.
                        </p>
                    </div>
                </motion.div>
            </div>
        );
    }

    return <>{children}</>;
};

export default ProtectedRoute;
