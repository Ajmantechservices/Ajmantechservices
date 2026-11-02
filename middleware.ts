// middleware.ts
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // If someone tries to access /admin, you can temporarily allow it 
  // and let your page-level client-side component handle the auth redirect safely!
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Pass through to /admin page component where client-side Supabase handles the session
    return response;
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};
