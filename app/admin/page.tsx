// app/admin/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Master admin credentials (supports both support@ and owner account)
    const MASTER_EMAIL = 'support@ajmantechservices.com';
    const MASTER_PASSWORD = 'YourSecretAdminPassword123';

    const isValidAdmin =
      (email.trim().toLowerCase() === MASTER_EMAIL.toLowerCase() && password === MASTER_PASSWORD) ||
      (email.trim().toLowerCase() === 'joshuaajayi0148@gmail.com' && (password === 'Ayomide0148' || password === MASTER_PASSWORD));

    if (isValidAdmin) {
      sessionStorage.setItem('ats_admin_auth', 'true');
      setIsAuthenticated(true);
    } else {
      setError('Invalid email or password. Please try again.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('ats_admin_auth');
    setIsAuthenticated(false);
    setEmail('');
    setPassword('');
  };

  if (loading) return null;

  // --- IF LOGGED IN: SHOW YOUR PRODUCT EDITOR DASHBOARD ---
  if (isAuthenticated) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Ajman Tech Services — Product Manager</h1>
              <p className="text-sm text-slate-500">Manage, edit, and update your live service listings.</p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/" className="text-sm text-slate-600 hover:text-slate-900 font-medium">
                View Storefront →
              </Link>
              <button
                onClick={handleLogout}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
              >
                Log Out
              </button>
            </div>
          </div>

          {/* Product Editor / Management Area */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Live Product Inventory</h2>
            <p className="text-sm text-slate-600 mb-6">
              Here you can update your active offerings, prices, and descriptions.
            </p>
            <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-500 text-sm">
              Product editing interface ready for your inventory items.
            </div>
          </div>
        </div>
      </main>
    );
  }

  // --- IF NOT LOGGED IN: SHOW THE CLEAN LOGIN FORM ---
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-2xl p-8 shadow-xl shadow-slate-100">
        
        {/* Header updated to Welcome */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to manage your technical services and catalog.</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium rounded-lg text-center">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="support@ajmantechservices.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl py-3 text-sm transition-all shadow-md shadow-emerald-600/10 mt-2 cursor-pointer"
          >
            Sign In
          </button>
        </form>

        <div className="text-center mt-6">
          <Link href="/" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
            ← Return to main website
          </Link>
        </div>

      </div>
    </main>
  );
}
