'use client';

import { useState, useMemo } from 'react';
import AdminShell from '@/components/AdminShell';
import { FilterSelect, FilterChip } from '@/components/ui/filter';

/* ----------------------------------------------------------------
   Types — mirrors Users table exactly
   ---------------------------------------------------------------- */
type GlobalRole = 'User' | 'Overseer';

interface User {
    id: string;
    schoolId: string;         // school_id
    email: string;
    firstName: string;        // first_name
    lastName: string;         // last_name
    dept: string;             // dept_id → dept code
    course: string;           // course_id → course_code
    yearLevel: number;        // year_level (0 = staff/admin, no year)
    section: number;          // section (0 = N/A)
    globalRole: GlobalRole;   // global_role
    isActive: boolean;        // is_active
    orgRoles?: string[];      // derived from Org_Officers (display only)
}

/* ----------------------------------------------------------------
   Placeholder Data
   ---------------------------------------------------------------- */
const USERS: User[] = [
    { id: 'u-1', schoolId: '202201045', email: 'j.delacruz@cvsu.edu.ph', firstName: 'Juan', lastName: 'Dela Cruz', dept: 'CEIT', course: 'BSCS', yearLevel: 3, section: 2, globalRole: 'User', isActive: true, orgRoles: ['President @ CSS'] },
    { id: 'u-2', schoolId: '202201078', email: 'm.reyes@cvsu.edu.ph', firstName: 'Maria', lastName: 'Reyes', dept: 'CEIT', course: 'BSCS', yearLevel: 3, section: 1, globalRole: 'User', isActive: true, orgRoles: ['VP @ CSS'] },
    { id: 'u-3', schoolId: '202301112', email: 'c.mendoza@cvsu.edu.ph', firstName: 'Carlo', lastName: 'Mendoza', dept: 'CEIT', course: 'BSIT', yearLevel: 2, section: 3, globalRole: 'User', isActive: true, orgRoles: ['Secretary @ CSS'] },
    { id: 'u-4', schoolId: '202301134', email: 'a.villanueva@cvsu.edu.ph', firstName: 'Ana', lastName: 'Villanueva', dept: 'CEIT', course: 'BSIT', yearLevel: 2, section: 1, globalRole: 'User', isActive: true },
    { id: 'u-5', schoolId: '202101023', email: 'p.santos@cvsu.edu.ph', firstName: 'Paolo', lastName: 'Santos', dept: 'CEIT', course: 'BSCpE', yearLevel: 4, section: 2, globalRole: 'User', isActive: false },
    { id: 'u-6', schoolId: '202401067', email: 'l.castro@cvsu.edu.ph', firstName: 'Lara', lastName: 'Castro', dept: 'CAS', course: 'BSBA', yearLevel: 1, section: 1, globalRole: 'User', isActive: true },
    { id: 'u-7', schoolId: '20220200089', email: 'm.torres@cvsu.edu.ph', firstName: 'Miguel', lastName: 'Torres', dept: 'CAS', course: 'BSBA', yearLevel: 3, section: 2, globalRole: 'User', isActive: true, orgRoles: ['President @ SPECS'] },
    { id: 'u-8', schoolId: '20230200045', email: 's.navarro@cvsu.edu.ph', firstName: 'Sofia', lastName: 'Navarro', dept: 'CON', course: 'BSN', yearLevel: 2, section: 1, globalRole: 'User', isActive: true },
    { id: 'u-9', schoolId: '00000000001', email: 'j.doe@cvsu.edu.ph', firstName: 'John', lastName: 'Doe', dept: 'OSA', course: '—', yearLevel: 0, section: 0, globalRole: 'Overseer', isActive: true },
    { id: 'u-10', schoolId: '00000000002', email: 'j.smith@cvsu.edu.ph', firstName: 'Jane', lastName: 'Smith', dept: 'OSA', course: '—', yearLevel: 0, section: 0, globalRole: 'Overseer', isActive: true },
    { id: 'u-11', schoolId: '20210100099', email: 'r.pangilinan@cvsu.edu.ph', firstName: 'Rico', lastName: 'Pangilinan', dept: 'COE', course: 'BSCE', yearLevel: 4, section: 3, globalRole: 'User', isActive: false },
    { id: 'u-12', schoolId: '20240200033', email: 't.ocampo@cvsu.edu.ph', firstName: 'Tricia', lastName: 'Ocampo', dept: 'CBA', course: 'BSAc', yearLevel: 1, section: 2, globalRole: 'User', isActive: true },
];

/* ----------------------------------------------------------------
   Page
   ---------------------------------------------------------------- */
export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>(USERS);
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState<'All' | GlobalRole>('All');
    const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Deactivated'>('All');
    const [filterDept, setFilterDept] = useState('All');

    // ── Deactivate / Reactivate confirm
    const [confirmToggle, setConfirmToggle] = useState<User | null>(null);

    // ── Role change: dangerous confirm modal
    const [roleChangePending, setRoleChangePending] = useState<{ user: User; newRole: GlobalRole } | null>(null);

    const departments = useMemo(() => {
        const depts = [...new Set(USERS.map((u) => u.dept))].sort();
        return ['All', ...depts];
    }, []);

    const filtered = useMemo(() => {
        return users.filter((u) => {
            const q = search.toLowerCase();
            const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
            const matchSearch = fullName.includes(q) || u.schoolId.includes(q) || u.email.toLowerCase().includes(q);
            const matchRole = filterRole === 'All' || u.globalRole === filterRole;
            const matchStatus = filterStatus === 'All' || (filterStatus === 'Active' ? u.isActive : !u.isActive);
            const matchDept = filterDept === 'All' || u.dept === filterDept;
            return matchSearch && matchRole && matchStatus && matchDept;
        });
    }, [users, search, filterRole, filterStatus, filterDept]);

    const stats = useMemo(() => ({
        total: users.length,
        active: users.filter((u) => u.isActive).length,
        deactivated: users.filter((u) => !u.isActive).length,
        overseers: users.filter((u) => u.globalRole === 'Overseer').length,
    }), [users]);

    /* ── Handlers ── */
    function handleToggleActive() {
        if (!confirmToggle) return;
        setUsers((prev) => prev.map((u) => u.id === confirmToggle.id ? { ...u, isActive: !u.isActive } : u));
        setConfirmToggle(null);
        // API: PATCH /api/admin/users/:id { is_active }
    }

    function handleRoleChange() {
        if (!roleChangePending) return;
        setUsers((prev) => prev.map((u) => u.id === roleChangePending.user.id ? { ...u, globalRole: roleChangePending.newRole } : u));
        setRoleChangePending(null);
        // API: PATCH /api/admin/users/:id { global_role }
    }
    const hasActiveFilters = !!search || filterRole !== 'All' || filterStatus !== 'All' || filterDept !== 'All';

    return (
        <AdminShell>
            <main className="flex flex-col gap-6 animate-fade-in">

                {/* ── Page Header ── */}
                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--color-text-muted)' }}>
                        Admin
                    </p>
                    <h1 className="text-[22px] font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>Users</h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                        Manage all registered accounts — roles, status, and identity data.
                    </p>
                </div>

                {/* ── Stat Cards ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Total Users" value={stats.total} color="blue" />
                    <StatCard label="Active" value={stats.active} color="green" />
                    <StatCard label="Deactivated" value={stats.deactivated} color="red" />
                    <StatCard label="Overseers" value={stats.overseers} color="yellow" />
                </div>

                {/* ── Overseer Warning Banner ── */}
                <div
                    className="rounded-lg px-4 py-3 flex items-start gap-3 text-sm"
                    style={{ background: '#fffbeb', border: '1px solid #f0a500', color: '#92610a' }}
                >
                    <span className="text-base mt-0.5">⚠</span>
                    <div>
                        <strong>Global Role changes are permanent and powerful.</strong> Granting Overseer access gives full administrative control over all organizations, events, and user accounts on the platform. A confirmation prompt will appear before any role change is applied.
                    </div>
                </div>

                {/* ── Filters ── */}
                {/* ── Filters ─────────────────────────────────────────────── */}
                <div className="card">
                    <div className="card-body py-3.5">
                        <div className="flex flex-col gap-2.5">

                            {/* Controls row */}
                            <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center">

                                {/* Search */}
                                <div className="input-icon-wrapper flex-1">
                                    <span className="input-icon-left"><IconSearch /></span>
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search by name, school ID, or email…"
                                        className={`input-has-left-icon ${search ? 'input-has-right-icon' : ''}`}
                                    />
                                    {search && (
                                        <button
                                            type="button"
                                            onClick={() => setSearch('')}
                                            aria-label="Clear search"
                                            className="input-icon-right bg-transparent border-0 cursor-pointer transition-opacity hover:opacity-60"
                                            style={{ color: 'var(--color-text-muted)' }}
                                        >
                                            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                                                <path d="M2 2l9 9M11 2L2 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                            </svg>
                                        </button>
                                    )}
                                </div>

                                <FilterSelect
                                    value={filterRole}
                                    defaultValue="All"
                                    onChange={(v) => setFilterRole(v as typeof filterRole)}
                                    options={[
                                        { value: 'All', label: 'All Roles' },
                                        { value: 'User', label: 'User' },
                                        { value: 'Overseer', label: 'Overseer' },
                                    ]}
                                    className="sm:w-36"
                                />

                                <FilterSelect
                                    value={filterStatus}
                                    defaultValue="All"
                                    onChange={(v) => setFilterStatus(v as typeof filterStatus)}
                                    options={[
                                        { value: 'All', label: 'All Status' },
                                        { value: 'Active', label: 'Active' },
                                        { value: 'Deactivated', label: 'Deactivated' },
                                    ]}
                                    className="sm:w-40"
                                />

                                <FilterSelect
                                    value={filterDept}
                                    defaultValue="All"
                                    onChange={(v) => setFilterDept(v)}
                                    options={departments.map((d) => ({ value: d, label: d === 'All' ? 'All Depts' : d }))}
                                    className="sm:w-40"
                                />

                                {hasActiveFilters && (
                                    <button
                                        type="button"
                                        onClick={() => { setSearch(''); setFilterRole('All'); setFilterStatus('All'); setFilterDept('All'); }}
                                        className="btn btn-ghost btn-sm whitespace-nowrap self-start sm:self-auto"
                                        style={{ color: 'var(--color-error)' }}
                                    >
                                        Clear all
                                    </button>
                                )}
                            </div>

                            {/* Active filter chips */}
                            {hasActiveFilters && (
                                <div
                                    className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t"
                                    style={{ borderColor: 'var(--color-border)' }}
                                >
                                    <span className="text-[11px] font-medium mr-0.5" style={{ color: 'var(--color-text-muted)' }}>
                                        Filtering by:
                                    </span>
                                    {search && <FilterChip label={`"${search}"`} onRemove={() => setSearch('')} />}
                                    {filterRole !== 'All' && <FilterChip label={filterRole} onRemove={() => setFilterRole('All')} />}
                                    {filterStatus !== 'All' && <FilterChip label={filterStatus} onRemove={() => setFilterStatus('All')} />}
                                    {filterDept !== 'All' && <FilterChip label={filterDept} onRemove={() => setFilterDept('All')} />}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Table ── */}
                <div className="card overflow-x-auto">
                    <table className="table-base">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>School ID</th>
                                <th>Dept</th>
                                <th>Course</th>
                                <th>Yr / Sec</th>
                                <th>Org Roles</th>
                                <th>Global Role</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-12 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                                        No users match your filters.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((user) => (
                                    <tr key={user.id}>
                                        {/* Name + email */}
                                        <td>
                                            <div className="flex items-center gap-2.5">
                                                <div
                                                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                                                    style={{ background: user.globalRole === 'Overseer' ? '#fef3c7' : 'var(--color-primary-muted)', color: user.globalRole === 'Overseer' ? '#92610a' : 'var(--color-primary)' }}
                                                >
                                                    {(user.firstName[0] + user.lastName[0]).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                                                        {user.firstName} {user.lastName}
                                                    </p>
                                                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{user.email}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* School ID */}
                                        <td className="text-sm font-mono" style={{ color: 'var(--color-text-secondary)' }}>
                                            {user.schoolId}
                                        </td>

                                        {/* Dept */}
                                        <td className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{user.dept}</td>

                                        {/* Course */}
                                        <td className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{user.course}</td>

                                        {/* Year / Section */}
                                        <td className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                                            {user.yearLevel > 0 ? `Y${user.yearLevel} / S${user.section}` : '—'}
                                        </td>

                                        {/* Org Roles */}
                                        <td>
                                            {user.orgRoles && user.orgRoles.length > 0 ? (
                                                <div className="flex flex-col gap-0.5">
                                                    {user.orgRoles.map((r) => (
                                                        <span key={r} className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{r}</span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>—</span>
                                            )}
                                        </td>

                                        {/* Global Role — select triggers confirm modal */}
                                        <td>
                                            <div className="flex items-center gap-1.5">
                                                {user.globalRole === 'Overseer' && (
                                                    <span className="text-amber-500 text-xs" title="Overseer">⚑</span>
                                                )}
                                                <select
                                                    value={user.globalRole}
                                                    onChange={(e) => {
                                                        const newRole = e.target.value as GlobalRole;
                                                        if (newRole !== user.globalRole) {
                                                            setRoleChangePending({ user, newRole });
                                                        }
                                                    }}
                                                    className="text-xs rounded-md"
                                                    style={{
                                                        width: 'auto',
                                                        padding: '4px 8px',
                                                        border: user.globalRole === 'Overseer' ? '1.5px solid #f0a500' : '1.5px solid var(--color-border)',
                                                        background: user.globalRole === 'Overseer' ? '#fffbeb' : 'white',
                                                        color: user.globalRole === 'Overseer' ? '#92610a' : 'var(--color-text)',
                                                        fontWeight: user.globalRole === 'Overseer' ? '600' : '400',
                                                    }}
                                                >
                                                    <option value="User">User</option>
                                                    <option value="Overseer">Overseer</option>
                                                </select>
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td>
                                            <span className={`badge ${user.isActive ? 'badge-green' : 'badge-red'}`}>
                                                {user.isActive ? 'Active' : 'Deactivated'}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td>
                                            <button
                                                className={`btn btn-sm ${user.isActive ? 'btn-danger' : 'btn-outline'}`}
                                                onClick={() => setConfirmToggle(user)}
                                            >
                                                {user.isActive ? 'Deactivate' : 'Reactivate'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Table footer */}
                    <div className="px-4 py-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--color-border)' }}>
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            Showing {filtered.length} of {users.length} users
                        </p>
                        <div className="flex items-center gap-1">
                            <button className="btn btn-ghost btn-sm" disabled>← Prev</button>
                            <span
                                className="text-xs px-3 py-1.5 rounded-md font-semibold"
                                style={{ background: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}
                            >
                                1
                            </span>
                            <button className="btn btn-ghost btn-sm" disabled>Next →</button>
                        </div>
                    </div>
                </div>
            </main>

            {/* ================================================================
                MODAL: Deactivate / Reactivate Confirm
            ================================================================ */}
            {confirmToggle && (
                <Modal
                    title={confirmToggle.isActive ? 'Deactivate Account?' : 'Reactivate Account?'}
                    onClose={() => setConfirmToggle(null)}
                    danger={confirmToggle.isActive}
                >
                    <div className="flex flex-col gap-4">
                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            User: <strong>{confirmToggle.firstName} {confirmToggle.lastName}</strong> ({confirmToggle.schoolId})
                        </p>
                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            {confirmToggle.isActive
                                ? 'This will block the user from logging in. All records, registrations, and officer assignments are preserved and never deleted.'
                                : "This will restore the user's access to the platform."
                            }
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button className="btn btn-ghost" onClick={() => setConfirmToggle(null)}>Cancel</button>
                            <button
                                className={`btn ${confirmToggle.isActive ? 'btn-danger' : 'btn-primary'}`}
                                onClick={handleToggleActive}
                            >
                                {confirmToggle.isActive ? 'Yes, Deactivate' : 'Yes, Reactivate'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ================================================================
                MODAL: Global Role Change — DANGEROUS confirm
            ================================================================ */}
            {roleChangePending && (
                <Modal
                    title={roleChangePending.newRole === 'Overseer' ? '⚠ Grant Overseer Access?' : 'Revoke Overseer Access?'}
                    onClose={() => setRoleChangePending(null)}
                    danger
                >
                    <div className="flex flex-col gap-4">
                        {roleChangePending.newRole === 'Overseer' ? (
                            <>
                                <div
                                    className="rounded-lg p-4 text-sm"
                                    style={{ background: 'var(--color-error-light)', color: 'var(--color-error)' }}
                                >
                                    <strong>This is a high-privilege action.</strong> Overseer access grants full administrative control: managing all organizations, toggling accreditation, deactivating any user account, and moderating all events across the platform.
                                </div>
                                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                                    You are granting Overseer access to{' '}
                                    <strong>{roleChangePending.user.firstName} {roleChangePending.user.lastName}</strong>{' '}
                                    ({roleChangePending.user.schoolId}). This change will be logged in the audit trail.
                                </p>
                                <p className="text-sm font-medium" style={{ color: 'var(--color-error)' }}>
                                    Are you absolutely sure?
                                </p>
                            </>
                        ) : (
                            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                                You are revoking Overseer access from{' '}
                                <strong>{roleChangePending.user.firstName} {roleChangePending.user.lastName}</strong>{' '}
                                ({roleChangePending.user.schoolId}). They will be demoted to a regular User. This change will be logged.
                            </p>
                        )}
                        <div className="flex gap-3 justify-end">
                            <button className="btn btn-ghost" onClick={() => setRoleChangePending(null)}>Cancel</button>
                            <button className="btn btn-danger" onClick={handleRoleChange}>
                                {roleChangePending.newRole === 'Overseer' ? 'Yes, Grant Overseer' : 'Yes, Revoke Access'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </AdminShell>
    );
}

/* ----------------------------------------------------------------
   Sub-components
   ---------------------------------------------------------------- */
const STAT_COLORS = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', num: 'text-blue-700' },
    green: { bg: 'bg-[var(--color-primary-muted)]', text: 'text-[var(--color-primary)]', num: 'text-[var(--color-primary)]' },
    red: { bg: 'bg-[var(--color-error-light)]', text: 'text-[var(--color-error)]', num: 'text-[var(--color-error)]' },
    yellow: { bg: 'bg-amber-50', text: 'text-amber-700', num: 'text-amber-700' },
};

function StatCard({ label, value, color }: { label: string; value: number; color: keyof typeof STAT_COLORS }) {
    const c = STAT_COLORS[color];
    return (
        <div className={`card ${c.bg} border-0`}>
            <div className="card-body py-4">
                <p className={`text-2xl font-bold ${c.num}`}>{value}</p>
                <p className={`text-xs font-medium mt-0.5 ${c.text}`}>{label}</p>
            </div>
        </div>
    );
}

function Modal({
    title, children, onClose, danger = false,
}: {
    title: string; children: React.ReactNode; onClose: () => void; danger?: boolean;
}) {
    return (
        <>
            <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-md pointer-events-auto animate-fade-in">
                    <div
                        className="flex items-center justify-between px-6 py-4 border-b"
                        style={{ borderColor: danger ? 'var(--color-error)' : 'var(--color-border)' }}
                    >
                        <h3 className="text-base font-semibold" style={{ color: danger ? 'var(--color-error)' : 'var(--color-text)' }}>
                            {title}
                        </h3>
                        <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: '4px' }}>
                            <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
                                <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>
                    <div className="px-6 py-5">{children}</div>
                </div>
            </div>
        </>
    );
}

function IconSearch() {
    return (
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
            <path d="M9 17A8 8 0 109 1a8 8 0 000 16zM19 19l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}