'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

/* ----------------------------------------------------------------
   Types — aligned to DB schema
   ----------------------------------------------------------------

   Registrations table:
     id, event_id, user_id, reg_date,
     payment_selection (Online | On-site | N/A),
     payment_status    (Pending | Paid),
     attendance_status (Not_Arrived | Checked_In)

   Events table (joined):
     id, title, banner_url, start_date, end_date,
     is_paid, status, venue_id → Venues(name),
     category_id → Event_Categories(name),
     host_org_id → Organizations(name)

   Payment_Proofs table (joined when payment_selection = Online):
     status (Pending_Review | Approved | Rejected)
   ---------------------------------------------------------------- */

type PaymentSelection  = 'Online' | 'On-site' | 'N/A';
type PaymentStatus     = 'Pending' | 'Paid';
type AttendanceStatus  = 'Not_Arrived' | 'Checked_In';
type ProofStatus       = 'Pending_Review' | 'Approved' | 'Rejected';
type EventStatus       = 'Upcoming' | 'Open' | 'Full' | 'Closed' | 'Completed' | 'Cancelled';
type EventCategory     = 'Workshop' | 'Seminar' | 'Competition' | 'Activity' | 'Training' | 'Outreach' | 'Cultural' | 'Other';

interface MyRegistration {
  /* Registrations */
  id: string;                         // reg id
  event_id: string;
  reg_date: string;                   // ISO timestamp
  payment_selection: PaymentSelection;
  payment_status: PaymentStatus;
  attendance_status: AttendanceStatus;

  /* Events (joined) */
  event_title: string;
  event_status: EventStatus;
  event_start_date: string;           // ISO datetime
  event_end_date: string;
  event_is_paid: boolean;
  event_banner_color: string;         // placeholder until banner_url exists

  /* Venues (joined) */
  venue_name: string;

  /* Event_Categories (joined) */
  category_name: EventCategory;

  /* Organizations (joined) */
  org_name: string;

  /* Payment_Proofs (joined, nullable) */
  proof_status?: ProofStatus;
}

/* ----------------------------------------------------------------
   Mock data — shape mirrors what a JOIN query would return
   Replace with: GET /api/me/registrations
   ---------------------------------------------------------------- */
const MOCK_REGISTRATIONS: MyRegistration[] = [
  /* ── Upcoming / Open ── */
  {
    id: 'reg_001', event_id: 'evt_001', reg_date: '2025-02-20T10:00:00',
    payment_selection: 'N/A', payment_status: 'Paid', attendance_status: 'Not_Arrived',
    event_title: 'Web Development Summit 2025', event_status: 'Open',
    event_start_date: '2025-03-12T08:00:00', event_end_date: '2025-03-12T17:00:00',
    event_is_paid: false, event_banner_color: 'bg-blue-100',
    venue_name: 'Main Hall', category_name: 'Workshop', org_name: 'Computer Science Society',
  },
  {
    id: 'reg_002', event_id: 'evt_002', reg_date: '2025-02-22T14:30:00',
    payment_selection: 'Online', payment_status: 'Pending', attendance_status: 'Not_Arrived',
    event_title: 'Leadership & Governance Talk', event_status: 'Open',
    event_start_date: '2025-03-15T13:00:00', event_end_date: '2025-03-15T16:00:00',
    event_is_paid: true, event_banner_color: 'bg-purple-100',
    venue_name: 'AVR Building B', category_name: 'Seminar', org_name: 'University Student Council',
    proof_status: 'Pending_Review',
  },
  {
    id: 'reg_003', event_id: 'evt_003', reg_date: '2025-02-18T09:15:00',
    payment_selection: 'N/A', payment_status: 'Paid', attendance_status: 'Not_Arrived',
    event_title: 'Hackathon 2025', event_status: 'Open',
    event_start_date: '2025-03-20T07:00:00', event_end_date: '2025-03-20T22:00:00',
    event_is_paid: false, event_banner_color: 'bg-orange-100',
    venue_name: 'Gymnasium', category_name: 'Competition', org_name: 'GDSC CvSU',
  },
  {
    id: 'reg_004', event_id: 'evt_010', reg_date: '2025-03-01T11:00:00',
    payment_selection: 'On-site', payment_status: 'Pending', attendance_status: 'Not_Arrived',
    event_title: 'Data Science Bootcamp', event_status: 'Upcoming',
    event_start_date: '2025-04-14T08:00:00', event_end_date: '2025-04-14T17:00:00',
    event_is_paid: true, event_banner_color: 'bg-orange-50',
    venue_name: 'ICT Building Lab 2', category_name: 'Training', org_name: 'GDSC CvSU',
  },
  /* ── Past / Completed ── */
  {
    id: 'reg_005', event_id: 'evt_p01', reg_date: '2025-01-05T08:00:00',
    payment_selection: 'N/A', payment_status: 'Paid', attendance_status: 'Checked_In',
    event_title: 'UI/UX Design Workshop', event_status: 'Completed',
    event_start_date: '2025-01-15T09:00:00', event_end_date: '2025-01-15T15:00:00',
    event_is_paid: false, event_banner_color: 'bg-blue-50',
    venue_name: 'Library AVR', category_name: 'Workshop', org_name: 'Computer Science Society',
  },
  {
    id: 'reg_006', event_id: 'evt_p02', reg_date: '2025-01-10T10:00:00',
    payment_selection: 'Online', payment_status: 'Paid', attendance_status: 'Checked_In',
    event_title: 'Campus Leadership Summit', event_status: 'Completed',
    event_start_date: '2025-01-28T13:00:00', event_end_date: '2025-01-28T17:00:00',
    event_is_paid: true, event_banner_color: 'bg-purple-50',
    venue_name: 'Main Hall', category_name: 'Seminar', org_name: 'University Student Council',
    proof_status: 'Approved',
  },
  {
    id: 'reg_007', event_id: 'evt_p03', reg_date: '2025-01-28T09:00:00',
    payment_selection: 'N/A', payment_status: 'Paid', attendance_status: 'Not_Arrived',
    event_title: 'Environmental Awareness Seminar', event_status: 'Completed',
    event_start_date: '2025-02-05T10:00:00', event_end_date: '2025-02-05T12:00:00',
    event_is_paid: false, event_banner_color: 'bg-green-50',
    venue_name: 'AVR Building A', category_name: 'Seminar', org_name: 'CvSU Volunteers Club',
  },
  {
    id: 'reg_008', event_id: 'evt_p04', reg_date: '2025-02-01T08:00:00',
    payment_selection: 'Online', payment_status: 'Pending', attendance_status: 'Not_Arrived',
    event_title: 'Algorithm & Data Structures Review', event_status: 'Completed',
    event_start_date: '2025-02-15T08:00:00', event_end_date: '2025-02-15T12:00:00',
    event_is_paid: true, event_banner_color: 'bg-red-50',
    venue_name: 'ICT Building Lab 1', category_name: 'Training', org_name: 'Computer Science Society',
    proof_status: 'Rejected',
  },
];

/* ----------------------------------------------------------------
   Helpers
   ---------------------------------------------------------------- */
const NOW = new Date('2025-03-10T00:00:00');

function isUpcoming(reg: MyRegistration) {
  return new Date(reg.event_start_date) >= NOW;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-PH', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

function daysUntil(iso: string): string | null {
  const diff = Math.ceil((new Date(iso).getTime() - NOW.getTime()) / 86400000);
  if (diff < 0)  return null;
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return `In ${diff} days`;
}

/* Category badge colors */
const CATEGORY_COLORS: Record<EventCategory, string> = {
  Workshop:    'bg-blue-50 text-blue-700',
  Seminar:     'bg-purple-50 text-purple-700',
  Competition: 'bg-orange-50 text-orange-700',
  Activity:    'bg-indigo-50 text-indigo-700',
  Training:    'bg-yellow-50 text-yellow-800',
  Outreach:    'bg-teal-50 text-teal-700',
  Cultural:    'bg-pink-50 text-pink-700',
  Other:       'bg-gray-100 text-gray-600',
};

/* Derive the registration pill label + style from DB fields */
function getStatusPill(reg: MyRegistration): { label: string; style: string; dot: string } {
  // Free event — always confirmed
  if (!reg.event_is_paid) {
    return { label: 'Confirmed', style: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' };
  }
  // Paid — Paid
  if (reg.payment_status === 'Paid') {
    return { label: 'Confirmed', style: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' };
  }
  // Paid — Online — proof rejected
  if (reg.payment_selection === 'Online' && reg.proof_status === 'Rejected') {
    return { label: 'Proof rejected', style: 'bg-red-50 text-red-600 border-red-200', dot: 'bg-red-400' };
  }
  // Paid — Online — proof pending review
  if (reg.payment_selection === 'Online' && reg.proof_status === 'Pending_Review') {
    return { label: 'Under review', style: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-400' };
  }
  // Paid — Online — no proof yet uploaded
  if (reg.payment_selection === 'Online' && !reg.proof_status) {
    return { label: 'Upload required', style: 'bg-red-50 text-red-600 border-red-200', dot: 'bg-red-400' };
  }
  // Paid — On-site — pending cash at door
  if (reg.payment_selection === 'On-site') {
    return { label: 'Pay on-site', style: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400' };
  }
  return { label: 'Pending', style: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400' };
}

/* Attendance pill */
function getAttendancePill(status: AttendanceStatus): { label: string; style: string } | null {
  if (status === 'Checked_In') return { label: 'Checked in', style: 'bg-green-100 text-green-700' };
  return null;
}

/* Whether to show "Upload proof" action */
function needsUpload(reg: MyRegistration) {
  return (
    reg.event_is_paid &&
    reg.payment_selection === 'Online' &&
    reg.payment_status === 'Pending' &&
    (reg.proof_status === undefined || reg.proof_status === 'Rejected')
  );
}

/* ----------------------------------------------------------------
   Registration Card
   ---------------------------------------------------------------- */
function RegistrationCard({ reg, isUpcomingTab }: { reg: MyRegistration; isUpcomingTab: boolean }) {
  const statusPill     = getStatusPill(reg);
  const attendancePill = getAttendancePill(reg.attendance_status);
  const countdown      = isUpcomingTab ? daysUntil(reg.event_start_date) : null;
  const showUpload     = needsUpload(reg);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow duration-150">
      <div className="flex flex-col sm:flex-row">

        {/* ── Banner strip ── */}
        <div className={`${reg.event_banner_color} sm:w-[100px] h-24 sm:h-auto flex-shrink-0 flex items-center justify-center relative`}>
          <svg className="w-8 h-8 text-gray-300" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M8 2v4M16 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          {countdown && (
            <span className="absolute top-2 left-2 text-[10px] font-bold bg-green-700 text-white px-2 py-0.5 rounded-full whitespace-nowrap">
              {countdown}
            </span>
          )}
          {/* Checked-in badge on banner */}
          {attendancePill && (
            <span className="absolute bottom-2 left-2 text-[10px] font-bold bg-green-700 text-white px-2 py-0.5 rounded-full">
              ✓ In
            </span>
          )}
        </div>

        {/* ── Content ── */}
        <div className="flex-1 p-4 flex flex-col gap-2 min-w-0">

          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Category */}
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${CATEGORY_COLORS[reg.category_name]}`}>
              {reg.category_name}
            </span>
            {/* Registration status */}
            <span className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${statusPill.style}`}>
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusPill.dot}`} />
              {statusPill.label}
            </span>
            {/* Event status badge */}
            {reg.event_status === 'Cancelled' && (
              <span className="text-[11px] font-semibold bg-red-50 text-red-500 border border-red-200 px-2.5 py-0.5 rounded-full">
                Cancelled
              </span>
            )}
            {/* Payment method tag — only for paid */}
            {reg.event_is_paid && (
              <span className="text-[11px] font-medium text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
                {reg.payment_selection === 'Online' ? '💳 Online' : reg.payment_selection === 'On-site' ? '💵 On-site' : ''}
              </span>
            )}
          </div>

          {/* Title */}
          <Link
            href={`/events/${reg.event_id}`}
            className="text-[15px] font-semibold text-gray-900 hover:text-green-700 transition-colors no-underline leading-snug line-clamp-1"
          >
            {reg.event_title}
          </Link>

          {/* Meta row */}
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span className="flex items-center gap-1.5 text-[12px] text-gray-500">
              <IconClock />
              {formatDate(reg.event_start_date)} · {formatTime(reg.event_start_date)} – {formatTime(reg.event_end_date)}
            </span>
            <span className="flex items-center gap-1.5 text-[12px] text-gray-500">
              <IconPin />
              {reg.venue_name}
            </span>
            <span className="flex items-center gap-1.5 text-[12px] text-gray-500">
              <IconOrg />
              {reg.org_name}
            </span>
          </div>

          {/* Proof rejection note */}
          {reg.proof_status === 'Rejected' && (
            <div className="flex items-center gap-2 text-[12px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mt-1">
              <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              Your proof of payment was rejected. Please upload a valid screenshot.
            </div>
          )}

          {/* Registered on */}
          <p className="text-[11px] text-gray-400 mt-auto pt-1">
            Registered on {formatDate(reg.reg_date)}
          </p>
        </div>

        {/* ── Actions ── */}
        <div className="flex sm:flex-col items-center justify-end gap-2 px-4 pb-4 sm:py-4 border-t sm:border-t-0 sm:border-l border-gray-100 flex-shrink-0 min-w-[120px]">
          <Link
            href={`/events/${reg.event_id}`}
            className="w-full text-center text-[12px] font-semibold text-green-700 border border-green-200 hover:bg-green-50 hover:border-green-400 px-3 py-2 rounded-lg transition-all no-underline whitespace-nowrap"
          >
            View event
          </Link>
          {showUpload && (
            <Link
              href={`/events/${reg.event_id}/payment-upload?registration=${reg.id}`}
              className="w-full text-center text-[12px] font-semibold text-white bg-amber-500 hover:bg-amber-600 px-3 py-2 rounded-lg transition-colors no-underline whitespace-nowrap flex items-center justify-center gap-1"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none">
                <path d="M10 13V5m0 0L7 8m3-3l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4 15h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {reg.proof_status === 'Rejected' ? 'Reupload' : 'Upload proof'}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------
   Summary stat card
   ---------------------------------------------------------------- */
function StatCard({ value, label, color = 'text-gray-900', bg = 'bg-white border-gray-200' }: {
  value: number; label: string; color?: string; bg?: string;
}) {
  return (
    <div className={`rounded-xl border ${bg} px-4 py-3.5 flex flex-col gap-0.5`}>
      <span className={`text-[24px] font-bold leading-none ${color}`}>{value}</span>
      <span className="text-[12px] text-gray-500">{label}</span>
    </div>
  );
}

/* ----------------------------------------------------------------
   Empty state
   ---------------------------------------------------------------- */
function EmptyState({ tab }: { tab: 'upcoming' | 'past' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
        <svg className="w-8 h-8 text-gray-300" viewBox="0 0 24 24" fill="none">
          <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-[15px] font-semibold text-gray-700">
          {tab === 'upcoming' ? 'No upcoming events' : 'No past events'}
        </p>
        <p className="text-[13px] text-gray-400 max-w-xs leading-relaxed">
          {tab === 'upcoming'
            ? "You haven't registered for any upcoming events yet. Browse and register to get started."
            : "Events you've attended will appear here after they are completed."}
        </p>
      </div>
      {tab === 'upcoming' && (
        <Link
          href="/events"
          className="text-[13px] font-semibold bg-green-700 hover:bg-green-800 text-white px-5 py-2.5 rounded-lg transition-colors no-underline"
        >
          Browse events
        </Link>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------
   Page
   ---------------------------------------------------------------- */
export default function MyEventsPage() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  const upcomingRegs = useMemo(
    () => MOCK_REGISTRATIONS.filter(isUpcoming).sort((a, b) => new Date(a.event_start_date).getTime() - new Date(b.event_start_date).getTime()),
    [],
  );

  const pastRegs = useMemo(
    () => MOCK_REGISTRATIONS.filter((r) => !isUpcoming(r)).sort((a, b) => new Date(b.event_start_date).getTime() - new Date(a.event_start_date).getTime()),
    [],
  );

  const displayed = activeTab === 'upcoming' ? upcomingRegs : pastRegs;

  /* Summary stats derived from Registrations + Payment_Proofs */
  const totalConfirmed   = MOCK_REGISTRATIONS.filter((r) => !r.event_is_paid || r.payment_status === 'Paid').length;
  const totalPending     = MOCK_REGISTRATIONS.filter((r) => r.event_is_paid && r.payment_status === 'Pending').length;
  const totalNeedAction  = MOCK_REGISTRATIONS.filter(needsUpload).length;
  const totalCheckedIn   = MOCK_REGISTRATIONS.filter((r) => r.attendance_status === 'Checked_In').length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar
        role="student"
        user={{ name: 'Juan dela Cruz', schoolId: '2021-00142', department: 'BSCS 3A' }}
      />

      <main className="flex-1 w-full max-w-[1280px] mx-auto px-6 lg:px-12 py-8 flex flex-col gap-6">

        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-bold text-gray-900 tracking-tight">My Events</h1>
            <p className="text-[14px] text-gray-500 mt-1">
              Track your registrations, payment status, and attendance.
            </p>
          </div>
          <Link
            href="/events"
            className="flex items-center gap-2 text-[13px] font-semibold text-green-700 border border-green-200 hover:bg-green-50 hover:border-green-400 px-4 py-2 rounded-lg transition-all no-underline self-start sm:self-auto flex-shrink-0"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
              <path d="M10 5v10M5 10h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Browse more events
          </Link>
        </div>

        {/* ── Summary stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard value={MOCK_REGISTRATIONS.length} label="Total registered"  />
          <StatCard value={totalConfirmed}   label="Confirmed"        color="text-green-700" bg="bg-green-50 border-green-200"  />
          <StatCard value={totalPending}     label="Pending payment"  color="text-amber-700" bg="bg-amber-50 border-amber-200"  />
          <StatCard value={totalCheckedIn}   label="Attended"         color="text-blue-700"  bg="bg-blue-50 border-blue-200"   />
        </div>

        {/* ── Action required alert — proof upload ── */}
        {totalNeedAction > 0 && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5">
            <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="none">
              <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 4v5m0 3v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <div>
              <p className="text-[13px] font-semibold text-amber-800">
                {totalNeedAction} registration{totalNeedAction > 1 ? 's require' : ' requires'} proof of payment
              </p>
              <p className="text-[12px] text-amber-700 mt-0.5">
                Upload your GCash or bank transfer screenshot to confirm your slot before the event date.
              </p>
            </div>
          </div>
        )}

        {/* ── Upcoming / Past toggle ── */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit">
          {([
            { key: 'upcoming', label: 'Upcoming', count: upcomingRegs.length },
            { key: 'past',     label: 'Past',     count: pastRegs.length     },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 cursor-pointer
                ${activeTab === tab.key
                  ? 'bg-green-700 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                }`}
            >
              {tab.label}
              <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full
                ${activeTab === tab.key ? 'bg-white bg-opacity-20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* ── Registration list ── */}
        {displayed.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : (
          <div className="flex flex-col gap-3">
            {displayed.map((reg) => (
              <RegistrationCard key={reg.id} reg={reg} isUpcomingTab={activeTab === 'upcoming'} />
            ))}
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200 bg-white mt-8">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[12px] text-gray-400">
            © {new Date().getFullYear()} Cavite State University · Office of Student Affairs
          </p>
          <div className="flex items-center gap-4">
            <Link href="#" className="text-[12px] text-gray-400 hover:text-gray-600 no-underline transition-colors">Privacy Policy</Link>
            <Link href="#" className="text-[12px] text-gray-400 hover:text-gray-600 no-underline transition-colors">Contact Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ----------------------------------------------------------------
   Icons
   ---------------------------------------------------------------- */
function IconClock() {
  return (
    <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M8 4.5v4l2.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}
function IconPin() {
  return (
    <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 16 16" fill="none">
      <path d="M8 1C5.24 1 3 3.24 3 6c0 3.75 5 9 5 9s5-5.25 5-9c0-2.76-2.24-5-5-5zm0 6.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}
function IconOrg() {
  return (
    <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 16 16" fill="none">
      <path d="M8 8a3 3 0 100-6 3 3 0 000 6zm-5 6a5 5 0 0110 0H3z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}