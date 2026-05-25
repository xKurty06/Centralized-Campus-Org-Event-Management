'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { IconRefresh } from '@/components/ui/IconRefresh';

type OrgCategory = 'All' | 'Academic' | 'Non-Academic' | 'Religious';
type OrgStatus = 'Active' | 'Suspended';

interface Organization {
  id: string;
  slug?: string;
  name: string;
  acronym: string;
  logoUrl: string;
  category: Exclude<OrgCategory, 'All'>;
  description: string;
  adviser: string;
  members: number;
  eventsThisYear: number;
  status: OrgStatus;
  color: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v1';
const API_ORIGIN = (() => {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return 'http://localhost:8000';
  }
})();

function normalizeImageUrl(raw?: string | null): string {
  if (!raw) return '';
  const value = String(raw).trim();
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('//')) return value;
  const path = value.startsWith('/') ? value : `/${value}`;
  return `${API_ORIGIN}${path}`;
}

const CATEGORY_TABS: { value: OrgCategory; label: string }[] = [
  { value: 'All', label: 'All' },
  { value: 'Academic', label: 'Academic' },
  { value: 'Non-Academic', label: 'Non-Academic' },
  { value: 'Religious', label: 'Religious' },
];

const CATEGORY_META: Record<OrgCategory, { description: string; color: string; bg: string }> = {
  All: { description: 'All accredited campus organizations', color: 'text-gray-700', bg: 'bg-gray-100 border-gray-300' },
  Academic: { description: 'Department-based and discipline-specific organizations', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  'Non-Academic': { description: 'Student government, civic, cultural, and special interest groups', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  Religious: { description: 'Faith-based communities and campus ministry organizations', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
};

function FilterDropdown({ placeholder, options, value, onChange, icon, counts }: { placeholder: string; options: { value: string; label: string }[]; value: string; onChange: (v: string) => void; icon: ReactNode; counts?: Record<string, number>; }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);
  const selectedCount = value && counts ? counts[value] : undefined;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isActive = !!value;

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((v) => !v)} className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border text-[13px] font-medium transition-all duration-150 cursor-pointer whitespace-nowrap ${isActive ? 'bg-green-700 text-white border-green-700' : 'bg-white text-gray-600 border-gray-200 hover:border-green-600 hover:text-green-700'}`}>
        <span className={isActive ? 'text-white' : 'text-gray-400'}>{icon}</span>
        <span>{isActive ? selected?.label : placeholder}</span>
        {isActive && typeof selectedCount === 'number' ? <span className="ml-1 inline-flex items-center justify-center rounded-full bg-white bg-opacity-20 px-1.5 py-0.5 text-[11px] font-semibold text-gray-500">{selectedCount}</span> : <svg className={`w-3.5 h-3.5 transition-transform duration-150 ${open ? 'rotate-180' : ''} ${isActive ? 'text-white' : 'text-gray-400'}`} viewBox="0 0 20 20" fill="none"><path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      </button>
      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] min-w-[180px] bg-white border border-gray-200 rounded-xl shadow-lg z-30 overflow-hidden py-1">
          {options.map((opt) => {
            const count = counts?.[opt.value];
            return (
              <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false); }} className={`flex items-center justify-between w-full px-4 py-2.5 text-[13px] font-medium text-left transition-colors cursor-pointer ${opt.value === value ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                <span>{opt.label}</span>
                <span className="flex items-center gap-2">{typeof count === 'number' && <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${opt.value === value ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{count}</span>}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OrgCard({ org }: { org: Organization }) {
  const isSuspended = org.status === 'Suspended';
  return (
    <Link href={`/organizations/${org.slug ?? org.id}`} className={`group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 no-underline flex flex-col ${isSuspended ? 'opacity-60' : ''}`}>
      <div className="px-5 pt-5 pb-4 flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-[13px] font-bold overflow-hidden ${org.color}`}>
          {org.logoUrl ? (
            <img
              src={org.logoUrl}
              alt={`${org.name} logo`}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            org.acronym.slice(0, 2)
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[14px] font-semibold text-gray-900 leading-snug group-hover:text-green-700 transition-colors line-clamp-2">{org.name}</h3>
            {isSuspended && <span className="flex-shrink-0 text-[10px] font-semibold bg-red-50 text-red-500 border border-red-200 px-2 py-0.5 rounded-full">Suspended</span>}
          </div>
          <span className="text-[11px] text-gray-400 font-medium">{org.acronym}</span>
        </div>
      </div>
      <div className="px-5 pb-4"><p className="text-[12px] text-gray-500 leading-relaxed line-clamp-3">{org.description}</p></div>
      <div className="mt-auto px-5 py-3 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[12px] text-gray-400"><svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM3 17a7 7 0 1114 0H3z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>{org.members}</div>
          <div className="flex items-center gap-1 text-[12px] text-gray-400"><svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none"><path d="M6 2v2M14 2v2M3 8h14M5 4h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>{org.eventsThisYear} events</div>
        </div>
        <svg className="w-4 h-4 text-gray-300 group-hover:text-green-600 group-hover:translate-x-0.5 transition-all" viewBox="0 0 20 20" fill="none"><path d="M7 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
    </Link>
  );
}

function CategoryHeader({ category }: { category: OrgCategory }) {
  const meta = CATEGORY_META[category];
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${meta.bg} mb-4`}>
      <p className={`text-[14px] font-bold ${meta.color}`}>{category} Organizations</p>
      <span className="text-gray-300">·</span>
      <p className={`text-[12px] ${meta.color} opacity-70`}>{meta.description}</p>
    </div>
  );
}

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<OrgCategory>('All');
  const [statusFilter, setStatusFilter] = useState('');

  async function loadOrganizations(showLoading = true) {
    if (showLoading) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/organizations?per_page=500`, { headers: { Accept: 'application/json' } }).catch(() => null);
      const payload = await res?.json().catch(() => null) as { success?: boolean; data?: any[]; error?: string } | null;
      if (!res || !res.ok || !payload?.success || !Array.isArray(payload.data)) {
        setLoadError(payload?.error ?? 'Unable to load organizations.');
        setOrgs([]);
        return;
      }
      const colorMap: Record<string, string> = {
        Academic: 'bg-blue-100 text-blue-700',
        'Non-Academic': 'bg-orange-100 text-orange-700',
        Religious: 'bg-purple-100 text-purple-700',
      };
      setOrgs(payload.data.map((o) => ({
        id: String(o.id ?? ''),
        slug: o.slug ? String(o.slug) : String(o.id ?? ''),
        name: o.name ?? 'Organization',
        acronym: String(o.code_name ?? o.name ?? 'ORG').slice(0, 8).toUpperCase(),
        logoUrl: normalizeImageUrl(o.logo_url),
        category: (o.category_name ?? 'Non-Academic') as Exclude<OrgCategory, 'All'>,
        description: o.description ?? '',
        adviser: o.adviser ?? 'N/A',
        members: Number(o.members_count ?? 0),
        eventsThisYear: Number(o.events_this_year ?? 0),
        status: (o.accreditation_status === 'Suspended' ? 'Suspended' : 'Active') as OrgStatus,
        color: colorMap[o.category_name ?? 'Non-Academic'] ?? 'bg-gray-100 text-gray-700',
      })));
      setLoadError('');
    } finally {
      if (showLoading) setLoading(false);
      else setRefreshing(false);
    }
  }

  useEffect(() => {
    loadOrganizations(true);
  }, []);

  const searchedOrgs = useMemo(() => {
    const q = search.toLowerCase().trim();
    return orgs.filter((o) => !q || o.name.toLowerCase().includes(q) || o.acronym.toLowerCase().includes(q));
  }, [search, orgs]);

  const statusCounts = useMemo(() => ({
    Active: searchedOrgs.filter((o) => o.status === 'Active').length,
    Suspended: searchedOrgs.filter((o) => o.status === 'Suspended').length,
  }), [searchedOrgs]);

  const baseFiltered = useMemo(() => searchedOrgs.filter((o) => !statusFilter || o.status === statusFilter), [searchedOrgs, statusFilter]);
  const filtered = useMemo(() => activeTab === 'All' ? baseFiltered : baseFiltered.filter((o) => o.category === activeTab), [baseFiltered, activeTab]);

  const categoryCounts = useMemo(() => ({
    All: baseFiltered.length,
    Academic: baseFiltered.filter((o) => o.category === 'Academic').length,
    'Non-Academic': baseFiltered.filter((o) => o.category === 'Non-Academic').length,
    Religious: baseFiltered.filter((o) => o.category === 'Religious').length,
  }), [baseFiltered]);

  const hasFilters = !!(search || statusFilter || activeTab !== 'All');
  const clearAll = () => { setSearch(''); setActiveTab('All'); setStatusFilter(''); };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 w-full max-w-[1280px] mx-auto px-6 lg:px-12 py-8 flex flex-col gap-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div><h1 className="text-[26px] font-bold text-gray-900 tracking-tight">Student Organizations</h1><p className="text-[14px] text-gray-500 mt-1">Discover and join accredited CvSU student organizations.</p></div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="flex flex-col items-end"><span className="text-[22px] font-bold text-green-700 leading-none">{orgs.filter((o) => o.status === 'Active').length}</span><span className="text-[11px] text-gray-400">Active orgs</span></div><div className="h-8 w-px bg-gray-200" /><div className="flex flex-col items-end"><span className="text-[22px] font-bold text-gray-700 leading-none">{orgs.length}</span><span className="text-[11px] text-gray-400">Total orgs</span></div></div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex flex-col gap-3">
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 20 20" fill="none"><path d="M9 17A8 8 0 109 1a8 8 0 000 16zM19 19l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            <input type="text" placeholder="Search by organization name or acronym..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-10 py-2.5 text-[14px] text-gray-900 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-600 focus:bg-white focus:shadow-[0_0_0_3px_#dcfce7] transition-all placeholder:text-gray-400" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-gray-400 mr-1"><svg className="w-4 h-4" viewBox="0 0 20 20" fill="none"><path d="M3 5h14M6 10h8M9 15h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>Filters</div>
            <FilterDropdown placeholder="Status" value={statusFilter} onChange={setStatusFilter} counts={{ '': searchedOrgs.length, Active: statusCounts.Active, Suspended: statusCounts.Suspended }} icon={<svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" /><path d="M10 6v5l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>} options={[{ value: '', label: 'All Status' }, { value: 'Active', label: 'Active' }, { value: 'Suspended', label: 'Suspended' }]} />
            {hasFilters && <button onClick={clearAll} className="text-[12px] font-medium text-red-500 hover:text-red-600 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer">Clear all</button>}
            <span className="ml-auto text-[12px] text-gray-400">{filtered.length} organizations found</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {CATEGORY_TABS.map((tab) => {
            const active = activeTab === tab.value;
            return (
              <button key={tab.value} onClick={() => setActiveTab(tab.value)} className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border text-[13px] font-medium transition-all duration-150 cursor-pointer ${active ? 'bg-green-700 text-white border-green-700' : 'bg-white text-gray-600 border-gray-200 hover:border-green-600 hover:text-green-700'}`}>
                <span>{tab.label}</span>
                <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold ${active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{categoryCounts[tab.value]}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-row items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CategoryHeader category={activeTab} />
          </div>
          <div className="flex mb-4 gap-2 w-8 ml-2">
          <button
            type="button"
            onClick={() => loadOrganizations(false)}
            disabled={loading || refreshing}
            className="p-0 bg-transparent border-0 cursor-pointer inline-flex items-center justify-center text-[var(--color-primary)] hover:text-[var(--color-primary-light)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh organizations"
            aria-label="Refresh organizations"
          >
            <IconRefresh spinning={refreshing} />
          </button>
        </div>
    </div>

        {
    loading ? <div className="text-sm text-gray-500">Loading organizations...</div> : filtered.length > 0 ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">{filtered.map((org) => <OrgCard key={org.id} org={org} />)}</div>
    ) : (
      <div className="flex-1 flex flex-col items-center justify-center py-24 gap-3 text-center"><p className="text-[15px] font-semibold text-gray-700">No organizations found</p><p className="text-[13px] text-gray-400 max-w-xs">No organizations match your current filters.</p><button onClick={clearAll} className="mt-1 text-[13px] font-semibold text-green-700 hover:text-green-800 hover:underline cursor-pointer">Clear all filters</button></div>
    )
  }

  { !!loadError && <div className="text-sm text-red-600">{loadError}</div> }
      </main >
    </div >
  );
}
