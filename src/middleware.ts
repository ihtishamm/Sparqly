import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** Presence-only cookie set on sign-in (see store/auth-store.ts). */
const SESSION_COOKIE = 'sparqly_session';

/** Pages a signed-in user shouldn't see. Email links work either way. */
const GUEST_ONLY = ['/auth/sign-in', '/auth/sign-up', '/auth/forgot-password'];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const signedIn = request.cookies.has(SESSION_COOKIE);

  if (pathname.startsWith('/dashboard') && !signedIn) {
    const url = new URL('/auth/sign-in', request.url);
    url.searchParams.set('callbackUrl', pathname + search);
    return NextResponse.redirect(url);
  }

  if (signedIn && GUEST_ONLY.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*']
};
