'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/src/lib/supabase';

const TARGET_ADMIN_EMAIL = 'joshuaajayi0148@gmail.com';

export default function AdminPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [fullName, setFullName] = useState('Engr. Joshua Ajayi');
  const [email, setEmail] = useState(TARGET_ADMIN_EMAIL);
  const [password, setPassword] = useState('Ayomide0148');
  const [confirmPassword, setConfirmPassword] = useState('Ayomide0148');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // 1. Client-side protection: check active session on mount
  useEffect(() => {
    let isMounted = true;
    const checkSession = async () => {
      if (isSupabaseConfigured() && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && isMounted) {
            const userEmail = session.user.email?.toLowerCase().trim();
            if (userEmail === TARGET_ADMIN_EMAIL.toLowerCase()) {
              setIsAuthenticated(true);
            }
          }
        } catch (e) {
          console.warn('Session check:', e);
        }
      }
    };
    checkSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!email.trim() || !password) {
      setMessage({ text: 'Please provide both email and password.', type: 'error' });
      return;
    }

    if (email.trim().toLowerCase() !== TARGET_ADMIN_EMAIL.toLowerCase()) {
      setMessage({
        text: 'Unauthorized: Only the designated site owner (joshuaajayi0148@gmail.com) can access this dashboard.',
        type: 'error',
      });
      return;
    }

    setIsLoading(true);
    try {
      if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setMessage({ text: error.message, type: 'error' });
          setIsLoading(false);
          return;
        }

        if (data?.user) {
          setIsAuthenticated(true);
          setMessage({ text: 'Signed in successfully! Loading Dashboard...', type: 'success' });
          router.push('/admin/dashboard');
          return;
        }
      }

      // Local fallback for target credentials
      if (password === 'Ayomide0148') {
        setIsAuthenticated(true);
        setMessage({ text: 'Authenticated via site owner master credentials.', type: 'success' });
        router.push('/');
      } else {
        setMessage({ text: 'Invalid administrator password.', type: 'error' });
      }
    } catch (err: any) {
      setMessage({ text: err?.message || 'Authentication error.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!fullName.trim() || !email.trim()) {
      setMessage({ text: 'Please fill in all required fields.', type: 'error' });
      return;
    }

    if (email.trim().toLowerCase() !== TARGET_ADMIN_EMAIL.toLowerCase()) {
      setMessage({
        text: 'Unauthorized: Admin registration is strictly reserved for joshuaajayi0148@gmail.com.',
        type: 'error',
      });
      return;
    }

    if (password.length < 6) {
      setMessage({ text: 'Password must be at least 6 characters.', type: 'error' });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ text: 'Passwords do not match.', type: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      if (isSupabaseConfigured() && supabase) {
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
          setMessage({ text: error.message, type: 'error' });
          setIsLoading(false);
          return;
        }

        if (data?.session) {
          setIsAuthenticated(true);
          setMessage({ text: 'Admin account created and logged in successfully!', type: 'success' });
          router.push('/admin/dashboard');
        } else {
          setMessage({
            text: 'Registration submitted! Please verify your email or sign in.',
            type: 'success',
          });
          setAuthMode('signin');
        }
      } else {
        setIsAuthenticated(true);
        setMessage({ text: 'Local admin account registered!', type: 'success' });
      }
    } catch (err: any) {
      setMessage({ text: err?.message || 'Registration failed.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-white">Administrator Authenticated</h1>
          <p className="text-xs text-slate-400">
            Welcome, Engr. Joshua Ajayi ({TARGET_ADMIN_EMAIL})
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold text-xs"
            >
              Open Full Storefront & Control Panel
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 relative overflow-hidden">
      <div className="w-full max-w-md relative z-10 space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xs text-slate-400 hover:text-white transition-colors">
            ← Return to Storefront
          </Link>
          <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
            Admin Auth Gateway
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-white">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">AjmanTech Admin Access</h1>
            <p className="text-xs text-slate-400 mt-1">Designated Owner: {TARGET_ADMIN_EMAIL}</p>
          </div>

          {/* Tabbed Toggle: Sign In vs Sign Up */}
          <div className="flex rounded-xl bg-slate-800 p-1 mb-6 border border-slate-700 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setMessage(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authMode === 'signin'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setMessage(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authMode === 'signup'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Sign Up
            </button>
          </div>

          {message && (
            <div
              className={`mb-5 p-3.5 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 ${
                message.type === 'success'
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-200'
                  : 'bg-rose-950/60 border-rose-800 text-rose-200'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{message.text}</span>
            </div>
          )}

          {authMode === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold text-xs shadow-lg hover:from-amber-400 hover:to-amber-300 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'Verifying Supabase Auth...' : 'Sign In as Administrator'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Password (min 6 chars)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold text-xs shadow-lg hover:from-amber-400 hover:to-amber-300 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'Creating Supabase Account...' : 'Sign Up as Administrator'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
