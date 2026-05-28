'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearAuthSession } from './authStorage';

/* ----------------------------------------------------------------
   Types
   ---------------------------------------------------------------- */
type UserRole = 'guest' | 'student' | 'officer' | 'admin';

interface NavbarProps {
  role?: UserRole;
  user?: {
    name: string;
    schoolId: string;
    department: string;
    avatarUrl?: string;
  };
}

/* ----------------------------------------------------------------
   Nav links per role
   ---------------------------------------------------------------- */
const NAV_LINKS: Record<UserRole, { label: string; href: string }[]> = {
  guest: [
    { label: 'Events', href: '/events' },
    { label: 'Organizations', href: '/organizations' },
  ],
  student: [
    { label: 'Events', href: '/events' },
    { label: 'Organizations', href: '/organizations' },
    { label: 'My Events', href: '/my-events' },
  ],
  officer: [
    { label: 'Events', href: '/events' },
    { label: 'Organizations', href: '/organizations' },
    { label: 'My Events', href: '/my-events' },
    { label: 'Manage', href: '/manage/dashboard' },
  ],
  admin: [
    { label: 'Events', href: '/events' },
    { label: 'Organizations', href: '/organizations' },
    { label: 'My Events', href: '/my-events' },
    { label: 'Admin', href: '/admin/dashboard' },
  ],
};

/* ----------------------------------------------------------------
   Helpers
   ---------------------------------------------------------------- */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/* ----------------------------------------------------------------
   Navbar
   ---------------------------------------------------------------- */
export default function Navbar({ role = 'guest', user }: NavbarProps) {
  const resolveSessionFromStorage = (): { role: UserRole; user?: NavbarProps['user'] } => {
    if (typeof window === 'undefined') return { role, user };

    const token = window.localStorage.getItem('auth_token') ?? window.sessionStorage.getItem('auth_token');
    if (!token) return { role: 'guest' };

    const raw = window.localStorage.getItem('auth_user') ?? window.sessionStorage.getItem('auth_user');
    if (!raw) return { role: 'guest' };

    try {
      const parsed = JSON.parse(raw) as { first_name?: string; last_name?: string; school_id?: string; global_role?: string };
      const mappedRole: UserRole =
        parsed.global_role === 'Super_Admin' || parsed.global_role === 'Overseer' ? 'admin' : parsed.global_role === 'Officer' ? 'officer' : 'student';
      return {
        role: mappedRole,
        user: {
          name: `${parsed.first_name ?? ''} ${parsed.last_name ?? ''}`.trim() || 'User',
          schoolId: parsed.school_id ?? '',
          department: '',
        },
      };
    } catch {
      return { role: 'guest' };
    }
  };

  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [sessionRole, setSessionRole] = useState<UserRole>(role);
  const [sessionUser, setSessionUser] = useState<NavbarProps['user']>(user);

  useEffect(() => {
    // If parent already provides authenticated identity, keep it as source of truth.
    if (role !== 'guest' || user) {
      setSessionRole((prev) => (prev !== role ? role : prev));
      setSessionUser((prev) => (prev?.schoolId === user?.schoolId ? prev : user));
      return;
    }

    // Fallback: resolve from browser storage only when props are guest/empty.
    const nextSession = resolveSessionFromStorage();

    // 1. Only update role if it actually changed
    setSessionRole((prev) => (prev !== nextSession.role ? nextSession.role : prev));

    // 2. Only update user if the unique ID changed to prevent object-reference re-renders
    setSessionUser((prevUser) => {
      if (!prevUser && !nextSession.user) return prevUser;
      if (!prevUser || !nextSession.user) return nextSession.user;
      if (prevUser.schoolId === nextSession.user.schoolId) return prevUser;

      return nextSession.user;
    });
  }, [pathname, role, user]);

  const links = useMemo(() => NAV_LINKS[sessionRole], [sessionRole]);
  const isLoggedIn = sessionRole !== 'guest';

  function handleLogout() {
    clearAuthSession();
    setSessionRole('guest');
    setSessionUser(undefined);
    setProfileOpen(false);
    router.push('/');
  }

  function isActive(href: string) {
    if (href === '/events') return pathname.startsWith('/events');
    if (href === '/organizations') return pathname.startsWith('/organizations');
    return pathname.startsWith(href);
  }

  return (
    <nav className="sticky top-0 z-30 w-full bg-white border-b border-gray-200 shadow-sm">

      {/* ── Main bar ── */}
      <div className="mx-auto max-w-[1280px] px-6 lg:px-12 h-[64px] grid grid-cols-[1fr_auto_1fr] items-center gap-6 relative">

        {/* ── Brand (Left Column) ── */}
        <Link href="/events" className="flex items-center gap-2.5 flex-shrink-0 no-underline justify-self-start">
          <img
            src="/Salikop_logo.png"
            alt="Salikop logo"
            width={32}
            height={32}
            className="w-8 h-8 object-contain flex-shrink-0"
          />
          <div className="flex flex-col leading-tight">
            <span className="text-[15px] font-bold text-green-700 tracking-tight">Salikop</span>
            <span className="text-[10px] font-normal text-gray-400 hidden sm:block">Cavite State University</span>
          </div>
        </Link>

        {/* ── Desktop Nav Links (Center Column) ── */}
        <div className="hidden md:flex items-center gap-0.5 justify-center">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-[13px] font-medium px-4 py-2 rounded-lg transition-colors duration-150 no-underline whitespace-nowrap min-w-[80px] text-center
          ${isActive(link.href)
                  ? 'text-green-700 bg-green-50 font-semibold'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* ── Right (Right Column) ── */}
        <div className="flex items-center gap-2 flex-shrink-0 justify-self-end">
          {isLoggedIn && sessionUser ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-full border border-gray-200 bg-white hover:border-green-600 hover:shadow-[0_0_0_3px_#dcfce7] transition-all duration-150 cursor-pointer max-w-xs flex-shrink-0"
              >
                <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center overflow-hidden flex-shrink-0 border border-green-100">
                  {sessionUser.avatarUrl ? (
                    <img src={sessionUser.avatarUrl} alt={sessionUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold text-green-700">{getInitials(sessionUser.name)}</span>
                  )}
                </div>
                <div className="hidden md:flex flex-col text-left leading-tight flex-1 min-w-0">
                  <span className="text-[12px] font-semibold text-gray-800 truncate">{sessionUser.name}</span>
                  <span className="text-[10px] text-gray-400 truncate">{sessionUser.schoolId}</span>
                </div>
                <svg
                  className={`w-3.5 h-3.5 text-gray-400 hidden md:block transition-transform duration-150 ${profileOpen ? 'rotate-180' : ''}`}
                  viewBox="0 0 20 20" fill="none"
                >
                  <path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 top-[calc(100%+8px)] w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-40 overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                      <p className="text-[13px] font-semibold text-gray-800 truncate">{sessionUser.name}</p>
                      <p className="text-[11px] text-gray-400 truncate">{sessionUser.schoolId}</p>
                      <span className="mt-1.5 inline-block text-[10px] font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-md uppercase tracking-wide">
                        {sessionRole}
                      </span>
                    </div>
                    <div className="py-1">
                      <DropdownLink href="/my-events" onClick={() => setProfileOpen(false)} icon={<IconCalendar />}>My Events</DropdownLink>
                      <DropdownLink href="/profile" onClick={() => setProfileOpen(false)} icon={<IconProfile />}>View Profile</DropdownLink>
                      <DropdownLink href="/change-password" onClick={() => setProfileOpen(false)} icon={<IconKey />}>Change Password</DropdownLink>
                      {sessionRole === 'officer' && <DropdownLink href="/manage/dashboard" onClick={() => setProfileOpen(false)} icon={<IconManage />}>Manage Org</DropdownLink>}
                      {sessionRole === 'admin' && <DropdownLink href="/admin/dashboard" onClick={() => setProfileOpen(false)} icon={<IconAdmin />}>Admin Panel</DropdownLink>}
                    </div>
                    <div className="h-px bg-gray-100" />
                    <div className="py-1">
                      <button onClick={handleLogout} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] font-medium text-red-500 hover:bg-red-50 transition-colors duration-150 cursor-pointer">
                        <IconLogout /> Log out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link href="/" className="text-[13px] font-semibold bg-green-700 text-white px-4 py-1.5 rounded-lg hover:bg-green-800 transition-colors duration-150 no-underline">
              Log in
            </Link>
          )}

          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden flex flex-col justify-center gap-1.5 w-8 h-8 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            <span className="block w-full h-0.5 bg-gray-500 rounded-full" />
            <span className="block w-full h-0.5 bg-gray-500 rounded-full" />
            <span className="block w-full h-0.5 bg-gray-500 rounded-full" />
          </button>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-6 pb-4 pt-2 flex flex-col gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`text-[14px] font-medium px-4 py-2.5 rounded-lg transition-colors no-underline
                ${isActive(link.href)
                  ? 'text-green-700 bg-green-50 font-semibold'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              {link.label}
            </Link>
          ))}
          {!isLoggedIn && (
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className="mt-2 text-center text-[14px] font-semibold bg-green-700 text-white px-4 py-2.5 rounded-lg hover:bg-green-800 transition-colors no-underline"
            >
              Log in
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}

/* ----------------------------------------------------------------
   Dropdown link helper
   ---------------------------------------------------------------- */
function DropdownLink({
  href, onClick, icon, children,
}: {
  href: string;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors no-underline group"
    >
      <span className="text-gray-400 group-hover:text-green-700 transition-colors">{icon}</span>
      {children}
    </Link>
  );
}

/* ----------------------------------------------------------------
   Icons
   ---------------------------------------------------------------- */
function IconCalendar() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
      <path d="M6 2v2M14 2v2M3 8h14M5 4h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconProfile() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
      <path d="M10 10a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 1114 0H3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconKey() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
      <circle cx="8" cy="10" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11.5 10H18M16 8v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconManage() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
      <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconAdmin() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
      <path d="M9 12l2 2 4-4m-5 6a8 8 0 110-16 8 8 0 010 16z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
      <path d="M13 15l4-5-4-5M17 10H7m6 7H5a2 2 0 01-2-2V5a2 2 0 012-2h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
