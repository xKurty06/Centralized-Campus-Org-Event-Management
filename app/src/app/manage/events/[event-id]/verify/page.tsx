'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import ManageShell from '@/components/ManageShell';
import { useParams } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v1';

/* ────────────────────────────────────────────────────────────────
   TYPES
──────────────────────────────────────────────────────────────── */
type PaymentStatus = 'Paid' | 'Pending';
type AttendanceStatus = 'Not_Arrived' | 'Checked_In';
type ActionType = 'Verify_Payment' | 'Check_In';
type SyncStatus = 'Pending' | 'Synced';

interface Student {
  id: string;
  schoolId: string;
  firstName: string;
  lastName: string;
  department: string;
  yearLevel: number;
  avatarUrl?: string;
  is_member: boolean;
}

interface Registration {
  id: string;
  student: Student;
  paymentStatus: PaymentStatus;
  paymentSelection: 'Online' | 'On-site' | 'N/A';
  attendanceStatus: AttendanceStatus;
  checkInAt: string | null;
  regDate: string;
}

interface QueuedAction {
  id: string;
  regId: string;
  actionType: ActionType;
  deviceTimestamp: string;
  syncStatus: SyncStatus;
  studentName: string;
}

interface RecentActivity {
  id: string;
  studentName: string;
  schoolId: string;
  action: 'Check_In' | 'Verify_Payment';
  timestamp: string;
}

interface EventInfo {
  id: string;
  title: string;
  venue: string;
  startDate: string;
  isPaid: boolean;
  capacity: number;
  checkedIn: number;
  totalRegistered: number;
  confirmedPaid: number;
}

/* ────────────────────────────────────────────────────────────────
   PLACEHOLDER DATA
──────────────────────────────────────────────────────────────── */
const EMPTY_EVENT: EventInfo = {
  id: '',
  title: 'Event',
  venue: 'TBA',
  startDate: new Date().toISOString(),
  isPaid: false,
  capacity: 0,
  checkedIn: 0,
  totalRegistered: 0,
  confirmedPaid: 0,
};

/* ────────────────────────────────────────────────────────────────
   HELPERS
──────────────────────────────────────────────────────────────── */
function getInitials(first: string, last: string) {
  return `${first[0]}${last[0]}`.toUpperCase();
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ────────────────────────────────────────────────────────────────
   SUB-COMPONENTS
──────────────────────────────────────────────────────────────── */

/* — Connection Status Badge — */
function ConnectionBadge({ isOnline }: { isOnline: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all duration-300
      ${isOnline
        ? 'bg-green-50 text-green-700 border-green-200'
        : 'bg-amber-50 text-amber-700 border-amber-200'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
      {isOnline ? 'Online' : 'Offline Mode'}
    </div>
  );
}

/* — Stat Pill — */
function StatPill({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-3 rounded-xl border border-[var(--color-border)] bg-white">
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
      <span className="text-[11px] text-[var(--color-text-muted)] font-medium mt-0.5 whitespace-nowrap">{label}</span>
    </div>
  );
}

/* — Result Card: Idle — */
function IdleCard() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-10 rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-bg)] min-h-[260px]">
      <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-2)] flex items-center justify-center">
        <svg className="w-8 h-8 text-[var(--color-text-muted)]" viewBox="0 0 24 24" fill="none">
          <path d="M3 9h6V3H3v6zM3 21h6v-6H3v6zM15 3v6h6V3h-6zM9 9h6v6H9V9zM15 15h6v6h-6v-6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-[15px] font-semibold text-[var(--color-text-secondary)]">Waiting for scan</p>
        <p className="text-[13px] text-[var(--color-text-muted)] mt-1">Enter or scan a Student ID to begin</p>
      </div>
    </div>
  );
}

/* — Result Card: Not Found — */
function NotFoundCard({ schoolId }: { schoolId: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-10 rounded-2xl border-2 border-dashed border-red-200 bg-red-50 min-h-[260px]">
      <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
        <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="none">
          <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-[15px] font-bold text-red-700">Not Registered</p>
        <p className="text-[13px] text-red-500 mt-1">
          <span className="font-mono font-semibold">{schoolId}</span> has no registration for this event.
        </p>
      </div>
    </div>
  );
}

/* — Result Card: Green (Confirmed) — */
function GreenCard({
  reg,
  onCheckIn,
  loading,
}: {
  reg: Registration;
  onCheckIn: () => void;
  loading: boolean;
}) {
  const alreadyIn = reg.attendanceStatus === 'Checked_In';
  const { student } = reg;

  return (
    <div className="rounded-2xl border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 overflow-hidden animate-fade-in">
      {/* Header stripe */}
      <div className="px-6 py-4 bg-green-600 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-white font-bold text-[15px]">Payment Confirmed</span>
        </div>
        {alreadyIn && (
          <span className="text-[11px] font-bold bg-white text-green-700 px-3 py-1 rounded-full">
            Already Checked In · {reg.checkInAt ? formatTime(reg.checkInAt) : '—'}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="px-6 py-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-green-200 border-2 border-green-300 flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-bold text-green-700">
              {getInitials(student.firstName, student.lastName)}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[18px] font-bold text-gray-900 leading-tight">
              {student.firstName} {student.lastName}
            </p>

            <div className="mt-1">
              {student.is_member ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Member
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  Non-Member
                </span>
              )}
            </div>

            <p className="text-[13px] text-gray-500 mt-1">
              <span className="font-mono font-semibold text-gray-700">{student.schoolId}</span>
              {' · '}Year {student.yearLevel}
            </p>
            <p className="text-[12px] text-gray-500 mt-0.5 truncate">{student.department}</p>
          </div>
        </div>

        {/* Meta row */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="badge badge-green">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" fill="currentColor" />
            </svg>
            {reg.paymentSelection === 'N/A' ? 'Free Event' : reg.paymentSelection + ' Payment'}
          </span>
          <span className="badge badge-gray">Reg: {formatDate(reg.regDate)}</span>
        </div>

        {/* Action */}
        <div className="mt-5">
          {alreadyIn ? (
            <div className="flex items-center gap-2 text-[13px] font-semibold text-green-700 bg-green-100 rounded-xl px-4 py-3">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Student has already been checked in
            </div>
          ) : (
            <button
              onClick={onCheckIn}
              disabled={loading}
              className="btn btn-lg btn-full"
              style={{ backgroundColor: 'var(--color-primary)', color: '#fff', boxShadow: 'var(--shadow-green)' }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Checking in…
                </span>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Check In Student
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* — Result Card: Red (Pending Payment) — */
function RedCard({
  reg,
  onConfirmPayment,
  loading,
}: {
  reg: Registration;
  onConfirmPayment: () => void;
  loading: boolean;
}) {
  const { student } = reg;

  return (
    <div className="rounded-2xl border-2 border-red-300 bg-gradient-to-br from-red-50 to-rose-50 overflow-hidden animate-fade-in">
      {/* Header stripe */}
      <div className="px-6 py-4 bg-red-600 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none">
            <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-white font-bold text-[15px]">Payment Pending</span>
        </div>
        <span className="text-[11px] font-bold bg-white text-red-600 px-3 py-1 rounded-full">
          {reg.paymentSelection === 'On-site' ? 'Paying at Door' : 'Awaiting Confirmation'}
        </span>
      </div>

      {/* Body */}
      <div className="px-6 py-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-red-200 border-2 border-red-300 flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-bold text-red-700">
              {getInitials(student.firstName, student.lastName)}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[18px] font-bold text-gray-900 leading-tight">
              {student.firstName} {student.lastName}
            </p>

            <div className="mt-1">
              {student.is_member ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Member
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  Non-Member
                </span>
              )}
            </div>

            <p className="text-[13px] text-gray-500 mt-1">
              <span className="font-mono font-semibold text-gray-700">{student.schoolId}</span>
              {' · '}Year {student.yearLevel}
            </p>
            <p className="text-[12px] text-gray-500 mt-0.5 truncate">{student.department}</p>
          </div>
        </div>

        {/* Meta row */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="badge badge-red">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none">
              <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {reg.paymentSelection} Payment
          </span>
          <span className="badge badge-gray">Reg: {formatDate(reg.regDate)}</span>
        </div>

        {/* Warning note */}
        <div className="mt-4 flex items-start gap-2 text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Collect cash payment before allowing entry. Use the button below to confirm receipt.
        </div>

        {/* Action */}
        <div className="mt-5">
          <button
            onClick={onConfirmPayment}
            disabled={loading}
            className="btn btn-lg btn-full"
            style={{ backgroundColor: 'var(--color-error)', color: '#fff' }}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Confirming…
              </span>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Confirm Cash Payment & Check In
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* — Offline Queue Panel — */
function OfflineQueuePanel({
  queue,
  onSync,
  isSyncing,
}: {
  queue: QueuedAction[];
  onSync: () => void;
  isSyncing: boolean;
}) {
  const pendingCount = queue.filter((q) => q.syncStatus === 'Pending').length;
  if (pendingCount === 0) return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-amber-100 border-b border-amber-200">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-700" viewBox="0 0 24 24" fill="none">
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[13px] font-semibold text-amber-800">
            {pendingCount} action{pendingCount > 1 ? 's' : ''} queued offline
          </span>
        </div>
        <button
          onClick={onSync}
          disabled={isSyncing}
          className="text-[12px] font-semibold text-amber-700 hover:text-amber-900 bg-white border border-amber-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {isSyncing ? 'Syncing…' : 'Sync Now'}
        </button>
      </div>

      {/* Items */}
      <div className="divide-y divide-amber-100">
        {queue.map((item) => (
          <div key={item.id} className="flex items-center justify-between px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.syncStatus === 'Pending' ? 'bg-amber-500' : 'bg-green-500'}`} />
              <span className="text-[12px] font-medium text-gray-700">{item.studentName}</span>
              <span className="text-[11px] text-gray-400">·</span>
              <span className="text-[11px] text-gray-500">
                {item.actionType === 'Check_In' ? 'Check-in' : 'Payment confirmation'}
              </span>
            </div>
            <span className="text-[10px] text-gray-400 font-mono">{formatTime(item.deviceTimestamp)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* — Recent Activity Feed — */
function RecentActivityFeed({ activities }: { activities: RecentActivity[] }) {
  return (
    <div className="card">
      <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-[var(--color-border)]">
        <h3 className="text-[14px] font-semibold text-[var(--color-text)]">Recent Activity</h3>
        <span className="text-[11px] text-[var(--color-text-muted)]">Today</span>
      </div>
      <div className="divide-y divide-[var(--color-border)]">
        {activities.map((a) => (
          <div key={a.id} className="flex items-center gap-3 px-5 py-3">
            {/* Icon */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[11px] font-bold
              ${a.action === 'Check_In' ? 'bg-green-500' : 'bg-blue-500'}`}
            >
              {a.action === 'Check_In' ? '✓' : '₱'}
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[var(--color-text)] truncate">{a.studentName}</p>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                {a.action === 'Check_In' ? 'Checked in' : 'Payment confirmed'} · <span className="font-mono">{a.schoolId}</span>
              </p>
            </div>
            {/* Time */}
            <span className="text-[11px] font-mono text-[var(--color-text-muted)] flex-shrink-0">{a.timestamp}</span>
          </div>
        ))}
      </div>
      {activities.length === 0 && (
        <div className="px-5 py-8 text-center text-[13px] text-[var(--color-text-muted)]">No activity yet</div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   MAIN PAGE
──────────────────────────────────────────────────────────────── */
export default function EntrancePanelPage() {
  const params = useParams();
  const eventId = Array.isArray(params['event-id']) ? params['event-id'][0] : params['event-id'];
  /* — State — */
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [registration, setRegistration] = useState<Registration | null | 'not_found'>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [queue, setQueue] = useState<QueuedAction[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [event, setEvent] = useState<EventInfo>(EMPTY_EVENT);
  const [currentTime, setCurrentTime] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  /* — Clock — */
  useEffect(() => {
    const tick = () => setCurrentTime(new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  /* — Online/Offline listener — */
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /* — Auto-focus input on mount — */
  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (!eventId) return;
    (async () => {
      const token = window.localStorage.getItem('auth_token') ?? window.sessionStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE_URL}/manage/events/${eventId}`, {
        headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      }).catch(() => null);
      const payload = await res?.json().catch(() => null) as any;
      if (!res || !res.ok || !payload?.success || !payload?.data) {
        setToast({ msg: payload?.error ?? 'Unable to load event.', type: 'error' });
        return;
      }
      const e = payload.data;
      setEvent({
        id: String(e.id ?? eventId),
        title: String(e.title ?? 'Event'),
        venue: String(e.venue_name ?? 'TBA'),
        startDate: String(e.start_date ?? new Date().toISOString()),
        isPaid: Boolean(e.is_paid),
        capacity: Number(e.capacity ?? 0),
        checkedIn: Number(e.total_checked_in ?? 0),
        totalRegistered: Number(e.total_registered ?? 0),
        confirmedPaid: Number(e.total_paid ?? 0),
      });
    })();
  }, [eventId]);

  /* — Toast auto-dismiss — */
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  /* — Search — */
  const handleSearch = useCallback(() => {
    const q = searchInput.trim();
    if (!q || !eventId) return;
    setSearchQuery(q);
    (async () => {
      const token = window.localStorage.getItem('auth_token') ?? window.sessionStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE_URL}/manage/verify/${eventId}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ query: q }),
      }).catch(() => null);
      const payload = await res?.json().catch(() => null) as any;
      if (!res || !res.ok || !payload?.success || !payload?.data) {
        setRegistration('not_found');
        return;
      }
      const r = payload.data;
      setRegistration({
        id: String(r.id ?? ''),
        student: {
          id: String(r.user_id ?? ''),
          schoolId: String(r.school_id ?? q),
          firstName: String(r.first_name ?? ''),
          lastName: String(r.last_name ?? ''),
          department: String(r.dept_code ?? 'N/A'),
          yearLevel: Number(r.year_level ?? 0),
          is_member: false,
        },
        paymentStatus: (r.payment_status ?? 'Pending') as PaymentStatus,
        paymentSelection: (r.payment_selection ?? 'N/A') as 'Online' | 'On-site' | 'N/A',
        attendanceStatus: (r.attendance_status ?? 'Not_Arrived') as AttendanceStatus,
        checkInAt: r.check_in_at ?? null,
        regDate: String(r.reg_date ?? new Date().toISOString()),
      });
    })();
  }, [searchInput, eventId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleClear = () => {
    setSearchInput('');
    setSearchQuery('');
    setRegistration(null);
    inputRef.current?.focus();
  };

  /* — Check In — */
  const handleCheckIn = useCallback(() => {
    if (!registration || registration === 'not_found') return;
    setActionLoading(true);
    (async () => {
      const token = window.localStorage.getItem('auth_token') ?? window.sessionStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE_URL}/manage/verify/${eventId}/checkin/${registration.id}`, {
        method: 'PUT',
        headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      }).catch(() => null);
      const payload = await res?.json().catch(() => null) as any;
      if (!res || !res.ok || !payload?.success) throw new Error(payload?.error ?? 'Check-in failed.');
      const newActivity: RecentActivity = {
        id: Date.now().toString(),
        studentName: `${registration.student.firstName} ${registration.student.lastName}`,
        schoolId: registration.student.schoolId,
        action: 'Check_In',
        timestamp: new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
      };

      setRegistration({
        ...registration,
        attendanceStatus: 'Checked_In',
        checkInAt: new Date().toISOString(),
      });
      setRecentActivity((prev) => [newActivity, ...prev.slice(0, 9)]);
      setToast({ msg: `${registration.student.firstName} ${registration.student.lastName} checked in successfully.`, type: 'success' });
      setActionLoading(false);
      setEvent((prev) => ({ ...prev, checkedIn: prev.checkedIn + 1 }));

      /* If offline, queue the action */
      if (!isOnline) {
        setQueue((prev) => [
          {
            id: Date.now().toString(),
            regId: registration.id,
            actionType: 'Check_In',
            deviceTimestamp: new Date().toISOString(),
            syncStatus: 'Pending',
            studentName: `${registration.student.firstName} ${registration.student.lastName}`,
          },
          ...prev,
        ]);
      }
    })().catch((e) => {
      setActionLoading(false);
      setToast({ msg: e?.message ?? 'Check-in failed.', type: 'error' });
    });
  }, [registration, isOnline, eventId]);

  /* — Confirm Payment & Check In — */
  const handleConfirmPayment = useCallback(() => {
    if (!registration || registration === 'not_found') return;
    setActionLoading(true);
    (async () => {
      const token = window.localStorage.getItem('auth_token') ?? window.sessionStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE_URL}/manage/verify/${eventId}/confirm-payment/${registration.id}`, {
        method: 'PUT',
        headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      }).catch(() => null);
      const payload = await res?.json().catch(() => null) as any;
      if (!res || !res.ok || !payload?.success) throw new Error(payload?.error ?? 'Confirm payment failed.');
      const newActivity: RecentActivity = {
        id: Date.now().toString(),
        studentName: `${registration.student.firstName} ${registration.student.lastName}`,
        schoolId: registration.student.schoolId,
        action: 'Verify_Payment',
        timestamp: new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
      };

      setRegistration({
        ...registration,
        paymentStatus: 'Paid',
        attendanceStatus: 'Checked_In',
        checkInAt: new Date().toISOString(),
      });
      setRecentActivity((prev) => [newActivity, ...prev.slice(0, 9)]);
      setToast({ msg: `Payment confirmed and ${registration.student.firstName} ${registration.student.lastName} checked in.`, type: 'success' });
      setActionLoading(false);
      setEvent((prev) => ({ ...prev, confirmedPaid: prev.confirmedPaid + 1, checkedIn: prev.checkedIn + 1 }));

      if (!isOnline) {
        setQueue((prev) => [
          {
            id: Date.now().toString(),
            regId: registration.id,
            actionType: 'Verify_Payment',
            deviceTimestamp: new Date().toISOString(),
            syncStatus: 'Pending',
            studentName: `${registration.student.firstName} ${registration.student.lastName}`,
          },
          ...prev,
        ]);
      }
    })().catch((e) => {
      setActionLoading(false);
      setToast({ msg: e?.message ?? 'Confirm payment failed.', type: 'error' });
    });
  }, [registration, isOnline, eventId]);

  /* — Sync queue — */
  const handleSync = () => {
    setIsSyncing(true);
    (async () => {
      const token = window.localStorage.getItem('auth_token') ?? window.sessionStorage.getItem('auth_token');
      const pending = queue.filter((q) => q.syncStatus === 'Pending');
      if (!pending.length) {
        setIsSyncing(false);
        return;
      }
      const items = pending.map((q) => ({ id: q.id, reg_id: q.regId, action_type: q.actionType, device_timestamp: q.deviceTimestamp }));
      const res = await fetch(`${API_BASE_URL}/manage/verify/${eventId}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ items }),
      }).catch(() => null);
      const payload = await res?.json().catch(() => null) as any;
      if (!res || !res.ok || !payload?.success) throw new Error(payload?.error ?? 'Sync failed.');
      setQueue((prev) => prev.map((q) => ({ ...q, syncStatus: 'Synced' as SyncStatus })));
      setToast({ msg: 'Offline actions synced successfully.', type: 'success' });
      setIsSyncing(false);
    })().catch((e) => {
      setIsSyncing(false);
      setToast({ msg: e?.message ?? 'Sync failed.', type: 'error' });
    });
  };

  /* — Derived — */
  const checkinPct = Math.round((event.checkedIn / event.totalRegistered) * 100) || 0;

  /* ── Render ── */
  return (
    <>
      <ManageShell>
        <div className="flex flex-col gap-6 animate-fade-in">

          {/* ── Page Header ── */}
          <div className="flex flex-col gap-3">
            {/* Responsive Breadcrumbs Navigation Trail */}
            <nav className="flex items-center gap-2 text-[13px] font-medium text-[var(--color-text-muted)] flex-wrap">
              <Link
                href="/manage/events"
                className="hover:text-[var(--color-primary)] transition-colors no-underline"
              >
                Events
              </Link>
              <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none">
                <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <Link
                href={`/manage/events/${event.id}`}
                className="hover:text-[var(--color-primary)] transition-colors no-underline truncate max-w-[180px] sm:max-w-xs"
              >
                {event.title}
              </Link>
              <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none">
                <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[var(--color-text)] font-semibold">Entrance Panel</span>
            </nav>

            <div className="flex-1">
              {/* Combined title and ConnectionBadge row */}
              <div className="flex flex-row justify-between items-center w-full mb-1 gap-3 flex-wrap">
                {/* Group title and entrance badge on the left */}
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-[22px] font-bold text-[var(--color-text)] leading-tight">{event.title}</h1>
                  <span className="badge badge-green">Entrance Panel</span>
                </div>

                {/* Aligned ConnectionBadge on the right */}
                <div className="flex-shrink-0">
                  <ConnectionBadge isOnline={isOnline} />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-[13px] text-[var(--color-text-muted)]">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                    <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                  {event.venue}
                </span>
                <span>·</span>
                <span>{formatDate(event.startDate)}</span>
                <span>·</span>
                {/* Live clock */}
                <span className="font-mono font-semibold text-[var(--color-primary)]">{currentTime}</span>
              </div>
            </div>
          </div>


          {/* ── Stats Row ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatPill label="Checked In" value={event.checkedIn} color="text-green-600" />
            <StatPill label="Registered" value={event.totalRegistered} color="text-[var(--color-primary)]" />
            <StatPill label="Paid" value={event.confirmedPaid} color="text-blue-600" />
            <StatPill label="Capacity" value={event.capacity} color="text-[var(--color-text-secondary)]" />
          </div>

          {/* Progress bar */}
          <div className="">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-[var(--color-text-secondary)]">Check-in Progress</span>
              <span className="text-[12px] font-bold text-green-600">{checkinPct}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
              <div
                className="h-full rounded-full bg-green-500 transition-all duration-500"
                style={{ width: `${checkinPct}%` }}
              />
            </div>
          </div>

          {/* ── Main Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">

            {/* Left — Scanner + Result */}
            <div className="flex flex-col gap-5">

              {/* Scan / Search Box */}
              <div className="card card-body !p-5">
                <label className="form-label mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-[var(--color-primary)]" viewBox="0 0 24 24" fill="none">
                    <path d="M3 9h6V3H3v6zM3 21h6v-6H3v6zM15 3v6h6V3h-6zM9 9h6v6H9V9zM15 15h6v6h-6v-6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Scan / Enter School ID
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="e.g. 202305123"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="!text-[15px] !font-mono !py-3 !pr-10"
                      autoComplete="off"
                      spellCheck={false}
                    />
                    {searchInput && (
                      <button
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                        aria-label="Clear"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <button
                    onClick={handleSearch}
                    className="btn btn-primary px-6 flex-shrink-0"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <path d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <span className="hidden sm:inline">Look Up</span>
                  </button>
                </div>
                <p className="form-hint mt-2">Press Enter or click Look Up after entering the School ID</p>
              </div>

              {/* Result area */}
              {!searchQuery && <IdleCard />}
              {searchQuery && registration === 'not_found' && <NotFoundCard schoolId={searchQuery} />}
              {searchQuery && registration && registration !== 'not_found' && (
                registration.paymentStatus === 'Paid'
                  ? <GreenCard reg={registration} onCheckIn={handleCheckIn} loading={actionLoading} />
                  : <RedCard reg={registration} onConfirmPayment={handleConfirmPayment} loading={actionLoading} />
              )}

              {/* Hint after result */}
              {registration && registration !== 'not_found' && (
                <button
                  onClick={handleClear}
                  className="btn btn-ghost btn-full text-[var(--color-text-secondary)]"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Scan next student
                </button>
              )}
            </div>

            {/* Right — Queue + Recent Activity */}
            <div className="flex flex-col gap-5">

              {/* Offline queue */}
              <OfflineQueuePanel queue={queue} onSync={handleSync} isSyncing={isSyncing} />

              {/* Tips card */}
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                <p className="text-[12px] font-semibold text-[var(--color-text-secondary)] mb-3 uppercase tracking-wide">Quick Tips</p>
                <ul className="flex flex-col gap-2.5">
                  {[
                    { icon: '🟢', text: 'Green card = payment confirmed. Tap Check In.' },
                    { icon: '🔴', text: 'Red card = collect cash, then tap Confirm Payment.' },
                    { icon: '📵', text: 'Works offline. Actions sync when connection returns.' },
                    { icon: '↩️', text: 'Press Enter to instantly look up a School ID.' },
                  ].map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-[12px] text-[var(--color-text-secondary)]">
                      <span className="mt-0.5">{tip.icon}</span>
                      <span>{tip.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recent Activity */}
              <RecentActivityFeed activities={recentActivity} />

              {/* Link to full masterlist */}
              <Link
                href={`/manage/events/${event.id}/participants`}
                className="flex items-center justify-center gap-2 text-[13px] font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] bg-[var(--color-primary-muted)] rounded-xl px-4 py-3 transition-colors no-underline"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002 2h2a2 2 0 002-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                View Full Masterlist
              </Link>
            </div>
          </div>
        </div>
      </ManageShell>

      {/* ── Toast ── */}
      {toast && (
        <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
          <div className="flex items-center gap-2">
            {toast.type === 'success'
              ? <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              : <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"><path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            }
            {toast.msg}
          </div>
        </div>
      )}
    </>
  );
}
