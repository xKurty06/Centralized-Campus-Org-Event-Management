'use client';

import { useState, useEffect, useMemo, Fragment } from 'react';
import AdminShell from '@/components/AdminShell';
import { FilterSelect, FilterChip } from '@/components/ui/filter';
import { IconRefresh } from '@/components/ui/IconRefresh';

type ActionCategory = 'Accreditation' | 'User' | 'Event' | 'Membership' | 'Officer' | 'Payment';

interface AuditEntry {
  id: string;
  timestamp: string;
  actor_name: string;
  actor_school_id: string;
  actor_role: 'Overseer' | 'Officer';
  category: ActionCategory;
  action: string;
  target_label: string;
  target_id: string;
  meta?: string;
}

const CATEGORIES: ActionCategory[] = ['Accreditation', 'User', 'Event', 'Membership', 'Officer', 'Payment'];
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v1';

const CATEGORY_BADGE: Record<ActionCategory, string> = {
  Accreditation: 'badge-blue',
  User: 'badge-yellow',
  Event: 'badge-gray',
  Membership: 'badge-green',
  Officer: 'badge-blue',
  Payment: 'badge-green',
};

const CATEGORY_DOT: Record<ActionCategory, string> = {
  Accreditation: 'var(--color-info)',
  User: 'var(--color-warning)',
  Event: 'var(--color-text-muted)',
  Membership: 'var(--color-success)',
  Officer: 'var(--color-info)',
  Payment: 'var(--color-success)',
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

export default function AdminAuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCat] = useState<ActionCategory | 'All'>('All');
  const [roleFilter, setRoleFilter] = useState<'All' | 'Overseer' | 'Officer'>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function loadAudit(showRefreshing = false) {
    const token = window.localStorage.getItem('auth_token') ?? window.sessionStorage.getItem('auth_token');
    if (!token) {
      setIsLoading(false);
      return;
    }
    if (showRefreshing) setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/audit`, {
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('fetch-failed');
      const payload = await res.json();
      const rows = Array.isArray(payload?.data) ? payload.data : [];
      setEntries(rows as AuditEntry[]);
    } catch {
      setEntries([]);
    } finally {
      setIsLoading(false);
      if (showRefreshing) setRefreshing(false);
    }
  }

  useEffect(() => {
    loadAudit(false);
  }, []);

  const filtered = useMemo(() => entries.filter((e) => {
    const q = search.toLowerCase();
    const matchSearch = !q || e.action.toLowerCase().includes(q) || e.actor_name.toLowerCase().includes(q) || e.target_label.toLowerCase().includes(q) || e.actor_school_id.includes(q);
    const matchCat = categoryFilter === 'All' || e.category === categoryFilter;
    const matchRole = roleFilter === 'All' || e.actor_role === roleFilter;
    return matchSearch && matchCat && matchRole;
  }), [entries, search, categoryFilter, roleFilter]);

  const hasActiveFilters = !!search || categoryFilter !== 'All' || roleFilter !== 'All';

  return (
    <AdminShell>
      <main className="flex flex-col gap-6 animate-fade-in">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-1">Admin</p>
          <h1 className="text-[22px] font-bold text-[var(--color-text)] leading-tight">Audit Log</h1>
          <p className="text-[14px] text-[var(--color-text-muted)] mt-1">Read-only record of all administrative interventions and state changes across the platform.</p>
        </div>

        <div className="flex gap-3 flex-wrap">
          {[
            { label: 'Total Entries', value: entries.length, color: 'var(--color-text)' },
            { label: 'Today', value: entries.filter((e) => e.timestamp?.slice(0, 10) === new Date().toISOString().slice(0, 10)).length, color: 'var(--color-primary-light)' },
            { label: 'Overseer Actions', value: entries.filter((e) => e.actor_role === 'Overseer').length, color: 'var(--color-info)' },
            { label: 'Officer Actions', value: entries.filter((e) => e.actor_role === 'Officer').length, color: 'var(--color-warning)' },
          ].map((s) => <div key={s.label} className="card flex items-center gap-3 px-4 py-3" style={{ boxShadow: 'none' }}><span className="text-xl font-bold" style={{ color: s.color }}>{s.value}</span><span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{s.label}</span></div>)}
        </div>

        <div className="card" style={{ boxShadow: 'none' }}>
          <div className="card-body py-3.5">
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center">
                <div className="input-icon-wrapper flex-1 min-w-[180px]">
                  <span className="input-icon-left"><IconSearch /></span>
                  <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by action, actor, or target..." className={`input-has-left-icon ${search ? 'input-has-right-icon' : ''}`} />
                  {search && <button type="button" onClick={() => setSearch('')} aria-label="Clear search" className="input-icon-right bg-transparent border-0 cursor-pointer transition-opacity hover:opacity-60" style={{ color: 'var(--color-text-muted)' }}><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg></button>}
                </div>
                <FilterSelect value={categoryFilter} defaultValue="All" onChange={(v) => setCat(v as ActionCategory | 'All')} options={[{ value: 'All', label: 'All Categories' }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]} className="sm:w-44" />
                <FilterSelect value={roleFilter} defaultValue="All" onChange={(v) => setRoleFilter(v as typeof roleFilter)} options={[{ value: 'All', label: 'All Roles' }, { value: 'Overseer', label: 'Overseer' }, { value: 'Officer', label: 'Officer' }]} className="sm:w-36" />
                {hasActiveFilters && <button type="button" onClick={() => { setSearch(''); setCat('All'); setRoleFilter('All'); }} className="btn btn-ghost btn-sm whitespace-nowrap self-start sm:self-auto" style={{ color: 'var(--color-error)' }}>Clear all</button>}
              </div>
              {hasActiveFilters && <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t" style={{ borderColor: 'var(--color-border)' }}><span className="text-[11px] font-medium mr-0.5" style={{ color: 'var(--color-text-muted)' }}>Filtering by:</span>{search && <FilterChip label={`"${search}"`} onRemove={() => setSearch('')} />}{categoryFilter !== 'All' && <FilterChip label={categoryFilter} onRemove={() => setCat('All')} />}{roleFilter !== 'All' && <FilterChip label={roleFilter} onRemove={() => setRoleFilter('All')} />}</div>}
            </div>
          </div>
        </div>

        <div className="card" style={{ boxShadow: 'none' }}>
          <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-[var(--color-text)]">Audit Entries</h2>
            <div className="flex items-center gap-2">
              <button className="btn btn-outline btn-sm whitespace-nowrap" disabled title="TODO: POST /api/admin/audit/export"><IconDownload />Export CSV</button>
              <button
                className="p-0 bg-transparent border-0 cursor-pointer inline-flex items-center justify-center text-[var(--color-primary)] hover:text-[var(--color-primary-light)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => loadAudit(true)}
                disabled={isLoading || refreshing}
                aria-label="Refresh audit"
                title="Refresh audit"
              >
                <IconRefresh spinning={refreshing} />
              </button>
            </div>
          </div>
          <div className="px-5 py-3 border-b border-[var(--color-border)] text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Showing <strong>{filtered.length}</strong> of <strong>{entries.length}</strong> entries
          </div>
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="py-16 text-center"><p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Loading audit entries...</p></div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center"><p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No audit entries match your filters.</p></div>
            ) : (
              <table className="table-base w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-border)]"><th className="py-3 px-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider" style={{ width: '180px' }}>Timestamp</th><th className="py-3 px-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Actor</th><th className="py-3 px-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Category</th><th className="py-3 px-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Action</th><th className="py-3 px-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Target</th><th className="py-3 px-4" style={{ width: '44px' }}></th></tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {filtered.map((entry) => (
                    <Fragment key={entry.id}>
                      <tr className="hover:bg-[var(--color-surface-2)] transition-colors" style={{ cursor: entry.meta ? 'pointer' : 'default' }} onClick={() => entry.meta && setExpandedId(expandedId === entry.id ? null : entry.id)}>
                        <td className="py-3 px-4"><div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: CATEGORY_DOT[entry.category] }} /><span className="text-xs font-mono" style={{ color: 'var(--color-text-secondary)' }}>{fmtDate(entry.timestamp)}</span></div></td>
                        <td className="py-3 px-4"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold" style={{ background: entry.actor_role === 'Overseer' ? 'rgba(26,115,232,.1)' : 'var(--color-primary-muted)', color: entry.actor_role === 'Overseer' ? 'var(--color-info)' : 'var(--color-primary)' }}>{entry.actor_name.split(' ').map((n) => n[0]).slice(0, 2).join('')}</div><div><p className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>{entry.actor_name}</p><p className="text-[10px] font-mono" style={{ color: 'var(--color-text-muted)' }}>{entry.actor_school_id}</p></div></div></td>
                        <td className="py-3 px-4"><span className={`badge ${CATEGORY_BADGE[entry.category]}`}>{entry.category}</span></td>
                        <td className="py-3 px-4 text-sm font-medium" style={{ color: 'var(--color-text)' }}>{entry.action}</td>
                        <td className="py-3 px-4 text-xs" style={{ color: 'var(--color-text-secondary)', maxWidth: '200px' }}><span className="truncate block">{entry.target_label}</span><span className="font-mono text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{entry.target_id}</span></td>
                        <td className="py-3 px-4 text-right">{entry.meta && <button className="btn btn-ghost btn-sm" style={{ padding: '4px', color: 'var(--color-text-muted)' }} aria-label="Expand details"><svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5" style={{ transform: expandedId === entry.id ? 'rotate(180deg)' : 'none', transition: 'transform 200ms ease' }}><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></button>}</td>
                      </tr>
                      {expandedId === entry.id && entry.meta && <tr style={{ background: 'var(--color-surface-2)' }}><td colSpan={6} style={{ padding: '12px 20px', borderTop: '1px dashed var(--color-border)' }}><div className="flex items-start gap-2"><span className="text-xs font-semibold mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Detail:</span><code className="text-xs px-2 py-1 rounded font-mono break-all" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>{entry.meta}</code></div></td></tr>}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </AdminShell>
  );
}

function IconSearch() {
  return <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none"><circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.75" /><path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" /></svg>;
}

function IconDownload() {
  return <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none"><path d="M10 3v10M6 9l4 4 4-4M4 16h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

