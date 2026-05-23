'use client';

import { useState, useMemo, Fragment, useEffect } from 'react';
import AdminShell from '@/components/AdminShell';
import { FilterSelect, FilterChip } from '@/components/ui/filter';

/* ----------------------------------------------------------------
   Types
   ---------------------------------------------------------------- */
type ActionCategory =
    | 'Accreditation'
    | 'User'
    | 'Event'
    | 'Membership'
    | 'Officer'
    | 'Payment';

interface AuditEntry {
    id: string;
    timestamp: string;                // ISO string
    actor_name: string;               // Overseer / Officer who performed the action
    actor_school_id: string;
    actor_role: 'Overseer' | 'Officer';
    category: ActionCategory;
    action: string;                   // Human-readable action label
    target_label: string;             // What was affected (org name, user name, etc.)
    target_id: string;                // UUID of the affected record
    meta?: string;                    // Optional extra detail (e.g. "from Active → Suspended")
}

/* ----------------------------------------------------------------
   Placeholder Data
   (TODO: replace with GET /api/admin/audit?page=N&category=X&actor=Y)
   ---------------------------------------------------------------- */
const PLACEHOLDER_AUDIT: AuditEntry[] = [
    {
        id: 'a-01', timestamp: '2025-05-20T09:14:22Z',
        actor_name: 'Admin Rivera', actor_school_id: '2020100001', actor_role: 'Overseer',
        category: 'Accreditation', action: 'Suspended Organization',
        target_label: 'Debate Society', target_id: 'org-debsoc',
        meta: 'Active → Suspended',
    },
    {
        id: 'a-02', timestamp: '2025-05-20T08:55:10Z',
        actor_name: 'Admin Rivera', actor_school_id: '2020100001', actor_role: 'Overseer',
        category: 'User', action: 'Deactivated Account',
        target_label: 'Carlo Bautista (2022100198)', target_id: 'usr-carlo',
        meta: 'Reason: Duplicate account',
    },
    {
        id: 'a-03', timestamp: '2025-05-19T16:02:48Z',
        actor_name: 'Juan Dela Cruz', actor_school_id: '2022100045', actor_role: 'Officer',
        category: 'Membership', action: 'Marked Membership Fee Paid',
        target_label: 'Ana Villanueva — CSS', target_id: 'mbr-ana',
        meta: 'paid_membership_fee: false → true',
    },
    {
        id: 'a-04', timestamp: '2025-05-19T14:30:00Z',
        actor_name: 'Maria Reyes', actor_school_id: '2022100078', actor_role: 'Officer',
        category: 'Membership', action: 'Set Membership Status',
        target_label: 'Paolo Lim — CSS', target_id: 'mbr-paolo',
        meta: 'Pending → Active',
    },
    {
        id: 'a-05', timestamp: '2025-05-19T11:18:33Z',
        actor_name: 'Admin Santos', actor_school_id: '2019100002', actor_role: 'Overseer',
        category: 'Accreditation', action: 'Restored Accreditation',
        target_label: 'Computer Students Society', target_id: 'org-css',
        meta: 'Suspended → Active',
    },
    {
        id: 'a-06', timestamp: '2025-05-18T15:45:09Z',
        actor_name: 'Admin Rivera', actor_school_id: '2020100001', actor_role: 'Overseer',
        category: 'Event', action: 'Removed Event',
        target_label: 'Tech Summit 2025 (AITS)', target_id: 'evt-techsummit',
        meta: 'Reason: Policy violation',
    },
    {
        id: 'a-07', timestamp: '2025-05-18T10:00:01Z',
        actor_name: 'Carlo Mendoza', actor_school_id: '2023100112', actor_role: 'Officer',
        category: 'Officer', action: 'Officer Access Revoked',
        target_label: 'Paolo Santos — CSS', target_id: 'off-paolosantos',
        meta: 'is_active: true → false',
    },
    {
        id: 'a-08', timestamp: '2025-05-17T09:22:14Z',
        actor_name: 'Admin Santos', actor_school_id: '2019100002', actor_role: 'Overseer',
        category: 'User', action: 'Assigned Global Role',
        target_label: 'Lena Cruz (2024100321)', target_id: 'usr-lena',
        meta: 'global_role: User → Overseer',
    },
    {
        id: 'a-09', timestamp: '2025-05-16T14:11:55Z',
        actor_name: 'Juan Dela Cruz', actor_school_id: '2022100045', actor_role: 'Officer',
        category: 'Membership', action: 'Added Member to Roster',
        target_label: 'Rosa Tan — CSS', target_id: 'mbr-rosatan',
    },
    {
        id: 'a-10', timestamp: '2025-05-15T08:05:37Z',
        actor_name: 'Admin Rivera', actor_school_id: '2020100001', actor_role: 'Overseer',
        category: 'Accreditation', action: 'Suspended Organization',
        target_label: 'Religious Guild Alpha', target_id: 'org-rga',
        meta: 'Active → Suspended',
    },
    {
        id: 'a-11', timestamp: '2025-05-14T16:44:20Z',
        actor_name: 'Maria Reyes', actor_school_id: '2022100078', actor_role: 'Officer',
        category: 'Payment', action: 'Confirmed Cash Payment',
        target_label: 'Luis Garcia — WebDev Bootcamp', target_id: 'reg-luisgarcia',
        meta: 'payment_status: Pending → Paid (On-site)',
    },
    {
        id: 'a-12', timestamp: '2025-05-13T13:30:00Z',
        actor_name: 'Admin Santos', actor_school_id: '2019100002', actor_role: 'Overseer',
        category: 'Event', action: 'Flagged Event',
        target_label: 'Org Idol Night (Debate Society)', target_id: 'evt-idolnight',
        meta: 'Status flag: Under Review',
    },
];

const CATEGORIES: ActionCategory[] = ['Accreditation', 'User', 'Event', 'Membership', 'Officer', 'Payment'];
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v1';

const CATEGORY_BADGE: Record<ActionCategory, string> = {
    Accreditation: 'badge-blue',
    User: 'badge-yellow',
    Event: 'badge-gray',
    Membership: 'badge-green',
    Officer: 'badge-blue',
    Payment: 'badge-green',
};

const CATEGORY_DOT: Record<ActionCategory, string> = {
    Accreditation: 'var(--color-info)',
    User: 'var(--color-warning)',
    Event: 'var(--color-text-muted)',
    Membership: 'var(--color-success)',
    Officer: 'var(--color-info)',
    Payment: 'var(--color-success)',
};

function fmtDate(iso: string) {
    return new Date(iso).toLocaleString('en-PH', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
    });
}

/* ----------------------------------------------------------------
   Page
   ---------------------------------------------------------------- */
export default function AdminAuditPage() {
    const [entries, setEntries] = useState<AuditEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCat] = useState<ActionCategory | 'All'>('All');
    const [roleFilter, setRoleFilter] = useState<'All' | 'Overseer' | 'Officer'>('All');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    async function loadAudit(showRefreshing = false) {
        const token = window.localStorage.getItem('auth_token') ?? window.sessionStorage.getItem('auth_token');
        if (!token) {
            setIsLoading(false);
            return;
        }
        if (showRefreshing) setRefreshing(true);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/audit`, {
                headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('fetch-failed');
            const payload = await res.json();
            const rows = Array.isArray(payload?.data) ? payload.data : [];
            setEntries(rows as AuditEntry[]);
        } catch {
            setEntries([]);
        } finally {
            setIsLoading(false);
            if (showRefreshing) setRefreshing(false);
        }
    }

    useEffect(() => {
        loadAudit(false);
    }, []);

    const filtered = useMemo(() => {
        return entries.filter((e) => {
            const q = search.toLowerCase();
            const matchSearch =
                !q ||
                e.action.toLowerCase().includes(q) ||
                e.actor_name.toLowerCase().includes(q) ||
                e.target_label.toLowerCase().includes(q) ||
                e.actor_school_id.includes(q);
            const matchCat = categoryFilter === 'All' || e.category === categoryFilter;
            const matchRole = roleFilter === 'All' || e.actor_role === roleFilter;
            return matchSearch && matchCat && matchRole;
        });
    }, [entries, search, categoryFilter, roleFilter]);
    const hasActiveFilters = !!search || categoryFilter !== 'All' || roleFilter !== 'All';

    return (
        <AdminShell>
            <main className="flex flex-col gap-6 animate-fade-in">

                {/* ── Page Header ── */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    {/* Title Section */}
                    <div className="flex-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-1">
                            Admin
                        </p>

                        {/* This wrapper now ensures both Title and Button are vertically centered */}
                        <div className="flex items-center justify-between gap-4">
                            <h1 className="text-[22px] font-bold text-[var(--color-text)] leading-tight">
                                Audit Log
                            </h1>
                            <button
                                className="btn btn-outline btn-sm whitespace-nowrap"
                                disabled
                                title="TODO: POST /api/admin/audit/export"
                            >
                                <IconDownload />
                                Export CSV
                            </button>
                        </div>

                        <p className="text-[14px] text-[var(--color-text-muted)] mt-1">
                            Read-only record of all administrative interventions and state changes across the platform.
                        </p>
                    </div>
                </div>

                {/* ── Summary Stat Chips ── */}
                <div className="flex gap-3 flex-wrap">
                    {[
                        { label: 'Total Entries', value: entries.length, color: 'var(--color-text)' },
                        { label: 'Today', value: entries.filter(e => e.timestamp?.slice(0, 10) === new Date().toISOString().slice(0, 10)).length, color: 'var(--color-primary-light)' },
                        { label: 'Overseer Actions', value: entries.filter(e => e.actor_role === 'Overseer').length, color: 'var(--color-info)' },
                        { label: 'Officer Actions', value: entries.filter(e => e.actor_role === 'Officer').length, color: 'var(--color-warning)' },
                    ].map(s => (
                        <div key={s.label} className="card flex items-center gap-3 px-4 py-3" style={{ boxShadow: 'none' }}>
                            <span className="text-xl font-bold" style={{ color: s.color }}>{s.value}</span>
                            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{s.label}</span>
                        </div>
                    ))}
                </div>

                {/* ── Filters ── */}
                {/* ── Filters ─────────────────────────────────────────────── */}
                <div className="card" style={{ boxShadow: 'none' }}>
                    <div className="card-body py-3.5">
                        <div className="flex flex-col gap-2.5">

                            {/* Controls row */}
                            <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center">

                                {/* Search */}
                                <div className="input-icon-wrapper flex-1 min-w-[180px]">
                                    <span className="input-icon-left"><IconSearch /></span>
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search by action, actor, or target…"
                                        className={`input-has-left-icon ${search ? 'input-has-right-icon' : ''}`}
                                    />
                                    {search && (
                                        <button
                                            type="button"
                                            onClick={() => setSearch('')}
                                            aria-label="Clear search"
                                            className="input-icon-right bg-transparent border-0 cursor-pointer transition-opacity hover:opacity-60"
                                            style={{ color: 'var(--color-text-muted)' }}
                                        >
                                            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                                                <path d="M2 2l9 9M11 2L2 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                            </svg>
                                        </button>
                                    )}
                                </div>

                                <FilterSelect
                                    value={categoryFilter}
                                    defaultValue="All"
                                    onChange={(v) => setCat(v as ActionCategory | 'All')}
                                    options={[
                                        { value: 'All', label: 'All Categories' },
                                        ...CATEGORIES.map((c) => ({ value: c, label: c })),
                                    ]}
                                    className="sm:w-44"
                                />

                                <FilterSelect
                                    value={roleFilter}
                                    defaultValue="All"
                                    onChange={(v) => setRoleFilter(v as typeof roleFilter)}
                                    options={[
                                        { value: 'All', label: 'All Roles' },
                                        { value: 'Overseer', label: 'Overseer' },
                                        { value: 'Officer', label: 'Officer' },
                                    ]}
                                    className="sm:w-36"
                                />

                                {hasActiveFilters && (
                                    <button
                                        type="button"
                                        onClick={() => { setSearch(''); setCat('All'); setRoleFilter('All'); }}
                                        className="btn btn-ghost btn-sm whitespace-nowrap self-start sm:self-auto"
                                        style={{ color: 'var(--color-error)' }}
                                    >
                                        Clear all
                                    </button>
                                )}
                            </div>

                            {/* Active filter chips */}
                            {hasActiveFilters && (
                                <div
                                    className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t"
                                    style={{ borderColor: 'var(--color-border)' }}
                                >
                                    <span className="text-[11px] font-medium mr-0.5" style={{ color: 'var(--color-text-muted)' }}>
                                        Filtering by:
                                    </span>
                                    {search && <FilterChip label={`"${search}"`} onRemove={() => setSearch('')} />}
                                    {categoryFilter !== 'All' && <FilterChip label={categoryFilter} onRemove={() => setCat('All')} />}
                                    {roleFilter !== 'All' && <FilterChip label={roleFilter} onRemove={() => setRoleFilter('All')} />}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Result count ── */}
                <p className="text-xs" style={{ color: 'var(--color-text-muted)', marginTop: '-8px' }}>
                    Showing <strong>{filtered.length}</strong> of <strong>{entries.length}</strong> entries
                </p>

                <div className="flex justify-end">
                    <button
                        className="btn btn-outline btn-sm whitespace-nowrap"
                        onClick={() => loadAudit(true)}
                        disabled={isLoading || refreshing}
                    >
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>

                {/* ── Log Table ── */}
                {/* ── Log Table ── */}
                <div className="card overflow-x-auto">
                    {isLoading ? (
                        <div className="py-16 text-center">
                            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                                Loading audit entries...
                            </p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-16 text-center">
                            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                                No audit entries match your filters.
                            </p>
                        </div>
                    ) : (
                        /* CRITICAL: The table wrapper must exist */
                        <table className="table-base w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[var(--color-border)]">
                                    <th className="py-3 px-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider" style={{ width: '180px' }}>Timestamp</th>
                                    <th className="py-3 px-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Actor</th>
                                    <th className="py-3 px-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Category</th>
                                    <th className="py-3 px-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Action</th>
                                    <th className="py-3 px-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Target</th>
                                    <th className="py-3 px-4" style={{ width: '44px' }}></th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-[var(--color-border)]">
                                {filtered.map((entry) => (
                                    <Fragment key={entry.id}>
                                        <tr
                                            className="hover:bg-[var(--color-surface-2)] transition-colors"
                                            style={{ cursor: entry.meta ? 'pointer' : 'default' }}
                                            onClick={() => entry.meta && setExpandedId(expandedId === entry.id ? null : entry.id)}
                                        >
                                            {/* Timestamp */}
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                                        style={{ background: CATEGORY_DOT[entry.category] }}
                                                    />
                                                    <span className="text-xs font-mono" style={{ color: 'var(--color-text-secondary)' }}>
                                                        {fmtDate(entry.timestamp)}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Actor */}
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                                                        style={{
                                                            background: entry.actor_role === 'Overseer' ? 'rgba(26,115,232,.1)' : 'var(--color-primary-muted)',
                                                            color: entry.actor_role === 'Overseer' ? 'var(--color-info)' : 'var(--color-primary)'
                                                        }}
                                                    >
                                                        {entry.actor_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>{entry.actor_name}</p>
                                                        <p className="text-[10px] font-mono" style={{ color: 'var(--color-text-muted)' }}>{entry.actor_school_id}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Category */}
                                            <td className="py-3 px-4">
                                                <span className={`badge ${CATEGORY_BADGE[entry.category]}`}>
                                                    {entry.category}
                                                </span>
                                            </td>

                                            {/* Action */}
                                            <td className="py-3 px-4 text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                                                {entry.action}
                                            </td>

                                            {/* Target */}
                                            <td className="py-3 px-4 text-xs" style={{ color: 'var(--color-text-secondary)', maxWidth: '200px' }}>
                                                <span className="truncate block">{entry.target_label}</span>
                                                <span className="font-mono text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                                                    {entry.target_id}
                                                </span>
                                            </td>

                                            {/* Expand toggle */}
                                            <td className="py-3 px-4 text-right">
                                                {entry.meta && (
                                                    <button
                                                        className="btn btn-ghost btn-sm"
                                                        style={{ padding: '4px', color: 'var(--color-text-muted)' }}
                                                        aria-label="Expand details"
                                                    >
                                                        <svg
                                                            viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5"
                                                            style={{ transform: expandedId === entry.id ? 'rotate(180deg)' : 'none', transition: 'transform 200ms ease' }}
                                                        >
                                                            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>

                                        {/* Expanded Content Conditional Row */}
                                        {expandedId === entry.id && entry.meta && (
                                            <tr style={{ background: 'var(--color-surface-2)' }}>
                                                <td colSpan={6} style={{ padding: '12px 20px', borderTop: '1px dashed var(--color-border)' }}>
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-xs font-semibold mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Detail:</span>
                                                        <code className="text-xs px-2 py-1 rounded font-mono break-all" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
                                                            {entry.meta}
                                                        </code>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* ── Pagination placeholder ── */}
                <div className="flex items-center justify-between">
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        Page 1 of 1 {/* TODO: dynamic pagination via ?page=N */}
                    </p>
                    <div className="flex gap-2">
                        <button className="btn btn-ghost btn-sm" disabled>← Previous</button>
                        <button className="btn btn-ghost btn-sm" disabled>Next →</button>
                    </div>
                </div>

            </main>
        </AdminShell>
    );
}

/* ----------------------------------------------------------------
   Icons
   ---------------------------------------------------------------- */
function IconSearch() {
    return (
        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none">
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.75" />
            <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
    );
}

function IconDownload() {
    return (
        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none">
            <path d="M10 3v10M6 9l4 4 4-4M4 16h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
