'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import AdminShell from '@/components/AdminShell';
import { IconRefresh } from '@/components/ui/IconRefresh';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v1';

type EventStatus = 'Upcoming' | 'Open' | 'Full' | 'Closed' | 'Completed' | 'Cancelled';

interface KpiCardData {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  href?: string;
}

interface OrgRow {
  id: string;
  name: string;
  category: 'Academic' | 'Non-Academic' | 'Religious';
  accreditationStatus: 'Active' | 'Suspended';
  eventCount: number;
  accreditedAt: string;
}

interface EventRow {
  id: string;
  title: string;
  orgName: string;
  status: EventStatus;
  startDate: string;
  registered: number;
  capacity: number;
}

interface ActivityRow {
  id: string;
  type: 'accreditation' | 'event_created' | 'event_cancelled' | 'user_deactivated';
  actor: string;
  target: string;
  timestamp: string;
}

const STATUS_STYLES: Record<EventStatus, string> = {
  Upcoming: 'badge-blue',
  Open: 'badge-green',
  Full: 'badge-yellow',
  Closed: 'badge-gray',
  Completed: 'badge-gray',
  Cancelled: 'badge-red',
};

const CATEGORY_STYLES: Record<OrgRow['category'], string> = {
  Academic: 'badge-blue',
  'Non-Academic': 'badge-yellow',
  Religious: 'badge-green',
};

function formatDate(iso: string) {
  if (!iso) return 'N/A';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

function KpiCard({ card }: { card: KpiCardData }) {
  const body = (
    <div className={`card card-body !p-5 flex items-start gap-4 h-full border border-[var(--color-border)] transition-all duration-200 hover:shadow-md hover:-translate-y-[1px] ${card.href ? 'cursor-pointer' : ''}`}>
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${card.bg}`}>
        <span className={card.color}>{card.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium text-[var(--color-text-muted)] mb-1">{card.label}</p>
        <p className="text-[30px] font-bold text-[var(--color-text)] leading-none">{card.value}</p>
      </div>
    </div>
  );
  return card.href ? <Link href={card.href} className="no-underline h-full">{body}</Link> : body;
}

function StatusMiniBar({ registered, capacity }: { registered: number; capacity: number }) {
  const safeCapacity = capacity > 0 ? capacity : 1;
  const pct = Math.min(Math.round((registered / safeCapacity) * 100), 100);
  const color = pct >= 90 ? 'bg-red-400' : pct >= 60 ? 'bg-amber-400' : 'bg-green-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] text-[var(--color-text-muted)] font-mono whitespace-nowrap">{registered}/{capacity}</span>
    </div>
  );
}

function ActivityIcon({ type }: { type: ActivityRow['type'] }) {
  const map: Record<ActivityRow['type'], { bg: string; icon: React.ReactNode }> = {
    accreditation: {
      bg: 'bg-amber-100',
      icon: <svg className="w-3 h-3 text-amber-600" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
    },
    event_created: {
      bg: 'bg-green-100',
      icon: <svg className="w-3 h-3 text-green-600" viewBox="0 0 24 24" fill="none"><path d="M12 4v16m8-8H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>,
    },
    event_cancelled: {
      bg: 'bg-red-100',
      icon: <svg className="w-3 h-3 text-red-600" viewBox="0 0 24 24" fill="none"><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>,
    },
    user_deactivated: {
      bg: 'bg-gray-100',
      icon: <svg className="w-3 h-3 text-gray-500" viewBox="0 0 24 24" fill="none"><path d="M18.364 18.364L5.636 5.636" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
    },
  };
  const { bg, icon } = map[type];
  return <div className={`w-7 h-7 rounded-full ${bg} flex items-center justify-center flex-shrink-0`}>{icon}</div>;
}

export default function AdminDashboardPage() {
  const [_period, setPeriod] = useState<'week' | 'month' | 'all'>('month');

  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [registeredStudents, setRegisteredStudents] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [refreshingEvents, setRefreshingEvents] = useState(false);
  const [refreshingActivity, setRefreshingActivity] = useState(false);
  const [refreshingOrgs, setRefreshingOrgs] = useState(false);

  const authToken = () => window.localStorage.getItem('auth_token') ?? window.sessionStorage.getItem('auth_token');

  const mapEvents = (rows: any[]): EventRow[] => rows.map((e: any) => ({
    id: String(e.id ?? ''),
    title: String(e.title ?? 'Untitled Event'),
    orgName: String(e.host_org_name ?? e.host_org?.name ?? 'Organization'),
    status: (e.status ?? 'Upcoming') as EventStatus,
    startDate: String(e.start_date ?? ''),
    registered: Number(e.total_registered ?? 0),
    capacity: Number(e.capacity ?? 0),
  }));

  const mapOrgs = (rows: any[]): OrgRow[] => rows.map((o: any) => ({
    id: String(o.id ?? ''),
    name: String(o.name ?? 'Organization'),
    category: (o.category?.name ?? 'Academic') as OrgRow['category'],
    accreditationStatus: (o.accreditation_status ?? 'Active') as OrgRow['accreditationStatus'],
    eventCount: Number(o.total_events ?? 0),
    accreditedAt: String(o.accredited_at ?? ''),
  }));

  const mapActivity = (rows: any[]): ActivityRow[] => rows.slice(0, 5).map((a: any) => {
    const action = String(a.action ?? '').toLowerCase();
    let type: ActivityRow['type'] = 'event_created';
    if (action.includes('deactiv')) type = 'user_deactivated';
    else if (action.includes('accredit') || action.includes('suspend') || action.includes('restore')) type = 'accreditation';
    else if (action.includes('cancel') || action.includes('remove')) type = 'event_cancelled';
    return {
      id: String(a.id ?? Math.random().toString(36).slice(2)),
      type,
      actor: String(a.actor_name ?? 'System'),
      target: String(a.target_label ?? a.action ?? 'Activity'),
      timestamp: formatDate(String(a.timestamp ?? '')),
    };
  });

  async function refreshEvents() {
    const token = authToken();
    if (!token) return;
    setRefreshingEvents(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/events?per_page=200`, { headers: { Accept: 'application/json', Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('events-fetch-failed');
      const payload = await res.json();
      setEvents(mapEvents(Array.isArray(payload?.data) ? payload.data : []));
    } finally {
      setRefreshingEvents(false);
    }
  }

  async function refreshActivity() {
    const token = authToken();
    if (!token) return;
    setRefreshingActivity(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/audit?per_page=20`, { headers: { Accept: 'application/json', Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('audit-fetch-failed');
      const payload = await res.json();
      setActivity(mapActivity(Array.isArray(payload?.data) ? payload.data : []));
    } finally {
      setRefreshingActivity(false);
    }
  }

  async function refreshOrgs() {
    const token = authToken();
    if (!token) return;
    setRefreshingOrgs(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/organizations?per_page=200`, { headers: { Accept: 'application/json', Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('orgs-fetch-failed');
      const payload = await res.json();
      setOrgs(mapOrgs(Array.isArray(payload?.data) ? payload.data : []));
    } finally {
      setRefreshingOrgs(false);
    }
  }

  useEffect(() => {
    const token = authToken();
    if (!token) {
      setIsLoading(false);
      setLoadError('Not authenticated.');
      return;
    }

    const run = async () => {
      try {
        const [orgRes, eventRes, auditRes, userRes] = await Promise.all([
          fetch(`${API_BASE_URL}/admin/organizations?per_page=200`, { headers: { Accept: 'application/json', Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/admin/events?per_page=200`, { headers: { Accept: 'application/json', Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/admin/audit?per_page=20`, { headers: { Accept: 'application/json', Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/admin/users?per_page=500`, { headers: { Accept: 'application/json', Authorization: `Bearer ${token}` } }),
        ]);

        if (!orgRes.ok || !eventRes.ok || !auditRes.ok || !userRes.ok) throw new Error('fetch-failed');

        const orgPayload = await orgRes.json();
        const eventPayload = await eventRes.json();
        const auditPayload = await auditRes.json();
        const userPayload = await userRes.json();

        setOrgs(mapOrgs(Array.isArray(orgPayload?.data) ? orgPayload.data : []));
        setEvents(mapEvents(Array.isArray(eventPayload?.data) ? eventPayload.data : []));
        setActivity(mapActivity(Array.isArray(auditPayload?.data) ? auditPayload.data : []));

        const users = Array.isArray(userPayload?.data) ? userPayload.data : [];
        setRegisteredStudents(users.filter((u: any) => u.is_active === true && u.global_role === 'User').length);

        setLoadError('');
      } catch {
        setLoadError('Unable to load dashboard data.');
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, []);

  const suspendedOrgs = useMemo(() => orgs.filter((o) => o.accreditationStatus === 'Suspended'), [orgs]);

  const kpiCards: KpiCardData[] = [
    {
      label: 'Total Organizations', value: orgs.length, href: '/admin/organizations',
      icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
      color: 'text-green-700', bg: 'bg-green-100',
    },
    {
      label: 'Active Organizations', value: orgs.filter((o) => o.accreditationStatus === 'Active').length,
      icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
      color: 'text-blue-700', bg: 'bg-blue-100',
    },
    {
      label: 'Suspended', value: suspendedOrgs.length, href: '/admin/organizations',
      icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
      color: 'text-amber-700', bg: 'bg-amber-100',
    },
    {
      label: 'Registered Students', value: registeredStudents, href: '/admin/users',
      icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
      color: 'text-purple-700', bg: 'bg-purple-100',
    },
    {
      label: 'Total Events', value: events.length, href: '/admin/events',
      icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M8 2v3M16 2v3M3 8h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
      color: 'text-indigo-700', bg: 'bg-indigo-100',
    },
    {
      label: 'Total Registrations', value: events.reduce((sum, e) => sum + e.registered, 0),
      icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
      color: 'text-teal-700', bg: 'bg-teal-100',
    },
  ];

  return (
    <AdminShell>
      <div className="flex flex-col gap-6 animate-fade-in">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-1">Admin</p>
            <h1 className="text-[22px] font-bold text-[var(--color-text)] leading-tight">Dashboard</h1>
            <p className="text-[14px] text-[var(--color-text-muted)] mt-1">Platform-wide activity overview - Cavite State University</p>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)]">
            {(['week', 'month', 'all'] as const).map((p) => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 rounded-lg text-[12px] font-medium transition-all duration-200 ${_period === p ? 'bg-white shadow-sm text-[var(--color-text)]' : 'text-[var(--color-primary)] hover:text-[var(--color-primary-light)]'}`}>
                {p === 'all' ? 'All Time' : `This ${p.charAt(0).toUpperCase() + p.slice(1)}`}
              </button>
            ))}
          </div>
        </div>

        {!!loadError && <div className="rounded-lg px-4 py-3 text-sm" style={{ background: 'var(--color-error-light)', color: 'var(--color-error)' }}>{loadError}</div>}
        {isLoading && <div className="text-sm text-[var(--color-text-muted)]">Loading dashboard...</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {kpiCards.map((card) => <KpiCard key={card.label} card={card} />)}
        </div>

        {suspendedOrgs.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-start gap-3">
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-amber-800">{suspendedOrgs.length} organization{suspendedOrgs.length > 1 ? 's are' : ' is'} currently suspended</p>
              <p className="text-[12px] text-amber-700 mt-1">{suspendedOrgs.map((o) => o.name).join(', ')} - suspended organizations cannot publish events.</p>
            </div>
            <Link href="/admin/organizations" className="text-[12px] font-semibold text-amber-700 hover:text-amber-900 no-underline">Review -&gt;</Link>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_350px] gap-6">
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-[var(--color-text)]">Recent Events</h2>
              <div className="flex items-center gap-2">
                <button onClick={refreshEvents} disabled={refreshingEvents} className="p-0 bg-transparent border-0 cursor-pointer inline-flex items-center justify-center text-[var(--color-primary)] hover:text-[var(--color-primary-light)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Refresh recent events" title="Refresh recent events"><IconRefresh spinning={refreshingEvents} /></button>
                <Link href="/admin/events" className="text-[12px] font-medium text-[var(--color-primary)] no-underline hover:underline">View all</Link>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr><th>Event</th><th className="hidden sm:table-cell">Organization</th><th className="hidden md:table-cell">Date</th><th>Registrations</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {events.slice(0, 5).map((ev) => (
                    <tr key={ev.id}>
                      <td><p className="text-[13px] font-semibold text-[var(--color-text)] truncate max-w-[220px]">{ev.title}</p></td>
                      <td className="hidden sm:table-cell"><p className="text-[12px] text-[var(--color-text-muted)] truncate max-w-[160px]">{ev.orgName}</p></td>
                      <td className="hidden md:table-cell"><p className="text-[12px] text-[var(--color-text-muted)]">{formatDate(ev.startDate)}</p></td>
                      <td><div className="w-[120px]"><StatusMiniBar registered={ev.registered} capacity={ev.capacity} /></div></td>
                      <td><span className={`badge ${STATUS_STYLES[ev.status]}`}>{ev.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-[var(--color-text)]">Recent Admin Activity</h2>
              <button onClick={refreshActivity} disabled={refreshingActivity} className="p-0 bg-transparent border-0 cursor-pointer inline-flex items-center justify-center text-[var(--color-primary)] hover:text-[var(--color-primary-light)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Refresh admin activity" title="Refresh admin activity"><IconRefresh spinning={refreshingActivity} /></button>
            </div>
            <div className="divide-y divide-[var(--color-border)]">
              {activity.map((item) => (
                <div key={item.id} className="flex items-start gap-3 px-5 py-4">
                  <ActivityIcon type={item.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-[var(--color-text)] leading-relaxed">{item.target}</p>
                    <p className="text-[11px] text-[var(--color-text-muted)] mt-1">{item.actor} · {item.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-[var(--color-text)]">Organizations Overview</h2>
            <div className="flex items-center gap-2">
              <button onClick={refreshOrgs} disabled={refreshingOrgs} className="p-0 bg-transparent border-0 cursor-pointer inline-flex items-center justify-center text-[var(--color-primary)] hover:text-[var(--color-primary-light)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Refresh organizations overview" title="Refresh organizations overview"><IconRefresh spinning={refreshingOrgs} /></button>
              <Link href="/admin/organizations" className="text-[12px] font-medium text-[var(--color-primary)] no-underline hover:underline">Manage all -&gt;</Link>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr><th>Organization</th><th>Category</th><th className="hidden sm:table-cell">Events</th><th className="hidden md:table-cell">Last Updated</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {orgs.slice(0, 8).map((org) => (
                  <tr key={org.id}>
                    <td><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-white" style={{ backgroundColor: 'var(--color-primary)' }}>{org.name.slice(0, 2).toUpperCase()}</div><p className="text-[13px] font-semibold text-[var(--color-text)] truncate max-w-[220px]">{org.name}</p></div></td>
                    <td><span className={`badge ${CATEGORY_STYLES[org.category]}`}>{org.category}</span></td>
                    <td className="hidden sm:table-cell"><span className="text-[13px] text-[var(--color-text-muted)]">{org.eventCount}</span></td>
                    <td className="hidden md:table-cell"><span className="text-[12px] text-[var(--color-text-muted)]">{formatDate(org.accreditedAt)}</span></td>
                    <td><span className={`badge ${org.accreditationStatus === 'Active' ? 'badge-green' : 'badge-red'}`}>{org.accreditationStatus}</span></td>
                    <td><Link href={`/admin/organizations/${org.id}`} className="text-[12px] font-medium text-[var(--color-primary)] no-underline hover:underline">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

