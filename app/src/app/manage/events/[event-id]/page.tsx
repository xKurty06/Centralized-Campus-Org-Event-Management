'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import ManageShell from '@/components/ManageShell';

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
  status: EventStatus;
  is_paid: boolean;
  capacity: number;
  total_registered: number;
  total_paid: number;
  total_pending: number;
  proofs_pending_review: number;
  created_at: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v1';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function EventDashboardPage() {
  const params = useParams();
  const eventId = params['event-id'] as string;
  const [event, setEvent] = useState<ManagedEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const token = window.localStorage.getItem('auth_token') ?? window.sessionStorage.getItem('auth_token');
      if (!token) {
        setError('Session missing. Please sign in again.');
        setLoading(false);
        return;
      }
      const res = await fetch(`${API_BASE_URL}/manage/events/${eventId}`, {
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      }).catch(() => null);
      const payload = await res?.json().catch(() => null) as { success?: boolean; data?: any; error?: string } | null;
      if (!res || !res.ok || !payload?.success || !payload.data) {
        setError(payload?.error ?? 'Unable to load event.');
        setLoading(false);
        return;
      }
      const e = payload.data;
      setEvent({
        id: e.id,
        title: e.title ?? 'Untitled Event',
        description: e.description ?? '',
        category: (e.category_name ?? 'Other') as EventCategory,
        start_date: e.start_date ?? new Date().toISOString(),
        end_date: e.end_date ?? e.start_date ?? new Date().toISOString(),
        venue_name: e.venue_name ?? 'TBA',
        status: (e.status ?? 'Upcoming') as EventStatus,
        is_paid: Boolean(e.is_paid),
        capacity: Number(e.capacity ?? 0),
        total_registered: Number(e.total_registered ?? 0),
        total_paid: Number(e.total_paid ?? 0),
        total_pending: Number(e.total_pending ?? 0),
        proofs_pending_review: Number(e.proofs_pending_review ?? 0),
        created_at: e.created_at ?? new Date().toISOString(),
      });
      setError('');
      setLoading(false);
    })();
  }, [eventId]);

  const fill = useMemo(() => {
    if (!event || event.capacity <= 0) return 0;
    return Math.min(Math.round((event.total_registered / event.capacity) * 100), 100);
  }, [event]);

  return (
    <ManageShell pageTitle="Salikop">
      <div className="flex flex-col gap-5 animate-fade-in">
        <Link href="/manage/events" className="text-sm text-gray-500 hover:text-[var(--color-primary)] no-underline">Back to Events</Link>
        {loading && <div className="text-sm text-gray-500">Loading event...</div>}
        {!!error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>}
        {event && (
          <>
            <div className="card"><div className="card-body flex flex-col gap-2">
              <h1 className="text-[22px] font-bold text-gray-900">{event.title}</h1>
              <p className="text-sm text-gray-500">{event.description}</p>
              <p className="text-xs text-gray-500">{fmtDate(event.start_date)} • {event.venue_name} • {event.status}</p>
            </div></div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Stat label="Registered" value={`${event.total_registered}/${event.capacity}`} />
              <Stat label="Paid" value={event.total_paid} />
              <Stat label="Pending" value={event.total_pending} />
              <Stat label="Proofs" value={event.proofs_pending_review} />
            </div>
            <div className="card"><div className="card-body"><div className="h-3 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-green-600" style={{ width: `${fill}%` }} /></div></div></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Link href={`/manage/events/${event.id}/participants`} className="btn btn-outline no-underline">Participants</Link>
              <Link href={`/manage/events/${event.id}/verify`} className="btn btn-primary no-underline">Entrance Verification</Link>
              <Link href={`/manage/events/${event.id}/edit`} className="btn btn-ghost no-underline">Edit Event</Link>
              <Link href={`/manage/events/${event.id}/settings`} className="btn btn-danger no-underline">Settings</Link>
            </div>
          </>
        )}
      </div>
    </ManageShell>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return <div className="card"><div className="card-body py-4"><p className="text-xs text-gray-500">{label}</p><p className="text-2xl font-bold">{value}</p></div></div>;
}
