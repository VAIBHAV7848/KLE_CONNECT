import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import NotFound from '@/pages/NotFound';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const AuthCallback = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isProcessing, setIsProcessing] = useState(true);
    const [isNotFound, setIsNotFound] = useState(false);

    // Watch for user state — once set, redirect home
    useEffect(() => {
        if (user) {
            console.log('[AuthCallback] User ready, redirecting home...');
            navigate('/', { replace: true });
        }
    }, [user, navigate]);

    useEffect(() => {
        let mounted = true;

        const handleCallback = async () => {
            const hash = window.location.hash;       // e.g. "#/access_token=..." or "#access_token=..."
            const search = window.location.search;   // e.g. "?error=server_error&..."
            const searchParams = new URLSearchParams(search);

            console.log('[AuthCallback] hash:', hash, '| search:', search);

            // ─── Helper ──────────────────────────────────────────────────────
            const parseParams = (str: string) => new URLSearchParams(str);

            // Strip leading "#/" or "#" to get raw param string
            const hashContent = hash.startsWith('#/') ? hash.slice(2)
                : hash.startsWith('#') ? hash.slice(1)
                    : '';

            // ─── 1. Error in query params (?error=...) ───────────────────────
            const queryError = searchParams.get('error');
            if (queryError) {
                const desc = searchParams.get('error_description') || 'Please try again.';
                console.error('[AuthCallback] Error in query params:', queryError, desc);
                if (mounted) {
                    toast({ title: 'Google Sign-In Failed', description: decodeURIComponent(desc), variant: 'destructive' });
                    window.history.replaceState(null, '', '/');
                    navigate('/auth', { replace: true });
                }
                return;
            }

            // ─── 2. Error in hash path (/#/error=...) ───────────────────────
            if (hashContent.startsWith('error=')) {
                const p = parseParams(hashContent);
                const desc = p.get('error_description') || 'Please try again.';
                console.error('[AuthCallback] Error in hash path:', p.get('error'), desc);
                if (mounted) {
                    toast({ title: 'Google Sign-In Failed', description: decodeURIComponent(desc), variant: 'destructive' });
                    window.history.replaceState(null, '', '/');
                    navigate('/auth', { replace: true });
                }
                return;
            }

            // ─── 3. Success: access_token in hash ────────────────────────────
            // HashRouter makes it /#/access_token=... so Supabase can't auto-parse.
            // We manually extract and call setSession().
            if (hashContent.includes('access_token=')) {
                console.log('[AuthCallback] access_token found — setting session manually...');
                try {
                    const params = parseParams(hashContent);
                    const accessToken = params.get('access_token');
                    const refreshToken = params.get('refresh_token') || '';

                    if (!accessToken) throw new Error('No access_token found in URL');

                    const { data, error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
                    if (error) throw error;

                    window.history.replaceState(null, '', '/#/auth');
                    console.log('[AuthCallback] Session set:', data.session?.user?.email);

                    if (mounted) {
                        toast({
                            title: 'Signed in successfully',
                            description: `Welcome, ${data.session?.user?.user_metadata?.full_name || data.session?.user?.email}!`,
                        });
                    }
                    // Navigation triggered by user state update in effect above
                } catch (err: any) {
                    console.error('[AuthCallback] setSession error:', err);
                    if (mounted) {
                        toast({ title: 'Sign-in failed', description: err.message || 'Could not complete sign-in.', variant: 'destructive' });
                        window.history.replaceState(null, '', '/');
                        navigate('/auth', { replace: true });
                    }
                }
                return;
            }

            // ─── 4. Nothing OAuth-related — redirect to auth ─────────────────
            if (!user && mounted) {
                navigate('/auth', { replace: true });
            }
        };

        if (!user) {
            handleCallback();
        }

        return () => { mounted = false; };
    }, [navigate, user]);

    // Safety timeout
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (isProcessing && !user) {
                console.warn('[AuthCallback] Timeout — showing 404');
                setIsProcessing(false);
                setIsNotFound(true);
            }
        }, 10000);
        return () => clearTimeout(timeout);
    }, [isProcessing, user]);

    if (isProcessing || user) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background">
                <Loader2 className="w-10 h-10 animate-spin text-primary opacity-50" />
            </div>
        );
    }

    if (isNotFound) {
        return <NotFound />;
    }

    return null;
};

export default AuthCallback;
