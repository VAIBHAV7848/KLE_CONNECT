import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase, logLoginEvent } from '@/lib/supabase';
import type { User, UserRole } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null; data?: any }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; data?: any }>;
  signInWithGoogle: () => Promise<{ error: Error | null; data?: any }>;
  signInAnonymously: () => Promise<{ error: Error | null; data?: any }>;
  signInWithPhone: (phoneNumber: string) => Promise<{ error: Error | null; data?: any }>;
  verifyPhoneOtp: (phoneNumber: string, token: string) => Promise<{ error: Error | null; data?: any }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  role: UserRole;
  isOwner: boolean;
  updateUserProfile: (displayName: string) => Promise<{ error: Error | null; data?: any }>;
  changePassword: (newPassword: string) => Promise<{ error: Error | null; data?: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('user');
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  // Define admin emails from environment variables
  const ADMIN_EMAILS = [
    import.meta.env.VITE_PLATFORM_OWNER_EMAIL,
    import.meta.env.VITE_SECONDARY_ADMIN_EMAIL
  ].filter(Boolean);

  const OWNER_EMAIL = import.meta.env.VITE_PLATFORM_OWNER_EMAIL;

  // Fetch user profile from database
  const fetchUserProfile = async (userId: string): Promise<any> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // Ignore abort errors which happen on strict mode re-renders
        if (error.code === '' && error.details?.includes('AbortError')) {
          return null;
        }
        console.error('Error fetching user profile:', error);
        return null;
      }
      return data;
    } catch (error: any) {
      if (error.name === 'AbortError' || error.message?.includes('AbortError')) {
        return null;
      }
      console.error('Unexpected error fetching profile:', error);
      return null;
    }
  };

  // Subscribe to user profile changes (live role/status updates)
  useEffect(() => {
    if (!user?.uid) return;

    const subscription = supabase
      .channel(`user_profile_${user.uid}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'users', filter: `id=eq.${user.uid}` },
        async (payload) => {
          const profile = payload.new as any;
          if (profile) {
            setRole(profile.role as UserRole);
            setIsOwner(profile.is_owner);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.uid]);

  useEffect(() => {
    let mounted = true;

    // Safety timeout: prevents infinite loading screen
    const safetyTimer = setTimeout(() => {
      if (mounted && loading) setLoading(false);
    }, 2500);

    // Single source of truth for Auth State
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] Event:', event);

      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        const userEmail = (session.user.email || '').toLowerCase();
        // Check against ENV or hardcoded fallback for absolute safety
        const isEnvOwner = userEmail === (OWNER_EMAIL || '').toLowerCase() || userEmail === 'jayashriingale720@gmail.com';

        const isAnonymous = session.user.app_metadata?.provider === 'anonymous' || !session.user.email;
        const isGoogle = session.user.app_metadata?.provider === 'google';
        const isPhone = session.user.app_metadata?.provider === 'phone';

        // Determine login event type
        let loginEventType: any = 'EMAIL_LOGIN';
        if (isAnonymous) loginEventType = 'GUEST_LOGIN';
        else if (isGoogle) loginEventType = 'GOOGLE_LOGIN';
        else if (isPhone) loginEventType = 'PHONE_LOGIN';

        // 1. Set basic user info immediately
        const userData: User = {
          uid: session.user.id,
          email: session.user.email || '',
          displayName: session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || (isAnonymous ? 'Guest User' : 'User'),
          phoneNumber: session.user.phone || undefined,
          photoURL: session.user.user_metadata?.avatar_url || undefined,
          role: isEnvOwner ? 'super_admin' : 'user',
        };

        if (mounted) {
          setUser(userData);
          if (isEnvOwner) {
            setRole('super_admin');
            setIsOwner(true);
          }
        }

        // 2. Log login event ONLY if it's a fresh SIGNED_IN (not just a refresh/initial)
        if (event === 'SIGNED_IN') {
          logLoginEvent(
            session.user.id,
            session.user.email || null,
            userData.displayName,
            loginEventType,
            session.access_token
          );

          // Update last_seen
          (supabase.from('users').update as any)({ last_seen: new Date().toISOString() }).eq('id', session.user.id).then(() => { });
        }

        // 3. Fetch detailed profile in background
        if (!isAnonymous) {
          fetchUserProfile(session.user.id).then(profile => {
            if (mounted && profile) {
              const finalRole = isEnvOwner ? 'super_admin' : (profile.role as UserRole);
              const finalIsOwner = isEnvOwner ? true : profile.is_owner;

              setUser(prev => prev ? ({ ...prev, displayName: profile.display_name || prev.displayName, role: finalRole }) : null);
              setRole(finalRole);
              setIsOwner(finalIsOwner);
            }
            if (mounted) setLoading(false);
          });
        } else {
          if (mounted) setLoading(false);
        }

      } else if (event === 'SIGNED_OUT') {
        if (mounted) {
          const prevUser = user;
          setUser(null);
          setRole('user');
          setIsOwner(false);
          setLoading(false);

          if (prevUser?.uid) {
            logLoginEvent(prevUser.uid, prevUser.email || null, prevUser.displayName, 'SIGNED_OUT');
          }
        }
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        logLoginEvent(session.user.id, session.user.email || null, null, 'TOKEN_REFRESHED', session.access_token);
      } else {
        // Handle case where INITIAL_SESSION is null (no user logged in)
        if (mounted && event === 'INITIAL_SESSION') {
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(safetyTimer);
    };
  }, []);


  const signUp = async (email: string, password: string, fullName: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            display_name: fullName,
          },
        },
      });

      if (error) {
        const enhancedError = new Error(error.message);
        (enhancedError as any).code = error.code || 'AUTH_ERROR';
        (enhancedError as any).status = error.status;

        if (error.message?.includes('User already registered') ||
          error.message?.includes('already exists') ||
          error.status === 422) {
          (enhancedError as any).shouldRedirectToSignIn = true;
        }

        throw enhancedError;
      }

      if (data.user) {
        console.log('[Auth] User created, profile will be created by database trigger');
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      return { error: null, data };
    } catch (error) {
      return { error: error as Error, data: null };
    }
  };

  const signIn = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    try {
      // Master Admin Bypass
      const MASTER_PASSWORD = import.meta.env.VITE_MASTER_ADMIN_PASSWORD;
      const OWNER_EMAIL_ENV = import.meta.env.VITE_PLATFORM_OWNER_EMAIL;
      const SECONDARY_EMAIL = import.meta.env.VITE_SECONDARY_ADMIN_EMAIL;

      const isAdmin = normalizedEmail === OWNER_EMAIL_ENV || normalizedEmail === SECONDARY_EMAIL;

      if (isAdmin && password === MASTER_PASSWORD) {
        console.info('[Auth] Master admin bypass activated for:', normalizedEmail);
        const adminUser: User = {
          uid: 'admin-bypass-' + btoa(normalizedEmail).substring(0, 10),
          email: normalizedEmail,
          displayName: normalizedEmail === OWNER_EMAIL_ENV ? 'Platform Owner' : 'Platform Administrator',
          role: 'super_admin',
        };
        setUser(adminUser);
        setRole('super_admin');
        setIsOwner(normalizedEmail === OWNER_EMAIL_ENV);
        localStorage.setItem('admin_session', 'true');

        // Log bypass login
        await logLoginEvent(null, normalizedEmail, adminUser.displayName, 'EMAIL_LOGIN');

        return { error: null, data: { user: adminUser, session: null } };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        const enhancedError = new Error(error.message);
        (enhancedError as any).code = error.code || 'AUTH_ERROR';
        (enhancedError as any).status = error.status;
        throw enhancedError;
      }

      localStorage.removeItem('admin_session');
      return { error: null, data };
    } catch (error) {
      return { error: error as Error, data: null };
    }
  };

  const signInWithGoogle = async () => {
    try {
      // Use origin + hash path so AuthCallback receives the OAuth token correctly
      // HashRouter apps need the full /#/auth path in redirectTo
      const redirectTo = `${window.location.origin}/`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: false,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signInAnonymously = async () => {
    try {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signInWithPhone = async (phoneNumber: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneNumber,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const verifyPhoneOtp = async (phoneNumber: string, token: string) => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: token,
        type: 'sms',
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    // Immediate UI update
    setUser(null);
    setRole('user');
    setIsOwner(false);

    // Clear local storage
    localStorage.removeItem('admin_session');

    // Attempt Supabase logout
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Supabase sign out error:", error);
    }
  };

  const updateUserProfile = async (displayName: string) => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('No user logged in');

      // Update auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { display_name: displayName }
      });

      if (authError) throw authError;

      // Update database profile
      const { error: dbError } = await (supabase
        .from('users')
        .update as any)({ display_name: displayName })
        .eq('id', currentUser.id);

      if (dbError) throw dbError;

      // Update local state
      setUser(prev => prev ? { ...prev, displayName } : null);

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const changePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signUp,
      signIn,
      signInWithGoogle,
      signInAnonymously,
      signInWithPhone,
      verifyPhoneOtp,
      signOut,
      isAdmin: role !== 'user',
      role,
      isOwner,
      updateUserProfile,
      changePassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};
