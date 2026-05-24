'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v1';

function isPublicPath(pathname: string): boolean {
  if (pathname === '/') return true;
  if (pathname === '/signup') return true;
  if (pathname === '/events' || pathname.startsWith('/events/')) return true;
  if (pathname === '/organizations' || pathname.startsWith('/organizations/')) return true;
  if (pathname === '/forgot-password' || pathname === '/reset-password' || pathname === '/change-password') return true;
  if (pathname === '/privacy-policy' || pathname === '/support') return true;
  return false;
}

export default function RouteAccessGuard() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const token = window.localStorage.getItem('auth_token') ?? window.sessionStorage.getItem('auth_token');

    if (!token) {
      if (!isPublicPath(pathname)) {
        router.replace('/events');
      }
      return;
    }

    const controller = new AbortController();
    const run = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (res.status === 401 || res.status === 403) {
          throw new Error('unauthorized');
        }

        if (!res.ok) {
          // Do not force logout on transient backend/network issues.
          return;
        }

        const payload = await res.json().catch(() => null);
        const role = payload?.data?.global_role as string | undefined;

        if (pathname.startsWith('/admin') && role !== 'Overseer') {
          router.replace(role === 'Officer' ? '/manage/dashboard' : '/events');
          return;
        }

        if (pathname.startsWith('/manage') && role !== 'Officer' && role !== 'Overseer') {
          router.replace('/events');
          return;
        }
      } catch (error: any) {
        if (error?.name === 'AbortError') return;

        if (error?.message === 'unauthorized') {
          window.localStorage.removeItem('auth_token');
          window.localStorage.removeItem('auth_user');
          window.sessionStorage.removeItem('auth_token');
          window.sessionStorage.removeItem('auth_user');
          document.cookie = 'auth_role=; Path=/; Max-Age=0; SameSite=Lax';
          document.cookie = 'auth_session=; Path=/; Max-Age=0; SameSite=Lax';

          if (!isPublicPath(pathname)) {
            router.replace('/events');
          }
        }
      }
    };

    run();
    return () => controller.abort();
  }, [pathname, router]);

  return null;
}
