'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '../../../src/lib/supabase';

const TARGET_ADMIN_EMAIL = 'joshuaajayi0148@gmail.com';

/**
 * Next.js Admin Dashboard Layout Guard
 * Strictly verifies that the authenticated user is EXACTLY joshuaajayi0148@gmail.com.
 * If not, executes supabase.auth.signOut() and redirects immediately to /admin/login.
 */
export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function verifyAdminAuth() {
      if (!isSupabaseConfigured() || !supabase) {
        setIsChecking(false);
        setIsAuthorized(true);
        return;
      }

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const userEmail = session?.user?.email?.toLowerCase().trim();

        if (!session || !session.user || userEmail !== TARGET_ADMIN_EMAIL.toLowerCase()) {
          if (supabase) {
            await supabase.auth.signOut();
          }
          if (isMounted) {
            router.replace(
              `/admin/login?error=${encodeURIComponent(
                'Unauthorized access: Only the site owner can log into this dashboard.'
              )}`
            );
          }
          return;
        }

        if (isMounted) {
          setIsAuthorized(true);
        }
      } catch (err) {
        if (supabase) {
          try {
            await supabase.auth.signOut();
          } catch {}
        }
        if (isMounted) {
          router.replace(
            `/admin/login?error=${encodeURIComponent(
              'Unauthorized access: Only the site owner can log into this dashboard.'
            )}`
          );
        }
      } finally {
        if (isMounted) {
          setIsChecking(false);
        }
      }
    }

    verifyAdminAuth();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-10 h-10 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-base font-bold text-white tracking-tight">Verifying Site Owner Security Gate</h2>
          <p className="text-xs text-slate-400 font-mono">
            Hard-locked to: {TARGET_ADMIN_EMAIL}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
