import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, Home, KeyRound, ArrowLeft } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { passwordRecoveryService } from '@/lib/authRecovery';
import { toast } from 'sonner';

type AuthMode = 'login' | 'signup' | 'forgot' | 'verify' | 'reset';

const PASSWORD_MIN_LENGTH = 6;

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [role, setRole] = useState<'student' | 'owner'>('student');
  const [submitting, setSubmitting] = useState(false);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [verifyingRecovery, setVerifyingRecovery] = useState(false);
  const [recoveryCooldownUntil, setRecoveryCooldownUntil] = useState<number>(0);
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

  // Handle both recovery link clicks and token-hash verification.
  useEffect(() => {
    const tokenHash = searchParams.get('token_hash');

    // Only process if we have a token hash.
    if (!tokenHash) return;
    if (recoveryReady || verifyingRecovery) return;

    setMode('reset');
    setVerifyingRecovery(true);

    void passwordRecoveryService.currentProvider.verifyTokenHash(tokenHash).then((result) => {
      setVerifyingRecovery(false);
      if (result.success) {
        setRecoveryReady(true);
        // Clean the URL so token_hash is not reused on refresh.
        setSearchParams({});
        toast.success('Recovery link verified. You can set a new password now.');
        return;
      }
      toast.error(result.error || 'This recovery link is invalid or expired.');
      setRecoveryReady(false);
      setMode('forgot');
      setSearchParams({});
    });
  }, [recoveryReady, searchParams, setSearchParams, verifyingRecovery]);

  const setAuthMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setPassword('');
    setConfirmPassword('');
    if (nextMode !== 'verify') setRecoveryCode('');
    if (nextMode !== 'reset') setRecoveryReady(false);
  };

  const handlePrimarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (mode === 'forgot') { await handleForgotPassword(); return; }
    if (mode === 'verify') { await handleVerifyRecoveryCode(); return; }
    if (mode === 'reset')  { await handleResetPassword(); return; }

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
      } else {
        // Signup
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
      // FIX: pass clean base URL — no query params.
      // The edge function appends ?token_hash=... itself.
      const redirectTo = `${window.location.origin}/auth`;

      const result = await passwordRecoveryService.currentProvider.requestReset(
        email.trim(),
        redirectTo,
      );

      if (result.success) {
        const cooldown = result.cooldownSeconds ?? 60;
        setRecoveryCooldownUntil(Date.now() + cooldown * 1000);
        setMode('verify');
        toast.success(
          'If an account exists for that email, a recovery code has been sent.',
        );
        return;
      }

      toast.error(result.error || 'We could not start password recovery right now.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyRecoveryCode = async () => {
    if (submitting) return;
    if (!email.trim() || !recoveryCode.trim()) {
      toast.error('Enter your email and recovery code');
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
      const verifyResult = await passwordRecoveryService.currentProvider.verifyCode(
        email.trim(),
        recoveryCode.trim(),
      );
      if (!verifyResult.success) {
        toast.error(verifyResult.error || 'The recovery code is invalid or expired.');
        return;
      }

      const resetResult = await passwordRecoveryService.currentProvider.updatePassword(password);
      if (!resetResult.success) {
        toast.error(resetResult.error || 'Password could not be updated.');
        return;
      }

      toast.success('Password updated successfully. Please sign in with your new password.');
      setRecoveryCode('');
      setConfirmPassword('');
      setPassword('');
      setAuthMode('login');
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
        toast.error(result.error || 'Password could not be updated.');
        return;
      }

      toast.success('Password updated successfully. Please sign in with your new password.');
      setPassword('');
      setConfirmPassword('');
      setSearchParams({});
      setAuthMode('login');
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

  const isLogin  = mode === 'login';
  const isSignup = mode === 'signup';
  const isForgot = mode === 'forgot';
  const isVerify = mode === 'verify';
  const isReset  = mode === 'reset';

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
                    {isLogin  && 'Welcome back'}
                    {isSignup && 'Create your account'}
                    {isForgot && 'Forgot your password?'}
                    {isVerify && 'Verify your recovery code'}
                    {isReset  && 'Set a new password'}
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {isLogin  && 'Sign in to continue managing rooms, bookings, and payments.'}
                    {isSignup && 'Start exploring or list your room with a verified workflow.'}
                    {isForgot && 'Enter your email to receive a secure recovery code and reset instructions.'}
                    {isVerify && 'Enter the recovery code from your email and choose a new password.'}
                    {isReset  && 'Your recovery link is verified. Choose a new password to finish account recovery.'}
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

                  {(isLogin || isSignup || isForgot || isVerify) && (
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

                  {(isLogin || isSignup || isVerify || isReset) && (
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

                  {(isVerify || isReset) && (
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

                  {isVerify && (
                    <>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Recovery Code"
                          value={recoveryCode}
                          onChange={(e) => setRecoveryCode(e.target.value)}
                          className={inputClass}
                          required
                        />
                      </div>
                      <div className="rounded-xl border border-border/70 bg-secondary/40 px-4 py-3 text-xs text-muted-foreground">
                        If your code expires or does not arrive, request a fresh one. Recovery
                        requests are rate-limited for security.
                      </div>
                    </>
                  )}

                  {isReset && verifyingRecovery && (
                    <div className="rounded-xl border border-border/70 bg-secondary/40 px-4 py-3 text-sm text-muted-foreground">
                      Verifying your recovery link…
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || (isReset && verifyingRecovery)}
                    className="btn-neon w-full disabled:opacity-60"
                  >
                    {submitting                          && 'Please wait…'}
                    {!submitting && isLogin              && 'Sign In'}
                    {!submitting && isSignup             && 'Create Account'}
                    {!submitting && isForgot             && 'Send Recovery Code'}
                    {!submitting && isVerify             && 'Verify Code and Reset Password'}
                    {!submitting && isReset              && 'Update Password'}
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

                {isVerify && (
                  <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                    <button
                      onClick={() => setAuthMode('forgot')}
                      className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
                    >
                      <ArrowLeft className="h-4 w-4" /> Change email
                    </button>
                    <button
                      onClick={() => void handleResendRecovery()}
                      disabled={cooldownSeconds > 0 || submitting}
                      className="font-medium text-primary hover:underline disabled:opacity-50"
                    >
                      {cooldownSeconds > 0 ? `Resend in ${cooldownSeconds}s` : 'Resend code'}
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
