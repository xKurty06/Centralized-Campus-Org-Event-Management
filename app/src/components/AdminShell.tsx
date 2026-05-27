'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ShellProfileMenu from './ShellProfileMenu';

// ─── Nav config ─────────────────────────────────────────────

interface NavItem {
    href: string;
    label: string;
    icon: React.ReactNode;
    end?: boolean;
}

const NAV: NavItem[] = [
    {
        href: '/admin/dashboard',
        label: 'Dashboard',
        end: true,
        icon: (
            <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <rect x="3" y="3" width="7" height="8" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="13" y="3" width="8" height="7" rx="1.5" />
                <rect x="13" y="13" width="8" height="8" rx="1.5" />
            </svg>
        ),
    },
    {
        href: '/admin/organizations',
        label: 'Organizations',
        icon: (
            <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
        ),
    },
    {
        href: '/admin/users',
        label: 'Users',
        icon: (
            <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
            </svg>
        ),
    },
    {
        href: '/admin/events',
        label: 'Events',
        icon: (
            <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M8 2v3M16 2v3M3 8h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
            </svg>
        ),
    },
    {
        href: '/admin/audit',
        label: 'Audit Logs',
        icon: (
            <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M12 7v5l4 2" />
            </svg>
        ),
    },
    {
        href: '/admin/organizations/create',
        label: 'Create Organization',
        icon: (
            <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M12 5v14M5 12h14" />
            </svg>
        ),
    }
];
function IconDashboard() {
    return (
        NAV[0].icon
    );
}
function IconOrg() {
    return (
        NAV[1].icon
    );
}
function IconUsers() {
    return (
        NAV[2].icon
    );
}
function IconEvents() {
    return (
        NAV[3].icon
    );
}
function IconAudit() {
    return (
        NAV[4].icon
    );
}
function IconSettings() {
    return (
        NAV[5].icon
    );
}
const NAV_ITEMS = {
    dashboard: { href: '/admin/dashboard', label: 'Dashboard', icon: <IconDashboard /> },
    organizations: { href: '/admin/organizations', label: 'Organizations', icon: <IconOrg /> },
    users: { href: '/admin/users', label: 'Users', icon: <IconUsers /> },
    events: { href: '/admin/events', label: 'Events', icon: <IconEvents /> },
    audit: { href: '/admin/audit', label: 'Audit Logs', icon: <IconAudit /> },
    settings: { href: '/admin/settings', label: 'Settings', icon: <IconSettings /> },
    create_org: { href: '/admin/organizations/create', label: 'Create Organization', icon: <IconOrg /> },
};

const NAV_GROUPS = [
    {
        title: 'Management',
        items: [
            NAV_ITEMS.dashboard,
            NAV_ITEMS.organizations,
            NAV_ITEMS.events,
        ]
    },
    {
        title: 'Security & Audit',
        items: [
            NAV_ITEMS.users,
            NAV_ITEMS.audit,
        ]
    },
    {
        title: 'Operations',
        items: [
            NAV_ITEMS.create_org,
        ]
    }
];


// ─── Sidebar ────────────────────────────────────────────────

function Sidebar({
    collapsed,
    setCollapsed,
    isMounted,
    sessionUser,
}: {
    collapsed: boolean;
    setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
    isMounted: boolean;
    sessionUser: SessionUser | null;
}) {
    const pathname = usePathname();

    function isActive(href: string, end?: boolean) {
        if (end) return pathname === href;
        if (pathname === href) return true;

        if (pathname.startsWith(href + "/")) {
            const hasExactMatchElsewhere = NAV_GROUPS.some((group) =>
                group.items.some((item) => item.href === pathname)
            );
            return !hasExactMatchElsewhere;
        }

        return false;
    }

    return (
        <aside
            className={`sidebar fixed top-0 left-0 z-20 flex h-screen flex-col ${isMounted ? 'transition-all duration-300' : ''
                }`}
            style={{
                width: collapsed
                    ? 'var(--sidebar-collapsed-width)'
                    : 'var(--sidebar-width)',
            }}
        >
            {/* Header */}
            <div
                className="border-b shrink-0"
                style={{
                    borderColor: 'var(--color-border)',
                    overflow: 'hidden',
                }}
            >
                {!collapsed ? (
                    <div
                        className="flex items-center justify-between px-4"
                        style={{
                            height: 'var(--topbar-height)',
                        }}
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            {/* Logo */}
                            <div
                                className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{
                                    background: 'var(--color-primary-muted)',
                                }}
                            >
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 40 40"
                                    fill="none"
                                >
                                    <circle
                                        cx="20"
                                        cy="20"
                                        r="12"
                                        stroke="var(--color-primary)"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <path
                                        d="M20 13v7.5l4 2.5"
                                        stroke="var(--color-primary)"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>

                            {/* Text */}
                            <div className="overflow-hidden">
                                <h2
                                    className="text-[15px] font-semibold flex-1"
                                    style={{ color: 'var(--color-text)' }}
                                >
                                    Admin
                                </h2>

                                <p
                                    className="text-[10px] font-medium uppercase tracking-wider whitespace-nowrap"
                                    style={{ color: 'var(--color-text-muted)' }}
                                >
                                    Overseer Panel
                                </p>
                            </div>
                        </div>

                        {/* Collapse */}
                        <button
                            onClick={() => setCollapsed(true)}
                            className="shrink-0 p-2 rounded-lg transition-colors hover:bg-black/5"
                            aria-label="Collapse sidebar"
                        >
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.85"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M15 18l-6-6 6-6" />
                            </svg>
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center py-3 gap-3">
                        {/* Hamburger */}
                        <button
                            onClick={() => setCollapsed(false)}
                            className="p-2 rounded-lg transition-colors hover:bg-black/5"
                            aria-label="Expand sidebar"
                        >
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M3 6h18" />
                                <path d="M3 12h18" />
                                <path d="M3 18h18" />
                            </svg>
                        </button>

                        {/* Logo */}
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: 'var(--color-primary-muted)' }}
                        >
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 40 40"
                                fill="none"
                            >
                                <circle
                                    cx="20"
                                    cy="20"
                                    r="12"
                                    stroke="var(--color-primary)"
                                    strokeWidth="2.5"
                                />
                                <path
                                    d="M20 13v7.5l4 2.5"
                                    stroke="var(--color-primary)"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>
                    </div>
                )}
            </div>

            {/* Nav */}
            <nav
                className="flex-1 overflow-y-auto py-3 px-2"
                style={{ scrollbarWidth: 'none' }}
            >

                {NAV_GROUPS.map((group) => (
                    <div key={group.title} className="mt-4 first:mt-0">
                        {/* Category Header */}
                        {!collapsed && (
                            <p className="px-3 pt-2 pb-1 text-[10.5px] font-semibold uppercase tracking-widest"
                                style={{ color: 'var(--color-text-muted)' }}>
                                {group.title}
                            </p>
                        )}

                        {/* Group Items */}
                        {group.items.map((item) => {
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    title={collapsed ? item.label : undefined}
                                    className={`flex items-center rounded-lg mb-0.5 w-full hover:bg-black/5 transition-all duration-150 ${collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2.5'
                                        }`}
                                    style={active ? { background: 'var(--color-primary-muted)', color: 'var(--color-primary)' } : { color: 'var(--color-text-secondary)' }}
                                >
                                    <span className="shrink-0 flex items-center justify-center">{item.icon}</span>

                                    <span className={`text-[13px] font-medium whitespace-nowrap overflow-hidden transition-all duration-200 ${collapsed ? 'w-0 max-w-0 opacity-0 ml-0' : 'flex-1 opacity-100 ml-3'
                                        }`}>
                                        {item.label}
                                    </span>

                                    {!collapsed && active && (
                                        <span className="w-1.5 h-1.5 rounded-full shrink-0 ml-2 bg-[var(--color-primary)]" />
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {/* Footer */}
            <div
                className="border-t p-3 flex flex-col gap-1"
                style={{ borderColor: 'var(--color-border)' }}
            >
                {/* Back to site */}
                <Link
                    href="/events"
                    title={collapsed ? 'Back to Site' : undefined}
                    className={[
                        'flex items-center rounded-lg py-2.5 w-full hover:text-green-600 transition-colors',
                        isMounted ? 'transition-all duration-150' : '',
                        collapsed ? 'px-0 justify-center' : 'px-3',
                    ].join(' ')}
                    style={{ color: 'var(--color-text-secondary)' }}
                >
                    <div className="hover:text-green-600 transition-colors flex items-center">
                        <svg
                            className="w-4 h-4 shrink-0"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>

                    <span
                        className={`text-[13px] font-medium whitespace-nowrap overflow-hidden transition-all duration-200 ${collapsed
                            ? 'w-0 max-w-0 opacity-0 ml-0'
                            : 'opacity-100 ml-3'
                            }`}
                    >
                        Back to Events
                    </span>
                    </div>
                </Link>

                <ShellProfileMenu collapsed={collapsed} role="admin" user={sessionUser} />
            </div>
        </aside>
    );
}

// ─── Topbar ─────────────────────────────────────────────────

function Topbar({ pageTitle, sessionUser }: { pageTitle: string; sessionUser: SessionUser | null }) {
    return (
        <header className="topbar" style={{ paddingLeft: '1.5rem' }}>
            <p
                className="text-[13.5px] font-bold leading-tight whitespace-nowrap flex-1"
                style={{ color: 'var(--color-text)' }}
            >
                {pageTitle}
            </p>

            <span
                className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                style={{
                    background: 'var(--color-primary-muted)',
                    color: 'var(--color-primary)',
                }}
            >
                {sessionUser?.school_id && adminRoleLabel(sessionUser.global_role)}
            </span>
        </header>
    );
}

// ─── AdminShell ────────────────────────────────────────────

interface AdminShellProps {
    children: React.ReactNode;
    pageTitle?: string;
}
interface SessionUser {
    first_name?: string;
    last_name?: string;
    school_id?: string;
    global_role?: string;
}
function adminRoleLabel(role?: string) {
    return role === 'Super_Admin' ? 'Super Admin' : 'Overseer';
}

export default function AdminShell({
    children,
    pageTitle = 'Salikop',
}: AdminShellProps) {
    // Lazy initializer reads localStorage synchronously on first render,
    // so collapsed is correct before any paint — no false→true flip, no flicker.
    const [collapsed, setCollapsed] = useState(() => {
        if (typeof window === 'undefined') return false;
        return localStorage.getItem('admin-sidebar-collapsed') === 'true';
    });

    // Defer enabling CSS transitions until after the initial layout settles.
    // Without this guard, the sidebar animates its width on every page load.
    const [isMounted, setIsMounted] = useState(false);
    const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsMounted(true);
        }, 100);
        const raw = window.localStorage.getItem('auth_user') ?? window.sessionStorage.getItem('auth_user');
        if (raw) {
            try {
                setSessionUser(JSON.parse(raw));
            } catch {
                setSessionUser(null);
            }
        }
        return () => clearTimeout(timer);
    }, []);

    // Persist collapse state whenever it changes (skip on first render).
    useEffect(() => {
        if (isMounted) {
            localStorage.setItem('admin-sidebar-collapsed', String(collapsed));
        }
    }, [collapsed, isMounted]);

    return (
        <div className="page-shell flex min-h-screen pt-17">
            <Sidebar
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                isMounted={isMounted}
                sessionUser={sessionUser}
            />

            <div
                className={`flex flex-col flex-1 min-w-0 ${isMounted ? 'transition-all duration-300' : ''
                    }`}
                style={{
                    paddingLeft: collapsed
                        ? 'var(--sidebar-collapsed-width)'
                        : 'var(--sidebar-width)',
                }}
            >
                <Topbar pageTitle={pageTitle} sessionUser={sessionUser} />

                <main className="flex-1 overflow-x-hidden">
                    <div className="w-full px-5 lg:px-8 py-6">{children}</div>
                </main>
            </div>
        </div>
    );
}
