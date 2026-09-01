import React, { useState } from 'react';
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
} from 'lucide-react';
import { isSupabaseConfigured, getSupabaseConfigStatus } from '../lib/supabase';

export const AdminLoginView: React.FC = () => {
  const { adminLogin, navigateTo, showToast } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPrivilegeError, setIsPrivilegeError] = useState(false);

  const supabaseStatus = getSupabaseConfigStatus();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsPrivilegeError(false);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await adminLogin(email.trim(), password);
      if (!result.success) {
        setErrorMessage(result.message || 'Access denied: Administrator privileges required.');
        if (result.isPrivilegeDenied || result.message.includes('Administrator privileges required')) {
          setIsPrivilegeError(true);
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected authentication error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseDemoCredentials = () => {
    setEmail('admin@ajmantech.ng');
    setPassword('admin123');
    setErrorMessage(null);
    setIsPrivilegeError(false);
    showToast('Loaded demo administrator credentials', 'info');
  };

  return (
    <div id="admin-login-page" className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-slate-900/95 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Top return link */}
        <div className="mb-6 flex items-center justify-between">
          <button
            id="back-to-storefront-btn"
            onClick={() => navigateTo('home')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Storefront
          </button>
          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${supabaseStatus.isConfigured ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            {supabaseStatus.isConfigured ? 'Supabase Auth' : 'Local Auth Mode'}
          </span>
        </div>

        {/* Main Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-black/50 text-white backdrop-blur-xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 shadow-lg shadow-amber-500/20 mb-4">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">AjmanTech Admin Portal</h1>
            <p className="text-sm text-slate-400 mt-1 font-light">
              Sign in with your administrator credentials
            </p>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div
              id="admin-login-error"
              className={`mb-6 p-4 rounded-2xl border text-xs leading-relaxed flex items-start gap-3 animate-shake ${
                isPrivilegeError
                  ? 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                  : 'bg-amber-950/40 border-amber-800/80 text-amber-200'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div className="space-y-1">
                <div className="font-bold text-white">{errorMessage}</div>
                {isPrivilegeError && (
                  <p className="text-[11px] text-rose-300/90 font-light">
                    Your account is registered as a customer. To access this dashboard, an administrator must update your record in the Supabase <code className="bg-rose-900/60 px-1 py-0.5 rounded font-mono text-[10px]">profiles</code> table to <code className="bg-rose-900/60 px-1 py-0.5 rounded font-mono text-[10px]">role = 'admin'</code>.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="admin-email-input"
                  type="email"
                  required
                  placeholder="admin@ajmantech.ng"
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
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
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
                  <span>Verifying Admin Permissions...</span>
                </>
              ) : (
                <>
                  <span>Sign In as Administrator</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Fill Demo credentials for evaluation */}
          <div className="mt-6 pt-6 border-t border-slate-800 text-center space-y-4">
            <button
              id="quick-demo-admin-btn"
              type="button"
              onClick={handleUseDemoCredentials}
              className="w-full py-2 px-3 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/70 text-slate-300 hover:text-white text-xs font-mono flex items-center justify-center gap-2 transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Fill Quick Demo Credentials (admin@ajmantech.ng)</span>
            </button>

            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <span>Need a new admin account?</span>
              <button
                id="go-to-admin-signup-btn"
                onClick={() => navigateTo('admin-signup')}
                className="font-bold text-amber-400 hover:text-amber-300 transition-colors"
              >
                Register / Sign Up
              </button>
            </div>
          </div>
        </div>

        {/* Tip Box */}
        <div className="mt-6 p-4 rounded-2xl bg-slate-800/40 border border-slate-800 text-slate-400 text-xs flex items-start gap-3">
          <Database className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed text-[11px]">
            <span className="font-bold text-slate-300">Admin Account Tip: </span>
            After creating an account through the signup page, open your{' '}
            <strong className="text-white">Supabase Dashboard → Table Editor → profiles</strong> table and change your account's <code className="text-amber-400 font-mono">role</code> column value from <code className="text-slate-300 font-mono">'customer'</code> to <code className="text-amber-400 font-mono">'admin'</code>.
          </div>
        </div>
      </div>
    </div>
  );
};
