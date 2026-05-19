'use client';

import Link from 'next/link';
import ManageShell from '@/components/ManageShell';

/* ----------------------------------------------------------------
   Types — aligned to DB schema
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

interface OrgSummary {
  id: string;
  name: string;
  acronym: string;
  accreditation_status: 'Active' | 'Suspended';
  adviser: string;
}

/* ----------------------------------------------------------------
   Mock data — replace with GET /api/manage/dashboard
   ---------------------------------------------------------------- */
const MOCK_ORG: OrgSummary = {
  id: 'csso',
  name: 'Computer Science Society',
  acronym: 'CSSO',
  accreditation_status: 'Active',
  adviser: 'Prof. Maria Santos',
};

const ALL_EVENTS: ManagedEvent[] = [
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
];

/* ----------------------------------------------------------------
   Dashboard shows only active (Open/Upcoming) events, capped at 4
   ---------------------------------------------------------------- */
const RECENT_LIMIT = 4;

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
   Event card — links to /manage/events/[event-id]
   ---------------------------------------------------------------- */
function EventCard({ event }: { event: ManagedEvent }) {
  const fill = Math.min(Math.round((event.total_registered / event.capacity) * 100), 100);
  const isFull = fill >= 100;
  const days = daysUntil(event.start_date);
  const status = STATUS_CONFIG[event.status];

  return (
    /* Title row clicks through to event overview */
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3 hover:shadow-sm transition-shadow">

      {/* Badges + countdown */}
      <div className="flex flex-wrap items-center justify-between gap-2">
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
        </div>
        {days >= 0 && event.status !== 'Completed' && event.status !== 'Cancelled' && (
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${days <= 3 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
            {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d away`}
          </span>
        )}
      </div>

      {/* Title — links to event overview */}
      <Link
        href={`/manage/events/${event.id}`}
        className="text-[15px] font-bold text-gray-900 leading-snug hover:text-green-700 transition-colors no-underline"
      >
        {event.title}
      </Link>

      {/* Meta */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <span className="flex items-center gap-1.5 text-[12px] text-gray-500">
          <IconClock />
          {formatDate(event.start_date)} · {formatTime(event.start_date)}
        </span>
        <span className="flex items-center gap-1.5 text-[12px] text-gray-500">
          <IconPin />
          {event.venue_name}
        </span>
      </div>

      {/* Capacity bar */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-[12px]">
          <span className="text-gray-500">{event.total_registered} / {event.capacity} registered</span>
          <span className={`font-semibold ${isFull ? 'text-red-500' : 'text-green-700'}`}>
            {isFull ? 'Full' : `${event.capacity - event.total_registered} left`}
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${isFull ? 'bg-red-400' : 'bg-green-600'}`}
            style={{ width: `${fill}%` }}
          />
        </div>
      </div>

      {/* Payment summary */}
      {event.is_paid && (
        <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100">
          <span className="flex items-center gap-1.5 text-[12px] text-gray-600">
            <span className="w-2 h-2 rounded-full bg-green-500" />{event.total_paid} paid
          </span>
          <span className="flex items-center gap-1.5 text-[12px] text-gray-600">
            <span className="w-2 h-2 rounded-full bg-amber-400" />{event.total_pending} pending
          </span>
          {event.proofs_pending_review > 0 && (
            <span className="flex items-center gap-1.5 text-[12px] text-blue-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-blue-400" />{event.proofs_pending_review} proofs to review
            </span>
          )}
        </div>
      )}

      {/* Actions — all pointing to /manage/events/[id] sub-routes */}
      <div className="flex flex-wrap gap-2 pt-1">
        <Link
          href={`/manage/participants/${event.id}`}
          className="flex items-center gap-1.5 text-[12px] font-semibold text-green-700 border border-green-200 hover:bg-green-50 hover:border-green-400 px-3 py-1.5 rounded-lg transition-all no-underline"
        >
          <IconUsers /> Masterlist
        </Link>
        <Link
          href={`/manage/verify/${event.id}`}
          className="flex items-center gap-1.5 text-[12px] font-semibold text-white bg-green-700 hover:bg-green-800 px-3 py-1.5 rounded-lg transition-colors no-underline"
        >
          <IconScan /> Entrance panel
        </Link>
        <Link
          href={`/manage/events/${event.id}`}
          className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-500 border border-gray-200 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-all no-underline ml-auto"
        >
          <IconChevronRight /> Overview
        </Link>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------
   Page
   ---------------------------------------------------------------- */
export default function ManageDashboardPage() {
  const org = MOCK_ORG;

  // Dashboard metrics across all events
  const totalRegistered = ALL_EVENTS.reduce((s, e) => s + e.total_registered, 0);
  const totalPending = ALL_EVENTS.reduce((s, e) => s + e.total_pending, 0);
  const totalProofsReview = ALL_EVENTS.reduce((s, e) => s + e.proofs_pending_review, 0);
  const activeEvents = ALL_EVENTS.filter(e => e.status === 'Open' || e.status === 'Upcoming');

  // Dashboard shows only recent active events, capped
  const recentEvents = activeEvents.slice(0, RECENT_LIMIT);
  const hasMore = ALL_EVENTS.length > RECENT_LIMIT;

  return (
    <ManageShell pageTitle="Salikop">
      <div className="flex flex-col gap-6 animate-fade-in">

        {/* ── Header ── */}
        <div>
          <p className="text-[12px] font-medium text-gray-400 uppercase tracking-wide">Manage</p>
          <h1 className="text-[22px] font-bold text-gray-900 tracking-tight mt-0.5">Dashboard</h1>
        </div>

        {/* ── Org identity strip ── */}
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 text-[14px] font-bold text-blue-700">
              {org.acronym.slice(0, 2)}
            </div>
            <div>
              <p className="text-[15px] font-bold text-gray-900">{org.name}</p>
              <p className="text-[12px] text-gray-400">Adviser: {org.adviser}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {org.accreditation_status === 'Active' ? (
              <span className="flex items-center gap-1.5 text-[12px] font-semibold bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />Accredited · Active
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[12px] font-semibold bg-red-50 text-red-500 border border-red-200 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />Suspended
              </span>
            )}
            <Link
              href="/manage/org-profile"
              className="text-[12px] font-semibold text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-700 px-3 py-1.5 rounded-lg transition-all no-underline"
            >
              Edit profile
            </Link>
          </div>
        </div>

        {/* ── Suspended alert ── */}
        {org.accreditation_status === 'Suspended' && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3.5">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="none">
              <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 4v5m0 3v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <div>
              <p className="text-[13px] font-semibold text-red-700">Organization is suspended</p>
              <p className="text-[12px] text-red-600 mt-0.5">Your organization cannot publish events while suspended. Contact the OSA to resolve your accreditation status.</p>
            </div>
          </div>
        )}

        {/* ── Proofs alert ── */}
        {totalProofsReview > 0 && (
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3.5">
            <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="none">
              <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 4v5m0 3v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <p className="text-[13px] font-semibold text-blue-800">
              {totalProofsReview} payment proof{totalProofsReview > 1 ? 's' : ''} awaiting your review —{' '}
              <Link href="/manage/participants/evt_010" className="underline text-blue-700">review now</Link>
            </p>
          </div>
        )}

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={<IconCalendar />} value={activeEvents.length} label="Active events" sub="Open + Upcoming" color="text-green-700" bg="bg-green-50 border-green-200" />
          <StatCard icon={<IconUsers />} value={totalRegistered} label="Total registrations" sub="Across all events" />
          <StatCard icon={<IconClock />} value={totalPending} label="Pending payments" sub="Awaiting confirmation" color="text-amber-700" bg="bg-amber-50 border-amber-200" />
          <StatCard icon={<IconProof />} value={totalProofsReview} label="Proofs to review" sub="Online payment uploads" color="text-blue-700" bg="bg-blue-50 border-blue-200" />
        </div>

        {/* ── Recent active events ── */}
        <div className="flex flex-col gap-4">

          {/* Section header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-gray-800">Active events</h2>
              <p className="text-[12px] text-gray-400 mt-0.5">
                {recentEvents.length === 0
                  ? 'No active events right now'
                  : `Showing ${recentEvents.length} of ${activeEvents.length} active event${activeEvents.length !== 1 ? 's' : ''}`}
              </p>
            </div>
            <Link
              href="/manage/events"
              className="flex items-center gap-1.5 text-[12px] font-semibold text-green-700 hover:text-green-800 hover:bg-green-50 border border-green-200 hover:border-green-300 px-3.5 py-1.5 rounded-lg transition-all no-underline"
            >
              View all
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </Link>
          </div>

          {recentEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center bg-white rounded-xl border border-gray-200">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-7 h-7 text-gray-300" viewBox="0 0 24 24" fill="none">
                  <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-[14px] font-semibold text-gray-600">No active events</p>
              <Link
                href="/manage/create-event"
                className="text-[13px] font-semibold bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg transition-colors no-underline"
              >
                Create your first event
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {recentEvents.map(event => <EventCard key={event.id} event={event} />)}
              </div>

              {/* "View all" footer CTA when there are more events */}
              {hasMore && (
                <Link
                  href="/manage/events"
                  className="flex items-center justify-center gap-2 text-[13px] font-semibold text-gray-500 hover:text-green-700 border border-gray-200 hover:border-green-300 hover:bg-green-50 py-3 rounded-xl transition-all no-underline"
                >
                  <IconCalendar />
                  View all {ALL_EVENTS.length} events
                  <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
                    <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </Link>
              )}
            </>
          )}
        </div>

        {/* ── Quick nav ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { href: '/manage/create-event', icon: <IconAdd />, label: 'Create event', desc: 'Publish a new campus event' },
            { href: '/manage/org-profile', icon: <IconOrgEdit />, label: 'Edit org profile', desc: 'Update name, logo, and description' },
            { href: '/events', icon: <IconEye />, label: 'View public page', desc: "See your org's events as students" },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-3 bg-white border border-gray-200 hover:border-green-300 hover:bg-green-50 rounded-xl px-4 py-3.5 transition-all no-underline"
            >
              <div className="w-9 h-9 rounded-lg bg-gray-100 group-hover:bg-green-100 flex items-center justify-center flex-shrink-0 text-gray-500 group-hover:text-green-700 transition-colors">
                {item.icon}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-gray-800 group-hover:text-green-700 transition-colors">{item.label}</p>
                <p className="text-[11px] text-gray-400">{item.desc}</p>
              </div>
              <svg className="w-4 h-4 text-gray-300 group-hover:text-green-500 transition-colors ml-auto flex-shrink-0" viewBox="0 0 20 20" fill="none">
                <path d="M7 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          ))}
        </div>

      </div>
    </ManageShell>
  );
}

/* ----------------------------------------------------------------
   Icons
   ---------------------------------------------------------------- */
function IconCalendar() { return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none"><path d="M6 2v2M14 2v2M3 8h14M5 4h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>; }
function IconUsers() { return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM3 17a7 7 0 1114 0H3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>; }
function IconClock() { return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" /><path d="M10 6v4.5l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>; }
function IconProof() { return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none"><path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M8 11h4M8 14h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>; }
function IconPin() { return <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 16 16" fill="none"><path d="M8 1C5.24 1 3 3.24 3 6c0 3.75 5 9 5 9s5-5.25 5-9c0-2.76-2.24-5-5-5zm0 6.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>; }
function IconScan() { return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none"><path d="M2 7V4a2 2 0 012-2h3M13 2h3a2 2 0 012 2v3M18 13v3a2 2 0 01-2 2h-3M7 18H4a2 2 0 01-2-2v-3M5 10h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>; }
function IconAdd() { return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none"><path d="M10 5v10M5 10h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function IconOrgEdit() { return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none"><path d="M4 4h8l4 4v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>; }
function IconEye() { return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none"><path d="M2 10c1.73-2.49 4.58-5 8-5s6.27 2.51 8 5c-1.73 2.49-4.58 5-8 5s-6.27-2.51-8-5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" /></svg>; }
function IconChevronRight() { return <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>; }