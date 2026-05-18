'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// ─── Nav config ───────────────────────────────────────────────────────────────

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
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
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
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
        ),
    },
    {
        href: '/admin/users',
        label: 'Users',
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
            </svg>
        ),
    },
    {
        href: '/admin/events',
        label: 'Events',
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 2v3M16 2v3M3 8h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
            </svg>
        ),
    },
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ collapsed }: { collapsed: boolean }) {
    const pathname = usePathname();

    function isActive(href: string, end?: boolean) {
        if (end) return pathname === href;
        return pathname.startsWith(href);
    }

    return (
        <aside
            className="sidebar flex flex-col transition-all duration-300"
            style={{
                width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
            }}
        >
            {/* Logo */}
            <div
                className="flex items-center gap-3 px-4 border-b shrink-0"
                style={{
                    height: 'var(--topbar-height)',
                    borderColor: 'var(--color-border)',
                    overflow: 'hidden',
                }}
            >
                {/* Icon mark */}
                <div
                    className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'var(--color-primary-muted)' }}
                >
                    <svg width="16" height="16" viewBox="0 0 40 40" fill="none">
                        <circle cx="20" cy="20" r="12" stroke="var(--color-primary)" strokeWidth="2.5" />
                        <path d="M20 13v7.5l4 2.5" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>

                {!collapsed && (
                    <div className="overflow-hidden">
                        <p
                            className="text-[13.5px] font-bold leading-tight whitespace-nowrap"
                            style={{ color: 'var(--color-text)' }}
                        >
                            CvSali
                        </p>
                        <p
                            className="text-[10px] font-medium uppercase tracking-wider whitespace-nowrap"
                            style={{ color: 'var(--color-text-muted)' }}
                        >
                            Overseer Panel
                        </p>
                    </div>
                )}
            </div>

            {/* Nav */}
            <nav
                className="flex-1 overflow-y-auto py-3 px-2"
                style={{ scrollbarWidth: 'none' }}
            >
                {!collapsed && (
                    <p
                        className="px-3 pt-2 pb-1 text-[10.5px] font-semibold uppercase tracking-widest"
                        style={{ color: 'var(--color-text-muted)' }}
                    >
                        Management
                    </p>
                )}

                {collapsed && (
                    <div className="my-2 mx-2 border-t" style={{ borderColor: 'var(--color-border)' }} />
                )}

                {NAV.map((item) => {
                    const active = isActive(item.href, item.end);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            title={collapsed ? item.label : undefined}
                            className={[
                                'flex items-center gap-3 rounded-lg transition-all duration-150 mb-0.5',
                                collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2.5',
                            ].join(' ')}
                            style={
                                active
                                    ? {
                                        background: 'var(--color-primary-muted)',
                                        color: 'var(--color-primary)',
                                    }
                                    : { color: 'var(--color-text-secondary)' }
                            }
                        >
                            <span
                                className="shrink-0"
                                style={active ? { color: 'var(--color-primary)' } : {}}
                            >
                                {item.icon}
                            </span>

                            {!collapsed && (
                                <span className="flex-1 text-[13px] font-medium whitespace-nowrap">
                                    {item.label}
                                </span>
                            )}

                            {!collapsed && active && (
                                <span
                                    className="w-1.5 h-1.5 rounded-full shrink-0"
                                    style={{ background: 'var(--color-primary)' }}
                                />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer — back to site + user chip */}
            <div className="border-t p-3 flex flex-col gap-1" style={{ borderColor: 'var(--color-border)' }}>
                {/* Back to site */}
                <Link
                    href="/events"
                    title={collapsed ? 'Back to Site' : undefined}
                    className={[
                        'flex items-center gap-3 rounded-lg py-2.5 transition-all duration-150',
                        collapsed ? 'px-0 justify-center' : 'px-3',
                    ].join(' ')}
                    style={{ color: 'var(--color-text-secondary)' }}
                >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    {!collapsed && (
                        <span className="text-[13px] font-medium">Back to Site</span>
                    )}
                </Link>

                {/* User chip */}
                <div
                    className={[
                        'flex items-center gap-3 rounded-lg p-2',
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
                        OS
                    </div>

                    {!collapsed && (
                        <div className="flex-1 overflow-hidden">
                            <p
                                className="text-[12.5px] font-semibold truncate leading-tight"
                                style={{ color: 'var(--color-text)' }}
                            >
                                Overseer Name
                            </p>
                            <p
                                className="text-[11px]"
                                style={{ color: 'var(--color-text-muted)' }}
                            >
                                Overseer
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────

function Topbar({
    pageTitle,
    onToggle,
}: {
    pageTitle: string;
    onToggle: () => void;
}) {
    return (
        <header className="topbar" style={{ paddingLeft: '1.5rem' }}>
            {/* Sidebar toggle */}
            <button
                onClick={onToggle}
                className="p-2 rounded-lg mr-3 transition-colors"
                style={{ color: 'var(--color-text-secondary)' }}
                aria-label="Toggle sidebar"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12h18M3 6h18M3 18h18" />
                </svg>
            </button>

            {/* Page title */}
            <h2
                className="text-[15px] font-semibold flex-1"
                style={{ color: 'var(--color-text)' }}
            >
                {pageTitle}
            </h2>

            {/* Role chip */}
            <span
                className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                style={{
                    background: 'var(--color-primary-muted)',
                    color: 'var(--color-primary)',
                }}
            >
                Overseer
            </span>
        </header>
    );
}

// ─── AdminShell ───────────────────────────────────────────────────────────────

interface AdminShellProps {
    children: React.ReactNode;
    pageTitle?: string;
}

export default function AdminShell({
    children,
    pageTitle = 'Admin',
}: AdminShellProps) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="page-shell">
            <Sidebar collapsed={collapsed} />

            <Topbar
                pageTitle={pageTitle}
                onToggle={() => setCollapsed((c) => !c)}
            />

            <main
                className="main-content transition-all duration-300"
                style={{
                    marginLeft: collapsed
                        ? 'var(--sidebar-collapsed-width)'
                        : 'var(--sidebar-width)',
                }}
            >
                <div className="p-6 max-w-[1500px] mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}