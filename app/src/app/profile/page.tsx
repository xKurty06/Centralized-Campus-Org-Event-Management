'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v1';

type GlobalRole = 'Overseer' | 'Officer' | 'User';
type OrgCategory = 'Academic' | 'Non-Academic' | 'Religious';

interface Department { name: string; code: string; }
interface Course { id: string; name: string; code: string; }
interface UserProfile {
  id: string;
  school_id: string;
  email: string;
  first_name: string;
  last_name: string;
  department: Department | null;
  course: Course | null;
  year_level: number | null;
  section: number | null;
  global_role: GlobalRole;
  is_active: boolean;
}
interface OrgMembership {
  org_id: string;
  org_name: string;
  org_category: OrgCategory;
  org_status: 'Active' | 'Suspended';
  org_color: string;
  position: string;
  is_active: boolean;
}
interface ActivitySummary { total_registered: number; total_confirmed: number; total_attended: number; total_upcoming: number; }

const EMPTY_ACTIVITY: ActivitySummary = { total_registered: 0, total_confirmed: 0, total_attended: 0, total_upcoming: 0 };
const ORG_CATEGORY_COLORS: Record<OrgCategory, string> = {
  Academic: 'bg-blue-50 text-blue-700 border-blue-200',
  'Non-Academic': 'bg-orange-50 text-orange-700 border-orange-200',
  Religious: 'bg-purple-50 text-purple-700 border-purple-200',
};

function getYearLabel(year: number): string { return ({ 1: '1st Year', 2: '2nd Year', 3: '3rd Year', 4: '4th Year', 5: '5th Year' } as Record<number, string>)[year] ?? `Year ${year}`; }
function getInitials(first: string, last: string): string { return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase() || 'U'; }

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="bg-white rounded-xl border border-gray-200 overflow-hidden"><div className="px-5 py-3.5 border-b border-gray-100"><p className="text-[13px] font-semibold text-gray-700">{title}</p></div><div className="px-5 py-4">{children}</div></div>;
}
function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-3 border-b border-gray-50 last:border-b-0"><span className="text-[12px] font-medium text-gray-400 flex-shrink-0 sm:w-44">{label}</span><span className={`text-[13px] font-semibold text-gray-800 sm:text-right ${mono ? 'font-mono tracking-wide' : ''}`}>{value}</span></div>;
}
function StatCard({ value, label, color = 'text-gray-900', bg = 'bg-white border-gray-200' }: { value: number; label: string; color?: string; bg?: string; }) {
  return <div className={`rounded-xl border ${bg} px-4 py-3.5 flex flex-col gap-0.5`}><span className={`text-[24px] font-bold leading-none ${color}`}>{value}</span><span className="text-[12px] text-gray-500">{label}</span></div>;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [memberships, setMemberships] = useState<OrgMembership[]>([]);
  const [activity] = useState<ActivitySummary>(EMPTY_ACTIVITY);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = window.localStorage.getItem('auth_token') ?? window.sessionStorage.getItem('auth_token');
    if (!token) { router.replace('/events'); return; }
    const controller = new AbortController();
    const run = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, { headers: { Accept: 'application/json', Authorization: `Bearer ${token}` }, signal: controller.signal });
        if (res.status === 401 || res.status === 403) throw new Error('unauthorized');
        if (!res.ok) throw new Error('fetch-failed');
        const payload = await res.json();
        const u = payload?.data;
        if (!u) throw new Error('invalid-payload');
        setUser({
          id: String(u.id ?? ''), school_id: u.school_id ?? '-', email: u.email ?? '-', first_name: u.first_name ?? '', last_name: u.last_name ?? '',
          department: { name: u.department?.name ?? 'N/A', code: u.department?.code ?? 'N/A' },
          course: u.course ? { id: String(u.course.id ?? ''), name: u.course.name ?? 'N/A', code: u.course.code ?? 'N/A' } : null,
          year_level: typeof u.year_level === 'number' ? u.year_level : null,
          section: typeof u.section === 'number' ? u.section : null,
          global_role: u.global_role === 'Overseer' ? 'Overseer' : u.global_role === 'Officer' ? 'Officer' : 'User',
          is_active: Boolean(u.is_active ?? true),
        });
        if (Array.isArray(u.memberships)) {
          setMemberships(u.memberships.map((m: any) => ({
            org_id: String(m.org_id ?? ''),
            org_name: m.org_name ?? 'Unknown Organization',
            org_category: m.org_category === 'Academic' || m.org_category === 'Non-Academic' || m.org_category === 'Religious' ? m.org_category : 'Non-Academic',
            org_status: m.org_status === 'Suspended' ? 'Suspended' : 'Active',
            org_color: String(m.org_color ?? 'bg-gray-100 text-gray-700'),
            position: String(m.position ?? 'Member'),
            is_active: Boolean(m.is_active ?? false),
          })));
        }
      } catch (error: any) {
        if (error?.name === 'AbortError') return;
        if (error?.message === 'unauthorized') {
          window.localStorage.removeItem('auth_token'); window.localStorage.removeItem('auth_user');
          window.sessionStorage.removeItem('auth_token'); window.sessionStorage.removeItem('auth_user');
          router.replace('/events');
          return;
        }
      } finally { setIsLoading(false); }
    };
    run();
    return () => controller.abort();
  }, [router]);

  const fullName = useMemo(() => `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim() || 'User', [user]);
  const departmentCode = useMemo(() => user?.department?.code ?? 'N/A', [user]);
  const departmentName = useMemo(() => user?.department?.name ?? 'N/A', [user]);
  const initials = useMemo(() => getInitials(user?.first_name ?? '', user?.last_name ?? ''), [user]);
  const yearLabel = useMemo(() => getYearLabel(user?.year_level ?? 0), [user]);
  const isOfficer = useMemo(() => user?.global_role === 'Officer' || memberships.some((m) => m.is_active && m.position !== 'Member'), [user, memberships]);

  if (isLoading || !user) return <div className="min-h-screen bg-gray-50"><main className="w-full max-w-[1280px] mx-auto px-6 lg:px-12 py-8"><p className="text-[14px] text-gray-500">Loading profile...</p></main></div>;

  return <div className="min-h-screen bg-gray-50 flex flex-col">
    <main className="flex-1 w-full max-w-[1280px] mx-auto px-6 lg:px-12 py-8 flex flex-col gap-6 animate-fade-in">
      <div><h1 className="text-[26px] font-bold text-gray-900 tracking-tight">My Profile</h1><p className="text-[14px] text-gray-500 mt-1">Your verified campus identity. This information is pulled from institutional records and cannot be edited here.</p></div>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden"><div className="relative h-28" style={{ background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary-light) 100%)' }} /><div className="px-6 pb-6"><div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 -mt-11 mb-4"><div className="relative z-10 w-[84px] h-[84px] rounded-2xl border-4 border-white shadow-md flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-primary-muted)' }}><span className="text-[26px] font-bold" style={{ color: 'var(--color-primary)' }}>{initials}</span></div><div className="flex flex-wrap items-center gap-2 pb-1"><span className={`flex items-center gap-1.5 text-[11px] font-semibold border px-3 py-1 rounded-full ${user.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-500 border-red-200'}`}>{user.is_active ? 'Active' : 'Deactivated'}</span><span className="text-[11px] font-semibold bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{user.global_role === 'Overseer' ? 'Overseer' : user.global_role === 'Officer' ? 'Officer' : 'Student'}</span></div></div><h2 className="text-[22px] font-bold text-gray-900 leading-tight">{fullName}</h2><p className="text-[13px] text-gray-400 mt-1">{departmentName}</p><p className="text-[13px] text-gray-400 mt-0.5">{user.course?.name ?? 'Course unavailable'} ({user.course?.code ?? 'N/A'} {user.year_level ?? '-'}-{user.section ?? '-'})</p></div></div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3"><StatCard value={activity.total_registered} label="Registered" /><StatCard value={activity.total_confirmed} label="Confirmed" color="text-green-700" bg="bg-green-50 border-green-200" /><StatCard value={activity.total_attended} label="Attended" color="text-blue-700" bg="bg-blue-50 border-blue-200" /><StatCard value={activity.total_upcoming} label="Upcoming" color="text-purple-700" bg="bg-purple-50 border-purple-200" /></div>
      <div className="flex flex-col lg:flex-row gap-5"><div className="flex-1 flex flex-col gap-5"><SectionCard title="Identity information"><div className="flex flex-col"><InfoRow label="Full name" value={fullName} /><InfoRow label="Student ID" value={user.school_id} mono /><InfoRow label="Email" value={user.email} /><InfoRow label="Department" value={`${departmentName} (${departmentCode})`} /><InfoRow label="Course" value={`${user.course?.name ?? 'N/A'} (${user.course?.code ?? 'N/A'})`} /><InfoRow label="Year level" value={user.year_level ? yearLabel : 'N/A'} /><InfoRow label="Section" value={user.section ? `Section ${user.section}` : 'N/A'} /><InfoRow label="Account role" value={user.global_role === 'Overseer' ? 'Overseer (Admin)' : user.global_role === 'Officer' ? 'Officer' : 'Student'} /><InfoRow label="Account ID" value={user.id} mono /></div></SectionCard></div>
      <div className="lg:w-[340px] flex flex-col gap-5 flex-shrink-0"><SectionCard title={`Organization memberships (${memberships.length})`}>{memberships.length === 0 ? <div className="flex flex-col items-center text-center py-6 gap-2"><p className="text-[13px] text-gray-400">Not a member of any organization yet.</p><Link href="/organizations" className="text-[13px] font-semibold text-green-700 hover:underline no-underline">Browse organizations</Link></div> : <div className="flex flex-col gap-3">{memberships.map((m) => <Link key={m.org_id} href={`/organizations/${m.org_id}`} className={`group flex items-center gap-3 p-3 rounded-xl border transition-all duration-150 no-underline ${m.is_active ? 'border-gray-200 hover:border-green-300 hover:bg-green-50' : 'border-gray-100 bg-gray-50 opacity-60'}`}><div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-[12px] font-bold ${m.org_color}`}>{m.org_name.split(' ').map((w) => w[0]).slice(0, 2).join('')}</div><div className="flex-1 min-w-0"><p className="text-[13px] font-semibold text-gray-800 group-hover:text-green-700 transition-colors truncate">{m.org_name}</p><div className="flex items-center gap-1.5 mt-0.5"><span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${ORG_CATEGORY_COLORS[m.org_category]}`}>{m.org_category}</span></div></div></Link>)}</div>}</SectionCard></div></div>
    </main>
  </div>;
}
