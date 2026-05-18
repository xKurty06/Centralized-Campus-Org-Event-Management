'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import AdminShell from '@/components/AdminShell';

/* ----------------------------------------------------------------
   Types
   ---------------------------------------------------------------- */
type GlobalRole = 'User' | 'Overseer';
type AccountStatus = 'Active' | 'Deactivated';

interface User {
    id: string;
    name: string;
    schoolId: string;
    email: string;
    department: string;
    yearLevel: number;
    globalRole: GlobalRole;
    isActive: boolean;
    orgRole?: string; // e.g. "Officer @ CSS"
}

/* ----------------------------------------------------------------
   Placeholder Data
   ---------------------------------------------------------------- */
const PLACEHOLDER_USERS: User[] = [
    { id: 'u-1', name: 'Juan Dela Cruz', schoolId: '2022-1-00045', email: 'j.delacruz@cvsu.edu.ph', department: 'CEIT', yearLevel: 3, globalRole: 'User', isActive: true, orgRole: 'President @ CSS' },
    { id: 'u-2', name: 'Maria Reyes', schoolId: '2022-1-00078', email: 'm.reyes@cvsu.edu.ph', department: 'CEIT', yearLevel: 3, globalRole: 'User', isActive: true, orgRole: 'VP @ CSS' },
    { id: 'u-3', name: 'Carlo Mendoza', schoolId: '2023-1-00112', email: 'c.mendoza@cvsu.edu.ph', department: 'CEIT', yearLevel: 2, globalRole: 'User', isActive: true, orgRole: 'Secretary @ CSS' },
    { id: 'u-4', name: 'Ana Villanueva', schoolId: '2023-1-00134', email: 'a.villanueva@cvsu.edu.ph', department: 'CEIT', yearLevel: 2, globalRole: 'User', isActive: true },
    { id: 'u-5', name: 'Paolo Santos', schoolId: '2021-1-00023', email: 'p.santos@cvsu.edu.ph', department: 'CEIT', yearLevel: 4, globalRole: 'User', isActive: false },
    { id: 'u-6', name: 'Lara Castro', schoolId: '2024-1-00067', email: 'l.castro@cvsu.edu.ph', department: 'CAS', yearLevel: 1, globalRole: 'User', isActive: true },
    { id: 'u-7', name: 'Miguel Torres', schoolId: '2022-2-00089', email: 'm.torres@cvsu.edu.ph', department: 'CAS', yearLevel: 3, globalRole: 'User', isActive: true, orgRole: 'President @ SPECS' },
    { id: 'u-8', name: 'Sofia Navarro', schoolId: '2023-2-00045', email: 's.navarro@cvsu.edu.ph', department: 'CON', yearLevel: 2, globalRole: 'User', isActive: true },
    { id: 'u-9', name: 'Admin John Doe', schoolId: '0000-0-00001', email: 'j.doe@cvsu.edu.ph', department: 'OSA', yearLevel: 0, globalRole: 'Overseer', isActive: true },
    { id: 'u-10', name: 'Admin Jane Smith', schoolId: '0000-0-00002', email: 'j.smith@cvsu.edu.ph', department: 'OSA', yearLevel: 0, globalRole: 'Overseer', isActive: true },
    { id: 'u-11', name: 'Rico Pangilinan', schoolId: '2021-1-00099', email: 'r.pangilinan@cvsu.edu.ph', department: 'COE', yearLevel: 4, globalRole: 'User', isActive: false },
    { id: 'u-12', name: 'Tricia Ocampo', schoolId: '2024-2-00033', email: 't.ocampo@cvsu.edu.ph', department: 'CBA', yearLevel: 1, globalRole: 'User', isActive: true },
];

/* ----------------------------------------------------------------
   Page
   ---------------------------------------------------------------- */
export default function AdminUsersPage() {
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState<'All' | GlobalRole>('All');
    const [filterStatus, setFilterStatus] = useState<'All' | AccountStatus>('All');
    const [filterDept, setFilterDept] = useState('All');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const departments = useMemo(() => {
        const depts = [...new Set(PLACEHOLDER_USERS.map((u) => u.department))].sort();
        return ['All', ...depts];
    }, []);

    const filtered = useMemo(() => {
        return PLACEHOLDER_USERS.filter((u) => {
            const q = search.toLowerCase();
            const matchSearch =
                u.name.toLowerCase().includes(q) ||
                u.schoolId.includes(q) ||
                u.email.toLowerCase().includes(q);
            const matchRole = filterRole === 'All' || u.globalRole === filterRole;
            const matchStatus = filterStatus === 'All' || (filterStatus === 'Active' ? u.isActive : !u.isActive);
            const matchDept = filterDept === 'All' || u.department === filterDept;
            return matchSearch && matchRole && matchStatus && matchDept;
        });
    }, [search, filterRole, filterStatus, filterDept]);

    const stats = useMemo(() => ({
        total: PLACEHOLDER_USERS.length,
        active: PLACEHOLDER_USERS.filter((u) => u.isActive).length,
        deactivated: PLACEHOLDER_USERS.filter((u) => !u.isActive).length,
        overseers: PLACEHOLDER_USERS.filter((u) => u.globalRole === 'Overseer').length,
    }), []);

    function handleToggleActive(user: User) {
        // Placeholder: wire to PATCH /api/admin/users/:id
        setSelectedUser(null);
        alert(`[Placeholder] ${user.isActive ? 'Deactivated' : 'Activated'}: ${user.name}`);
    }

    function handleRoleChange(user: User, newRole: GlobalRole) {
        // Placeholder: wire to PATCH /api/admin/users/:id
        alert(`[Placeholder] Role changed to ${newRole} for ${user.name}`);
    }

    return (
        <AdminShell>
            <main className="flex flex-col gap-6 animate-fade-in">

                {/* Page header */}
                <div>
                    <p
                        className="text-xs font-semibold uppercase tracking-widest mb-1"
                        style={{ color: "var(--color-text-muted)" }}
                    >
                        Admin
                    </p>
                    <h1
                        className="text-[22px] font-bold tracking-tight"
                        style={{ color: "var(--color-text)" }}
                    >
                        Users
                    </h1>
                    <p className="text-sm mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                        Manage user accounts and their permissions.
                    </p>
                </div>

                {/* ── Stat Cards ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <StatCard label="Total Users" value={stats.total} color="blue" />
                    <StatCard label="Active" value={stats.active} color="green" />
                    <StatCard label="Deactivated" value={stats.deactivated} color="red" />
                    <StatCard label="Overseers" value={stats.overseers} color="yellow" />
                </div>

                {/* ── Filters ── */}
                <div className="card mb-6">
                    <div className="card-body py-4">
                        <div className="flex flex-col sm:flex-row gap-3">

                            {/* Search */}
                            <div className="input-icon-wrapper flex-1">
                                <span className="input-icon-left">
                                    <IconSearch />
                                </span>
                                <input
                                    type="text"
                                    className="input-has-left-icon"
                                    placeholder="Search by name, school ID, or email…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                            {/* Role filter */}
                            <select
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value as typeof filterRole)}
                                className="sm:w-36"
                            >
                                <option value="All">All Roles</option>
                                <option value="User">User</option>
                                <option value="Overseer">Overseer</option>
                            </select>

                            {/* Status filter */}
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                                className="sm:w-40"
                            >
                                <option value="All">All Status</option>
                                <option value="Active">Active</option>
                                <option value="Deactivated">Deactivated</option>
                            </select>

                            {/* Dept filter */}
                            <select
                                value={filterDept}
                                onChange={(e) => setFilterDept(e.target.value)}
                                className="sm:w-40"
                            >
                                {departments.map((d) => (
                                    <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* ── Table ── */}
                <div className="card overflow-x-auto">
                    <table className="table-base">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>School ID</th>
                                <th>Department</th>
                                <th>Year</th>
                                <th>Org Role</th>
                                <th>Global Role</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-10 text-sm text-[var(--color-text-muted)]">
                                        No users match your filters.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((user) => (
                                    <tr key={user.id}>
                                        {/* Name + email */}
                                        <td>
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-full bg-[var(--color-primary-muted)] flex items-center justify-center flex-shrink-0">
                                                    <span className="text-[10px] font-bold text-[var(--color-primary)]">
                                                        {user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-[var(--color-text)]">{user.name}</p>
                                                    <p className="text-xs text-[var(--color-text-muted)]">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-sm font-mono text-[var(--color-text-secondary)]">{user.schoolId}</td>
                                        <td className="text-sm text-[var(--color-text-secondary)]">{user.department}</td>
                                        <td className="text-sm text-[var(--color-text-secondary)]">
                                            {user.yearLevel > 0 ? `Year ${user.yearLevel}` : '—'}
                                        </td>
                                        <td className="text-sm text-[var(--color-text-secondary)]">{user.orgRole ?? '—'}</td>

                                        {/* Role dropdown */}
                                        <td>
                                            <select
                                                value={user.globalRole}
                                                onChange={(e) => handleRoleChange(user, e.target.value as GlobalRole)}
                                                className="text-xs px-2 py-1 rounded-md border border-[var(--color-border)] bg-white w-auto"
                                                style={{ width: 'auto', padding: '4px 8px' }}
                                            >
                                                <option value="User">User</option>
                                                <option value="Overseer">Overseer</option>
                                            </select>
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
                                                onClick={() => setSelectedUser(user)}
                                                className={`btn btn-sm ${user.isActive ? 'btn-danger' : 'btn-outline'}`}
                                            >
                                                {user.isActive ? 'Deactivate' : 'Reactivate'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Footer */}
                    <div className="px-4 py-3 border-t border-[var(--color-border)] flex items-center justify-between">
                        <p className="text-xs text-[var(--color-text-muted)]">
                            Showing {filtered.length} of {PLACEHOLDER_USERS.length} users
                        </p>
                        {/* Pagination placeholder */}
                        <div className="flex items-center gap-1">
                            <button className="btn btn-ghost btn-sm" disabled>← Prev</button>
                            <span className="text-xs px-3 py-1.5 rounded-md bg-[var(--color-primary-muted)] text-[var(--color-primary)] font-semibold">1</span>
                            <button className="btn btn-ghost btn-sm" disabled>Next →</button>
                        </div>
                    </div>
                </div>
            </main>

            {/* ── Confirm Modal ── */}
            {selectedUser && (
                <>
                    <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setSelectedUser(null)} />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-fade-in">
                            <h3 className="text-base font-semibold text-[var(--color-text)] mb-2">
                                {selectedUser.isActive ? 'Deactivate Account?' : 'Reactivate Account?'}
                            </h3>
                            <p className="text-sm text-[var(--color-text-secondary)] mb-1">
                                User: <span className="font-semibold">{selectedUser.name}</span>
                            </p>
                            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                                {selectedUser.isActive
                                    ? 'Deactivating this account will block the user from logging in. All their records and registrations are preserved.'
                                    : 'Reactivating this account will restore the user\'s access to the platform.'
                                }
                            </p>
                            <div className="flex gap-3 justify-end">
                                <button className="btn btn-ghost" onClick={() => setSelectedUser(null)}>Cancel</button>
                                <button
                                    className={`btn ${selectedUser.isActive ? 'btn-danger' : 'btn-primary'}`}
                                    onClick={() => handleToggleActive(selectedUser)}
                                >
                                    {selectedUser.isActive ? 'Yes, Deactivate' : 'Yes, Reactivate'}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
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

function IconSearch() {
    return (
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
            <path d="M9 17A8 8 0 109 1a8 8 0 000 16zM19 19l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}