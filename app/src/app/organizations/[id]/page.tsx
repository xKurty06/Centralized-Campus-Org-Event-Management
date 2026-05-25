"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DetailPageSkeleton } from "@/components/skeletons";

type OrgCategory = "Academic" | "Non-Academic" | "Religious";
type EventCategory =
  | "Workshop"
  | "Seminar"
  | "Competition"
  | "Training"
  | "Outreach"
  | "Cultural"
  | "Activity"
  | "Other";

interface OfficerProfile {
  id: string;
  name: string;
  position?: string | null;
  schoolId?: string | null;
  email?: string | null;
  course?: string | null;
  courseCode?: string | null;
  department?: string | null;
  yearLevel?: number | null;
  section?: string | null;
  isActive?: boolean;
}
interface MemberProfile {
  id: string;
  name: string;
  schoolId?: string | null;
  email?: string | null;
  department?: string | null;
  courseCode?: string | null;
  yearLevel?: number | null;
  section?: string | null;
  membershipStatus?: string | null;
  paidMembershipFee?: boolean;
}
interface OrgEvent {
  id: string;
  slug?: string;
  title: string;
  category: EventCategory;
  date: string;
  endDate: string;
  venue: string;
  type: "Free" | "Paid";
  fee?: number;
  registered: number;
  capacity: number;
  status?: string | null;
  audienceType?: string | null;
  bannerUrl?: string;
  bannerColor: string;
}
interface Organization {
  id: string;
  slug?: string;
  name: string;
  acronym: string;
  logoUrl: string;
  category: OrgCategory;
  categoryName?: string | null;
  description: string;
  adviser?: string | null;
  membersCount: number;
  eventsThisYear: number;
  accreditationStatus?: string | null;
  isAccredited?: boolean;
  established: string;
  status: "Active" | "Suspended";
  color: string;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";
const PH_TIMEZONE = "Asia/Manila";
const API_ORIGIN = (() => {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return "http://localhost:8000";
  }
})();

function parseEventDate(value?: string | null): Date {
  const s = String(value ?? "").trim();
  if (!s) return new Date(NaN);
  if (/[zZ]|[+\-]\d{2}:\d{2}$/.test(s)) return new Date(s);
  const normalized = s.includes("T") ? s : s.replace(" ", "T");
  return new Date(`${normalized}+08:00`);
}

function normalizeImageUrl(raw?: string | null): string {
  if (!raw) return "";
  const value = String(raw).trim();
  if (!value) return "";
  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("//")
  )
    return value;
  const path = value.startsWith("/") ? value : `/${value}`;
  return `${API_ORIGIN}${path}`;
}

function formatDate(iso: string) {
  return parseEventDate(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: PH_TIMEZONE,
  });
}
function formatDateRange(startIso: string, endIso?: string) {
  const start = parseEventDate(startIso);
  const end = parseEventDate(endIso ?? startIso);
  const sameDay = start.toDateString() === end.toDateString();
  if (sameDay) return formatDate(startIso);
  return `${formatDate(startIso)} - ${formatDate(end.toISOString())}`;
}
function formatPrice(value?: number) {
  return Number(value ?? 0).toLocaleString("en-PH");
}

function isOngoing(startIso: string, endIso: string) {
  const now = Date.now();
  const start = parseEventDate(startIso).getTime();
  const end = parseEventDate(endIso).getTime();
  return start <= now && now <= end;
}

function normalizeEventStatus(rawStatus?: string | null, startDate?: string | null, endDate?: string | null) {
  const s = String(rawStatus ?? "").trim().toLowerCase();
  if (s === "cancelled") return "Cancelled";
  if (s === "completed") return "Completed";
  if (s === "closed") return "Closed";
  if (s === "open") return "Open";
  if (s === "upcoming") return "Upcoming";
  const start = parseEventDate(startDate);
  const end = parseEventDate(endDate ?? startDate);
  const now = Date.now();
  if (!Number.isNaN(end.getTime()) && now > end.getTime()) return "Completed";
  if (!Number.isNaN(start.getTime()) && now < start.getTime()) return "Upcoming";
  return "Open";
}

/** Initials avatar from a name string */
function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

/** Deterministic hue from a string for avatar bg */
const AVATAR_PALETTES = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-teal-100 text-teal-700",
  "bg-orange-100 text-orange-700",
  "bg-pink-100 text-pink-700",
  "bg-indigo-100 text-indigo-700",
];
function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length];
}

function getBadgeClass(type: "status" | "audience" | "price" | "org-status", value?: string | null) {
  switch (type) {
    case "status":
      if (value === "Cancelled") return "bg-red-100 text-red-700";
      if (value === "Completed" || value === "Closed") return "bg-slate-100 text-slate-600";
      if (value === "Open") return "bg-emerald-100 text-emerald-700";
      return "bg-blue-100 text-blue-700";
    case "audience":
      return value === "Org_Members_Only"
        ? "bg-emerald-100 text-emerald-700"
        : "bg-sky-100 text-sky-700";
    case "price":
      return value === "Paid"
        ? "bg-amber-100 text-amber-800"
        : "bg-emerald-100 text-emerald-700";
    case "org-status":
      return value === "Suspended"
        ? "bg-red-100 text-red-700 border-red-200"
        : "bg-emerald-100 text-emerald-700 border-emerald-200";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

const CATEGORY_COLORS: Record<EventCategory, string> = {
  Workshop: "bg-blue-100 text-blue-700",
  Seminar: "bg-purple-100 text-purple-700",
  Competition: "bg-orange-100 text-orange-700",
  Training: "bg-yellow-100 text-yellow-800",
  Outreach: "bg-teal-100 text-teal-700",
  Cultural: "bg-pink-100 text-pink-700",
  Activity: "bg-indigo-100 text-indigo-700",
  Other: "bg-gray-100 text-gray-600",
};

const ORG_CATEGORY_META: Record<OrgCategory, { color: string; bg: string }> = {
  Academic: { color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  "Non-Academic": { color: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
  Religious: { color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
};

/** Shared badge style: same padding/font as category pill */
const PILL = "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold leading-none";

export default function OrgProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const [org, setOrg] = useState<Organization | null>(null);
  const [events, setEvents] = useState<OrgEvent[]>([]);
  const [officers, setOfficers] = useState<OfficerProfile[]>([]);
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [activeTab, setActiveTab] = useState<"about" | "officers" | "members" | "events">("about");
  const [eventsViewMode, setEventsViewMode] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [orgRes, eventsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/organizations/${id}`, {
          headers: { Accept: "application/json" },
        }).catch(() => null),
        fetch(
          `${API_BASE_URL}/events?org_id=${encodeURIComponent(id)}&per_page=100`,
          { headers: { Accept: "application/json" } },
        ).catch(() => null),
      ]);
      const orgPayload = (await orgRes?.json().catch(() => null)) as {
        success?: boolean;
        data?: any;
      } | null;
      const evPayload = (await eventsRes?.json().catch(() => null)) as {
        success?: boolean;
        data?: any;
      } | null;

      const eventRows: any[] = Array.isArray(evPayload?.data?.data)
        ? evPayload.data.data
        : Array.isArray(evPayload?.data)
        ? evPayload.data
        : [];

      if (!orgRes || !orgRes.ok || !orgPayload?.success || !orgPayload.data?.org) {
        setOrg(null);
        setLoading(false);
        return;
      }

      const colorMap: Record<string, string> = {
        Academic: "bg-blue-100 text-blue-700",
        "Non-Academic": "bg-orange-100 text-orange-700",
        Religious: "bg-purple-100 text-purple-700",
      };
      const bannerColors = [
        "bg-blue-100",
        "bg-purple-100",
        "bg-orange-100",
        "bg-teal-100",
        "bg-green-100",
        "bg-pink-100",
      ];

      const mappedEvents: OrgEvent[] = eventRows.map((e, i) => ({
            id: String(e.id ?? ""),
            slug: e.slug ? String(e.slug) : String(e.id ?? ""),
            title: e.title ?? "Untitled Event",
            category: (e.category_name ?? "Other") as EventCategory,
            date: e.start_date ?? new Date().toISOString(),
            endDate: e.end_date ?? e.start_date ?? new Date().toISOString(),
            venue: e.venue_name ?? "TBA",
            type: Boolean(e.is_paid) ? "Paid" : "Free",
            fee: Number(e.fee_amount ?? 0),
            capacity: Number(e.capacity ?? 0),
            registered: Number(e.total_registered ?? 0),
            status: normalizeEventStatus(e.effective_status ?? e.status, e.start_date, e.end_date),
            audienceType: e.audience_type ?? null,
            bannerUrl: normalizeImageUrl(e.banner_url),
            bannerColor: bannerColors[i % bannerColors.length],
          }));

      setOrg({
        id: String(orgPayload.data.org.id ?? ""),
        slug: orgPayload.data.org.slug
          ? String(orgPayload.data.org.slug)
          : String(orgPayload.data.org.id ?? ""),
        name: orgPayload.data.org.name ?? "Organization",
        acronym: String(
          orgPayload.data.org.code_name ?? orgPayload.data.org.name ?? "ORG",
        )
          .slice(0, 8)
          .toUpperCase(),
        logoUrl: normalizeImageUrl(orgPayload.data.org.logo_url),
        category: (orgPayload.data.org.category_name ?? "Non-Academic") as OrgCategory,
        categoryName: orgPayload.data.org.category_name ?? null,
        description: orgPayload.data.org.description ?? "No description provided.",
        adviser: orgPayload.data.org.adviser ?? null,
        membersCount: Number(orgPayload.data.org.members_count ?? 0),
        eventsThisYear: Number(orgPayload.data.org.events_this_year ?? 0),
        accreditationStatus: orgPayload.data.org.accreditation_status ?? null,
        isAccredited: Boolean(orgPayload.data.org.is_accredited),
        established: String(orgPayload.data.org.founded_date ?? "").slice(0, 4) || "N/A",
        status:
          orgPayload.data.org.accreditation_status === "Suspended"
            ? "Suspended"
            : "Active",
        color:
          colorMap[orgPayload.data.org.category_name ?? "Non-Academic"] ??
          "bg-gray-100 text-gray-700",
      });
      setOfficers(
        Array.isArray(orgPayload.data.officers)
          ? orgPayload.data.officers.map((officer: any) => ({
              id: String(officer.id ?? ""),
              name: officer.user_name ?? "Unknown Officer",
              position: officer.position ?? null,
              schoolId: officer.user_school_id ?? null,
              email: officer.user_email ?? null,
              course: officer.course_code ?? null,
              courseCode: officer.course_code ?? null,
              department: officer.department_code ?? null,
              yearLevel: officer.year_level != null ? Number(officer.year_level) : null,
              section: officer.section != null ? String(officer.section) : null,
              isActive: officer.is_active ?? false,
            }))
          : [],
      );
      setMembers(
        Array.isArray(orgPayload.data.members)
          ? orgPayload.data.members.map((member: any) => ({
              id: String(member.id ?? ""),
              name: String(
                member.name ??
                  `${member.first_name ?? ""} ${member.last_name ?? ""}`.trim() ??
                  "Unknown Member",
              ),
              schoolId: member.school_id ?? null,
              email: member.email ?? null,
              department: member.department_code ?? null,
              courseCode: member.course_code ?? null,
              yearLevel: member.year_level != null ? Number(member.year_level) : null,
              section: member.section != null ? String(member.section) : null,
              membershipStatus: member.membership_status ?? null,
              paidMembershipFee: Boolean(member.paid_membership_fee ?? false),
            }))
          : [],
      );
      mappedEvents.sort((a, b) => {
        const aStart = parseEventDate(a.date).getTime();
        const bStart = parseEventDate(b.date).getTime();
        const aCompleted = a.status === "Completed";
        const bCompleted = b.status === "Completed";
        if (aCompleted === bCompleted) return aStart - bStart;
        return aCompleted ? 1 : -1;
      });
      setEvents(mappedEvents);
      setLoading(false);
    })();
  }, [id]);

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <DetailPageSkeleton />
      </div>
    );
  if (!org)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-sm text-gray-400">
        Organization not found.
      </div>
    );

  const catMeta = ORG_CATEGORY_META[org.category];
  /* strip the text- class to get just the bg color for the banner */
  const bannerBg = org.color.split(" ")[0];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-12 py-8 flex flex-col gap-5 animate-content-reveal">

        {/* ── Back link ── */}
        <Link
          href="/organizations"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors no-underline w-fit"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
            <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Organizations
        </Link>

        {/* ── Profile header card ── */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          {/* Banner */}
          <div className={`h-28 ${bannerBg} opacity-50`} />

          {/* Content below banner */}
          <div className="px-6 pb-6">
            {/* Logo + category badge row */}
            <div className="flex items-end justify-between -mt-10 mb-4">
              {/* Logo */}
              <div
                className={`relative z-10 w-20 h-20 rounded-2xl border-4 border-white shadow-md flex items-center justify-center text-[18px] font-bold flex-shrink-0 overflow-hidden ${org.color}`}
              >
                {org.logoUrl ? (
                  <img
                    src={org.logoUrl}
                    alt={`${org.name} logo`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  org.acronym.slice(0, 2)
                )}
              </div>

              {/* Right side badges */}
              <div className="flex items-center gap-2 pb-1">
                <span className={`${PILL} border ${catMeta.bg} ${catMeta.color}`}>
                  {org.category}
                </span>
                <span className={`${PILL} border ${getBadgeClass("org-status", org.accreditationStatus)}`}>
                  {org.status}
                </span>
              </div>
            </div>

            {/* Org name + subtitle */}
            <h1 className="text-[22px] font-bold text-gray-900 leading-tight">
              {org.name}
            </h1>
            <p className="text-[13px] text-gray-400 font-medium mt-0.5 mb-4">
              {org.acronym} · Est. {org.established}
            </p>

            {/* Quick stats row */}
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <StatChip icon={
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              } label="Adviser" value={org.adviser ?? "N/A"} />
              <StatChip icon={
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              } label="Members" value={String(org.membersCount)} />
              <StatChip icon={
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              } label="Events this year" value={String(org.eventsThisYear)} />
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit">
            {(["about", "officers", "members", "events"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 cursor-pointer whitespace-nowrap ${
                  activeTab === tab
                    ? "bg-[var(--color-primary)] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                }`}
              >
                {tab[0].toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          {activeTab === "events" && (
            <div className="flex h-[37px] items-center rounded-lg border border-gray-200 overflow-hidden bg-white">
              <button
                type="button"
                onClick={() => setEventsViewMode("grid")}
                aria-label="Grid view"
                title="Grid view"
                className={`h-full w-10 inline-flex items-center justify-center transition-colors ${eventsViewMode === "grid" ? "bg-green-700 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
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
                onClick={() => setEventsViewMode("list")}
                aria-label="List view"
                title="List view"
                className={`h-full w-10 inline-flex items-center justify-center transition-colors border-l border-gray-200 ${eventsViewMode === "list" ? "bg-green-700 text-white border-l-green-700" : "bg-white text-gray-500 hover:bg-gray-50"}`}
              >
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
                  <path d="M4 5.5h12M4 10h12M4 14.5h12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* ─────────────── ABOUT ─────────────── */}
        {activeTab === "about" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Description */}
            <div className="px-6 py-5 border-b border-gray-100">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400 mb-2">About</p>
              <p className="text-[14px] text-gray-600 leading-relaxed whitespace-pre-line">
                {org.description}
              </p>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-y divide-gray-100">
              <InfoCell label="Category" value={org.categoryName ?? org.category} />
              <InfoCell label="Adviser" value={org.adviser ?? "N/A"} />
              <InfoCell label="Established" value={org.established} />
              <InfoCell label="Members" value={String(org.membersCount)} />
              <InfoCell label="Events This Year" value={String(org.eventsThisYear)} />
              <InfoCell
                label="Status"
                value={org.status}
                badge
                badgeClass={`${PILL} border ${getBadgeClass("org-status", org.accreditationStatus)}`}
              />
            </div>
          </div>
        )}

        {/* ─────────────── OFFICERS ─────────────── */}
        {activeTab === "officers" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            {officers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
                <svg className="w-10 h-10 text-gray-200" viewBox="0 0 24 24" fill="none">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-[13px] text-gray-400">Officer roster is not publicly available yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 justify-center">
                {officers.map((officer) => {
                  const initials = getInitials(officer.name);
                  const pal = avatarColor(officer.name);
                  return (
                    <div
                      key={officer.id}
                      className="max-w-[380px] w-full mx-auto flex items-start gap-3.5 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50/60 transition-colors"
                    >
                      {/* Avatar */}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-semibold flex-shrink-0 ${pal}`}
                      >
                        {initials}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-gray-900 truncate">
                              {officer.name}
                            </p>
                            <p className="text-[10px] text-gray-400 uppercase tracking-[0.15em]">
                              {officer.position ?? "Officer"} • {officer.course ?? "N/A"} {officer.yearLevel ?? "N/A"}-{officer.section ?? "N/A"}
                            </p>
                          </div>
                          <span
                            className={`flex-shrink-0 ${PILL} border ${
                              officer.isActive
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-100 text-slate-500 border-slate-200"
                            }`}
                          >
                            {officer.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>

                        {(officer.schoolId || officer.email) && (
                          <div className="mt-2.5 space-y-1">
                            {officer.schoolId && (
                              <p className="text-[12px] text-gray-500 flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" viewBox="0 0 24 24" fill="none">
                                  <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
                                  <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                                {officer.schoolId}
                              </p>
                            )}
                            {officer.email && (
                              <p className="text-[12px] text-gray-500 flex items-center gap-1.5 truncate">
                                <svg className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" viewBox="0 0 24 24" fill="none">
                                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                  <path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                                <span className="truncate">{officer.email}</span>
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─────────────── MEMBERS ─────────────── */}
        {activeTab === "members" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            {members.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
                <svg className="w-10 h-10 text-gray-200" viewBox="0 0 24 24" fill="none">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-[13px] text-gray-400">No members available yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 justify-center">
                {members.map((member) => {
                  const initials = getInitials(member.name);
                  const pal = avatarColor(member.name);
                  return (
                    <div
                      key={member.id}
                      className="max-w-[380px] w-full mx-auto flex items-start gap-3.5 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50/60 transition-colors"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-semibold flex-shrink-0 ${pal}`}
                      >
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[13px] font-semibold text-gray-900 truncate">
                            {member.name}
                          </p>
                          <span
                            className={`flex-shrink-0 ${PILL} border ${
                              member.paidMembershipFee
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {member.paidMembershipFee ? "Fee Paid" : "Fee Unpaid"}
                          </span>
                        </div>
                          <p className="text-[10px] text-gray-400 uppercase tracking-[0.15em]">
                            {member.department} • {member.courseCode} • {member.yearLevel ?? "N/A"}-{member.section ?? "N/A"}
                          </p>
                        {(member.schoolId || member.email) && (
                          <div className="mt-2.5 space-y-1">
                            {member.schoolId && (
                              <p className="text-[12px] text-gray-500 flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" viewBox="0 0 24 24" fill="none">
                                  <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
                                  <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                                {member.schoolId}
                              </p>
                            )}
                            {member.email && (
                              <p className="text-[12px] text-gray-500 flex items-center gap-1.5 truncate">
                                <svg className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" viewBox="0 0 24 24" fill="none">
                                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                  <path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                                <span className="truncate">{member.email}</span>
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─────────────── EVENTS ─────────────── */}
        {activeTab === "events" && (
          <div className="flex flex-col gap-3">
            <div className={eventsViewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 justify-center" : "flex flex-col gap-3"}>
            {events.length === 0 ? (
              <div className="sm:col-span-2 lg:col-span-3 bg-white rounded-2xl border border-gray-200 shadow-sm p-10 flex flex-col items-center gap-2 text-center">
                <svg className="w-10 h-10 text-gray-200" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                <p className="text-[13px] text-gray-400">No published events yet.</p>
              </div>
            ) : (
              events.map((event) => eventsViewMode === "grid" ? (
                <Link
                  key={event.id}
                  href={`/events/${event.slug ?? event.id}`}
                  className={`group rounded-2xl border overflow-hidden transition-all duration-200 no-underline flex flex-col max-w-[360px] w-full mx-auto ${
                    event.status === "Completed"
                      ? "bg-gray-50 border-gray-200 opacity-75"
                      : "bg-white border-gray-200 hover:shadow-md hover:-translate-y-0.5"
                  }`}
                >
                  {/* Banner */}
                  <div
                    className={`h-32 relative flex items-center justify-center overflow-hidden ${event.bannerUrl ? "bg-gray-100" : event.bannerColor} ${event.status === "Completed" ? "grayscale" : ""}`}
                  >
                    {event.bannerUrl && (
                      <img
                        src={event.bannerUrl}
                        alt={`${event.title} banner`}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

                    {/* Price chip — top-right */}
                    <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
                      <span className={`${PILL} ${event.type === "Free" ? "bg-green-700 text-white" : "bg-amber-500 text-white font-medium"}`}>
                        {event.type === "Free" ? "Free" : `₱ ${event.fee ? formatPrice(event.fee) : "N/A"}`}
                      </span>
                      {isOngoing(event.date, event.endDate) && (
                        <span className={`${PILL} bg-green-50 text-green-700 border border-green-200`}>
                          Ongoing
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-4 flex flex-col gap-2.5 flex-1">

                    {/* ── Badges row: category + status + audience + payment (right) ── */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`${PILL} ${CATEGORY_COLORS[event.category]}`}>
                        {event.category}
                      </span>
                      {event.status && (
                        <span className={`${PILL} ${getBadgeClass("status", event.status)}`}>
                          {event.status}
                        </span>
                      )}
                      {event.audienceType === "Org_Members_Only" && (
                        <span className={`${PILL} ${getBadgeClass("audience", event.audienceType)}`}>
                          Exclusive
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className={`text-[13px] font-semibold transition-colors line-clamp-2 leading-snug ${event.status === "Completed" ? "text-gray-600" : "text-gray-900 group-hover:text-[var(--color-primary)]"}`}>
                      {event.title}
                    </h3>

                    {/* Meta row */}
                    <div className="mt-auto pt-1 border-t border-gray-100 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                          <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
                          <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        {formatDateRange(event.date, event.endDate)}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                        <span className="truncate">{event.venue}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>
                          <span className="font-semibold text-gray-600">{event.registered}</span>
                          <span className="text-gray-300"> / </span>
                          <span>{event.capacity} registered</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ) : (
                <Link
                  key={event.id}
                  href={`/events/${event.slug ?? event.id}`}
                  className={`group rounded-xl border transition-all no-underline overflow-hidden ${
                    event.status === "Completed"
                      ? "bg-gray-50 border-gray-200 opacity-75"
                      : "bg-white border-gray-200 hover:border-green-300 hover:shadow-sm"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row">
                    <div className={`relative h-28 sm:h-auto sm:w-36 flex-shrink-0 overflow-hidden ${event.bannerUrl ? "bg-gray-100" : event.bannerColor} ${event.status === "Completed" ? "grayscale" : ""}`}>
                      {event.bannerUrl && (
                        <img
                          src={event.bannerUrl}
                          alt={`${event.title} banner`}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/10 pointer-events-none" />
                      <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
                        <span className={`${PILL} ${event.type === "Free" ? "bg-green-700 text-white" : "bg-amber-500 text-white font-medium"}`}>
                          {event.type === "Free" ? "Free" : `₱ ${event.fee ? formatPrice(event.fee) : "N/A"}`}
                        </span>
                        {isOngoing(event.date, event.endDate) && (
                          <span className={`${PILL} bg-green-50 text-green-700 border border-green-200`}>
                            Ongoing
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 p-4">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                            <span className={`${PILL} ${CATEGORY_COLORS[event.category]}`}>{event.category}</span>
                            {event.status && <span className={`${PILL} ${getBadgeClass("status", event.status)}`}>{event.status}</span>}
                            {event.audienceType === "Org_Members_Only" && <span className={`${PILL} ${getBadgeClass("audience", event.audienceType)}`}>Exclusive</span>}
                          </div>
                          <p className={`text-[15px] font-semibold transition-colors truncate ${event.status === "Completed" ? "text-gray-600" : "text-gray-900 group-hover:text-[var(--color-primary)]"}`}>{event.title}</p>
                          <div className="mt-2 flex items-center gap-1.5 text-[12px] text-gray-500">
                            <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                              <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                            </svg>
                            <span className="truncate">{event.venue}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_140px] gap-3 lg:w-[430px]">
                          <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2 text-[12px] text-gray-600">
                            <div className="flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 16 16" fill="none">
                                <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" />
                                <path d="M8 4.5v4l2.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                              </svg>
                              <div className="min-w-0 leading-snug">
                                <p><span className="font-semibold text-gray-700">Start</span> {formatDate(event.date)}</p>
                                <p><span className="font-semibold text-gray-700">End</span> {formatDate(event.endDate)}</p>
                              </div>
                            </div>
                          </div>
                          <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2 text-[12px] text-gray-600">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-gray-800">{event.registered}/{event.capacity}</span>
                              <span className={`text-[11px] font-semibold ${event.status === "Completed" ? "text-gray-500" : event.registered >= event.capacity ? "text-red-500" : "text-green-700"}`}>
                                {event.status === "Completed" ? "Event ended" : event.registered >= event.capacity ? "Full" : `${event.capacity - event.registered} left`}
                              </span>
                            </div>
                            <div className="mt-2 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${event.registered >= event.capacity ? "bg-red-400" : "bg-green-600"}`}
                                style={{ width: `${event.capacity > 0 ? Math.min(Math.round((event.registered / event.capacity) * 100), 100) : 0}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
          </div>
        )}

      </main>
    </div>
  );
}

/* ─── Sub-components ─── */

function StatChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-[12px] text-gray-500">
      <span className="text-gray-400">{icon}</span>
      <span>{label}:</span>
      <span className="font-semibold text-gray-800">{value}</span>
    </div>
  );
}

function InfoCell({
  label,
  value,
  badge,
  badgeClass,
}: {
  label: string;
  value: string;
  badge?: boolean;
  badgeClass?: string;
}) {
  return (
    <div className="px-5 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400 mb-1.5">
        {label}
      </p>
      {badge && badgeClass ? (
        <span className={badgeClass}>{value}</span>
      ) : (
        <p className="text-[13px] font-semibold text-gray-800">{value}</p>
      )}
    </div>
  );
}
