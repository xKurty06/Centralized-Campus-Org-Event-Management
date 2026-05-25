"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type PaymentSelection = "Online" | "On-site" | "N/A";
type PaymentStatus = "Pending" | "Paid";
type AttendanceStatus = "Not_Arrived" | "Checked_In";
type ProofStatus = "Pending_Review" | "Approved" | "Rejected";
type EventStatus =
  | "Upcoming"
  | "Open"
  | "Full"
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

interface MyRegistration {
  id: string;
  event_id: string;
  event_slug?: string;
  reg_date: string;
  payment_selection: PaymentSelection;
  payment_status: PaymentStatus;
  attendance_status: AttendanceStatus;
  event_title: string;
  event_status: EventStatus;
  event_start_date: string;
  event_end_date: string;
  event_is_paid: boolean;
  venue_name: string;
  category_name: EventCategory;
  org_name: string;
  proof_status?: ProofStatus;
  banner_url?: string;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

function normalizeBannerUrl(raw?: string | null) {
  if (!raw) return undefined;
  const s = String(raw).trim();
  if (!s) return undefined;
  if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("//")) return s;
  try {
    const origin = new URL(API_BASE_URL).origin;
    const path = s.startsWith("/") ? s : `/${s}`;
    return `${origin}${path}`;
  } catch {
    return s;
  }
}

function isUpcoming(reg: MyRegistration) {
  return new Date(reg.event_start_date).getTime() >= Date.now();
}
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
  if (sameDay) return `${formatDate(startIso)} · ${formatTime(startIso)} - ${formatTime(end.toISOString())}`;
  return `${formatDate(startIso)} ${formatTime(startIso)} - ${formatDate(end.toISOString())} ${formatTime(end.toISOString())}`;
}
function daysUntil(iso: string): string | null {
  const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
  if (diff < 0) return null;
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return `In ${diff} days`;
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

/* Fallback gradient per category so the banner area is never blank */
const CATEGORY_GRADIENTS: Record<EventCategory, string> = {
  Workshop: "from-blue-400 to-blue-600",
  Seminar: "from-purple-400 to-purple-600",
  Competition: "from-orange-400 to-orange-600",
  Activity: "from-indigo-400 to-indigo-600",
  Training: "from-yellow-400 to-yellow-500",
  Outreach: "from-teal-400 to-teal-600",
  Cultural: "from-pink-400 to-pink-600",
  Other: "from-gray-300 to-gray-500",
};

function getStatusPill(reg: MyRegistration) {
  if (!reg.event_is_paid)
    return { label: "Confirmed", style: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-500" };
  if (reg.payment_status === "Paid")
    return { label: "Confirmed", style: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-500" };
  if (reg.payment_selection === "Online" && reg.proof_status === "Rejected")
    return { label: "Proof rejected", style: "bg-red-50 text-red-600 border-red-200", dot: "bg-red-400" };
  if (reg.payment_selection === "Online" && reg.proof_status === "Pending_Review")
    return { label: "Under review", style: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-400" };
  if (reg.payment_selection === "Online" && !reg.proof_status)
    return { label: "Upload required", style: "bg-red-50 text-red-600 border-red-200", dot: "bg-red-400" };
  if (reg.payment_selection === "On-site")
    return { label: "Pay on-site", style: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-400" };
  return { label: "Pending", style: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-400" };
}

function needsUpload(reg: MyRegistration) {
  return (
    reg.event_is_paid &&
    reg.payment_selection === "Online" &&
    reg.payment_status === "Pending" &&
    (reg.proof_status === undefined || reg.proof_status === "Rejected")
  );
}

/* ── Banner thumbnail ── */
function EventBanner({
  bannerUrl,
  category,
  title,
}: {
  bannerUrl?: string;
  category: EventCategory;
  title: string;
}) {
  const [imgError, setImgError] = useState(false);
  const gradient = CATEGORY_GRADIENTS[category] ?? CATEGORY_GRADIENTS.Other;

  if (bannerUrl && !imgError) {
    return (
      <img
        src={bannerUrl}
        alt={title}
        onError={() => setImgError(true)}
        className="w-full h-full object-cover"
      />
    );
  }

  /* Fallback — category-coloured gradient with a subtle initial */
  return (
    <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
      <span className="text-white/40 text-3xl font-black select-none tracking-tight">
        {title.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}

/* ── Registration card ── */
function RegistrationCard({
  reg,
  isUpcomingTab,
}: {
  reg: MyRegistration;
  isUpcomingTab: boolean;
}) {
  const statusPill = getStatusPill(reg);
  const countdown = isUpcomingTab ? daysUntil(reg.event_start_date) : null;
  const showUpload = needsUpload(reg);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex flex-col sm:flex-row">

        {/* ── Banner column ── */}
        <div className="relative sm:w-[110px] h-36 sm:h-auto flex-shrink-0 overflow-hidden bg-gray-100">
          <EventBanner
            bannerUrl={reg.banner_url}
            category={reg.category_name}
            title={reg.event_title}
          />
          {/* Countdown badge — sits on top of the banner */}
          {countdown && (
            <span className="absolute top-2 left-2 text-[10px] font-bold bg-green-700 text-white px-2 py-0.5 rounded-full shadow-sm">
              {countdown}
            </span>
          )}
          {/* Checked-in badge */}
          {reg.attendance_status === "Checked_In" && (
            <span className="absolute bottom-2 left-2 text-[10px] font-bold bg-white/90 text-green-700 border border-green-200 px-2 py-0.5 rounded-full shadow-sm">
              ✓ Attended
            </span>
          )}
        </div>

        {/* ── Content ── */}
        <div className="flex-1 p-4 flex flex-col gap-2 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${CATEGORY_COLORS[reg.category_name] ?? CATEGORY_COLORS.Other}`}>
              {reg.category_name}
            </span>
            <span className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${statusPill.style}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusPill.dot}`} />
              {statusPill.label}
            </span>
          </div>

          <Link
            href={`/events/${reg.event_slug ?? reg.event_id}`}
            className="text-[15px] font-semibold text-gray-900 hover:text-green-700 no-underline line-clamp-1"
          >
            {reg.event_title}
          </Link>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-gray-500">
            <span>
              {formatDateTimeRange(reg.event_start_date, reg.event_end_date)}
            </span>
            <span>{reg.venue_name || "TBA"}</span>
            <span>{reg.org_name || "Organization"}</span>
          </div>

          <p className="text-[11px] text-gray-400 mt-auto pt-1">
            Registered on {formatDate(reg.reg_date)}
          </p>
        </div>

        {/* ── Actions column ── */}
        <div className="flex sm:flex-col items-center justify-end gap-2 px-4 pb-4 sm:py-4 border-t sm:border-t-0 sm:border-l border-gray-100 min-w-[120px]">
          <Link
            href={`/events/${reg.event_slug ?? reg.event_id}`}
            className="w-full text-center text-[12px] font-semibold text-green-700 border border-green-200 hover:bg-green-50 px-3 py-2 rounded-lg no-underline"
          >
            View event
          </Link>
          {showUpload && (
            <Link
              href={`/events/${reg.event_slug ?? reg.event_id}/payment-upload?registration=${reg.id}`}
              className="w-full text-center text-[12px] font-semibold text-white bg-amber-500 hover:bg-amber-600 px-3 py-2 rounded-lg no-underline"
            >
              {reg.proof_status === "Rejected" ? "Reupload" : "Upload proof"}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Page ── */
export default function MyEventsPage() {
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [rows, setRows] = useState<MyRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const token =
        window.localStorage.getItem("auth_token") ??
        window.sessionStorage.getItem("auth_token");
      if (!token) {
        setError("You are not authenticated.");
        setLoading(false);
        return;
      }
      const res = await fetch(`${API_BASE_URL}/my-events?per_page=300`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }).catch(() => null);
      const payload = (await res?.json().catch(() => null)) as any;
      if (!res || !res.ok || !payload?.success) {
        setError(payload?.error ?? "Unable to load your events.");
        setRows([]);
        setLoading(false);
        return;
      }
      const data = Array.isArray(payload?.data) ? payload.data : [];
      setRows(
        data.map((r: any) => ({
          id: String(r.id ?? ""),
          event_id: String(r.event_id ?? ""),
          event_slug: r.event_slug ? String(r.event_slug) : String(r.event_id ?? ""),
          reg_date: String(r.reg_date ?? r.created_at ?? new Date().toISOString()),
          payment_selection: (r.payment_selection ?? "N/A") as PaymentSelection,
          payment_status: (r.payment_status ?? "Pending") as PaymentStatus,
          attendance_status: (r.attendance_status ?? "Not_Arrived") as AttendanceStatus,
          event_title: String(r.event_title ?? "Untitled Event"),
          event_status: (r.event_status ?? "Upcoming") as EventStatus,
          event_start_date: String(r.event_start_date ?? new Date().toISOString()),
          event_end_date: String(r.event_end_date ?? r.event_start_date ?? new Date().toISOString()),
          event_is_paid: Boolean(r.event_is_paid),
          venue_name: String(r.venue_name ?? "TBA"),
          category_name: (r.category_name ?? "Other") as EventCategory,
          org_name: String(r.org_name ?? ""),
          proof_status: (r.proof_status ?? undefined) as ProofStatus | undefined,
          /* Banner — try multiple common field names from the API */
          banner_url: normalizeBannerUrl(r.banner_url ?? r.event_banner_url ?? r.banner ?? r.cover_image ?? undefined),
        })),
      );
      setError("");
      setLoading(false);
    })();
  }, []);

  const upcomingRegs = useMemo(
    () => rows.filter(isUpcoming).sort((a, b) => new Date(a.event_start_date).getTime() - new Date(b.event_start_date).getTime()),
    [rows],
  );
  const pastRegs = useMemo(
    () => rows.filter((r) => !isUpcoming(r)).sort((a, b) => new Date(b.event_start_date).getTime() - new Date(a.event_start_date).getTime()),
    [rows],
  );

  const displayed = activeTab === "upcoming" ? upcomingRegs : pastRegs;
  const totalConfirmed = rows.filter((r) => !r.event_is_paid || r.payment_status === "Paid").length;
  const totalPending = rows.filter((r) => r.event_is_paid && r.payment_status === "Pending").length;
  const totalNeedAction = rows.filter(needsUpload).length;
  const totalCheckedIn = rows.filter((r) => r.attendance_status === "Checked_In").length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 w-full max-w-[1280px] mx-auto px-6 lg:px-12 py-8 flex flex-col gap-6 animate-fade-in">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-bold text-gray-900 tracking-tight">My Events</h1>
            <p className="text-[14px] text-gray-500 mt-1">
              Track your registrations, payment status, and attendance.
            </p>
          </div>
          <Link
            href="/events"
            className="flex items-center gap-2 text-[13px] font-semibold text-green-700 border border-green-200 hover:bg-green-50 px-4 py-2 rounded-lg no-underline"
          >
            Browse more events
          </Link>
        </div>

        {loading ? (
          <div className="text-sm text-gray-500">Loading your events...</div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat value={rows.length} label="Total registered" />
              <Stat value={totalConfirmed} label="Confirmed" color="text-green-700" bg="bg-green-50 border-green-200" />
              <Stat value={totalPending} label="Pending payment" color="text-amber-700" bg="bg-amber-50 border-amber-200" />
              <Stat value={totalCheckedIn} label="Attended" color="text-blue-700" bg="bg-blue-50 border-blue-200" />
            </div>

            {/* Needs-action banner */}
            {totalNeedAction > 0 && (
              <div className="text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                {totalNeedAction} registration{totalNeedAction > 1 ? "s require" : " requires"} proof of payment.
              </div>
            )}

            {/* Tab switcher */}
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit">
              {(
                [
                  { key: "upcoming", label: "Upcoming", count: upcomingRegs.length },
                  { key: "past", label: "Past", count: pastRegs.length },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-5 py-2 rounded-lg text-[13px] font-medium transition-colors
                    ${activeTab === tab.key
                      ? "bg-green-700 text-white"
                      : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                    }`}
                >
                  {tab.label}
                  <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full
                    ${activeTab === tab.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* List */}
            {displayed.length === 0 ? (
              <div className="text-sm text-gray-500 py-10 text-center">
                {activeTab === "upcoming" ? "No upcoming events." : "No past events."}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {displayed.map((reg) => (
                  <RegistrationCard
                    key={reg.id}
                    reg={reg}
                    isUpcomingTab={activeTab === "upcoming"}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

/* ── Stat card ── */
function Stat({
  value,
  label,
  color = "text-gray-900",
  bg = "bg-white border-gray-200",
}: {
  value: number;
  label: string;
  color?: string;
  bg?: string;
}) {
  return (
    <div className={`rounded-xl border ${bg} px-4 py-3.5 flex flex-col gap-0.5`}>
      <span className={`text-[24px] font-bold leading-none ${color}`}>{value}</span>
      <span className="text-[12px] text-gray-500">{label}</span>
    </div>
  );
}
