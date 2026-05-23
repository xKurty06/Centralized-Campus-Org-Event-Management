'use client';

import { useState, useEffect, useMemo } from 'react';
import { LoaderCircle, RefreshCw } from 'lucide-react';
import AdminShell from '@/components/AdminShell';
import { FilterSelect, FilterChip } from '@/components/ui/filter';

type GlobalRole = 'User' | 'Overseer';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v1';

interface User {
    id: string;
    schoolId: string;
    email: string;
    firstName: string;
    lastName: string;
    dept: string;
    course: string;
    yearLevel: number;
    section: number;
    globalRole: GlobalRole;
    isActive: boolean;
    orgRoles?: string[];
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState<'All' | GlobalRole>('All');
    const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Deactivated'>('All');
    const [filterDept, setFilterDept] = useState('All');
    const [confirmToggle, setConfirmToggle] = useState<User | null>(null);
    const [deactivateReason, setDeactivateReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState('');
    const [roleChangePending, setRoleChangePending] = useState<{ user: User; newRole: GlobalRole } | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    async function loadUsers(showRefreshing = false) {
        const token = window.localStorage.getItem('auth_token') ?? window.sessionStorage.getItem('auth_token');
        if (!token) {
            setIsLoading(false);
            return;
        }
        if (showRefreshing) setRefreshing(true);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/users?per_page=200`, {
                headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
            });
            if (res.status === 401 || res.status === 403) {
                window.localStorage.removeItem('auth_token');
                window.localStorage.removeItem('auth_user');
                window.sessionStorage.removeItem('auth_token');
                window.sessionStorage.removeItem('auth_user');
                setLoadError('Session expired. Please sign in again.');
                setUsers([]);
                return;
            }
            if (!res.ok) {
                setLoadError('Unable to load users right now.');
                setUsers([]);
                return;
            }
            const payload = await res.json();
            const rows = Array.isArray(payload?.data) ? payload.data : [];
            setUsers(rows.map((u: any) => ({
                id: String(u.id ?? ''),
                schoolId: String(u.school_id ?? ''),
                email: String(u.email ?? ''),
                firstName: String(u.first_name ?? ''),
                lastName: String(u.last_name ?? ''),
                dept: String(u.dept_code ?? u.dept_id ?? 'N/A'),
                course: String(u.course_code ?? u.course_id ?? 'N/A'),
                yearLevel: Number(u.year_level ?? 0),
                section: Number(u.section ?? 0),
                globalRole: (u.global_role === 'Overseer' ? 'Overseer' : 'User') as GlobalRole,
                isActive: Boolean(u.is_active),
                orgRoles: Array.isArray(u.org_roles) ? u.org_roles : [],
            })));
            setLoadError('');
        } catch {
            setLoadError('Unable to load users right now.');
            setUsers([]);
        } finally {
            setIsLoading(false);
            if (showRefreshing) setRefreshing(false);
        }
    }

    useEffect(() => {
        const shouldLock = !!confirmToggle || !!roleChangePending;
        const prev = document.body.style.overflow;
        if (shouldLock) document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [confirmToggle, roleChangePending]);

    useEffect(() => {
        loadUsers(false);
    }, []);

    const departments = useMemo(() => ['All', ...[...new Set(users.map((u) => u.dept))].sort()], [users]);

    const filtered = useMemo(() => users.filter((u) => {
        const q = search.toLowerCase();
        const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
        const matchSearch = fullName.includes(q) || u.schoolId.includes(q) || u.email.toLowerCase().includes(q);
        const matchRole = filterRole === 'All' || u.globalRole === filterRole;
        const matchStatus = filterStatus === 'All' || (filterStatus === 'Active' ? u.isActive : !u.isActive);
        const matchDept = filterDept === 'All' || u.dept === filterDept;
        return matchSearch && matchRole && matchStatus && matchDept;
    }), [users, search, filterRole, filterStatus, filterDept]);

    const stats = useMemo(() => ({
        total: users.length,
        active: users.filter((u) => u.isActive).length,
        deactivated: users.filter((u) => !u.isActive).length,
        overseers: users.filter((u) => u.globalRole === 'Overseer').length,
    }), [users]);

    async function handleToggleActive() {
        if (!confirmToggle) return;
        if (confirmToggle.isActive && !deactivateReason.trim()) return;
        const token = window.localStorage.getItem('auth_token') ?? window.sessionStorage.getItem('auth_token');
        if (!token) {
            setActionError('You are not authenticated. Please sign in again.');
            return;
        }
        setActionLoading(true);
        setActionError('');
        try {
            const endpoint = confirmToggle.isActive ? 'deactivate' : 'reactivate';
            const res = await fetch(`${API_BASE_URL}/admin/users/${confirmToggle.id}/${endpoint}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(confirmToggle.isActive ? { reason: deactivateReason.trim() } : {}),
            });
            if (!res.ok) {
                const payload = await res.json().catch(() => null);
                setActionError(payload?.error ?? 'Unable to update user status.');
                return;
            }
            setUsers((prev) => prev.map((u) => u.id === confirmToggle.id ? { ...u, isActive: !u.isActive } : u));
            setConfirmToggle(null);
            setDeactivateReason('');
        } catch {
            setActionError('Network error. Please try again.');
        } finally {
            setActionLoading(false);
        }
    }

    function closeToggleModal() {
        setConfirmToggle(null);
        setDeactivateReason('');
        setActionError('');
        setActionLoading(false);
    }

    async function handleRoleChange() {
        if (!roleChangePending) return;
        const token = window.localStorage.getItem('auth_token') ?? window.sessionStorage.getItem('auth_token');
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/admin/users/${roleChangePending.user.id}/role`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ global_role: roleChangePending.newRole }),
        });
        if (!res.ok) return;
        setUsers((prev) => prev.map((u) => u.id === roleChangePending.user.id ? { ...u, globalRole: roleChangePending.newRole } : u));
        setRoleChangePending(null);
    }

    const hasActiveFilters = !!search || filterRole !== 'All' || filterStatus !== 'All' || filterDept !== 'All';

    return (
        <AdminShell>
            <main className="flex flex-col gap-6 animate-fade-in">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--color-text-muted)' }}>Admin</p>
                    <h1 className="text-[22px] font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>Users</h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>Manage all registered accounts: roles, status, and identity data.</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Total Users" value={stats.total} color="blue" />
                    <StatCard label="Active" value={stats.active} color="green" />
                    <StatCard label="Deactivated" value={stats.deactivated} color="red" />
                    <StatCard label="Overseers" value={stats.overseers} color="yellow" />
                </div>

                {!!loadError && <div className="rounded-lg px-4 py-3 text-sm" style={{ background: 'var(--color-error-light)', color: 'var(--color-error)' }}>{loadError}</div>}

                <div className="rounded-lg px-4 py-3 flex items-start gap-3 text-sm" style={{ background: '#fffbeb', border: '1px solid #f0a500', color: '#92610a' }}>
                    <span className="text-base mt-0.5">!</span>
                    <div><strong>Global Role changes are permanent and powerful.</strong> Granting Overseer access gives full administrative control over all organizations, events, and user accounts.</div>
                </div>

                <div className="card" style={{ boxShadow: 'none' }}>
                    <div className="card-body py-3.5">
                        <div className="flex flex-col gap-2.5">
                            <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center">
                                <div className="input-icon-wrapper flex-1">
                                    <span className="input-icon-left"><IconSearch /></span>
                                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, student ID, or email..." className={`input-has-left-icon ${search ? 'input-has-right-icon' : ''}`} />
                                    {search && <button type="button" onClick={() => setSearch('')} aria-label="Clear search" className="input-icon-right bg-transparent border-0 cursor-pointer transition-opacity hover:opacity-60" style={{ color: 'var(--color-text-muted)' }}><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg></button>}
                                </div>
                                <FilterSelect value={filterRole} defaultValue="All" onChange={(v) => setFilterRole(v as typeof filterRole)} options={[{ value: 'All', label: 'All Roles' }, { value: 'User', label: 'User' }, { value: 'Overseer', label: 'Overseer' }]} className="sm:w-36" />
                                <FilterSelect value={filterStatus} defaultValue="All" onChange={(v) => setFilterStatus(v as typeof filterStatus)} options={[{ value: 'All', label: 'All Status' }, { value: 'Active', label: 'Active' }, { value: 'Deactivated', label: 'Deactivated' }]} className="sm:w-40" />
                                <FilterSelect value={filterDept} defaultValue="All" onChange={(v) => setFilterDept(v)} options={departments.map((d) => ({ value: d, label: d === 'All' ? 'All Depts' : d }))} className="sm:w-40" />
                                {hasActiveFilters && <button type="button" onClick={() => { setSearch(''); setFilterRole('All'); setFilterStatus('All'); setFilterDept('All'); }} className="btn btn-ghost btn-sm whitespace-nowrap self-start sm:self-auto" style={{ color: 'var(--color-error)' }}>Clear all</button>}
                            </div>
                            {hasActiveFilters && <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t" style={{ borderColor: 'var(--color-border)' }}><span className="text-[11px] font-medium mr-0.5" style={{ color: 'var(--color-text-muted)' }}>Filtering by:</span>{search && <FilterChip label={`"${search}"`} onRemove={() => setSearch('')} />}{filterRole !== 'All' && <FilterChip label={filterRole} onRemove={() => setFilterRole('All')} />}{filterStatus !== 'All' && <FilterChip label={filterStatus} onRemove={() => setFilterStatus('All')} />}{filterDept !== 'All' && <FilterChip label={filterDept} onRemove={() => setFilterDept('All')} />}</div>}
                        </div>
                    </div>
                </div>

                <div className="card" style={{ boxShadow: 'none' }}>
                    <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
                        <h2 className="text-[15px] font-semibold text-[var(--color-text)]">Users Table</h2>
                        <button
                            className="p-0 bg-transparent border-0 cursor-pointer inline-flex items-center justify-center text-[var(--color-primary)] hover:text-[var(--color-primary-light)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => loadUsers(true)}
                            disabled={refreshing || isLoading}
                            aria-label="Refresh users"
                            title="Refresh users"
                        >
                            <IconRefresh spinning={refreshing} />
                        </button>
                    </div>
                    <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--color-border)]">
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Showing {filtered.length} of {users.length} users</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="table-base">
                            <thead><tr><th>Name</th><th>Student ID</th><th>Dept</th><th>Course</th><th>Yr / Sec</th><th>Org Roles</th><th>Global Role</th><th>Status</th><th>Actions</th></tr></thead>
                            <tbody>
                                {isLoading ? <tr><td colSpan={9} className="text-center py-12 text-sm" style={{ color: 'var(--color-text-muted)' }}>Loading users...</td></tr> :
                                    filtered.length === 0 ? <tr><td colSpan={9} className="text-center py-12 text-sm" style={{ color: 'var(--color-text-muted)' }}>No users match your filters.</td></tr> :
                                        filtered.map((user) => (
                                            <tr key={user.id}><td><div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold" style={{ background: user.globalRole === 'Overseer' ? '#fef3c7' : 'var(--color-primary-muted)', color: user.globalRole === 'Overseer' ? '#92610a' : 'var(--color-primary)' }}>{(user.firstName[0] + user.lastName[0]).toUpperCase()}</div><div><p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{user.firstName} {user.lastName}</p><p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{user.email}</p></div></div></td><td className="text-sm font-mono" style={{ color: 'var(--color-text-secondary)' }}>{user.schoolId}</td><td className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{user.dept}</td><td className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{user.course}</td><td className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{user.yearLevel > 0 ? `${user.yearLevel} - ${user.section}` : '-'}</td><td>{user.orgRoles && user.orgRoles.length > 0 ? <div className="flex flex-col gap-0.5">{user.orgRoles.map((r) => <span key={r} className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{r}</span>)}</div> : <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>-</span>}</td><td><div className="flex items-center gap-1.5">{user.globalRole === 'Overseer' && <span className="text-amber-500 text-xs" title="Overseer">*</span>}<select value={user.globalRole} onChange={(e) => { const newRole = e.target.value as GlobalRole; if (newRole !== user.globalRole) setRoleChangePending({ user, newRole }); }} className="text-xs rounded-md" style={{ width: 'auto', padding: '4px 8px', border: user.globalRole === 'Overseer' ? '1.5px solid #f0a500' : '1.5px solid var(--color-border)', background: user.globalRole === 'Overseer' ? '#fffbeb' : 'white', color: user.globalRole === 'Overseer' ? '#92610a' : 'var(--color-text)', fontWeight: user.globalRole === 'Overseer' ? '600' : '400' }}><option value="User">User</option><option value="Overseer">Overseer</option></select></div></td><td><span className={`badge ${user.isActive ? 'badge-green' : 'badge-red'}`}>{user.isActive ? 'Active' : 'Deactivated'}</span></td><td><button className={`btn btn-sm ${user.isActive ? 'btn-danger' : 'btn-outline'}`} onClick={() => setConfirmToggle(user)}>{user.isActive ? 'Deactivate' : 'Reactivate'}</button></td></tr>
                                        ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {confirmToggle && <Modal title={confirmToggle.isActive ? 'Deactivate Account?' : 'Reactivate Account?'} onClose={closeToggleModal} danger={confirmToggle.isActive}><div className="flex flex-col gap-4"><p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>User: <strong>{confirmToggle.firstName} {confirmToggle.lastName}</strong> ({confirmToggle.schoolId})</p><p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{confirmToggle.isActive ? 'This will block the user from logging in. All records are preserved.' : "This will restore the user's access to the platform."}</p>{confirmToggle.isActive && <div className="flex flex-col gap-1.5 pt-2"><label className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Reason for deactivation <span style={{ color: 'var(--color-error)' }}>*</span></label><textarea value={deactivateReason} onChange={(e) => setDeactivateReason(e.target.value)} placeholder="Briefly explain why this account is being deactivated..." className="w-full rounded-md p-3 text-sm border focus:outline-none resize-none" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-secondary, #f9fafb)', color: 'var(--color-text)' }} rows={3} required /></div>}{!!actionError && <p className="text-sm" style={{ color: 'var(--color-error)' }}>{actionError}</p>}<div className="flex gap-3 justify-end mt-2"><button className="btn btn-ghost" onClick={closeToggleModal} disabled={actionLoading}>Cancel</button><button className={`btn ${confirmToggle.isActive ? 'btn-danger' : 'btn-primary'}`} onClick={handleToggleActive} disabled={(confirmToggle.isActive && !deactivateReason.trim()) || actionLoading}>{actionLoading ? 'Processing...' : (confirmToggle.isActive ? 'Yes, Deactivate' : 'Yes, Reactivate')}</button></div></div></Modal>}

            {roleChangePending && <Modal title={roleChangePending.newRole === 'Overseer' ? 'Grant Overseer Access?' : 'Revoke Overseer Access?'} onClose={() => setRoleChangePending(null)} danger><div className="flex flex-col gap-4"><p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Apply role change to <strong>{roleChangePending.user.firstName} {roleChangePending.user.lastName}</strong> ({roleChangePending.user.schoolId}).</p><div className="flex gap-3 justify-end"><button className="btn btn-ghost" onClick={() => setRoleChangePending(null)}>Cancel</button><button className="btn btn-danger" onClick={handleRoleChange}>{roleChangePending.newRole === 'Overseer' ? 'Yes, Grant Overseer' : 'Yes, Revoke Access'}</button></div></div></Modal>}
        </AdminShell>
    );
}

const STAT_COLORS = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', num: 'text-blue-700' },
    green: { bg: 'bg-[var(--color-primary-muted)]', text: 'text-[var(--color-primary)]', num: 'text-[var(--color-primary)]' },
    red: { bg: 'bg-[var(--color-error-light)]', text: 'text-[var(--color-error)]', num: 'text-[var(--color-error)]' },
    yellow: { bg: 'bg-amber-50', text: 'text-amber-700', num: 'text-amber-700' },
};

function StatCard({ label, value, color }: { label: string; value: number; color: keyof typeof STAT_COLORS }) {
    const c = STAT_COLORS[color];
    return <div className={`card ${c.bg} border-0`}><div className="card-body py-4"><p className={`text-2xl font-bold ${c.num}`}>{value}</p><p className={`text-xs font-medium mt-0.5 ${c.text}`}>{label}</p></div></div>;
}

function Modal({ title, children, onClose, danger = false }: { title: string; children: React.ReactNode; onClose: () => void; danger?: boolean }) {
    return <><div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} /><div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"><div className="bg-white rounded-xl shadow-xl w-full max-w-md pointer-events-auto animate-fade-in"><div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: danger ? 'var(--color-error)' : 'var(--color-border)' }}><h3 className="text-base font-semibold" style={{ color: danger ? 'var(--color-error)' : 'var(--color-text)' }}>{title}</h3><button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: '4px' }}><svg viewBox="0 0 20 20" fill="none" className="w-4 h-4"><path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" /></svg></button></div><div className="px-6 py-5">{children}</div></div></div></>;
}

function IconSearch() {
    return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none"><path d="M9 17A8 8 0 109 1a8 8 0 000 16zM19 19l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>;
}

function IconRefresh({ spinning = false }: { spinning?: boolean }) {
    if (spinning) {
        return <LoaderCircle className="w-4 h-4" style={{ animation: 'spin 0.8s linear infinite' }} aria-hidden="true" />;
    }
    return <RefreshCw className="w-4 h-4" aria-hidden="true" />;
}

