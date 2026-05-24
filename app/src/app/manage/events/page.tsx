'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ManageShell from '@/components/ManageShell';
import { FilterSelect } from '@/components/ui/filter';
import { IconRefresh } from '@/components/ui/IconRefresh';

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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v1';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

type SortKey = 'date_desc' | 'date_asc' | 'title_asc' | 'registered_desc';

export default function ManageEventsPage() {
  const [rows, setRows] = useState<ManagedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'All'>('All');
  const [sort, setSort] = useState<SortKey>('date_desc');

  async function loadEvents(showRefreshing = false) {
    const token = window.localStorage.getItem('auth_token') ?? window.sessionStorage.getItem('auth_token');
    if (!token) {
      setError('Session missing. Please sign in again.');
      setLoading(false);
      return;
    }

    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    const res = await fetch(`${API_BASE_URL}/manage/dashboard?per_page=500`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    }).catch(() => null);

    const payload = await res?.json().catch(() => null) as { success?: boolean; data?: any[]; error?: string } | null;
    if (!res || !res.ok || !payload?.success || !Array.isArray(payload.data)) {
      setError(payload?.error ?? 'Unable to load events.');
      setRows([]);
    } else {
      setRows(payload.data.map((e) => ({
        id: String(e.id ?? ''),
        title: e.title ?? 'Untitled Event',
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
      })));
      setError('');
    }

    if (showRefreshing) setRefreshing(false);
    else setLoading(false);
  }

  useEffect(() => {
    loadEvents(false);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const out = rows.filter((e) => {
      const matchQ = !q || e.title.toLowerCase().includes(q) || e.venue_name.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'All' || e.status === statusFilter;
      return matchQ && matchStatus;
    });

    out.sort((a, b) => {
      if (sort === 'date_desc') return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
      if (sort === 'date_asc') return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
      if (sort === 'title_asc') return a.title.localeCompare(b.title);
      if (sort === 'registered_desc') return b.total_registered - a.total_registered;
      return 0;
    });

    return out;
  }, [rows, search, statusFilter, sort]);

  return (
    <ManageShell pageTitle="Salikop">
      <div className="flex flex-col gap-5 animate-fade-in">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[12px] font-medium text-gray-400 uppercase tracking-wide">Manage</p>
            <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Events</h1>
          </div>
          <Link href="/manage/create-event" className="btn btn-primary btn-sm no-underline">Create event</Link>
        </div>

        <div className="card">
          <div className="card-body py-3.5 flex flex-col sm:flex-row gap-2.5 sm:items-center">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title or venue..." className="input-has-left-icon flex-1" />
            <FilterSelect
              value={statusFilter}
              defaultValue="All"
              onChange={(v) => setStatusFilter(v as EventStatus | 'All')}
              options={[{ value: 'All', label: 'All Status' }, { value: 'Upcoming', label: 'Upcoming' }, { value: 'Open', label: 'Open' }, { value: 'Full', label: 'Full' }, { value: 'Closed', label: 'Closed' }, { value: 'Completed', label: 'Completed' }, { value: 'Cancelled', label: 'Cancelled' }]}
              className="sm:w-40"
            />
            <FilterSelect
              value={sort}
              defaultValue="date_desc"
              onChange={(v) => setSort(v as SortKey)}
              options={[{ value: 'date_desc', label: 'Newest' }, { value: 'date_asc', label: 'Oldest' }, { value: 'title_asc', label: 'Title A-Z' }, { value: 'registered_desc', label: 'Most Registered' }]}
              className="sm:w-44"
            />
          </div>
        </div>

        {!!error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="card">
          <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-[var(--color-text)]">Your Events</h2>
            <button
              className="p-0 bg-transparent border-0 cursor-pointer inline-flex items-center justify-center text-[var(--color-primary)] hover:text-[var(--color-primary-light)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => loadEvents(true)}
              disabled={refreshing || loading}
              aria-label="Refresh events"
              title="Refresh events"
            >
              <IconRefresh spinning={refreshing} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr><th>Event</th><th>Date</th><th>Venue</th><th>Status</th><th>Registered</th><th>Paid</th><th>Pending</th><th>Proofs</th><th /></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="text-center py-10 text-sm text-[var(--color-text-muted)]">Loading events...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-10 text-sm text-[var(--color-text-muted)]">No events found.</td></tr>
                ) : (
                  filtered.map((ev) => (
                    <tr key={ev.id}>
                      <td className="text-sm font-medium">{ev.title}</td>
                      <td className="text-sm">{formatDate(ev.start_date)}</td>
                      <td className="text-sm">{ev.venue_name}</td>
                      <td className="text-sm">{ev.status}</td>
                      <td className="text-sm">{ev.total_registered}/{ev.capacity}</td>
                      <td className="text-sm">{ev.total_paid}</td>
                      <td className="text-sm">{ev.total_pending}</td>
                      <td className="text-sm">{ev.proofs_pending_review}</td>
                      <td><Link href={`/manage/events/${ev.id}`} className="btn btn-sm btn-ghost">Open</Link></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ManageShell>
  );
}
