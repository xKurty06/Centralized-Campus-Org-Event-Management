"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { IconRefresh } from "@/components/ui/IconRefresh";
import { EventsPageSkeleton } from "@/components/skeletons";

type EventCategory =
  | "Workshop"
  | "Seminar"
  | "Competition"
  | "Training"
  | "Outreach"
  | "Cultural"
  | "Activity"
  | "Other";
type AudienceType = "CvSU_Only" | "Org_Members_Only";
type EventType = "Free" | "Paid";
type EventStatus =
  | "Upcoming"
  | "Open"
  | "Full"
  | "Closed"
  | "Completed"
  | "Cancelled";

interface CampusEvent {
  id: string;
  slug?: string;
  title: string;
  category: EventCategory;
  organization: string;
  orgCategory: "Academic" | "Non-Academic" | "Religious";
  audience_type: AudienceType;
  is_member: boolean;
  date: string;
  endDate: string;
  time: string;
  venue: string;
  type: EventType;
  status: EventStatus;
  fee?: number;
  capacity: number;
  registered: number;
  banner_url?: string | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

// Derive backend origin to resolve relative storage URLs (e.g. /storage/...)
let API_ORIGIN = "";
try {
  API_ORIGIN = new URL(API_BASE_URL).origin;
} catch (e) {
  API_ORIGIN = '';
}

function normalizeBannerUrl(raw?: string | null) {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;

  // 1. If it's already an absolute URL, return it directly
  if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("//")) {
    return s;
  }

  // 2. Safely extract the backend origin (e.g., "http://localhost:8000")
  let backendOrigin = "http://localhost:8000"; // Safe default
  try {
    // This strips out "/api/v1" and leaves just the base domain/port
    backendOrigin = new URL(API_BASE_URL).origin;
  } catch (e) {
    console.warn("Invalid API_BASE_URL format, using default origin.");
  }

  // 3. Ensure the path starts with a slash, then combine
  const path = s.startsWith("/") ? s : `/${s}`;
  return `${backendOrigin}${path}`;
}

const CATEGORIES: (EventCategory | "")[] = [
  "",
  "Workshop",
  "Seminar",
  "Competition",
  "Training",
  "Outreach",
  "Cultural",
  "Activity",
  "Other",
];
const TYPES = ["", "Free", "Paid"];
const DATE_FILTERS = ["", "Today", "Upcoming", "This Week", "This Month", "Past"];
const PH_TIMEZONE = "Asia/Manila";

function parseEventDate(value: string): Date {
  const s = String(value ?? "").trim();
  if (!s) return new Date(NaN);
  if (/[zZ]|[+\-]\d{2}:\d{2}$/.test(s)) return new Date(s);
  const normalized = s.includes("T") ? s : s.replace(" ", "T");
  return new Date(`${normalized}+08:00`);
}

function formatDate(iso: string) {
  return parseEventDate(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: PH_TIMEZONE,
  });
}
function formatDateTimeRange(startIso: string, endIso?: string) {
  const start = parseEventDate(startIso);
  const end = parseEventDate(endIso ?? startIso);
  const startTime = start.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: PH_TIMEZONE });
  const endTime = end.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: PH_TIMEZONE });
  return {
    start: `${formatDate(startIso)} ${startTime}`,
    end: `${formatDate(end.toISOString())} ${endTime}`,
  };
}
function formatPrice(value?: number) {
  return Number(value ?? 0).toLocaleString("en-PH");
}

function normalizeEventStatus(raw: unknown, startDate: string, endDate: string): EventStatus {
  const now = new Date();
  const start = parseEventDate(startDate);
  const end = parseEventDate(endDate);
  if (now > end) return "Completed";
  const value = String(raw ?? "").trim().toLowerCase();
  if (value === "upcoming") return "Upcoming";
  if (value === "open") return "Open";
  if (value === "closed") return "Closed";
  if (value === "completed") return "Completed";
  if (value === "cancelled") return "Cancelled";
  if (now < start) return "Upcoming";
  return "Open";
}

function getStatusBadgeColor(status: EventStatus): string {
  switch (status) {
    case "Upcoming":
      return "bg-blue-100 text-blue-700";
    case "Open":
      return "bg-green-100 text-green-700";
    case "Full":
      return "bg-amber-100 text-amber-700";
    case "Closed":
      return "bg-gray-100 text-gray-600";
    case "Completed":
      return "bg-purple-100 text-purple-700";
    case "Cancelled":
      return "bg-red-100 text-red-700";
  }
}

const CATEGORY_COLORS: Record<EventCategory, string> = {
  Workshop: "bg-blue-50 text-blue-700",
  Seminar: "bg-purple-50 text-purple-700",
  Competition: "bg-orange-50 text-orange-700",
  Training: "bg-yellow-50 text-yellow-800",
  Outreach: "bg-teal-50 text-teal-700",
  Cultural: "bg-pink-50 text-pink-700",
  Activity: "bg-indigo-50 text-indigo-700",
  Other: "bg-gray-100 text-gray-600",
};

const BANNER_COLORS: Record<string, string> = {
  "1": "bg-blue-100",
  "2": "bg-purple-100",
  "3": "bg-orange-100",
  "4": "bg-teal-100",
  "5": "bg-green-100",
  "6": "bg-pink-100",
  "7": "bg-blue-50",
  "8": "bg-yellow-50",
  "9": "bg-indigo-100",
  "10": "bg-orange-50",
  "11": "bg-green-50",
  "12": "bg-red-50",
};

interface DropdownOption {
  value: string;
  label: string;
}

function FilterDropdown({
  icon,
  placeholder,
  options,
  value,
  onChange,
  counts,
}: {
  icon: React.ReactNode;
  placeholder: string;
  options: DropdownOption[];
  value: string;
  onChange: (v: string) => void;
  counts?: Record<string, number>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);
  const selectedCount = value && counts ? counts[value] : undefined;
  const isActive = !!value;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border text-[13px] font-medium transition-all duration-150 cursor-pointer whitespace-nowrap ${isActive ? "bg-green-700 text-white border-green-700" : "bg-white text-gray-600 border-gray-200 hover:border-green-600 hover:text-green-700"}`}
      >
        <span className={isActive ? "text-white" : "text-gray-400"}>
          {icon}
        </span>
        <span>{isActive ? selected?.label : placeholder}</span>
        {isActive && typeof selectedCount === "number" ? (
          <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[11px] font-semibold text-green-700 shadow-sm">
            {selectedCount}
          </span>
        ) : (
          <svg
            className={`w-3.5 h-3.5 transition-transform duration-150 ${open ? "rotate-180" : ""} ${isActive ? "text-white" : "text-gray-400"}`}
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              d="M5 7.5l5 5 5-5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] min-w-[200px] bg-white border border-gray-200 rounded-xl shadow-lg z-30 overflow-hidden py-1">
          {options.map((opt) => {
            const count = counts?.[opt.value];
            return (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`flex items-center justify-between w-full px-4 py-2.5 text-[13px] font-medium text-left transition-colors duration-100 cursor-pointer ${opt.value === value ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
              >
                <span>{opt.label || `All ${placeholder}s`}</span>
                <span className="flex items-center gap-2">
                  {typeof count === "number" && (
                    <span
                      className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold ${opt.value === value ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                    >
                      {count}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EventCard({
  event,
  isOrgMembersOnly,
}: {
  event: CampusEvent;
  isOrgMembersOnly?: boolean;
}) {
  const spots = event.capacity - event.registered;
  const isFull = spots <= 0;
  const displayStatus: EventStatus = isFull ? "Full" : event.status;
  const isCompleted = displayStatus === "Completed";
  return (
    <Link
      href={`/events/${event.slug ?? event.id}`}
      className={`group rounded-xl border overflow-hidden transition-all duration-200 no-underline flex flex-col ${
        isCompleted
          ? "bg-gray-50 border-gray-200 opacity-75"
          : "bg-white border-gray-200 hover:shadow-md hover:-translate-y-0.5"
      }`}
    >
        <div
          className={`h-36 relative flex items-center justify-center overflow-hidden ${event.banner_url ? "bg-gray-100" : BANNER_COLORS[event.id] ?? "bg-gray-100"} ${isCompleted ? "grayscale" : ""}`}
        >
          {event.banner_url ? (
            <>
              <img
                src={event.banner_url}
                alt={event.title}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-black/10 pointer-events-none" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-black/10 pointer-events-none" />
              <svg
                className="w-10 h-10 text-gray-300"
                viewBox="0 0 24 24"
                fill="none"
              >
                <rect
                  x="3"
                  y="4"
                  width="18"
                  height="16"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M8 2v4M16 2v4M3 10h18"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </>
          )}
          <div className="absolute top-3 right-3">
            {event.type === "Free" ? (
              <span className="text-[11px] font-semibold bg-green-700 text-white px-2.5 py-0.5 rounded-full">
                Free
              </span>
            ) : (
              <span className="text-[11px] font-medium bg-amber-500 text-white px-2.5 py-0.5 rounded-full">
                ₱ {formatPrice(event.fee ?? 0)}
              </span>
            )}
          </div>
          {isFull && (
            <div className="absolute top-3 left-3">
              <span className="text-[11px] font-semibold bg-red-500 text-white px-2.5 py-1 rounded-full">
                Full
              </span>
            </div>
          )}
        </div>
        <div className="p-4 flex flex-col gap-2 flex-1">
          <div className="flex items-center gap-1">
            <span
              className={`self-start text-[11px] font-semibold px-2.5 py-0.5 rounded-md ${CATEGORY_COLORS[event.category]}`}
            >
              {event.category}
            </span>
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${getStatusBadgeColor(displayStatus)}`}>
              {displayStatus}
            </span>
            {isOrgMembersOnly && (
              <span className="text-[11px] font-semibold badge badge-green px-2.5 py-0.5 rounded-full">
                Exclusive
              </span>
            )}
          </div>
          <h3 className={`text-[14px] font-semibold leading-snug transition-colors line-clamp-2 ${isCompleted ? "text-gray-600" : "text-gray-900 group-hover:text-green-700"}`}>
            {event.title}
          </h3>
          <div className="flex flex-col gap-1 mt-auto pt-2">
            <div className="flex items-center gap-1.5 text-[12px] text-gray-500">
              <IconClock />
              <span className="flex flex-col leading-snug">
                <span>{formatDateTimeRange(event.date, event.endDate).start}</span>
                <span>{formatDateTimeRange(event.date, event.endDate).end}</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[12px] text-gray-500">
              <IconPin />
              {event.venue}
            </div>
            <div className="flex items-center gap-1.5 text-[12px] text-gray-500">
              <IconOrg />
              {event.organization}
            </div>
          </div>
        </div>
    </Link>
  );
}

function EventListRow({
  event,
  isOrgMembersOnly,
}: {
  event: CampusEvent;
  isOrgMembersOnly?: boolean;
}) {
  const spots = event.capacity - event.registered;
  const isFull = spots <= 0;
  const fill = event.capacity > 0 ? Math.min(Math.round((event.registered / event.capacity) * 100), 100) : 0;
  const displayStatus: EventStatus = isFull ? "Full" : event.status;
  const range = formatDateTimeRange(event.date, event.endDate);
  const isCompleted = displayStatus === "Completed";

  return (
    <Link
      href={`/events/${event.slug ?? event.id}`}
      className={`group rounded-xl border transition-all no-underline overflow-hidden ${
        isCompleted
          ? "bg-gray-50 border-gray-200 opacity-75"
          : "bg-white border-gray-200 hover:border-green-300 hover:shadow-sm"
      }`}
    >
      <div className="flex flex-col sm:flex-row">
        <div
          className={`relative h-28 sm:h-auto sm:w-36 flex-shrink-0 overflow-hidden ${event.banner_url ? "bg-gray-100" : BANNER_COLORS[event.id] ?? "bg-gray-100"} ${isCompleted ? "grayscale" : ""}`}
        >
          {event.banner_url ? (
            <img
              src={event.banner_url}
              alt={event.title}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-300">
              <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 2v4M16 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          )}
          <div className="absolute inset-0 bg-black/10 pointer-events-none" />
          <span
            className={`absolute left-2.5 top-2.5 text-[11px] px-2.5 py-0.5 rounded-full shadow-sm ${
              event.type === "Free"
                ? "font-semibold bg-green-700 text-white"
                : "font-medium bg-amber-500 text-white"
            }`}
          >
            {event.type === "Free" ? "Free" : `₱ ${formatPrice(event.fee ?? 0)}`}
          </span>
        </div>

        <div className="flex-1 min-w-0 p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${CATEGORY_COLORS[event.category]}`}>
                  {event.category}
                </span>
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${getStatusBadgeColor(displayStatus)}`}>
                  {displayStatus}
                </span>
                {isOrgMembersOnly && (
                  <span className="text-[11px] font-semibold badge badge-green px-2.5 py-0.5 rounded-full">
                    Exclusive
                  </span>
                )}
              </div>
              <p className={`text-[15px] font-semibold transition-colors truncate ${isCompleted ? "text-gray-600" : "text-gray-900 group-hover:text-green-700"}`}>
                {event.title}
              </p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-gray-500">
                <span className="inline-flex items-center gap-1.5 min-w-0">
                  <IconOrg />
                  <span className="truncate">{event.organization}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 min-w-0">
                  <IconPin />
                  <span className="truncate">{event.venue}</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_140px] gap-3 lg:w-[430px]">
              <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2 text-[12px] text-gray-600">
                <div className="flex items-center gap-1.5">
                  <IconClock />
                  <div className="min-w-0 leading-snug">
                    <p><span className="font-semibold text-gray-700">Start</span> {range.start}</p>
                    <p><span className="font-semibold text-gray-700">End</span> {range.end}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2 text-[12px] text-gray-600">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-gray-800">
                    {event.registered}/{event.capacity}
                  </span>
                  <span className={`text-[11px] font-semibold ${isCompleted ? "text-gray-500" : isFull ? "text-red-500" : "text-green-700"}`}>
                    {isCompleted ? "Event ended" : isFull ? "Full" : `${spots} left`}
                  </span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isFull ? "bg-red-400" : "bg-green-600"}`}
                    style={{ width: `${fill}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function EventsPage() {
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [organization, setOrganization] = useState("");
  const [venue, setVenue] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  async function loadEvents(showRefresh = false) {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    const res = await fetch(`${API_BASE_URL}/events?per_page=500`, {
      headers: { Accept: "application/json" },
    }).catch(() => null);
    const payload = (await res?.json().catch(() => null)) as {
      success?: boolean;
      data?: any[];
      error?: string;
    } | null;

    if (!res || !res.ok || !payload?.success || !Array.isArray(payload.data)) {
      setError(payload?.error ?? "Unable to load events.");
      setEvents([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setEvents(
      payload.data.map((e) => {
        const category = String(e.category_name ?? "Other");
        const normalizedCategory = [
          "Workshop",
          "Seminar",
          "Competition",
          "Training",
          "Outreach",
          "Cultural",
          "Activity",
          "Other",
        ].includes(category)
          ? (category as EventCategory)
          : "Other";
        const startDate = String(e.start_date ?? new Date().toISOString());
        const endDate = String(e.end_date ?? startDate);

        return {
          id: String(e.id ?? ""),
          slug: e.slug ? String(e.slug) : String(e.id ?? ""),
          title: e.title ?? "Untitled Event",
          category: normalizedCategory,
          organization: e.organization_name ?? "Organization",
          orgCategory: (e.organization_category ?? "Non-Academic") as
            | "Academic"
            | "Non-Academic"
            | "Religious",
          audience_type: (e.audience_type ?? "CvSU_Only") as AudienceType,
          is_member: Boolean(e.is_member ?? false),
          date: startDate,
          endDate: endDate,
          time: startDate
            ? parseEventDate(startDate).toLocaleTimeString("en-PH", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
              timeZone: PH_TIMEZONE,
            })
            : "-",
          venue: e.venue_name ?? "TBA",
          type: Boolean(e.is_paid) ? "Paid" : "Free",
          status: normalizeEventStatus(e.effective_status ?? e.status, startDate, endDate),
          fee: Number(e.fee_amount ?? 0),
          capacity: Number(e.capacity ?? 0),
          registered: Number(e.total_registered ?? 0),
          // Mapping updated to use normalizeBannerUrl
          banner_url: normalizeBannerUrl(e.banner_url),
        };
      }),
    );

    setError("");
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    loadEvents(false);
  }, []);

  useEffect(() => {
    const saved = window.sessionStorage.getItem("events_view_mode");
    if (saved === "list") {
      setViewMode("list");
    }
  }, []);

  useEffect(() => {
    window.sessionStorage.setItem("events_view_mode", viewMode);
  }, [viewMode]);

  const ORGANIZATIONS = useMemo(
    () => ["", ...new Set(events.map((e) => e.organization))],
    [events],
  );
  const VENUES = useMemo(
    () => ["", ...new Set(events.map((e) => e.venue))],
    [events],
  );

  const filtered = useMemo(
    () =>
      events
      .filter((e) => {
        const q = search.toLowerCase();
        const now = new Date();
        const start = parseEventDate(e.date);
        const end = parseEventDate(e.endDate);
        const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
        const todayDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const dayOfWeek = now.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
        const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);
        const weekStartDay = weekStart.getTime();
        const weekEndDay = weekEnd.getTime();
        const isSameMonth = start.getFullYear() === now.getFullYear() && start.getMonth() === now.getMonth();

        const isOngoingNow = start.getTime() <= now.getTime() && end.getTime() >= now.getTime();
        const isLaterToday = startDay === todayDay && start.getTime() > now.getTime();

        const matchDate =
          !dateFilter ||
          (dateFilter === "Today" && (isOngoingNow || isLaterToday)) ||
          (dateFilter === "Upcoming" && start.getTime() >= now.getTime()) ||
          (dateFilter === "This Week" && startDay >= weekStartDay && startDay <= weekEndDay) ||
          (dateFilter === "This Month" && isSameMonth) ||
          (dateFilter === "Past" && end.getTime() < now.getTime());

        return (
          (!search ||
            e.title.toLowerCase().includes(q) ||
            e.organization.toLowerCase().includes(q)) &&
          (!category || e.category === category) &&
          (!organization || e.organization === organization) &&
          (!venue || e.venue === venue) &&
          (!typeFilter || e.type === typeFilter) &&
          matchDate
        );
      })
      .sort((a, b) => {
        const aCompleted = a.status === "Completed";
        const bCompleted = b.status === "Completed";
        if (aCompleted === bCompleted) return 0;
        return aCompleted ? 1 : -1;
      }),
    [events, search, category, organization, venue, typeFilter, dateFilter],
  );

  const activeFilters = [category, organization, venue, typeFilter, dateFilter].filter(
    Boolean,
  ).length;

  const clearAll = () => {
    setSearch("");
    setCategory("");
    setOrganization("");
    setVenue("");
    setTypeFilter("");
    setDateFilter("");
  };

  const categoryCounts = useMemo(
    () =>
      events.reduce<Record<string, number>>((a, e) => {
        a[e.category] = (a[e.category] || 0) + 1;
        return a;
      }, {}),
    [events],
  );
  const organizationCounts = useMemo(
    () =>
      events.reduce<Record<string, number>>((a, e) => {
        a[e.organization] = (a[e.organization] || 0) + 1;
        return a;
      }, {}),
    [events],
  );
  const venueCounts = useMemo(
    () =>
      events.reduce<Record<string, number>>((a, e) => {
        a[e.venue] = (a[e.venue] || 0) + 1;
        return a;
      }, {}),
    [events],
  );
  const typeCounts = useMemo(
    () =>
      events.reduce<Record<string, number>>((a, e) => {
        a[e.type] = (a[e.type] || 0) + 1;
        return a;
      }, {}),
    [events],
  );
  const dateCounts = useMemo(() => {
    const now = new Date();
    const todayDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
    const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);
    const weekStartDay = weekStart.getTime();
    const weekEndDay = weekEnd.getTime();
    const counts: Record<string, number> = {};

    for (const e of events) {
      const start = parseEventDate(e.date);
      const end = parseEventDate(e.endDate);
      const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
      const isSameMonth = start.getFullYear() === now.getFullYear() && start.getMonth() === now.getMonth();
      const isOngoingNow = start.getTime() <= now.getTime() && end.getTime() >= now.getTime();
      const isLaterToday = startDay === todayDay && start.getTime() > now.getTime();
      if (isOngoingNow || isLaterToday) counts["Today"] = (counts["Today"] ?? 0) + 1;
      if (start.getTime() >= now.getTime()) counts["Upcoming"] = (counts["Upcoming"] ?? 0) + 1;
      if (startDay >= weekStartDay && startDay <= weekEndDay) counts["This Week"] = (counts["This Week"] ?? 0) + 1;
      if (isSameMonth) counts["This Month"] = (counts["This Month"] ?? 0) + 1;
      if (parseEventDate(e.endDate).getTime() < now.getTime()) counts["Past"] = (counts["Past"] ?? 0) + 1;
    }

    return counts;
  }, [events]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 w-full max-w-[1280px] mx-auto px-6 lg:px-12 py-8 flex flex-col gap-6 animate-fade-in">
        <div className="flex flex-col gap-1">
          <h1 className="text-[26px] font-bold text-gray-900 tracking-tight">
            Campus Events
          </h1>
          <p className="text-[14px] text-gray-500">
            Browse all published events from accredited CvSU organizations.
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex flex-col gap-3">
          <div className="relative">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => loadEvents(true)}
                className="inline-flex items-center justify-center w-8 ml-[-5px] h-11 rounded-lg bg-white text-green-700 hover:text-green-800 transition-colors"
                disabled={refreshing || loading}
                aria-label="Refresh events"
                title="Refresh events"
              >
                <IconRefresh spinning={refreshing} />
              </button>
              <div className="relative flex-1">
                <svg
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path
                    d="M9 17A8 8 0 109 1a8 8 0 000 16zM19 19l-4.35-4.35"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search events by title or organization..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-[14px] text-gray-900 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-600 focus:bg-white focus:shadow-[0_0_0_3px_#dcfce7] transition-all placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-gray-400 mr-1">
              Filters
            </div>
            <FilterDropdown
              icon={
                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none">
                  <path d="M6 2v3M14 2v3M3 8h14M5 5h10a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              }
              placeholder="Date"
              value={dateFilter}
              onChange={setDateFilter}
              counts={dateCounts}
              options={DATE_FILTERS.map((d) => ({
                value: d,
                label: d || "All Dates",
              }))}
            />
            <FilterDropdown
              icon={
                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M4 6h12M4 10h8M4 14h5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              }
              placeholder="Category"
              value={category}
              onChange={setCategory}
              counts={categoryCounts}
              options={CATEGORIES.map((c) => ({
                value: c,
                label: c || "All Categories",
              }))}
            />
            <FilterDropdown
              icon={
                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM3 17a7 7 0 1114 0H3z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              }
              placeholder="Organization"
              value={organization}
              onChange={setOrganization}
              counts={organizationCounts}
              options={ORGANIZATIONS.map((o) => ({
                value: o,
                label: o || "All Organizations",
              }))}
            />
            <FilterDropdown
              icon={
                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M10 2C6.69 2 4 4.69 4 8c0 4.5 6 10 6 10s6-5.5 6-10c0-3.31-2.69-6-6-6zm0 8.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              }
              placeholder="Venue"
              value={venue}
              onChange={setVenue}
              counts={venueCounts}
              options={VENUES.map((v) => ({
                value: v,
                label: v || "All Venues",
              }))}
            />
            <FilterDropdown
              icon={
                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M9 5H7a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h0a2 2 0 002-2M9 5a2 2 0 012-2h0a2 2 0 012 2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              }
              placeholder="Type"
              value={typeFilter}
              onChange={setTypeFilter}
              counts={typeCounts}
              options={TYPES.map((t) => ({
                value: t,
                label: t || "All Types",
              }))}
            />
            {activeFilters > 0 && (
              <button
                onClick={clearAll}
                className="text-[12px] font-medium text-red-500 hover:text-red-600 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer flex items-center gap-1"
              >
                Clear {activeFilters > 1 ? `(${activeFilters})` : ""}
              </button>
            )}
            <div className="flex h-[37px] items-center rounded-lg border border-gray-200 overflow-hidden ml-2">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
                title="Grid view"
                className={`h-full w-10 inline-flex items-center justify-center transition-colors ${viewMode === "grid" ? "bg-green-700 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
              >
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
                  <rect x="2.5" y="2.5" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="11.5" y="2.5" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="2.5" y="11.5" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="11.5" y="11.5" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-label="List view"
                title="List view"
                className={`h-full w-10 inline-flex items-center justify-center transition-colors border-l border-gray-200 ${viewMode === "list" ? "bg-green-700 text-white border-l-green-700" : "bg-white text-gray-500 hover:bg-gray-50"}`}
              >
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
                  <path d="M4 5.5h12M4 10h12M4 14.5h12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <span className="ml-auto text-[12px] text-gray-400">
              {filtered.length} {filtered.length === 1 ? "event" : "events"}{" "}
              found
            </span>
          </div>
        </div>
        {!!error && <div className="text-sm text-red-600">{error}</div>}
        {loading ? (
          <EventsPageSkeleton view={viewMode} />
        ) : filtered.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 animate-content-reveal">
              {filtered.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isOrgMembersOnly={event.audience_type === "Org_Members_Only"}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3 animate-content-reveal">
              {filtered.map((event) => (
                <EventListRow
                  key={event.id}
                  event={event}
                  isOrgMembersOnly={event.audience_type === "Org_Members_Only"}
                />
              ))}
            </div>
          )
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-24 gap-3 text-center animate-content-reveal">
            <p className="text-[15px] font-semibold text-gray-700">
              No events found
            </p>
            <p className="text-[13px] text-gray-400 max-w-xs">
              No events match your current filters. Try adjusting your search or
              clearing filters.
            </p>
            <button
              onClick={clearAll}
              className="mt-1 text-[13px] font-semibold text-green-700 hover:text-green-800 hover:underline cursor-pointer"
            >
              Clear all filters
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function IconClock() {
  return (
    <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M8 4.5v4l2.5 1.5"
        stroke="currentColor"
        strokeWidth="1.2"
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

function IconOrg() {
  return (
    <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 16 16" fill="none">
      <path
        d="M8 8a3 3 0 100-6 3 3 0 000 6zm-5 6a5 5 0 0110 0H3z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}



