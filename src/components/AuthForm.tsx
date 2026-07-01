import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, User as UserIcon, ArrowRight, ShieldCheck, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { getSupabase, initSupabase } from '../lib/supabase';
import { User } from '../types';

interface AuthFormProps {
  onLogin: (user: User) => void;
  isLoading?: boolean;
}

export default function AuthForm({ onLogin }: AuthFormProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [supabaseReady, setSupabaseReady] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkSupabase() {
      const client = await initSupabase();
      setSupabaseReady(!!client);
    }
    checkSupabase();
  }, []);

  // Simple client-side validators
  const validateEmail = (emailStr: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);
  };

  const getPasswordStrength = (pwd: string) => {
    if (pwd.length < 6) return { score: 1, label: 'Weak (min 6 chars)', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
    const hasLetters = /[a-zA-Z]/.test(pwd);
    const hasNumbers = /[0-9]/.test(pwd);
    const hasSpecial = /[^a-zA-Z0-9]/.test(pwd);
    
    if (hasLetters && hasNumbers && hasSpecial) {
      return { score: 3, label: 'Strong Premium Password', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    }
    return { score: 2, label: 'Medium Quality', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side validations
    if (!validateEmail(email)) {
      setError('Please provide a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (mode === 'signup' && !username.trim()) {
      setError('Please provide a username.');
      return;
    }

    setLoading(true);

    try {
      const supabase = getSupabase();

      if (supabaseReady && supabase) {
        // --- REAL SUPABASE AUTHENTICATION ---
        if (mode === 'signup') {
          const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                username: username.trim(),
                first_name: username.trim(),
                profile_image: `https://api.dicebear.com/7.x/adventurer/svg?seed=${username.trim()}`
              }
            }
          });

          if (signUpError) {
            throw new Error(signUpError.message);
          }

          if (data?.user) {
            // Write profile data immediately
            const profileRes = await fetch('/api/auth/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: data.user.id,
                email: email,
                username: username.trim(),
                profile_image: `https://api.dicebear.com/7.x/adventurer/svg?seed=${username.trim()}`,
                role: 'user'
              })
            });

            if (!profileRes.ok) {
              const errData = await profileRes.json();
              console.warn('Failed to register profile on backend:', errData.error);
            }

            setSuccess('Registration successful! Please login to continue.');
            setMode('login');
            setPassword('');
          } else {
            setError('Sign up completed, but no user object was returned.');
          }
        } else {
          // login
          const { data, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
          });

          if (signInError) {
            throw new Error(signInError.message);
          }

          if (data?.user) {
            // Fetch the user's profile from the 'profiles' table on Supabase
            let role: 'user' | 'admin' | 'host' = 'user';
            let profileData: any = null;
            try {
              const { data: pData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .maybeSingle();
              if (!profileError && pData) {
                profileData = pData;
                role = pData.role || 'user';
              }
            } catch (pErr) {
              console.error('Error fetching profile from Supabase:', pErr);
            }

            // Fetch/Ensure profile
            const profileRes = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: data.user.id,
                email: data.user.email,
                username: profileData?.username || data.user.user_metadata?.username || data.user.email?.split('@')[0] || 'User',
                role: role
              })
            });

            if (profileRes.ok) {
              const dbUser = await profileRes.json();
              onLogin(dbUser);
            } else {
              // Fallback if profile creation endpoint fails
              const fallbackUser: User = {
                id: data.user.id,
                email: data.user.email || email,
                username: profileData?.username || data.user.user_metadata?.username || data.user.email?.split('@')[0] || 'User',
                first_name: profileData?.first_name || profileData?.username || data.user.user_metadata?.username || data.user.email?.split('@')[0] || 'User',
                last_name: profileData?.last_name || '',
                profile_image: profileData?.profile_image || data.user.user_metadata?.profile_image || `https://api.dicebear.com/7.x/adventurer/svg?seed=${data.user.id}`,
                created_at: profileData?.created_at || data.user.created_at || new Date().toISOString(),
                role: role
              };
              onLogin(fallbackUser);
            }
          }
        }
      } else {
        // --- SECURE LOCAL SIMULATION ---
        if (mode === 'signup') {
          const res = await fetch('/api/auth/signup-local', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, username: username.trim() })
          });
          const data = await res.json();
          if (res.ok) {
            setSuccess('Registration successful! [Local Fallback mode] Please login.');
            setMode('login');
            setPassword('');
          } else {
            throw new Error(data.error || 'Registration failed');
          }
        } else {
          // login local
          const res = await fetch('/api/auth/login-local', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          const data = await res.json();
          if (res.ok) {
            onLogin(data);
          } else {
            throw new Error(data.error || 'Invalid credentials');
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  const pwdStrength = password ? getPasswordStrength(password) : null;

  return (
    <div className="max-w-md w-full bg-[#17212b]/95 backdrop-blur-md border border-[#24303f] rounded-2xl p-6 shadow-2xl relative overflow-hidden" id="auth-form-container">
      {/* Premium ambient glow background */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#2481cc]/20 rounded-full blur-2xl pointer-events-none"></div>
      <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-[#2481cc]/10 rounded-full blur-2xl pointer-events-none"></div>

      {/* Header Info */}
      <div className="text-center mb-6 flex flex-col items-center">
        <div className="relative mb-4">
          <div className="w-16 h-16 rounded-full bg-[#2481cc]/10 border-2 border-[#2481cc] flex items-center justify-center shadow-lg shadow-[#2481cc]/20">
            <ShieldCheck className="w-8 h-8 text-[#2481cc]" />
          </div>
        </div>
        
        <h2 className="text-xl font-bold text-white tracking-tight" id="auth-title">
          {mode === 'login' ? 'Stream Portal Sign In' : 'Create Stream Account'}
        </h2>
        <p className="text-xs text-gray-400 mt-1 max-w-[280px] mx-auto leading-relaxed">
          {mode === 'login' 
            ? 'Sign in with your email to access premium secure video content.' 
            : 'Register a secure email credentials account to start streaming.'
          }
        </p>
      </div>

      {/* Status Notifications */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex gap-2 items-start" id="auth-error-banner">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex gap-2 items-start" id="auth-success-banner">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Form elements */}
      <form onSubmit={handleSubmit} className="space-y-4" id="credentials-form">
        {mode === 'signup' && (
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                required
                className="w-full pl-10 pr-3 py-2 text-xs bg-[#24303f]/50 border border-[#24303f] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#2481cc] focus:ring-1 focus:ring-[#2481cc] transition"
                id="signup-username-input"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              className="w-full pl-10 pr-3 py-2 text-xs bg-[#24303f]/50 border border-[#24303f] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#2481cc] focus:ring-1 focus:ring-[#2481cc] transition"
              id="auth-email-input"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex justify-between items-center">
            <span>Password</span>
            {mode === 'signup' && password && pwdStrength && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded border ${pwdStrength.color}`}>
                {pwdStrength.label}
              </span>
            )}
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              className="w-full pl-10 pr-10 py-2 text-xs bg-[#24303f]/50 border border-[#24303f] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#2481cc] focus:ring-1 focus:ring-[#2481cc] transition"
              id="auth-password-input"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-300"
              id="toggle-password-visibility"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#2481cc] hover:bg-[#179cde] text-white rounded-xl text-xs font-bold transition duration-200 disabled:opacity-50 mt-2"
          id="auth-submit-btn"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <>
              {mode === 'login' ? 'Sign In' : 'Create Secure Account'}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Switch mode option */}
      <div className="flex flex-col gap-2 items-center text-center mt-5">
        <button
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login');
            setError('');
            setSuccess('');
          }}
          className="text-xs text-gray-400 hover:text-white hover:underline font-medium"
          id="toggle-auth-mode-btn"
        >
          {mode === 'login' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
        </button>

        {supabaseReady === false && (
          <p className="text-[10px] text-amber-500/80 mt-2 font-mono">
            ⚠️ Supabase credentials missing. Running in local secure simulation.
          </p>
        )}
      </div>

      <div className="mt-5 pt-3 border-t border-[#24303f] flex items-center justify-center gap-2 text-[9px] text-gray-500 uppercase tracking-wide">
        <ShieldCheck className="w-3.5 h-3.5 text-[#2481cc]" />
        <span>Secure authentication with state persistence</span>
      </div>
    </div>
  );
}
