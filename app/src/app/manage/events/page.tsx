"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ManageShell from "@/components/ManageShell";
import { FilterSelect, FilterChip } from "@/components/ui/filter";

type EventStatus =
  | "Upcoming"
  | "Open"
    | "Closed"
  | "Completed"
  | "Cancelled";
type EventCategory =
  | "Workshop"
  | "Seminar"
  | "Competition"
  | "Activity"
  | "Training"
  | "Outreach"
  | "Cultural"
  | "Other";

interface ManagedEvent {
  id: string;
  slug?: string;
  title: string;
  category: EventCategory;
  start_date: string;
  end_date: string;
  venue_name: string;
  status: EventStatus;
  is_paid: boolean;
  capacity: number;
  total_registered: number;
  total_paid: number;
  total_pending: number;
  proofs_pending_review: number;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";
const ALL_STATUSES: EventStatus[] = [
  "Upcoming",
  "Open",
    "Closed",
  "Completed",
  "Cancelled",
];
const ALL_CATEGORIES: EventCategory[] = [
  "Workshop",
  "Seminar",
  "Competition",
  "Activity",
  "Training",
  "Outreach",
  "Cultural",
  "Other",
];
type SortKey = "date_asc" | "date_desc" | "title_asc" | "registered_desc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "date_desc", label: "Newest first" },
  { value: "date_asc", label: "Oldest first" },
  { value: "title_asc", label: "Title A-Z" },
  { value: "registered_desc", label: "Most registered" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
function formatDateTimeRange(startIso: string, endIso?: string) {
  const start = new Date(startIso);
  const end = new Date(endIso ?? startIso);
  const sameDay = start.toDateString() === end.toDateString();
  if (sameDay) return `${formatDate(startIso)} - ${formatTime(startIso)} to ${formatTime(end.toISOString())}`;
  return `${formatDate(startIso)} ${formatTime(startIso)} - ${formatDate(end.toISOString())} ${formatTime(end.toISOString())}`;
}

function daysUntil(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

const CATEGORY_COLORS: Record<EventCategory, string> = {
  Workshop: "bg-blue-50 text-blue-700",
  Seminar: "bg-purple-50 text-purple-700",
  Competition: "bg-orange-50 text-orange-700",
  Activity: "bg-indigo-50 text-indigo-700",
  Training: "bg-yellow-50 text-yellow-800",
  Outreach: "bg-teal-50 text-teal-700",
  Cultural: "bg-pink-50 text-pink-700",
  Other: "bg-gray-100 text-gray-600",
};

const STATUS_CONFIG: Record<EventStatus, { label: string; style: string }> = {
  Upcoming: {
    label: "Upcoming",
    style: "bg-blue-50 text-blue-700 border-blue-200",
  },
  Open: { label: "Open", style: "bg-green-50 text-green-700 border-green-200" },
  Closed: {
    label: "Closed",
    style: "bg-gray-100 text-gray-500 border-gray-200",
  },
  Completed: {
    label: "Completed",
    style: "bg-gray-100 text-gray-500 border-gray-200",
  },
  Cancelled: {
    label: "Cancelled",
    style: "bg-red-50 text-red-500 border-red-200",
  },
};

function EventRow({ event }: { event: ManagedEvent }) {
  const fill =
    event.capacity > 0
      ? Math.min(
        Math.round((event.total_registered / event.capacity) * 100),
        100,
      )
      : 0;
  const isFull = fill >= 100;
  const days = daysUntil(event.start_date);
  const status = STATUS_CONFIG[event.status] ?? STATUS_CONFIG.Upcoming;

  return (
    <Link
      href={`/manage/events/${event.slug ?? event.id}`}
      className="group flex flex-col sm:flex-row sm:items-center gap-3 bg-white border border-gray-200 hover:border-green-300 hover:bg-green-50/30 rounded-xl px-5 py-4 transition-all no-underline"
    >
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${CATEGORY_COLORS[event.category] ?? CATEGORY_COLORS.Other}`}
          >
            {event.category}
          </span>
          <span
            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${status.style}`}
          >
            {status.label}
          </span>
          {event.is_paid && (
            <span className="text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full">
              Paid
            </span>
          )}
          {event.proofs_pending_review > 0 && (
            <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full">
              {event.proofs_pending_review} proofs
            </span>
          )}
        </div>

        <p className="text-[14px] font-bold text-gray-900 group-hover:text-green-800 transition-colors truncate">
          {event.title}
        </p>

        <div className="flex flex-wrap gap-x-4 gap-y-0.5">
          <span className="flex items-center gap-1 text-[12px] text-gray-400">
            <IconCalendar />
            {formatDateTimeRange(event.start_date, event.end_date)}
          </span>
          <span className="flex items-center gap-1 text-[12px] text-gray-400">
            <IconPin />
            {event.venue_name}
          </span>
        </div>
      </div>

      <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1.5 flex-shrink-0">
        <div className="flex flex-col items-end gap-1 min-w-[120px]">
          <div className="flex justify-between w-full text-[11px]">
            <span className="text-gray-400">
              {event.total_registered}/{event.capacity}
            </span>
            <span
              className={`font-semibold ${isFull ? "text-red-500" : "text-green-700"}`}
            >
              {isFull ? "Full" : `${fill}%`}
            </span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${isFull ? "bg-red-400" : "bg-green-500"}`}
              style={{ width: `${fill}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {days >= 0 &&
            event.status !== "Completed" &&
            event.status !== "Cancelled" && (
              <span
                className={`text-[11px] font-bold mt-0.5 px-2 py-0.5 rounded-full ${days <= 3 ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-500"}`}
              >
                {days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days}d`}
              </span>
            )}
          <svg
            className="w-4 h-4 text-gray-300 group-hover:text-green-500 transition-colors"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              d="M7 5l5 5-5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </Link>
  );
}

export default function ManageEventsPage() {
  const [events, setEvents] = useState<ManagedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<EventStatus | "All">("All");
  const [categoryFilter, setCategoryFilter] = useState<EventCategory | "All">(
    "All",
  );
  const [sort, setSort] = useState<SortKey>("date_desc");

  useEffect(() => {
    (async () => {
      const token =
        window.localStorage.getItem("auth_token") ??
        window.sessionStorage.getItem("auth_token");
      if (!token) {
        setError("Session missing. Please sign in again.");
        setLoading(false);
        return;
      }
      const res = await fetch(`${API_BASE_URL}/manage/dashboard?per_page=300`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }).catch(() => null);
      const payload = (await res?.json().catch(() => null)) as {
        success?: boolean;
        data?: any[];
        error?: string;
      } | null;
      if (
        !res ||
        !res.ok ||
        !payload?.success ||
        !Array.isArray(payload.data)
      ) {
        setError(payload?.error ?? "Unable to load events.");
        setLoading(false);
        return;
      }
      setEvents(
        payload.data.map((e) => ({
          id: String(e.id ?? ""),
          slug: e.slug ? String(e.slug) : String(e.id ?? ""),
          title: String(e.title ?? "Untitled Event"),
          category: (e.category_name ?? "Other") as EventCategory,
          start_date: String(e.start_date ?? new Date().toISOString()),
          end_date: String(
            e.end_date ?? e.start_date ?? new Date().toISOString(),
          ),
          venue_name: String(e.venue_name ?? "TBA"),
          status: (e.effective_status ?? e.status ?? "Upcoming") as EventStatus,
          is_paid: Boolean(e.is_paid),
          capacity: Number(e.capacity ?? 0),
          total_registered: Number(e.total_registered ?? 0),
          total_paid: Number(e.total_paid ?? 0),
          total_pending: Number(e.total_pending ?? 0),
          proofs_pending_review: Number(e.proofs_pending_review ?? 0),
        })),
      );
      setError("");
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    let result = [...events];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.venue_name.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== "All")
      result = result.filter((e) => e.status === statusFilter);
    if (categoryFilter !== "All")
      result = result.filter((e) => e.category === categoryFilter);
    result.sort((a, b) => {
      if (sort === "date_asc")
        return (
          new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
        );
      if (sort === "date_desc")
        return (
          new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
        );
      if (sort === "title_asc") return a.title.localeCompare(b.title);
      return b.total_registered - a.total_registered;
    });
    // Keep completed events at the bottom regardless of selected sort.
    result.sort((a, b) => {
      const aCompleted = a.status === "Completed";
      const bCompleted = b.status === "Completed";
      if (aCompleted === bCompleted) return 0;
      return aCompleted ? 1 : -1;
    });
    return result;
  }, [events, search, statusFilter, categoryFilter, sort]);

  const statusCounts = useMemo(() => {
    const counts: Partial<Record<EventStatus | "All", number>> = {
      All: events.length,
    };
    for (const s of ALL_STATUSES)
      counts[s] = events.filter((e) => e.status === s).length;
    return counts;
  }, [events]);

  const activeStatuses = ALL_STATUSES.filter((s) => (statusCounts[s] ?? 0) > 0);
  const hasActiveFilters = !!search || categoryFilter !== "All";

  return (
    <ManageShell pageTitle="Salikop">
      <div className="flex flex-col gap-6 animate-fade-in">
        <div className="flex flex-col w-full">
          <div>
            <p className="text-[12px] font-medium text-gray-400 uppercase tracking-wide leading-none">
              Manage
            </p>
            <div className="flex flex-row items-center justify-between gap-4 w-full mt-0.2">
              <div>
                <h1 className="text-[22px] font-bold text-gray-900 tracking-tight leading-none">
                  Events
                </h1>
                <p className="text-[14px] text-gray-500 mt-0.5">
                  View and manage all events organized by your organization.
                </p>
              </div>
              <Link
                href="/manage/create-event"
                className="flex items-center gap-2 text-[13px] font-semibold bg-green-700 hover:bg-green-800 text-white px-3 py-2 rounded-lg transition-colors no-underline flex-shrink-0"
              >
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M10 5v10M5 10h10"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Create event
              </Link>
            </div>
          </div>
        </div>

        {!!error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          {(["All", ...activeStatuses] as const).map((s) => {
            const isActive = statusFilter === s;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${isActive ? "bg-green-700 text-white border-green-700" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700"}`}
              >
                {s}
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}
                >
                  {statusCounts[s] ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        <div className="card" style={{ boxShadow: "none" }}>
          <div className="card-body py-3.5">
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center">
                <div className="input-icon-wrapper flex-1 min-w-[180px]">
                  <span className="input-icon-left">
                    <IconSearch />
                  </span>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search events..."
                    className={`input-has-left-icon ${search ? "input-has-right-icon" : ""}`}
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      aria-label="Clear search"
                      className="input-icon-right bg-transparent border-0 cursor-pointer transition-opacity hover:opacity-60"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 13 13"
                        fill="none"
                      >
                        <path
                          d="M2 2l9 9M11 2L2 11"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  )}
                </div>
                <FilterSelect
                  value={categoryFilter}
                  defaultValue="All"
                  onChange={(v) =>
                    setCategoryFilter(v as EventCategory | "All")
                  }
                  options={[
                    { value: "All", label: "All Categories" },
                    ...ALL_CATEGORIES.map((c) => ({ value: c, label: c })),
                  ]}
                  className="sm:w-34"
                />
                <FilterSelect
                  value={sort}
                  defaultValue="date_desc"
                  onChange={(v) => setSort(v as SortKey)}
                  options={SORT_OPTIONS}
                  className="sm:w-auto sm:min-w-[120px]"
                />
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setCategoryFilter("All");
                    }}
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
                  {categoryFilter !== "All" && (
                    <FilterChip
                      label={categoryFilter}
                      onRemove={() => setCategoryFilter("All")}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-[12px] text-gray-400 font-medium">
            {filtered.length === events.length
              ? `${events.length} events`
              : `${filtered.length} of ${events.length} events`}
          </p>
          {loading ? (
            <div className="text-sm text-gray-500">Loading events...</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center bg-white rounded-xl border border-gray-200">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-gray-300"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div>
                <p className="text-[14px] font-semibold text-gray-600">
                  No events found
                </p>
                <p className="text-[12px] text-gray-400 mt-0.5">
                  Try adjusting your search or filters
                </p>
              </div>
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("All");
                  setCategoryFilter("All");
                }}
                className="text-[13px] font-semibold text-green-700 hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </div>
    </ManageShell>
  );
}

function IconCalendar() {
  return (
    <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="none">
      <path
        d="M6 2v2M14 2v2M3 8h14M5 4h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
function IconPin() {
  return (
    <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 16 16" fill="none">
      <path
        d="M8 1C5.24 1 3 3.24 3 6c0 3.75 5 9 5 9s5-5.25 5-9c0-2.76-2.24-5-5-5zm0 6.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
function IconSearch() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none">
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M13.5 13.5L17 17"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
