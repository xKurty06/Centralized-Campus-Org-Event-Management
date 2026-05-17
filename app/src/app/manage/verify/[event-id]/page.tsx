'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';

/* ----------------------------------------------------------------
   Types — aligned to DB schema

   Registrations:
     id, event_id, user_id, payment_status (Pending|Paid),
     attendance_status (Not_Arrived|Checked_In), check_in_at

   Users (joined):
     school_id, first_name, last_name, dept_id → College(code), year_level

   Attendance_Queue (offline sync):
     id, reg_id, officer_id, action_type (Verify_Payment|Check_In),
     device_timestamp, sync_status (Pending|Synced)
   ---------------------------------------------------------------- */

type PaymentStatus    = 'Pending' | 'Paid';
type AttendanceStatus = 'Not_Arrived' | 'Checked_In';
type SyncStatus       = 'Pending' | 'Synced';
type ActionType       = 'Verify_Payment' | 'Check_In';

interface Participant {
  reg_id: string;
  school_id: string;
  first_name: string;
  last_name: string;
  college_code: string;
  year_level: number;
  payment_status: PaymentStatus;
  attendance_status: AttendanceStatus;
  check_in_at: string | null;
}

interface QueuedAction {
  id: string;
  reg_id: string;
  action_type: ActionType;
  device_timestamp: string;
  sync_status: SyncStatus;
}

interface EventMeta {
  id: string;
  title: string;
  start_date: string;
  venue_name: string;
  is_paid: boolean;
  capacity: number;
}

/* ----------------------------------------------------------------
   Mock data — loaded into browser cache on mount
   Replace with: GET /api/manage/verify/[event-id] (full participant list JSON)
   ---------------------------------------------------------------- */
const MOCK_EVENT: EventMeta = {
  id: 'evt_010',
  title: 'Data Science Bootcamp',
  start_date: '2025-04-14T08:00:00',
  venue_name: 'ICT Building Lab 2',
  is_paid: true,
  capacity: 40,
};

const MOCK_PARTICIPANTS: Participant[] = [
  { reg_id: 'reg_a01', school_id: '2021-00142', first_name: 'Juan',      last_name: 'dela Cruz',   college_code: 'CEIT', year_level: 3, payment_status: 'Paid',    attendance_status: 'Not_Arrived', check_in_at: null },
  { reg_id: 'reg_a02', school_id: '2022-00201', first_name: 'Ana Luisa', last_name: 'Reyes',       college_code: 'CEIT', year_level: 2, payment_status: 'Paid',    attendance_status: 'Not_Arrived', check_in_at: null },
  { reg_id: 'reg_a03', school_id: '2021-00189', first_name: 'Marco',     last_name: 'Bautista',    college_code: 'CAS',  year_level: 3, payment_status: 'Pending', attendance_status: 'Not_Arrived', check_in_at: null },
  { reg_id: 'reg_a04', school_id: '2023-00301', first_name: 'Diana',     last_name: 'Mendoza',     college_code: 'CEIT', year_level: 1, payment_status: 'Paid',    attendance_status: 'Checked_In',  check_in_at: '2025-04-14T08:15:00' },
  { reg_id: 'reg_a05', school_id: '2020-00050', first_name: 'Ramon',     last_name: 'Villanueva',  college_code: 'CBAA', year_level: 4, payment_status: 'Pending', attendance_status: 'Not_Arrived', check_in_at: null },
  { reg_id: 'reg_a06', school_id: '2022-00310', first_name: 'Patricia',  last_name: 'Flores',      college_code: 'CEIT', year_level: 2, payment_status: 'Paid',    attendance_status: 'Not_Arrived', check_in_at: null },
  { reg_id: 'reg_a07', school_id: '2021-00234', first_name: 'Carlos',    last_name: 'Torres',      college_code: 'CAS',  year_level: 3, payment_status: 'Paid',    attendance_status: 'Checked_In',  check_in_at: '2025-04-14T08:22:00' },
  { reg_id: 'reg_a08', school_id: '2023-00412', first_name: 'Isabella',  last_name: 'Garcia',      college_code: 'CEIT', year_level: 1, payment_status: 'Pending', attendance_status: 'Not_Arrived', check_in_at: null },
  { reg_id: 'reg_a09', school_id: '2020-00098', first_name: 'Rafael',    last_name: 'Santos',      college_code: 'CBAA', year_level: 4, payment_status: 'Paid',    attendance_status: 'Not_Arrived', check_in_at: null },
  { reg_id: 'reg_a10', school_id: '2022-00155', first_name: 'Grace',     last_name: 'Lim',         college_code: 'CEIT', year_level: 2, payment_status: 'Paid',    attendance_status: 'Not_Arrived', check_in_at: null },
];

/* ----------------------------------------------------------------
   Helpers
   ---------------------------------------------------------------- */
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

function newQueueId() {
  return `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/* ----------------------------------------------------------------
   Result card component
   ---------------------------------------------------------------- */
interface ResultCardProps {
  participant: Participant;
  onConfirmPayment: (regId: string) => void;
  onCheckIn: (regId: string) => void;
  isPaid: boolean;
}

function ResultCard({ participant: p, onConfirmPayment, onCheckIn, isPaid }: ResultCardProps) {
  const isCheckedIn   = p.attendance_status === 'Checked_In';
  const isPaymentPaid = p.payment_status === 'Paid';
  const canCheckIn    = isPaymentPaid && !isCheckedIn;
  const isGreen       = isPaymentPaid;

  return (
    <div className={`rounded-2xl border-2 overflow-hidden transition-all ${
      isCheckedIn ? 'border-green-300 bg-green-50' :
      isGreen     ? 'border-green-400 bg-white'    :
                    'border-red-400 bg-red-50'
    }`}>

      {/* Status banner */}
      <div className={`px-5 py-3 flex items-center justify-between ${
        isCheckedIn ? 'bg-green-600' :
        isGreen     ? 'bg-green-700' :
                      'bg-red-600'
      }`}>
        <div className="flex items-center gap-2.5">
          {isCheckedIn ? (
            <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
          ) : isGreen ? (
            <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="none">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="none">
              <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 4v5m0 3v.5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          )}
          <span className="text-white text-[14px] font-bold">
            {isCheckedIn ? 'Checked in' : isGreen ? 'Confirmed — Paid' : 'Pending payment'}
          </span>
        </div>
        {isCheckedIn && p.check_in_at && (
          <span className="text-white text-[12px] font-medium opacity-80">
            {formatTime(p.check_in_at)}
          </span>
        )}
      </div>

      {/* Participant info */}
      <div className="px-5 py-4 flex flex-col gap-4">

        {/* Name + ID */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[22px] font-bold text-gray-900 leading-tight">
              {p.first_name} {p.last_name}
            </p>
            <p className="text-[14px] font-mono text-gray-500 mt-1">{p.school_id}</p>
            <p className="text-[13px] text-gray-400 mt-0.5">{p.college_code} · Year {p.year_level}</p>
          </div>
          {/* Big status icon */}
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${
            isCheckedIn ? 'bg-green-100' : isGreen ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {isCheckedIn ? (
              <svg className="w-9 h-9 text-green-600" viewBox="0 0 24 24" fill="none">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : isGreen ? (
              <svg className="w-9 h-9 text-green-600" viewBox="0 0 24 24" fill="none">
                <path d="M9 12l2 2 4-4M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg className="w-9 h-9 text-red-500" viewBox="0 0 24 24" fill="none">
                <path d="M12 9v4m0 4h.01M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2">

          {/* Confirm payment (only for pending paid events) */}
          {isPaid && !isPaymentPaid && (
            <button
              onClick={() => onConfirmPayment(p.reg_id)}
              className="w-full flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white text-[14px] font-semibold py-3 rounded-xl transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
                <path d="M4 4h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M2 9h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Confirm cash payment
            </button>
          )}

          {/* Check in button */}
          {canCheckIn && (
            <button
              onClick={() => onCheckIn(p.reg_id)}
              className="w-full flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white text-[14px] font-semibold py-3 rounded-xl transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Check in student
            </button>
          )}

          {/* Already checked in */}
          {isCheckedIn && (
            <div className="w-full flex items-center justify-center gap-2 bg-green-100 text-green-700 text-[14px] font-semibold py-3 rounded-xl">
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              Already checked in
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------
   Page
   ---------------------------------------------------------------- */
export default function VerifyPage() {
  const params  = useParams();
  const eventId = params['event-id'] as string;

  /* Participant list loaded into browser memory (offline-first cache) */
  const [participants, setParticipants] = useState<Participant[]>(MOCK_PARTICIPANTS);
  const [queue,        setQueue]        = useState<QueuedAction[]>([]);
  const [isOnline,     setIsOnline]     = useState(true);
  const [isSyncing,    setIsSyncing]    = useState(false);
  const [lastSync,     setLastSync]     = useState<string | null>(null);

  const [search,       setSearch]       = useState('');
  const [result,       setResult]       = useState<Participant | null>(null);
  const [notFound,     setNotFound]     = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const event = MOCK_EVENT;

  /* Simulate online/offline */
  useEffect(() => {
    const onOnline  = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);

  /* Auto-sync when back online */
  useEffect(() => {
    if (isOnline && queue.filter((q) => q.sync_status === 'Pending').length > 0) {
      handleSync();
    }
  }, [isOnline]);

  /* Live counters derived from in-memory participant list */
  const totalRegistered = participants.length;
  const totalPaid       = participants.filter((p) => p.payment_status === 'Paid').length;
  const totalCheckedIn  = participants.filter((p) => p.attendance_status === 'Checked_In').length;
  const totalPending    = participants.filter((p) => p.payment_status === 'Pending').length;
  const pendingQueue    = queue.filter((q) => q.sync_status === 'Pending').length;

  /* Search — matches school_id or name */
  const handleSearch = useCallback(() => {
    const q = search.trim().toLowerCase();
    if (!q) return;
    const found = participants.find(
      (p) =>
        p.school_id.toLowerCase() === q ||
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) ||
        p.last_name.toLowerCase().includes(q)
    );
    if (found) { setResult(found); setNotFound(false); }
    else       { setResult(null);  setNotFound(true);  }
  }, [search, participants]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSearch();
  }

  function clearSearch() {
    setSearch('');
    setResult(null);
    setNotFound(false);
    searchRef.current?.focus();
  }

  /* ── Confirm payment (cash on door) ──
     Updates local state immediately + queues Attendance_Queue action
     → Syncs to Registrations.payment_status = Paid when online
  */
  function handleConfirmPayment(regId: string) {
    const now = new Date().toISOString();

    /* Update in-memory participant list */
    setParticipants((prev) =>
      prev.map((p) => p.reg_id === regId ? { ...p, payment_status: 'Paid' } : p)
    );
    /* Update result card if visible */
    setResult((prev) => prev?.reg_id === regId ? { ...prev, payment_status: 'Paid' } : prev);

    /* Queue action for sync */
    setQueue((prev) => [...prev, {
      id: newQueueId(), reg_id: regId,
      action_type: 'Verify_Payment',
      device_timestamp: now,
      sync_status: isOnline ? 'Synced' : 'Pending',
    }]);

    if (isOnline) setLastSync(now);
  }

  /* ── Check in student ──
     Updates attendance_status → Checked_In + check_in_at
     Queues Check_In action
  */
  function handleCheckIn(regId: string) {
    const now = new Date().toISOString();

    setParticipants((prev) =>
      prev.map((p) => p.reg_id === regId
        ? { ...p, attendance_status: 'Checked_In', check_in_at: now }
        : p
      )
    );
    setResult((prev) =>
      prev?.reg_id === regId
        ? { ...prev, attendance_status: 'Checked_In', check_in_at: now }
        : prev
    );

    setQueue((prev) => [...prev, {
      id: newQueueId(), reg_id: regId,
      action_type: 'Check_In',
      device_timestamp: now,
      sync_status: isOnline ? 'Synced' : 'Pending',
    }]);

    if (isOnline) setLastSync(now);
  }

  /* ── Manual sync ──
     Pushes all Pending queue items to server
     TODO: POST /api/manage/verify/[event-id]/sync with queue payload
  */
  async function handleSync() {
    if (!isOnline || isSyncing) return;
    setIsSyncing(true);
    await new Promise((r) => setTimeout(r, 1200));
    setQueue((prev) => prev.map((q) => ({ ...q, sync_status: 'Synced' as SyncStatus })));
    setLastSync(new Date().toISOString());
    setIsSyncing(false);
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Navbar role="officer" user={{ name: 'Maria Clara Santos', schoolId: '2021-00101', department: 'BSCS 4A' }} />

      <main className="flex-1 w-full max-w-[680px] mx-auto px-4 py-6 flex flex-col gap-5">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[12px] text-gray-500 mb-1">
              <Link href="/manage/dashboard" className="hover:text-gray-300 no-underline transition-colors">Dashboard</Link>
              <svg className="w-3 h-3" viewBox="0 0 20 20" fill="none"><path d="M7 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span className="text-gray-400">Entrance Panel</span>
            </div>
            <h1 className="text-[20px] font-bold text-white leading-tight">{event.title}</h1>
            <p className="text-[13px] text-gray-400 mt-0.5">{formatDate(event.start_date)} · {event.venue_name}</p>
          </div>

          {/* Online indicator */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold flex-shrink-0 ${
            isOnline ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
            {isOnline ? 'Online' : 'Offline'}
          </div>
        </div>

        {/* ── Offline warning ── */}
        {!isOnline && (
          <div className="flex items-start gap-3 bg-amber-900 bg-opacity-50 border border-amber-700 rounded-xl px-4 py-3">
            <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="none">
              <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 4v5m0 3v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <div>
              <p className="text-[13px] font-semibold text-amber-300">Working offline</p>
              <p className="text-[12px] text-amber-400 mt-0.5">
                All actions are saved locally and will sync automatically when the connection is restored.
                {pendingQueue > 0 && ` ${pendingQueue} action${pendingQueue > 1 ? 's' : ''} queued.`}
              </p>
            </div>
          </div>
        )}

        {/* ── Sync bar ── */}
        {pendingQueue > 0 && isOnline && (
          <div className="flex items-center justify-between bg-blue-900 bg-opacity-50 border border-blue-700 rounded-xl px-4 py-3">
            <p className="text-[13px] font-semibold text-blue-300">
              {pendingQueue} action{pendingQueue > 1 ? 's' : ''} ready to sync
            </p>
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 text-[12px] font-semibold bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              {isSyncing
                ? <><svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>Syncing...</>
                : <><svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none"><path d="M4 10a6 6 0 1112 0M4 10l3-3M4 10l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>Sync now</>
              }
            </button>
          </div>
        )}

        {/* ── Live counters ── */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Registered', value: totalRegistered, color: 'text-white',       bg: 'bg-gray-800'             },
            { label: 'Paid',       value: totalPaid,       color: 'text-green-400',   bg: 'bg-green-900 bg-opacity-40' },
            { label: 'Checked in', value: totalCheckedIn,  color: 'text-blue-400',    bg: 'bg-blue-900 bg-opacity-40'  },
            { label: 'Pending',    value: totalPending,    color: 'text-amber-400',   bg: 'bg-amber-900 bg-opacity-40' },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-xl p-3 flex flex-col gap-0.5 border border-gray-700`}>
              <span className={`text-[22px] font-bold leading-none ${s.color}`}>{s.value}</span>
              <span className="text-[11px] text-gray-500">{s.label}</span>
            </div>
          ))}
        </div>

        {/* ── Search panel ── */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-700">
            <p className="text-[14px] font-semibold text-white">Search participant</p>
            <p className="text-[12px] text-gray-400 mt-0.5">Enter School ID or name to find a registrant</p>
          </div>
          <div className="px-5 py-5 flex flex-col gap-4">

            {/* Search input */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" viewBox="0 0 20 20" fill="none">
                  <path d="M9 17A8 8 0 109 1a8 8 0 000 16zM19 19l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="School ID or last name..."
                  autoComplete="off"
                  className="w-full pl-10 pr-4 py-3 text-[15px] font-medium text-white bg-gray-700 border border-gray-600 rounded-xl outline-none focus:border-green-500 focus:shadow-[0_0_0_3px_rgba(34,197,94,0.15)] transition-all placeholder:text-gray-500"
                />
              </div>
              <button
                onClick={handleSearch}
                className="flex items-center gap-2 bg-green-700 hover:bg-green-600 text-white text-[14px] font-semibold px-5 py-3 rounded-xl transition-colors cursor-pointer flex-shrink-0"
              >
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
                  <path d="M9 17A8 8 0 109 1a8 8 0 000 16zM19 19l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Search
              </button>
            </div>

            {/* Not found */}
            {notFound && (
              <div className="flex items-center gap-3 bg-red-900 bg-opacity-40 border border-red-700 rounded-xl px-4 py-3.5">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
                <div>
                  <p className="text-[13px] font-semibold text-red-300">Not found</p>
                  <p className="text-[12px] text-red-400 mt-0.5">"{search}" is not registered for this event.</p>
                </div>
              </div>
            )}

            {/* Result card */}
            {result && (
              <div className="flex flex-col gap-3">
                <ResultCard
                  participant={result}
                  onConfirmPayment={handleConfirmPayment}
                  onCheckIn={handleCheckIn}
                  isPaid={event.is_paid}
                />
                <button
                  onClick={clearSearch}
                  className="text-[13px] font-medium text-gray-400 hover:text-white transition-colors text-center cursor-pointer"
                >
                  ← Search another
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Recent check-ins ── */}
        {participants.filter((p) => p.attendance_status === 'Checked_In').length > 0 && (
          <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-700 flex items-center justify-between">
              <p className="text-[14px] font-semibold text-white">Recent check-ins</p>
              <span className="text-[12px] font-semibold bg-green-900 text-green-400 px-2.5 py-1 rounded-full">
                {totalCheckedIn} checked in
              </span>
            </div>
            <div className="divide-y divide-gray-700">
              {participants
                .filter((p) => p.attendance_status === 'Checked_In')
                .sort((a, b) => new Date(b.check_in_at!).getTime() - new Date(a.check_in_at!).getTime())
                .map((p) => (
                  <div key={p.reg_id} className="px-5 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-900 flex items-center justify-center flex-shrink-0">
                        <span className="text-[11px] font-bold text-green-400">
                          {p.first_name[0]}{p.last_name[0]}
                        </span>
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-white">{p.first_name} {p.last_name}</p>
                        <p className="text-[11px] text-gray-500">{p.school_id} · {p.college_code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <svg className="w-4 h-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      <span className="text-[12px] text-gray-500">{p.check_in_at ? formatTime(p.check_in_at) : '—'}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ── Last sync timestamp ── */}
        {lastSync && (
          <p className="text-[11px] text-gray-600 text-center">
            Last synced: {new Date(lastSync).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}
          </p>
        )}
      </main>
    </div>
  );
}