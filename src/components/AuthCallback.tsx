import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import NotFound from '@/pages/NotFound';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const AuthCallback = () => {
    const navigate = useNavigate();
    const { user } = useAuth(); // Consume auth context
    const [isProcessing, setIsProcessing] = useState(true);
    const [isNotFound, setIsNotFound] = useState(false);

    // 1. Watch for user state update - this is the safest way to know Supabase has synced
    useEffect(() => {
        if (user) {
            console.log('[AuthCallback] User context updated, redirecting to home...');
            navigate('/', { replace: true });
        }
    }, [user, navigate]);

    useEffect(() => {
        let mounted = true;

        const handleCallback = async () => {
            const hash = window.location.hash;
            const search = window.location.search;
            const searchParams = new URLSearchParams(search);

            console.log('[AuthCallback] handling hash:', hash, 'search:', search);

            // ✅ Helper: parse error from URLSearchParams-style string
            const extractOAuthError = (paramString: string) => {
                const params = new URLSearchParams(paramString);
                return {
                    error: params.get('error'),
                    description: params.get('error_description'),
                };
            };

            // ✅ 1. Check for errors in QUERY PARAMS (?error=...)
            const queryError = searchParams.get('error');
            const queryErrorDescription = searchParams.get('error_description');
            if (queryError) {
                console.error('[AuthCallback] OAuth error in query params:', queryError, queryErrorDescription);
                if (mounted) {
                    toast({
                        title: "Google Sign-In Failed",
                        description: queryErrorDescription
                            ? decodeURIComponent(queryErrorDescription)
                            : "Unable to complete sign-in. Please try again.",
                        variant: "destructive"
                    });
                    window.history.replaceState(null, '', '/');
                    navigate('/auth', { replace: true });
                }
                return;
            }

            // ✅ 2. Check for errors in HASH PATH (/#/error=... from HashRouter)
            // e.g. hash = "#/error=server_error&error_description=..."
            const hashPath = hash.startsWith('#/') ? hash.slice(2) : hash.slice(1);
            if (hashPath.startsWith('error=')) {
                const { error: hashError, description: hashDesc } = extractOAuthError(hashPath);
                console.error('[AuthCallback] OAuth error in hash path:', hashError, hashDesc);
                if (mounted) {
                    toast({
                        title: "Google Sign-In Failed",
                        description: hashDesc
                            ? decodeURIComponent(hashDesc)
                            : "Unable to complete sign-in. Please try again.",
                        variant: "destructive"
                    });
                    window.history.replaceState(null, '', '/');
                    navigate('/auth', { replace: true });
                }
                return;
            }

            // Check if this is a successful OAuth callback (has access_token)
            const hasAccessToken = hash.includes('access_token=');
            const hasError = hash.includes('error=');

            if (!hasAccessToken && !hasError) {
                // Not an OAuth callback, redirect to auth
                if (!user && mounted) {
                    navigate('/auth', { replace: true });
                }
                return;
            }


            // Supabase auto-detects tokens from URL, so we just wait
            // The onAuthStateChange listener in useAuth will handle the rest
            console.log('[AuthCallback] Waiting for Supabase to auto-detect session...');

            // Give Supabase time to process (it reads hash automatically)
            setTimeout(async () => {
                if (!mounted) return;

                try {
                    const { data: { session }, error } = await supabase.auth.getSession();

                    if (error) {
                        console.error('[AuthCallback] getSession error:', error);
                        if (mounted) {
                            setIsProcessing(false);
                            setIsNotFound(true);
                        }
                        return;
                    }

                    if (session) {
                        console.log('[AuthCallback] Session detected:', session.user.email);
                        // Clear hash to clean up URL
                        window.history.replaceState(null, '', '/#/auth');
                        if (mounted) {
                            toast({
                                title: "Signed in successfully",
                                description: "Welcome back!",
                            });
                        }
                    } else {
                        console.warn('[AuthCallback] No session detected');
                        if (mounted) {
                            setIsProcessing(false);
                            setIsNotFound(true);
                        }
                    }
                } catch (error: any) {
                    // Handle AbortError silently - it's normal in StrictMode
                    if (error.name === 'AbortError' || error.message?.includes('AbortError')) {
                        console.log('[AuthCallback] Aborted (StrictMode), session will be detected by listener');
                        return;
                    }

                    console.error('[AuthCallback] Error:', error);
                    if (mounted) {
                        toast({
                            title: "Authentication Error",
                            description: error.message || "Failed to complete sign in",
                            variant: "destructive"
                        });
                        setIsProcessing(false);
                        setIsNotFound(true);
                    }
                }
            }, 500); // Wait 500ms for Supabase to process
        };

        if (!user) {
            handleCallback();
        }

        return () => {
            mounted = false;
        };
    }, [navigate, toast, user]);

    // Safety timeout: if processing takes too long, show error
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (isProcessing && !user) {
                console.log('[AuthCallback] Timeout reached, stopping processing');
                setIsProcessing(false);
                setIsNotFound(true);
            }
        }, 10000); // 10 second timeout

        return () => clearTimeout(timeout);
    }, [isProcessing, user]);

    if (isProcessing || user) { // Keep showing loader if we have a user (waiting for redirect)
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
