'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import AdminShell from '@/components/AdminShell';
import { FilterSelect, FilterChip } from '@/components/ui/filter';

/* ----------------------------------------------------------------
   Types
   ---------------------------------------------------------------- */
type EventStatus = 'Upcoming' | 'Open' | 'Full' | 'Closed' | 'Completed' | 'Cancelled';
type AudienceType = 'Open' | 'CvSU_Only' | 'Org_Members_Only';
type EventCategory = 'Workshop' | 'Seminar' | 'Competition' | 'Activity' | 'Training' | 'Outreach' | 'Cultural' | 'Other';

interface AdminEvent {
    id: string;
    title: string;
    hostOrg: string;
    venue: string;
    category: EventCategory;
    audienceType: AudienceType;
    startDate: string;
    status: EventStatus;
    isPaid: boolean;
    capacity: number;
    registrants: number;
    isFlagged: boolean;
    flagReason?: string; // Added flag reason
}

/* ----------------------------------------------------------------
   Placeholder Data
   ---------------------------------------------------------------- */
const PLACEHOLDER_EVENTS: AdminEvent[] = [
    { id: 'ev-1', title: 'Web Dev Workshop 2025', hostOrg: 'CSS', venue: 'AVR 2', category: 'Workshop', audienceType: 'CvSU_Only', startDate: '2025-05-10', status: 'Completed', isPaid: false, capacity: 80, registrants: 64, isFlagged: false },
    { id: 'ev-2', title: 'Hackathon: Code for a Cause', hostOrg: 'CSS', venue: 'Gymnasium', category: 'Competition', audienceType: 'Open', startDate: '2025-08-03', status: 'Open', isPaid: true, capacity: 50, registrants: 38, isFlagged: false },
    { id: 'ev-3', title: 'Career Talk: Tech Industry', hostOrg: 'CSS', venue: 'SMT Hall', category: 'Seminar', audienceType: 'CvSU_Only', startDate: '2025-09-20', status: 'Upcoming', isPaid: false, capacity: 100, registrants: 0, isFlagged: false },
    { id: 'ev-4', title: 'Night of Stars: SPECS Anniversary', hostOrg: 'SPECS', venue: 'Open Grounds', category: 'Cultural', audienceType: 'Open', startDate: '2025-04-05', status: 'Cancelled', isPaid: true, capacity: 200, registrants: 12, isFlagged: false },
    { id: 'ev-5', title: 'Nursing Skills Training', hostOrg: 'NSO', venue: 'Sim Lab', category: 'Training', audienceType: 'Org_Members_Only', startDate: '2025-07-15', status: 'Open', isPaid: false, capacity: 30, registrants: 28, isFlagged: false },
    { id: 'ev-6', title: 'Community Feeding Drive', hostOrg: 'YFC', venue: 'TBA', category: 'Outreach', audienceType: 'Open', startDate: '2025-08-20', status: 'Upcoming', isPaid: false, capacity: 60, registrants: 4, isFlagged: true, flagReason: 'Needs venue confirmation before wider promotion.' },
    { id: 'ev-7', title: 'Business Plan Competition', hostOrg: 'JMA', venue: 'AVR 1', category: 'Competition', audienceType: 'CvSU_Only', startDate: '2025-09-05', status: 'Upcoming', isPaid: true, capacity: 40, registrants: 0, isFlagged: false },
    { id: 'ev-8', title: 'Dance Workshop: Folklorico', hostOrg: 'CCC', venue: 'Mini Theater', category: 'Cultural', audienceType: 'Open', startDate: '2025-06-28', status: 'Full', isPaid: true, capacity: 25, registrants: 25, isFlagged: false },
    { id: 'ev-9', title: 'Budget 101: Financial Literacy', hostOrg: 'JMA', venue: 'AVR 2', category: 'Seminar', audienceType: 'Open', startDate: '2025-05-22', status: 'Completed', isPaid: false, capacity: 70, registrants: 55, isFlagged: false },
    { id: 'ev-10', title: 'App Dev Bootcamp', hostOrg: 'CSS', venue: 'CIT Lab 3', category: 'Workshop', audienceType: 'CvSU_Only', startDate: '2025-10-02', status: 'Upcoming', isPaid: true, capacity: 35, registrants: 0, isFlagged: true, flagReason: 'Missing registration fee details.' },
];

/* ----------------------------------------------------------------
   Helpers
   ---------------------------------------------------------------- */
const STATUS_BADGE: Record<EventStatus, string> = {
    Upcoming: 'badge-blue',
    Open: 'badge-green',
    Full: 'badge-yellow',
    Closed: 'badge-gray',
    Completed: 'badge-gray',
    Cancelled: 'badge-red',
};

const AUDIENCE_LABEL: Record<AudienceType, string> = {
    Open: 'Open',
    CvSU_Only: 'CvSU Only',
    Org_Members_Only: 'Org Members',
};

/* ----------------------------------------------------------------
   Page
   ---------------------------------------------------------------- */
export default function AdminEventsPage() {
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<'All' | EventStatus>('All');
    const [filterCategory, setFilterCategory] = useState<'All' | EventCategory>('All');
    const [filterOrg, setFilterOrg] = useState('All');
    const [filterFlagged, setFilterFlagged] = useState(false);

    const [confirmRemove, setConfirmRemove] = useState<AdminEvent | null>(null);
    const [confirmFlag, setConfirmFlag] = useState<AdminEvent | null>(null);
    const [flagReasonInput, setFlagReasonInput] = useState(''); // Holds the reason typed in the modal

    const [events, setEvents] = useState<AdminEvent[]>(PLACEHOLDER_EVENTS);

    const orgs = useMemo(() => {
        const all = [...new Set(events.map((e) => e.hostOrg))].sort();
        return ['All', ...all];
    }, [events]);

    const filtered = useMemo(() => {
        return events.filter((ev) => {
            const q = search.toLowerCase();
            const matchSearch = ev.title.toLowerCase().includes(q) || ev.hostOrg.toLowerCase().includes(q) || ev.venue.toLowerCase().includes(q);
            const matchStatus = filterStatus === 'All' || ev.status === filterStatus;
            const matchCategory = filterCategory === 'All' || ev.category === filterCategory;
            const matchOrg = filterOrg === 'All' || ev.hostOrg === filterOrg;
            const matchFlagged = !filterFlagged || ev.isFlagged;
            return matchSearch && matchStatus && matchCategory && matchOrg && matchFlagged;
        });
    }, [events, search, filterStatus, filterCategory, filterOrg, filterFlagged]);

    const stats = useMemo(() => ({
        total: events.length,
        active: events.filter((e) => ['Open', 'Upcoming', 'Full'].includes(e.status)).length,
        flagged: events.filter((e) => e.isFlagged).length,
        completed: events.filter((e) => e.status === 'Completed').length,
    }), [events]);

    function handleRemove(ev: AdminEvent) {
        setEvents((prev) => prev.filter((e) => e.id !== ev.id));
        setConfirmRemove(null);
    }

    function handleToggleFlag(ev: AdminEvent, reason?: string) {
        setEvents((prev) =>
            prev.map((e) =>
                e.id === ev.id
                    ? {
                        ...e,
                        isFlagged: !e.isFlagged,
                        flagReason: !e.isFlagged ? reason : undefined
                    }
                    : e
            )
        );
        setConfirmFlag(null);
        setFlagReasonInput('');
    }

    const hasActiveFilters = !!search || filterStatus !== 'All' || filterCategory !== 'All' || filterOrg !== 'All' || filterFlagged;

    return (
        <AdminShell>
            <main className="flex flex-col gap-6 animate-fade-in">

                {/* ── Header ── */}
                <div>
                    <p
                        className="text-xs font-semibold uppercase tracking-widest mb-1"
                        style={{ color: "var(--color-text-muted)" }}
                    >
                        Admin
                    </p>
                    <h1
                        className="text-[22px] font-bold tracking-tight"
                        style={{ color: "var(--color-text)" }}
                    >
                        Events
                    </h1>
                    <p className="text-sm mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                        Review all published events across the platform. Remove or flag events as needed.
                    </p>
                </div>


                {/* ── Stats ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <StatCard label="Total Events" value={stats.total} color="blue" />
                    <StatCard label="Active" value={stats.active} color="green" />
                    <StatCard label="Flagged" value={stats.flagged} color="yellow" />
                    <StatCard label="Completed" value={stats.completed} color="gray" />
                </div>

                {/* ── Filters ─────────────────────────────────────────────── */}
                <div className="card mb-6">
                    <div className="card-body py-3.5">
                        <div className="flex flex-col gap-2.5">

                            {/* Controls row */}
                            <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center flex-wrap">

                                {/* Search */}
                                <div className="input-icon-wrapper flex-1 min-w-[200px]">
                                    <span className="input-icon-left"><IconSearch /></span>
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search by title, org, or venue…"
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
                                    value={filterStatus}
                                    defaultValue="All"
                                    onChange={(v) => setFilterStatus(v as typeof filterStatus)}
                                    options={[
                                        { value: 'All', label: 'All Status' },
                                        ...(['Upcoming', 'Open', 'Full', 'Closed', 'Completed', 'Cancelled'] as EventStatus[])
                                            .map((s) => ({ value: s, label: s })),
                                    ]}
                                    className="sm:w-36"
                                />

                                <FilterSelect
                                    value={filterCategory}
                                    defaultValue="All"
                                    onChange={(v) => setFilterCategory(v as typeof filterCategory)}
                                    options={[
                                        { value: 'All', label: 'All Categories' },
                                        ...(['Workshop', 'Seminar', 'Competition', 'Activity', 'Training', 'Outreach', 'Cultural', 'Other'] as EventCategory[])
                                            .map((c) => ({ value: c, label: c })),
                                    ]}
                                    className="sm:w-40"
                                />

                                <FilterSelect
                                    value={filterOrg}
                                    defaultValue="All"
                                    onChange={(v) => setFilterOrg(v)}
                                    options={orgs.map((o) => ({ value: o, label: o === 'All' ? 'All Orgs' : o }))}
                                    className="sm:w-36"
                                />

                                {/* Flagged toggle */}
                                <button
                                    type="button"
                                    onClick={() => setFilterFlagged((v) => !v)}
                                    className="btn btn-sm flex items-center gap-1.5 whitespace-nowrap"
                                    style={filterFlagged ? {
                                        background: 'var(--color-primary-muted)',
                                        color: 'var(--color-primary)',
                                        border: '1px solid var(--color-primary)',
                                        fontWeight: 600,
                                    } : {
                                        background: 'var(--color-surface)',
                                        color: 'var(--color-text-secondary)',
                                        border: '1px solid var(--color-border)',
                                    }}
                                >
                                    <IconFlag />
                                    {filterFlagged ? 'Flagged only' : 'Show flagged'}
                                </button>

                                {hasActiveFilters && (
                                    <button
                                        type="button"
                                        onClick={() => { setSearch(''); setFilterStatus('All'); setFilterCategory('All'); setFilterOrg('All'); setFilterFlagged(false); }}
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
                                    {filterStatus !== 'All' && <FilterChip label={filterStatus} onRemove={() => setFilterStatus('All')} />}
                                    {filterCategory !== 'All' && <FilterChip label={filterCategory} onRemove={() => setFilterCategory('All')} />}
                                    {filterOrg !== 'All' && <FilterChip label={filterOrg} onRemove={() => setFilterOrg('All')} />}
                                    {filterFlagged && <FilterChip label="Flagged" onRemove={() => setFilterFlagged(false)} />}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Table ── */}
                <div className="card overflow-x-auto">
                    <table className="table-base">
                        <thead>
                            <tr>
                                <th>Event</th>
                                <th>Org</th>
                                <th>Venue</th>
                                <th>Category</th>
                                <th>Audience</th>
                                <th>Date</th>
                                <th>Capacity</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-10 text-sm text-[var(--color-text-muted)]">
                                        No events match your filters.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((ev) => (
                                    <tr key={ev.id} className={ev.isFlagged ? 'bg-amber-50/40' : ''}>
                                        {/* Title */}
                                        <td>
                                            <div className="flex items-center gap-2">
                                                {ev.isFlagged && (
                                                    <span
                                                        title={`Flagged${ev.flagReason ? `: ${ev.flagReason}` : ''}`}
                                                        className="text-amber-500 flex-shrink-0 cursor-help"
                                                    >
                                                        <IconFlag />
                                                    </span>
                                                )}
                                                <div>
                                                    <p className="text-sm font-medium text-[var(--color-text)] leading-tight">{ev.title}</p>
                                                    {ev.isPaid && (
                                                        <span className="text-[10px] text-[var(--color-text-muted)] font-medium">Paid Event</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-sm font-medium text-[var(--color-primary)]">
                                            <Link href={`/admin/organizations/org-placeholder`} className="hover:underline">
                                                {ev.hostOrg}
                                            </Link>
                                        </td>
                                        <td className="text-sm text-[var(--color-text-secondary)] whitespace-nowrap">{ev.venue}</td>
                                        <td>
                                            <span className="badge badge-blue">{ev.category}</span>
                                        </td>
                                        <td className="text-sm text-[var(--color-text-secondary)] whitespace-nowrap">
                                            {AUDIENCE_LABEL[ev.audienceType]}
                                        </td>
                                        <td className="text-sm text-[var(--color-text-secondary)] whitespace-nowrap">{ev.startDate}</td>
                                        <td className="text-sm text-[var(--color-text-secondary)]">
                                            <div className="flex items-center gap-1">
                                                <span className={ev.registrants >= ev.capacity ? 'text-[var(--color-error)]' : ''}>
                                                    {ev.registrants}
                                                </span>
                                                <span className="text-[var(--color-text-muted)]">/</span>
                                                <span>{ev.capacity}</span>
                                            </div>
                                            {/* Fill bar */}
                                            <div className="w-16 h-1 rounded-full bg-[var(--color-border)] mt-1 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full"
                                                    style={{
                                                        width: `${Math.min((ev.registrants / ev.capacity) * 100, 100)}%`,
                                                        backgroundColor: ev.registrants >= ev.capacity
                                                            ? 'var(--color-error)'
                                                            : 'var(--color-primary-light)',
                                                    }}
                                                />
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${STATUS_BADGE[ev.status]}`}>{ev.status}</span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-1.5">
                                                {/* Flag / Unflag */}
                                                <button
                                                    onClick={() => {
                                                        setConfirmFlag(ev);
                                                        setFlagReasonInput(ev.flagReason || '');
                                                    }}
                                                    title={ev.isFlagged ? 'Unflag' : 'Flag'}
                                                    className={`btn btn-sm ${ev.isFlagged ? 'btn-outline' : 'btn-ghost'} px-2`}
                                                >
                                                    <IconFlag />
                                                </button>
                                                {/* Remove */}
                                                <button
                                                    onClick={() => setConfirmRemove(ev)}
                                                    title="Remove event"
                                                    className="btn btn-sm btn-danger px-2"
                                                >
                                                    <IconTrash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Footer */}
                    <div className="px-4 py-3 border-t border-[var(--color-border)] flex items-center justify-between">
                        <p className="text-xs text-[var(--color-text-muted)]">
                            Showing {filtered.length} of {events.length} events
                        </p>
                        <div className="flex items-center gap-1">
                            <button className="btn btn-ghost btn-sm" disabled>← Prev</button>
                            <span className="text-xs px-3 py-1.5 rounded-md bg-[var(--color-primary-muted)] text-[var(--color-primary)] font-semibold">1</span>
                            <button className="btn btn-ghost btn-sm" disabled>Next →</button>
                        </div>
                    </div>
                </div>
            </main>

            {/* ── Remove Confirm Modal ── */}
            {confirmRemove && (
                <>
                    <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setConfirmRemove(null)} />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-fade-in">
                            <h3 className="text-base font-semibold text-[var(--color-text)] mb-2">Remove Event?</h3>
                            <p className="text-sm text-[var(--color-text-secondary)] mb-1">
                                Event: <span className="font-semibold">{confirmRemove.title}</span>
                            </p>
                            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                                This will permanently remove the event from the platform. All associated registrations and payment records will be preserved for audit purposes.
                            </p>
                            <div className="flex gap-3 justify-end">
                                <button className="btn btn-ghost" onClick={() => setConfirmRemove(null)}>Cancel</button>
                                <button className="btn btn-danger" onClick={() => handleRemove(confirmRemove)}>Yes, Remove</button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ── Flag Confirm Modal ── */}
            {confirmFlag && (
                <>
                    <div className="fixed inset-0 bg-black/40 z-50" onClick={() => { setConfirmFlag(null); setFlagReasonInput(''); }} />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-fade-in">
                            <h3 className="text-base font-semibold text-[var(--color-text)] mb-2">
                                {confirmFlag.isFlagged ? 'Remove Flag?' : 'Flag Event?'}
                            </h3>
                            <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                                Event: <span className="font-semibold">{confirmFlag.title}</span>
                            </p>
                            <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                                {confirmFlag.isFlagged
                                    ? 'This will clear the flag on this event. It will no longer appear in the flagged filter.'
                                    : 'Flagging this event marks it for review. The event remains visible to students but is highlighted for admin attention.'
                                }
                            </p>

                            {!confirmFlag.isFlagged && (
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-[var(--color-text)]">
                                        Reason for flagging <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={flagReasonInput}
                                        onChange={(e) => setFlagReasonInput(e.target.value)}
                                        className="w-full mt-1.5 p-3 text-sm rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] resize-y min-h-[80px]"
                                        placeholder="e.g., Missing venue details, suspicious links, etc."
                                        autoFocus
                                    />
                                </div>
                            )}

                            <div className={`flex gap-3 justify-end ${confirmFlag.isFlagged ? 'mt-6' : ''}`}>
                                <button className="btn btn-ghost" onClick={() => { setConfirmFlag(null); setFlagReasonInput(''); }}>Cancel</button>
                                <button
                                    className={`btn ${confirmFlag.isFlagged ? 'btn-outline' : 'btn-primary'}`}
                                    onClick={() => handleToggleFlag(confirmFlag, flagReasonInput)}
                                    disabled={!confirmFlag.isFlagged && !flagReasonInput.trim()}
                                >
                                    {confirmFlag.isFlagged ? 'Remove Flag' : 'Yes, Flag It'}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </AdminShell>
    );
}

/* ----------------------------------------------------------------
   Sub-components
   ---------------------------------------------------------------- */
const STAT_COLORS = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-700' },
    green: { bg: 'bg-[var(--color-primary-muted)]', text: 'text-[var(--color-primary)]' },
    yellow: { bg: 'bg-amber-50', text: 'text-amber-700' },
    gray: { bg: 'bg-[var(--color-surface-2)]', text: 'text-[var(--color-text-secondary)]' },
};

function StatCard({ label, value, color }: { label: string; value: number; color: keyof typeof STAT_COLORS }) {
    const c = STAT_COLORS[color];
    return (
        <div className={`card ${c.bg} border-0`}>
            <div className="card-body py-4">
                <p className={`text-2xl font-bold ${c.text}`}>{value}</p>
                <p className={`text-xs font-medium mt-0.5 ${c.text}`}>{label}</p>
            </div>
        </div>
    );
}

function IconSearch() {
    return (
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
            <path d="M9 17A8 8 0 109 1a8 8 0 000 16zM19 19l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

function IconFlag() {
    return (
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
            <path d="M4 3v14M4 3l12 5-12 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function IconTrash() {
    return (
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
            <path d="M6 4V3a1 1 0 011-1h6a1 1 0 011 1v1M3 4h14M5 4l1 13h8l1-13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
