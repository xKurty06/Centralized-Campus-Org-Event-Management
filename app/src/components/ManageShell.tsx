'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MANAGE_SELECTED_ORG_KEY, setSelectedManageOrgId } from './manageOrgSelection';

// ─── Nav config ─────────────────────────────────────────────

interface NavItem {
    href: string;
    label: string;
    icon: React.ReactNode;
    end?: boolean;
}

const NAV: NavItem[] = [
    {
        href: '/manage/dashboard',
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
        href: '/manage/org-profile',
        label: 'Org Profile',
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
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path d="M9 22V12h6v10" />
            </svg>
        ),
    },
    {
        href: '/manage/events',
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
        href: '/manage/members',
        label: 'Members',
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
];
function IconDashboard() {
    return (
        NAV[0].icon
    );
}
function IconBuilding() {
    return (
        NAV[1].icon
    );
}
function IconCalendar() {
    return (
        NAV[2].icon
    );
}
function IconUsers() {
    return (
        NAV[3].icon
    );
}
function IconPlus() {
    return (
        <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    );
}
const MANAGE_NAV = [
    {
        title: 'Overview',
        items: [
            { href: '/manage/dashboard', label: 'Dashboard', icon: <IconDashboard /> },
            { href: '/manage/org-profile', label: 'Org Profile', icon: <IconBuilding /> },
        ]
    },
    {
        title: 'Operations',
        items: [
            { href: '/manage/events', label: 'Events', icon: <IconCalendar /> },
            { href: '/manage/members', label: 'Members', icon: <IconUsers /> },
            { href: '/manage/create-event', label: 'Create Event', icon: <IconPlus /> },
        ]
    }
];
// ─── Sidebar ────────────────────────────────────────────────

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v1';
const MANAGE_ORG_LIST_KEY = 'manage-org-list-cache';
const API_ORIGIN = (() => {
    try {
        return new URL(API_BASE_URL).origin;
    } catch {
        return 'http://localhost:8000';
    }
})();

interface ManageOrg {
    id: string;
    slug?: string;
    name: string;
    code_name?: string | null;
    logo_url?: string | null;
    position?: string | null;
}

function normalizeImageUrl(raw?: string | null): string | null {
    if (!raw) return null;
    const value = String(raw).trim();
    if (!value) return null;
    if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('//')) return value;
    const path = value.startsWith('/') ? value : `/${value}`;
    return `${API_ORIGIN}${path}`;
}

function orgInitials(org: ManageOrg | null) {
    const source = org?.code_name || org?.name || 'Org';
    const value = source
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => word[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    return value || 'OR';
}

function Sidebar({
    collapsed,
    setCollapsed,
    isMounted,
    sessionUser,
    organizations,
    selectedOrgId,
    onSelectOrg,
}: {
    collapsed: boolean;
    setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
    isMounted: boolean;
    sessionUser: SessionUser | null;
    organizations: ManageOrg[];
    selectedOrgId: string;
    onSelectOrg: (orgId: string) => void;
}) {
    const pathname = usePathname();
    const selectedOrg = organizations.find((org) => org.id === selectedOrgId) ?? (selectedOrgId ? null : organizations[0] ?? null);
    const [orgMenuOpen, setOrgMenuOpen] = useState(false);
    const orgMenuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        setOrgMenuOpen(false);
    }, [pathname]);

    useEffect(() => {
        function handlePointerDown(event: MouseEvent) {
            if (!orgMenuRef.current?.contains(event.target as Node)) {
                setOrgMenuOpen(false);
            }
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setOrgMenuOpen(false);
            }
        }

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    function isActive(href: string, end?: boolean) {
        if (end) return pathname === href;
        return pathname.startsWith(href);
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
            {/* ── Header ── */}
            <div
                className="border-b shrink-0"
                style={{ borderColor: 'var(--color-border)', overflow: 'hidden' }}
            >
                {!collapsed ? (
                    <div
                        className="flex items-center justify-between px-4"
                        style={{ height: 'var(--topbar-height)' }}
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            {/* Logo */}
                            <div
                                className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{ background: 'var(--color-primary-muted)' }}
                            >
                                <svg width="16" height="16" viewBox="0 0 40 40" fill="none">
                                    <circle
                                        cx="20" cy="20" r="12"
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
                                    className="text-[15px] font-semibold"
                                    style={{ color: 'var(--color-text)' }}
                                >
                                    Manage
                                </h2>
                                <p
                                    className="text-[10px] font-medium uppercase tracking-wider whitespace-nowrap"
                                    style={{ color: 'var(--color-text-muted)' }}
                                >
                                    Officer Panel
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
                                width="16" height="16" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor"
                                strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round"
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
                                width="18" height="18" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor"
                                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            >
                                <path d="M3 6h18M3 12h18M3 18h18" />
                            </svg>
                        </button>

                        {/* Logo */}
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: 'var(--color-primary-muted)' }}
                        >
                            <svg width="16" height="16" viewBox="0 0 40 40" fill="none">
                                <circle
                                    cx="20" cy="20" r="12"
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

            <div
                className="px-2 pt-3 pb-2 shrink-0"
            >
                {!collapsed ? (
                    <div className="relative" ref={orgMenuRef}>
                        {organizations.length === 0 || (selectedOrgId !== '' && !selectedOrg) ? (
                            <div
                                className="relative flex w-full items-center rounded-lg bg-[var(--color-primary-muted)] py-2.5 pl-12 pr-4"
                                aria-label="Loading managed organizations"
                            >
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2">
                                    <span className="block h-8 w-8 animate-pulse rounded-lg bg-green-200/70" />
                                </span>
                                <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                                    <span className="h-3.5 w-28 animate-pulse rounded-full bg-green-200/80" />
                                    <span className="h-2.5 w-16 animate-pulse rounded-full bg-green-100" />
                                </span>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setOrgMenuOpen((open) => !open)}
                                className="relative flex w-full items-center rounded-lg bg-[var(--color-primary-muted)] py-2.5 pl-12 pr-8 text-left text-[12.5px] font-semibold text-[var(--color-primary)] outline-none transition-colors hover:bg-green-100 focus:shadow-[0_0_0_2px_#bbf7d0]"
                                aria-label="Switch managed organization"
                                aria-expanded={orgMenuOpen}
                                aria-haspopup="menu"
                                title="Switch managed organization"
                            >
                                <span className="pointer-events-none absolute left-2.5 top-1/2 z-10 -translate-y-1/2">
                                    <div
                                        className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center text-[10px] font-bold"
                                        style={{
                                            background: 'var(--color-primary-muted)',
                                            color: 'var(--color-primary)',
                                        }}
                                    >
                                        {selectedOrg?.logo_url ? (
                                            <img src={normalizeImageUrl(selectedOrg.logo_url) ?? ''} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            orgInitials(selectedOrg)
                                        )}
                                    </div>
                                </span>
                                <span className="block min-w-0 truncate">
                                    {selectedOrg?.name}
                                </span>
                                <svg className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-primary)]" viewBox="0 0 20 20" fill="none">
                                    <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        )}
                        {orgMenuOpen && organizations.length > 0 && (
                            <div
                                className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-lg border border-green-100 bg-white shadow-lg"
                                role="menu"
                            >
                                {organizations.map((org) => (
                                    <button
                                        key={org.id}
                                        type="button"
                                        onClick={() => {
                                            setOrgMenuOpen(false);
                                            onSelectOrg(org.id);
                                        }}
                                        className={[
                                            'flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors',
                                            org.id === selectedOrg?.id
                                                ? 'bg-[var(--color-primary-muted)] text-[var(--color-primary)]'
                                                : 'text-[var(--color-text)] hover:bg-green-50',
                                        ].join(' ')}
                                        role="menuitem"
                                    >
                                        <span
                                            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg text-[10px] font-bold"
                                            style={{
                                                background: 'var(--color-primary-muted)',
                                                color: 'var(--color-primary)',
                                            }}
                                        >
                                            {org.logo_url ? (
                                                <img src={normalizeImageUrl(org.logo_url) ?? ''} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                orgInitials(org)
                                            )}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-[12.5px] font-semibold">{org.name}</span>
                                            {org.position && (
                                                <span className="mt-0.5 block truncate text-[10.5px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
                                                    {org.position}
                                                </span>
                                            )}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => setCollapsed(false)}
                        className="mx-auto flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg"
                        style={{
                            background: 'var(--color-primary-muted)',
                            color: 'var(--color-primary)',
                        }}
                        title={selectedOrg?.name ?? 'Managed organization'}
                        aria-label="Expand organization switcher"
                    >
                        {selectedOrg?.logo_url ? (
                            <img src={normalizeImageUrl(selectedOrg.logo_url) ?? ''} alt="" className="h-full w-full object-cover" />
                        ) : (
                            <span className="text-[10px] font-bold">{orgInitials(selectedOrg)}</span>
                        )}
                    </button>
                )}
            </div>

            {/* ── Nav ── */}
            <nav
                className="flex-1 overflow-y-auto py-3 px-2"
                style={{ scrollbarWidth: 'none' }}
            >

                <div className="flex flex-col gap-6">
                    {MANAGE_NAV.map((group) => (
                        <div key={group.title}>
                            {/* Section Header */}
                            {!collapsed && (
                                <p className="px-3 pt-2 pb-1 text-[10.5px] font-semibold uppercase tracking-widest"
                                    style={{ color: 'var(--color-text-muted)' }}>
                                    {group.title}
                                </p>
                            )}

                            {/* Render Links */}
                            {group.items.map((item) => {
                                const active = isActive(item.href);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center rounded-lg px-3 py-2.5 transition-all ${active
                                            ? 'bg-[var(--color-primary-muted)] text-[var(--color-primary)]'
                                            : 'text-[var(--color-text-secondary)] hover:bg-black/5'
                                            }`}
                                    >
                                        <span className="shrink-0">{item.icon}</span>
                                        {!collapsed && (
                                            <span className="ml-3 font-medium text-[13px]">{item.label}</span>
                                        )}
                                        {/* Active Indicator */}
                                        {!collapsed && active && (
                                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </nav>

            {/* ── Footer ── */}
            <div
                className="border-t p-3 flex flex-col gap-1 hover:text-green-600 transition-colors"
                style={{ borderColor: 'var(--color-border)' }}
            >
                {/* Back to site */}
                <Link
                    href="/events"
                    title={collapsed ? 'Back to Site' : undefined}
                    className={[
                        'flex items-center rounded-lg py-2.5 w-full hover:text-green-700 transition-colors',
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
                            Back to Site
                        </span>
                    </div>
                </Link>

                {/* Current officer */}
                <div
                    className={[
                        'flex items-center rounded-lg p-2 w-full',
                        collapsed ? 'justify-center' : '',
                    ].join(' ')}
                    style={{ background: 'var(--color-surface-2)' }}
                >
                    <div
                        className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
                        style={{
                            background: 'var(--color-primary-muted)',
                            color: 'var(--color-primary)',
                        }}
                    >
                        {/* Replace with officer initials from session */}
                        {initials(sessionUser?.first_name, sessionUser?.last_name)}
                    </div>

                    <div
                        className={`overflow-hidden transition-all duration-200 ${collapsed
                            ? 'w-0 max-w-0 opacity-0 ml-0'
                            : 'flex-1 opacity-100 ml-3'
                            }`}
                    >
                        <p
                            className="text-[12.5px] font-semibold truncate leading-tight"
                            style={{ color: 'var(--color-text)' }}
                        >
                            {/* Replace with session officer name */}
                            {sessionUser ? `${sessionUser.first_name ?? ''} ${sessionUser.last_name ?? ''}`.trim() : 'Officer'}
                        </p>
                        <p
                            className="text-[11px]"
                            style={{ color: 'var(--color-text-muted)' }}
                        >
                            {/* Replace with Org_Officers.position from session */}
                            {sessionUser?.school_id ?? 'Officer'}
                        </p>
                    </div>
                </div>
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
                {sessionUser?.school_id && 'Officer'}
            </span>
        </header>
    );
}

// ─── ManageShell ────────────────────────────────────────────

interface ManageShellProps {
    children: React.ReactNode;
    pageTitle?: string;
}
interface SessionUser {
    first_name?: string;
    last_name?: string;
    school_id?: string;
}
function initials(first = '', last = '') {
    const value = `${first.slice(0, 1)}${last.slice(0, 1)}`.toUpperCase();
    return value || 'OF';
}

export default function ManageShell({
    children,
    pageTitle = 'Salikop',
}: ManageShellProps) {
    // Separate localStorage key from AdminShell — officers and admins
    // can each collapse their own sidebar independently.
    const [collapsed, setCollapsed] = useState(() => {
        if (typeof window === 'undefined') return false;
        return localStorage.getItem('manage-sidebar-collapsed') === 'true';
    });

    // Defer transitions to prevent width animation on first paint.
    const [isMounted, setIsMounted] = useState(false);
    const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
    const [organizations, setOrganizations] = useState<ManageOrg[]>([]);
    const [selectedOrgId, setSelectedOrgId] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => setIsMounted(true), 100);
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

    useEffect(() => {
        (async () => {
            const cachedSelectedOrgId = window.sessionStorage.getItem(MANAGE_SELECTED_ORG_KEY) ?? '';
            if (cachedSelectedOrgId) {
                setSelectedOrgId(cachedSelectedOrgId);
            }

            const cachedList = window.sessionStorage.getItem(MANAGE_ORG_LIST_KEY);
            if (cachedList) {
                try {
                    const parsed = JSON.parse(cachedList);
                    if (Array.isArray(parsed)) {
                        setOrganizations(parsed);
                    }
                } catch {
                    // Ignore invalid cache and continue with network source of truth.
                }
            }

            const token = window.localStorage.getItem('auth_token') ?? window.sessionStorage.getItem('auth_token');
            if (!token) return;

            const res = await fetch(`${API_BASE_URL}/manage/organizations`, {
                headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
            }).catch(() => null);
            const payload = await res?.json().catch(() => null) as { success?: boolean; data?: ManageOrg[] } | null;
            const orgs = Array.isArray(payload?.data) ? payload.data : [];
            setOrganizations(orgs);
            window.sessionStorage.setItem(MANAGE_ORG_LIST_KEY, JSON.stringify(orgs));

            if (orgs.length === 0) return;

            const storedOrgId = window.sessionStorage.getItem(MANAGE_SELECTED_ORG_KEY) ?? '';
            const nextOrgId = orgs.some((org) => org.id === storedOrgId) ? storedOrgId : orgs[0].id;
            setSelectedManageOrgId(nextOrgId);
            setSelectedOrgId(nextOrgId);

            if (storedOrgId && storedOrgId !== nextOrgId) {
                window.location.reload();
            }
        })();
    }, []);

    useEffect(() => {
        if (isMounted) {
            localStorage.setItem('manage-sidebar-collapsed', String(collapsed));
        }
    }, [collapsed, isMounted]);

    function handleSelectOrg(orgId: string) {
        if (!orgId || orgId === selectedOrgId) return;
        setSelectedManageOrgId(orgId);
        setSelectedOrgId(orgId);
        window.location.reload();
    }

    return (
        <div className="page-shell flex min-h-screen pt-17">
            <Sidebar
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                isMounted={isMounted}
                sessionUser={sessionUser}
                organizations={organizations}
                selectedOrgId={selectedOrgId}
                onSelectOrg={handleSelectOrg}
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
