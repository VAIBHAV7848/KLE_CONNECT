import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  signInWithPopup,
  signInAnonymously as firebaseSignInAnonymously,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { auth, googleProvider, database } from '@/lib/firebase';
import { ref, get, set, onValue } from 'firebase/database';
import { UserRole } from '@/types/auth';

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
  }
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInAnonymously: () => Promise<{ error: Error | null }>;
  setUpRecaptcha: (elementId: string) => RecaptchaVerifier;
  signInWithPhone: (phoneNumber: string, appVerifier: RecaptchaVerifier) => Promise<{ confirmationResult: ConfirmationResult | null, error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  role: UserRole;
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
  const [loading, setLoading] = useState(true);

  // Define admin emails in scope
  const ADMIN_EMAILS = [
    'jayashriinagle720@gmail.com',
    'jayashriingale720@gmail.com'
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      let isMaintenanceMode = false;
      const maintenanceRef = ref(database, 'system/maintenance');
      onValue(maintenanceRef, (snap) => {
        isMaintenanceMode = snap.val() === true;
      }, { onlyOnce: true });

      if (firebaseUser) {
        // 1. Check if Master Admin (Hardcoded Safety Net)
        const email = firebaseUser.email?.toLowerCase().trim() || '';
        const isMasterAdmin = ADMIN_EMAILS.includes(email);

        if (isMasterAdmin) {
          setRole('super_admin');
          // Ensure DB is in sync for these critical users
          const roleRef = ref(database, `users/${firebaseUser.uid}/role`);
          get(roleRef).then((snapshot) => {
            if (snapshot.val() !== 'super_admin') {
              set(roleRef, 'super_admin');
            }
          });
        } else {
          // 2. Fetch Role & Status from DB
          const userRef = ref(database, `users/${firebaseUser.uid}`);

          // Real-time listener for status changes (Banning)
          onValue(userRef, async (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.val();
              const userRole = data.role as UserRole || 'user';
              const userStatus = data.status || 'Active';

              // ENFORCE BAN
              if (userStatus === 'Suspended') {
                await firebaseSignOut(auth);
                setUser(null);
                setRole('user');
                alert("Your account has been suspended by the administrator.");
                return;
              }

              // ENFORCE MAINTENANCE (Non-admins gets kicked)
              if (isMaintenanceMode && userRole === 'user') {
                await firebaseSignOut(auth);
                setUser(null);
                setRole('user');
                alert("System is currently under maintenance. Please try again later.");
                return;
              }

              setRole(userRole);
            } else {
              setRole('user');
            }
          });
        }
      } else {
        setRole('user');
      }

      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // In a real app, you might want to save the fullName to a database or update the profile
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    // Master Admin Bypass for Presentation Reliability
    const normalizedEmail = email.trim().toLowerCase();

    if (ADMIN_EMAILS.includes(normalizedEmail) && password === 'VAIBHAV2667') {
      const adminUser = {
        email: normalizedEmail,
        displayName: 'Master Administrator',
        uid: 'admin-001',
        emailVerified: true
      } as User;

      setUser(adminUser);
      setRole('super_admin');
      localStorage.setItem('admin_session', 'true');
      return { error: null };
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const popupPromise = signInWithPopup(auth, googleProvider);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Popup timeout')), 60000)
      );

      await Promise.race([popupPromise, timeoutPromise]);
      return { error: null };
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);

      if (error.code === 'auth/popup-closed-by-user') {
        return { error: new Error('Sign-in cancelled. Please try again.') };
      }
      if (error.code === 'auth/popup-blocked') {
        return { error: new Error('Popup was blocked by your browser.') };
      }
      if (error.code === 'auth/unauthorized-domain') {
        return { error: new Error('This domain is not authorized.') };
      }
      if (error.message === 'Popup timeout') {
        return { error: new Error('Sign-in is taking too long.') };
      }

      return { error: error as Error };
    }
  };

  const signInAnonymously = async () => {
    try {
      await firebaseSignInAnonymously(auth);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const setUpRecaptcha = (elementId: string) => {
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
    }

    window.recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
      'size': 'invisible',
      'callback': () => {
        // reCAPTCHA solved
      }
    });
    return window.recaptchaVerifier;
  };

  const signInWithPhone = async (phoneNumber: string, appVerifier: RecaptchaVerifier) => {
    try {
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      return { confirmationResult, error: null };
    } catch (error) {
      return { confirmationResult: null, error: error as Error };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('admin_session');
    await firebaseSignOut(auth);
    setUser(null);
    setRole('user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signUp,
      signIn,
      signInWithGoogle,
      signInAnonymously,
      setUpRecaptcha,
      signInWithPhone,
      signOut,
      isAdmin: role !== 'user', // Derived from role being non-user
      role
    }}>
      {children}
    </AuthContext.Provider>
  );
};
