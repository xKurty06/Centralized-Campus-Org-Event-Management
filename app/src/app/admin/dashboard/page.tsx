'use client';

import { useState } from 'react';
import Link from 'next/link';
import AdminShell from '@/components/AdminShell';

/* ────────────────────────────────────────────────────────────
   TYPES
──────────────────────────────────────────────────────────── */
interface KpiCard {
    label: string;
    value: number | string;
    delta?: string;
    positive?: boolean;
    icon: React.ReactNode;
    color: string;
    bg: string;
    href?: string;
}

interface OrgRow {
    id: string;
    name: string;
    category: 'Academic' | 'Non-Academic' | 'Religious';
    accreditationStatus: 'Active' | 'Suspended';
    eventCount: number;
    memberCount: number;
    accreditedAt: string;
}

interface EventRow {
    id: string;
    title: string;
    orgName: string;
    status: 'Upcoming' | 'Open' | 'Full' | 'Closed' | 'Completed' | 'Cancelled';
    startDate: string;
    registered: number;
    capacity: number;
}

interface ActivityItem {
    id: string;
    type: 'accreditation' | 'event_created' | 'event_cancelled' | 'user_deactivated';
    actor: string;
    target: string;
    timestamp: string;
}

/* ────────────────────────────────────────────────────────────
   PLACEHOLDER DATA
──────────────────────────────────────────────────────────── */
const PLACEHOLDER_ORGS: OrgRow[] = [
    { id: 'o1', name: 'Computer Science Society', category: 'Academic', accreditationStatus: 'Active', eventCount: 12, memberCount: 134, accreditedAt: '2025-01-10' },
    { id: 'o2', name: 'Engineering Alliance', category: 'Academic', accreditationStatus: 'Active', eventCount: 8, memberCount: 89, accreditedAt: '2025-01-12' },
    { id: 'o3', name: 'Campus Worship Collective', category: 'Religious', accreditationStatus: 'Active', eventCount: 5, memberCount: 62, accreditedAt: '2025-02-01' },
    { id: 'o4', name: 'Cultural Arts Circle', category: 'Non-Academic', accreditationStatus: 'Suspended', eventCount: 3, memberCount: 47, accreditedAt: '2025-03-15' },
    { id: 'o5', name: 'Environmental Advocates', category: 'Non-Academic', accreditationStatus: 'Active', eventCount: 6, memberCount: 58, accreditedAt: '2025-01-20' },
];

const PLACEHOLDER_EVENTS: EventRow[] = [
    { id: 'ev1', title: 'Leadership Summit 2025', orgName: 'Computer Science Society', status: 'Open', startDate: '2025-07-15', registered: 89, capacity: 150 },
    { id: 'ev2', title: 'Engineering Design Sprint', orgName: 'Engineering Alliance', status: 'Upcoming', startDate: '2025-07-22', registered: 34, capacity: 80 },
    { id: 'ev3', title: 'Worship Night Vol. 3', orgName: 'Campus Worship Collective', status: 'Completed', startDate: '2025-06-28', registered: 62, capacity: 100 },
    { id: 'ev4', title: 'Eco-Drive Campus Clean-Up', orgName: 'Environmental Advocates', status: 'Upcoming', startDate: '2025-07-30', registered: 22, capacity: 60 },
    { id: 'ev5', title: 'Annual Art Showcase', orgName: 'Cultural Arts Circle', status: 'Cancelled', startDate: '2025-07-05', registered: 0, capacity: 200 },
];

const PLACEHOLDER_ACTIVITY: ActivityItem[] = [
    { id: 'a1', type: 'accreditation', actor: 'You', target: 'Cultural Arts Circle → Suspended', timestamp: '2h ago' },
    { id: 'a2', type: 'event_created', actor: 'CSS Officer', target: 'Leadership Summit 2025 published', timestamp: '5h ago' },
    { id: 'a3', type: 'event_cancelled', actor: 'CAC Officer', target: 'Annual Art Showcase cancelled', timestamp: '1d ago' },
    { id: 'a4', type: 'user_deactivated', actor: 'You', target: 'User 2022-3-00511 deactivated', timestamp: '2d ago' },
    { id: 'a5', type: 'accreditation', actor: 'You', target: 'Environmental Advocates → Active', timestamp: '3d ago' },
];

/* ────────────────────────────────────────────────────────────
   HELPERS
──────────────────────────────────────────────────────────── */
const STATUS_STYLES: Record<EventRow['status'], string> = {
    Upcoming: 'badge-blue',
    Open: 'badge-green',
    Full: 'badge-yellow',
    Closed: 'badge-gray',
    Completed: 'badge-gray',
    Cancelled: 'badge-red',
};

const CATEGORY_STYLES: Record<OrgRow['category'], string> = {
    Academic: 'badge-blue',
    'Non-Academic': 'badge-yellow',
    Religious: 'badge-green',
};

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

/* ────────────────────────────────────────────────────────────
   SUB COMPONENTS
──────────────────────────────────────────────────────────── */

function KpiCard({ card }: { card: KpiCard }) {
    const inner = (
        <div
            className={`
                card card-body
                !p-5
                flex items-start gap-4
                h-full
                transition-all duration-200
                border border-[var(--color-border)]
                hover:shadow-md hover:-translate-y-[1px]
                ${card.href ? 'cursor-pointer' : ''}
            `}
        >
            <div
                className={`
                    w-11 h-11 rounded-2xl
                    flex items-center justify-center
                    flex-shrink-0
                    ${card.bg}
                `}
            >
                <span className={card.color}>{card.icon}</span>
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-[var(--color-text-muted)] mb-1">
                    {card.label}
                </p>

                <p className="text-[30px] font-bold text-[var(--color-text)] leading-none">
                    {card.value}
                </p>

                {card.delta && (
                    <p
                        className={`
                            text-[11px] font-medium mt-2
                            ${card.positive ? 'text-green-600' : 'text-red-500'}
                        `}
                    >
                        {card.positive ? '↑' : '↓'} {card.delta}
                    </p>
                )}
            </div>
        </div>
    );

    return card.href ? (
        <Link href={card.href} className="no-underline h-full">
            {inner}
        </Link>
    ) : (
        inner
    );
}

function StatusMiniBar({
    registered,
    capacity,
}: {
    registered: number;
    capacity: number;
}) {
    const pct = Math.min(Math.round((registered / capacity) * 100), 100);

    const color =
        pct >= 90
            ? 'bg-red-400'
            : pct >= 60
                ? 'bg-amber-400'
                : 'bg-green-500';

    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
                <div
                    className={`h-full rounded-full ${color}`}
                    style={{ width: `${pct}%` }}
                />
            </div>

            <span className="text-[11px] text-[var(--color-text-muted)] font-mono whitespace-nowrap">
                {registered}/{capacity}
            </span>
        </div>
    );
}

function ActivityIcon({ type }: { type: ActivityItem['type'] }) {
    const map: Record<
        ActivityItem['type'],
        { bg: string; icon: React.ReactNode }
    > = {
        accreditation: {
            bg: 'bg-amber-100',
            icon: (
                <svg className="w-3 h-3 text-amber-600" viewBox="0 0 24 24" fill="none">
                    <path
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                    />
                </svg>
            ),
        },

        event_created: {
            bg: 'bg-green-100',
            icon: (
                <svg className="w-3 h-3 text-green-600" viewBox="0 0 24 24" fill="none">
                    <path
                        d="M12 4v16m8-8H4"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                </svg>
            ),
        },

        event_cancelled: {
            bg: 'bg-red-100',
            icon: (
                <svg className="w-3 h-3 text-red-600" viewBox="0 0 24 24" fill="none">
                    <path
                        d="M6 18L18 6M6 6l12 12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                </svg>
            ),
        },

        user_deactivated: {
            bg: 'bg-gray-100',
            icon: (
                <svg className="w-3 h-3 text-gray-500" viewBox="0 0 24 24" fill="none">
                    <path
                        d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                    />
                </svg>
            ),
        },
    };

    const { bg, icon } = map[type];

    return (
        <div
            className={`
                w-7 h-7 rounded-full
                ${bg}
                flex items-center justify-center
                flex-shrink-0
            `}
        >
            {icon}
        </div>
    );
}

/* ────────────────────────────────────────────────────────────
   PAGE
──────────────────────────────────────────────────────────── */

export default function AdminDashboardPage() {
    const [_period, setPeriod] = useState<'week' | 'month' | 'all'>('month');

    const kpiCards: KpiCard[] = [
        {
            label: 'Total Organizations',
            value: 18,
            delta: '2 this semester',
            positive: true,
            href: '/admin/organizations',
            icon: (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <path
                        d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                    />
                </svg>
            ),
            color: 'text-green-700',
            bg: 'bg-green-100',
        },

        {
            label: 'Active Organizations',
            value: 16,
            icon: (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <path
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                    />
                </svg>
            ),
            color: 'text-blue-700',
            bg: 'bg-blue-100',
        },

        {
            label: 'Suspended',
            value: 2,
            href: '/admin/organizations',
            icon: (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <path
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                    />
                </svg>
            ),
            color: 'text-amber-700',
            bg: 'bg-amber-100',
        },

        {
            label: 'Registered Students',
            value: '1,247',
            delta: '38 this week',
            positive: true,
            href: '/admin/users',
            icon: (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <path
                        d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                    />
                </svg>
            ),
            color: 'text-purple-700',
            bg: 'bg-purple-100',
        },

        {
            label: 'Total Events',
            value: 94,
            delta: '12 this month',
            positive: true,
            href: '/admin/events',
            icon: (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <path
                        d="M8 2v3M16 2v3M3 8h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                    />
                </svg>
            ),
            color: 'text-indigo-700',
            bg: 'bg-indigo-100',
        },

        {
            label: 'Total Registrations',
            value: '3,581',
            delta: '142 this month',
            positive: true,
            icon: (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <path
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                    />
                </svg>
            ),
            color: 'text-teal-700',
            bg: 'bg-teal-100',
        },
    ];

    const suspendedOrgs = PLACEHOLDER_ORGS.filter(
        (o) => o.accreditationStatus === 'Suspended'
    );

    return (
        <AdminShell>
            <div className="flex flex-col gap-6 animate-fade-in">
                {/* HEADER */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-1">
                            Admin
                        </p>

                        <h1 className="text-[22px] font-bold text-[var(--color-text)] leading-tight">
                            Dashboard
                        </h1>

                        <p className="text-[14px] text-[var(--color-text-muted)] mt-1">
                            Platform-wide activity overview — Cavite State University
                        </p>
                    </div>

                    {/* PERIOD SELECTOR */}
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)]">
                        {(['week', 'month', 'all'] as const).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`
                                    px-4 py-2 rounded-lg text-[12px]
                                    font-medium transition-all duration-200
                                    ${_period === p
                                        ? 'bg-white shadow-sm text-[var(--color-text)]'
                                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                                    }
                                `}
                            >
                                {p === 'all'
                                    ? 'All Time'
                                    : `This ${p.charAt(0).toUpperCase() + p.slice(1)}`}
                            </button>
                        ))}
                    </div>
                </div>

                {/* KPI GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {kpiCards.map((card) => (
                        <KpiCard key={card.label} card={card} />
                    ))}
                </div>

                {/* ALERT */}
                {suspendedOrgs.length > 0 && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-start gap-3">
                        <svg
                            className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
                            viewBox="0 0 24 24"
                            fill="none"
                        >
                            <path
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>

                        <div className="flex-1">
                            <p className="text-[13px] font-semibold text-amber-800">
                                {suspendedOrgs.length} organization
                                {suspendedOrgs.length > 1 ? 's are' : ' is'} currently suspended
                            </p>

                            <p className="text-[12px] text-amber-700 mt-1">
                                {suspendedOrgs.map((o) => o.name).join(', ')} —
                                suspended organizations cannot publish events.
                            </p>
                        </div>

                        <Link
                            href="/admin/organizations"
                            className="text-[12px] font-semibold text-amber-700 hover:text-amber-900 no-underline"
                        >
                            Review →
                        </Link>
                    </div>
                )}

                {/* MAIN GRID */}
                <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_350px] gap-6">
                    {/* EVENTS */}
                    <div className="card overflow-hidden">
                        <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
                            <h2 className="text-[15px] font-semibold text-[var(--color-text)]">
                                Recent Events
                            </h2>

                            <Link
                                href="/admin/events"
                                className="text-[12px] font-medium text-[var(--color-primary)] no-underline hover:underline"
                            >
                                View all
                            </Link>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="table-base">
                                <thead>
                                    <tr>
                                        <th>Event</th>
                                        <th className="hidden sm:table-cell">
                                            Organization
                                        </th>
                                        <th className="hidden md:table-cell">
                                            Date
                                        </th>
                                        <th>Registrations</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {PLACEHOLDER_EVENTS.map((ev) => (
                                        <tr key={ev.id}>
                                            <td>
                                                <p className="text-[13px] font-semibold text-[var(--color-text)] truncate max-w-[220px]">
                                                    {ev.title}
                                                </p>
                                            </td>

                                            <td className="hidden sm:table-cell">
                                                <p className="text-[12px] text-[var(--color-text-muted)] truncate max-w-[160px]">
                                                    {ev.orgName}
                                                </p>
                                            </td>

                                            <td className="hidden md:table-cell">
                                                <p className="text-[12px] text-[var(--color-text-muted)]">
                                                    {formatDate(ev.startDate)}
                                                </p>
                                            </td>

                                            <td>
                                                <div className="w-[120px]">
                                                    <StatusMiniBar
                                                        registered={ev.registered}
                                                        capacity={ev.capacity}
                                                    />
                                                </div>
                                            </td>

                                            <td>
                                                <span
                                                    className={`badge ${STATUS_STYLES[ev.status]}`}
                                                >
                                                    {ev.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ACTIVITY */}
                    <div className="card overflow-hidden">
                        <div className="px-5 py-4 border-b border-[var(--color-border)]">
                            <h2 className="text-[15px] font-semibold text-[var(--color-text)]">
                                Recent Admin Activity
                            </h2>
                        </div>

                        <div className="divide-y divide-[var(--color-border)]">
                            {PLACEHOLDER_ACTIVITY.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-start gap-3 px-5 py-4"
                                >
                                    <ActivityIcon type={item.type} />

                                    <div className="flex-1 min-w-0">
                                        <p className="text-[12px] text-[var(--color-text)] leading-relaxed">
                                            {item.target}
                                        </p>

                                        <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                                            {item.actor} · {item.timestamp}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ORGANIZATIONS */}
                <div className="card overflow-hidden">
                    <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
                        <h2 className="text-[15px] font-semibold text-[var(--color-text)]">
                            Organizations Overview
                        </h2>

                        <Link
                            href="/admin/organizations"
                            className="text-[12px] font-medium text-[var(--color-primary)] no-underline hover:underline"
                        >
                            Manage all →
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="table-base">
                            <thead>
                                <tr>
                                    <th>Organization</th>
                                    <th>Category</th>
                                    <th className="hidden sm:table-cell">Events</th>
                                    <th className="hidden md:table-cell">
                                        Last Updated
                                    </th>
                                    <th>Status</th>
                                    <th></th>
                                </tr>
                            </thead>

                            <tbody>
                                {PLACEHOLDER_ORGS.map((org) => (
                                    <tr key={org.id}>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-white"
                                                    style={{
                                                        backgroundColor:
                                                            'var(--color-primary)',
                                                    }}
                                                >
                                                    {org.name.slice(0, 2).toUpperCase()}
                                                </div>

                                                <p className="text-[13px] font-semibold text-[var(--color-text)] truncate max-w-[220px]">
                                                    {org.name}
                                                </p>
                                            </div>
                                        </td>

                                        <td>
                                            <span
                                                className={`badge ${CATEGORY_STYLES[org.category]}`}
                                            >
                                                {org.category}
                                            </span>
                                        </td>

                                        <td className="hidden sm:table-cell">
                                            <span className="text-[13px] text-[var(--color-text-muted)]">
                                                {org.eventCount}
                                            </span>
                                        </td>

                                        <td className="hidden md:table-cell">
                                            <span className="text-[12px] text-[var(--color-text-muted)]">
                                                {formatDate(org.accreditedAt)}
                                            </span>
                                        </td>

                                        <td>
                                            <span
                                                className={`badge ${org.accreditationStatus === 'Active'
                                                        ? 'badge-green'
                                                        : 'badge-red'
                                                    }`}
                                            >
                                                {org.accreditationStatus}
                                            </span>
                                        </td>

                                        <td>
                                            <Link
                                                href={`/admin/organizations/${org.id}`}
                                                className="text-[12px] font-medium text-[var(--color-primary)] no-underline hover:underline"
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminShell>
    );
}