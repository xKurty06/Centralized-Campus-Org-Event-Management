"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

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
  position: string;
  schoolId: string;
  department: string;
}
interface OrgEvent {
  id: string;
  title: string;
  category: EventCategory;
  date: string;
  venue: string;
  type: "Free" | "Paid";
  fee?: number;
  registered: number;
  capacity: number;
  bannerUrl?: string;
  bannerColor: string;
}
interface Organization {
  id: string;
  name: string;
  acronym: string;
  logoUrl: string;
  category: OrgCategory;
  description: string;
  mission: string;
  vision: string;
  adviser: string;
  adviserDepartment: string;
  members: number;
  established: string;
  status: "Active" | "Suspended";
  color: string;
  officers: OfficerProfile[];
  events: OrgEvent[];
}

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
  )
    return value;
  const path = value.startsWith("/") ? value : `/${value}`;
  return `${API_ORIGIN}${path}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
function formatPrice(value?: number) {
  return Number(value ?? 0).toLocaleString("en-PH");
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
const ORG_CATEGORY_META: Record<OrgCategory, { color: string; bg: string }> = {
  Academic: { color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  "Non-Academic": {
    color: "text-orange-700",
    bg: "bg-orange-50 border-orange-200",
  },
  Religious: { color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
};

export default function OrgProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const [org, setOrg] = useState<Organization | null>(null);
  const [activeTab, setActiveTab] = useState<"about" | "officers" | "events">(
    "about",
  );
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
        data?: any[];
      } | null;
      if (!orgRes || !orgRes.ok || !orgPayload?.success || !orgPayload.data) {
        setOrg(null);
        setLoading(false);
        return;
      }

      const colorMap: Record<string, string> = {
        Academic: "bg-blue-100 text-blue-700",
        "Non-Academic": "bg-orange-100 text-orange-700",
        Religious: "bg-purple-100 text-purple-700",
      };
      const banner = [
        "bg-blue-100",
        "bg-purple-100",
        "bg-orange-100",
        "bg-teal-100",
        "bg-green-100",
        "bg-pink-100",
      ];

      const mappedEvents: OrgEvent[] = Array.isArray(evPayload?.data)
        ? evPayload.data.map((e, i) => ({
          id: String(e.id ?? ""),
          title: e.title ?? "Untitled Event",
          category: (e.category_name ?? "Other") as EventCategory,
          date: e.start_date ?? new Date().toISOString(),
          venue: e.venue_name ?? "TBA",
          type: Boolean(e.is_paid) ? "Paid" : "Free",
          fee: Number(e.fee_amount ?? 0),
          capacity: Number(e.capacity ?? 0),
          registered: Number(e.total_registered ?? 0),
          bannerUrl: normalizeImageUrl(e.banner_url),
          bannerColor: banner[i % banner.length],
        }))
        : [];

      setOrg({
        id: String(orgPayload.data.id ?? ""),
        name: orgPayload.data.name ?? "Organization",
        acronym: String(
          orgPayload.data.code_name ?? orgPayload.data.name ?? "ORG",
        )
          .slice(0, 8)
          .toUpperCase(),
        logoUrl: normalizeImageUrl(orgPayload.data.logo_url),
        category: (orgPayload.data.category_name ??
          "Non-Academic") as OrgCategory,
        description: orgPayload.data.description ?? "No description provided.",
        mission: "Mission not published.",
        vision: "Vision not published.",
        adviser: orgPayload.data.adviser ?? "N/A",
        adviserDepartment: "Department not published",
        members: Number(orgPayload.data.members_count ?? 0),
        established:
          String(orgPayload.data.founded_date ?? "").slice(0, 4) || "N/A",
        status:
          orgPayload.data.accreditation_status === "Suspended"
            ? "Suspended"
            : "Active",
        color:
          colorMap[orgPayload.data.category_name ?? "Non-Academic"] ??
          "bg-gray-100 text-gray-700",
        officers: [],
        events: mappedEvents,
      });
      setLoading(false);
    })();
  }, [id]);

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 p-8 text-sm text-gray-500 text-center">
        Loading organization...
      </div>
    );
  if (!org)
    return (
      <div className="min-h-screen bg-gray-50 p-8 text-sm text-gray-500">
        Organization not found.
      </div>
    );

  const catMeta = ORG_CATEGORY_META[org.category];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 w-full max-w-[1280px] mx-auto px-6 lg:px-12 py-8 flex flex-col gap-6">
        <Link
          href="/organizations"
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
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div
            className={`h-24 ${org.color.split(" ")[0]} opacity-40 relative z-0`}
          />
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-8 mb-5">
              <div
                className={`relative z-10 w-20 h-20 rounded-2xl border-4 border-white shadow-sm flex items-center justify-center text-[20px] font-bold flex-shrink-0 overflow-hidden ${org.color}`}
              >
                {org.logoUrl ? (
                  <img
                    src={org.logoUrl}
                    alt={`${org.name} logo`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display =
                        "none";
                    }}
                  />
                ) : (
                  org.acronym.slice(0, 2)
                )}
              </div>
              <div className="flex items-center gap-2 sm:mb-1">
                <span
                  className={`text-[12px] font-semibold px-3 py-1 rounded-full border ${catMeta.bg} ${catMeta.color}`}
                >
                  {org.category}
                </span>
              </div>
            </div>
            <h1 className="text-[24px] font-bold text-gray-900 leading-tight">
              {org.name}
            </h1>
            <p className="text-[14px] text-gray-400 font-medium mt-0.5">
              {org.acronym} • Est. {org.established}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit">
          {(["about", "officers", "events"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 cursor-pointer whitespace-nowrap ${activeTab === tab ? "bg-green-700 text-white shadow-sm" : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"}`}
            >
              {tab[0].toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === "about" && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-[14px] text-gray-600 leading-relaxed whitespace-pre-line">
              {org.description}
            </p>
          </div>
        )}
        {activeTab === "officers" && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-sm text-gray-500">
            Officer roster is not publicly available yet.
          </div>
        )}
        {activeTab === "events" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {org.events.length === 0 ? (
              <div className="sm:col-span-2 lg:col-span-3 bg-white rounded-xl border border-gray-200 p-5 text-sm text-gray-500">
                No published events yet.
              </div>
            ) : (
              org.events.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 no-underline flex flex-col"
                >
                  <div
                    className={`h-28 relative flex items-center justify-center overflow-hidden ${event.bannerUrl ? "bg-gray-100" : event.bannerColor}`}
                  >
                    {event.bannerUrl ? (
                      <img
                        src={event.bannerUrl}
                        alt={`${event.title} banner`}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-black/5" />
                    <div className="absolute top-2.5 right-2.5 z-10">
                      {event.type === "Free" ? (
                        <span className="text-[10px] font-semibold bg-green-700 text-white px-2 py-0.5 rounded-full">
                          Free
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold bg-amber-500 text-white px-2 py-0.5 rounded-full">
                          PHP {event.fee ? formatPrice(event.fee) : "N/A"}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-4 flex flex-col gap-2 flex-1">
                    <span
                      className={`self-start text-[10px] font-semibold px-2 py-0.5 rounded-md ${CATEGORY_COLORS[event.category]}`}
                    >
                      {event.category}
                    </span>
                    <h3 className="text-[13px] font-semibold text-gray-900 group-hover:text-green-700 transition-colors line-clamp-2 leading-snug">
                      {event.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[12px] text-gray-400 mt-auto">
                      {formatDate(event.date)} • {event.venue}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
