import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  KeyRound,
  Database,
  CheckCircle2,
  Terminal,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import { supabase, getSupabaseConfigStatus, isSupabaseConfigured } from '../lib/supabase';

const TARGET_ADMIN_EMAIL = 'joshuaajayi0148@gmail.com';
const TARGET_ADMIN_PASSWORD = 'Ayomide0148';

const SQL_TRIGGER_CODE = `-- 1. Create a function to assign 'admin' role automatically to your email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    CASE 
      WHEN NEW.email = 'joshuaajayi0148@gmail.com' THEN 'admin'::user_role
      ELSE 'customer'::user_role
    END
  )
  ON CONFLICT (id) DO UPDATE
  SET role = EXCLUDED.role;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Attach the trigger to automatic sign-ups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Ensure profiles table allows reading role
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read profile" ON public.profiles;
CREATE POLICY "Allow authenticated read profile" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (true);`;

export const AdminLoginView: React.FC = () => {
  const { adminLogin, adminLogout, navigateTo, showToast, isAdmin: storeIsAdmin, currentUser } = useStore();

  // Tabbed Auth Mode: 'signin' | 'signup'
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  // Form Fields
  const [fullName, setFullName] = useState<string>('Engr. Joshua Ajayi');
  const [email, setEmail] = useState<string>(TARGET_ADMIN_EMAIL);
  const [password, setPassword] = useState<string>(TARGET_ADMIN_PASSWORD);
  const [confirmPassword, setConfirmPassword] = useState<string>(TARGET_ADMIN_PASSWORD);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPrivilegeError, setIsPrivilegeError] = useState(false);

  // Auto-seed dialog / status states
  const [showSeedModal, setShowSeedModal] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [serviceRoleKeyInput, setServiceRoleKeyInput] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  const supabaseStatus = getSupabaseConfigStatus();

  // 1. Read URL error query param if redirected from middleware or dashboard
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const err = urlParams.get('error');
      if (err) {
        setIsPrivilegeError(true);
        if (err === 'unauthorized' || err.includes('Unauthorized') || err.includes('site owner')) {
          setErrorMessage('Unauthorized access: Only the site owner can log into this dashboard.');
        } else {
          setErrorMessage(decodeURIComponent(err));
        }
      }
    }
  }, []);

  // 2. Client-side session check & automatic redirect to dashboard
  useEffect(() => {
    let isMounted = true;

    // A. Check store state
    if (storeIsAdmin && currentUser?.email?.toLowerCase().trim() === TARGET_ADMIN_EMAIL.toLowerCase()) {
      navigateTo('admin-dashboard');
      return;
    }

    // B. Check active Supabase session
    const checkSupabaseSession = async () => {
      if (isSupabaseConfigured() && supabase) {
        try {
          const { data, error } = await supabase.auth.getSession();
          if (!error && data?.session?.user && isMounted) {
            const sessionEmail = data.session.user.email?.toLowerCase().trim();
            const isOwner = sessionEmail === TARGET_ADMIN_EMAIL.toLowerCase();
            const metaRole = data.session.user.user_metadata?.role;

            if (isOwner || metaRole === 'admin') {
              const loginRes = await adminLogin(data.session.user.email!, TARGET_ADMIN_PASSWORD);
              if (loginRes.success) {
                showToast('Existing admin session authenticated. Welcome back, Joshua.', 'success');
                navigateTo('admin-dashboard');
              }
            }
          }
        } catch (sessErr) {
          console.warn('Session restore check:', sessErr);
        }
      }
    };

    checkSupabaseSession();

    return () => {
      isMounted = false;
    };
  }, [storeIsAdmin, currentUser, navigateTo, adminLogin, showToast]);

  // Handle Sign In with Supabase Auth
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsPrivilegeError(false);

    // Validation
    if (!email.trim() || !password) {
      const msg = 'Please enter both your email address and password.';
      setErrorMessage(msg);
      showToast(msg, 'error');
      return;
    }

    const inputEmail = email.trim().toLowerCase();
    const targetEmail = TARGET_ADMIN_EMAIL.toLowerCase();

    // Site Owner hard-lock check
    if (inputEmail !== targetEmail) {
      if (supabase && isSupabaseConfigured()) {
        try {
          await supabase.auth.signOut();
        } catch {}
      }
      setIsPrivilegeError(true);
      const msg = 'Unauthorized access: Only the site owner can log into this dashboard.';
      setErrorMessage(msg);
      showToast(msg, 'error');
      return;
    }

    setIsLoading(true);
    try {
      let isSupabaseAuthenticated = false;
      let authenticatedUserId: string | null = null;

      // 1. Authenticate with Supabase Auth using signInWithPassword()
      if (isSupabaseConfigured() && supabase) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

          if (!error && data?.user) {
            const authenticatedEmail = data.user.email?.trim().toLowerCase();
            if (authenticatedEmail === targetEmail) {
              isSupabaseAuthenticated = true;
              authenticatedUserId = data.user.id;
            }
          } else if (error) {
            console.warn('Supabase signInWithPassword returned error:', error.message);
          }
        } catch (authErr) {
          console.warn('Supabase auth attempt notice:', authErr);
        }
      }

      // If Supabase authenticated, ensure role = 'admin' in profiles table
      if (isSupabaseAuthenticated && authenticatedUserId && supabase) {
        try {
          await supabase
            .from('profiles')
            .upsert({
              id: authenticatedUserId,
              email: targetEmail,
              full_name: fullName.trim() || 'Engr. Joshua Ajayi',
              role: 'admin',
            });
        } catch (profileErr) {
          console.warn('Profile sync notice:', profileErr);
        }
      }

      // 2. Complete store session via adminLogin()
      const loginRes = await adminLogin(email.trim(), password);
      if (loginRes.success) {
        showToast('Signed in successfully! Loading Admin Dashboard...', 'success');
        navigateTo('admin-dashboard');
      } else {
        setErrorMessage(loginRes.message || 'Invalid administrator password.');
        setIsPrivilegeError(loginRes.isPrivilegeDenied || false);
        showToast(loginRes.message || 'Invalid administrator password.', 'error');
      }
    } catch (err: any) {
      const msg = err?.message || 'An unexpected authentication error occurred.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Sign Up with Supabase Auth
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsPrivilegeError(false);

    // 1. Validation
    if (!fullName.trim()) {
      const msg = 'Please enter your full name.';
      setErrorMessage(msg);
      showToast(msg, 'error');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      const msg = 'Please enter a valid administrator email address.';
      setErrorMessage(msg);
      showToast(msg, 'error');
      return;
    }

    const inputEmail = email.trim().toLowerCase();
    const targetEmail = TARGET_ADMIN_EMAIL.toLowerCase();

    // Restrict admin account creation to target site owner
    if (inputEmail !== targetEmail) {
      setIsPrivilegeError(true);
      const msg = 'Unauthorized: Administrative sign up is restricted to the site owner (joshuaajayi0148@gmail.com).';
      setErrorMessage(msg);
      showToast(msg, 'error');
      return;
    }

    if (password.length < 6) {
      const msg = 'Password must be at least 6 characters long for security.';
      setErrorMessage(msg);
      showToast(msg, 'error');
      return;
    }

    if (password !== confirmPassword) {
      const msg = 'Passwords do not match. Please verify both password fields.';
      setErrorMessage(msg);
      showToast(msg, 'error');
      return;
    }

    setIsLoading(true);
    try {
      if (!isSupabaseConfigured() || !supabase) {
        // Fallback for offline local dev mode
        const loginRes = await adminLogin(email.trim(), password);
        if (loginRes.success) {
          showToast('Admin account initialized in local mode! Welcome.', 'success');
          navigateTo('admin-dashboard');
        } else {
          setErrorMessage(loginRes.message);
          showToast(loginRes.message, 'error');
        }
        setIsLoading(false);
        return;
      }

      // 2. Call supabase.auth.signUp() with role: 'admin' metadata
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role: 'admin',
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        showToast(error.message, 'error');
        setIsLoading(false);
        return;
      }

      // If user session created immediately (or auto-confirmed)
      if (data?.session && data.user) {
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email: targetEmail,
            full_name: fullName.trim(),
            role: 'admin',
          });
        } catch {}

        const loginRes = await adminLogin(email.trim(), password);
        if (loginRes.success) {
          showToast('Admin account registered & authenticated successfully!', 'success');
          navigateTo('admin-dashboard');
        } else {
          showToast('Account registered! Please sign in with your credentials.', 'success');
          setAuthMode('signin');
        }
      } else {
        // Email confirmation flow or user already registered
        showToast('Registration submitted! If confirmation is required, please check your inbox, then sign in.', 'success');
        setAuthMode('signin');
      }
    } catch (err: any) {
      const msg = err?.message || 'An error occurred during administrator registration.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetToTargetAdmin = () => {
    setFullName('Engr. Joshua Ajayi');
    setEmail(TARGET_ADMIN_EMAIL);
    setPassword(TARGET_ADMIN_PASSWORD);
    setConfirmPassword(TARGET_ADMIN_PASSWORD);
    setErrorMessage(null);
    setIsPrivilegeError(false);
    showToast('Admin credentials restored: ' + TARGET_ADMIN_EMAIL, 'info');
  };

  const handleExecuteSeed = async () => {
    setIsSeeding(true);
    setSeedResult(null);
    try {
      const response = await fetch('/api/seed-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(serviceRoleKeyInput.trim() ? { 'x-service-role-key': serviceRoleKeyInput.trim() } : {}),
        },
        body: JSON.stringify({
          email: TARGET_ADMIN_EMAIL,
          password: TARGET_ADMIN_PASSWORD,
          fullName: fullName.trim() || 'Joshua Ajayi',
          serviceRoleKey: serviceRoleKeyInput.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSeedResult({
          success: true,
          message: data.message || `Admin account ${TARGET_ADMIN_EMAIL} successfully initialized with confirmed email and role = 'admin'!`,
        });
        showToast('Admin account seeded successfully in Supabase Auth!', 'success');
        setEmail(TARGET_ADMIN_EMAIL);
        setPassword(TARGET_ADMIN_PASSWORD);

        // Attempt automatic immediate sign in
        setTimeout(async () => {
          setIsLoading(true);
          const loginRes = await adminLogin(TARGET_ADMIN_EMAIL, TARGET_ADMIN_PASSWORD);
          setIsLoading(false);
          if (loginRes.success) {
            navigateTo('admin-dashboard');
          }
        }, 1200);
      } else {
        setSeedResult({
          success: false,
          message: data.error || data.message || 'Failed to seed admin account. Check your Service Role Key.',
        });
        showToast(data.error || 'Failed to seed admin account.', 'error');
      }
    } catch (err: any) {
      setSeedResult({
        success: false,
        message: err?.message || 'Network error executing /api/seed-admin',
      });
      showToast('Network error executing seed admin', 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_TRIGGER_CODE);
    setCopiedSql(true);
    showToast('SQL script copied to clipboard!');
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div id="admin-login-page" className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-slate-900/95 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Top return link & status indicator */}
        <div className="mb-6 flex items-center justify-between">
          <button
            id="back-to-storefront-btn"
            onClick={() => navigateTo('home')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Storefront
          </button>
          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${supabaseStatus.isConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            {supabaseStatus.isConfigured ? 'Supabase Auth' : 'Local Auth'}
          </span>
        </div>

        {/* Main Admin Auth Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-7 sm:p-8 shadow-2xl shadow-black/50 text-white backdrop-blur-xl">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 shadow-lg shadow-amber-500/20 mb-3">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">AjmanTech Admin Portal</h1>
            <p className="text-xs text-slate-400 mt-1 font-light">
              Gated Administrator Authentication at <code className="font-mono text-amber-400">/admin</code>
            </p>
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-mono">
              <Sparkles className="w-3 h-3" /> Designated Owner: {TARGET_ADMIN_EMAIL}
            </div>
          </div>

          {/* Tabbed Toggle: Sign In vs Sign Up */}
          <div className="flex rounded-xl bg-slate-800/80 p-1 mb-6 border border-slate-700/70 text-xs font-bold">
            <button
              id="admin-tab-signin-btn"
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authMode === 'signin'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-sm font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              id="admin-tab-signup-btn"
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authMode === 'signup'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-sm font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign Up</span>
            </button>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div
              id="admin-auth-error"
              className={`mb-6 p-4 rounded-2xl border text-xs leading-relaxed flex items-start gap-3 ${
                isPrivilegeError
                  ? 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                  : 'bg-amber-950/40 border-amber-800/80 text-amber-200'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div className="space-y-1.5 flex-1">
                <div className="font-bold text-white">{errorMessage}</div>
                {isPrivilegeError ? (
                  <p className="text-[11px] text-rose-300/90 font-light">
                    Administrative access is exclusively restricted to the site owner. Use the Auto-Seed tool below if you need to initialize your admin profile in Supabase.
                  </p>
                ) : (
                  <p className="text-[11px] text-amber-300/90 font-light">
                    Please check your credentials or click "Restore default" to use pre-configured settings.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Form: Sign In Mode */}
          {authMode === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              {/* Email Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Admin Email Address
                  </label>
                  {email !== TARGET_ADMIN_EMAIL && (
                    <button
                      type="button"
                      onClick={handleResetToTargetAdmin}
                      className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                    >
                      Restore default
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="admin-email-input"
                    type="email"
                    required
                    placeholder="joshuaajayi0148@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Password
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">Default: Ayomide0148</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="admin-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                id="admin-sign-in-btn"
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Signing In via Supabase...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Admin Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Form: Sign Up Mode */
            <form onSubmit={handleSignUp} className="space-y-4">
              {/* Full Name Field */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="admin-signup-name-input"
                    type="text"
                    required
                    placeholder="Engr. Joshua Ajayi"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                  />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Administrator Email
                  </label>
                  <span className="text-[10px] text-amber-400 font-mono">Site Owner</span>
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="admin-signup-email-input"
                    type="email"
                    required
                    placeholder="joshuaajayi0148@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Password (min 6 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="admin-signup-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="admin-signup-confirm-input"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                id="admin-sign-up-btn"
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Registering with Supabase Auth...</span>
                  </>
                ) : (
                  <>
                    <span>Create Administrator Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Programmatic Seeder & SQL Options */}
          <div className="mt-6 pt-6 border-t border-slate-800 text-center space-y-3">
            <button
              id="open-seed-modal-btn"
              type="button"
              onClick={() => setShowSeedModal(true)}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-amber-500/30 hover:border-amber-500/60 text-amber-300 hover:text-amber-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span>Programmatic Auto-Seed Admin Account (/api/seed-admin)</span>
            </button>

            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <button
                type="button"
                onClick={() => setShowSqlModal(true)}
                className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <Terminal className="w-3.5 h-3.5 text-slate-400" /> View SQL Trigger
              </button>

              <button
                type="button"
                onClick={handleResetToTargetAdmin}
                className="text-[11px] text-amber-400 hover:underline cursor-pointer"
              >
                Restore Master Defaults
              </button>
            </div>
          </div>
        </div>

        {/* Informational Guidance */}
        <div className="mt-6 p-4 rounded-2xl bg-slate-800/40 border border-slate-800 text-slate-400 text-xs flex items-start gap-3">
          <Database className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed text-[11px]">
            <span className="font-bold text-slate-300">Admin Authentication & Access: </span>
            Submitting authenticates via Supabase Auth (<code className="text-amber-400 font-mono">auth.users</code>) and verifies <code className="text-white font-mono">role = 'admin'</code> in <code className="text-slate-300 font-mono">public.profiles</code>. Upon verification, you are redirected immediately to the management dashboard.
          </div>
        </div>
      </div>

      {/* Auto-Seed / Confirmation Modal */}
      {showSeedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold">Auto-Seed Admin User</h3>
              </div>
              <button
                onClick={() => setShowSeedModal(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 font-light leading-relaxed">
              This initiates our backend endpoint (<code className="text-amber-400 font-mono">/api/seed-admin</code>) which uses your Supabase Service Role Key to:
            </p>

            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside font-light">
              <li>Create or update <strong className="text-white font-mono">{TARGET_ADMIN_EMAIL}</strong> in <code className="text-amber-400">auth.users</code>.</li>
              <li>Auto-confirm the email address so no confirmation link is needed.</li>
              <li>Upsert <code className="text-amber-400 font-mono">public.profiles</code> to enforce <code className="text-emerald-400 font-mono">role = 'admin'</code>.</li>
            </ul>

            <div className="space-y-1.5 pt-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Supabase Service Role Key (Optional if set in server env)
              </label>
              <input
                type="password"
                value={serviceRoleKeyInput}
                onChange={(e) => setServiceRoleKeyInput(e.target.value)}
                placeholder="Paste service_role secret from Supabase Dashboard"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-amber-400"
              />
            </div>

            {seedResult && (
              <div
                className={`p-3 rounded-xl border text-xs ${
                  seedResult.success
                    ? 'bg-emerald-950/50 border-emerald-800 text-emerald-200'
                    : 'bg-rose-950/50 border-rose-800 text-rose-200'
                }`}
              >
                {seedResult.message}
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowSeedModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleExecuteSeed}
                disabled={isSeeding}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSeeding ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Seeding...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Execute Auto-Seed Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SQL Trigger Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Terminal className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold">SQL Editor Script</h3>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 font-light leading-relaxed">
              Run this SQL script in your Supabase project's <strong>SQL Editor</strong>. It automatically assigns the <code className="text-amber-400 font-mono">'admin'</code> role in <code className="text-slate-300 font-mono">public.profiles</code> whenever <strong className="text-white font-mono">{TARGET_ADMIN_EMAIL}</strong> signs up.
            </p>

            <div className="relative">
              <pre className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-[11px] font-mono text-amber-300/90 overflow-x-auto max-h-56 leading-relaxed">
                {SQL_TRIGGER_CODE}
              </pre>
              <button
                onClick={handleCopySql}
                className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs flex items-center gap-1 cursor-pointer transition-colors"
                title="Copy SQL"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
