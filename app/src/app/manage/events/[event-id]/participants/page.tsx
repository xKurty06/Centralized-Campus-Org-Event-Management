"use client";

import { useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import React from "react";
import ManageShell from "@/components/ManageShell";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Initial Mock Data ────────────────────────────────────────────────────────

const INITIAL_EVENT = {
    id: "evt-001",
    title: "Web Development Workshop 2025",
    status: "Open",
    start_date: "2025-08-15T09:00",
    capacity: 50,
};

const INITIAL_REGISTRANTS: Registrant[] = [
    { id: "r1", user_id: "u1", full_name: "Maria Santos", school_id: "2023-1-00123", department: "CCS", year_level: 2, reg_date: "2025-07-01T10:23:00", payment_selection: "Online", payment_status: "Paid", attendance_status: "Checked_In", check_in_at: "2025-08-15T09:04:00", is_member: true },
    { id: "r2", user_id: "u2", full_name: "Juan dela Cruz", school_id: "2022-1-00456", department: "CAS", year_level: 3, reg_date: "2025-07-02T14:10:00", payment_selection: "Online", payment_status: "Pending", attendance_status: "Not_Arrived", check_in_at: null, is_member: false },
    { id: "r3", user_id: "u3", full_name: "Ana Reyes", school_id: "2024-1-00789", department: "CBA", year_level: 1, reg_date: "2025-07-03T09:55:00", payment_selection: "On-site", payment_status: "Pending", attendance_status: "Not_Arrived", check_in_at: null, is_member: false },
    { id: "r4", user_id: "u4", full_name: "Carlos Mendoza", school_id: "2021-1-00321", department: "CCS", year_level: 4, reg_date: "2025-07-03T16:40:00", payment_selection: "Online", payment_status: "Paid", attendance_status: "Not_Arrived", check_in_at: null, is_member: false },
    { id: "r5", user_id: "u5", full_name: "Sofia Velasco", school_id: "2023-1-00234", department: "COE", year_level: 2, reg_date: "2025-07-04T11:20:00", payment_selection: "N/A", payment_status: "Paid", attendance_status: "Checked_In", check_in_at: "2025-08-15T09:10:00", is_member: true },
    { id: "r7", user_id: "u7", full_name: "Isabella Cruz", school_id: "2024-1-00111", department: "CCS", year_level: 1, reg_date: "2025-07-06T13:15:00", payment_selection: "On-site", payment_status: "Pending", attendance_status: "Not_Arrived", check_in_at: null, is_member: false },
    { id: "r8", user_id: "u8", full_name: "Rafael Garcia", school_id: "2021-1-00222", department: "COE", year_level: 4, reg_date: "2025-07-07T10:00:00", payment_selection: "Online", payment_status: "Paid", attendance_status: "Checked_In", check_in_at: "2025-08-15T09:22:00", is_member: false },
    { id: "r9", user_id: "u9", full_name: "Gabrielle Lim", school_id: "2023-1-00333", department: "CBA", year_level: 2, reg_date: "2025-07-08T15:45:00", payment_selection: "N/A", payment_status: "Paid", attendance_status: "Not_Arrived", check_in_at: null, is_member: false },
    { id: "r10", user_id: "u10", full_name: "Daniel Aquino", school_id: "2022-1-00444", department: "CAS", year_level: 3, reg_date: "2025-07-09T09:10:00", payment_selection: "Online", payment_status: "Pending", attendance_status: "Not_Arrived", check_in_at: null, is_member: true },
];

const INITIAL_PROOFS: PaymentProof[] = [
    { id: "p1", reg_id: "r2", full_name: "Juan dela Cruz", school_id: "2022-1-00456", department: "CAS", image_url: "https://placehold.co/400x600/e8f4f8/1a6b8a?text=GCash+Receipt", uploaded_at: "2025-07-02T14:30:00", status: "Pending_Review", payment_selection: "Online" },
    { id: "p2", reg_id: "r6", full_name: "Miguel Torres", school_id: "2022-1-00987", department: "CAS", image_url: "https://placehold.co/400x600/f0f8e8/2d6a1a?text=Bank+Transfer", uploaded_at: "2025-07-05T09:00:00", status: "Pending_Review", payment_selection: "Online" },
    { id: "p3", reg_id: "r10", full_name: "Daniel Aquino", school_id: "2022-1-00444", department: "CAS", image_url: "https://placehold.co/400x600/f8f0e8/8a4a1a?text=GCash+Receipt", uploaded_at: "2025-07-09T09:20:00", status: "Pending_Review", payment_selection: "Online" },
];
const event = INITIAL_EVENT;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(iso: string) {
    return new Date(iso).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString("en-PH", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

// ─── Small Components ─────────────────────────────────────────────────────────

function ConnectionBadge({ isOnline }: { isOnline: boolean }) {
    return (
        <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all duration-300
      ${isOnline
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
            {isOnline ? 'Online' : 'Offline Mode'}
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
            <p className={`text-[26px] font-bold leading-none ${color}`}>
                {value}
            </p>
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
        "N/A": "bg-gray-50 text-gray-400 border-gray-100",
    };

    return (
        <span
            className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${map[method]}`}
        >
            {method}
        </span>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ParticipantsPage() {
    const router = useRouter();
    const params = useParams();

    const eventId = Array.isArray(params?.["event-id"])
        ? params["event-id"][0]
        : (params?.["event-id"] ?? "evt-001");

    const [activeTab, setActiveTab] = useState<Tab>("all");
    const [registrants, setRegistrants] = useState<Registrant[]>(INITIAL_REGISTRANTS);
    const [proofs, setProofs] = useState<PaymentProof[]>(INITIAL_PROOFS);
    const [search, setSearch] = useState("");
    const [isOnline, setIsOnline] = useState(true);

    // Filter logic shared across search inputs
    const query = search.toLowerCase();

    const filteredRegistrants = useMemo(() => {
        return registrants.filter((r) => {
            return (
                r.full_name.toLowerCase().includes(query) ||
                r.school_id.toLowerCase().includes(query) ||
                r.department.toLowerCase().includes(query)
            );
        });
    }, [registrants, query]);

    const filteredUnpaid = useMemo(() => {
        return registrants.filter((r) => {
            return (
                r.payment_status === "Pending" &&
                (r.full_name.toLowerCase().includes(query) ||
                    r.school_id.toLowerCase().includes(query) ||
                    r.department.toLowerCase().includes(query))
            );
        });
    }, [registrants, query]);

    const activeProofs = useMemo(() => {
        return proofs.filter((p) => p.status === "Pending_Review" && (
            p.full_name.toLowerCase().includes(query) ||
            p.school_id.toLowerCase().includes(query)
        ));
    }, [proofs, query]);

    // Action Handlers
    const handleVerifyProof = (proofId: string, regId: string, approved: boolean) => {
        setProofs(prev => prev.map(p => p.id === proofId ? { ...p, status: approved ? "Approved" : "Rejected" } : p));
        if (approved) {
            setRegistrants(prev => prev.map(r => r.id === regId ? { ...r, payment_status: "Paid" } : r));
        }
    };

    const handleMarkAsPaid = (regId: string) => {
        setRegistrants(prev => prev.map(r => r.id === regId ? { ...r, payment_status: "Paid" } : r));
    };

    // Derived statistics counts
    const pendingProofCount = proofs.filter((p) => p.status === "Pending_Review").length;
    const unpaidCount = registrants.filter((r) => r.payment_status === "Pending").length;
    const confirmedCount = registrants.filter((r) => r.payment_status === "Paid").length;
    const checkedInCount = registrants.filter((r) => r.attendance_status === "Checked_In").length;

    const tabs: { key: Tab; label: string; count?: number }[] = [
        { key: "all", label: "All Registrants", count: registrants.length },
        { key: "proof", label: "Proof Review", count: pendingProofCount },
        { key: "unpaid", label: "Pending / Unpaid", count: unpaidCount },
    ];

    return (
        <ManageShell pageTitle="Salikop">
            <div className="flex flex-col gap-6 animate-fade-in">

                {/* Breadcrumbs Navigation */}
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-[12px] text-gray-400">
                        <Link href="/manage/dashboard" className="hover:text-emerald-700 no-underline transition-colors">
                            Dashboard
                        </Link>
                        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none">
                            <path d="M7 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <Link href={`/manage/events/${eventId}`} className="hover:text-emerald-700 no-underline transition-colors">
                            {event.title}
                        </Link>
                        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none">
                            <path d="M7 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="text-gray-600 font-medium">Masterlist</span>
                    </div>
                </div>

                {/* Header Title Section */}
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mt-[-8px]">
                    <div>
                        <h1 className="text-[24px] font-bold text-[var(--color-text)] tracking-tight">
                            {INITIAL_EVENT.title}
                        </h1>
                        <p className="text-[13px] text-[var(--color-text-muted)] mt-1">
                            {fmt(INITIAL_EVENT.start_date)} · Event ID:{" "}
                            <span className="font-mono">{eventId}</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button className="h-10 px-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[13px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] transition-colors">
                            Export CSV
                        </button>
                        <button className="h-10 px-4 rounded-xl bg-[var(--color-primary)] text-white text-[13px] font-medium hover:opacity-90 transition-all">
                            Send Announcement
                        </button>
                    </div>
                </div>

                {/* Summary Metrics Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card title="Total Registered" value={registrants.length} color="text-[var(--color-text)]" />
                    <Card title="Payment Confirmed" value={confirmedCount} color="text-green-600" />
                    <Card title="Pending Payment" value={unpaidCount} color="text-amber-600" />
                    <Card title="Checked In" value={checkedInCount} color="text-[var(--color-primary)]" />
                </div>

                {/* Controls Bar: Tabs & Search Input */}
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 flex flex-col gap-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-2">
                        <div className="flex flex-wrap items-center gap-2">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`relative flex items-center gap-2 h-9 px-4 rounded-xl text-[13px] font-medium transition-all ${activeTab === tab.key
                                        ? "bg-[var(--color-primary)] text-white"
                                        : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]"
                                        }`}
                                >
                                    {tab.label}
                                    {tab.count !== undefined && (
                                        <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === tab.key
                                            ? "bg-white/20 text-white"
                                            : "bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]"
                                            }`}
                                        >
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                        <ConnectionBadge isOnline={isOnline} />
                    </div>

                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                        </svg>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={activeTab === "proof" ? "Search proof reviews..." : "Search registrants by name, ID or course..."}
                            className="w-full h-11 pl-10 pr-4 text-[13px] bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-primary-muted)] focus:border-[var(--color-primary)] transition-all"
                        />
                    </div>
                </div>

                {/* TAB 1: ALL REGISTRANTS */}
                {activeTab === "all" && (
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
                                        <th className="text-left text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider px-6 py-3">
                                            Student
                                        </th>

                                        <th className="text-left text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider px-4 py-3">
                                            Member
                                        </th>

                                        <th className="text-left text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider px-4 py-3 hidden md:table-cell">
                                            Department
                                        </th>

                                        <th className="text-left text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider px-4 py-3 hidden lg:table-cell">
                                            Registered
                                        </th>

                                        <th className="text-left text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider px-4 py-3">
                                            Method
                                        </th>

                                        <th className="text-left text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider px-4 py-3">
                                            Payment
                                        </th>

                                        <th className="text-left text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider px-4 py-3 hidden lg:table-cell">
                                            Attendance
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-[var(--color-border)]">
                                    {filteredRegistrants.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="text-center py-8 text-[13px] text-gray-400"
                                            >
                                                No matching registrants found.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredRegistrants.map((r) => (
                                            <tr
                                                key={r.id}
                                                className="hover:bg-[var(--color-surface-2)] transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar name={r.full_name} />

                                                        <div>
                                                            <p className="text-[13px] font-medium text-[var(--color-text)]">
                                                                {r.full_name}
                                                            </p>

                                                            <p className="text-[11px] text-[var(--color-text-muted)] font-mono">
                                                                {r.school_id}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-4">
                                                    {r.is_member ? (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                            Member
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                                            Non-Member
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-4 py-4 hidden md:table-cell">
                                                    <span className="text-[12px] text-[var(--color-text-secondary)]">
                                                        {r.department} · Year {r.year_level}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-4 hidden lg:table-cell">
                                                    <span className="text-[12px] text-[var(--color-text-secondary)]">
                                                        {fmt(r.reg_date)}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-4">
                                                    <MethodBadge method={r.payment_selection} />
                                                </td>

                                                <td className="px-4 py-4">
                                                    <PaymentBadge status={r.payment_status} />
                                                </td>

                                                <td className="px-4 py-4 hidden lg:table-cell">
                                                    <AttendanceBadge status={r.attendance_status} />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-surface-2)] flex items-center justify-between">
                            <p className="text-[12px] text-[var(--color-text-muted)]">
                                Showing <span className="font-semibold text-[var(--color-text)]">{filteredRegistrants.length}</span> registrants
                            </p>
                        </div>
                    </div>
                )}

                {/* TAB 2: PROOF REVIEW */}
                {activeTab === "proof" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activeProofs.length === 0 ? (
                            <div className="col-span-full bg-white border border-dashed border-gray-200 rounded-2xl p-8 text-center text-[13px] text-gray-400">
                                No pending payment proofs left to review.
                            </div>
                        ) : (
                            activeProofs.map((p) => (
                                <div key={p.id} className="bg-white border border-[var(--color-border)] rounded-2xl overflow-hidden flex flex-col justify-between shadow-sm">
                                    <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                                        <div className="flex items-center gap-2.5">
                                            <Avatar name={p.full_name} />
                                            <div>
                                                <p className="text-[13px] font-semibold text-gray-800 leading-tight">{p.full_name}</p>
                                                <p className="text-[11px] text-gray-400 font-mono mt-0.5">{p.school_id} · {p.department}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="relative aspect-[3/4] max-h-64 bg-gray-900 overflow-hidden flex items-center justify-center border-b border-gray-100">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={p.image_url} alt="Payment Receipt Proof" className="object-contain w-full h-full max-h-64 hover:scale-105 transition-transform duration-300" />
                                    </div>
                                    <div className="p-3 bg-white flex flex-col gap-2">
                                        <div className="flex justify-between items-center text-[11px] text-gray-400 px-1">
                                            <span>Uploaded {fmt(p.uploaded_at)}</span>
                                            <span>{fmtTime(p.uploaded_at)}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 mt-1">
                                            <button
                                                onClick={() => handleVerifyProof(p.id, p.reg_id, false)}
                                                className="h-8 rounded-lg border border-rose-200 bg-rose-50/50 text-[12px] font-medium text-rose-700 hover:bg-rose-50 transition-colors"
                                            >
                                                Reject
                                            </button>
                                            <button
                                                onClick={() => handleVerifyProof(p.id, p.reg_id, true)}
                                                className="h-8 rounded-lg bg-emerald-600 text-white text-[12px] font-medium hover:bg-emerald-700 transition-colors"
                                            >
                                                Approve
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* TAB 3: PENDING / UNPAID AUDIT PANEL */}
                {activeTab === "unpaid" && (
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
                                        <th className="text-left text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider px-6 py-3">Student</th>
                                        <th className="text-left text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider px-4 py-3">Selection</th>
                                        <th className="text-left text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider px-4 py-3">Payment Status</th>
                                        <th className="text-right text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider px-6 py-3">Quick Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--color-border)]">
                                    {filteredUnpaid.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="text-center py-8 text-[13px] text-gray-400">All registrants have cleared their payments.</td>
                                        </tr>
                                    ) : (
                                        filteredUnpaid.map((r) => (
                                            <tr key={r.id} className="hover:bg-[var(--color-surface-2)] transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar name={r.full_name} />
                                                        <div>
                                                            <p className="text-[13px] font-medium text-[var(--color-text)]">{r.full_name}</p>
                                                            <p className="text-[11px] text-[var(--color-text-muted)] font-mono">{r.school_id} · {r.department}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4"><MethodBadge method={r.payment_selection} /></td>
                                                <td className="px-4 py-4"><PaymentBadge status={r.payment_status} /></td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleMarkAsPaid(r.id)}
                                                        className="h-8 px-3 rounded-lg border border-emerald-200 bg-emerald-50 text-[12px] font-semibold text-emerald-700 hover:bg-emerald-100/70 transition-colors"
                                                    >
                                                        Received Cash
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-surface-2)] flex items-center justify-between">
                            <p className="text-[12px] text-[var(--color-text-muted)]">
                                Found <span className="font-semibold text-amber-600">{filteredUnpaid.length}</span> registrations requiring settlement.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </ManageShell>
    );
}