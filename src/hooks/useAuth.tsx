import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, UserRole } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInAnonymously: () => Promise<{ error: Error | null }>;
  signInWithPhone: (phoneNumber: string) => Promise<{ error: Error | null }>;
  verifyPhoneOtp: (phoneNumber: string, token: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  role: UserRole;
  isOwner: boolean;
  updateUserProfile: (displayName: string) => Promise<{ error: Error | null }>;
  changePassword: (newPassword: string) => Promise<{ error: Error | null }>;
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

  // Subscribe to user profile changes
  useEffect(() => {
    if (!user?.uid) return;

    const subscription = supabase
      .channel('user_profile_changes')
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

    // Safety timeout: If Supabase takes too long (e.g. network issues), stop loading
    // This prevents the "infinite loading screen" issue
    const safetyTimer = setTimeout(() => {
      if (mounted && loading) {
        setLoading(false);
      }
    }, 2000);

    // Check current session
    const checkSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        if (session?.user) {
          console.log('[Auth] Session found for:', session.user.email);
          
          // 1. Set basic user immediately to unblock UI
          const isEnvOwner = session.user.email === OWNER_EMAIL;
          
          setUser({
            uid: session.user.id,
            email: session.user.email || '',
            displayName: session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'User',
            phoneNumber: session.user.phone || undefined,
            photoURL: session.user.user_metadata?.avatar_url || undefined,
          });
          
          if (isEnvOwner) {
            console.log('[Auth] Owner detected via environment variable');
            setRole('super_admin');
            setIsOwner(true);
          }

          // 2. Fetch profile in background
          fetchUserProfile(session.user.id).then(async (profile) => {
             // SYNC TO DB: If Env Owner, ensure DB reflects this
             if (isEnvOwner) {
                 const needsUpdate = !profile || profile.role !== 'super_admin' || !profile.is_owner;
                  if (needsUpdate) {
                      console.log('[Auth] Syncing owner status to Supabase DB...');
                       const { error: syncError } = await (supabase
                           .from('users')
                           .update as any)({ role: 'super_admin', is_owner: true, display_name: session.user.user_metadata?.display_name || 'System Owner' })
                           .eq('id', session.user.id);
                     
                     if (syncError) {
                         console.warn('[Auth] Could not sync to DB (requires RLS policy):', syncError.message);
                     } else {
                         console.log('[Auth] Successfully synced owner status to DB');
                         // Update profile ref if we just created/updated it
                         if (!profile) profile = { role: 'super_admin', is_owner: true, display_name: 'System Owner' };
                         else { profile.role = 'super_admin'; profile.is_owner = true; }
                     }
                 }
             }

             if (profile) {
                console.log('[Auth] Profile loaded in background');
                
                const finalRole = isEnvOwner ? 'super_admin' : (profile.role as UserRole);
                const finalIsOwner = isEnvOwner ? true : profile.is_owner;

                setUser(prev => prev ? ({
                  ...prev,
                  displayName: profile.display_name || prev.displayName,
                  role: finalRole
                }) : null);
                
                setRole(finalRole);
                setIsOwner(finalIsOwner);
             } else if (isEnvOwner) {
                setRole('super_admin');
                setIsOwner(true);
             }
          });
          
        } else {
            console.log('[Auth] No active session found.');
        }
      } catch (error: any) {
        // Suppress AbortError which happens on strict mode re-mounts
        if (error.name === 'AbortError' || error.message?.includes('AbortError')) {
            return;
        }
        console.error('[Auth] Unexpected error in checkSession:', error);
      } finally {
        if (mounted) {
            setLoading(false);
            clearTimeout(safetyTimer);
        }
      }
    };

    checkSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const isEnvOwner = session.user.email === OWNER_EMAIL;
        
        const isAnonymous = session.user.app_metadata?.provider === 'anonymous' || !session.user.email;
        
        // DIRECT GUEST LOGIN: Skip profile lookup for anonymous users
        if (isAnonymous) {
          setUser({
            uid: session.user.id,
            email: '',
            displayName: 'Guest User',
            role: 'user',
          });
          setRole('user');
          setIsOwner(false);
          setLoading(false);
          return;
        }

        let profile = await fetchUserProfile(session.user.id);
        
        // If no profile exists for non-guest users, wait for the trigger
        if (!profile) {
          // Profile creation is handled by the Database Trigger (handle_new_user)
          // We wait for the profile to appear
          let retries = 0;
          while (!profile && retries < 3) {
             await new Promise(r => setTimeout(r, 500));
             profile = await fetchUserProfile(session.user.id);
             retries++;
          }
          
          if (!profile) {
             console.warn('[Auth] Profile not found after trigger wait. Trigger might be broken.');
          }
        }
        
        if (profile) {
          const finalRole = isEnvOwner ? 'super_admin' : (profile.role as UserRole);
          const finalIsOwner = isEnvOwner ? true : profile.is_owner;

          setUser({
            uid: session.user.id,
            email: session.user.email || '',
            displayName: profile.display_name || session.user.email?.split('@')[0] || 'User',
            phoneNumber: session.user.phone || undefined,
            photoURL: session.user.user_metadata?.avatar_url || undefined,
            role: finalRole,
          });
          setRole(finalRole);
          setIsOwner(finalIsOwner);
        } else {
          setUser({
            uid: session.user.id,
            email: session.user.email || '',
            displayName: session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'User',
            phoneNumber: session.user.phone || undefined,
            photoURL: session.user.user_metadata?.avatar_url || undefined,
          });
          
          if (isEnvOwner) {
              setRole('super_admin');
              setIsOwner(true);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setRole('user');
        setIsOwner(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: fullName,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Create user profile in database
        const { error: profileError } = await (supabase.from('users').insert as any)({
          id: data.user.id,
          email: email,
          display_name: fullName,
          role: 'user',
          status: 'Active',
          is_owner: false,
        });

        if (profileError) throw profileError;
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    try {
      // Master Admin Bypass for Presentation Reliability
      const response = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const adminUser = data.adminUser as User;
          setUser(adminUser);
          setRole('super_admin');
          localStorage.setItem('admin_session', 'true');
          return { error: null };
        }
      }
    } catch (e) {
      console.warn('[Auth] Admin proxy failed, falling back to standard auth');
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          skipBrowserRedirect: false,
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
    // 1. Immediate UI update
    setUser(null);
    setRole('user');
    setIsOwner(false);
    
    // 2. Clear local storage
    localStorage.removeItem('admin_session');
    
    // 3. Attempt supabase logout
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
