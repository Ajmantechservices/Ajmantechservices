import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const TARGET_ADMIN_EMAIL = 'joshuaajayi0148@gmail.com';

/**
 * Next.js Middleware to hard-lock /admin/dashboard access exclusively
 * to the designated site owner (joshuaajayi0148@gmail.com) and disable public
 * admin registration routes.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Disable any public user registration routes for admin access
  if (
    pathname === '/admin/signup' ||
    pathname === '/admin/register' ||
    pathname.startsWith('/admin/signup/') ||
    pathname.startsWith('/admin/register/')
  ) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set(
      'error',
      'Unauthorized access: Only the site owner can log into this dashboard.'
    );
    return NextResponse.redirect(loginUrl, 307);
  }

  // 2. Protect /admin/dashboard and /admin routes (except /admin/login)
  if (
    pathname === '/admin' ||
    pathname === '/admin/dashboard' ||
    pathname.startsWith('/admin/dashboard/')
  ) {
    // Check cookies for Supabase auth tokens
    const cookies = request.cookies.getAll();
    let userEmail: string | null = null;

    for (const c of cookies) {
      if (
        c.name.includes('auth-token') ||
        c.name.includes('access-token') ||
        c.name.startsWith('sb-')
      ) {
        try {
          let tokenStr = c.value;
          if (tokenStr.startsWith('%5B') || tokenStr.startsWith('%7B')) {
            tokenStr = decodeURIComponent(tokenStr);
          }

          if (tokenStr.startsWith('[') || tokenStr.startsWith('{')) {
            try {
              const parsed = JSON.parse(tokenStr);
              if (Array.isArray(parsed) && parsed[0]) {
                tokenStr = typeof parsed[0] === 'string' ? parsed[0] : parsed[0].access_token;
              } else if (parsed.access_token) {
                tokenStr = parsed.access_token;
              }
              if (parsed.user?.email) {
                userEmail = parsed.user.email;
              }
            } catch {}
          }

          if (!userEmail && typeof tokenStr === 'string' && tokenStr.includes('.')) {
            const parts = tokenStr.split('.');
            if (parts.length === 3) {
              const base64Url = parts[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const jsonPayload = decodeURIComponent(
                atob(base64)
                  .split('')
                  .map((ch) => '%' + ('00' + ch.charCodeAt(0).toString(16)).slice(-2))
                  .join('')
              );
              const payload = JSON.parse(jsonPayload);
              if (payload.email) {
                userEmail = payload.email;
              }
            }
          }
        } catch {
          // Ignore parse errors on irrelevant cookies
        }
      }
    }

    // Check authorization header
    const authHeader = request.headers.get('authorization');
    if (!userEmail && authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const parts = token.split('.');
        if (parts.length === 3) {
          const base64Url = parts[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(atob(base64));
          if (payload.email) {
            userEmail = payload.email;
          }
        }
      } catch {}
    }

    // If authenticated user's email is not EXACTLY joshuaajayi0148@gmail.com
    if (
      !userEmail ||
      userEmail.toLowerCase().trim() !== TARGET_ADMIN_EMAIL.toLowerCase().trim()
    ) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set(
        'error',
        'Unauthorized access: Only the site owner can log into this dashboard.'
      );

      const response = NextResponse.redirect(loginUrl, 307);

      // Invalidate cookies if non-owner user was logged in
      for (const c of cookies) {
        if (c.name.startsWith('sb-') || c.name.includes('auth-token')) {
          response.cookies.delete(c.name);
        }
      }

      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
