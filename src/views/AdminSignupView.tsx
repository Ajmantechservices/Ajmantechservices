import React, { useState } from 'react';
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
  CheckCircle2,
  ArrowLeft,
  Copy,
  Check,
  Database,
  ExternalLink,
} from 'lucide-react';
import { getSupabaseConfigStatus } from '../lib/supabase';

export const AdminSignupView: React.FC = () => {
  const { adminSignUp, navigateTo, showToast } = useStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const supabaseStatus = getSupabaseConfigStatus();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim() || !email.trim() || !password) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters in length.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await adminSignUp(fullName.trim(), email.trim(), password);
      if (result.success) {
        setIsSuccess(true);
        showToast('Account registered! Follow role setup to activate admin access.', 'success');
      } else {
        setErrorMessage(result.message || 'Failed to create admin account.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An error occurred during registration.');
    } finally {
      setIsLoading(false);
    }
  };

  const sqlRolePromotion = `-- Run this in Supabase SQL Editor to grant admin access
UPDATE public.profiles
SET role = 'admin'
WHERE email = '${email || 'your-admin-email@example.com'}';`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlRolePromotion);
    setCopiedSql(true);
    showToast('SQL command copied to clipboard!', 'success');
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div id="admin-signup-page" className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-slate-900/95 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        {/* Top return link */}
        <div className="mb-6 flex items-center justify-between">
          <button
            id="back-to-login-btn"
            onClick={() => navigateTo('admin-login')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin Sign In
          </button>
          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${supabaseStatus.isConfigured ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            {supabaseStatus.isConfigured ? 'Supabase Auth' : 'Local Auth Mode'}
          </span>
        </div>

        {/* Success Modal / State */}
        {isSuccess ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-black/50 text-white backdrop-blur-xl animate-fade-in space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white">Account Created Successfully!</h2>
              <p className="text-sm text-slate-400 mt-1 font-light">
                Your credentials have been registered for <strong className="text-white">{email}</strong>
              </p>
            </div>

            {/* Admin Role Promotion Instructions */}
            <div className="bg-slate-800/80 border border-amber-500/30 rounded-2xl p-5 space-y-3.5 text-xs text-slate-300">
              <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider text-[11px]">
                <Database className="w-4 h-4" />
                <span>Next Step: Promote Account to Administrator</span>
              </div>
              <p className="leading-relaxed text-slate-300 font-light">
                To prevent unauthorized admin access, newly registered accounts are set with <code className="bg-slate-950 px-1.5 py-0.5 rounded text-amber-300 font-mono text-[11px]">role = 'customer'</code> by default.
              </p>

              <div className="space-y-2">
                <div className="font-semibold text-white">Choose either method to activate your admin role:</div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px] pl-1 font-light">
                  <li>
                    Open your <strong className="text-white">Supabase Dashboard → Table Editor → profiles</strong> table.
                  </li>
                  <li>
                    Locate <strong className="text-amber-300 font-mono">{email}</strong> and double-click the <strong className="text-white">role</strong> column.
                  </li>
                  <li>
                    Change the value from <code className="bg-slate-950 px-1 py-0.5 rounded font-mono text-[10px]">'customer'</code> to <code className="bg-emerald-950 text-emerald-300 px-1 py-0.5 rounded font-mono text-[10px]">'admin'</code> and save.
                  </li>
                </ol>
              </div>

              {/* SQL Snippet */}
              <div className="pt-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                  <span>Or run in Supabase SQL Editor:</span>
                  <button
                    onClick={handleCopySql}
                    className="text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 font-sans text-xs font-semibold cursor-pointer"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedSql ? 'Copied' : 'Copy SQL'}
                  </button>
                </div>
                <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto">
                  {sqlRolePromotion}
                </pre>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                id="proceed-to-admin-login-btn"
                onClick={() => navigateTo('admin-login')}
                className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed to Admin Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Registration Form Card */
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-black/50 text-white backdrop-blur-xl">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 shadow-lg shadow-amber-500/20 mb-4">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Admin Account Registration</h1>
              <p className="text-sm text-slate-400 mt-1 font-light">
                Create an administrator profile for AjmanTech Services
              </p>
            </div>

            {/* Error Alert */}
            {errorMessage && (
              <div
                id="admin-signup-error"
                className="mb-6 p-4 rounded-2xl bg-rose-950/40 border border-rose-800/80 text-rose-200 text-xs leading-relaxed flex items-start gap-3"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <div>
                  <div className="font-bold text-white">{errorMessage}</div>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSignup} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="admin-signup-name"
                    type="text"
                    required
                    placeholder="e.g. Engr. Joshua Ajayi"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                  />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="admin-signup-email"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="admin-signup-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                      Confirm
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-500 hover:text-slate-300 text-[11px] flex items-center gap-1"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showPassword ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="admin-signup-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                id="create-admin-account-btn"
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Registering Account in Supabase...</span>
                  </>
                ) : (
                  <>
                    <span>Create Admin Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Bottom link */}
            <div className="mt-6 pt-6 border-t border-slate-800 text-center text-xs text-slate-400">
              <span>Already have an admin account?</span>{' '}
              <button
                id="switch-to-login-btn"
                onClick={() => navigateTo('admin-login')}
                className="font-bold text-amber-400 hover:text-amber-300 transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
