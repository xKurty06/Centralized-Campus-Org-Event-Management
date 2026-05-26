"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import React from "react";
import ManageShell from "@/components/ManageShell";
import Link from "next/link";
// Adjust this import path according to your actual components folder structure
import { IconRefresh } from "@/components/ui/IconRefresh";
import { ParticipantsPageSkeleton } from "@/components/skeletons";
import { manageRequestHeaders } from "@/components/manageOrgSelection";

type PaymentSelection = "Online" | "On-site" | "N/A";
type PaymentStatus = "Pending" | "Paid";
type AttendanceStatus = "Not_Arrived" | "Checked_In";
type ProofStatus = "Pending_Review" | "Approved" | "Rejected";
type Tab = "all" | "proof" | "unpaid";

interface Registrant {
    id: string;
    user_id: string;
    full_name: string;
    school_id: string;
    department: string;
    year_level: number;
    reg_date: string;
    payment_selection: PaymentSelection;
    payment_status: PaymentStatus;
    attendance_status: AttendanceStatus;
    check_in_at: string | null;
    is_member: boolean;
    proof_status?: ProofStatus;
}
interface PaymentProof {
    id: string;
    reg_id: string;
    full_name: string;
    school_id: string;
    department: string;
    image_url: string;
    uploaded_at: string;
    status: ProofStatus;
    payment_selection: PaymentSelection;
}
interface EventMeta {
    id: string;
    slug?: string;
    title: string;
    start_date: string;
    capacity: number;
    status: string;
}

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

function normalizeStatus(rawStatus?: string | null, startDate?: string | null, endDate?: string | null): string {
    const start = parseEventDate(startDate);
    const end = parseEventDate(endDate ?? startDate);
    const now = Date.now();
    if (!Number.isNaN(end.getTime()) && now > end.getTime()) return "Completed";
    const s = String(rawStatus ?? "").trim();
    if (s) return s;
    if (!Number.isNaN(start.getTime()) && now < start.getTime()) return "Upcoming";
    return "Open";
}
function normalizeAssetUrl(raw?: string | null) {
    if (!raw) return "";
    const s = String(raw).trim();
    if (!s) return "";
    if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("//")) return s;
    try {
        const origin = new URL(API_BASE_URL).origin;
        const path = s.startsWith("/") ? s : `/${s}`;
        return `${origin}${path}`;
    } catch {
        return s;
    }
}
function fmt(iso: string) {
    return parseEventDate(iso).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: PH_TIMEZONE,
    });
}
function fmtTime(iso: string) {
    return parseEventDate(iso).toLocaleTimeString("en-PH", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: PH_TIMEZONE,
    });
}

function ConnectionBadge({ isOnline }: { isOnline: boolean }) {
    return (
        <div
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all duration-300 ${isOnline ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}
        >
            <span
                className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-amber-500"}`}
            />
            {isOnline ? "Online" : "Offline Mode"}
        </div>
    );
}
function Card({
    title,
    value,
    color,
}: {
    title: string;
    value: number;
    color: string;
}) {
    return (
        <div className="bg-white border border-gray-100 rounded-2xl px-4 py-4">
            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-1">
                {title}
            </p>
            <p className={`text-[26px] font-bold leading-none ${color}`}>{value}</p>
        </div>
    );
}
function Avatar({ name }: { name: string }) {
    const initials = name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
    const colors = [
        "bg-blue-100 text-blue-700",
        "bg-purple-100 text-purple-700",
        "bg-emerald-100 text-emerald-700",
        "bg-amber-100 text-amber-700",
        "bg-rose-100 text-rose-700",
    ];
    const color = colors[name.charCodeAt(0) % colors.length];
    return (
        <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${color}`}
        >
            {initials}
        </div>
    );
}
function PaymentBadge({ status }: { status: PaymentStatus }) {
    return status === "Paid" ? (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Paid
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Pending
        </span>
    );
}
function AttendanceBadge({ status }: { status: AttendanceStatus }) {
    return status === "Checked_In" ? (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            Checked In
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
            Not Arrived
        </span>
    );
}
function MethodBadge({ method }: { method: PaymentSelection }) {
    const map: Record<PaymentSelection, string> = {
        Online: "bg-purple-50 text-purple-700 border-purple-200",
        "On-site": "bg-gray-100 text-gray-600 border-gray-200",
        "N/A": "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
    const label = method === "N/A" ? "Free" : method;
    return (
        <span
            className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${map[method]}`}
        >
            {label}
        </span>
    );
}

export default function ParticipantsPage() {
    const params = useParams();
    const eventId = Array.isArray(params?.["event-id"])
        ? params["event-id"][0]
        : (params?.["event-id"] ?? "");

    const [activeTab, setActiveTab] = useState<Tab>("all");
    const [registrants, setRegistrants] = useState<Registrant[]>([]);
    const [proofs, setProofs] = useState<PaymentProof[]>([]);
    const [event, setEvent] = useState<EventMeta | null>(null);
    const eventRouteKey = event?.slug ?? eventId;
    const [search, setSearch] = useState("");
    const [isOnline] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const isCompleted = event?.status === "Completed";

    async function loadParticipants() {
        setLoading(true);
        setError("");
        const token =
            window.localStorage.getItem("auth_token") ??
            window.sessionStorage.getItem("auth_token");
        if (!token) {
            setError("Session missing. Please sign in again.");
            setLoading(false);
            return;
        }

        const res = await fetch(
            `${API_BASE_URL}/manage/participants/${eventId}?per_page=300`,
            {
                headers: manageRequestHeaders(token),
            },
        ).catch(() => null);
        const payload = (await res?.json().catch(() => null)) as any;
        if (!res || !res.ok || !payload?.success) {
            setError(payload?.error ?? "Unable to load participants.");
            setLoading(false);
            return;
        }

        const rows = Array.isArray(payload?.data)
            ? payload.data
            : Array.isArray(payload?.data?.data)
              ? payload.data.data
              : [];
        const mappedRegs: Registrant[] = rows.map((r: any) => ({
            id: String(r.id ?? ""),
            user_id: String(r.user_id ?? ""),
            full_name:
                `${String(r.first_name ?? "").trim()} ${String(r.last_name ?? "").trim()}`.trim() ||
                "Unknown",
            school_id: String(r.school_id ?? ""),
            department: "N/A",
            year_level: 0,
            reg_date: String(
                r.reg_date ?? r.created_at ?? new Date().toISOString(),
            ),
            payment_selection: (r.payment_selection ?? "N/A") as PaymentSelection,
            payment_status: (r.payment_status ?? "Pending") as PaymentStatus,
            attendance_status: (r.attendance_status ??
                "Not_Arrived") as AttendanceStatus,
            check_in_at: r.check_in_at ?? null,
            is_member: false,
            proof_status: (r.proof_status ?? undefined) as ProofStatus | undefined,
        }));
        const mappedProofs: PaymentProof[] = rows
            .filter((r: any) => !!r.proof_status)
            .map((r: any) => ({
                id: `proof-${String(r.id ?? "")}`,
                reg_id: String(r.id ?? ""),
                full_name:
                    `${String(r.first_name ?? "").trim()} ${String(r.last_name ?? "").trim()}`.trim() ||
                    "Unknown",
                school_id: String(r.school_id ?? ""),
                department: "N/A",
                image_url: normalizeAssetUrl(r.proof_image_url ?? r.image_url ?? ""),
                uploaded_at: String(
                    r.updated_at ?? r.created_at ?? new Date().toISOString(),
                ),
                status: (r.proof_status ?? "Pending_Review") as ProofStatus,
                payment_selection: (r.payment_selection ?? "N/A") as PaymentSelection,
            }));

        setRegistrants(mappedRegs);
        setProofs(mappedProofs);
        if (payload?.event)
            setEvent({
                id: String(payload.event.id ?? eventId),
                slug: payload.event.slug ? String(payload.event.slug) : String(payload.event.id ?? eventId),
                title: String(payload.event.title ?? "Event"),
                start_date: String(
                    payload.event.start_date ?? new Date().toISOString(),
                ),
                capacity: Number(payload.event.capacity ?? 0),
                status: normalizeStatus(payload.event.effective_status ?? payload.event.status, payload.event.start_date, payload.event.end_date),
            });
        setError("");
        setLoading(false);
    }

    // Fetch only participants/proofs and update lists without touching page-level loading or event metadata.
    async function fetchParticipantsOnly() {
        const token =
            window.localStorage.getItem("auth_token") ??
            window.sessionStorage.getItem("auth_token");
        if (!token) {
            setError("Session missing. Please sign in again.");
            return;
        }

        const res = await fetch(
            `${API_BASE_URL}/manage/participants/${eventId}?per_page=300`,
            {
                headers: manageRequestHeaders(token),
            },
        ).catch(() => null);
        const payload = (await res?.json().catch(() => null)) as any;
        if (!res || !res.ok || !payload?.success) {
            setError(payload?.error ?? "Unable to refresh participants.");
            return;
        }

        const rows = Array.isArray(payload?.data)
            ? payload.data
            : Array.isArray(payload?.data?.data)
              ? payload.data.data
              : [];
        const mappedRegs: Registrant[] = rows.map((r: any) => ({
            id: String(r.id ?? ""),
            user_id: String(r.user_id ?? ""),
            full_name:
                `${String(r.first_name ?? "").trim()} ${String(r.last_name ?? "").trim()}`.trim() ||
                "Unknown",
            school_id: String(r.school_id ?? ""),
            department: "N/A",
            year_level: 0,
            reg_date: String(
                r.reg_date ?? r.created_at ?? new Date().toISOString(),
            ),
            payment_selection: (r.payment_selection ?? "N/A") as PaymentSelection,
            payment_status: (r.payment_status ?? "Pending") as PaymentStatus,
            attendance_status: (r.attendance_status ??
                "Not_Arrived") as AttendanceStatus,
            check_in_at: r.check_in_at ?? null,
            is_member: false,
            proof_status: (r.proof_status ?? undefined) as ProofStatus | undefined,
        }));
        const mappedProofs: PaymentProof[] = rows
            .filter((r: any) => !!r.proof_status)
            .map((r: any) => ({
                id: `proof-${String(r.id ?? "")}`,
                reg_id: String(r.id ?? ""),
                full_name:
                    `${String(r.first_name ?? "").trim()} ${String(r.last_name ?? "").trim()}`.trim() ||
                    "Unknown",
                school_id: String(r.school_id ?? ""),
                department: "N/A",
                image_url: normalizeAssetUrl(r.proof_image_url ?? r.image_url ?? ""),
                uploaded_at: String(
                    r.updated_at ?? r.created_at ?? new Date().toISOString(),
                ),
                status: (r.proof_status ?? "Pending_Review") as ProofStatus,
                payment_selection: (r.payment_selection ?? "N/A") as PaymentSelection,
            }));

        setRegistrants(mappedRegs);
        setProofs(mappedProofs);
        // keep existing event metadata intact
        setError("");
    }

    useEffect(() => {
        loadParticipants();
    }, [eventId]);

    async function refreshParticipants() {
        setRefreshing(true);
        try {
            await fetchParticipantsOnly();
        } finally {
            setRefreshing(false);
        }
    }

    const callWithToken = async (url: string, method: "PUT") => {
        if (isCompleted) throw new Error("Completed events are read-only.");
        const token =
            window.localStorage.getItem("auth_token") ??
            window.sessionStorage.getItem("auth_token");
        if (!token) throw new Error("Session missing. Please sign in again.");
        const res = await fetch(url, {
            method,
            headers: manageRequestHeaders(token),
        });
        const payload = (await res.json().catch(() => null)) as any;
        if (!res.ok || !payload?.success)
            throw new Error(payload?.error ?? "Action failed.");
    };

    const query = search.toLowerCase();
    const filteredRegistrants = useMemo(
        () =>
            registrants.filter(
                (r) =>
                    r.full_name.toLowerCase().includes(query) ||
                    r.school_id.toLowerCase().includes(query) ||
                    r.department.toLowerCase().includes(query),
            ),
        [registrants, query],
    );
    const filteredUnpaid = useMemo(
        () =>
            registrants.filter(
                (r) =>
                    r.payment_status === "Pending" &&
                    (r.full_name.toLowerCase().includes(query) ||
                        r.school_id.toLowerCase().includes(query) ||
                        r.department.toLowerCase().includes(query)),
            ),
        [registrants, query],
    );
    const activeProofs = useMemo(
        () =>
            proofs.filter(
                (p) =>
                    p.status === "Pending_Review" &&
                    (p.full_name.toLowerCase().includes(query) ||
                        p.school_id.toLowerCase().includes(query)),
            ),
        [proofs, query],
    );

    const handleVerifyProof = async (
        proofId: string,
        regId: string,
        approved: boolean,
    ) => {
        try {
            await callWithToken(
                `${API_BASE_URL}/manage/participants/${regId}/${approved ? "approve-proof" : "reject-proof"}`,
                "PUT",
            );
            setProofs((prev) =>
                prev.map((p) =>
                    p.id === proofId
                        ? { ...p, status: approved ? "Approved" : "Rejected" }
                        : p,
                ),
            );
            if (approved)
                setRegistrants((prev) =>
                    prev.map((r) =>
                        r.id === regId ? { ...r, payment_status: "Paid" } : r,
                    ),
                );
        } catch (e: any) {
            setError(e?.message ?? "Unable to update proof.");
        }
    };

    const handleMarkAsPaid = async (regId: string) => {
        try {
            await callWithToken(
                `${API_BASE_URL}/manage/verify/${eventId}/confirm-payment/${regId}`,
                "PUT",
            );
            setRegistrants((prev) =>
                prev.map((r) =>
                    r.id === regId ? { ...r, payment_status: "Paid" } : r,
                ),
            );
        } catch (e: any) {
            setError(e?.message ?? "Unable to confirm payment.");
        }
    };

    const pendingProofCount = proofs.filter(
        (p) => p.status === "Pending_Review",
    ).length;
    const unpaidCount = registrants.filter(
        (r) => r.payment_status === "Pending",
    ).length;
    const confirmedCount = registrants.filter(
        (r) => r.payment_status === "Paid",
    ).length;
    const checkedInCount = registrants.filter(
        (r) => r.attendance_status === "Checked_In",
    ).length;
    const tabs: { key: Tab; label: string; count?: number }[] = [
        { key: "all", label: "All Registrants", count: registrants.length },
        { key: "proof", label: "Proof Review", count: pendingProofCount },
        { key: "unpaid", label: "Pending / Unpaid", count: unpaidCount },
    ];

    return (
        <ManageShell pageTitle="Salikop">
            <div className="flex flex-col gap-6 animate-fade-in">
                {!!error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}
                {loading ? (
                    <ParticipantsPageSkeleton />
                ) : (
                    <div className="flex flex-col gap-6 animate-content-reveal">
                        <div className="flex flex-col gap-3">
                            <div className="flex flex-col">
                                <nav className="flex items-center gap-2 text-[13px] font-medium text-[var(--color-text-muted)] flex-wrap">
                                    <Link
                                        href="/manage/events"
                                        className="hover:text-[var(--color-primary)] transition-colors no-underline"
                                    >
                                        Events
                                    </Link>
                                    <svg
                                        className="w-3.5 h-3.5 text-gray-400"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                    >
                                        <path
                                            d="M9 5l7 7-7 7"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                    <Link
                                        href={`/manage/events/${eventRouteKey}`}
                                        className="hover:text-[var(--color-primary)] transition-colors no-underline truncate max-w-[180px] sm:max-w-xs"
                                    >
                                        {event?.title ?? "Event"}
                                    </Link>
                                    <svg
                                        className="w-3.5 h-3.5 text-gray-400"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                    >
                                        <path
                                            d="M9 5l7 7-7 7"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                    <span className="text-[var(--color-text)] font-semibold">
                                        Masterlist
                                    </span>
                                </nav>
                            </div>
                        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                            <div>
                                <h1 className="text-[24px] font-bold text-[var(--color-text)] tracking-tight">
                                    {event?.title ?? "Event"}
                                </h1>
                                    <p className="text-[13px] text-[var(--color-text-muted)] mt-1">
                                        {fmt(event?.start_date ?? new Date().toISOString())} · Event
                                        Slug: <span className="font-mono">{eventRouteKey}</span>
                                    </p>
                                </div>
                                {/* Online status badge relocated to the top right of header controls */}
                                <div className="flex items-center lg:self-end">
                                    <ConnectionBadge isOnline={isOnline} />
                                </div>
                            </div>
                        </div>
                        {isCompleted && (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
                                This event is completed. Participant records are still available, but payment and proof actions are locked.
                            </div>
                        )}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card
                                title="Total Registered"
                                value={registrants.length}
                                color="text-[var(--color-text)]"
                            />
                            <Card
                                title="Payment Confirmed"
                                value={confirmedCount}
                                color="text-green-600"
                            />
                            <Card
                                title="Pending Payment"
                                value={unpaidCount}
                                color="text-amber-600"
                            />
                            <Card
                                title="Checked In"
                                value={checkedInCount}
                                color="text-purple-600"
                            />
                        </div>
                        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 flex flex-col gap-4">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    {tabs.map((tab) => (
                                        <button
                                            key={tab.key}
                                            onClick={() => setActiveTab(tab.key)}
                                            className={`relative flex items-center gap-2 h-9 px-4 rounded-xl text-[13px] font-medium transition-all ${activeTab === tab.key ? "bg-[var(--color-primary)] text-white" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]"}`}
                                        >
                                            {tab.label}
                                            {tab.count !== undefined && (
                                                <span
                                                    className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === tab.key ? "bg-white/20 text-white" : "bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]"}`}
                                                >
                                                    {tab.count}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                                {/* Replaced the old ConnectionBadge spot with IconRefresh */}
                                <button
                                    onClick={refreshParticipants}
                                    disabled={refreshing}
                                    className="p-0 mr-4 mb-1 bg-transparent border-0 cursor-pointer inline-flex items-center justify-center text-[var(--color-primary)] hover:text-[var(--color-primary-light)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    aria-label="Refresh operational masterlist"
                                    title="Refresh operational masterlist"
                                >
                                    <IconRefresh spinning={refreshing} />
                                </button>
                            </div>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder={
                                        activeTab === "proof"
                                            ? "Search proof reviews..."
                                            : "Search registrants by name, ID or course..."
                                    }
                                    className="w-full h-11 pl-4 pr-4 text-[13px] bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl outline-none"
                                />
                            </div>
                        </div>
                        {activeTab === "proof" && (
                            <section className="bg-white border border-[var(--color-border)] rounded-2xl p-4 sm:p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-sm font-semibold text-[var(--color-text)]">
                                        Proof Review Queue
                                    </h2>
                                    <span className="text-xs font-medium text-[var(--color-text-muted)]">
                                        {activeProofs.length} participant{activeProofs.length === 1 ? "" : "s"}
                                    </span>
                                </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {activeProofs.map((p) => (
                                    <div
                                        key={p.id}
                                        className="bg-white border border-[var(--color-border)] rounded-2xl overflow-hidden flex flex-col justify-between shadow-sm"
                                    >
                                        <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                                            <div className="flex items-center gap-2.5">
                                                <Avatar name={p.full_name} />
                                                <div>
                                                    <p className="text-[13px] font-semibold text-gray-800 leading-tight">
                                                        {p.full_name}
                                                    </p>
                                                    <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                                                        {p.school_id}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="px-3 pt-3">
                                            {p.image_url ? (
                                                <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                                                    <img
                                                        src={p.image_url}
                                                        alt={`Payment proof of ${p.full_name}`}
                                                        className="w-full h-44 object-cover"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setPreviewImageUrl(p.image_url)}
                                                        className="absolute top-2 right-2 w-7 h-7 rounded-md bg-white/90 border border-gray-200 text-gray-700 hover:bg-white flex items-center justify-center"
                                                        aria-label="Maximize proof image"
                                                        title="Maximize"
                                                    >
                                                        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none">
                                                            <path d="M7 3H3v4M13 3h4v4M17 13v4h-4M3 13v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="h-44 rounded-xl border border-dashed border-gray-200 bg-gray-50 text-xs text-gray-400 flex items-center justify-center">
                                                    No proof image
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-3 bg-white flex flex-col gap-2">
                                            <div className="grid grid-cols-2 gap-2 mt-1">
                                                <button
                                                    onClick={() =>
                                                        handleVerifyProof(p.id, p.reg_id, false)
                                                    }
                                                    disabled={isCompleted}
                                                    className={`h-8 rounded-lg border text-[12px] font-medium ${isCompleted ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed" : "border-rose-200 bg-rose-50/50 text-rose-700"}`}
                                                >
                                                    Reject
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleVerifyProof(p.id, p.reg_id, true)
                                                    }
                                                    disabled={isCompleted}
                                                    className={`h-8 rounded-lg text-[12px] font-medium ${isCompleted ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-emerald-600 text-white"}`}
                                                >
                                                    Approve
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            </section>
                        )}
                        {activeTab === "unpaid" && (
                            <section className="bg-white border border-[var(--color-border)] rounded-2xl p-4 sm:p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-sm font-semibold text-[var(--color-text)]">
                                        Pending / Unpaid Participants
                                    </h2>
                                    <span className="text-xs font-medium text-[var(--color-text-muted)]">
                                        {filteredUnpaid.length} participant{filteredUnpaid.length === 1 ? "" : "s"}
                                    </span>
                                </div>
                            <div className="space-y-2">
                                {filteredUnpaid.map((r) => (
                                    <div
                                        key={r.id}
                                        className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-3 py-2"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar name={r.full_name} />
                                            <div>
                                                <p className="text-[13px] font-medium">{r.full_name}</p>
                                                <p className="text-[11px] text-gray-500">
                                                    {r.school_id}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleMarkAsPaid(r.id)}
                                            disabled={isCompleted}
                                            className={`h-8 px-3 rounded-lg border text-[12px] font-semibold ${isCompleted ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}
                                        >
                                            {isCompleted ? "Locked" : "Received Cash"}
                                        </button>
                                    </div>
                                ))}
                            </div>
                            </section>
                        )}
                        {activeTab === "all" && (
                            <section className="bg-white border border-[var(--color-border)] rounded-2xl p-4 sm:p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-sm font-semibold text-[var(--color-text)]">
                                        All Participants
                                    </h2>
                                    <span className="text-xs font-medium text-[var(--color-text-muted)]">
                                        {filteredRegistrants.length} participant{filteredRegistrants.length === 1 ? "" : "s"}
                                    </span>
                                </div>
                            <div className="space-y-2">
                                {filteredRegistrants.map((r) => (
                                    <div
                                        key={r.id}
                                        className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-3 py-2"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar name={r.full_name} />
                                            <div>
                                                <p className="text-[13px] font-medium">{r.full_name}</p>
                                                <p className="text-[11px] text-gray-500">
                                                    {r.school_id}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MethodBadge method={r.payment_selection} />
                                            {r.payment_selection !== "N/A" && (
                                                <PaymentBadge status={r.payment_status} />
                                            )}
                                            <AttendanceBadge status={r.attendance_status} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            </section>
                        )}
                    </div>
                )}
            </div>
            {previewImageUrl && (
                <div
                    className="fixed inset-0 z-50 bg-black/70 p-4 flex items-center justify-center"
                    onClick={() => setPreviewImageUrl(null)}
                >
                    <div className="relative max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            onClick={() => setPreviewImageUrl(null)}
                            className="absolute -top-10 right-0 w-8 h-8 rounded-full bg-white text-gray-700 flex items-center justify-center"
                            aria-label="Close preview"
                            title="Close"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                        <img
                            src={previewImageUrl}
                            alt="Payment proof preview"
                            className="w-full max-h-[85vh] object-contain rounded-xl bg-black"
                        />
                    </div>
                </div>
            )}
        </ManageShell>
    );
}
