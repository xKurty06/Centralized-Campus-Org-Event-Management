"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import React from "react";
import AdminShell from "@/components/AdminShell";
import Link from "next/dist/client/link";
import { FilterSelect, FilterChip } from "@/components/ui/filter";

// ─── Types ────────────────────────────────────────────────────────────────────

type AccreditationStatus = "Active" | "Suspended";
type OrgCategory = "Academic" | "Non-Academic" | "Religious";
// Added member_count to sort options
type SortKey = "name" | "category" | "accredited_at" | "member_count";

interface Organization {
    id: string;
    name: string;
    description: string;
    logo_url: string;
    adviser: string;
    category: OrgCategory;
    accreditation_status: AccreditationStatus;
    accredited_by: string;
    accredited_at: string;
    member_count: number;
    active_events: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_ORGS: Organization[] = [
    { id: "org-1", name: "Computer Science Society", description: "The premier organization for CS students.", logo_url: "", adviser: "Dr. Ramon Cruz", category: "Academic", accreditation_status: "Active", accredited_by: "Admin", accredited_at: "2025-06-01T09:00:00", member_count: 128, active_events: 3 },
    { id: "org-2", name: "Junior Philippine Institute of Accountants", description: "Bridging students to the accounting profession.", logo_url: "", adviser: "Prof. Lita Reyes", category: "Academic", accreditation_status: "Active", accredited_by: "Admin", accredited_at: "2025-06-03T10:30:00", member_count: 94, active_events: 1 },
    { id: "org-3", name: "Campus Ministry", description: "Nurturing the spiritual lives of students.", logo_url: "", adviser: "Fr. Jose Manalo", category: "Religious", accreditation_status: "Active", accredited_by: "Admin", accredited_at: "2025-06-05T08:00:00", member_count: 67, active_events: 2 },
    { id: "org-4", name: "Rotaract Club of CvSU", description: "Community service and leadership development.", logo_url: "", adviser: "Ms. Grace Tan", category: "Non-Academic", accreditation_status: "Suspended", accredited_by: "Admin", accredited_at: "2025-05-20T14:00:00", member_count: 45, active_events: 0 },
    { id: "org-5", name: "Engineering Society", description: "Fostering excellence in engineering disciplines.", logo_url: "", adviser: "Engr. Mark Santos", category: "Academic", accreditation_status: "Active", accredited_by: "Admin", accredited_at: "2025-06-07T11:00:00", member_count: 112, active_events: 2 },
    { id: "org-6", name: "Dance Troupe", description: "Celebrating Filipino culture through dance.", logo_url: "", adviser: "Ms. Anna Flores", category: "Non-Academic", accreditation_status: "Active", accredited_by: "Admin", accredited_at: "2025-06-08T09:30:00", member_count: 38, active_events: 1 },
    { id: "org-7", name: "Student Christian Fellowship", description: "Faith-based community and outreach.", logo_url: "", adviser: "Pastor Ben Lim", category: "Religious", accreditation_status: "Suspended", accredited_by: "Admin", accredited_at: "2025-04-15T10:00:00", member_count: 29, active_events: 0 },
    { id: "org-8", name: "Mathematics Society", description: "Promoting mathematical excellence and research.", logo_url: "", adviser: "Prof. Carla Navarro", category: "Academic", accreditation_status: "Active", accredited_by: "Admin", accredited_at: "2025-06-10T08:45:00", member_count: 76, active_events: 1 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(iso: string) {
    return new Date(iso).toLocaleDateString("en-PH", {
        month: "short", day: "numeric", year: "numeric",
    });
}

function getInitials(name: string) {
    return name.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AccreditationBadge({ status }: { status: AccreditationStatus }) {
    return status === "Active" ? (
        <span className="badge badge-green">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />
            Active
        </span>
    ) : (
        <span className="badge badge-red">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-error)]" />
            Suspended
        </span>
    );
}

function CategoryBadge({ category }: { category: OrgCategory }) {
    const cls: Record<OrgCategory, string> = {
        Academic: "badge badge-blue",
        "Non-Academic": "badge badge-gray",
        Religious: "badge badge-yellow",
    };
    return <span className={cls[category]}>{category}</span>;
}

function OrgAvatar({ org }: { org: Organization }) {
    const colorMap: Record<OrgCategory, string> = {
        Academic: "bg-blue-100 text-blue-700",
        "Non-Academic": "bg-purple-100 text-purple-700",
        Religious: "bg-amber-100 text-amber-700",
    };
    if (org.logo_url) {
        return (
            <img
                src={org.logo_url}
                alt={org.name}
                className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
            />
        );
    }
    return (
        <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${colorMap[org.category]}`}
        >
            {getInitials(org.name)}
        </div>
    );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────

function ConfirmModal({
    org,
    nextStatus,
    onConfirm,
    onCancel,
}: {
    org: Organization;
    nextStatus: AccreditationStatus;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    const isSuspending = nextStatus === "Suspended";

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
            onClick={onCancel}
        >
            <div
                className="card w-full max-w-sm animate-fade-in"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="card-body flex flex-col gap-4">
                    {/* Icon */}
                    <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{
                            backgroundColor: isSuspending
                                ? "var(--color-error-light)"
                                : "var(--color-primary-muted)",
                        }}
                    >
                        {isSuspending ? (
                            <svg
                                className="w-5 h-5"
                                style={{ color: "var(--color-error)" }}
                                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                        ) : (
                            <svg
                                className="w-5 h-5"
                                style={{ color: "var(--color-primary)" }}
                                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                    </div>

                    {/* Copy */}
                    <div>
                        <p className="text-[15px] font-semibold mb-1" style={{ color: "var(--color-text)" }}>
                            {isSuspending ? "Suspend organization?" : "Restore accreditation?"}
                        </p>
                        <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                            {isSuspending ? (
                                <>
                                    <span className="font-medium" style={{ color: "var(--color-text)" }}>
                                        {org.name}
                                    </span>{" "}
                                    will no longer be able to publish new events. Existing events remain visible.
                                </>
                            ) : (
                                <>
                                    <span className="font-medium" style={{ color: "var(--color-text)" }}>
                                        {org.name}
                                    </span>{" "}
                                    will regain the ability to publish events on the platform.
                                </>
                            )}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-1">
                        <button onClick={onCancel} className="btn btn-ghost flex-1">
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`btn flex-1 ${isSuspending ? "btn-danger" : "btn-primary"}`}
                        >
                            {isSuspending ? "Suspend" : "Restore"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminOrganizationsPage() {
    const router = useRouter();

    const [orgs, setOrgs] = useState<Organization[]>(MOCK_ORGS);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | AccreditationStatus>("all");
    const [filterCategory, setFilterCategory] = useState<"all" | OrgCategory>("all");
    const [sortKey, setSortKey] = useState<SortKey>("name");
    const [confirmTarget, setConfirmTarget] = useState<{
        org: Organization;
        next: AccreditationStatus;
    } | null>(null);

    // Derived state to check if any filters are active
    const hasActiveFilters = !!search || filterStatus !== 'all' || filterCategory !== 'all' || sortKey !== 'name';

    const resetFilters = () => {
        setSearch("");
        setFilterStatus("all");
        setFilterCategory("all");
        setSortKey("name");
    };

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return orgs
            .filter((o) => {
                const matchSearch =
                    !q ||
                    o.name.toLowerCase().includes(q) ||
                    o.adviser.toLowerCase().includes(q);
                const matchStatus =
                    filterStatus === "all" || o.accreditation_status === filterStatus;
                const matchCategory =
                    filterCategory === "all" || o.category === filterCategory;
                return matchSearch && matchStatus && matchCategory;
            })
            .sort((a, b) => {
                if (sortKey === "name") return a.name.localeCompare(b.name);
                if (sortKey === "category") return a.category.localeCompare(b.category);
                if (sortKey === "accredited_at") return new Date(b.accredited_at).getTime() - new Date(a.accredited_at).getTime();
                if (sortKey === "member_count") return b.member_count - a.member_count; // Highest members first
                return 0;
            });
    }, [orgs, search, filterStatus, filterCategory, sortKey]);

    const stats = useMemo(
        () => ({
            total: orgs.length,
            active: orgs.filter((o) => o.accreditation_status === "Active").length,
            suspended: orgs.filter((o) => o.accreditation_status === "Suspended").length,
            academic: orgs.filter((o) => o.category === "Academic").length,
        }),
        [orgs]
    );

    const handleToggle = (org: Organization) => {
        const next: AccreditationStatus =
            org.accreditation_status === "Active" ? "Suspended" : "Active";
        setConfirmTarget({ org, next });
    };

    const handleConfirm = () => {
        if (!confirmTarget) return;
        setOrgs((prev) =>
            prev.map((o) =>
                o.id === confirmTarget.org.id
                    ? {
                        ...o,
                        accreditation_status: confirmTarget.next,
                        accredited_at: new Date().toISOString(),
                    }
                    : o
            )
        );
        setConfirmTarget(null);
    };

    // Shared styled class for all select filters
    const selectClasses = "px-3 py-2 text-sm rounded-lg border outline-none focus:ring-2 cursor-pointer transition-colors";
    const selectStyles = {
        backgroundColor: "var(--color-surface)",
        borderColor: "var(--color-border)",
        color: "var(--color-text)",
    };

    return (
        <AdminShell>
            {confirmTarget && (
                <ConfirmModal
                    org={confirmTarget.org}
                    nextStatus={confirmTarget.next}
                    onConfirm={handleConfirm}
                    onCancel={() => setConfirmTarget(null)}
                />
            )}

            <div className="flex flex-col gap-6 animate-fade-in">

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
                        Organizations
                    </h1>
                    <p className="text-sm mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                        Manage accreditation status for all recognized student groups.
                    </p>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: "Total Orgs", value: stats.total, color: "var(--color-text)" },
                        { label: "Active", value: stats.active, color: "var(--color-success)" },
                        { label: "Suspended", value: stats.suspended, color: "var(--color-error)" },
                        { label: "Academic", value: stats.academic, color: "var(--color-info)" },
                    ].map(({ label, value, color }) => (
                        <div key={label} className="card">
                            <div className="card-body py-4">
                                <p
                                    className="text-xs font-semibold uppercase tracking-wider mb-1"
                                    style={{ color: "var(--color-text-muted)" }}
                                >
                                    {label}
                                </p>
                                <p
                                    className="text-[28px] font-bold leading-none"
                                    style={{ color }}
                                >
                                    {value}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Filters ─────────────────────────────────────────────── */}
                <div className="card">
                    <div className="card-body py-3.5">
                        <div className="flex flex-col gap-2.5">

                            {/* Controls row */}
                            <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center">

                                {/* Search */}
                                <div className="input-icon-wrapper flex-1">
                                    <span className="input-icon-left">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                                        </svg>
                                    </span>
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search by name or adviser…"
                                        className={`input-has-left-icon w-full ${search ? 'input-has-right-icon' : ''}`}
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
                                    value={filterStatus}
                                    defaultValue="all"
                                    onChange={(v) => setFilterStatus(v as typeof filterStatus)}
                                    options={[
                                        { value: 'all', label: 'All Status' },
                                        { value: 'Active', label: 'Active' },
                                        { value: 'Suspended', label: 'Suspended' },
                                    ]}
                                    className="sm:w-40"
                                />

                                <FilterSelect
                                    value={filterCategory}
                                    defaultValue="all"
                                    onChange={(v) => setFilterCategory(v as typeof filterCategory)}
                                    options={[
                                        { value: 'all', label: 'All Categories' },
                                        { value: 'Academic', label: 'Academic' },
                                        { value: 'Non-Academic', label: 'Non-Academic' },
                                        { value: 'Religious', label: 'Religious' },
                                    ]}
                                    className="sm:w-44"
                                />

                                <FilterSelect
                                    value={sortKey}
                                    defaultValue="name"
                                    onChange={(v) => setSortKey(v as SortKey)}
                                    options={[
                                        { value: 'name', label: 'Sort: Name' },
                                        { value: 'category', label: 'Sort: Category' },
                                        { value: 'member_count', label: 'Sort: Members ↓' },
                                        { value: 'accredited_at', label: 'Sort: Last Updated' },
                                    ]}
                                    className="sm:w-48"
                                />

                                {hasActiveFilters && (
                                    <button
                                        type="button"
                                        onClick={resetFilters}
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
                                    {search && (
                                        <FilterChip label={`"${search}"`} onRemove={() => setSearch('')} />
                                    )}
                                    {filterStatus !== 'all' && (
                                        <FilterChip label={filterStatus} onRemove={() => setFilterStatus('all')} />
                                    )}
                                    {filterCategory !== 'all' && (
                                        <FilterChip label={filterCategory} onRemove={() => setFilterCategory('all')} />
                                    )}
                                    {sortKey !== 'name' && (
                                        <FilterChip
                                            label={`Sort: ${sortKey === 'member_count' ? 'Members ↓' : sortKey === 'accredited_at' ? 'Last Updated' : sortKey}`}
                                            onRemove={() => setSortKey('name')}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="card">
                    <div className="overflow-x-auto">
                        <table className="table-base">
                            <thead>
                                <tr>
                                    <th>Organization</th>
                                    <th className="hidden sm:table-cell">Category</th>
                                    <th className="hidden md:table-cell">Adviser</th>
                                    <th className="hidden lg:table-cell">Members</th>
                                    <th className="hidden lg:table-cell">Last Updated</th>
                                    <th>Status</th>
                                    <th />
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={7}>
                                            <div className="py-12 flex flex-col items-center gap-2">
                                                <svg
                                                    className="w-8 h-8"
                                                    style={{ color: "var(--color-text-muted)" }}
                                                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                                                </svg>
                                                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                                                    No organizations match your filters.
                                                </p>
                                                {hasActiveFilters && (
                                                    <button onClick={resetFilters} className="btn btn-outline btn-sm mt-2">
                                                        Reset Filters
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((org) => (
                                        <tr
                                            key={org.id}
                                            style={{
                                                opacity: org.accreditation_status === "Suspended" ? 0.55 : 1,
                                                transition: "opacity 150ms ease",
                                            }}
                                        >
                                            {/* Name */}
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <OrgAvatar org={org} />
                                                    <div>
                                                        <Link
                                                            href={`/admin/organizations/${org.id}`}
                                                            className="text-sm font-semibold text-[var(--color-text)] hover:text-green-700 transition-colors"
                                                        >
                                                            {org.name}
                                                        </Link>
                                                        <p
                                                            className="text-xs mt-0.5 max-w-[200px] truncate"
                                                            style={{ color: "var(--color-text-muted)" }}
                                                        >
                                                            {org.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Category */}
                                            <td className="hidden sm:table-cell">
                                                <CategoryBadge category={org.category} />
                                            </td>

                                            {/* Adviser */}
                                            <td className="hidden md:table-cell">
                                                <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                                                    {org.adviser}
                                                </span>
                                            </td>

                                            {/* Members */}
                                            <td className="hidden lg:table-cell">
                                                <span className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                                                    {org.member_count}
                                                </span>
                                            </td>

                                            {/* Last updated */}
                                            <td className="hidden lg:table-cell">
                                                <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                                                    {fmt(org.accredited_at)}
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td>
                                                <AccreditationBadge status={org.accreditation_status} />
                                            </td>

                                            {/* Actions */}
                                            <td>
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => router.push(`/admin/organizations/${org.id}`)}
                                                        className="btn btn-ghost btn-sm text-[var(--color-primary)] hover:text-white transition-colors border hover:border-[var(--color-primary-light)] hover:bg-[var(--color-primary-light)]"
                                                    >
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggle(org)}
                                                        className={`btn btn-sm ${org.accreditation_status === "Active"
                                                            ? "btn-danger"
                                                            : "btn-outline"
                                                            }`}
                                                    >
                                                        {org.accreditation_status === "Active" ? "Suspend" : "Restore"}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Table footer */}
                    <div
                        className="px-4 py-3 border-t flex items-center"
                        style={{
                            borderColor: "var(--color-border)",
                            backgroundColor: "var(--color-surface-2)",
                        }}
                    >
                        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                            Showing{" "}
                            <span
                                className="font-semibold"
                                style={{ color: "var(--color-text-secondary)" }}
                            >
                                {filtered.length}
                            </span>{" "}
                            of{" "}
                            <span
                                className="font-semibold"
                                style={{ color: "var(--color-text-secondary)" }}
                            >
                                {orgs.length}
                            </span>{" "}
                            organizations
                        </p>
                    </div>
                </div>

            </div>
        </AdminShell>
    );
}