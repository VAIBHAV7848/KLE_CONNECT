import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GraduationCap, Mail, Lock, User, ArrowLeft, Loader2, Phone, UserCircle, ShieldCheck } from 'lucide-react';
import { z } from 'zod';

const signUpSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  // Email Auth State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Phone Auth State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const { signUp, signIn, signInWithGoogle, signInAnonymously, signInWithPhone, verifyPhoneOtp, resetPassword, changePassword, user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Handle OAuth callback
  useEffect(() => {
    const hash = window.location.hash;
    const handleOAuthCallback = async () => {
      // Check for OAuth success (access_token in hash)
      if (hash.includes('access_token=')) {
        setOauthLoading(true);
        try {
          const accessTokenIndex = hash.indexOf('access_token=');
          const paramsString = hash.substring(accessTokenIndex);
          const params = new URLSearchParams(paramsString);

          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken) {
            console.log('[Auth] Processing OAuth callback...');
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });

            if (error) throw error;

            // Clear the hash to clean up URL
            window.history.replaceState(null, '', '/#/auth');

            toast({
              title: 'Signed in successfully',
              description: 'Welcome back!',
            });

            // Navigation will happen automatically via the user state change
          }
        } catch (error: any) {
          console.error('[Auth] OAuth callback error:', error);
          toast({
            title: 'Sign in failed',
            description: error.message || 'Failed to complete sign in',
            variant: 'destructive',
          });
          setOauthLoading(false);
        }
      }

      // Check for error in hash
      if (hash.includes('error=')) {
        const params = new URLSearchParams(hash.substring(hash.indexOf('error=')));
        const errorDescription = params.get('error_description');
        toast({
          title: 'Sign in failed',
          description: errorDescription || 'An error occurred during sign in',
          variant: 'destructive',
        });
      }
    };

    // Check for recovery token
    if (hash.includes('type=recovery')) {
      setIsResettingPassword(true);
      toast({
        title: 'Reset Password',
        description: 'Please enter your new password below.',
      });
    }

    handleOAuthCallback();
  }, [navigate, toast]);

  // Redirect to home if already authenticated
  useEffect(() => {
    if (user && !authLoading) {
      navigate('/', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const validateEmailForm = () => {
    try {
      if (isSignUp) {
        signUpSchema.parse({ fullName, email, password });
      } else {
        signInSchema.parse({ email, password });
      }
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmailForm()) return;

    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          // DETERMINISTIC ERROR HANDLING: Display error from Supabase without automatic mode switching
          // Automatic switching causes auth loops - let user decide to switch manually
          const shouldRedirectToSignIn = (error as any).shouldRedirectToSignIn;

          if (shouldRedirectToSignIn ||
            error.message?.includes('User already registered') ||
            error.message?.includes('already exists')) {
            toast({
              title: 'Account Already Exists',
              description: 'This email is already registered. Please sign in instead, or use "Forgot Password" if you need to reset your credentials.',
              variant: 'destructive',
            });
            // CRITICAL: Do NOT auto-switch modes - this causes infinite loops
            // Instead, show clear message and let user manually switch
          } else {
            toast({
              title: 'Sign up failed',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Welcome to KLE CONNECT!',
            description: 'Your account has been created successfully.',
          });
          navigate('/');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          // DETERMINISTIC ERROR HANDLING: Map Supabase error codes to user-friendly messages
          // Error information comes ONLY from Supabase - no client-side inference
          if (error.message?.includes('Invalid login credentials')) {
            toast({
              title: 'Invalid Credentials',
              description: 'The email or password you entered is incorrect. Please try again or use "Forgot Password" to reset.',
              variant: 'destructive',
            });
          } else if (error.message?.includes('Email not confirmed')) {
            toast({
              title: 'Email Not Confirmed',
              description: 'Please check your email and click the confirmation link before signing in.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Sign in failed',
              description: error.message || 'Unable to sign in. Please try again.',
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Welcome back!',
            description: 'You have signed in successfully.',
          });
          navigate('/');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) {
      setErrors({ phoneNumber: 'Phone number is required' });
      return;
    }

    // Auto-format phone number: Remove all spaces, dashes, and extra chars
    let formattedNumber = phoneNumber.replace(/\D/g, '');

    // Add +91 if it's 10 digits and doesn't have it
    if (formattedNumber.length === 10) {
      formattedNumber = `+91${formattedNumber}`;
    } else if (!phoneNumber.startsWith('+')) {
      formattedNumber = `+${formattedNumber}`;
    } else {
      formattedNumber = `+${formattedNumber}`;
    }

    // Basic validation before sending
    // E.164 format: +[country code][number]
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(formattedNumber)) {
      setErrors({ phoneNumber: 'Invalid phone number format. Use E.164 format (e.g., +919876543210)' });
      return;
    }

    setLoading(true);
    setErrors({}); // Clear previous errors

    try {
      const { error } = await signInWithPhone(formattedNumber);
      if (error) {
        console.error("OTP Send Error:", error);

        let errorMessage = error.message;
        if (error.message.includes('invalid-phone-number')) {
          errorMessage = "Invalid phone number format. We added +91 automatically, but it still failed. Please check the number.";
        }

        toast({
          title: 'Failed to send OTP',
          description: errorMessage,
          variant: 'destructive',
        });
      } else {
        setOtpSent(true);
        toast({
          title: 'OTP Sent',
          description: `We've sent a code to ${formattedNumber}`,
        });
      }
    } catch (err: any) {
      console.error("Catch Error:", err);

      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !otpSent) return;

    // Format phone number again
    let formattedNumber = phoneNumber.replace(/\D/g, '');
    if (formattedNumber.length === 10) {
      formattedNumber = `+91${formattedNumber}`;
    } else if (!phoneNumber.startsWith('+')) {
      formattedNumber = `+${formattedNumber}`;
    } else {
      formattedNumber = `+${formattedNumber}`;
    }

    setLoading(true);
    try {
      const { error } = await verifyPhoneOtp(formattedNumber, otp);
      if (error) {
        toast({
          title: 'Verification Failed',
          description: 'Invalid OTP. Please try again.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Phone number verified successfully!',
        });
        navigate('/');
      }
    } catch (error: any) {
      toast({
        title: 'Verification Failed',
        description: 'Invalid OTP. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrors({ email: 'Email is required' });
      return;
    }
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Reset link sent',
        description: 'Check your email for the password reset link.',
      });
      setIsForgotPassword(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setErrors({ password: 'Password must be at least 6 characters' });
      return;
    }
    setLoading(true);
    const { error } = await changePassword(password);
    setLoading(false);
    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Your password has been reset. You can now sign in.',
      });
      setIsResettingPassword(false);
      navigate('/auth');
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    const { error } = await signInAnonymously();
    setLoading(false);
    if (error) {
      toast({
        title: 'Guest Login Failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Welcome Guest!',
        description: 'You are now logged in anonymously.',
      });
      navigate('/');
    }
  };

  // Show loading state while processing OAuth
  if (oauthLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
          <div className="relative glass w-20 h-20 rounded-2xl flex items-center justify-center border-primary/30">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 max-w-sm"
        >
          <h2 className="text-2xl font-bold font-display text-gradient">Securing Session</h2>
          <p className="text-muted-foreground">
            We're finalizing your secure connection to KLE CONNECT. This usually takes just a moment...
          </p>
          <div className="pt-4">
            <button
              onClick={() => {
                setOauthLoading(false);
                window.history.replaceState(null, '', '/#/auth');
              }}
              className="text-xs text-muted-foreground hover:text-primary underline underline-offset-4 transition-colors p-2"
            >
              Take me back to sign-in
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" />

      {/* Back button */}
      <Link
        to="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back to home</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="glass rounded-2xl p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, hsl(199 89% 48% / 0.3), hsl(263 70% 58% / 0.3))' }}
              >
                <GraduationCap className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold font-display">
              <span className="text-gradient">KLE</span>
              <span className="text-foreground"> CONNECT</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-2">
              Welcome to the student portal
            </p>
          </div>

          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="phone">Phone</TabsTrigger>
            </TabsList>

            <TabsContent value="email">
              {isResettingPassword ? (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="New Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 bg-muted border-border"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Update Password'}
                  </Button>
                  <div className="text-center mt-2">
                    <button type="button" onClick={() => setIsResettingPassword(false)} className="text-xs text-muted-foreground hover:text-primary">
                      Cancel
                    </button>
                  </div>
                </form>
              ) : isForgotPassword ? (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-muted border-border"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Send Reset Link'}
                  </Button>
                  <div className="text-center mt-2">
                    <button type="button" onClick={() => setIsForgotPassword(false)} className="text-xs text-muted-foreground hover:text-primary">
                      Back to Login
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  {isSignUp && (
                    <div>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Full Name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="pl-10 bg-muted border-border"
                        />
                      </div>
                      {errors.fullName && (
                        <p className="text-destructive text-xs mt-1">{errors.fullName}</p>
                      )}
                    </div>
                  )}

                  <div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 bg-muted border-border"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-destructive text-xs mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 bg-muted border-border"
                      />
                    </div>
                    {errors.password && (
                      <p className="text-destructive text-xs mt-1">{errors.password}</p>
                    )}
                  </div>

                  {!isSignUp && (
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => setIsForgotPassword(true)}
                        className="text-[10px] text-muted-foreground hover:text-primary uppercase tracking-wider font-bold"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {isSignUp ? 'Creating account...' : 'Signing in...'}
                      </>
                    ) : (
                      isSignUp ? 'Create Account' : 'Sign In'
                    )}
                  </Button>
                  <div className="text-center mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(!isSignUp);
                        setErrors({});
                      }}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                    </button>
                  </div>
                </form>
              )}
            </TabsContent>

            <TabsContent value="phone">
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="tel"
                        placeholder="+1 234 567 8900"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="pl-10 bg-muted border-border"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 ml-1">Include country code (e.g. +91 for India)</p>
                    {errors.phoneNumber && (
                      <p className="text-destructive text-xs mt-1">{errors.phoneNumber}</p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send OTP"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="pl-10 bg-muted border-border"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify OTP"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="w-full text-xs text-muted-foreground hover:text-primary mt-2"
                  >
                    Change phone number
                  </button>
                </form>
              )}
            </TabsContent>
          </Tabs>

          <div className="relative my-6">
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                const { error } = await signInWithGoogle();
                if (error) {
                  setLoading(false);
                  toast({
                    title: 'Google Sign In failed',
                    description: error.message,
                    variant: 'destructive',
                  });
                }
              }}
            >
              <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
              </svg>
              Google
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={loading}
              onClick={handleGuestLogin}
            >
              <UserCircle className="mr-2 h-4 w-4" />
              Continue as Guest
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
