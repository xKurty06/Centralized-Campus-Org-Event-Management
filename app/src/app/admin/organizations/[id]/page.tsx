'use client';

import { useState, useMemo } from 'react';
import AdminShell from '@/components/AdminShell';

/* ----------------------------------------------------------------
   Types
   ---------------------------------------------------------------- */
type AccreditationStatus = 'Active' | 'Suspended';
type OrgCategory = 'Academic' | 'Non-Academic' | 'Religious';

interface Officer {
    id: string;
    userId: string;
    name: string;
    schoolId: string;
    email: string;
    position: string;
    isActive: boolean;
    joinedAt: string;
}

interface OrgProfile {
    id: string;
    name: string;
    description: string;
    logoUrl: string;
    adviser: string;
    foundedDate: string;
    category: OrgCategory;
    accreditationStatus: AccreditationStatus;
    accreditedBy: string;
    accreditedAt: string;
}

/* ----------------------------------------------------------------
   Placeholder Data
   ---------------------------------------------------------------- */
const PLACEHOLDER_ORG: OrgProfile = {
    id: 'org-1',
    name: 'Computer Students Society',
    description:
        'The Computer Students Society (CSS) is the premier academic organization for students of the College of Engineering, Information Technology, and Computer Studies. We foster a community of tech-driven learners through workshops, seminars, and competitions.',
    logoUrl: '',
    adviser: 'Dr. Maria Santos',
    foundedDate: '1998-06-12',
    category: 'Academic',
    accreditationStatus: 'Active',
    accreditedBy: 'Admin John Doe',
    accreditedAt: '2024-08-15T09:30:00',
};

const PLACEHOLDER_OFFICERS: Officer[] = [
    { id: 'off-1', userId: 'u-1', name: 'Juan Dela Cruz', schoolId: '2022-1-00045', email: 'j.delacruz@cvsu.edu.ph', position: 'President', isActive: true, joinedAt: '2023-06-01' },
    { id: 'off-2', userId: 'u-2', name: 'Maria Reyes', schoolId: '2022-1-00078', email: 'm.reyes@cvsu.edu.ph', position: 'Vice President', isActive: true, joinedAt: '2023-06-01' },
    { id: 'off-3', userId: 'u-3', name: 'Carlo Mendoza', schoolId: '2023-1-00112', email: 'c.mendoza@cvsu.edu.ph', position: 'Secretary', isActive: true, joinedAt: '2023-06-01' },
    { id: 'off-4', userId: 'u-5', name: 'Paolo Santos', schoolId: '2021-1-00023', email: 'p.santos@cvsu.edu.ph', position: 'Treasurer', isActive: false, joinedAt: '2022-06-01' },
    { id: 'off-5', userId: 'u-4', name: 'Ana Villanueva', schoolId: '2023-1-00134', email: 'a.villanueva@cvsu.edu.ph', position: 'Auditor', isActive: true, joinedAt: '2023-06-01' },
];

/* ----------------------------------------------------------------
   Page
   ---------------------------------------------------------------- */
export default function AdminOrgDetailPage() {
    // ── Org state
    const [org, setOrg] = useState<OrgProfile>(PLACEHOLDER_ORG);
    const [officers, setOfficers] = useState<Officer[]>(PLACEHOLDER_OFFICERS);

    // ── Edit profile modal
    const [showEditModal, setShowEditModal] = useState(false);
    const [editDraft, setEditDraft] = useState<OrgProfile>(org);

    // ── Accreditation confirm modal
    const [showAccredModal, setShowAccredModal] = useState(false);

    // ── Add officer modal
    const [showAddOfficerModal, setShowAddOfficerModal] = useState(false);
    const [addSchoolId, setAddSchoolId] = useState('');
    const [addPosition, setAddPosition] = useState('');
    const [addError, setAddError] = useState('');

    // ── Edit officer modal
    const [editingOfficer, setEditingOfficer] = useState<Officer | null>(null);
    const [editPosition, setEditPosition] = useState('');

    // ── Deactivate officer confirm
    const [deactivatingOfficer, setDeactivatingOfficer] = useState<Officer | null>(null);

    const activeOfficers = useMemo(() => officers.filter((o) => o.isActive), [officers]);
    const inactiveOfficers = useMemo(() => officers.filter((o) => !o.isActive), [officers]);

    /* ── Handlers ── */
    function handleSaveProfile() {
        setOrg(editDraft);
        setShowEditModal(false);
        // API: PATCH /api/admin/organizations/:id
    }

    function handleToggleAccreditation() {
        const next: AccreditationStatus = org.accreditationStatus === 'Active' ? 'Suspended' : 'Active';
        setOrg((prev) => ({
            ...prev,
            accreditationStatus: next,
            accreditedAt: new Date().toISOString(),
            accreditedBy: 'Current Overseer',
        }));
        setShowAccredModal(false);
        // API: PATCH /api/admin/organizations/:id/accreditation
    }

    function handleAddOfficer() {
        setAddError('');
        if (!addSchoolId.trim()) { setAddError('School ID is required.'); return; }
        if (!addPosition.trim()) { setAddError('Position is required.'); return; }
        // Simulate school_id lookup
        if (addSchoolId === '0000-0-00001') { setAddError('No user found with that School ID.'); return; }
        const newOfficer: Officer = {
            id: `off-${Date.now()}`,
            userId: `u-new-${Date.now()}`,
            name: 'Resolved Name', // Replace with API lookup result
            schoolId: addSchoolId,
            email: `${addSchoolId.replace(/-/g, '.')}@cvsu.edu.ph`,
            position: addPosition,
            isActive: true,
            joinedAt: new Date().toISOString().slice(0, 10),
        };
        setOfficers((prev) => [...prev, newOfficer]);
        setAddSchoolId('');
        setAddPosition('');
        setShowAddOfficerModal(false);
        // API: POST /api/admin/organizations/:id/officers
    }

    function handleEditOfficer() {
        if (!editingOfficer || !editPosition.trim()) return;
        setOfficers((prev) =>
            prev.map((o) => (o.id === editingOfficer.id ? { ...o, position: editPosition } : o))
        );
        setEditingOfficer(null);
        // API: PATCH /api/admin/organizations/:orgId/officers/:officerId
    }

    function handleDeactivateOfficer() {
        if (!deactivatingOfficer) return;
        setOfficers((prev) =>
            prev.map((o) => (o.id === deactivatingOfficer.id ? { ...o, isActive: false } : o))
        );
        setDeactivatingOfficer(null);
        // API: PATCH /api/admin/organizations/:orgId/officers/:officerId/deactivate
    }

    return (
        <AdminShell>
            <main className="flex flex-col gap-6 animate-fade-in">

                {/* ── Breadcrumb ── */}
                <nav className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    <a href="/admin/organizations" style={{ color: 'var(--color-primary-light)' }}>Organizations</a>
                    <span>/</span>
                    <span>{org.name}</span>
                </nav>

                {/* ── Page Header ── */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                        {/* Logo avatar */}
                        <div
                            className="w-16 h-16 rounded-xl flex items-center justify-center text-xl font-bold flex-shrink-0"
                            style={{ background: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}
                        >
                            {org.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-[22px] font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
                                    {org.name}
                                </h1>
                                <span className={`badge ${org.accreditationStatus === 'Active' ? 'badge-green' : 'badge-red'}`}>
                                    {org.accreditationStatus}
                                </span>
                                <span className="badge badge-blue">{org.category}</span>
                            </div>
                            <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                                Adviser: {org.adviser} · Founded {new Date(org.foundedDate).getFullYear()}
                            </p>
                        </div>
                    </div>
                    <button className="btn btn-outline btn-sm" onClick={() => { setEditDraft(org); setShowEditModal(true); }}>
                        <IconEdit /> Edit Profile
                    </button>
                </div>

                {/* ── Description ── */}
                <div className="card">
                    <div className="card-body">
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                            {org.description || <span style={{ color: 'var(--color-text-muted)' }}>No description provided.</span>}
                        </p>
                    </div>
                </div>

                {/* ── Accreditation Control ── */}
                <div className="card" style={{ borderColor: org.accreditationStatus === 'Active' ? 'var(--color-border)' : 'var(--color-error)' }}>
                    <div className="card-body flex items-center justify-between gap-4 flex-wrap">
                        <div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                Accreditation Status
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                                {org.accreditationStatus === 'Active'
                                    ? 'Organization is accredited and can publish events.'
                                    : 'Organization is suspended and cannot publish events.'}
                            </p>
                            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                                Last changed by <strong>{org.accreditedBy}</strong> on{' '}
                                {new Date(org.accreditedAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                        <button
                            className={`btn btn-sm ${org.accreditationStatus === 'Active' ? 'btn-danger' : 'btn-primary'}`}
                            onClick={() => setShowAccredModal(true)}
                        >
                            {org.accreditationStatus === 'Active' ? '⚠ Suspend Organization' : '✓ Restore Accreditation'}
                        </button>
                    </div>
                </div>

                {/* ── Officers Section ── */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-[16px] font-bold" style={{ color: 'var(--color-text)' }}>Officers</h2>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                            {activeOfficers.length} active · {inactiveOfficers.length} inactive
                        </p>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => { setAddSchoolId(''); setAddPosition(''); setAddError(''); setShowAddOfficerModal(true); }}>
                        <IconPlus /> Add Officer
                    </button>
                </div>

                {/* Active Officers Table */}
                <div className="card overflow-x-auto">
                    <table className="table-base">
                        <thead>
                            <tr>
                                <th>Officer</th>
                                <th>School ID</th>
                                <th>Position</th>
                                <th>Since</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {officers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                                        No officers assigned yet.
                                    </td>
                                </tr>
                            ) : (
                                officers.map((officer) => (
                                    <tr key={officer.id} style={{ opacity: officer.isActive ? 1 : 0.5 }}>
                                        <td>
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                                                    style={{ background: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}>
                                                    {officer.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{officer.name}</p>
                                                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{officer.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-sm font-mono" style={{ color: 'var(--color-text-secondary)' }}>{officer.schoolId}</td>
                                        <td className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{officer.position}</td>
                                        <td className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                                            {new Date(officer.joinedAt).toLocaleDateString('en-PH', { month: 'short', year: 'numeric' })}
                                        </td>
                                        <td>
                                            <span className={`badge ${officer.isActive ? 'badge-green' : 'badge-gray'}`}>
                                                {officer.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                {officer.isActive && (
                                                    <>
                                                        <button
                                                            className="btn btn-ghost btn-sm"
                                                            onClick={() => { setEditingOfficer(officer); setEditPosition(officer.position); }}
                                                        >
                                                            <IconEdit /> Edit
                                                        </button>
                                                        <button
                                                            className="btn btn-danger btn-sm"
                                                            onClick={() => setDeactivatingOfficer(officer)}
                                                        >
                                                            Remove
                                                        </button>
                                                    </>
                                                )}
                                                {!officer.isActive && (
                                                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Deactivated</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* ================================================================
                MODAL: Edit Profile
            ================================================================ */}
            {showEditModal && (
                <Modal title="Edit Organization Profile" onClose={() => setShowEditModal(false)}>
                    <div className="flex flex-col gap-4">
                        <div className="form-group">
                            <label className="form-label">Organization Name</label>
                            <input type="text" value={editDraft.name} onChange={(e) => setEditDraft((p) => ({ ...p, name: e.target.value }))} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea rows={4} value={editDraft.description} onChange={(e) => setEditDraft((p) => ({ ...p, description: e.target.value }))} style={{ resize: 'vertical' }} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Adviser</label>
                            <input type="text" value={editDraft.adviser} onChange={(e) => setEditDraft((p) => ({ ...p, adviser: e.target.value }))} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Logo URL</label>
                            <input type="text" value={editDraft.logoUrl} placeholder="https://..." onChange={(e) => setEditDraft((p) => ({ ...p, logoUrl: e.target.value }))} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="form-label">Category</label>
                                <select value={editDraft.category} onChange={(e) => setEditDraft((p) => ({ ...p, category: e.target.value as OrgCategory }))}>
                                    <option value="Academic">Academic</option>
                                    <option value="Non-Academic">Non-Academic</option>
                                    <option value="Religious">Religious</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Founded Date</label>
                                <input type="date" value={editDraft.foundedDate} onChange={(e) => setEditDraft((p) => ({ ...p, foundedDate: e.target.value }))} />
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end pt-2">
                            <button className="btn btn-ghost" onClick={() => setShowEditModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSaveProfile}>Save Changes</button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ================================================================
                MODAL: Accreditation Toggle Confirm
            ================================================================ */}
            {showAccredModal && (
                <Modal
                    title={org.accreditationStatus === 'Active' ? 'Suspend Organization?' : 'Restore Accreditation?'}
                    onClose={() => setShowAccredModal(false)}
                    danger={org.accreditationStatus === 'Active'}
                >
                    <div className="flex flex-col gap-4">
                        {org.accreditationStatus === 'Active' ? (
                            <>
                                <div className="rounded-lg p-4 text-sm" style={{ background: 'var(--color-error-light)', color: 'var(--color-error)' }}>
                                    <strong>Warning:</strong> Suspending this organization will immediately prevent all of their events from accepting new registrations. Existing registrations are unaffected.
                                </div>
                                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                                    You are about to suspend <strong>{org.name}</strong>. This action will be logged in the audit trail.
                                </p>
                            </>
                        ) : (
                            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                                You are about to restore accreditation for <strong>{org.name}</strong>. They will regain the ability to publish events. This action will be logged.
                            </p>
                        )}
                        <div className="flex gap-3 justify-end">
                            <button className="btn btn-ghost" onClick={() => setShowAccredModal(false)}>Cancel</button>
                            <button
                                className={`btn ${org.accreditationStatus === 'Active' ? 'btn-danger' : 'btn-primary'}`}
                                onClick={handleToggleAccreditation}
                            >
                                {org.accreditationStatus === 'Active' ? 'Confirm Suspension' : 'Confirm Restoration'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ================================================================
                MODAL: Add Officer
            ================================================================ */}
            {showAddOfficerModal && (
                <Modal title="Add Officer" onClose={() => setShowAddOfficerModal(false)}>
                    <div className="flex flex-col gap-4">
                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            Enter the student's School ID to look up their account and grant them officer access to this organization.
                        </p>
                        <div className="form-group">
                            <label className="form-label">School ID</label>
                            <input
                                type="text"
                                placeholder="e.g. 202405123"
                                value={addSchoolId}
                                onChange={(e) => setAddSchoolId(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Position / Title</label>
                            <input
                                type="text"
                                placeholder="e.g. President, Secretary, PIO"
                                value={addPosition}
                                onChange={(e) => setAddPosition(e.target.value)}
                            />
                        </div>
                        {addError && <p className="form-error">{addError}</p>}
                        <div className="flex gap-3 justify-end">
                            <button className="btn btn-ghost" onClick={() => setShowAddOfficerModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleAddOfficer}>Add Officer</button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ================================================================
                MODAL: Edit Officer Position
            ================================================================ */}
            {editingOfficer && (
                <Modal title="Edit Officer Position" onClose={() => setEditingOfficer(null)}>
                    <div className="flex flex-col gap-4">
                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            Editing position for <strong>{editingOfficer.name}</strong>.
                        </p>
                        <div className="form-group">
                            <label className="form-label">Position / Title</label>
                            <input
                                type="text"
                                value={editPosition}
                                onChange={(e) => setEditPosition(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button className="btn btn-ghost" onClick={() => setEditingOfficer(null)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleEditOfficer}>Save</button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ================================================================
                MODAL: Deactivate Officer Confirm
            ================================================================ */}
            {deactivatingOfficer && (
                <Modal title="Remove Officer?" onClose={() => setDeactivatingOfficer(null)} danger>
                    <div className="flex flex-col gap-4">
                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            You are about to remove <strong>{deactivatingOfficer.name}</strong> ({deactivatingOfficer.position}) as an officer of this organization. Their access to the management dashboard will be revoked immediately. The record is preserved for audit history.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button className="btn btn-ghost" onClick={() => setDeactivatingOfficer(null)}>Cancel</button>
                            <button className="btn btn-danger" onClick={handleDeactivateOfficer}>Yes, Remove Officer</button>
                        </div>
                    </div>
                </Modal>
            )}
        </AdminShell>
    );
}

/* ----------------------------------------------------------------
   Shared Modal Shell
   ---------------------------------------------------------------- */
function Modal({
    title,
    children,
    onClose,
    danger = false,
}: {
    title: string;
    children: React.ReactNode;
    onClose: () => void;
    danger?: boolean;
}) {
    return (
        <>
            <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-lg pointer-events-auto animate-fade-in">
                    <div
                        className="flex items-center justify-between px-6 py-4 border-b"
                        style={{ borderColor: danger ? 'var(--color-error)' : 'var(--color-border)' }}
                    >
                        <h3 className="text-base font-semibold" style={{ color: danger ? 'var(--color-error)' : 'var(--color-text)' }}>
                            {title}
                        </h3>
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={onClose}
                            aria-label="Close"
                            style={{ padding: '4px' }}
                        >
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

/* ----------------------------------------------------------------
   Icons
   ---------------------------------------------------------------- */
function IconEdit() {
    return (
        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none">
            <path d="M14.5 2.5a2.121 2.121 0 013 3L6 17l-4 1 1-4L14.5 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
function IconPlus() {
    return (
        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none">
            <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}