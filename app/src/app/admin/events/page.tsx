"use client";

import { useEffect, useMemo, useState } from "react";
import { FilterChip, FilterSelect } from "@/components/ui/filter";
import { IconRefresh } from "@/components/ui/IconRefresh";
import { createPortal } from "react-dom";
import { TableRowsSkeleton } from "@/components/skeletons";

type EventStatus = "Upcoming" | "Open" | "Closed" | "Completed" | "Cancelled";

interface AdminEvent {
  id: string;
  title: string;
  startTime?: string;
  venue: string;
  category: string;
  bannerUrl: string | null;
  audienceType: string;
  isPaid: boolean;
  capacity: number;
  participants: number;
  status: EventStatus;
}

type ApiEvent = {
  id: string;
  title?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  effective_status?: string | null;
  capacity?: number | null;
  total_registered?: number | null;
  audience_type?: string | null;
  is_paid?: boolean | null;
  status?: string | null;
  category_name?: string | null;
  venue_name?: string | null;
  banner_url?: string | null;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";
const PH_TIMEZONE = "Asia/Manila";

function parseEventDate(value?: string | null): Date {
  const s = String(value ?? "").trim();
  if (!s) return new Date(NaN);
  if (/[zZ]|[+\-]\d{2}:\d{2}$/.test(s)) return new Date(s);
  const normalized = s.includes("T") ? s : s.replace(" ", "T");
  return new Date(`${normalized}+08:00`);
}
const API_ORIGIN = (() => {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return "http://localhost:8000";
  }
})();

function normalizeImageUrl(raw?: string | null): string | null {
  if (!raw) return null;
  const value = String(raw).trim();
  if (!value) return null;
  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("//")
  )
    return value;
  const path = value.startsWith("/") ? value : `/${value}`;
  return `${API_ORIGIN}${path}`;
}

function formatAdminDateTime(value?: string | null): string {
  if (!value) return "-";
  const d = parseEventDate(value);
  if (Number.isNaN(d.getTime())) return "-";

  // 1. Get the month and day (e.g., "May 29")
  const monthDay = d.toLocaleString("en-US", { month: "long", day: "numeric", timeZone: PH_TIMEZONE });

  // 2. Get the full year (e.g., 2026)
  const year = d.getFullYear();

  // 3. Get the time (e.g., "10:00 AM")
  const time = d.toLocaleString("en-US", {
    hour: "numeric", // "numeric" avoids leading zeros like "05:00 PM" -> "5:00 PM"
    minute: "2-digit",
    hour12: true,
    timeZone: PH_TIMEZONE,
  });

  // 4. Piece them together exactly how you want it
  return `${monthDay}, ${year} • ${time}`;
}

function normalizeStatus(
  rawStatus?: string | null,
  startDate?: string | null,
  endDate?: string | null,
): EventStatus {
  const s = String(rawStatus ?? "")
    .trim()
    .toLowerCase();
  if (s === "upcoming") return "Upcoming";
  if (s === "open") return "Open";
  if (s === "full") return "Closed";
  if (s === "closed") return "Closed";
  if (s === "completed") return "Completed";
  if (s === "cancelled") return "Cancelled";
  const start = parseEventDate(startDate);
  const end = parseEventDate(endDate ?? startDate);
  if (!Number.isNaN(end.getTime()) && end < new Date()) return "Completed";
  if (!Number.isNaN(start.getTime()) && start > new Date()) return "Upcoming";
  return "Open";
}

function getStatusClass(status: EventStatus): string {
  switch (status) {
    case "Upcoming":
      return "badge badge-blue";
    case "Open":
      return "badge badge-green";
    case "Closed":
      return "badge badge-gray";
    case "Completed":
      return "badge badge-gray";
    case "Cancelled":
      return "badge badge-red";
  }
}

export default function AdminEventsPage() {
  const [rows, setRows] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | EventStatus>("All");
  const [typeFilter, setTypeFilter] = useState<"All" | "Paid" | "Free">("All");
  const [audienceFilter, setAudienceFilter] = useState<
    "All" | "CvSU_Only" | "Org_Members_Only"
  >("All");
  const [deleteTarget, setDeleteTarget] = useState<AdminEvent | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  function handleExpiredSession() {
    window.localStorage.removeItem("auth_token");
    window.localStorage.removeItem("auth_user");
    window.sessionStorage.removeItem("auth_token");
    window.sessionStorage.removeItem("auth_user");
    window.location.href = "/";
  }

  async function loadEvents(showRefreshing = false) {
    const token =
      window.localStorage.getItem("auth_token") ??
      window.sessionStorage.getItem("auth_token");
    if (!token) {
      setLoading(false);
      return;
    }
    if (showRefreshing) setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/events?per_page=500`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 401 || res.status === 403) {
        handleExpiredSession();
        return;
      }
      const payload = (await res.json().catch(() => null)) as {
        success?: boolean;
        data?: ApiEvent[];
        error?: string;
      } | null;
      if (!res.ok || !payload?.success || !Array.isArray(payload.data)) {
        setError(payload?.error ?? "Unable to load events.");
        setRows([]);
        return;
      }
      setRows(
        payload.data.map((e) => ({
          id: e.id,
          title: e.title ?? "Untitled Event",
          startTime: formatAdminDateTime(e.start_date),
          venue: e.venue_name ?? "TBA",
          category: e.category_name ?? "Other",
          bannerUrl: normalizeImageUrl(e.banner_url),
          audienceType: e.audience_type ?? "CvSU_Only",
          isPaid: Boolean(e.is_paid),
          capacity: Number(e.capacity ?? 0),
          participants: Number(e.total_registered ?? 0),
          status: normalizeStatus(e.effective_status ?? e.status, e.start_date, e.end_date),
        })),
      );
      setError("");
    } finally {
      setLoading(false);
      if (showRefreshing) setRefreshing(false);
    }
  }

  useEffect(() => {
    loadEvents(false);
  }, []);

  async function deleteEvent(ev: AdminEvent) {
    const token =
      window.localStorage.getItem("auth_token") ??
      window.sessionStorage.getItem("auth_token");
    if (!token) return;
    if (!deleteReason.trim()) {
      setDeleteError("Please provide a reason for removal.");
      return;
    }
    setDeleting(true);
    const res = await fetch(`${API_BASE_URL}/admin/events/${ev.id}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason: deleteReason.trim() }),
    }).catch(() => null);
    if (res?.status === 401 || res?.status === 403) {
      handleExpiredSession();
      return;
    }
    const payload = (await res?.json().catch(() => null)) as {
      success?: boolean;
      error?: string;
    } | null;
    if (!res || !res.ok || !payload?.success) {
      setDeleteError(payload?.error ?? "Unable to remove event.");
      setDeleting(false);
      return;
    }
    setRows((prev) => prev.filter((x) => x.id !== ev.id));
    setDeleting(false);
    setDeleteReason("");
    setDeleteError("");
    setDeleteTarget(null);
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows
      .filter((r) => {
        const matchSearch =
          !q ||
          r.title.toLowerCase().includes(q) ||
          r.venue.toLowerCase().includes(q);
        const matchStatus = statusFilter === "All" || r.status === statusFilter;
        const matchType = typeFilter === "All" || (typeFilter === "Paid" ? r.isPaid : !r.isPaid);
        const matchAudience = audienceFilter === "All" || r.audienceType === audienceFilter;
        return matchSearch && matchStatus && matchType && matchAudience;
      })
      .sort((a, b) => {
        const aCompleted = a.status === "Completed";
        const bCompleted = b.status === "Completed";
        if (aCompleted === bCompleted) return 0;
        return aCompleted ? 1 : -1;
      });
  }, [
    rows,
    search,
    statusFilter,
    typeFilter,
    audienceFilter,
  ]);
  const hasActiveFilters =
    !!search ||
    statusFilter !== "All" ||
    typeFilter !== "All" ||
    audienceFilter !== "All";

  return (
    <>
      <main className="flex flex-col gap-6 animate-fade-in">
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
            Events
          </h1>
          <p
            className="text-sm mt-0.5"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Manage published events.
          </p>
        </div>

        <div className="card">
          <div className="card-body py-3.5">
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-col lg:flex-row gap-2.5 lg:items-center">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title or venue..."
                  className="input-has-left-icon flex-1"
                />
                <FilterSelect
                  value={statusFilter}
                  defaultValue="All"
                  onChange={(v) => setStatusFilter(v as "All" | EventStatus)}
                  options={[
                    { value: "All", label: "All Status" },
                    { value: "Upcoming", label: "Upcoming" },
                    { value: "Open", label: "Open" },
                    { value: "Closed", label: "Closed" },
                    { value: "Completed", label: "Completed" },
                    { value: "Cancelled", label: "Cancelled" },
                  ]}
                  className="lg:w-40"
                />
                <FilterSelect
                  value={typeFilter}
                  defaultValue="All"
                  onChange={(v) => setTypeFilter(v as "All" | "Paid" | "Free")}
                  options={[
                    { value: "All", label: "All Types" },
                    { value: "Paid", label: "Paid" },
                    { value: "Free", label: "Free" },
                  ]}
                  className="lg:w-36"
                />
                <FilterSelect
                  value={audienceFilter}
                  defaultValue="All"
                  onChange={(v) =>
                    setAudienceFilter(v as "All" | "CvSU_Only" | "Org_Members_Only")
                  }
                  options={[
                    { value: "All", label: "All Audience" },
                    { value: "CvSU_Only", label: "CvSU Students Only" },
                    { value: "Org_Members_Only", label: "Exclusive" },
                  ]}
                  className="lg:w-44"
                />
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setStatusFilter("All");
                      setTypeFilter("All");
                      setAudienceFilter("All");
                    }}
                    className="btn btn-ghost btn-sm whitespace-nowrap self-start lg:self-auto"
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
                    <FilterChip label={`"${search}"`} onRemove={() => setSearch("")} />
                  )}
                  {statusFilter !== "All" && (
                    <FilterChip
                      label={statusFilter}
                      onRemove={() => setStatusFilter("All")}
                    />
                  )}
                  {typeFilter !== "All" && (
                    <FilterChip
                      label={typeFilter}
                      onRemove={() => setTypeFilter("All")}
                    />
                  )}
                  {audienceFilter !== "All" && (
                    <FilterChip
                      label={
                        audienceFilter === "Org_Members_Only"
                          ? "Exclusive"
                          : "CvSU Students Only"
                      }
                      onRemove={() => setAudienceFilter("All")}
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
              Events Table
            </h2>
            <button
              className="p-0 bg-transparent border-0 cursor-pointer inline-flex items-center justify-center text-[var(--color-primary)] hover:text-[var(--color-primary-light)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => loadEvents(true)}
              disabled={refreshing || loading}
              aria-label="Refresh events"
              title="Refresh events"
            >
              <IconRefresh spinning={refreshing} />
            </button>
          </div>
          {!!error && (
            <div
              className="px-4 py-3 text-sm"
              style={{ color: "var(--color-error)" }}
            >
              {error}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="table-base">
              <colgroup>
                <col className="w-[34%]" />
                <col className="w-[20%]" />
                <col className="w-[14%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
                <col className="w-[8%]" />
                <col className="w-[4%]" />
              </colgroup>
              <thead>
                <tr>
                  <th className="text-left align-middle">Event</th>
                  <th className="text-left align-middle">Date</th>
                  <th className="text-left align-middle">Audience</th>
                  <th className="text-left align-middle">Type</th>
                  <th className="text-left align-middle">Capacity</th>
                  <th className="text-left align-middle">Status</th>
                  <th className="text-left align-middle">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableRowsSkeleton columns={7} rows={6} />
                ) : filtered.length === 0 ? (
                  <tr className="animate-content-reveal">
                    <td
                      colSpan={7}
                      className="text-center py-10 text-sm text-[var(--color-text-muted)]"
                    >
                      No events found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((ev) => (
<<<<<<< HEAD
                    <tr key={ev.id} className={`animate-content-reveal ${ev.status === "Completed" ? "bg-gray-50 text-gray-400" : ""}`}>
=======
                    <tr key={ev.id} className={ev.status === "Completed" ? "bg-gray-50 text-gray-400" : undefined}>
>>>>>>> fcba99d (feat: Implement event status normalization and timezone handling)
                      <td className="text-sm font-medium max-w-[300px] align-middle">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-10 h-10 rounded-lg overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-2)] flex-shrink-0 ${ev.status === "Completed" ? "grayscale" : ""}`}>
                            {ev.bannerUrl ? (
                              <img
                                src={ev.bannerUrl}
                                alt={`${ev.title} banner`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] font-semibold text-[var(--color-text-muted)]">
                                No Img
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className={ev.status === "Completed" ? "truncate text-gray-500" : "truncate"}>{ev.title}</span>
                            <span className="text-xs text-[var(--color-text-muted)] truncate">
                              {ev.venue} • {ev.category}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="text-sm align-middle">
                        <span
                          className="inline-flex items-center py-0.5 text-xs font-medium text-[var(--color-text-secondary)]"
                          suppressHydrationWarning
                        >
                          {ev.startTime}
                        </span>
                      </td>
                      <td className="text-sm align-middle">
                        <span
                          className={`badge ${ev.audienceType === "Org_Members_Only" ? "badge-green" : "badge-blue"}`}
                        >
                          {ev.audienceType === "Org_Members_Only"
                            ? "Exclusive"
                            : "CvSU Students Only"}
                        </span>
                      </td>
                      <td className="text-sm align-middle">
                        <span
                          className={`badge ${ev.isPaid ? "badge-yellow" : "badge-green"}`}
                        >
                          {ev.isPaid ? "Paid" : "Free"}
                        </span>
                      </td>
                      <td className="text-sm align-middle">
                        <span className="inline-flex items-center py-0.5 text-xs font-medium tabular-nums text-[var(--color-text-secondary)]">
                          {ev.participants}/{ev.capacity}
                        </span>
                      </td>
                      <td className="text-sm align-middle">
                        <span className={getStatusClass(ev.status)}>
                          {ev.status}
                        </span>
                      </td>
                      <td className="align-middle">
                        <button
                          className="btn btn-sm btn-danger"
                          title="Remove event"
                          onClick={() => {
                            setDeleteTarget(ev);
                            setDeleteReason("");
                            setDeleteError("");
                          }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {mounted &&
          deleteTarget &&
          createPortal(
            <div
              className="fixed inset-0 z-[200] flex items-center justify-center p-4"
              style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
            >
              <div className="card w-full max-w-md shadow-2xl">
                <div className="card-body flex flex-col gap-4">
                  <p className="text-[16px] font-semibold">Remove event?</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {deleteTarget.title}
                  </p>

                  <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                    <div className="flex flex-col">
                      <span className="text-xs text-[var(--color-text-muted)]">
                        Date
                      </span>
                      <span className="font-medium">
                        {deleteTarget.startTime ?? "-"}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-[var(--color-text-muted)]">
                        Venue
                      </span>
                      <span className="font-medium">
                        {deleteTarget.venue ?? "TBA"}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-[var(--color-text-muted)]">
                        Category
                      </span>
                      <span className="font-medium">
                        {deleteTarget.category}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-[var(--color-text-muted)]">
                        Audience
                      </span>
                      <span className="font-medium">
                        {deleteTarget.audienceType === "Org_Members_Only"
                          ? "Exclusive"
                          : "CvSU Students Only"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 text-xs rounded ${getStatusClass(deleteTarget.status)}`}
                    >
                      {deleteTarget.status}
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      Capacity:{" "}
                      <span className="font-medium">
                        {deleteTarget.capacity}
                      </span>
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-[var(--color-text-muted)]">
                    Please provide a concise reason for removal. This action
                    will remove the event from public listings.
                  </p>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                      Reason
                    </label>
                    <textarea
                      rows={3}
                      value={deleteReason}
                      onChange={(e) => {
                        setDeleteReason(e.target.value);
                        setDeleteError("");
                      }}
                      placeholder="Why is this event being removed?"
                      className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 text-sm resize-none"
                    />
                    {deleteError && (
                      <p className="text-xs text-[var(--color-error)]">
                        {deleteError}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      className="btn btn-ghost flex-1"
                      disabled={deleting}
                      onClick={() => setDeleteTarget(null)}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-danger flex-1"
                      disabled={deleting}
                      onClick={() => deleteEvent(deleteTarget)}
                    >
                      {deleting ? "Removing..." : "Yes, Remove"}
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )}
      </main>
    </>
  );
}
