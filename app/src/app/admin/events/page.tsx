'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import AdminShell from '@/components/AdminShell';

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
    { id: 'ev-6', title: 'Community Feeding Drive', hostOrg: 'YFC', venue: 'TBA', category: 'Outreach', audienceType: 'Open', startDate: '2025-08-20', status: 'Upcoming', isPaid: false, capacity: 60, registrants: 4, isFlagged: true },
    { id: 'ev-7', title: 'Business Plan Competition', hostOrg: 'JMA', venue: 'AVR 1', category: 'Competition', audienceType: 'CvSU_Only', startDate: '2025-09-05', status: 'Upcoming', isPaid: true, capacity: 40, registrants: 0, isFlagged: false },
    { id: 'ev-8', title: 'Dance Workshop: Folklorico', hostOrg: 'CCC', venue: 'Mini Theater', category: 'Cultural', audienceType: 'Open', startDate: '2025-06-28', status: 'Full', isPaid: true, capacity: 25, registrants: 25, isFlagged: false },
    { id: 'ev-9', title: 'Budget 101: Financial Literacy', hostOrg: 'JMA', venue: 'AVR 2', category: 'Seminar', audienceType: 'Open', startDate: '2025-05-22', status: 'Completed', isPaid: false, capacity: 70, registrants: 55, isFlagged: false },
    { id: 'ev-10', title: 'App Dev Bootcamp', hostOrg: 'CSS', venue: 'CIT Lab 3', category: 'Workshop', audienceType: 'CvSU_Only', startDate: '2025-10-02', status: 'Upcoming', isPaid: true, capacity: 35, registrants: 0, isFlagged: true },
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

    function handleToggleFlag(ev: AdminEvent) {
        setEvents((prev) =>
            prev.map((e) => e.id === ev.id ? { ...e, isFlagged: !e.isFlagged } : e)
        );
        setConfirmFlag(null);
    }

    return (
        <AdminShell>
            <main className="flex flex-col gap-6 animate-fade-in">

                {/* ── Header ── */}
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

                {/* ── Filters ── */}
                <div className="card mb-6">
                    <div className="card-body py-4">
                        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">

                            {/* Search */}
                            <div className="input-icon-wrapper flex-1 min-w-[200px]">
                                <span className="input-icon-left"><IconSearch /></span>
                                <input
                                    type="text"
                                    className="input-has-left-icon"
                                    placeholder="Search by title, org, or venue…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                            {/* Status */}
                            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)} className="sm:w-36">
                                <option value="All">All Status</option>
                                {(['Upcoming', 'Open', 'Full', 'Closed', 'Completed', 'Cancelled'] as EventStatus[]).map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>

                            {/* Category */}
                            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value as typeof filterCategory)} className="sm:w-40">
                                <option value="All">All Categories</option>
                                {(['Workshop', 'Seminar', 'Competition', 'Activity', 'Training', 'Outreach', 'Cultural', 'Other'] as EventCategory[]).map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>

                            {/* Org */}
                            <select value={filterOrg} onChange={(e) => setFilterOrg(e.target.value)} className="sm:w-36">
                                {orgs.map((o) => (
                                    <option key={o} value={o}>{o === 'All' ? 'All Orgs' : o}</option>
                                ))}
                            </select>

                            {/* Flagged toggle */}
                            <button
                                onClick={() => setFilterFlagged((v) => !v)}
                                className={`btn btn-sm flex items-center gap-1.5 ${filterFlagged ? 'btn-primary' : 'btn-outline'}`}
                            >
                                <IconFlag /> {filterFlagged ? 'Showing Flagged' : 'Show Flagged'}
                            </button>
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
                                                    <span title="Flagged" className="text-amber-500 flex-shrink-0">
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
                                                    onClick={() => setConfirmFlag(ev)}
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
                    <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setConfirmFlag(null)} />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-fade-in">
                            <h3 className="text-base font-semibold text-[var(--color-text)] mb-2">
                                {confirmFlag.isFlagged ? 'Remove Flag?' : 'Flag Event?'}
                            </h3>
                            <p className="text-sm text-[var(--color-text-secondary)] mb-1">
                                Event: <span className="font-semibold">{confirmFlag.title}</span>
                            </p>
                            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                                {confirmFlag.isFlagged
                                    ? 'This will clear the flag on this event. It will no longer appear in the flagged filter.'
                                    : 'Flagging this event marks it for review. The event remains visible to students but is highlighted for admin attention.'
                                }
                            </p>
                            <div className="flex gap-3 justify-end">
                                <button className="btn btn-ghost" onClick={() => setConfirmFlag(null)}>Cancel</button>
                                <button
                                    className={`btn ${confirmFlag.isFlagged ? 'btn-outline' : 'btn-primary'}`}
                                    onClick={() => handleToggleFlag(confirmFlag)}
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