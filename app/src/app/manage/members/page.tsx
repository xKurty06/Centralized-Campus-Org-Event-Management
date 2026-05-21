'use client';

import { useState, useMemo } from 'react';
import ManageShell from '@/components/ManageShell';
import { FilterSelect, FilterChip } from '@/components/ui/filter';

/* ----------------------------------------------------------------
   Schema reference — Org_Members table
   ----------------------------------------------------------------
   id                  UUID PK
   user_id             FK → Users(id)
   org_id              FK → Organizations(id)
   membership_status   ENUM: Pending | Active | Inactive
   paid_membership_fee Boolean DEFAULT false
   joined_at           Timestamp
   updated_at          Timestamp

   API endpoints (wired to placeholders):
   GET   /api/manage/members?org_id=:id
   GET   /api/manage/members/lookup?school_id=:id  → user preview
   POST  /api/manage/members            { org_id, user_id }
   PATCH /api/manage/members/:id        { membership_status | paid_membership_fee }
   ---------------------------------------------------------------- */

/* ----------------------------------------------------------------
   Types
   ---------------------------------------------------------------- */
type MembershipStatus = 'Pending' | 'Active' | 'Inactive';
type StatusFilter = 'All' | MembershipStatus;
type FeeFilter = 'All' | 'Paid' | 'Unpaid';

interface Member {
    // Org_Members columns
    id: string;
    userId: string;
    orgId: string;
    membershipStatus: MembershipStatus;
    paidMembershipFee: boolean;
    joinedAt: string;
    updatedAt: string;
    // Joined from Users + Courses + Departments (display only)
    schoolId: string;
    firstName: string;
    lastName: string;
    email: string;
    course: string;        // Courses.course_code
    dept: string;          // Departments.code
    yearLevel: number;     // Users.year_level
    section: number;       // Users.section
    // Derived — true if a row exists in Org_Officers for this user+org
    isOfficer: boolean;
}

/* ----------------------------------------------------------------
   Placeholder data
   ---------------------------------------------------------------- */
const ORG_NAME = 'Computer Students Society';

const SEED: Member[] = [
    {
        id: 'm-1', userId: 'u-1', orgId: 'org-1',
        membershipStatus: 'Active', paidMembershipFee: true,
        joinedAt: '2025-06-01T08:00:00', updatedAt: '2025-06-02T10:14:00',
        schoolId: '2022100045', firstName: 'Juan', lastName: 'Dela Cruz',
        email: 'j.delacruz@cvsu.edu.ph', course: 'BSCS', dept: 'CEIT',
        yearLevel: 3, section: 2, isOfficer: true,
    },
    {
        id: 'm-2', userId: 'u-2', orgId: 'org-1',
        membershipStatus: 'Active', paidMembershipFee: true,
        joinedAt: '2025-06-01T08:00:00', updatedAt: '2025-06-02T10:30:00',
        schoolId: '2022100078', firstName: 'Maria', lastName: 'Reyes',
        email: 'm.reyes@cvsu.edu.ph', course: 'BSCS', dept: 'CEIT',
        yearLevel: 3, section: 1, isOfficer: true,
    },
    {
        id: 'm-3', userId: 'u-3', orgId: 'org-1',
        membershipStatus: 'Active', paidMembershipFee: true,
        joinedAt: '2025-06-01T08:00:00', updatedAt: '2025-06-03T09:00:00',
        schoolId: '2023100112', firstName: 'Carlo', lastName: 'Mendoza',
        email: 'c.mendoza@cvsu.edu.ph', course: 'BSIT', dept: 'CEIT',
        yearLevel: 2, section: 3, isOfficer: true,
    },
    {
        id: 'm-4', userId: 'u-4', orgId: 'org-1',
        membershipStatus: 'Active', paidMembershipFee: false,
        joinedAt: '2025-06-05T11:00:00', updatedAt: '2025-06-05T11:00:00',
        schoolId: '2023100134', firstName: 'Ana', lastName: 'Villanueva',
        email: 'a.villanueva@cvsu.edu.ph', course: 'BSIT', dept: 'CEIT',
        yearLevel: 2, section: 1, isOfficer: false,
    },
    {
        id: 'm-5', userId: 'u-5', orgId: 'org-1',
        membershipStatus: 'Pending', paidMembershipFee: false,
        joinedAt: '2025-06-10T14:00:00', updatedAt: '2025-06-10T14:00:00',
        schoolId: '2024100067', firstName: 'Lara', lastName: 'Castro',
        email: 'l.castro@cvsu.edu.ph', course: 'BSBA', dept: 'CAS',
        yearLevel: 1, section: 1, isOfficer: false,
    },
    {
        id: 'm-6', userId: 'u-6', orgId: 'org-1',
        membershipStatus: 'Pending', paidMembershipFee: false,
        joinedAt: '2025-06-11T09:30:00', updatedAt: '2025-06-11T09:30:00',
        schoolId: '2024100089', firstName: 'Nico', lastName: 'Bautista',
        email: 'n.bautista@cvsu.edu.ph', course: 'BSCS', dept: 'CEIT',
        yearLevel: 1, section: 2, isOfficer: false,
    },
    {
        id: 'm-7', userId: 'u-7', orgId: 'org-1',
        membershipStatus: 'Inactive', paidMembershipFee: true,
        joinedAt: '2024-06-01T08:00:00', updatedAt: '2025-01-15T12:00:00',
        schoolId: '2021100099', firstName: 'Rico', lastName: 'Pangilinan',
        email: 'r.pangilinan@cvsu.edu.ph', course: 'BSCE', dept: 'COE',
        yearLevel: 4, section: 3, isOfficer: false,
    },
    {
        id: 'm-8', userId: 'u-8', orgId: 'org-1',
        membershipStatus: 'Active', paidMembershipFee: false,
        joinedAt: '2025-06-06T10:00:00', updatedAt: '2025-06-06T10:00:00',
        schoolId: '2023200045', firstName: 'Sofia', lastName: 'Navarro',
        email: 's.navarro@cvsu.edu.ph', course: 'BSN', dept: 'CON',
        yearLevel: 2, section: 1, isOfficer: false,
    },
    {
        id: 'm-9', userId: 'u-9', orgId: 'org-1',
        membershipStatus: 'Active', paidMembershipFee: true,
        joinedAt: '2025-06-04T13:00:00', updatedAt: '2025-06-07T16:00:00',
        schoolId: '2022200033', firstName: 'Tricia', lastName: 'Ocampo',
        email: 't.ocampo@cvsu.edu.ph', course: 'BSAc', dept: 'CBA',
        yearLevel: 3, section: 2, isOfficer: false,
    },
];

/* ----------------------------------------------------------------
   Helpers
   ---------------------------------------------------------------- */
const initials = (f: string, l: string) => (f[0] + l[0]).toUpperCase();
const fullName = (m: Pick<Member, 'firstName' | 'lastName'>) => `${m.firstName} ${m.lastName}`;

function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-PH', {
        month: 'short', day: 'numeric', year: 'numeric',
    });
}
function fmtDatetime(iso: string) {
    return new Date(iso).toLocaleString('en-PH', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit',
    });
}

const STATUS_BADGE: Record<MembershipStatus, string> = {
    Active: 'badge-green',
    Pending: 'badge-yellow',
    Inactive: 'badge-gray',
};

const STATUS_SELECT_STYLE: Record<MembershipStatus, React.CSSProperties> = {
    Active: { background: 'var(--color-primary-muted)', color: 'var(--color-primary)', border: '1.5px solid var(--color-primary-light)' },
    Pending: { background: '#fffbeb', color: '#92610a', border: '1.5px solid #f0a500' },
    Inactive: { background: 'var(--color-surface-2)', color: 'var(--color-text-secondary)', border: '1.5px solid var(--color-border)' },
};

/* ----------------------------------------------------------------
   Page
   ---------------------------------------------------------------- */
export default function ManageMembersPage() {
    const [members, setMembers] = useState<Member[]>(SEED);

    // ── Filters
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<StatusFilter>('All');
    const [filterFee, setFilterFee] = useState<FeeFilter>('All');
    const [filterDept, setFilterDept] = useState('All');

    // ── Add member modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [addSchoolId, setAddSchoolId] = useState('');
    const [addLoading, setAddLoading] = useState(false);
    const [addError, setAddError] = useState('');
    const [lookupResult, setLookupResult] = useState<{
        firstName: string; lastName: string;
        course: string; dept: string;
        yearLevel: number; section: number;
    } | null>(null);

    // ── Fee toggle confirm modal
    const [feeTarget, setFeeTarget] = useState<Member | null>(null);

    // ── Status change confirm modal
    const [statusTarget, setStatusTarget] = useState<Member | null>(null);
    const [pendingStatus, setPendingStatus] = useState<MembershipStatus | null>(null);

    // ── Detail drawer
    const [detailMember, setDetailMember] = useState<Member | null>(null);

    /* ── Derived ── */
    const departments = useMemo(() => {
        const d = [...new Set(SEED.map((m) => m.dept))].sort();
        return ['All', ...d];
    }, []);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return members.filter((m) => {
            const matchSearch =
                fullName(m).toLowerCase().includes(q) ||
                m.schoolId.includes(q) ||
                m.email.toLowerCase().includes(q) ||
                m.course.toLowerCase().includes(q);
            const matchStatus = filterStatus === 'All' || m.membershipStatus === filterStatus;
            const matchFee = filterFee === 'All' || (filterFee === 'Paid' ? m.paidMembershipFee : !m.paidMembershipFee);
            const matchDept = filterDept === 'All' || m.dept === filterDept;
            return matchSearch && matchStatus && matchFee && matchDept;
        });
    }, [members, search, filterStatus, filterFee, filterDept]);

    const stats = useMemo(() => ({
        total: members.length,
        active: members.filter((m) => m.membershipStatus === 'Active').length,
        pending: members.filter((m) => m.membershipStatus === 'Pending').length,
        inactive: members.filter((m) => m.membershipStatus === 'Inactive').length,
        feePaid: members.filter((m) => m.paidMembershipFee).length,
    }), [members]);

    /* ── Handlers ── */

    // Simulates GET /api/manage/members/lookup?school_id=
    async function handleLookup() {
        setAddError('');
        setLookupResult(null);
        if (!addSchoolId.trim()) { setAddError('Enter a School ID first.'); return; }
        if (members.some((m) => m.schoolId === addSchoolId.trim())) {
            setAddError('This student is already a member of this organization.');
            return;
        }
        setAddLoading(true);
        await new Promise((r) => setTimeout(r, 700));
        setAddLoading(false);
        // Simulate not found
        if (addSchoolId.trim() === '0000-0-00000') {
            setAddError('No verified account found with that School ID.');
            return;
        }
        // Simulate found — replace with real API response shape
        setLookupResult({
            firstName: 'Sample', lastName: 'Student',
            course: 'BSCS', dept: 'CEIT',
            yearLevel: 2, section: 1,
        });
    }

    function handleConfirmAdd() {
        if (!lookupResult) return;
        const now = new Date().toISOString();
        const next: Member = {
            id: `m-${Date.now()}`,
            userId: `u-new-${Date.now()}`,
            orgId: 'org-1',
            membershipStatus: 'Active',
            paidMembershipFee: false,
            joinedAt: now,
            updatedAt: now,
            schoolId: addSchoolId.trim(),
            firstName: lookupResult.firstName,
            lastName: lookupResult.lastName,
            email: `${addSchoolId.replace(/-/g, '.')}@cvsu.edu.ph`,
            course: lookupResult.course,
            dept: lookupResult.dept,
            yearLevel: lookupResult.yearLevel,
            section: lookupResult.section,
            isOfficer: false,
        };
        setMembers((prev) => [next, ...prev]);
        closeAddModal();
        // API: POST /api/manage/members { org_id, user_id }
    }

    function handleFeeToggle() {
        if (!feeTarget) return;
        const now = new Date().toISOString();
        const next = !feeTarget.paidMembershipFee;
        setMembers((prev) =>
            prev.map((m) =>
                m.id === feeTarget.id
                    ? { ...m, paidMembershipFee: next, updatedAt: now }
                    : m
            )
        );
        if (detailMember?.id === feeTarget.id) {
            setDetailMember((p) => p ? { ...p, paidMembershipFee: next, updatedAt: now } : p);
        }
        setFeeTarget(null);
        // API: PATCH /api/manage/members/:id { paid_membership_fee }
    }

    function handleStatusChange() {
        if (!statusTarget || !pendingStatus) return;
        const now = new Date().toISOString();
        setMembers((prev) =>
            prev.map((m) =>
                m.id === statusTarget.id
                    ? { ...m, membershipStatus: pendingStatus, updatedAt: now }
                    : m
            )
        );
        if (detailMember?.id === statusTarget.id) {
            setDetailMember((p) => p ? { ...p, membershipStatus: pendingStatus, updatedAt: now } : p);
        }
        setStatusTarget(null);
        setPendingStatus(null);
        // API: PATCH /api/manage/members/:id { membership_status }
    }

    function closeAddModal() {
        setShowAddModal(false);
        setAddSchoolId('');
        setAddError('');
        setLookupResult(null);
        setAddLoading(false);
    }
    const hasActiveFilters = !!search || filterStatus !== 'All' || filterFee !== 'All' || filterDept !== 'All';

    /* ================================================================
       RENDER
    ================================================================ */
    return (
        <ManageShell pageTitle="Salikop">
            <main className="flex flex-col gap-6 animate-fade-in">

                {/* ── Page Header ── */}
                <div className="flex flex-col w-full">
                    <div>
                        {/* Removed mb-1 and added leading-none to pull the title closer */}
                        <p
                            className="text-xs font-semibold uppercase tracking-widest leading-none"
                            style={{ color: 'var(--color-text-muted)' }}
                        >
                            Manage
                        </p>

                        {/* New container wrapping the title and button to align them perfectly left and right */}
                        <div className="flex flex-row items-center justify-between gap-4 w-full mt-0.2">
                            <div>
                                <h1
                                    className="text-[22px] font-bold tracking-tight leading-none"
                                    style={{ color: 'var(--color-text)' }}
                                >
                                    Member Roster
                                </h1>
                            </div>

                            <button
                                className="flex items-center gap-2 text-[13px] font-semibold bg-green-700 hover:bg-green-800 text-white px-3 py-2 rounded-lg transition-colors no-underline flex-shrink-0"
                                onClick={() => setShowAddModal(true)}
                            >
                                <IconPlus /> Add Member
                            </button>
                        </div>

                        {/* Description paragraph sits cleanly below the title-button row */}
                        <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                            Manage membership status and fee payments for your organization.
                        </p>
                    </div>
                </div>


                {/* ── Stat Cards ── */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <StatCard label="Total" value={stats.total} color="blue" />
                    <StatCard label="Active" value={stats.active} color="green" />
                    <StatCard label="Pending" value={stats.pending} color="yellow" />
                    <StatCard label="Inactive" value={stats.inactive} color="gray" />
                    <StatCard label="Fee Paid" value={`${stats.feePaid} / ${stats.total}`} color="teal" />
                </div>

                {/* ── Filters ── */}
                {/* ── Filters ─────────────────────────────────────────────── */}
                <div className="card" style={{ boxShadow: 'none' }}>
                    <div className="card-body py-3.5">
                        <div className="flex flex-col gap-2.5">

                            {/* Controls row */}
                            <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 sm:items-center">

                                {/* Search */}
                                <div className="input-icon-wrapper flex-1 min-w-[200px]">
                                    <span className="input-icon-left"><IconSearch /></span>
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search by name, school ID, email, or course…"
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

                                {/* Status Filter */}
                                <FilterSelect
                                    value={filterStatus}
                                    defaultValue="All"
                                    onChange={(v) => setFilterStatus(v as StatusFilter)}
                                    options={[
                                        { value: 'All', label: 'All Status' },
                                        { value: 'Active', label: 'Active' },
                                        { value: 'Pending', label: 'Pending' },
                                        { value: 'Inactive', label: 'Inactive' },
                                    ]}
                                    className="sm:w-40"
                                />

                                {/* Fee Status Filter */}
                                <FilterSelect
                                    value={filterFee}
                                    defaultValue="All"
                                    onChange={(v) => setFilterFee(v as FeeFilter)}
                                    options={[
                                        { value: 'All', label: 'All Fee Status' },
                                        { value: 'Paid', label: 'Fee Paid' },
                                        { value: 'Unpaid', label: 'Fee Unpaid' },
                                    ]}
                                    className="sm:w-40"
                                />

                                {/* Department Filter */}
                                <FilterSelect
                                    value={filterDept}
                                    defaultValue="All"
                                    onChange={(v) => setFilterDept(v)}
                                    options={departments.map((d) => ({
                                        value: d,
                                        label: d === 'All' ? 'All Depts' : d
                                    }))}
                                    className="sm:w-36"
                                />

                                {hasActiveFilters && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearch('');
                                            setFilterStatus('All');
                                            setFilterFee('All');
                                            setFilterDept('All');
                                        }}
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
                                    {filterStatus !== 'All' && <FilterChip label={filterStatus} onRemove={() => setFilterStatus('All')} />}
                                    {filterFee !== 'All' && <FilterChip label={filterFee === 'Paid' ? 'Fee Paid' : 'Fee Unpaid'} onRemove={() => setFilterFee('All')} />}
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
                                <th>Member</th>
                                <th>School ID</th>
                                <th>Course</th>
                                <th>Yr / Sec</th>
                                <th>Joined</th>
                                <th>Status</th>
                                <th>Membership Fee</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="text-center py-14 text-sm"
                                        style={{ color: 'var(--color-text-muted)' }}
                                    >
                                        No members match your filters.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((member) => (
                                    <MemberRow
                                        key={member.id}
                                        member={member}
                                        statusSelectStyle={STATUS_SELECT_STYLE}
                                        onFeeToggle={() => setFeeTarget(member)}
                                        onStatusChange={(s) => {
                                            setStatusTarget(member);
                                            setPendingStatus(s);
                                        }}
                                        onViewDetail={() => setDetailMember(member)}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>

                    <div
                        className="px-4 py-3 flex items-center justify-between"
                        style={{ borderTop: '1px solid var(--color-border)' }}
                    >
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            Showing <strong>{filtered.length}</strong> of <strong>{members.length}</strong> members
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
                MODAL: Add Member
            ================================================================ */}
            {showAddModal && (
                <Modal title="Add Member" onClose={closeAddModal}>
                    <div className="flex flex-col gap-4">
                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            Look up a student by School ID to manually add them to the roster.
                            Use this for walk-in signups who pay dues in person.
                        </p>

                        <div className="form-group">
                            <label className="form-label">School ID</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="e.g. 202405123"
                                    value={addSchoolId}
                                    onChange={(e) => {
                                        setAddSchoolId(e.target.value);
                                        setLookupResult(null);
                                        setAddError('');
                                    }}
                                    onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                                    style={{ flex: 1 }}
                                />
                                <button
                                    className="btn btn-outline flex-shrink-0"
                                    onClick={handleLookup}
                                    disabled={addLoading}
                                >
                                    {addLoading ? <IconSpinner /> : <><IconSearch /> Look up</>}
                                </button>
                            </div>
                            <span className="form-hint">
                                Must match a verified @cvsu.edu.ph account.
                            </span>
                        </div>

                        {addError && (
                            <p className="form-error flex items-center gap-1.5">
                                <IconWarning /> {addError}
                            </p>
                        )}

                        {/* Lookup result preview card */}
                        {lookupResult && (
                            <div
                                className="rounded-xl p-4 flex items-center gap-3"
                                style={{
                                    background: 'var(--color-primary-muted)',
                                    border: '1.5px solid var(--color-primary-light)',
                                }}
                            >
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                                    style={{ background: 'var(--color-primary-light)', color: '#fff' }}
                                >
                                    {initials(lookupResult.firstName, lookupResult.lastName)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                        {fullName(lookupResult)}
                                    </p>
                                    <p className="text-xs" style={{ color: 'var(--color-primary)' }}>
                                        {lookupResult.course} · {lookupResult.dept} · Year {lookupResult.yearLevel}, Sec {lookupResult.section}
                                    </p>
                                </div>
                                {/* Verified checkmark */}
                                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 20 20" style={{ color: 'var(--color-primary)' }}>
                                    <path fill="currentColor" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                                </svg>
                            </div>
                        )}

                        {lookupResult && (
                            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                The student will be added with <strong>Active</strong> status.
                                Membership fee can be toggled separately after adding.
                            </p>
                        )}

                        <div className="flex gap-3 justify-end pt-1">
                            <button className="btn btn-ghost" onClick={closeAddModal}>Cancel</button>
                            <button
                                className="btn btn-primary"
                                onClick={handleConfirmAdd}
                                disabled={!lookupResult}
                            >
                                <IconPlus /> Add to Roster
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ================================================================
                MODAL: Fee Toggle Confirm
            ================================================================ */}
            {feeTarget && (
                <Modal
                    title={feeTarget.paidMembershipFee ? 'Mark as Unpaid?' : 'Confirm Fee Payment?'}
                    onClose={() => setFeeTarget(null)}
                    danger={feeTarget.paidMembershipFee}
                >
                    <div className="flex flex-col gap-4">
                        <MemberSummary member={feeTarget} />
                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            {feeTarget.paidMembershipFee
                                ? "You are marking this member's fee as unpaid. The updated_at timestamp will be recorded."
                                : 'You are confirming that this member has paid their membership dues in person. The updated_at timestamp will be recorded.'
                            }
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button className="btn btn-ghost" onClick={() => setFeeTarget(null)}>Cancel</button>
                            <button
                                className={`btn ${feeTarget.paidMembershipFee ? 'btn-danger' : 'btn-primary'}`}
                                onClick={handleFeeToggle}
                            >
                                {feeTarget.paidMembershipFee ? 'Yes, Mark Unpaid' : 'Confirm Payment'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ================================================================
                MODAL: Status Change Confirm
            ================================================================ */}
            {statusTarget && pendingStatus && (
                <Modal
                    title={`Set to "${pendingStatus}"?`}
                    onClose={() => { setStatusTarget(null); setPendingStatus(null); }}
                    danger={pendingStatus === 'Inactive'}
                >
                    <div className="flex flex-col gap-4">
                        <MemberSummary member={statusTarget} />
                        <StatusExplainer current={statusTarget.membershipStatus} next={pendingStatus} />
                        <div className="flex gap-3 justify-end">
                            <button
                                className="btn btn-ghost"
                                onClick={() => { setStatusTarget(null); setPendingStatus(null); }}
                            >
                                Cancel
                            </button>
                            <button
                                className={`btn ${pendingStatus === 'Inactive' ? 'btn-danger' : 'btn-primary'}`}
                                onClick={handleStatusChange}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ================================================================
                DETAIL DRAWER — slides in from the right
            ================================================================ */}
            {detailMember && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        style={{ background: 'rgba(0,0,0,0.35)' }}
                        onClick={() => setDetailMember(null)}
                    />
                    <aside
                        className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm flex flex-col animate-slide-right"
                        style={{
                            background: 'var(--color-surface)',
                            borderLeft: '1px solid var(--color-border)',
                            boxShadow: 'var(--shadow-xl)',
                        }}
                    >
                        {/* Drawer header */}
                        <div
                            className="flex items-center justify-between px-5 py-4 flex-shrink-0"
                            style={{ borderBottom: '1px solid var(--color-border)' }}
                        >
                            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                Member Detail
                            </h3>
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => setDetailMember(null)}
                                style={{ padding: '4px' }}
                                aria-label="Close"
                            >
                                <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
                                    <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                                </svg>
                            </button>
                        </div>

                        {/* Drawer body */}
                        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">

                            {/* Avatar block */}
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
                                    style={{ background: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}
                                >
                                    {initials(detailMember.firstName, detailMember.lastName)}
                                </div>
                                <div>
                                    <p className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
                                        {fullName(detailMember)}
                                    </p>
                                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                                        {detailMember.email}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                        <span className={`badge ${STATUS_BADGE[detailMember.membershipStatus]}`}>
                                            {detailMember.membershipStatus}
                                        </span>
                                        {detailMember.isOfficer && (
                                            <span className="badge badge-blue">Officer</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <hr className="divider" />

                            {/* Identity fields */}
                            <section className="flex flex-col gap-3">
                                <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                                    Student Info
                                </p>
                                <DrawerField label="School ID" value={detailMember.schoolId} mono />
                                <DrawerField label="Course" value={detailMember.course} />
                                <DrawerField label="Department" value={detailMember.dept} />
                                <DrawerField label="Year / Section" value={`Year ${detailMember.yearLevel} · Section ${detailMember.section}`} />
                            </section>

                            <hr className="divider" />

                            {/* Membership controls */}
                            <section className="flex flex-col gap-4">
                                <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                                    Membership
                                </p>

                                {/* Status control */}
                                <div className="flex flex-col gap-2">
                                    <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                                        Status
                                    </p>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`badge ${STATUS_BADGE[detailMember.membershipStatus]}`}>
                                            {detailMember.membershipStatus}
                                        </span>
                                        {(['Active', 'Pending', 'Inactive'] as MembershipStatus[])
                                            .filter((s) => s !== detailMember.membershipStatus)
                                            .map((s) => (
                                                <button
                                                    key={s}
                                                    className="btn btn-ghost btn-sm"
                                                    style={{ padding: '3px 10px', fontSize: '12px' }}
                                                    onClick={() => {
                                                        setStatusTarget(detailMember);
                                                        setPendingStatus(s);
                                                    }}
                                                >
                                                    Set {s}
                                                </button>
                                            ))
                                        }
                                    </div>
                                </div>

                                {/* Fee control */}
                                <div className="flex flex-col gap-2">
                                    <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                                        Membership Fee
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <span className={`badge ${detailMember.paidMembershipFee ? 'badge-green' : 'badge-red'}`}>
                                            {detailMember.paidMembershipFee ? 'Paid' : 'Unpaid'}
                                        </span>
                                        <button
                                            className={`btn btn-sm ${detailMember.paidMembershipFee ? 'btn-danger' : 'btn-outline'}`}
                                            onClick={() => {
                                                setDetailMember(null);
                                                setFeeTarget(detailMember);
                                            }}
                                        >
                                            {detailMember.paidMembershipFee ? 'Mark Unpaid' : 'Mark as Paid'}
                                        </button>
                                    </div>
                                </div>

                                <DrawerField label="Joined At" value={fmtDatetime(detailMember.joinedAt)} />
                                <DrawerField label="Last Updated" value={fmtDatetime(detailMember.updatedAt)} />
                            </section>
                        </div>
                    </aside>
                </>
            )}
        </ManageShell>
    );
}

/* ================================================================
   MemberRow
================================================================ */
function MemberRow({
    member, statusSelectStyle, onFeeToggle, onStatusChange, onViewDetail,
}: {
    member: Member;
    statusSelectStyle: Record<MembershipStatus, React.CSSProperties>;
    onFeeToggle: () => void;
    onStatusChange: (s: MembershipStatus) => void;
    onViewDetail: () => void;
}) {
    return (
        <tr>
            {/* Name + email */}
            <td>
                <button className="flex items-center gap-2.5 text-left w-full" onClick={onViewDetail}>
                    <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                        style={{ background: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}
                    >
                        {initials(member.firstName, member.lastName)}
                    </div>
                    <div>
                        <p
                            className="text-sm font-medium hover:underline"
                            style={{ color: 'var(--color-text)' }}
                        >
                            {fullName(member)}
                            {member.isOfficer && (
                                <span
                                    className="ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded"
                                    style={{ background: '#eff6ff', color: '#1d4ed8' }}
                                >
                                    Officer
                                </span>
                            )}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            {member.email}
                        </p>
                    </div>
                </button>
            </td>

            {/* School ID */}
            <td className="text-sm font-mono" style={{ color: 'var(--color-text-secondary)' }}>
                {member.schoolId}
            </td>

            {/* Course */}
            <td className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {member.course} · {member.dept}
            </td>

            {/* Year / Section */}
            <td className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Y{member.yearLevel} / S{member.section}
            </td>

            {/* Joined */}
            <td className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {fmtDate(member.joinedAt)}
            </td>

            {/* Status — inline select with confirm on change */}
            <td>
                <select
                    value={member.membershipStatus}
                    onChange={(e) => {
                        const s = e.target.value as MembershipStatus;
                        if (s !== member.membershipStatus) onStatusChange(s);
                    }}
                    className="text-xs rounded-md font-semibold"
                    style={{
                        width: 'auto',
                        padding: '4px 8px',
                        ...statusSelectStyle[member.membershipStatus],
                    }}
                >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Inactive">Inactive</option>
                </select>
            </td>

            {/* Fee badge — click to toggle */}
            <td>
                <button
                    onClick={onFeeToggle}
                    className={`badge cursor-pointer transition-opacity hover:opacity-75 ${member.paidMembershipFee ? 'badge-green' : 'badge-red'}`}
                    title={member.paidMembershipFee ? 'Click to mark unpaid' : 'Click to confirm payment'}
                >
                    {member.paidMembershipFee
                        ? <><IconCheck /> Paid</>
                        : <><IconX /> Unpaid</>
                    }
                </button>
            </td>

            {/* View detail */}
            <td>
                <button className="btn btn-ghost btn-sm" onClick={onViewDetail}>
                    View
                </button>
            </td>
        </tr>
    );
}

/* ================================================================
   Shared small components
================================================================ */
const STAT_COLORS = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', num: 'text-blue-700' },
    green: { bg: 'bg-[var(--color-primary-muted)]', text: 'text-[var(--color-primary)]', num: 'text-[var(--color-primary)]' },
    yellow: { bg: 'bg-amber-50', text: 'text-amber-700', num: 'text-amber-700' },
    gray: { bg: 'bg-[var(--color-surface-2)]', text: 'text-[var(--color-text-secondary)]', num: 'text-[var(--color-text-secondary)]' },
    teal: { bg: 'bg-teal-50', text: 'text-teal-700', num: 'text-teal-700' },
};

function StatCard({ label, value, color }: {
    label: string; value: number | string; color: keyof typeof STAT_COLORS;
}) {
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

function MemberSummary({ member }: { member: Member }) {
    return (
        <div
            className="flex items-center gap-3 p-3 rounded-lg"
            style={{ background: 'var(--color-surface-2)' }}
        >
            <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}
            >
                {initials(member.firstName, member.lastName)}
            </div>
            <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                    {fullName(member)}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {member.schoolId} · {member.course}
                </p>
            </div>
        </div>
    );
}

function StatusExplainer({ current, next }: { current: MembershipStatus; next: MembershipStatus }) {
    const copy: Record<MembershipStatus, string> = {
        Active: 'The student will become a full, active member with access to member-only events.',
        Pending: 'The student will be marked as pending clearance. They will not have access to member-only events until activated.',
        Inactive: 'The student will lose their member standing. Access to member-only events will be revoked immediately.',
    };
    return (
        <p className="text-sm" style={{ color: next === 'Inactive' ? 'var(--color-error)' : 'var(--color-text-secondary)' }}>
            {copy[next]}
        </p>
    );
}

function DrawerField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
    return (
        <div>
            <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                {label}
            </p>
            <p
                className={`text-sm font-medium ${mono ? 'font-mono' : ''}`}
                style={{ color: 'var(--color-text)' }}
            >
                {value}
            </p>
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
            <div
                className="fixed inset-0 z-50"
                style={{ background: 'rgba(0,0,0,0.4)' }}
                onClick={onClose}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-lg pointer-events-auto animate-fade-in">
                    <div
                        className="flex items-center justify-between px-6 py-4"
                        style={{ borderBottom: `1px solid ${danger ? 'var(--color-error)' : 'var(--color-border)'}` }}
                    >
                        <h3
                            className="text-base font-semibold"
                            style={{ color: danger ? 'var(--color-error)' : 'var(--color-text)' }}
                        >
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

/* ── Icons ── */
function IconSearch() {
    return (
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
            <path d="M9 17A8 8 0 109 1a8 8 0 000 16zM19 19l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}
function IconPlus() {
    return (
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
            <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}
function IconCheck() {
    return (
        <svg className="w-3 h-3" viewBox="0 0 20 20" fill="none">
            <path d="M4 10l4.5 4.5L16 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
function IconX() {
    return (
        <svg className="w-3 h-3" viewBox="0 0 20 20" fill="none">
            <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}
function IconWarning() {
    return (
        <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="none">
            <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 4v5m0 3v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}
function IconSpinner() {
    return (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
    );
}