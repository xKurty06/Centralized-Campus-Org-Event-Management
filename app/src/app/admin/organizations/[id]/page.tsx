'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminShell from '@/components/AdminShell';
import { IconRefresh } from '@/components/ui/IconRefresh';

/* ----------------------------------------------------------------
   Types
   ---------------------------------------------------------------- */
type AccreditationStatus = 'Active' | 'Suspended';
type OrgCategory = 'Academic' | 'Non-Academic' | 'Religious';
type MemberStatus = 'Active' | 'Pending' | 'Inactive';
type FeeStatus = 'Paid' | 'Unpaid' | 'Partial';

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

interface Member {
    id: string;
    name: string;
    schoolId: string;
    email: string;
    status: MemberStatus;
    feeStatus: FeeStatus;
    joinedAt: string;
}

interface OrgProfile {
    id: string;
    slug?: string;
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
    { id: 'off-1', userId: 'u-1', name: 'Juan Dela Cruz', schoolId: '202205045', email: 'j.delacruz@cvsu.edu.ph', position: 'President', isActive: true, joinedAt: '2023-06-01' },
    { id: 'off-2', userId: 'u-2', name: 'Maria Reyes', schoolId: '202205078', email: 'm.reyes@cvsu.edu.ph', position: 'Vice President', isActive: true, joinedAt: '2023-06-01' },
    { id: 'off-3', userId: 'u-3', name: 'Carlo Mendoza', schoolId: '202305112', email: 'c.mendoza@cvsu.edu.ph', position: 'Secretary', isActive: true, joinedAt: '2023-06-01' },
    { id: 'off-4', userId: 'u-5', name: 'Paolo Santos', schoolId: '202105023', email: 'p.santos@cvsu.edu.ph', position: 'Treasurer', isActive: false, joinedAt: '2022-06-01' },
    { id: 'off-5', userId: 'u-4', name: 'Ana Villanueva', schoolId: '202305134', email: 'a.villanueva@cvsu.edu.ph', position: 'Auditor', isActive: true, joinedAt: '2023-06-01' },
];

/* ----------------------------------------------------------------
   Page
   ---------------------------------------------------------------- */
export default function AdminOrgDetailPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v1';
    const API_ORIGIN = (() => {
        try {
            return new URL(API_BASE_URL).origin;
        } catch {
            return 'http://localhost:8000';
        }
    })();
    const normalizeImageUrl = (raw?: string | null): string => {
        if (!raw) return '';
        const value = String(raw).trim();
        if (!value) return '';
        if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('//')) return value;
        const path = value.startsWith('/') ? value : `/${value}`;
        return `${API_ORIGIN}${path}`;
    };
    const orgId = String(params?.id ?? '');
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    // ── Org state
    const [org, setOrg] = useState<OrgProfile>({
        id: '',
        name: '',
        description: '',
        logoUrl: '',
        adviser: '',
        foundedDate: '',
        category: 'Non-Academic',
        accreditationStatus: 'Suspended',
        accreditedBy: '',
        accreditedAt: new Date().toISOString(),
    });
    const [officers, setOfficers] = useState<Officer[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [memberGrowth, setMemberGrowth] = useState<Array<{ month: string; value: number }>>([]);

    // ── Edit profile modal
    const [showEditModal, setShowEditModal] = useState(false);
    const [editDraft, setEditDraft] = useState<OrgProfile>(org);
    const [editLogoFile, setEditLogoFile] = useState<File | null>(null);
    const [editLogoPreviewUrl, setEditLogoPreviewUrl] = useState('');
    const [logoFileError, setLogoFileError] = useState('');
    const [selectedLogoName, setSelectedLogoName] = useState('');
    const [selectedLogoSize, setSelectedLogoSize] = useState('');
    const [selectedLogoDimensions, setSelectedLogoDimensions] = useState('');

    // ── Accreditation confirm modal
    const [showAccredModal, setShowAccredModal] = useState(false);
    const [accreditationReason, setAccreditationReason] = useState('');
    const [accreditationError, setAccreditationError] = useState('');

    // ── Add officer modal
    const [showAddOfficerModal, setShowAddOfficerModal] = useState(false);
    const [addSchoolId, setAddSchoolId] = useState('');
    const [addLookupState, setAddLookupState] = useState<'idle' | 'loading' | 'found' | 'not_found' | 'error'>('idle');
    const [addLookupResult, setAddLookupResult] = useState<{
        userId: string;
        schoolId: string;
        firstName: string;
        lastName: string;
        email: string;
        course: string;
        dept: string;
        yearLevel: number | string;
        section: number | string;
    } | null>(null);
    const [addPosition, setAddPosition] = useState('');
    const [addError, setAddError] = useState('');
    const [addLookupError, setAddLookupError] = useState('');

    // ── Edit officer modal
    const [editingOfficer, setEditingOfficer] = useState<Officer | null>(null);
    const [editPosition, setEditPosition] = useState('');

    // ── Deactivate officer confirm
    const [deactivatingOfficer, setDeactivatingOfficer] = useState<Officer | null>(null);
    const [officerRemovalReason, setOfficerRemovalReason] = useState('');
    const [officerRemovalError, setOfficerRemovalError] = useState('');

    // ── Members modal
    const [showMembersModal, setShowMembersModal] = useState(false);

    const activeOfficers = useMemo(() => officers.filter((o) => o.isActive), [officers]);
    const inactiveOfficers = useMemo(() => officers.filter((o) => !o.isActive), [officers]);

    const memberStats = {
        total: members.length,
        active: members.filter((m) => m.status === 'Active').length,
        pending: members.filter((m) => m.status === 'Pending').length,
        inactive: members.filter((m) => m.status === 'Inactive').length,
    };

    const maxGrowth = Math.max(1, ...memberGrowth.map((m) => m.value));

    function mapGrowthRows(rows: any[]): Array<{ month: string; value: number }> {
        return rows.map((g: any) => {
            const monthKey = String(g.month ?? g.month_key ?? '');
            const monthLabel = monthKey.length >= 7
                ? new Date(`${monthKey}-01T00:00:00`).toLocaleDateString('en-PH', { month: 'short' })
                : monthKey || '-';
            return { month: monthLabel, value: Number(g.joined_count ?? g.value ?? 0) };
        });
    }

    async function fetchMemberGrowth(token: string): Promise<Array<{ month: string; value: number }>> {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/organizations/${orgId}/members/growth`, {
                headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
            });
            const payload = await res.json().catch(() => null) as any;
            if (!res.ok || !payload?.success) return [];
            const rows = Array.isArray(payload?.data) ? payload.data : [];
            return mapGrowthRows(rows);
        } catch {
            return [];
        }
    }

    async function fetchOrgDetails(showLoading = true, showRefreshing = false) {
        const token = window.localStorage.getItem('auth_token') ?? window.sessionStorage.getItem('auth_token');
        if (!token) {
            router.push('/');
            return;
        }

        if (showLoading) setIsLoading(true);
        if (showRefreshing) setRefreshing(true);
        setErrorMsg('');

        try {
            const res = await fetch(`${API_BASE_URL}/admin/organizations/${orgId}`, {
                headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
            });
            const payload = await res.json().catch(() => null) as any;
            if (!res.ok || !payload?.success) {
                setErrorMsg(payload?.error ?? 'Unable to load organization details.');
                return;
            }

            const data = payload.data ?? {};
            const rawOrg = data.org ?? {};
            const rawOfficers = Array.isArray(data.officers) ? data.officers : [];
            const rawMembers = Array.isArray(data.members) ? data.members : [];
            const rawMemberGrowth = Array.isArray(data.member_growth) ? data.member_growth : [];

            const nextOrg: OrgProfile = {
                id: String(rawOrg.id ?? orgId),
                slug: rawOrg.slug ? String(rawOrg.slug) : String(rawOrg.id ?? orgId),
                name: String(rawOrg.name ?? ''),
                description: String(rawOrg.description ?? ''),
                logoUrl: normalizeImageUrl(rawOrg.logo_url ?? ''),
                adviser: String(rawOrg.adviser ?? 'N/A'),
                foundedDate: String(rawOrg.founded_date ?? rawOrg.created_at ?? '').slice(0, 10),
                category: (String(rawOrg.category_name ?? 'Non-Academic') as OrgCategory),
                accreditationStatus: String(rawOrg.accreditation_status ?? '').toLowerCase() === 'active' ? 'Active' : 'Suspended',
                accreditedBy: String(rawOrg.accredited_by_name ?? 'N/A'),
                accreditedAt: String(rawOrg.accredited_at ?? rawOrg.updated_at ?? new Date().toISOString()),
            };

            const nextOfficers: Officer[] = rawOfficers.map((o: any) => ({
                id: String(o.id ?? ''),
                userId: String(o.user_id ?? ''),
                name: String(o.user_name ?? o.name ?? 'Unknown'),
                schoolId: String(o.user_school_id ?? o.school_id ?? ''),
                email: String(o.user_email ?? o.email ?? ''),
                position: String(o.position ?? o.role ?? ''),
                isActive: Boolean(o.is_active ?? true),
                joinedAt: String(o.created_at ?? '').slice(0, 10),
            }));
            const nextMembers: Member[] = rawMembers.map((m: any) => ({
                id: String(m.id ?? ''),
                name: String(`${m.first_name ?? ''} ${m.last_name ?? ''}`.trim() || m.name || 'Unknown'),
                schoolId: String(m.school_id ?? ''),
                email: String(m.email ?? ''),
                status: (String(m.membership_status ?? 'Pending') as MemberStatus),
                feeStatus: m.paid_membership_fee ? 'Paid' : 'Unpaid',
                joinedAt: String(m.joined_at ?? m.created_at ?? '').slice(0, 10),
            }));
            const nextMemberGrowth = mapGrowthRows(rawMemberGrowth);
            const growthFromEndpoint = await fetchMemberGrowth(token);

            setOrg(nextOrg);
            setEditDraft(nextOrg);
            setOfficers(nextOfficers);
            setMembers(nextMembers);
            setMemberGrowth(growthFromEndpoint.length > 0 ? growthFromEndpoint : nextMemberGrowth);
        } finally {
            if (showLoading) setIsLoading(false);
            if (showRefreshing) setRefreshing(false);
        }
    }

    useEffect(() => {
        let isCancelled = false;

        async function fetchSafe() {
            if (isCancelled || !orgId) return;
            const token = window.localStorage.getItem('auth_token') ?? window.sessionStorage.getItem('auth_token');
            if (!token) {
                router.push('/');
                return;
            }
            await fetchOrgDetails(true, false);
        }
        fetchSafe();
        return () => { isCancelled = true; };
    }, [API_BASE_URL, orgId, router]);

    /* Handlers */
    async function handleSaveProfile() {
        const token = window.localStorage.getItem('auth_token') ?? window.sessionStorage.getItem('auth_token');
        if (!token) return;

        setIsSaving(true);
        setErrorMsg('');
        try {
            const hasNewLogoFile = Boolean(editLogoFile);
            const payload = hasNewLogoFile ? new FormData() : null;

            if (hasNewLogoFile && payload instanceof FormData) {
                payload.append('logo_file', editLogoFile as File);
            }

            if (payload instanceof FormData) {
                payload.append('name', editDraft.name);
                payload.append('description', editDraft.description);
                payload.append('adviser', editDraft.adviser);
            }

            const requestOptions: RequestInit = {
                method: 'PUT',
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: payload instanceof FormData ? payload : JSON.stringify({
                    name: editDraft.name,
                    description: editDraft.description,
                    logo_url: editDraft.logoUrl,
                    adviser: editDraft.adviser,
                }),
            };

            if (!(payload instanceof FormData)) {
                requestOptions.headers = {
                    ...requestOptions.headers,
                    'Content-Type': 'application/json',
                };
            }

            const res = await fetch(`${API_BASE_URL}/admin/organizations/${orgId}`, requestOptions);
            const payloadData = await res.json().catch(() => null) as any;
            if (!res.ok || !payloadData?.success) {
                setErrorMsg(payloadData?.error ?? 'Unable to save organization profile.');
                return;
            }
            if (hasNewLogoFile) {
                await fetchOrgDetails(false, false);
            } else {
                setOrg(editDraft);
            }
            setShowEditModal(false);
        } finally {
            setIsSaving(false);
        }
    }

    function handleLogoFileChange(file: File | null) {
        setLogoFileError('');
        if (!file) {
            setEditLogoFile(null);
            setSelectedLogoName('');
            setSelectedLogoSize('');
            setSelectedLogoDimensions('');
            return;
        }

        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        const extOk = /\.(jpg|jpeg|png|webp)$/i.test(file.name);
        if (!allowed.includes(file.type) || !extOk) {
            setEditLogoFile(null);
            setSelectedLogoName('');
            setSelectedLogoSize('');
            setSelectedLogoDimensions('');
            setLogoFileError('Invalid file type. Please upload JPG, JPEG, PNG, or WEBP only.');
            return;
        }

        const maxBytes = 5 * 1024 * 1024;
        if (file.size > maxBytes) {
            setEditLogoFile(null);
            setSelectedLogoName('');
            setSelectedLogoSize('');
            setSelectedLogoDimensions('');
            setLogoFileError('File is too large. Maximum allowed size is 5MB.');
            return;
        }

        setEditLogoFile(file);
        setSelectedLogoName(file.name);
        setSelectedLogoSize(file.size < 1024 * 1024
            ? `${Math.max(1, Math.round(file.size / 1024))} KB`
            : `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        );

        const previewUrl = URL.createObjectURL(file);
        setEditLogoPreviewUrl(previewUrl);

        const img = new Image();
        img.onload = () => {
            setSelectedLogoDimensions(`${img.naturalWidth}x${img.naturalHeight}px`);
            URL.revokeObjectURL(previewUrl);
        };
        img.onerror = () => {
            setSelectedLogoDimensions('');
            URL.revokeObjectURL(previewUrl);
        };
        img.src = previewUrl;
    }

    async function handleToggleAccreditation() {
        const token = window.localStorage.getItem('auth_token') ?? window.sessionStorage.getItem('auth_token');
        if (!token) return;

        const next: AccreditationStatus = org.accreditationStatus === 'Active' ? 'Suspended' : 'Active';
        if (!accreditationReason.trim()) {
            setAccreditationError(next === 'Suspended'
                ? 'Please provide a reason for suspension.'
                : 'Please provide a reason for restoration.');
            return;
        }

        setIsSaving(true);
        setErrorMsg('');
        setAccreditationError('');
        try {
            const payloadBody: any = { accreditation_status: next, reason: accreditationReason.trim() };

            const res = await fetch(`${API_BASE_URL}/admin/organizations/${orgId}/accreditation`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payloadBody),
            });
            const payload = await res.json().catch(() => null) as any;
            if (!res.ok || !payload?.success) {
                setErrorMsg(payload?.error ?? 'Unable to update accreditation status.');
                return;
            }

            setOrg((prev) => ({ ...prev, accreditationStatus: next, accreditedAt: new Date().toISOString() }));
            setShowAccredModal(false);
            setAccreditationReason('');
        } finally {
            setIsSaving(false);
        }
    }

    const STUDENT_ID_PATTERN = /^\d{9}$/;

    async function handleLookupOfficer() {
        const queryId = addSchoolId.trim();
        if (!queryId) {
            setAddLookupError('Please enter a Student ID to search.');
            setAddLookupState('idle');
            return;
        }
        if (!STUDENT_ID_PATTERN.test(queryId)) {
            setAddLookupError('Student ID must be exactly 9 digits.');
            setAddLookupState('idle');
            return;
        }

        setAddLookupState('loading');
        setAddLookupError('');
        setAddError('');
        setAddLookupResult(null);

        try {
            const token = window.localStorage.getItem('auth_token') ?? window.sessionStorage.getItem('auth_token');
            if (!token) {
                throw new Error('You are not authenticated. Please sign in again.');
            }

            const res = await fetch(`${API_BASE_URL}/admin/users/lookup?school_id=${encodeURIComponent(queryId)}`, {
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                if (res.status === 404) {
                    setAddLookupState('not_found');
                    setAddLookupError('No active user found with that Student ID.');
                    return;
                }

                const payload = await res.json().catch(() => null) as any;
                throw new Error(payload?.error || payload?.message || res.statusText || 'Lookup failed.');
            }

            const payload = await res.json().catch(() => null) as any;
            const user = payload?.data || payload?.user || payload;
            if (!user || !(user.user_id || user.id)) {
                throw new Error('Invalid user data received from the server.');
            }

            setAddLookupResult({
                userId: String(user.user_id ?? user.id),
                schoolId: String(user.school_id ?? ''),
                firstName: String(user.first_name ?? ''),
                lastName: String(user.last_name ?? ''),
                email: String(user.email ?? ''),
                course: String(user.course ?? user.course_code ?? ''),
                dept: String(user.dept ?? user.dept_code ?? ''),
                yearLevel: user.year_level ?? '',
                section: user.section ?? '',
            });
            setAddLookupState('found');
        } catch (error: any) {
            setAddLookupState('error');
            setAddLookupError(error?.message || 'Lookup failed.');
        }
    }

    function handleClearOfficerLookup() {
        setAddLookupState('idle');
        setAddLookupResult(null);
        setAddLookupError('');
        setAddError('');
    }

    async function handleAddOfficer() {
        setAddError('');
        setAddLookupError('');
        const queryId = addSchoolId.trim();
        if (!queryId) {
            setAddError('Please enter a Student ID first.');
            return;
        }
        if (!STUDENT_ID_PATTERN.test(queryId)) {
            setAddError('Student ID must be exactly 9 digits.');
            return;
        }
        if (!addLookupResult) {
            setAddError('Look up a student first.');
            return;
        }
        if (!addPosition.trim()) {
            setAddError('Please enter a position/title.');
            return;
        }

        const token = window.localStorage.getItem('auth_token') ?? window.sessionStorage.getItem('auth_token');
        if (!token) return;

        setIsSaving(true);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/organizations/${orgId}/officers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    user_id: addLookupResult.userId,
                    position: addPosition.trim(),
                }),
            });
            const payload = await res.json().catch(() => null) as any;
            if (!res.ok || !payload?.success) {
                setAddError(payload?.error ?? 'Unable to add officer.');
                return;
            }

            await fetchOrgDetails(false, true);
            setAddSchoolId('');
            setAddPosition('');
            handleClearOfficerLookup();
            setShowAddOfficerModal(false);
        } finally {
            setIsSaving(false);
        }
    }

    function handleEditOfficer() {
        if (!editingOfficer || !editPosition.trim()) return;
        setOfficers((prev) =>
            prev.map((o) => (o.id === editingOfficer.id ? { ...o, position: editPosition } : o))
        );
        setEditingOfficer(null);
        // API: PATCH /api/admin/organizations/:orgId/officers/:officerId
    }

    async function handleDeactivateOfficer() {
        if (!deactivatingOfficer) return;
        if (!officerRemovalReason.trim()) {
            setOfficerRemovalError('Please provide a reason for removing this officer.');
            return;
        }

        const token = window.localStorage.getItem('auth_token') ?? window.sessionStorage.getItem('auth_token');
        if (!token) return;

        setIsSaving(true);
        setErrorMsg('');
        setOfficerRemovalError('');

        try {
            const res = await fetch(`${API_BASE_URL}/admin/organizations/${orgId}/officers/${deactivatingOfficer.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ reason: officerRemovalReason.trim() }),
            });

            const payload = await res.json().catch(() => null) as any;
            if (!res.ok || !payload?.success) {
                setErrorMsg(payload?.error ?? 'Unable to remove officer.');
                return;
            }

            await fetchOrgDetails(false, true);
            setDeactivatingOfficer(null);
            setOfficerRemovalReason('');
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <AdminShell>
            <main className="flex flex-col gap-6 animate-fade-in">
                {errorMsg && (
                    <div className="rounded-lg border px-4 py-3 text-sm" style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)' }}>
                        {errorMsg}
                    </div>
                )}
                {isLoading && (
                    <div className="rounded-lg border px-4 py-3 text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                        Loading organization details...
                    </div>
                )}

                {/* ── Breadcrumb ── */}
                <div className="flex flex-col gap-4">
                    <Link
                        href="/admin/organizations"
                        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors no-underline w-fit"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M15 19l-7-7 7-7"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        Back to Organizations
                    </Link>

                    {/* ── Page Header ── */}
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-4">
                            {org.logoUrl ? (
                                <img
                                    src={org.logoUrl}
                                    alt={`${org.name} logo`}
                                    className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                                />
                            ) : (
                                <div
                                    className="w-16 h-16 rounded-xl flex items-center justify-center text-xl font-bold flex-shrink-0"
                                    style={{ background: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}
                                >
                                    {org.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                                </div>
                            )}
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1 className="text-[22px] font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
                                        {org.name}
                                    </h1>
                                    <span className={`badge ${org.accreditationStatus === 'Active' ? 'badge-green' : 'badge-red'}`}>
                                        {org.accreditationStatus}
                                    </span>
                                    <span className={`badge ${org.category === 'Academic' ? 'badge-blue' : org.category === 'Non-Academic' ? 'badge-gray' : 'badge-yellow'}`}>
                                        {org.category}
                                    </span>
                                </div>
                                <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                                    Adviser: {org.adviser}
                                </p>
                                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                                    Est. {new Date(org.foundedDate).getFullYear()}
                                </p>
                            </div>
                        </div>
                                        <button
                            className="btn btn-outline btn-sm"
                            onClick={() => {
                                setEditDraft(org);
                                setEditLogoFile(null);
                                setEditLogoPreviewUrl('');
                                setLogoFileError('');
                                setSelectedLogoName('');
                                setSelectedLogoSize('');
                                setSelectedLogoDimensions('');
                                setShowEditModal(true);
                            }}
                        >
                            <IconEdit /> Edit Profile
                        </button>
                    </div>
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
                            onClick={() => {
                                setAccreditationReason('');
                                setAccreditationError('');
                                setShowAccredModal(true);
                            }}
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
                    <button className="btn btn-primary btn-sm" onClick={() => { setAddSchoolId(''); setAddPosition(''); setAddError(''); handleClearOfficerLookup(); setShowAddOfficerModal(true); }}>
                        <IconPlus /> Add Officer
                    </button>
                </div>

                {/* Active Officers Table */}
                <div className="card overflow-x-auto">
                    <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
                        <h3 className="text-[15px] font-semibold text-[var(--color-text)]">Officers Table</h3>
                        <button
                            className="p-0 bg-transparent border-0 cursor-pointer inline-flex items-center justify-center text-[var(--color-primary)] hover:text-[var(--color-primary-light)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => fetchOrgDetails(false, true)}
                            disabled={refreshing || isLoading}
                            aria-label="Refresh officers table"
                            title="Refresh officers table"
                        >
                            <IconRefresh spinning={refreshing} />
                        </button>
                    </div>
                    <table className="table-base">
                        <thead>
                            <tr>
                                <th>Officer</th>
                                <th>Student ID</th>
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
                                                <div
                                                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                                                    style={{ background: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}
                                                >
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

                {/* ── Members Overview ── */}
                <div className="card">
                    <div className="card-body flex flex-col gap-5">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div>
                                <h2 className="text-[16px] font-bold" style={{ color: 'var(--color-text)' }}>
                                    Members
                                </h2>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                                    Read-only oversight view of organization membership data.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={() => setShowMembersModal(true)}
                            >
                                View Member Roster
                            </button>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                                    Total Members
                                </p>
                                <p className="mt-1 text-[22px] font-bold text-[var(--color-text)]">
                                    {memberStats.total}
                                </p>
                            </div>

                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                                    Active
                                </p>
                                <p className="mt-1 text-[22px] font-bold text-emerald-700">
                                    {memberStats.active}
                                </p>
                            </div>

                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">
                                    Pending
                                </p>
                                <p className="mt-1 text-[22px] font-bold text-amber-700">
                                    {memberStats.pending}
                                </p>
                            </div>

                            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                    Inactive
                                </p>
                                <p className="mt-1 text-[22px] font-bold text-gray-600">
                                    {memberStats.inactive}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-5 items-start">
                            <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
                                <div className="flex items-center justify-between gap-3 mb-4">
                                    <div>
                                        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                            Membership Growth Trend
                                        </h3>
                                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                                            Monthly member joins based on organization records.
                                        </p>
                                    </div>
                                    <span className="badge badge-blue">Monthly</span>
                                </div>

                                {memberGrowth.length === 0 ? (
                                    <div className="h-56 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-2)] flex items-center justify-center text-center px-4">
                                        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                                            No membership growth data yet.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex items-end gap-3 h-56">
                                        {memberGrowth.map((item) => {
                                            const heightPct = (item.value / maxGrowth) * 100;

                                            return (
                                                <div key={item.month} className="flex-1 flex flex-col items-center gap-2">
                                                    <div className="w-full h-44 flex items-end">
                                                        <div
                                                            className="w-full rounded-t-lg bg-[var(--color-primary)]/90"
                                                            style={{ height: `${heightPct}%` }}
                                                        />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-[11px] font-semibold text-[var(--color-text)]">
                                                            {item.value}
                                                        </p>
                                                        <p className="text-[10px] text-[var(--color-text-muted)]">
                                                            {item.month}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 min-w-[220px]">
                                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
                                    Member Status
                                </h3>

                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between gap-3 rounded-xl bg-white border border-[var(--color-border)] px-3 py-2">
                                        <span className="text-sm text-[var(--color-text-secondary)]">Active rate</span>
                                        <span className="text-sm font-semibold text-emerald-700">
                                            {memberStats.total > 0 ? Math.round((memberStats.active / memberStats.total) * 100) : 0}%
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between gap-3 rounded-xl bg-white border border-[var(--color-border)] px-3 py-2">
                                        <span className="text-sm text-[var(--color-text-secondary)]">Pending rate</span>
                                        <span className="text-sm font-semibold text-amber-700">
                                            {memberStats.total > 0 ? Math.round((memberStats.pending / memberStats.total) * 100) : 0}%
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between gap-3 rounded-xl bg-white border border-[var(--color-border)] px-3 py-2">
                                        <span className="text-sm text-[var(--color-text-secondary)]">Inactive rate</span>
                                        <span className="text-sm font-semibold text-gray-600">
                                            {memberStats.total > 0 ? Math.round((memberStats.inactive / memberStats.total) * 100) : 0}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* ================================================================
                MODAL: Members Read-Only Roster
            ================================================================ */}
            {showMembersModal && (
                <Modal
                    title="Member Roster"
                    onClose={() => setShowMembersModal(false)}
                    size="xl"
                >
                    <div className="flex flex-col gap-4 max-h-[75vh] overflow-hidden">
                        <div className="rounded-lg p-4 text-sm border border-[var(--color-border)] bg-[var(--color-surface-2)]">
                            <strong>Read-only view.</strong> Overseers can view member information here, but fee toggling remains an officer-only action.
                        </div>

                        <div className="overflow-x-auto overflow-y-auto rounded-xl border border-[var(--color-border)] max-h-[58vh]">
                            <table className="table-base min-w-[900px]">
                                <thead className="sticky top-0 z-10 bg-[var(--color-surface)]">
                                    <tr>
                                        <th>Member</th>
                                        <th>Student ID</th>
                                        <th>Status</th>
                                        <th>Fee Status</th>
                                        <th>Joined</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {members.map((member) => (
                                        <tr key={member.id}>
                                            <td>
                                                <div>
                                                    <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                                                        {member.name}
                                                    </p>
                                                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                                        {member.email}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="text-sm font-mono" style={{ color: 'var(--color-text-secondary)' }}>
                                                {member.schoolId}
                                            </td>
                                            <td>
                                                <span
                                                    className={`badge ${member.status === 'Active'
                                                        ? 'badge-green'
                                                        : member.status === 'Pending'
                                                            ? 'badge-blue'
                                                            : 'badge-gray'
                                                        }`}
                                                >
                                                    {member.status}
                                                </span>
                                            </td>
                                            <td>
                                                <span
                                                    className={`badge ${member.feeStatus === 'Paid'
                                                        ? 'badge-green'
                                                        : member.feeStatus === 'Partial'
                                                            ? 'badge-blue'
                                                            : 'badge-red'
                                                        }`}
                                                >
                                                    {member.feeStatus}
                                                </span>
                                            </td>
                                            <td className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                                                {new Date(member.joinedAt).toLocaleDateString('en-PH', {
                                                    month: 'short',
                                                    year: 'numeric',
                                                    day: 'numeric',
                                                })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex gap-3 justify-end pt-1">
                            <button className="btn btn-ghost" onClick={() => setShowMembersModal(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

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
                            <label htmlFor="logoFile" className="form-label">
                                Organization Logo
                            </label>
                            <input
                                id="logoFile"
                                type="file"
                                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                                onChange={(e) => handleLogoFileChange(e.target.files?.[0] ?? null)}
                                className="sr-only"
                            />
                            <label
                                htmlFor="logoFile"
                                className="mt-1 w-[180px] h-[180px] rounded-[--radius-md] border-2 border-dashed p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors relative overflow-hidden"
                                style={{
                                    borderColor: 'var(--color-border)',
                                    background: 'var(--color-surface-2)',
                                }}
                            >
                                {editDraft.logoUrl && (
                                    <span
                                        className="absolute bottom-0.5 item-center text-xs px-2 py-0.5 cursor-pointer bg-black/50 text-white hover:opacity-100 transition-opacity"
                                        title="Click to replace logo"
                                    >
                                        Click to replace
                                    </span>
                                )}

                                {(editLogoPreviewUrl || editDraft.logoUrl) ? (
                                    <img
                                        src={editLogoPreviewUrl || editDraft.logoUrl}
                                        alt="Selected organization logo"
                                        className="w-full h-full object-cover rounded-[--radius-sm]"
                                    />
                                ) : (
                                    <>
                                        <svg
                                            width="26"
                                            height="26"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            style={{ color: 'var(--color-text-muted)' }}
                                        >
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                            <polyline points="17 8 12 3 7 8" />
                                            <line x1="12" y1="3" x2="12" y2="15" />
                                        </svg>
                                        <p className="text-sm font-medium text-center" style={{ color: 'var(--color-text)' }}>
                                            Drag file here or{' '}
                                            <span style={{ color: 'var(--color-primary)' }}>
                                                Browse image
                                            </span>
                                        </p>
                                        <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
                                            JPG, JPEG, PNG, WEBP up to 5MB
                                        </p>
                                    </>
                                )}
                            </label>
                            <p className="form-hint">
                                Optional. Allowed: JPG, JPEG, PNG, WEBP. Max size: 5MB.
                            </p>
                            {selectedLogoName && (
                                <p className="form-hint">
                                    Selected: <strong>{selectedLogoName}</strong>
                                    {selectedLogoSize ? ` (${selectedLogoSize})` : ''}
                                    {selectedLogoDimensions ? ` - ${selectedLogoDimensions}` : ''}
                                </p>
                            )}
                            {logoFileError && (
                                <div className="text-sm text-red-600" role="alert">
                                    {logoFileError}
                                </div>
                            )}
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
                            <button className="btn btn-primary" onClick={handleSaveProfile} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</button>
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
                                <div className="form-group">
                                    <label className="form-label">Reason for suspension</label>
                                    <textarea
                                        rows={4}
                                        value={accreditationReason}
                                        onChange={(e) => setAccreditationReason(e.target.value)}
                                        placeholder="Explain why this organization is being suspended"
                                        style={{ resize: 'vertical' }}
                                    />
                                </div>
                                {accreditationError && <p className="form-error">{accreditationError}</p>}
                            </>
                        ) : (
                            <>
                                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                                    You are about to restore accreditation for <strong>{org.name}</strong>. They will regain the ability to publish events. This action will be logged.
                                </p>
                                <div className="form-group">
                                    <label className="form-label">Reason for restoration</label>
                                    <textarea
                                        rows={4}
                                        value={accreditationReason}
                                        onChange={(e) => { setAccreditationReason(e.target.value); setAccreditationError(''); }}
                                        placeholder="Explain why this organization is being restored"
                                        style={{ resize: 'vertical' }}
                                    />
                                </div>
                                {accreditationError && <p className="form-error">{accreditationError}</p>}
                            </>
                        )}
                        <div className="flex gap-3 justify-end">
                            <button className="btn btn-ghost" onClick={() => setShowAccredModal(false)}>Cancel</button>
                            <button
                                className={`btn ${org.accreditationStatus === 'Active' ? 'btn-danger' : 'btn-primary'}`}
                                onClick={handleToggleAccreditation}
                                disabled={isSaving}
                            >
                                {isSaving ? 'Saving...' : org.accreditationStatus === 'Active' ? 'Confirm Suspension' : 'Confirm Restoration'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ================================================================
                MODAL: Add Officer
            ================================================================ */}
            {showAddOfficerModal && (
                <Modal title="Add Officer" onClose={() => { setShowAddOfficerModal(false); handleClearOfficerLookup(); }}>
                    <div className="flex flex-col gap-4">
                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            Enter the student's Student ID to look up their account and grant them officer access to this organization.
                        </p>
                        <div className="form-group">
                            <label className="form-label">Student ID</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="text"
                                    placeholder="e.g. 202405123"
                                    value={addSchoolId}
                                    onChange={(e) => {
                                        const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
                                        if (addLookupState !== 'idle') {
                                            handleClearOfficerLookup();
                                            setAddSchoolId(digits);
                                            return;
                                        }
                                        setAddSchoolId(digits);
                                    }}
                                />
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={handleLookupOfficer}
                                    disabled={addLookupState === 'loading' || !STUDENT_ID_PATTERN.test(addSchoolId)}
                                    aria-label="Look up student"
                                    title="Look up student"
                                >
                                    {addLookupState === 'loading' ? (
                                        'Searching...'
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5">
                                            <IconLookup />
                                            Look up
                                        </span>
                                    )}
                                </button>
                            </div>
                            {addLookupError && <p className="form-error">{addLookupError}</p>}
                        </div>

                        {addLookupState === 'found' && addLookupResult && (
                            <div
                                className="rounded-[--radius-md] p-4 flex items-center gap-3 animate-fade-in"
                                style={{
                                    background: 'var(--color-primary-muted)',
                                    border: '1.5px solid var(--color-primary-light)',
                                }}
                            >
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                                    style={{ background: 'var(--color-primary-light)', color: '#fff' }}
                                >
                                    {`${addLookupResult.firstName?.[0] ?? ''}${addLookupResult.lastName?.[0] ?? ''}`.toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                                        {addLookupResult.firstName} {addLookupResult.lastName}
                                    </p>
                                    <p className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>
                                        {addLookupResult.schoolId} • {addLookupResult.email}
                                    </p>
                                    <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                                        {addLookupResult.course || 'N/A'} • {addLookupResult.dept || 'N/A'} • Y{addLookupResult.yearLevel || '?'}-{addLookupResult.section || '?'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-sm shrink-0"
                                    onClick={handleClearOfficerLookup}
                                    style={{ color: 'var(--color-primary)' }}
                                >
                                    Change
                                </button>
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">Position / Title</label>
                            <input
                                type="text"
                                placeholder="e.g. President, Secretary, PIO"
                                value={addPosition}
                                onChange={(e) => setAddPosition(e.target.value)}
                                disabled={addLookupState !== 'found'}
                            />
                        </div>
                        {addError && <p className="form-error">{addError}</p>}
                        <div className="flex gap-3 justify-end">
                            <button className="btn btn-ghost" onClick={() => { setShowAddOfficerModal(false); handleClearOfficerLookup(); }}>
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleAddOfficer}
                                disabled={isSaving}
                            >
                                {isSaving ? 'Adding...' : 'Add Officer'}
                            </button>
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
                        <div className="form-group">
                            <label className="form-label">Reason for removal</label>
                            <textarea
                                rows={4}
                                value={officerRemovalReason}
                                onChange={(e) => { setOfficerRemovalReason(e.target.value); setOfficerRemovalError(''); }}
                                placeholder="Explain why this officer is being removed"
                                style={{ resize: 'vertical' }}
                            />
                        </div>
                        {officerRemovalError && <p className="form-error">{officerRemovalError}</p>}
                        <div className="flex gap-3 justify-end">
                            <button className="btn btn-ghost" onClick={() => { setDeactivatingOfficer(null); setOfficerRemovalReason(''); setOfficerRemovalError(''); }}>
                                Cancel
                            </button>
                            <button className="btn btn-danger" onClick={handleDeactivateOfficer} disabled={isSaving}>
                                {isSaving ? 'Removing...' : 'Yes, Remove Officer'}
                            </button>
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
    size = 'lg',
}: {
    title: string;
    children: React.ReactNode;
    onClose: () => void;
    danger?: boolean;
    size?: 'md' | 'lg' | 'xl' | '2xl';
}) {
    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, []);

    const sizeClass =
        size === 'md'
            ? 'max-w-lg'
            : size === 'lg'
                ? 'max-w-2xl'
                : size === 'xl'
                    ? 'max-w-5xl'
                    : 'max-w-7xl';

    return (
        <>
            <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
                <div
                    className={`bg-white rounded-xl shadow-xl w-full ${sizeClass} pointer-events-auto animate-fade-in max-h-[90vh] overflow-hidden`}
                >
                    <div
                        className="flex items-center justify-between px-6 py-4 border-b"
                        style={{ borderColor: danger ? 'var(--color-error)' : 'var(--color-border)' }}
                    >
                        <h3
                            className="text-base font-semibold"
                            style={{ color: danger ? 'var(--color-error)' : 'var(--color-text)' }}
                        >
                            {title}
                        </h3>
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={onClose}
                            aria-label="Close"
                            style={{ padding: '4px' }}
                        >
                            <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
                                <path
                                    d="M6 6l8 8M14 6l-8 8"
                                    stroke="currentColor"
                                    strokeWidth="1.75"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </button>
                    </div>
                    <div className="px-6 py-5 overflow-auto max-h-[calc(90vh-64px)]">
                        {children}
                    </div>
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

function IconLookup() {
    return (
        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.7" />
            <path d="M13.2 13.2L17 17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
    );
}







