'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

/* ----------------------------------------------------------------
   Types
   ---------------------------------------------------------------- */
type AccreditationStatus = 'Active' | 'Suspended';
type OrgCategory = 'Academic' | 'Non-Academic' | 'Religious';

interface Officer {
    id: string;
    name: string;
    schoolId: string;
    position: string;
    department: string;
    isActive: boolean;
}

interface OrgEvent {
    id: string;
    title: string;
    status: 'Upcoming' | 'Open' | 'Full' | 'Closed' | 'Completed' | 'Cancelled';
    date: string;
    registrants: number;
}

interface Organization {
    id: string;
    name: string;
    description: string;
    logoUrl?: string;
    adviser: string;
    category: OrgCategory;
    accreditationStatus: AccreditationStatus;
    accreditedBy: string;
    accreditedAt: string;
    totalEvents: number;
    totalMembers: number;
}

/* ----------------------------------------------------------------
   Placeholder Data
   ---------------------------------------------------------------- */
const PLACEHOLDER_ORG: Organization = {
    id: 'org-001',
    name: 'Computer Science Society',
    description:
        'The Computer Science Society (CSS) is the official academic organization of BS Computer Science students at Cavite State University. We foster a community of learners passionate about technology, programming, and innovation through seminars, workshops, hackathons, and community outreach activities.',
    logoUrl: undefined,
    adviser: 'Dr. Maria Santos',
    category: 'Academic',
    accreditationStatus: 'Active',
    accreditedBy: 'Admin John Doe',
    accreditedAt: '2025-06-15T10:30:00Z',
    totalEvents: 12,
    totalMembers: 87,
};

const PLACEHOLDER_OFFICERS: Officer[] = [
    { id: 'u-1', name: 'Juan Dela Cruz', schoolId: '2022-1-00045', position: 'President', department: 'CEIT', isActive: true },
    { id: 'u-2', name: 'Maria Reyes', schoolId: '2022-1-00078', position: 'Vice President', department: 'CEIT', isActive: true },
    { id: 'u-3', name: 'Carlo Mendoza', schoolId: '2023-1-00112', position: 'Secretary', department: 'CEIT', isActive: true },
    { id: 'u-4', name: 'Ana Villanueva', schoolId: '2023-1-00134', position: 'Treasurer', department: 'CEIT', isActive: true },
    { id: 'u-5', name: 'Paolo Santos', schoolId: '2021-1-00023', position: 'Past President', department: 'CEIT', isActive: false },
];

const PLACEHOLDER_EVENTS: OrgEvent[] = [
    { id: 'ev-1', title: 'Web Dev Workshop 2025', status: 'Completed', date: 'May 10, 2025', registrants: 64 },
    { id: 'ev-2', title: 'Hackathon: Code for a Cause', status: 'Open', date: 'Aug 3, 2025', registrants: 38 },
    { id: 'ev-3', title: 'Career Talk: Tech Industry', status: 'Upcoming', date: 'Sep 20, 2025', registrants: 0 },
    { id: 'ev-4', title: 'CSS Night: Org Anniversary', status: 'Cancelled', date: 'Apr 5, 2025', registrants: 12 },
];

/* ----------------------------------------------------------------
   Helpers
   ---------------------------------------------------------------- */
const STATUS_BADGE: Record<OrgEvent['status'], string> = {
    Upcoming: 'badge-blue',
    Open: 'badge-green',
    Full: 'badge-yellow',
    Closed: 'badge-gray',
    Completed: 'badge-gray',
    Cancelled: 'badge-red',
};

function getInitials(name: string) {
    return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-PH', {
        year: 'numeric', month: 'long', day: 'numeric',
    });
}

/* ----------------------------------------------------------------
   Page
   ---------------------------------------------------------------- */
export default function AdminOrgDetailPage() {
    const [org, setOrg] = useState<Organization>(PLACEHOLDER_ORG);
    const [activeTab, setActiveTab] = useState<'overview' | 'officers' | 'events'>('overview');
    const [showConfirm, setShowConfirm] = useState(false);

    const isActive = org.accreditationStatus === 'Active';

    function toggleAccreditation() {
        setOrg((prev) => ({
            ...prev,
            accreditationStatus: prev.accreditationStatus === 'Active' ? 'Suspended' : 'Active',
            accreditedBy: 'Admin (You)',
            accreditedAt: new Date().toISOString(),
        }));
        setShowConfirm(false);
    }

    return (
        <div className="page-shell">
            <Navbar role="admin" user={{ name: 'Admi    n User', schoolId: '0000-0-00000', department: 'OSA' }} />

            <main className="max-w-[1240px] mx-auto px-6 py-10">

                {/* ── Breadcrumb ── */}
                <nav className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] mb-6">
                    <Link href="/admin/dashboard" className="hover:text-[var(--color-primary)]">Dashboard</Link>
                    <span>/</span>
                    <Link href="/admin/organizations" className="hover:text-[var(--color-primary)]">Organizations</Link>
                    <span>/</span>
                    <span className="text-[var(--color-text-secondary)]">{org.name}</span>
                </nav>

                {/* ── Header Card ── */}
                <div className="card mb-6">
                    <div className="card-body">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">

                            {/* Logo */}
                            <div className="w-20 h-20 rounded-xl bg-[var(--color-primary-muted)] flex items-center justify-center border border-[var(--color-border)] flex-shrink-0 overflow-hidden">
                                {org.logoUrl
                                    ? <img src={org.logoUrl} alt={org.name} className="w-full h-full object-cover" />
                                    : <span className="text-2xl font-bold text-[var(--color-primary)]">{getInitials(org.name)}</span>
                                }
                            </div>

                            {/* Meta */}
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <h1 className="text-xl font-bold text-[var(--color-text)] truncate">{org.name}</h1>
                                    <span className={`badge ${isActive ? 'badge-green' : 'badge-red'}`}>
                                        {org.accreditationStatus}
                                    </span>
                                    <span className="badge badge-blue">{org.category}</span>
                                </div>
                                <p className="text-sm text-[var(--color-text-secondary)]">Adviser: <span className="font-medium text-[var(--color-text)]">{org.adviser}</span></p>
                                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                                    Status last updated by <span className="font-medium">{org.accreditedBy}</span> on {formatDate(org.accreditedAt)}
                                </p>
                            </div>

                            {/* Stats */}
                            <div className="flex gap-6 flex-shrink-0">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-[var(--color-primary)]">{org.totalEvents}</p>
                                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Events</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-[var(--color-primary)]">{org.totalMembers}</p>
                                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Members</p>
                                </div>
                            </div>

                            {/* Action */}
                            <button
                                onClick={() => setShowConfirm(true)}
                                className={`btn ${isActive ? 'btn-danger' : 'btn-primary'} flex-shrink-0`}
                            >
                                {isActive ? (
                                    <><IconSuspend /> Suspend Org</>
                                ) : (
                                    <><IconActivate /> Reinstate Org</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Tabs ── */}
                <div className="flex gap-1 border-b border-[var(--color-border)] mb-6">
                    {(['overview', 'officers', 'events'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px cursor-pointer
                ${activeTab === tab
                                    ? 'border-[var(--color-primary-light)] text-[var(--color-primary)]'
                                    : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* ── Tab: Overview ── */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">

                        {/* About */}
                        <div className="md:col-span-2 card">
                            <div className="card-body">
                                <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-3">About</h2>
                                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{org.description}</p>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="card">
                            <div className="card-body">
                                <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-4">Details</h2>
                                <dl className="flex flex-col gap-3">
                                    <DetailRow label="Category" value={org.category} />
                                    <DetailRow label="Adviser" value={org.adviser} />
                                    <DetailRow label="Status" value={org.accreditationStatus} />
                                    <DetailRow label="Updated by" value={org.accreditedBy} />
                                    <DetailRow label="Updated at" value={formatDate(org.accreditedAt)} />
                                </dl>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Tab: Officers ── */}
                {activeTab === 'officers' && (
                    <div className="card animate-fade-in overflow-x-auto">
                        <table className="table-base">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>School ID</th>
                                    <th>Position</th>
                                    <th>Department</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {PLACEHOLDER_OFFICERS.map((officer) => (
                                    <tr key={officer.id}>
                                        <td>
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-full bg-[var(--color-primary-muted)] flex items-center justify-center flex-shrink-0">
                                                    <span className="text-[10px] font-bold text-[var(--color-primary)]">{getInitials(officer.name)}</span>
                                                </div>
                                                <span className="text-sm font-medium text-[var(--color-text)]">{officer.name}</span>
                                            </div>
                                        </td>
                                        <td className="text-sm text-[var(--color-text-secondary)] font-mono">{officer.schoolId}</td>
                                        <td className="text-sm text-[var(--color-text)]">{officer.position}</td>
                                        <td className="text-sm text-[var(--color-text-secondary)]">{officer.department}</td>
                                        <td>
                                            <span className={`badge ${officer.isActive ? 'badge-green' : 'badge-gray'}`}>
                                                {officer.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── Tab: Events ── */}
                {activeTab === 'events' && (
                    <div className="card animate-fade-in overflow-x-auto">
                        <table className="table-base">
                            <thead>
                                <tr>
                                    <th>Event</th>
                                    <th>Date</th>
                                    <th>Registrants</th>
                                    <th>Status</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {PLACEHOLDER_EVENTS.map((event) => (
                                    <tr key={event.id}>
                                        <td className="text-sm font-medium text-[var(--color-text)]">{event.title}</td>
                                        <td className="text-sm text-[var(--color-text-secondary)]">{event.date}</td>
                                        <td className="text-sm text-[var(--color-text-secondary)]">{event.registrants}</td>
                                        <td>
                                            <span className={`badge ${STATUS_BADGE[event.status]}`}>{event.status}</span>
                                        </td>
                                        <td>
                                            <Link
                                                href={`/admin/events?org=${org.id}`}
                                                className="text-xs font-medium text-[var(--color-primary)] hover:underline"
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            {/* ── Confirm Modal ── */}
            {showConfirm && (
                <>
                    <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setShowConfirm(false)} />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-fade-in">
                            <h3 className="text-base font-semibold text-[var(--color-text)] mb-2">
                                {isActive ? 'Suspend Organization?' : 'Reinstate Organization?'}
                            </h3>
                            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                                {isActive
                                    ? `Suspending "${org.name}" will prevent its officers from publishing new events. Existing events and records will be preserved.`
                                    : `Reinstating "${org.name}" will restore its ability to create and publish events on the platform.`
                                }
                            </p>
                            <div className="flex gap-3 justify-end">
                                <button className="btn btn-ghost" onClick={() => setShowConfirm(false)}>Cancel</button>
                                <button
                                    className={`btn ${isActive ? 'btn-danger' : 'btn-primary'}`}
                                    onClick={toggleAccreditation}
                                >
                                    {isActive ? 'Yes, Suspend' : 'Yes, Reinstate'}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

/* ----------------------------------------------------------------
   Sub-components
   ---------------------------------------------------------------- */
function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col gap-0.5">
            <dt className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide">{label}</dt>
            <dd className="text-sm font-medium text-[var(--color-text)]">{value}</dd>
        </div>
    );
}

function IconSuspend() {
    return (
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
            <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zM8 7v6M12 7v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}
function IconActivate() {
    return (
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
            <path d="M9 12l2 2 4-4M10 2a8 8 0 100 16A8 8 0 0010 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}