import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimiters, getIp } from './lib/ratelimit';

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getIp(request);

  // --- Rate Limiting Logic ---
  
  // 1. Strict Auth Limit (Phone auth API)
  if (pathname === '/api/auth/phone') {
    if (rateLimiters.auth) {
      const { success } = await rateLimiters.auth.limit(ip);
      if (!success) return NextResponse.json({ error: 'Çok fazla istek. Lütfen 15 dakika bekleyin.' }, { status: 429 });
    }
  }

  // 2. Strict Spin Limit (Prevent double clicking / macros)
  if (pathname === '/api/spin' && request.method === 'POST') {
    if (rateLimiters.spin) {
      const { success } = await rateLimiters.spin.limit(ip);
      if (!success) return NextResponse.json({ error: 'İşleminiz devam ediyor, lütfen bekleyin.' }, { status: 429 });
    }
  }

  // 3. Admin API Limit
  if (pathname.startsWith('/api/admin')) {
    if (rateLimiters.admin) {
      const { success } = await rateLimiters.admin.limit(ip);
      if (!success) return NextResponse.json({ error: 'Çok fazla admin isteği.' }, { status: 429 });
    }
  }

  // 4. Global API Limit for everything else in /api
  if (pathname.startsWith('/api') && rateLimiters.global) {
    const { success } = await rateLimiters.global.limit(ip);
    if (!success) return NextResponse.json({ error: 'Çok fazla istek.' }, { status: 429 });
  }

  // --- Route Protection Logic ---
  
  const token = request.cookies.get('gbs-token');

  // Landing page: if already authenticated, redirect to wheel
  if (pathname === '/') {
    if (token) {
      return NextResponse.redirect(new URL('/cark', request.url));
    }
    return NextResponse.next();
  }

  // Protected User Routes
  if (pathname.startsWith('/cark') || pathname.startsWith('/sonuc')) {
    if (!token) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Protected Admin Routes
  const adminToken = request.cookies.get('gbs-admin-token');
  
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/giris') {
      // Prevent authenticated admins from accessing login
      if (adminToken) {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      return NextResponse.next();
    }
    
    // Require admin token for all other admin routes
    if (!adminToken) {
      return NextResponse.redirect(new URL('/admin/giris', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
