'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function AdminLoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto text-xl font-bold">
          🛡️
        </div>
        <h1 className="text-2xl font-bold text-white">AjmanTech Admin Portal</h1>
        
        {error && (
          <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-200 text-xs leading-relaxed text-left font-medium">
            {error === 'unauthorized'
              ? 'Unauthorized access: Only the site owner can log into this dashboard.'
              : error}
          </div>
        )}

        <p className="text-xs text-slate-400 leading-relaxed">
          Administrative access is strictly restricted to the designated site owner:{' '}
          <strong className="text-amber-400 font-mono">joshuaajayi0148@gmail.com</strong>
        </p>

        <Link
          href="/"
          className="inline-block w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
        >
          Return to Storefront
        </Link>
      </div>
    </div>
  );
}

export default function NextAdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>}>
      <AdminLoginForm />
    </Suspense>
  );
}
