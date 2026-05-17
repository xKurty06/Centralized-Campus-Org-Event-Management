'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/* ────────────────────────────────────────────────────────────
   NAV ITEMS
──────────────────────────────────────────────────────────── */
const NAV = [
    {
        href: '/admin/dashboard',
        label: 'Dashboard',
        icon: <IconDashboard />,
    },
    {
        href: '/admin/organizations',
        label: 'Organizations',
        icon: <IconOrgs />,
    },
    {
        href: '/admin/users',
        label: 'Users',
        icon: <IconUsers />,
    },
    {
        href: '/admin/events',
        label: 'Events',
        icon: <IconEvents />,
    },
];

/* ────────────────────────────────────────────────────────────
   SHELL
──────────────────────────────────────────────────────────── */
export default function AdminShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    function isActive(href: string) {
        if (href === '/admin/dashboard') return pathname === '/admin/dashboard';
        return pathname.startsWith(href);
    }

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Brand */}
            <div className="px-5 py-5 border-b border-white/10">
                <Link href="/" className="flex items-center gap-2.5 no-underline group">
                    <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                        <svg className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="none">
                            <circle cx="10" cy="10" r="7" stroke="white" strokeWidth="1.6" />
                            <path d="M10 6v4.5l2.5 1.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <div className="flex flex-col leading-tight">
                        <span className="text-[14px] font-bold text-white tracking-tight">CvSali</span>
                        <span className="text-[10px] text-white/50 font-normal">Overseer Panel</span>
                    </div>
                </Link>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
                <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest px-3 mb-2">Management</p>
                {NAV.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium no-underline transition-all duration-150
              ${isActive(item.href)
                                ? 'bg-white/15 text-white'
                                : 'text-white/60 hover:bg-white/8 hover:text-white/90'
                            }`}
                    >
                        <span className={`flex-shrink-0 transition-colors ${isActive(item.href) ? 'text-white' : 'text-white/50'}`}>
                            {item.icon}
                        </span>
                        {item.label}
                        {isActive(item.href) && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                        )}
                    </Link>
                ))}
            </nav>

            {/* Bottom */}
            <div className="px-3 py-4 border-t border-white/10">
                <Link
                    href="/events"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-white/50 hover:text-white/80 hover:bg-white/8 no-underline transition-all"
                >
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                        <path d="M10 19l-7-7m0 0l7-7m-7 7h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Back to Site
                </Link>
                <div className="mt-3 px-3 py-2.5 rounded-lg bg-white/8 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-green-400/30 border border-green-400/40 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-green-300">OS</span>
                    </div>
                    <div className="flex flex-col leading-tight min-w-0">
                        <span className="text-[12px] font-semibold text-white truncate">Overseer Name</span>
                        <span className="text-[10px] text-white/40">Overseer</span>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex" style={{ backgroundColor: 'var(--color-bg)', fontFamily: 'var(--font-sans)' }}>

            {/* ── Desktop Sidebar ── */}
            <aside
                className="hidden lg:flex flex-col fixed top-0 left-0 bottom-0 z-40 w-[220px]"
                style={{ backgroundColor: 'var(--color-primary-dark)' }}
            >
                <SidebarContent />
            </aside>

            {/* ── Mobile Sidebar ── */}
            {mobileOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                        onClick={() => setMobileOpen(false)}
                    />
                    <aside
                        className="fixed top-0 left-0 bottom-0 z-50 w-[220px] lg:hidden flex flex-col"
                        style={{ backgroundColor: 'var(--color-primary-dark)' }}
                    >
                        <SidebarContent />
                    </aside>
                </>
            )}

            {/* ── Main ── */}
            <div className="flex-1 flex flex-col lg:pl-[220px]">

                {/* Mobile topbar */}
                <div
                    className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-5 h-14 border-b"
                    style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                >
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="flex flex-col gap-1.5 w-8 h-8 justify-center"
                    >
                        <span className="block w-5 h-0.5 rounded-full bg-gray-600" />
                        <span className="block w-5 h-0.5 rounded-full bg-gray-600" />
                        <span className="block w-5 h-0.5 rounded-full bg-gray-600" />
                    </button>
                    <span className="text-[14px] font-bold text-[var(--color-primary-dark)]">CvSali Admin</span>
                    <div className="w-8" />
                </div>

                {/* Page content */}
                <main className="flex-1 p-6 lg:p-8 max-w-[1100px] w-full mx-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}

/* ── Icons ── */
function IconDashboard() {
    return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
            <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
function IconOrgs() {
    return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
function IconUsers() {
    return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
function IconEvents() {
    return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
            <path d="M8 2v3M16 2v3M3 8h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}