import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Admin Dashboard | AjmanTech Services',
  description: 'Authorized Admin Management Portal for AjmanTech Services.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function NextAdminDashboardPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-8 flex flex-col items-center justify-center">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold text-amber-400">AjmanTech Admin Dashboard</h1>
        <p className="text-xs text-slate-300">
          Authenticated as designated site owner: <strong className="text-white font-mono">joshuaajayi0148@gmail.com</strong>
        </p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
        >
          Open App Workspace
        </Link>
      </div>
    </div>
  );
}
