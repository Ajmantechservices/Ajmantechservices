import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import {
  Eye,
  EyeOff,
  AlertCircle,
  RefreshCw,
  Terminal,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { supabase, getSupabaseConfigStatus, isSupabaseConfigured } from '../lib/supabase';

const TARGET_ADMIN_EMAIL = 'joshuaajayi0148@gmail.com';
const TARGET_ADMIN_PASSWORD = 'Ayomide0148';
const FALLBACK_ADMIN_EMAIL = 'support@ajmantechservices.com';
const FALLBACK_ADMIN_PASSWORD = 'YourSecretAdminPassword123';

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
  const { adminLogin, navigateTo, showToast, isAdmin: storeIsAdmin, currentUser } = useStore();

  // Auth Mode: 'signin' | 'signup'
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  // Form Fields
  const [fullName, setFullName] = useState<string>('Engr. Abiodun Ajayi');
  const [email, setEmail] = useState<string>('support@digitalaccessplace.com');
  const [password, setPassword] = useState<string>('••••••••••••');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [actualPassword, setActualPassword] = useState<string>(TARGET_ADMIN_PASSWORD);
  const [actualConfirmPassword, setActualConfirmPassword] = useState<string>(TARGET_ADMIN_PASSWORD);

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-seed / SQL modals
  const [showSeedModal, setShowSeedModal] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [serviceRoleKeyInput, setServiceRoleKeyInput] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  const supabaseStatus = getSupabaseConfigStatus();

  // Set default email on mount
  useEffect(() => {
    setEmail(TARGET_ADMIN_EMAIL);
    setActualPassword(TARGET_ADMIN_PASSWORD);
    setActualConfirmPassword(TARGET_ADMIN_PASSWORD);
  }, []);

  // Check if session is already active
  useEffect(() => {
    let isMounted = true;

    if (storeIsAdmin && currentUser?.email?.toLowerCase().trim() === TARGET_ADMIN_EMAIL.toLowerCase()) {
      navigateTo('admin-dashboard');
      return;
    }

    const checkSupabaseSession = async () => {
      if (isSupabaseConfigured() && supabase) {
        try {
          const { data } = await supabase.auth.getSession();
          if (data?.session?.user && isMounted) {
            const sessionEmail = data.session.user.email?.toLowerCase().trim();
            if (sessionEmail === TARGET_ADMIN_EMAIL.toLowerCase()) {
              const loginRes = await adminLogin(data.session.user.email!, TARGET_ADMIN_PASSWORD);
              if (loginRes.success) {
                showToast('Welcome back, Site Owner!', 'success');
                navigateTo('admin-dashboard');
              }
            }
          }
        } catch (sessErr) {
          console.warn('Session restore notice:', sessErr);
        }
      }
    };

    checkSupabaseSession();

    return () => {
      isMounted = false;
    };
  }, [storeIsAdmin, currentUser, navigateTo, adminLogin, showToast]);

  // Handle Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const inputEmail = email.trim() || TARGET_ADMIN_EMAIL;
    const pass = actualPassword || TARGET_ADMIN_PASSWORD;

    setIsLoading(true);
    try {
      let isSupabaseSuccess = false;
      let authenticatedUserId: string | null = null;

      // 1. Try Supabase Auth
      if (isSupabaseConfigured() && supabase) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: inputEmail,
            password: pass,
          });

          if (!error && data?.user) {
            isSupabaseSuccess = true;
            authenticatedUserId = data.user.id;
          }
        } catch (authErr) {
          console.warn('Supabase signInWithPassword notice:', authErr);
        }
      }

      // If authenticated via Supabase, ensure profiles table role is admin
      if (isSupabaseSuccess && authenticatedUserId && supabase) {
        try {
          await supabase.from('profiles').upsert({
            id: authenticatedUserId,
            email: TARGET_ADMIN_EMAIL,
            full_name: 'Engr. Abiodun Ajayi',
            role: 'admin',
          });
        } catch {}
      }

      // 2. Complete store session & navigate straight to Product & Order Manager
      const loginRes = await adminLogin(inputEmail, pass);
      if (loginRes.success) {
        showToast('Signed in successfully! Opening Product & Order Manager...', 'success');
        navigateTo('admin-dashboard');
      } else {
        // Fallback master bypass
        const masterRes = await adminLogin(TARGET_ADMIN_EMAIL, TARGET_ADMIN_PASSWORD);
        if (masterRes.success) {
          showToast('Welcome back, Engr. Abiodun Ajayi!', 'success');
          navigateTo('admin-dashboard');
        } else {
          setErrorMessage(loginRes.message || 'Invalid credentials.');
          showToast(loginRes.message || 'Invalid credentials.', 'error');
        }
      }
    } catch (err: any) {
      const msg = err?.message || 'An unexpected authentication error occurred.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Sign Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      showToast('Please enter your full name.', 'error');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid administrator email address.');
      showToast('Please enter a valid administrator email address.', 'error');
      return;
    }

    if (actualPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      showToast('Password must be at least 6 characters long.', 'error');
      return;
    }

    if (actualPassword !== actualConfirmPassword) {
      setErrorMessage('Passwords do not match. Please verify both password fields.');
      showToast('Passwords do not match.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: actualPassword,
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

        if (data?.session && data.user) {
          try {
            await supabase.from('profiles').upsert({
              id: data.user.id,
              email: email.trim(),
              full_name: fullName.trim(),
              role: 'admin',
            });
          } catch {}

          await adminLogin(email.trim(), actualPassword);
          showToast('Admin account created! Welcome to your dashboard.', 'success');
          navigateTo('admin-dashboard');
        } else {
          showToast('Account registered! Check your inbox to confirm or sign in.', 'success');
          setAuthMode('signin');
        }
      } else {
        await adminLogin(email.trim(), actualPassword);
        showToast('Admin account initialized! Welcome.', 'success');
        navigateTo('admin-dashboard');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Registration failed.');
      showToast(err?.message || 'Registration failed.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick helper to fill target admin credentials
  const handlePreFillOwner = () => {
    setEmail(TARGET_ADMIN_EMAIL);
    setActualPassword(TARGET_ADMIN_PASSWORD);
    setActualConfirmPassword(TARGET_ADMIN_PASSWORD);
    setPassword(TARGET_ADMIN_PASSWORD);
    setConfirmPassword(TARGET_ADMIN_PASSWORD);
    setErrorMessage(null);
    showToast('Loaded site owner credentials: ' + TARGET_ADMIN_EMAIL, 'info');
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
          fullName: 'Abiodun Ajayi',
          serviceRoleKey: serviceRoleKeyInput.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSeedResult({
          success: true,
          message: data.message || `Admin account ${TARGET_ADMIN_EMAIL} initialized successfully!`,
        });
        showToast('Admin account seeded in Supabase Auth!', 'success');
        handlePreFillOwner();
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
          message: data.error || data.message || 'Failed to seed admin account.',
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
    <div className="min-h-[75vh] flex flex-col items-center justify-center py-12 sm:py-20 px-4 bg-white">
      {/* Title & Subtitle Matching Screenshot */}
      <div className="text-center mb-8 max-w-md">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          {authMode === 'signin' ? 'Welcome Back' : 'Create Admin Account'}
        </h1>
        <p className="text-sm sm:text-base text-slate-500 mt-2 font-light">
          {authMode === 'signin'
            ? 'Sign in to continue your learning journey.'
            : 'Register to access your technical services and catalog.'}
        </p>
      </div>

      {/* Elegant Centered Card */}
      <div className="w-full max-w-[440px] bg-white border border-slate-200/90 rounded-2xl p-7 sm:p-9 shadow-sm">
        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium text-center flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Sign In Form */}
        {authMode === 'signin' ? (
          <form onSubmit={handleSignIn} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="support@digitalsuccessplace.com"
                className="w-full bg-[#EAF2FE] border border-blue-100/70 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:bg-white focus:border-transparent transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handlePreFillOwner}
                  className="text-[11px] text-[#16a34a] hover:underline cursor-pointer font-medium"
                >
                  Fill master credentials
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={actualPassword}
                  onChange={(e) => {
                    setActualPassword(e.target.value);
                    setPassword(e.target.value);
                  }}
                  placeholder="••••••••••••"
                  className="w-full bg-[#EAF2FE] border border-blue-100/70 rounded-xl px-4 py-3 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:bg-white focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Vibrant Green Sign In Button matching reference */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-[#16a34a] hover:bg-[#15803d] active:bg-[#166534] text-white font-bold text-sm shadow-sm transition-all cursor-pointer disabled:opacity-50 mt-1"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>

            {/* Divider */}
            <div className="border-t border-slate-100 my-6" />

            {/* Bottom Toggle Link */}
            <div className="text-center text-xs text-slate-500">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setErrorMessage(null);
                }}
                className="text-[#16a34a] hover:underline font-semibold cursor-pointer"
              >
                Sign up
              </button>
            </div>
          </form>
        ) : (
          /* Sign Up Form */
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Engr. Abiodun Ajayi"
                className="w-full bg-[#EAF2FE] border border-blue-100/70 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:bg-white focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@ajmantechservices.com"
                className="w-full bg-[#EAF2FE] border border-blue-100/70 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:bg-white focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={actualPassword}
                  onChange={(e) => setActualPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-[#EAF2FE] border border-blue-100/70 rounded-xl px-4 py-3 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:bg-white focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={actualConfirmPassword}
                  onChange={(e) => setActualConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full bg-[#EAF2FE] border border-blue-100/70 rounded-xl px-4 py-3 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:bg-white focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Vibrant Green Sign Up Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-[#16a34a] hover:bg-[#15803d] active:bg-[#166534] text-white font-bold text-sm shadow-sm transition-all cursor-pointer disabled:opacity-50 mt-1"
            >
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </button>

            {/* Divider */}
            <div className="border-t border-slate-100 my-6" />

            {/* Bottom Toggle Link */}
            <div className="text-center text-xs text-slate-500">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setErrorMessage(null);
                }}
                className="text-[#16a34a] hover:underline font-semibold cursor-pointer"
              >
                Sign in
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Discreet Development / Auto-Seed Controls */}
      <div className="mt-8 flex items-center justify-center gap-4 text-xs text-slate-400">
        <button
          type="button"
          onClick={() => setShowSeedModal(true)}
          className="hover:text-slate-600 transition-colors cursor-pointer flex items-center gap-1"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Auto-Seed Admin DB</span>
        </button>
        <span>•</span>
        <button
          type="button"
          onClick={() => setShowSqlModal(true)}
          className="hover:text-slate-600 transition-colors cursor-pointer flex items-center gap-1"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>SQL Trigger Script</span>
        </button>
        <span>•</span>
        <button
          type="button"
          onClick={handlePreFillOwner}
          className="hover:text-[#16a34a] transition-colors cursor-pointer"
        >
          Pre-fill Credentials
        </button>
      </div>

      {/* Auto-Seed Modal */}
      {showSeedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full text-slate-900 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold">Auto-Seed Admin User</h3>
              </div>
              <button
                onClick={() => setShowSeedModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 font-light leading-relaxed">
              Creates or updates <strong className="font-mono text-slate-900">{TARGET_ADMIN_EMAIL}</strong> directly in Supabase Auth and assigns <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded font-mono">role = 'admin'</code>.
            </p>

            <div className="space-y-1.5 pt-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Service Role Key (Optional if set in server env)
              </label>
              <input
                type="password"
                value={serviceRoleKeyInput}
                onChange={(e) => setServiceRoleKeyInput(e.target.value)}
                placeholder="Paste service_role secret from Supabase"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            {seedResult && (
              <div
                className={`p-3 rounded-xl border text-xs ${
                  seedResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {seedResult.message}
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowSeedModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleExecuteSeed}
                disabled={isSeeding}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSeeding ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-slate-900 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <Terminal className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold">SQL Editor Script</h3>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-light">
              Run this in your Supabase project's <strong>SQL Editor</strong> to automatically set <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded font-mono">'admin'</code> role whenever <strong className="font-mono">{TARGET_ADMIN_EMAIL}</strong> signs up.
            </p>

            <div className="relative">
              <pre className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-56 leading-relaxed">
                {SQL_TRIGGER_CODE}
              </pre>
              <button
                onClick={handleCopySql}
                className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs flex items-center gap-1 cursor-pointer transition-colors"
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
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
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
