'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import ManageShell from '@/components/ManageShell';

/* ----------------------------------------------------------------
   Types
   ---------------------------------------------------------------- */
type EventStatus = 'Upcoming' | 'Open' | 'Full' | 'Closed' | 'Completed' | 'Cancelled';
type EventCategory = 'Workshop' | 'Seminar' | 'Competition' | 'Activity' | 'Training' | 'Outreach' | 'Cultural' | 'Other';

interface ManagedEvent {
    id: string;
    title: string;
    category: EventCategory;
    start_date: string;
    end_date: string;
    venue_name: string;
    status: EventStatus;
    is_paid: boolean;
    capacity: number;
    total_registered: number;
    total_paid: number;
    total_pending: number;
    proofs_pending_review: number;
}

/* ----------------------------------------------------------------
   Mock data — replace with GET /api/manage/events
   ---------------------------------------------------------------- */
const MOCK_EVENTS: ManagedEvent[] = [
    {
        id: 'evt_001', title: 'Web Development Summit 2025', category: 'Workshop',
        start_date: '2025-03-12T08:00:00', end_date: '2025-03-12T17:00:00',
        venue_name: 'Main Hall', status: 'Open', is_paid: false,
        capacity: 150, total_registered: 42, total_paid: 42, total_pending: 0, proofs_pending_review: 0,
    },
    {
        id: 'evt_007', title: 'Research Writing Workshop', category: 'Workshop',
        start_date: '2025-04-05T09:00:00', end_date: '2025-04-05T12:00:00',
        venue_name: 'Library AVR', status: 'Upcoming', is_paid: false,
        capacity: 50, total_registered: 29, total_paid: 29, total_pending: 0, proofs_pending_review: 0,
    },
    {
        id: 'evt_003', title: 'Hackathon 2025', category: 'Competition',
        start_date: '2025-03-20T07:00:00', end_date: '2025-03-20T22:00:00',
        venue_name: 'Gymnasium', status: 'Open', is_paid: false,
        capacity: 200, total_registered: 188, total_paid: 188, total_pending: 0, proofs_pending_review: 0,
    },
    {
        id: 'evt_010', title: 'Data Science Bootcamp', category: 'Training',
        start_date: '2025-04-14T08:00:00', end_date: '2025-04-14T17:00:00',
        venue_name: 'ICT Building Lab 2', status: 'Upcoming', is_paid: true,
        capacity: 40, total_registered: 38, total_paid: 20, total_pending: 18, proofs_pending_review: 11,
    },
    {
        id: 'evt_004', title: 'Leadership Summit', category: 'Seminar',
        start_date: '2025-02-20T09:00:00', end_date: '2025-02-20T16:00:00',
        venue_name: 'AVR 2', status: 'Completed', is_paid: false,
        capacity: 80, total_registered: 75, total_paid: 75, total_pending: 0, proofs_pending_review: 0,
    },
    {
        id: 'evt_005', title: 'Community Outreach Program', category: 'Outreach',
        start_date: '2025-02-08T07:00:00', end_date: '2025-02-08T17:00:00',
        venue_name: 'Barangay Hall', status: 'Completed', is_paid: false,
        capacity: 60, total_registered: 60, total_paid: 60, total_pending: 0, proofs_pending_review: 0,
    },
    {
        id: 'evt_006', title: 'Tech Talk: AI & Ethics', category: 'Seminar',
        start_date: '2025-05-10T14:00:00', end_date: '2025-05-10T17:00:00',
        venue_name: 'Lecture Hall A', status: 'Upcoming', is_paid: false,
        capacity: 100, total_registered: 12, total_paid: 12, total_pending: 0, proofs_pending_review: 0,
    },
    {
        id: 'evt_008', title: 'Cultural Night 2025', category: 'Cultural',
        start_date: '2025-05-25T18:00:00', end_date: '2025-05-25T22:00:00',
        venue_name: 'Gymnasium', status: 'Upcoming', is_paid: true,
        capacity: 300, total_registered: 102, total_paid: 55, total_pending: 47, proofs_pending_review: 20,
    },
    {
        id: 'evt_009', title: 'Sports Fest Registration', category: 'Activity',
        start_date: '2025-01-15T08:00:00', end_date: '2025-01-15T17:00:00',
        venue_name: 'Sports Complex', status: 'Cancelled', is_paid: false,
        capacity: 120, total_registered: 34, total_paid: 34, total_pending: 0, proofs_pending_review: 0,
    },
];

/* ----------------------------------------------------------------
   Helpers
   ---------------------------------------------------------------- */
const NOW = new Date('2025-03-10T00:00:00');

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function daysUntil(iso: string) {
    return Math.ceil((new Date(iso).getTime() - NOW.getTime()) / 86400000);
}

const CATEGORY_COLORS: Record<EventCategory, string> = {
    Workshop: 'bg-blue-50 text-blue-700',
    Seminar: 'bg-purple-50 text-purple-700',
    Competition: 'bg-orange-50 text-orange-700',
    Activity: 'bg-indigo-50 text-indigo-700',
    Training: 'bg-yellow-50 text-yellow-800',
    Outreach: 'bg-teal-50 text-teal-700',
    Cultural: 'bg-pink-50 text-pink-700',
    Other: 'bg-gray-100 text-gray-600',
};

const STATUS_CONFIG: Record<EventStatus, { label: string; style: string }> = {
    Upcoming: { label: 'Upcoming', style: 'bg-blue-50 text-blue-700 border-blue-200' },
    Open: { label: 'Open', style: 'bg-green-50 text-green-700 border-green-200' },
    Full: { label: 'Full', style: 'bg-red-50 text-red-600 border-red-200' },
    Closed: { label: 'Closed', style: 'bg-gray-100 text-gray-500 border-gray-200' },
    Completed: { label: 'Completed', style: 'bg-gray-100 text-gray-500 border-gray-200' },
    Cancelled: { label: 'Cancelled', style: 'bg-red-50 text-red-500 border-red-200' },
};

const ALL_STATUSES: EventStatus[] = ['Upcoming', 'Open', 'Full', 'Closed', 'Completed', 'Cancelled'];
const ALL_CATEGORIES: EventCategory[] = ['Workshop', 'Seminar', 'Competition', 'Activity', 'Training', 'Outreach', 'Cultural', 'Other'];

type SortKey = 'date_asc' | 'date_desc' | 'title_asc' | 'registered_desc';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
    { value: 'date_desc', label: 'Newest first' },
    { value: 'date_asc', label: 'Oldest first' },
    { value: 'title_asc', label: 'Title A–Z' },
    { value: 'registered_desc', label: 'Most registered' },
];

/* ----------------------------------------------------------------
   Row component
   ---------------------------------------------------------------- */
function EventRow({ event }: { event: ManagedEvent }) {
    const fill = Math.min(Math.round((event.total_registered / event.capacity) * 100), 100);
    const isFull = fill >= 100;
    const days = daysUntil(event.start_date);
    const status = STATUS_CONFIG[event.status];

    return (
        <Link
            href={`/manage/events/${event.id}`}
            className="group flex flex-col sm:flex-row sm:items-center gap-3 bg-white border border-gray-200 hover:border-green-300 hover:bg-green-50/30 rounded-xl px-5 py-4 transition-all no-underline"
        >
            {/* Left: title + meta */}
            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${CATEGORY_COLORS[event.category]}`}>
                        {event.category}
                    </span>
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${status.style}`}>
                        {status.label}
                    </span>
                    {event.is_paid && (
                        <span className="text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full">
                            Paid
                        </span>
                    )}
                    {event.proofs_pending_review > 0 && (
                        <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full">
                            {event.proofs_pending_review} proofs
                        </span>
                    )}
                </div>

                <p className="text-[14px] font-bold text-gray-900 group-hover:text-green-800 transition-colors truncate">
                    {event.title}
                </p>

                <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                    <span className="flex items-center gap-1 text-[12px] text-gray-400">
                        <IconCalendar />
                        {formatDate(event.start_date)} · {formatTime(event.start_date)}
                    </span>
                    <span className="flex items-center gap-1 text-[12px] text-gray-400">
                        <IconPin />
                        {event.venue_name}
                    </span>
                </div>
            </div>

            {/* Right: capacity + countdown + arrow */}
            <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1.5 flex-shrink-0">
                {/* Capacity */}
                <div className="flex flex-col items-end gap-1 min-w-[120px]">
                    <div className="flex justify-between w-full text-[11px]">
                        <span className="text-gray-400">{event.total_registered}/{event.capacity}</span>
                        <span className={`font-semibold ${isFull ? 'text-red-500' : 'text-green-700'}`}>
                            {isFull ? 'Full' : `${fill}%`}
                        </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full ${isFull ? 'bg-red-400' : 'bg-green-500'}`}
                            style={{ width: `${fill}%` }}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {days >= 0 && event.status !== 'Completed' && event.status !== 'Cancelled' && (
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${days <= 3 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                            {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`}
                        </span>
                    )}
                    <svg className="w-4 h-4 text-gray-300 group-hover:text-green-500 transition-colors" viewBox="0 0 20 20" fill="none">
                        <path d="M7 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            </div>
        </Link>
    );
}

/* ----------------------------------------------------------------
   Page
   ---------------------------------------------------------------- */
export default function ManageEventsPage() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<EventStatus | 'All'>('All');
    const [categoryFilter, setCategoryFilter] = useState<EventCategory | 'All'>('All');
    const [sort, setSort] = useState<SortKey>('date_desc');

    const filtered = useMemo(() => {
        let result = [...MOCK_EVENTS];

        // Search
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(
                (e) =>
                    e.title.toLowerCase().includes(q) ||
                    e.venue_name.toLowerCase().includes(q) ||
                    e.category.toLowerCase().includes(q),
            );
        }

        // Status filter
        if (statusFilter !== 'All') {
            result = result.filter((e) => e.status === statusFilter);
        }

        // Category filter
        if (categoryFilter !== 'All') {
            result = result.filter((e) => e.category === categoryFilter);
        }

        // Sort
        result.sort((a, b) => {
            switch (sort) {
                case 'date_asc': return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
                case 'date_desc': return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
                case 'title_asc': return a.title.localeCompare(b.title);
                case 'registered_desc': return b.total_registered - a.total_registered;
                default: return 0;
            }
        });

        return result;
    }, [search, statusFilter, categoryFilter, sort]);

    // Status counts for pills
    const statusCounts = useMemo(() => {
        const counts: Partial<Record<EventStatus | 'All', number>> = { All: MOCK_EVENTS.length };
        for (const s of ALL_STATUSES) {
            counts[s] = MOCK_EVENTS.filter((e) => e.status === s).length;
        }
        return counts;
    }, []);

    const activeStatuses = ALL_STATUSES.filter((s) => (statusCounts[s] ?? 0) > 0);

    return (
        <ManageShell pageTitle="Salikop">
            <div className="flex flex-col gap-6 animate-fade-in">

                {/* ── Header ── */}
                <div className="flex flex-col w-full">
                    <div>
                        <p className="text-[12px] font-medium text-gray-400 uppercase tracking-wide leading-none">Manage</p>

                        {/* -mt-1.5 reduces the gap to the text above; items-center keeps the title and button perfectly aligned */}
                        <div className="flex flex-row items-center justify-between gap-4 w-full mt-0.2">
                            <div>
                                <h1 className="text-[22px] font-bold text-gray-900 tracking-tight leading-none">Events</h1>
                            </div>

                            <Link
                                href="/manage/create-event"
                                className="flex items-center gap-2 text-[13px] font-semibold bg-green-700 hover:bg-green-800 text-white px-3 py-2 rounded-lg transition-colors no-underline flex-shrink-0"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
                                    <path d="M10 5v10M5 10h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Create event
                            </Link>
                        </div>
                    </div>
                </div>


                {/* ── Status filter pills ── */}
                <div className="flex flex-wrap gap-1.5">
                    {(['All', ...activeStatuses] as const).map((s) => {
                        const isActive = statusFilter === s;
                        const cfg = s !== 'All' ? STATUS_CONFIG[s] : null;
                        return (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-full border transition-all cursor-pointer
                  ${isActive
                                        ? 'bg-green-700 text-white border-green-700'
                                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
                                    }`}
                            >
                                {s}
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                    {statusCounts[s] ?? 0}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* ── Search + filters row ── */}
                <div className="flex flex-col sm:flex-row gap-2">
                    {/* Search */}
                    <div className="relative flex-1">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" viewBox="0 0 20 20" fill="none">
                            <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
                            <path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search events..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-[13px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all"
                        />
                    </div>

                    {/* Category filter */}
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value as EventCategory | 'All')}
                        className="text-[13px] bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-green-400 cursor-pointer text-gray-600"
                    >
                        <option value="All">All categories</option>
                        {ALL_CATEGORIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>

                    {/* Sort */}
                    <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value as SortKey)}
                        className="text-[13px] bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-green-400 cursor-pointer text-gray-600"
                    >
                        {SORT_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </div>

                {/* ── Results ── */}
                <div className="flex flex-col gap-2">
                    {/* Result count */}
                    <p className="text-[12px] text-gray-400 font-medium">
                        {filtered.length === MOCK_EVENTS.length
                            ? `${MOCK_EVENTS.length} events`
                            : `${filtered.length} of ${MOCK_EVENTS.length} events`}
                    </p>

                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center bg-white rounded-xl border border-gray-200">
                            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                                <svg className="w-7 h-7 text-gray-300" viewBox="0 0 24 24" fill="none">
                                    <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-[14px] font-semibold text-gray-600">No events found</p>
                                <p className="text-[12px] text-gray-400 mt-0.5">Try adjusting your search or filters</p>
                            </div>
                            <button
                                onClick={() => { setSearch(''); setStatusFilter('All'); setCategoryFilter('All'); }}
                                className="text-[13px] font-semibold text-green-700 hover:underline"
                            >
                                Clear filters
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {filtered.map((event) => (
                                <EventRow key={event.id} event={event} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </ManageShell>
    );
}

/* ----------------------------------------------------------------
   Icons
   ---------------------------------------------------------------- */
function IconCalendar() {
    return (
        <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="none">
            <path d="M6 2v2M14 2v2M3 8h14M5 4h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

function IconPin() {
    return (
        <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 16 16" fill="none">
            <path d="M8 1C5.24 1 3 3.24 3 6c0 3.75 5 9 5 9s5-5.25 5-9c0-2.76-2.24-5-5-5zm0 6.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
    );
}