import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, Home, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { getPasswordResetRedirectUrl, passwordRecoveryService } from '@/lib/authRecovery';

type AuthMode = 'login' | 'signup' | 'forgot' | 'reset';

const PASSWORD_MIN_LENGTH = 6;
const RECOVERY_SESSION_KEY = 'havenly-password-recovery-active';

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'student' | 'owner'>('student');
  const [submitting, setSubmitting] = useState(false);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [verifyingRecovery, setVerifyingRecovery] = useState(false);
  const [recoveryCooldownUntil, setRecoveryCooldownUntil] = useState<number>(0);
  const [recoveryRequestedForEmail, setRecoveryRequestedForEmail] = useState('');
  const recoveryToastShownRef = useRef(false);
  const { login, signup } = useApp();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const cooldownSeconds = useMemo(() => {
    if (!recoveryCooldownUntil) return 0;
    return Math.max(0, Math.ceil((recoveryCooldownUntil - Date.now()) / 1000));
  }, [recoveryCooldownUntil]);

  useEffect(() => {
    if (!recoveryCooldownUntil) return;
    const timer = window.setInterval(() => {
      if (Date.now() >= recoveryCooldownUntil) {
        setRecoveryCooldownUntil(0);
        window.clearInterval(timer);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [recoveryCooldownUntil]);

  useEffect(() => {
    if (searchParams.get('verified') !== 'true') return;
    toast.success('Email verified. Please sign in to continue.');
    setAuthMode('login');
    setSearchParams({});
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const recoveryModeRequested = searchParams.get('mode') === 'reset';
    const hash = typeof window !== 'undefined' ? window.location.hash.slice(1) : '';
    const hashParams = new URLSearchParams(hash);
    const hasRecoveryParams =
      searchParams.get('type') === 'recovery' ||
      searchParams.has('code') ||
      hashParams.get('type') === 'recovery' ||
      hashParams.has('access_token') ||
      hashParams.has('refresh_token');
    const hasStoredRecoveryState =
      typeof window !== 'undefined' && window.sessionStorage.getItem(RECOVERY_SESSION_KEY) === 'true';

    if (!recoveryModeRequested) return;

    let isActive = true;

    const cleanRecoveryUrl = () => {
      if (typeof window === 'undefined') return;
      const nextUrl = `${window.location.pathname}?mode=reset`;
      window.history.replaceState({}, document.title, nextUrl);
    };

    const markRecoveryReady = () => {
      if (!isActive) return;
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(RECOVERY_SESSION_KEY, 'true');
      }
      cleanRecoveryUrl();
      setMode('reset');
      setRecoveryReady(true);
      setVerifyingRecovery(false);
      if (!recoveryToastShownRef.current) {
        recoveryToastShownRef.current = true;
        toast.success('Recovery link verified. You can set a new password now.');
      }
    };

    const failRecoveryLink = () => {
      if (!isActive) return;
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(RECOVERY_SESSION_KEY);
      }
      setRecoveryReady(false);
      setVerifyingRecovery(false);
      recoveryToastShownRef.current = false;
      setSearchParams({});
      setMode('forgot');
      toast.error('This recovery link is invalid or expired. Please request a new one.');
    };

    console.info('[password-reset] Recovery flow detected on Auth page', {
      hasRecoveryParams,
      hasStoredRecoveryState,
      search: searchParams.toString(),
    });

    setMode('reset');
    setVerifyingRecovery(true);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.info('[password-reset] Auth state changed during recovery', {
        event,
        hasSession: !!session,
      });

      if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
        markRecoveryReady();
      }
    });

    const checkRecoverySession = async () => {
      for (let attempt = 1; attempt <= 8; attempt += 1) {
        const { data, error } = await supabase.auth.getSession();
        console.info('[password-reset] Recovery session check', {
          attempt,
          hasSession: !!data.session,
          error: error?.message,
        });

        if (!isActive) return;
        if (data.session) {
          markRecoveryReady();
          return;
        }

        await new Promise((resolve) => window.setTimeout(resolve, 250));
      }

      failRecoveryLink();
    };

    void checkRecoverySession();

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, [searchParams, setSearchParams]);

  const setAuthMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setPassword('');
    setConfirmPassword('');
    if (nextMode !== 'forgot') {
      setRecoveryRequestedForEmail('');
      setRecoveryCooldownUntil(0);
    }
    if (nextMode !== 'reset') {
      setRecoveryReady(false);
      recoveryToastShownRef.current = false;
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(RECOVERY_SESSION_KEY);
      }
    }
  };

  const handlePrimarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (mode === 'forgot') {
      await handleForgotPassword();
      return;
    }
    if (mode === 'reset') {
      await handleResetPassword();
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        const result = await login(email, password);
        if (result.success) {
          toast.success('Welcome back!');
          navigate('/dashboard');
        } else {
          toast.error(result.error || 'Invalid credentials');
        }
        return;
      }

      if (password.length < PASSWORD_MIN_LENGTH) {
        toast.error(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
        return;
      }
      if (!name.trim()) {
        toast.error('Please enter your full name');
        return;
      }

      const result = await signup(name, email, password, role);
      if (result.success) {
        if (result.needsEmailVerification) {
          toast.success('Account created. Please verify your email before signing in.');
          setAuthMode('login');
          return;
        }

        toast.success('Account created successfully!');
        navigate('/dashboard');
      } else {
        toast.error(result.error || 'Signup failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (submitting) return;
    if (!email.trim()) {
      toast.error('Enter your email address first');
      return;
    }

    setSubmitting(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const result = await passwordRecoveryService.currentProvider.requestReset(
        normalizedEmail,
        getPasswordResetRedirectUrl(),
      );

      if (result.success) {
        const cooldown = result.cooldownSeconds ?? 60;
        setRecoveryCooldownUntil(Date.now() + cooldown * 1000);
        setRecoveryRequestedForEmail(normalizedEmail);
        console.info('[password-reset] Reset email requested successfully', {
          email: normalizedEmail,
          cooldown,
        });
        toast.success('If an account exists for that email, a password reset link has been sent.');
        return;
      }

      console.error('[password-reset] Reset request failed', result);
      toast.error(result.error || 'We could not start password recovery right now.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (submitting || verifyingRecovery) return;
    if (!recoveryReady) {
      toast.error('This recovery session is not ready. Please request a new reset link.');
      return;
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      toast.error(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const result = await passwordRecoveryService.currentProvider.updatePassword(password);
      if (!result.success) {
        console.error('[password-reset] Password update failed', result);
        toast.error(result.error || 'Password could not be updated.');
        return;
      }

      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(RECOVERY_SESSION_KEY);
      }
      setPassword('');
      setConfirmPassword('');
      setSearchParams({});
      setAuthMode('login');
      toast.success('Password updated successfully. Please sign in with your new password.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendRecovery = async () => {
    if (cooldownSeconds > 0 || submitting) return;
    await handleForgotPassword();
  };

  const inputClass =
    'w-full pl-11 pr-4 py-3 rounded-xl bg-secondary/80 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors';
  const passwordInputClass =
    'w-full pl-11 pr-11 py-3 rounded-xl bg-secondary/80 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors';

  const isLogin = mode === 'login';
  const isSignup = mode === 'signup';
  const isForgot = mode === 'forgot';
  const isReset = mode === 'reset';

  return (
    <div className="min-h-screen px-4 pb-10 pt-24 md:pt-28">
      <div className="container mx-auto">
        <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-2xl shadow-primary/10">
          <div className="grid min-h-[720px] lg:grid-cols-[minmax(0,540px)_1fr]">
            <div className="flex items-center justify-center p-6 sm:p-10 lg:p-14">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
              >
                <div className="mb-8">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent">
                    <Home className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h1 className="font-heading text-3xl font-bold">
                    {isLogin && 'Welcome back'}
                    {isSignup && 'Create your account'}
                    {isForgot && 'Forgot your password?'}
                    {isReset && 'Set a new password'}
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {isLogin && 'Sign in to continue managing rooms, bookings, and payments.'}
                    {isSignup && 'Start exploring or list your room with a verified workflow.'}
                    {isForgot && 'Enter your email to receive a secure password reset link.'}
                    {isReset && 'Your recovery link is verified. Choose a new password to finish account recovery.'}
                  </p>
                </div>

                <form onSubmit={handlePrimarySubmit} className="space-y-4">
                  {isSignup && (
                    <>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Full Name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className={inputClass}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {(['student', 'owner'] as const).map((entryRole) => (
                          <button
                            key={entryRole}
                            type="button"
                            onClick={() => setRole(entryRole)}
                            className={`rounded-xl py-3 text-sm font-heading font-medium transition-all ${
                              role === entryRole
                                ? 'bg-primary text-primary-foreground neon-glow-sm'
                                : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                            }`}
                          >
                            {entryRole === 'student' ? 'Student' : 'Owner'}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {(isLogin || isSignup || isForgot) && (
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={inputClass}
                        required
                      />
                    </div>
                  )}

                  {(isLogin || isSignup || isReset) && (
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder={isLogin ? 'Password' : 'New Password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={passwordInputClass}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-muted-foreground"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  )}

                  {isReset && (
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm New Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={passwordInputClass}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-muted-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  )}

                  {isForgot && recoveryRequestedForEmail && (
                    <div className="rounded-xl border border-border/70 bg-secondary/40 px-4 py-3 text-xs text-muted-foreground">
                      Reset instructions have been requested for <span className="font-medium text-foreground">{recoveryRequestedForEmail}</span>. Check your inbox and spam folder, then open the secure link to continue.
                    </div>
                  )}

                  {isReset && verifyingRecovery && (
                    <div className="rounded-xl border border-border/70 bg-secondary/40 px-4 py-3 text-sm text-muted-foreground">
                      Verifying your recovery link...
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || (isReset && verifyingRecovery)}
                    className="btn-neon w-full disabled:opacity-60"
                  >
                    {submitting && 'Please wait...'}
                    {!submitting && isLogin && 'Sign In'}
                    {!submitting && isSignup && 'Create Account'}
                    {!submitting && isForgot && 'Send Reset Link'}
                    {!submitting && isReset && 'Update Password'}
                  </button>
                </form>

                {isLogin && (
                  <div className="mt-3 text-right">
                    <button
                      onClick={() => setAuthMode('forgot')}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                {isForgot && recoveryRequestedForEmail && (
                  <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                    <button
                      onClick={() => setRecoveryRequestedForEmail('')}
                      className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
                    >
                      <ArrowLeft className="h-4 w-4" /> Change email
                    </button>
                    <button
                      onClick={() => void handleResendRecovery()}
                      disabled={cooldownSeconds > 0 || submitting}
                      className="font-medium text-primary hover:underline disabled:opacity-50"
                    >
                      {cooldownSeconds > 0 ? `Resend in ${cooldownSeconds}s` : 'Resend link'}
                    </button>
                  </div>
                )}

                {(isForgot || isReset) && (
                  <div className="mt-4">
                    <button
                      onClick={() => {
                        setSearchParams({});
                        setAuthMode('login');
                      }}
                      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                      <ArrowLeft className="h-4 w-4" /> Back to sign in
                    </button>
                  </div>
                )}

                {(isLogin || isSignup) && (
                  <p className="mt-6 text-center text-sm text-muted-foreground">
                    {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                    <button
                      onClick={() => setAuthMode(isLogin ? 'signup' : 'login')}
                      className="font-medium text-primary hover:underline"
                    >
                      {isLogin ? 'Sign Up' : 'Sign In'}
                    </button>
                  </p>
                )}
              </motion.div>
            </div>

            <div className="auth-showcase relative hidden items-end lg:flex">
              <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-primary/10 to-transparent" />
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="relative z-10 max-w-lg p-12 text-white"
              >
                <p className="text-sm uppercase tracking-[0.28em] text-white/70">
                  Secure housing flow
                </p>
                <h2 className="mt-4 font-heading text-4xl font-bold leading-tight">
                  From room discovery to rent collection, everything stays in one green workspace.
                </h2>
                <p className="mt-4 text-white/78">
                  Browse verified listings, track agreements, complete payments, and keep
                  owner-student communication organized without leaving the app.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
