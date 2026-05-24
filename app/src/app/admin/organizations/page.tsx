"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FilterSelect, FilterChip } from "@/components/ui/filter";
import { IconRefresh } from "@/components/ui/IconRefresh";
import { TableRowsSkeleton } from "@/components/skeletons";

type AccreditationStatus = "Active" | "Suspended";
type OrgCategory = "Academic" | "Non-Academic" | "Religious";
type SortKey = "name" | "category" | "accredited_at" | "member_count";

interface Organization {
  id: string;
  slug?: string;
  name: string;
  description: string;
  logo_url: string;
  banner_url: string;
  adviser: string;
  category: OrgCategory;
  accreditation_status: AccreditationStatus;
  accredited_at: string;
  member_count: number;
}

type ApiOrganization = {
  id: string;
  slug?: string | null;
  name: string;
  description?: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
  adviser?: string | null;
  category_id?: string | number | null;
  category_name?: string | null;
  is_accredited?: boolean;
  accreditation_status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  members_count?: number | string | null;
};

type ApiResponse<T> = { success: boolean; data?: T; error?: string };

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";
const API_ORIGIN = (() => {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return "http://localhost:8000";
  }
})();

function normalizeImageUrl(raw?: string | null): string {
  if (!raw) return "";
  const value = String(raw).trim();
  if (!value) return "";
  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("//")
  ) {
    return value;
  }
  const path = value.startsWith("/") ? value : `/${value}`;
  return `${API_ORIGIN}${path}`;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function mapCategory(categoryValue: unknown): OrgCategory {
  if (categoryValue === null || categoryValue === undefined) return 'Non-Academic';
  const value = String(categoryValue).trim().toLowerCase();
  if (value.startsWith('relig')) return 'Religious';
  if (value.startsWith('acad')) return 'Academic';
  if (value.startsWith('non')) return 'Non-Academic';
  if (value === 'religious') return 'Religious';
  if (value === 'academic') return 'Academic';
  if (value === 'non-academic' || value === 'non academic') return 'Non-Academic';
  return 'Non-Academic';
}

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

  if (org.logo_url)
    return (
      <img
        src={org.logo_url}
        alt={org.name}
        className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
      />
    );

  return (
    <div
      className={`w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${colorMap[org.category]}`}
    >
      {getInitials(org.name)}
    </div>
  );
}

export default function AdminOrganizationsPage() {
  const router = useRouter();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | AccreditationStatus>(
    "all",
  );
  const [filterCategory, setFilterCategory] = useState<"all" | OrgCategory>(
    "all",
  );
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [confirmTarget, setConfirmTarget] = useState<{
    org: Organization;
    next: AccreditationStatus;
  } | null>(null);
  const [confirmReason, setConfirmReason] = useState("");
  const [confirmError, setConfirmError] = useState("");

  async function fetchOrganizations(
    showSpinner = true,
    showRefreshing = false,
  ) {
    const token =
      window.localStorage.getItem("auth_token") ??
      window.sessionStorage.getItem("auth_token");
    if (!token) {
      router.push("/");
      return;
    }
    if (showSpinner) setIsLoading(true);
    if (showRefreshing) setRefreshing(true);
    try {
      setErrorMsg("");
      const res = await fetch(
        `${API_BASE_URL}/admin/organizations?per_page=500`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const payload = (await res.json().catch(() => null)) as ApiResponse<
        ApiOrganization[]
      > | null;

      if (!res.ok || !payload?.success || !Array.isArray(payload.data)) {
        setErrorMsg(payload?.error ?? "Unable to load organizations.");
        setOrgs([]);
        return;
      }

      setOrgs(
        payload.data.map((o) => {
          const normalizedStatus = String(
            o.accreditation_status ?? "",
          ).toLowerCase();
          const mappedStatus: AccreditationStatus = normalizedStatus
            ? normalizedStatus === "active"
              ? "Active"
              : "Suspended"
            : o.is_accredited
              ? "Active"
              : "Suspended";

          const categoryValue = o.category_name ?? o.category_id;

          return {
            id: o.id,
            slug: o.slug ? String(o.slug) : String(o.id),
            name: o.name,
            description: o.description ?? "",
            logo_url: normalizeImageUrl(o.logo_url),
            banner_url: normalizeImageUrl(o.banner_url),
            adviser: o.adviser ?? "N/A",
            category: mapCategory(categoryValue),
            accreditation_status: mappedStatus,
            accredited_at:
              o.updated_at ?? o.created_at ?? new Date().toISOString(),
            member_count: Number(o.members_count ?? 0),
          };
        }),
      );
    } finally {
      if (showSpinner) setIsLoading(false);
      if (showRefreshing) setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchOrganizations();
  }, [router]);

  const hasActiveFilters =
    !!search ||
    filterStatus !== "all" ||
    filterCategory !== "all" ||
    sortKey !== "name";

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
        if (sortKey === "accredited_at")
          return (
            new Date(b.accredited_at).getTime() -
            new Date(a.accredited_at).getTime()
          );
        if (sortKey === "member_count") return b.member_count - a.member_count;
        return 0;
      });
  }, [orgs, search, filterStatus, filterCategory, sortKey]);

  const stats = useMemo(
    () => ({
      total: orgs.length,
      active: orgs.filter((o) => o.accreditation_status === "Active").length,
      suspended: orgs.filter((o) => o.accreditation_status === "Suspended")
        .length,
      academic: orgs.filter((o) => o.category === "Academic").length,
    }),
    [orgs],
  );

  const resetFilters = () => {
    setSearch("");
    setFilterStatus("all");
    setFilterCategory("all");
    setSortKey("name");
  };

  const handleConfirm = async () => {
    if (!confirmTarget) return;
    const token =
      window.localStorage.getItem("auth_token") ??
      window.sessionStorage.getItem("auth_token");
    if (!token) return;

    if (!confirmReason.trim()) {
      setConfirmError(
        confirmTarget.next === "Suspended"
          ? "Please provide a reason for suspension."
          : "Please provide a reason for restoration.",
      );
      return;
    }

    setIsSaving(true);
    setErrorMsg("");
    const res = await fetch(
      `${API_BASE_URL}/admin/organizations/${confirmTarget.org.id}/accreditation`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          accreditation_status: confirmTarget.next,
          reason: confirmReason.trim(),
        }),
      },
    ).catch(() => null);

    const payload = (await res
      ?.json()
      .catch(() => null)) as ApiResponse<unknown> | null;
    if (!res || !res.ok || !payload?.success) {
      setErrorMsg(payload?.error ?? "Unable to update accreditation.");
      setIsSaving(false);
      return;
    }

    setOrgs((prev) =>
      prev.map((o) =>
        o.id === confirmTarget.org.id
          ? {
            ...o,
            accreditation_status: confirmTarget.next,
            accredited_at: new Date().toISOString(),
          }
          : o,
      ),
    );
    setConfirmTarget(null);
    setConfirmReason("");
    setConfirmError("");
    setIsSaving(false);
  };

  return (
    <>
      {confirmTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
          onClick={() => setConfirmTarget(null)}
        >
          <div
            className="card w-full max-w-sm animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-body flex flex-col gap-4">
              <p
                className="text-[15px] font-semibold"
                style={{ color: "var(--color-text)" }}
              >
                {confirmTarget.next === "Suspended"
                  ? "Suspend organization?"
                  : "Restore accreditation?"}
              </p>
              <p
                className="text-sm"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {confirmTarget.org.name}
              </p>
              <div className="form-group">
                <label className="form-label">
                  {confirmTarget.next === "Suspended"
                    ? "Reason for suspension"
                    : "Reason for restoration"}
                </label>
                <textarea
                  rows={4}
                  value={confirmReason}
                  onChange={(e) => {
                    setConfirmReason(e.target.value);
                    setConfirmError("");
                  }}
                  placeholder={
                    confirmTarget.next === "Suspended"
                      ? "Explain why this organization is being suspended"
                      : "Explain why this organization is being restored"
                  }
                  className="w-full rounded-md p-3 text-sm border focus:outline-none resize-none"
                  style={{
                    borderColor: "var(--color-border)",
                    background: "var(--color-bg-secondary, #f9fafb)",
                    color: "var(--color-text)",
                  }}
                />
                {confirmError && (
                  <p
                    className="text-sm"
                    style={{ color: "var(--color-error)" }}
                  >
                    {confirmError}
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmTarget(null)}
                  className="btn btn-ghost flex-1"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className={`btn flex-1 ${confirmTarget.next === "Suspended" ? "btn-danger" : "btn-primary"}`}
                  disabled={isSaving}
                >
                  {isSaving
                    ? "Saving..."
                    : confirmTarget.next === "Suspended"
                      ? "Suspend"
                      : "Restore"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
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
            <p
              className="text-sm mt-0.5"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Manage accreditation status for all recognized student groups.
            </p>
          </div>
          <Link
            href="/admin/organizations/create"
            className="btn btn-primary btn-sm no-underline"
          >
            Create Organization
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Total Orgs",
              value: stats.total,
              color: "var(--color-text)",
            },
            {
              label: "Active",
              value: stats.active,
              color: "var(--color-success)",
            },
            {
              label: "Suspended",
              value: stats.suspended,
              color: "var(--color-error)",
            },
            {
              label: "Academic",
              value: stats.academic,
              color: "var(--color-info)",
            },
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

        <div className="card">
          <div className="card-body py-3.5">
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center">
                <div className="input-icon-wrapper flex-1">
                  <span className="input-icon-left">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"
                      />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or adviser..."
                    className={`input-has-left-icon w-full ${search ? "input-has-right-icon" : ""}`}
                  />
                </div>
                <FilterSelect
                  value={filterStatus}
                  defaultValue="all"
                  onChange={(v) => setFilterStatus(v as typeof filterStatus)}
                  options={[
                    { value: "all", label: "All Status" },
                    { value: "Active", label: "Active" },
                    { value: "Suspended", label: "Suspended" },
                  ]}
                  className="sm:w-40"
                />
                <FilterSelect
                  value={filterCategory}
                  defaultValue="all"
                  onChange={(v) =>
                    setFilterCategory(v as typeof filterCategory)
                  }
                  options={[
                    { value: "all", label: "All Categories" },
                    { value: "Academic", label: "Academic" },
                    { value: "Non-Academic", label: "Non-Academic" },
                    { value: "Religious", label: "Religious" },
                  ]}
                  className="sm:w-44"
                />
                <FilterSelect
                  value={sortKey}
                  defaultValue="name"
                  onChange={(v) => setSortKey(v as SortKey)}
                  options={[
                    { value: "name", label: "Sort: Name" },
                    { value: "category", label: "Sort: Category" },
                    { value: "member_count", label: "Sort: Members ?" },
                    { value: "accredited_at", label: "Sort: Last Updated" },
                  ]}
                  className="sm:w-48"
                />
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="btn btn-ghost btn-sm whitespace-nowrap self-start sm:self-auto"
                    style={{ color: "var(--color-error)" }}
                  >
                    Clear all
                  </button>
                )}
              </div>
              {hasActiveFilters && (
                <div
                  className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  <span
                    className="text-[11px] font-medium mr-0.5"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    Filtering by:
                  </span>
                  {search && (
                    <FilterChip
                      label={`"${search}"`}
                      onRemove={() => setSearch("")}
                    />
                  )}
                  {filterStatus !== "all" && (
                    <FilterChip
                      label={filterStatus}
                      onRemove={() => setFilterStatus("all")}
                    />
                  )}
                  {filterCategory !== "all" && (
                    <FilterChip
                      label={filterCategory}
                      onRemove={() => setFilterCategory("all")}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-[var(--color-text)]">
              Organizations Table
            </h2>
            <button
              className="p-0 bg-transparent border-0 cursor-pointer inline-flex items-center justify-center text-[var(--color-primary)] hover:text-[var(--color-primary-light)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => fetchOrganizations(false, true)}
              disabled={refreshing || isLoading}
              aria-label="Refresh organizations"
              title="Refresh organizations"
            >
              <IconRefresh spinning={refreshing} />
            </button>
          </div>
          <div className="overflow-x-auto">
            {errorMsg && (
              <div
                className="px-4 py-3 text-sm"
                style={{ color: "var(--color-error)" }}
              >
                {errorMsg}
              </div>
            )}
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
                {isLoading ? (
                  <TableRowsSkeleton columns={7} rows={6} />
                ) : filtered.length === 0 ? (
                  <tr className="animate-content-reveal">
                    <td colSpan={7}>
                      <div className="py-12 flex flex-col items-center gap-2">
                        <p
                          className="text-sm"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          No organizations match your filters.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((org) => (
                    <tr
                      key={org.id}
                      className="animate-content-reveal"
                      style={{
                        opacity:
                          org.accreditation_status === "Suspended" ? 0.55 : 1,
                        transition: "opacity 150ms ease",
                      }}
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <OrgAvatar org={org} />
                          <div>
                            <Link
                              href={`/admin/organizations/${org.slug ?? org.id}`}
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
                            {org.banner_url ? (
                              <img
                                src={org.banner_url}
                                alt={`${org.name} banner`}
                                className="mt-1 h-8 w-20 rounded object-cover border border-[var(--color-border)]"
                              />
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell">
                        <CategoryBadge category={org.category} />
                      </td>
                      <td className="hidden md:table-cell">
                        <span
                          className="text-sm"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          {org.adviser}
                        </span>
                      </td>
                      <td className="hidden lg:table-cell">
                        <span
                          className="text-sm font-semibold"
                          style={{ color: "var(--color-text)" }}
                        >
                          {org.member_count}
                        </span>
                      </td>
                      <td className="hidden lg:table-cell">
                        <span
                          className="text-sm"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          {fmt(org.accredited_at)}
                        </span>
                      </td>
                      <td>
                        <AccreditationBadge status={org.accreditation_status} />
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              router.push(`/admin/organizations/${org.slug ?? org.id}`)
                            }
                            className="btn btn-ghost btn-sm text-[var(--color-primary)] hover:text-[var(--color-primary-light)] transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => {
                              setConfirmReason("");
                              setConfirmError("");
                              setConfirmTarget({
                                org,
                                next:
                                  org.accreditation_status === "Active"
                                    ? "Suspended"
                                    : "Active",
                              });
                            }}
                            className={`btn btn-sm ${org.accreditation_status === "Active" ? "btn-danger" : "btn-primary"}`}
                          >
                            {org.accreditation_status === "Active"
                              ? "Suspend"
                              : "Restore"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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
    </>
  );
}
