import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading, isAdmin } = useAuth();
    const [isLockdownActive, setIsLockdownActive] = useState(false);

    useEffect(() => {
        // Listen to Supabase for global lockdown status
        const fetchLockdownStatus = async () => {
            const { data, error } = await supabase
                .from('system_settings')
                .select('lockdown')
                .eq('id', 1)
                .single();

            if (!error && data) {
                setIsLockdownActive(data.lockdown === true);
            }
        };

        fetchLockdownStatus();

        // Subscribe to realtime changes
        const subscription = supabase
            .channel('system_settings_changes')
            .on('postgres_changes', 
                { event: 'UPDATE', schema: 'public', table: 'system_settings', filter: 'id=eq.1' },
                (payload) => {
                    const newData = payload.new as any;
                    setIsLockdownActive(newData.lockdown === true);
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // FIRST: Check if loading
    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background">
                <Loader2 className="w-10 h-10 animate-spin text-primary opacity-50" />
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
