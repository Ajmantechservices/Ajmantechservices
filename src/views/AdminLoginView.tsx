import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import {
  ShieldCheck,
  Lock,
  Mail,
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

  // Pre-configured with target admin credentials
  const [email, setEmail] = useState<string>(TARGET_ADMIN_EMAIL);
  const [password, setPassword] = useState<string>(TARGET_ADMIN_PASSWORD);
  const [showPassword, setShowPassword] = useState(false);
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

  // Read URL error query param if redirected from middleware or dashboard
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

  // If already logged in as admin, check if email is EXACTLY target admin
  useEffect(() => {
    if (storeIsAdmin) {
      if (currentUser?.email?.toLowerCase().trim() === TARGET_ADMIN_EMAIL.toLowerCase()) {
        navigateTo('admin-dashboard');
      } else {
        adminLogout();
        setIsPrivilegeError(true);
        setErrorMessage('Unauthorized access: Only the site owner can log into this dashboard.');
      }
    }
  }, [storeIsAdmin, currentUser, navigateTo, adminLogout]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsPrivilegeError(false);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    const inputEmail = email.trim().toLowerCase();
    const targetEmail = TARGET_ADMIN_EMAIL.toLowerCase();

    // 1. Initial hard-lock: Check if input email is EXACTLY joshuaajayi0148@gmail.com
    if (inputEmail !== targetEmail) {
      if (supabase && isSupabaseConfigured()) {
        try {
          await supabase.auth.signOut();
        } catch {}
      }
      setIsPrivilegeError(true);
      setErrorMessage('Unauthorized access: Only the site owner can log into this dashboard.');
      showToast('Unauthorized access: Only the site owner can log into this dashboard.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      // 2. Authenticate using supabase.auth.signInWithPassword({ email, password })
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error || !data.user) {
        setErrorMessage(error?.message || 'Invalid email or password.');
        setIsLoading(false);
        return;
      }

      // 3. Hard-lock check: authenticated user's email MUST be EXACTLY joshuaajayi0148@gmail.com
      const user = data.user;
      const authenticatedEmail = user.email?.trim().toLowerCase();

      if (authenticatedEmail !== targetEmail) {
        await supabase.auth.signOut();
        setIsPrivilegeError(true);
        setErrorMessage('Unauthorized access: Only the site owner can log into this dashboard.');
        showToast('Unauthorized access: Only the site owner can log into this dashboard.', 'error');
        setIsLoading(false);
        return;
      }

      // 4. Check user role using both sources:
      const metaRole = user?.user_metadata?.role;
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      let isAdmin = profile?.role === 'admin' || metaRole === 'admin';

      // Self-heal profile role for target admin email if missing
      if (!isAdmin && authenticatedEmail === targetEmail) {
        try {
          await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || 'Joshua Ajayi',
              role: 'admin',
            });
          isAdmin = true;
        } catch {}
      }

      if (isAdmin) {
        const loginRes = await adminLogin(email.trim(), password);
        if (loginRes.success) {
          showToast('Authentication successful! Welcome to the Admin Portal.');
          navigateTo('admin-dashboard');
        } else {
          setErrorMessage(loginRes.message || 'Unauthorized access: Only the site owner can log into this dashboard.');
          setIsPrivilegeError(true);
        }
      } else {
        await supabase.auth.signOut();
        setIsPrivilegeError(true);
        setErrorMessage('Unauthorized access: Only the site owner can log into this dashboard.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected authentication error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetToTargetAdmin = () => {
    setEmail(TARGET_ADMIN_EMAIL);
    setPassword(TARGET_ADMIN_PASSWORD);
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
        // Pre-fill credentials in case user edited them
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
      }
    } catch (err: any) {
      setSeedResult({
        success: false,
        message: err?.message || 'Network error executing /api/seed-admin',
      });
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

        {/* Main Login Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-black/50 text-white backdrop-blur-xl">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 shadow-lg shadow-amber-500/20 mb-3">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">AjmanTech Admin Portal</h1>
            <p className="text-sm text-slate-400 mt-1 font-light">
              Administrator Authentication & Role Gate
            </p>
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-mono">
              <Sparkles className="w-3 h-3" /> Pre-configured for: {TARGET_ADMIN_EMAIL}
            </div>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div
              id="admin-login-error"
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
                    Your account is registered, but the Supabase <code className="bg-rose-900/60 px-1 py-0.5 rounded font-mono text-[10px]">profiles</code> table does not have <code className="bg-rose-900/60 px-1 py-0.5 rounded font-mono text-[10px]">role = 'admin'</code>. Click "Auto-Seed Admin" below to set role automatically.
                  </p>
                ) : (
                  <p className="text-[11px] text-amber-300/90 font-light">
                    If this account was newly created without email verification, use the Auto-Seed endpoint to confirm the email and set password to Ayomide0148.
                  </p>
                )}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowSeedModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-[11px] hover:bg-amber-400 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Auto-Seed / Confirm Account Now
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
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
                  <span>Verifying Admin Role in profiles...</span>
                </>
              ) : (
                <>
                  <span>Sign In as Administrator</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

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

              <div
                id="admin-registration-disabled-badge"
                className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 font-mono bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60"
              >
                <Lock className="w-3 h-3 text-amber-400" /> Public Registration Disabled
              </div>
            </div>
          </div>
        </div>

        {/* Informational Guidance */}
        <div className="mt-6 p-4 rounded-2xl bg-slate-800/40 border border-slate-800 text-slate-400 text-xs flex items-start gap-3">
          <Database className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed text-[11px]">
            <span className="font-bold text-slate-300">Admin Authentication Flow: </span>
            Submitting this form authenticates via Supabase Auth and queries the <code className="text-amber-400 font-mono">public.profiles</code> table for <code className="text-white font-mono">role = 'admin'</code>. If valid, you are redirected to <strong className="text-white">/admin/dashboard</strong>.
          </div>
        </div>
      </div>

      {/* MODAL 1: Programmatic Auto-Seed Modal */}
      {showSeedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Auto-Seed Admin Account</h3>
                  <p className="text-xs text-slate-400">Executes Auth Admin API with email_confirm: true</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSeedModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                This executes the backend initialization route (<code className="text-amber-400 font-mono">/api/seed-admin</code>). It will:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1 text-[11.5px]">
                <li>Search for <strong className="text-white font-mono">{TARGET_ADMIN_EMAIL}</strong> in <code className="text-amber-400">auth.users</code>.</li>
                <li>If exists: updates password to <strong className="text-white font-mono">{TARGET_ADMIN_PASSWORD}</strong> and sets <code className="text-emerald-400">email_confirm = true</code>.</li>
                <li>If not: creates the account with confirmed email and password <strong className="text-white font-mono">{TARGET_ADMIN_PASSWORD}</strong>.</li>
                <li>Upserts <code className="text-amber-400 font-mono">public.profiles</code> to enforce <code className="text-emerald-400 font-mono">role = 'admin'</code>.</li>
              </ul>

              {/* Service Role Key Input (optional if already configured in environment) */}
              <div className="pt-2">
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                  Supabase Service Role Key (Optional if set in server env)
                </label>
                <input
                  type="password"
                  placeholder="Paste service_role secret from Supabase Dashboard -> Settings -> API"
                  value={serviceRoleKeyInput}
                  onChange={(e) => setServiceRoleKeyInput(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-amber-400"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Obtain this from your Supabase Dashboard → Settings → API → <code className="text-slate-400">Project API Keys</code> → <code className="text-amber-400">service_role</code> secret.
                </p>
              </div>

              {/* Result Message */}
              {seedResult && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                    seedResult.success
                      ? 'bg-emerald-950/50 border-emerald-800 text-emerald-200'
                      : 'bg-rose-950/50 border-rose-800 text-rose-200'
                  }`}
                >
                  {seedResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold">{seedResult.success ? 'Success' : 'Error'}</div>
                    <div className="text-[11px] mt-0.5 leading-normal">{seedResult.message}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowSeedModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleExecuteSeed}
                disabled={isSeeding}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSeeding ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Seeding...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Execute Auto-Seed (/api/seed-admin)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: SQL Trigger Reference */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">Supabase Automatic Admin Trigger SQL</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Run this SQL script in your Supabase project's <strong>SQL Editor</strong>. It automatically assigns the <code className="text-amber-400 font-mono">'admin'</code> role in <code className="text-slate-300 font-mono">public.profiles</code> whenever <strong className="text-white font-mono">{TARGET_ADMIN_EMAIL}</strong> signs up.
            </p>

            <div className="relative">
              <pre className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-[11px] font-mono text-amber-300 overflow-x-auto max-h-60 leading-relaxed select-all">
                {SQL_TRIGGER_CODE}
              </pre>
              <button
                type="button"
                onClick={handleCopySql}
                className="absolute top-2 right-2 px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-white text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Copied!' : 'Copy SQL'}</span>
              </button>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
