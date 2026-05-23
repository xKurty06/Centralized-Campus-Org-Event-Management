import { NextRequest, NextResponse } from 'next/server';

type Role = 'Overseer' | 'Officer' | 'User' | 'guest';

function getRole(req: NextRequest): Role {
  const role = req.cookies.get('auth_role')?.value;
  if (role === 'Overseer' || role === 'Officer' || role === 'User') return role;
  return 'guest';
}

function hasAuthSession(req: NextRequest): boolean {
  return req.cookies.get('auth_session')?.value === '1';
}

function isPublicPath(pathname: string): boolean {
  if (pathname === '/') return true;
  if (pathname === '/events' || pathname.startsWith('/events/')) return true;
  if (pathname === '/organizations' || pathname.startsWith('/organizations/')) return true;
  if (pathname === '/forgot-password' || pathname === '/reset-password') return true;
  if (pathname === '/privacy-policy' || pathname === '/support') return true;
  return false;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const role = getRole(req);
  const isLoggedIn = hasAuthSession(req) && role !== 'guest';

  if (pathname.startsWith('/admin')) {
    if (!isLoggedIn) return NextResponse.redirect(new URL('/', req.url));
    if (role !== 'Overseer') return NextResponse.redirect(new URL('/manage/dashboard', req.url));
  }

  if (pathname.startsWith('/manage')) {
    if (!isLoggedIn) return NextResponse.redirect(new URL('/', req.url));
    if (role !== 'Officer' && role !== 'Overseer') return NextResponse.redirect(new URL('/events', req.url));
  }

  if (!isLoggedIn && !isPublicPath(pathname)) {
    return NextResponse.redirect(new URL('/events', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
