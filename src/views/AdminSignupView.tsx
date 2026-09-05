import React, { useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import {
  ShieldAlert,
  Lock,
  ArrowLeft,
  ArrowRight,
  Mail,
  ExternalLink,
} from 'lucide-react';
import { TARGET_ADMIN_EMAIL } from '../lib/supabase';

/**
 * AdminSignupView: Public user registration for admin access is disabled.
 * Only the designated site owner (joshuaajayi0148@gmail.com) can log into the dashboard.
 */
export const AdminSignupView: React.FC = () => {
  const { navigateTo, showToast } = useStore();

  useEffect(() => {
    // Notify user that admin registration is disabled
    showToast('Unauthorized access: Public admin registration is disabled.', 'error');
  }, [showToast]);

  const handleReturnToLogin = () => {
    if (typeof window !== 'undefined') {
      window.history.replaceState(
        null,
        '',
        `/admin/login?error=${encodeURIComponent(
          'Unauthorized access: Only the site owner can log into this dashboard.'
        )}`
      );
    }
    navigateTo('admin-login');
  };

  return (
    <div id="admin-signup-page" className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-slate-900/95 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        {/* Top return link */}
        <div className="mb-6 flex items-center justify-between">
          <button
            id="back-to-login-btn"
            onClick={handleReturnToLogin}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Admin Sign In
          </button>
          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800 flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-rose-400" />
            Registration Closed
          </span>
        </div>

        {/* Disabled Notice Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-black/50 text-white backdrop-blur-xl space-y-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30 mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Public Admin Registration Disabled
            </h1>
            <p className="text-sm text-slate-400 font-light leading-relaxed">
              Administrative access to the AjmanTech Services dashboard is strictly restricted and hard-locked to the authorized site owner.
            </p>
          </div>

          {/* Security details box */}
          <div className="bg-slate-800/80 border border-rose-500/30 rounded-2xl p-5 text-left space-y-3 text-xs text-slate-300">
            <div className="flex items-center gap-2 text-rose-400 font-bold uppercase tracking-wider text-[11px]">
              <Lock className="w-3.5 h-3.5" />
              <span>Owner-Restricted Policy</span>
            </div>
            <p className="text-slate-300 leading-relaxed font-light">
              Public account creation for admin privileges has been permanently removed. Only the single designated owner account may authenticate to this dashboard:
            </p>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-2.5 font-mono text-amber-400 text-xs">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{TARGET_ADMIN_EMAIL}</span>
            </div>
          </div>

          {/* Action button */}
          <div className="pt-2">
            <button
              id="proceed-to-admin-login-btn"
              onClick={handleReturnToLogin}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Go to Admin Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
