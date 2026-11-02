// app/admin/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminLogin() {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('support@digitalsuccessplace.com');
  const [password, setPassword] = useState('••••••••••••');
  const [actualPassword, setActualPassword] = useState('Ayomide0148');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if already authenticated in this browser session on load
  useEffect(() => {
    const authStatus = sessionStorage.getItem('ats_admin_auth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handlePreFill = () => {
    setEmail('joshuaajayi0148@gmail.com');
    setActualPassword('Ayomide0148');
    setPassword('Ayomide0148');
    setError('');
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const targetEmail = email.trim().toLowerCase();
    const currentPass = actualPassword || password;

    if (authMode === 'signup') {
      // Simulate/register admin account
      if (!email || !currentPass) {
        setError('Please enter a valid email and password.');
        return;
      }
      setSuccessMsg('Account registered! You can now sign in with your credentials.');
      setAuthMode('signin');
      return;
    }

    // Sign In validation
    const MASTER_EMAIL = 'support@ajmantechservices.com';
    const MASTER_PASSWORD = 'YourSecretAdminPassword123';

    const isValidAdmin =
      (targetEmail === MASTER_EMAIL.toLowerCase() && (currentPass === MASTER_PASSWORD || currentPass === 'Ayomide0148')) ||
      (targetEmail === 'joshuaajayi0148@gmail.com' && (currentPass === 'Ayomide0148' || currentPass === MASTER_PASSWORD)) ||
      (targetEmail === 'support@digitalsuccessplace.com' && (currentPass === 'Ayomide0148' || currentPass === MASTER_PASSWORD));

    if (isValidAdmin) {
      sessionStorage.setItem('ats_admin_auth', 'true');
      setIsAuthenticated(true);
    } else {
      setError('Invalid email or password. Please check your credentials.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('ats_admin_auth');
    setIsAuthenticated(false);
    setEmail('');
    setPassword('');
    setActualPassword('');
  };

  if (loading) return null;

  // --- IF LOGGED IN: SHOW ADMIN INVENTORY & SERVICE MANAGER ---
  if (isAuthenticated) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900 p-6 sm:p-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-200">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Admin Session Active
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                AjmanTech Services — Admin Portal
              </h1>
              <p className="text-sm text-slate-500">
                Manage, edit, and update your live service listings and catalog.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="text-sm text-slate-600 hover:text-slate-900 font-medium px-4 py-2 rounded-xl bg-white border border-slate-200 shadow-sm transition-all"
              >
                ← View Storefront
              </Link>
              <button
                onClick={handleLogout}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-sm font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                Log Out
              </button>
            </div>
          </div>

          {/* Product & Service Dashboard Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-semibold mb-2 text-slate-900">Live Inventory & Offerings</h2>
            <p className="text-sm text-slate-600 mb-6">
              You are signed in as the authorized administrator for AjmanTech Services.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Electrical Products</span>
                <p className="text-2xl font-extrabold text-slate-900 mt-2">12 Active</p>
                <p className="text-xs text-slate-500 mt-1">Solar, Lighting, Breakers & Wiring</p>
              </div>
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Services</span>
                <p className="text-2xl font-extrabold text-slate-900 mt-2">4 Packages</p>
                <p className="text-xs text-slate-500 mt-1">Installation, Solar Audit & Automation</p>
              </div>
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Store Status</span>
                <p className="text-2xl font-extrabold text-[#16a34a] mt-2">Online</p>
                <p className="text-xs text-slate-500 mt-1">Accepting orders & booking requests</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // --- IF NOT LOGGED IN: SHOW THE CLEAN "WELCOME BACK" DESIGN MATCHING SCREENSHOT ---
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-4 sm:p-8">
      {/* Centered Heading & Subtitle */}
      <div className="text-center mb-8 max-w-md">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          {authMode === 'signin' ? 'Welcome Back' : 'Create Account'}
        </h1>
        <p className="text-sm sm:text-base text-slate-500 mt-2 font-normal">
          {authMode === 'signin'
            ? 'Sign in to continue your learning journey.'
            : 'Register your administrator credentials.'}
        </p>
      </div>

      {/* Elegant Centered Card */}
      <div className="w-full max-w-[440px] bg-white border border-slate-200/90 rounded-2xl p-7 sm:p-9 shadow-sm">
        {/* Error / Success Notifications */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium text-center">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium text-center">
            {successMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-5">
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
                onClick={handlePreFill}
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
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Solid Green Button */}
          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-[#16a34a] hover:bg-[#15803d] active:bg-[#166534] text-white font-bold text-sm shadow-sm transition-all cursor-pointer mt-1"
          >
            {authMode === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>

          {/* Divider */}
          <div className="border-t border-slate-100 my-6" />

          {/* Bottom Switch Toggle */}
          <div className="text-center text-xs text-slate-500">
            {authMode === 'signin' ? (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setError('');
                  }}
                  className="text-[#16a34a] hover:underline font-semibold cursor-pointer"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setError('');
                  }}
                  className="text-[#16a34a] hover:underline font-semibold cursor-pointer"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </form>
      </div>

      {/* Return link */}
      <div className="text-center mt-6">
        <Link href="/" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
          ← Return to storefront
        </Link>
      </div>
    </main>
  );
}
