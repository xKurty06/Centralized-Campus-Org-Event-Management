'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

const HIDDEN_NAVBAR_PATHS = ['/manage', '/admin', `/`, '/signup', '/forgot-password', '/reset-password', '/change-password', '/privacy-policy', '/support'];

function shouldHideNavbar(pathname: string) {
  return HIDDEN_NAVBAR_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export default function RootShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <>
      {!shouldHideNavbar(pathname) && <Navbar />}
      {children}
    </>
  );
}
