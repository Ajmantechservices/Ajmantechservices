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
} from 'lucide-react';
import {
  TARGET_ADMIN_EMAIL,
  getSupabaseConfigStatus,
  signUpAdminWithSupabase,
} from '../lib/supabase';

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
  const {
    adminLogin,
    navigateTo,
    showToast,
    isAdmin: storeIsAdmin,
    isAuthChecking,
    currentUser,
    currentView,
  } = useStore();
  const postLoginView = currentView === 'admin-products' ? 'admin-products' : 'admin-dashboard';

  // Auth Mode: 'signin' | 'signup'
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  // Form Fields (never pre-fill hardcoded passwords)
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [actualPassword, setActualPassword] = useState<string>('');
  const [actualConfirmPassword, setActualConfirmPassword] = useState<string>('');

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
  const [seedPasswordInput, setSeedPasswordInput] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  const supabaseStatus = getSupabaseConfigStatus();

  // Navigate to admin view once StoreContext verifies an active Supabase admin session
  useEffect(() => {
    if (
      !isAuthChecking &&
      storeIsAdmin &&
      currentUser?.role === 'admin' &&
      currentUser?.email?.toLowerCase().trim() === TARGET_ADMIN_EMAIL.toLowerCase()
    ) {
      navigateTo(postLoginView);
    }
  }, [isAuthChecking, storeIsAdmin, currentUser, navigateTo, postLoginView]);

  // Handle Sign In strictly through StoreContext -> signInAdminWithSupabase
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const inputEmail = email.trim();
    if (!inputEmail || !actualPassword) {
      const msg = 'Please enter both your administrator email and password.';
      setErrorMessage(msg);
      showToast(msg, 'error');
      return;
    }

    setIsLoading(true);
    try {
      const loginRes = await adminLogin(inputEmail, actualPassword);
      if (loginRes.success) {
        navigateTo(postLoginView);
      } else {
        setErrorMessage(loginRes.message || 'Invalid administrator credentials.');
        showToast(loginRes.message || 'Invalid administrator credentials.', 'error');
      }
    } catch (err: any) {
      const msg = err?.message || 'An unexpected authentication error occurred.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Sign Up strictly through Supabase helper (enforces owner-only restriction)
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
      const res = await signUpAdminWithSupabase(fullName.trim(), email.trim(), actualPassword);
      if (res.success) {
        showToast(res.message || 'Admin account created!', 'success');
        setAuthMode('signin');
      } else {
        setErrorMessage(res.message);
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Registration failed.');
      showToast(err?.message || 'Registration failed.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteSeed = async () => {
    setSeedResult(null);
    if (!seedPasswordInput || seedPasswordInput.length < 6) {
      setSeedResult({
        success: false,
        message: 'Please enter an admin password (at least 6 characters) to seed the account.',
      });
      return;
    }

    setIsSeeding(true);
    try {
      const response = await fetch('/api/seed-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(serviceRoleKeyInput.trim() ? { 'x-service-role-key': serviceRoleKeyInput.trim() } : {}),
        },
        body: JSON.stringify({
          email: TARGET_ADMIN_EMAIL,
          password: seedPasswordInput,
          fullName: 'Abiodun Ajayi',
          serviceRoleKey: serviceRoleKeyInput.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSeedResult({
          success: true,
          message:
            data.message ||
            `Admin account ${TARGET_ADMIN_EMAIL} initialized successfully. Close this dialog and sign in with your password.`,
        });
        setSeedPasswordInput('');
        showToast('Admin account seeded in Supabase Auth! You can now sign in.', 'success');
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

  if (isAuthChecking) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 bg-white">
        <div className="w-8 h-8 border-2 border-[#16a34a] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm text-slate-500">Verifying administrator session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center py-12 sm:py-20 px-4 bg-white">
      {/* Title & Subtitle */}
      <div className="text-center mb-8 max-w-md">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          {authMode === 'signin' ? 'Admin Sign In' : 'Admin Registration'}
        </h1>
        <p className="text-sm sm:text-base text-slate-500 mt-2 font-light">
          {authMode === 'signin'
            ? 'Authenticate with your Supabase administrator account to manage AjmanTech.'
            : 'Public registration is restricted to the verified site owner.'}
        </p>
      </div>

      {/* Centered Card */}
      <div className="w-full max-w-[440px] bg-white border border-slate-200/90 rounded-2xl p-7 sm:p-9 shadow-sm">
        {!supabaseStatus.isConfigured && (
          <div className="mb-5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Supabase environment variables are not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to authenticate.
            </span>
          </div>
        )}

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
                placeholder="admin@example.com"
                autoComplete="email"
                className="w-full bg-[#EAF2FE] border border-blue-100/70 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:bg-white focus:border-transparent transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-700">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={actualPassword}
                  onChange={(e) => setActualPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
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

            <button
              type="submit"
              disabled={isLoading || !supabaseStatus.isConfigured}
              className="w-full py-3 px-4 rounded-xl bg-[#16a34a] hover:bg-[#15803d] active:bg-[#166534] text-white font-bold text-sm shadow-sm transition-all cursor-pointer disabled:opacity-50 mt-1"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>

            <div className="border-t border-slate-100 my-6" />

            <div className="text-center text-xs text-slate-500">
              Need setup help?{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setErrorMessage(null);
                }}
                className="text-[#16a34a] hover:underline font-semibold cursor-pointer"
              >
                Admin Registration Info
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
                placeholder="Enter your full name"
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
                placeholder="admin@example.com"
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-[#16a34a] hover:bg-[#15803d] active:bg-[#166534] text-white font-bold text-sm shadow-sm transition-all cursor-pointer disabled:opacity-50 mt-1"
            >
              {isLoading ? 'Submitting...' : 'Sign Up'}
            </button>

            <div className="border-t border-slate-100 my-6" />

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

      {/* Discreet Setup Utilities */}
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
                New Admin Password
              </label>
              <input
                type="password"
                value={seedPasswordInput}
                onChange={(e) => setSeedPasswordInput(e.target.value)}
                placeholder="Enter password (min 6 characters)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
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

