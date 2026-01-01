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
import { auth, googleProvider } from '@/lib/firebase';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
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
    const ADMIN_EMAILS = [
      'jayashriinagle720@gmail.com',
      'jayashriingale720@gmail.com'
    ];

    if (ADMIN_EMAILS.includes(normalizedEmail) && password === 'VAIBHAV2667') {
      const adminUser = {
        email: normalizedEmail,
        displayName: 'Master Administrator',
        uid: 'admin-001',
        emailVerified: true
      } as User;

      setUser(adminUser);
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
      // Set a timeout for the popup to detect slow loading
      const popupPromise = signInWithPopup(auth, googleProvider);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Popup timeout')), 60000) // 60 second timeout
      );

      await Promise.race([popupPromise, timeoutPromise]);
      return { error: null };
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);

      // Provide helpful error messages based on the error type
      if (error.code === 'auth/popup-closed-by-user') {
        return {
          error: new Error('Sign-in cancelled. Please try again and complete the Google sign-in process.')
        };
      }

      if (error.code === 'auth/popup-blocked') {
        return {
          error: new Error('Popup was blocked by your browser. Please allow popups for this site and try again.')
        };
      }

      if (error.code === 'auth/unauthorized-domain') {
        return {
          error: new Error('This domain is not authorized. Please contact the administrator.')
        };
      }

      if (error.message === 'Popup timeout') {
        return {
          error: new Error('Sign-in is taking too long. Please check your internet connection and try again.')
        };
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
  };

  const ADMIN_EMAILS = [
    'jayashriinagle720@gmail.com',
    'jayashriingale720@gmail.com'
  ];

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
      isAdmin: !!user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase().trim())
    }}>
      {children}
    </AuthContext.Provider>
  );
};
