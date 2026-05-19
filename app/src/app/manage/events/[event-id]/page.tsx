'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import ManageShell from '@/components/ManageShell';

/* ----------------------------------------------------------------
   Types
   ---------------------------------------------------------------- */
type EventStatus = 'Upcoming' | 'Open' | 'Full' | 'Closed' | 'Completed' | 'Cancelled';
type EventCategory = 'Workshop' | 'Seminar' | 'Competition' | 'Activity' | 'Training' | 'Outreach' | 'Cultural' | 'Other';

interface ManagedEvent {
    id: string;
    title: string;
    description: string;
    category: EventCategory;
    start_date: string;
    end_date: string;
    venue_name: string;
    venue_address: string;
    status: EventStatus;
    is_paid: boolean;
    fee_amount?: number;
    capacity: number;
    total_registered: number;
    total_paid: number;
    total_pending: number;
    total_walkin: number;
    proofs_pending_review: number;
    created_at: string;
}

/* ----------------------------------------------------------------
   Mock data — replace with GET /api/manage/events/[id]
   ---------------------------------------------------------------- */
const MOCK_EVENTS: Record<string, ManagedEvent> = {
    evt_001: {
        id: 'evt_001', title: 'Web Development Summit 2025',
        description: 'A full-day workshop covering modern web development practices, frameworks, and industry trends for computer science students.',
        category: 'Workshop',
        start_date: '2025-03-12T08:00:00', end_date: '2025-03-12T17:00:00',
        venue_name: 'Main Hall', venue_address: 'Main Building, Ground Floor',
        status: 'Open', is_paid: false,
        capacity: 150, total_registered: 42, total_paid: 42, total_pending: 0, total_walkin: 0,
        proofs_pending_review: 0, created_at: '2025-02-15T10:00:00',
    },
    evt_010: {
        id: 'evt_010', title: 'Data Science Bootcamp',
        description: 'An intensive one-day bootcamp on data science fundamentals, machine learning basics, and hands-on Python exercises.',
        category: 'Training',
        start_date: '2025-04-14T08:00:00', end_date: '2025-04-14T17:00:00',
        venue_name: 'ICT Building Lab 2', venue_address: 'ICT Building, 2nd Floor',
        status: 'Upcoming', is_paid: true, fee_amount: 150,
        capacity: 40, total_registered: 38, total_paid: 20, total_pending: 18, total_walkin: 0,
        proofs_pending_review: 11, created_at: '2025-03-01T09:00:00',
    },
    evt_008: {
        id: 'evt_008', title: 'Cultural Night 2025',
        description: 'An evening celebrating student culture, talent shows, and organizational milestones.',
        category: 'Cultural',
        start_date: '2025-05-25T18:00:00', end_date: '2025-05-25T22:00:00',
        venue_name: 'Gymnasium', venue_address: 'Main Campus Gymnasium',
        status: 'Upcoming', is_paid: true, fee_amount: 80,
        capacity: 300, total_registered: 102, total_paid: 55, total_pending: 47, total_walkin: 0,
        proofs_pending_review: 20, created_at: '2025-03-10T11:00:00',
    },
};

/* ----------------------------------------------------------------
   Helpers
   ---------------------------------------------------------------- */
const NOW = new Date('2025-03-10T00:00:00');

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function daysUntil(iso: string) {
    return Math.ceil((new Date(iso).getTime() - NOW.getTime()) / 86400000);
}

const STATUS_CONFIG: Record<EventStatus, { label: string; style: string; dot: string }> = {
    Upcoming: { label: 'Upcoming', style: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
    Open: { label: 'Open', style: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
    Full: { label: 'Full', style: 'bg-red-50 text-red-600 border-red-200', dot: 'bg-red-400' },
    Closed: { label: 'Closed', style: 'bg-gray-100 text-gray-500 border-gray-200', dot: 'bg-gray-400' },
    Completed: { label: 'Completed', style: 'bg-gray-100 text-gray-500 border-gray-200', dot: 'bg-gray-400' },
    Cancelled: { label: 'Cancelled', style: 'bg-red-50 text-red-500 border-red-200', dot: 'bg-red-300' },
};

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

/* ----------------------------------------------------------------
   Stat card
   ---------------------------------------------------------------- */
function StatCard({ icon, value, label, sub, color = 'text-gray-900', bg = 'bg-white border-gray-200' }: {
    icon: React.ReactNode; value: number | string; label: string;
    sub?: string; color?: string; bg?: string;
}) {
    const iconBg =
        bg.includes('green') ? 'bg-green-100 text-green-700' :
            bg.includes('amber') ? 'bg-amber-100 text-amber-700' :
                bg.includes('blue') ? 'bg-blue-100 text-blue-700' :
                    bg.includes('red') ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500';

    return (
        <div className={`rounded-xl border ${bg} p-4 flex flex-col gap-3`}>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                {icon}
            </div>
            <div>
                <p className={`text-[26px] font-bold leading-none ${color}`}>{value}</p>
                <p className="text-[13px] font-medium text-gray-600 mt-1">{label}</p>
                {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

/* ----------------------------------------------------------------
   Quick action card
   ---------------------------------------------------------------- */
function ActionCard({ href, icon, label, desc, variant = 'default' }: {
    href: string; icon: React.ReactNode; label: string; desc: string;
    variant?: 'default' | 'primary' | 'warning';
}) {
    const styles = {
        default: 'border-gray-200 hover:border-green-300 hover:bg-green-50 text-gray-800 hover:text-green-700',
        primary: 'border-green-300 bg-green-700 hover:bg-green-800 text-white',
        warning: 'border-amber-200 hover:border-amber-300 hover:bg-amber-50 text-gray-800 hover:text-amber-700',
    };
    const iconStyles = {
        default: 'bg-gray-100 text-gray-500 group-hover:bg-green-100 group-hover:text-green-700',
        primary: 'bg-white/20 text-white',
        warning: 'bg-gray-100 text-gray-500 group-hover:bg-amber-100 group-hover:text-amber-700',
    };

    return (
        <Link
            href={href}
            className={`group flex items-center gap-3 rounded-xl border px-4 py-3.5 transition-all no-underline ${styles[variant]}`}
        >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${iconStyles[variant]}`}>
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <p className={`text-[13px] font-semibold leading-tight transition-colors ${variant === 'primary' ? 'text-white' : ''}`}>{label}</p>
                <p className={`text-[11px] mt-0.5 ${variant === 'primary' ? 'text-green-100' : 'text-gray-400'}`}>{desc}</p>
            </div>
            <svg className={`w-4 h-4 flex-shrink-0 transition-colors ${variant === 'primary' ? 'text-green-200' : 'text-gray-300 group-hover:text-current'}`} viewBox="0 0 20 20" fill="none">
                <path d="M7 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </Link>
    );
}

/* ----------------------------------------------------------------
   Page
   ---------------------------------------------------------------- */
export default function EventDashboardPage() {
    const params = useParams();
    const eventId = params['event-id'] as string;

    // Replace with actual fetch: GET /api/manage/events/[id]
    const event = MOCK_EVENTS[eventId] ?? MOCK_EVENTS['evt_010'];

    const fill = Math.min(Math.round((event.total_registered / event.capacity) * 100), 100);
    const isFull = fill >= 100;
    const days = daysUntil(event.start_date);
    const status = STATUS_CONFIG[event.status];
    const isActive = event.status === 'Open' || event.status === 'Upcoming';

    return (
        <ManageShell pageTitle="Salikop">
            <div className="flex flex-col gap-4 animate-fade-in">

                {/* ── Breadcrumb ── */}
                <Link
                    href="/manage/events"
                    className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors no-underline w-fit"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <path
                            d="M15 19l-7-7 7-7"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>

                    Back to Events
                </Link>

                {/* ── Header ── */}
                <div className="flex flex-col gap-3 bg-white border border-gray-200 rounded-xl px-5 py-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex flex-col gap-2 flex-1 min-w-0">
                            {/* Badges */}
                            <div className="flex flex-wrap items-center gap-1.5">
                                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${CATEGORY_COLORS[event.category]}`}>
                                    {event.category}
                                </span>
                                <span className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${status.style}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                    {status.label}
                                </span>
                                {event.is_paid && (
                                    <span className="text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full">
                                        Paid · ₱{event.fee_amount}
                                    </span>
                                )}
                                {isActive && days >= 0 && (
                                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${days <= 3 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                                        {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days} days away`}
                                    </span>
                                )}
                            </div>

                            <h1 className="text-[20px] font-bold text-gray-900 leading-tight">{event.title}</h1>
                            <p className="text-[13px] text-gray-500 leading-relaxed">{event.description}</p>
                        </div>

                        {/* Edit shortcut */}
                        <Link
                            href={`/manage/events/${event.id}/edit`}
                            className="flex items-center gap-2 text-[13px] font-semibold text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 px-3 py-2 rounded-lg transition-all no-underline flex-shrink-0"
                        >
                            <IconEdit />
                            Edit event
                        </Link>
                    </div>

                    {/* Meta row */}
                    <div className="flex flex-wrap gap-x-5 gap-y-2 pt-2 border-t border-gray-100">
                        <span className="flex items-center gap-1.5 text-[12px] text-gray-500">
                            <IconCalendar />
                            {formatDate(event.start_date)}
                        </span>
                        <span className="flex items-center gap-1.5 text-[12px] text-gray-500">
                            <IconClock />
                            {formatTime(event.start_date)} – {formatTime(event.end_date)}
                        </span>
                        <span className="flex items-center gap-1.5 text-[12px] text-gray-500">
                            <IconPin />
                            {event.venue_name} · {event.venue_address}
                        </span>
                        <span className="flex items-center gap-1.5 text-[12px] text-gray-400">
                            <IconInfo />
                            Created {formatDate(event.created_at)}
                        </span>
                    </div>
                </div>

                {/* ── Proofs alert ── */}
                {event.proofs_pending_review > 0 && (
                    <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3.5">
                        <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="none">
                            <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 4v5m0 3v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        <p className="text-[13px] font-semibold text-blue-800">
                            {event.proofs_pending_review} payment proof{event.proofs_pending_review > 1 ? 's' : ''} awaiting review —{' '}
                            <Link href={`/manage/events/${event.id}/participants`} className="underline text-blue-700">
                                review in participants
                            </Link>
                        </p>
                    </div>
                )}

                {/* ── Stats ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <StatCard
                        icon={<IconUsers />}
                        value={event.total_registered}
                        label="Registered"
                        sub={`of ${event.capacity} capacity`}
                        color={isFull ? 'text-red-600' : 'text-gray-900'}
                        bg={isFull ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}
                    />
                    {event.is_paid ? (
                        <>
                            <StatCard icon={<IconCheck />} value={event.total_paid} label="Confirmed paid" sub="Payment verified" color="text-green-700" bg="bg-green-50 border-green-200" />
                            <StatCard icon={<IconClock />} value={event.total_pending} label="Pending payment" sub="Awaiting confirmation" color="text-amber-700" bg="bg-amber-50 border-amber-200" />
                            <StatCard icon={<IconProof />} value={event.proofs_pending_review} label="Proofs to review" sub="Uploaded receipts" color="text-blue-700" bg="bg-blue-50 border-blue-200" />
                        </>
                    ) : (
                        <>
                            <StatCard icon={<IconSlots />} value={event.capacity - event.total_registered} label="Slots remaining" sub="Open registration" color="text-green-700" bg="bg-green-50 border-green-200" />
                            <StatCard icon={<IconPercent />} value={`${fill}%`} label="Capacity filled" sub="Registration rate" />
                            <StatCard icon={<IconWalkin />} value={event.total_walkin} label="Walk-ins" sub="At the door" />
                        </>
                    )}
                </div>

                {/* ── Capacity bar ── */}
                <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <p className="text-[13px] font-semibold text-gray-700">Registration capacity</p>
                        <span className={`text-[13px] font-bold ${isFull ? 'text-red-500' : 'text-green-700'}`}>
                            {event.total_registered} / {event.capacity}
                        </span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${isFull ? 'bg-red-400' : fill > 80 ? 'bg-amber-400' : 'bg-green-500'}`}
                            style={{ width: `${fill}%` }}
                        />
                    </div>

                    {/* Payment breakdown bar (paid events only) */}
                    {event.is_paid && event.total_registered > 0 && (
                        <div className="flex flex-col gap-2 pt-1 border-t border-gray-100">
                            <p className="text-[12px] font-semibold text-gray-600">Payment breakdown</p>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                                <div className="h-full bg-green-500" style={{ width: `${(event.total_paid / event.total_registered) * 100}%` }} />
                                <div className="h-full bg-amber-400" style={{ width: `${(event.total_pending / event.total_registered) * 100}%` }} />
                            </div>
                            <div className="flex flex-wrap gap-4 text-[12px] text-gray-500">
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-green-500" />
                                    {event.total_paid} paid
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                                    {event.total_pending} pending
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Quick actions ── */}
                <div className="flex flex-col gap-3">
                    <h2 className="text-[14px] font-bold text-gray-800">Quick actions</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <ActionCard
                            href={`/manage/events/${event.id}/participants`}
                            icon={<IconUsers />}
                            label="Participants & masterlist"
                            desc="View registrations, manage payment status"
                            variant="default"
                        />
                        <ActionCard
                            href={`/manage/events/${event.id}/verify`}
                            icon={<IconScan />}
                            label="Entrance verification"
                            desc="Scan QR codes at the door"
                            variant="primary"
                        />
                        <ActionCard
                            href={`/manage/events/${event.id}/edit`}
                            icon={<IconEdit />}
                            label="Edit event details"
                            desc="Update title, schedule, venue, capacity"
                            variant="default"
                        />
                        <ActionCard
                            href={`/manage/events/${event.id}/settings`}
                            icon={<IconSettings />}
                            label="Event settings"
                            desc="Archive or delete this event"
                            variant="warning"
                        />
                    </div>
                </div>

            </div>
        </ManageShell>
    );
}

/* ----------------------------------------------------------------
   Icons
   ---------------------------------------------------------------- */
function IconCalendar() { return <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="none"><path d="M6 2v2M14 2v2M3 8h14M5 4h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>; }
function IconClock() { return <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" /><path d="M10 6v4.5l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>; }
function IconPin() { return <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 16 16" fill="none"><path d="M8 1C5.24 1 3 3.24 3 6c0 3.75 5 9 5 9s5-5.25 5-9c0-2.76-2.24-5-5-5zm0 6.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>; }
function IconUsers() { return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM3 17a7 7 0 1114 0H3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>; }
function IconCheck() { return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" /><path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function IconProof() { return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none"><path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M8 11h4M8 14h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>; }
function IconSlots() { return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" /><rect x="11" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" /><rect x="3" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" /><path d="M14 11v6M11 14h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>; }
function IconPercent() { return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none"><path d="M6 14L14 6M7 7a1 1 0 110-2 1 1 0 010 2zm6 6a1 1 0 110-2 1 1 0 010 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>; }
function IconWalkin() { return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none"><path d="M10 3a1 1 0 100 2 1 1 0 000-2zM6.343 6.343a6 6 0 108.485 8.485M7 10l3 3 4-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function IconScan() { return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none"><path d="M2 7V4a2 2 0 012-2h3M13 2h3a2 2 0 012 2v3M18 13v3a2 2 0 01-2 2h-3M7 18H4a2 2 0 01-2-2v-3M5 10h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>; }
function IconEdit() { return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none"><path d="M13.586 3.586a2 2 0 112.828 2.828l-9.9 9.9-3.414.586.586-3.414 9.9-9.9z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function IconSettings() { return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" /></svg>; }
function IconInfo() { return <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" /><path d="M10 9v5M10 7v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>; }