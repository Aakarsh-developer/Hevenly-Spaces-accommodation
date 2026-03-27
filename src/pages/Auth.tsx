import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, Home } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'owner'>('student');
  const [submitting, setSubmitting] = useState(false);
  const { login, signup } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    try {
      if (isLogin) {
        const result = await login(email, password);
        if (result.success) {
          toast.success('Welcome back!');
          navigate('/dashboard');
        } else {
          toast.error(result.error || 'Invalid credentials');
        }
      } else {
        if (password.length < 6) {
          toast.error('Password must be at least 6 characters');
          setSubmitting(false);
          return;
        }

        const result = await signup(name, email, password, role);
        if (result.success) {
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

  const inputClass = 'w-full pl-11 pr-4 py-3 rounded-xl bg-secondary/80 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors';

  return (
    <div className="min-h-screen px-4 pt-24 pb-10 md:pt-28">
      <div className="container mx-auto">
        <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-2xl shadow-primary/10">
          <div className="grid min-h-[720px] lg:grid-cols-[minmax(0,540px)_1fr]">
            <div className="flex items-center justify-center p-6 sm:p-10 lg:p-14">
              <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
                <div className="mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
                    <Home className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h1 className="font-heading text-3xl font-bold">{isLogin ? 'Welcome back' : 'Create your account'}</h1>
                  <p className="text-sm text-muted-foreground mt-2">
                    {isLogin ? 'Sign in to continue managing rooms, bookings, and payments.' : 'Start exploring or list your room with a verified workflow.'}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <>
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                        <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {(['student', 'owner'] as const).map((entryRole) => (
                          <button
                            key={entryRole}
                            type="button"
                            onClick={() => setRole(entryRole)}
                            className={`py-3 rounded-xl font-heading font-medium text-sm transition-all ${role === entryRole ? 'bg-primary text-primary-foreground neon-glow-sm' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}
                          >
                            {entryRole === 'student' ? 'Student' : 'Owner'}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                    <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-11 py-3 rounded-xl bg-secondary/80 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <button type="submit" disabled={submitting} className="btn-neon w-full disabled:opacity-60">
                    {submitting ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
                  </button>
                </form>

                <p className="text-center text-sm text-muted-foreground mt-6">
                  {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                  <button onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline font-medium">
                    {isLogin ? 'Sign Up' : 'Sign In'}
                  </button>
                </p>
              </motion.div>
            </div>

            <div className="auth-showcase relative hidden lg:flex items-end">
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/30 to-transparent" />
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="relative z-10 max-w-lg p-12 text-white"
              >
                <p className="text-sm uppercase tracking-[0.28em] text-white/70">Secure housing flow</p>
                <h2 className="mt-4 font-heading text-4xl font-bold leading-tight">
                  From room discovery to rent collection, everything stays in one green workspace.
                </h2>
                <p className="mt-4 text-white/78">
                  Browse verified listings, track agreements, complete payments, and keep owner-student communication organized without leaving the app.
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
