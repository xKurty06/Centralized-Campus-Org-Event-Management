"use client";

import { useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import React from "react";

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

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_EVENT = {
    id: "evt-001",
    title: "Web Development Workshop 2025",
    status: "Open",
    start_date: "2025-08-15T09:00",
    capacity: 50,
};

const MOCK_REGISTRANTS: Registrant[] = [
    { id: "r1", user_id: "u1", full_name: "Maria Santos", school_id: "2023-1-00123", department: "CCS", year_level: 2, reg_date: "2025-07-01T10:23:00", payment_selection: "Online", payment_status: "Paid", attendance_status: "Checked_In", check_in_at: "2025-08-15T09:04:00" },
    { id: "r2", user_id: "u2", full_name: "Juan dela Cruz", school_id: "2022-1-00456", department: "CAS", year_level: 3, reg_date: "2025-07-02T14:10:00", payment_selection: "Online", payment_status: "Pending", attendance_status: "Not_Arrived", check_in_at: null },
    { id: "r3", user_id: "u3", full_name: "Ana Reyes", school_id: "2024-1-00789", department: "CBA", year_level: 1, reg_date: "2025-07-03T09:55:00", payment_selection: "On-site", payment_status: "Pending", attendance_status: "Not_Arrived", check_in_at: null },
    { id: "r4", user_id: "u4", full_name: "Carlos Mendoza", school_id: "2021-1-00321", department: "CCS", year_level: 4, reg_date: "2025-07-03T16:40:00", payment_selection: "Online", payment_status: "Paid", attendance_status: "Not_Arrived", check_in_at: null },
    { id: "r5", user_id: "u5", full_name: "Sofia Villanueva", school_id: "2023-1-00654", department: "COE", year_level: 2, reg_date: "2025-07-04T11:20:00", payment_selection: "N/A", payment_status: "Paid", attendance_status: "Checked_In", check_in_at: "2025-08-15T09:11:00" },
    { id: "r6", user_id: "u6", full_name: "Miguel Torres", school_id: "2022-1-00987", department: "CAS", year_level: 3, reg_date: "2025-07-05T08:30:00", payment_selection: "Online", payment_status: "Pending", attendance_status: "Not_Arrived", check_in_at: null },
    { id: "r7", user_id: "u7", full_name: "Isabella Cruz", school_id: "2024-1-00111", department: "CCS", year_level: 1, reg_date: "2025-07-06T13:15:00", payment_selection: "On-site", payment_status: "Pending", attendance_status: "Not_Arrived", check_in_at: null },
    { id: "r8", user_id: "u8", full_name: "Rafael Garcia", school_id: "2021-1-00222", department: "COE", year_level: 4, reg_date: "2025-07-07T10:00:00", payment_selection: "Online", payment_status: "Paid", attendance_status: "Checked_In", check_in_at: "2025-08-15T09:22:00" },
    { id: "r9", user_id: "u9", full_name: "Gabrielle Lim", school_id: "2023-1-00333", department: "CBA", year_level: 2, reg_date: "2025-07-08T15:45:00", payment_selection: "N/A", payment_status: "Paid", attendance_status: "Not_Arrived", check_in_at: null },
    { id: "r10", user_id: "u10", full_name: "Daniel Aquino", school_id: "2022-1-00444", department: "CAS", year_level: 3, reg_date: "2025-07-09T09:10:00", payment_selection: "Online", payment_status: "Pending", attendance_status: "Not_Arrived", check_in_at: null },
];

const MOCK_PROOFS: PaymentProof[] = [
    { id: "p1", reg_id: "r2", full_name: "Juan dela Cruz", school_id: "2022-1-00456", department: "CAS", image_url: "https://placehold.co/400x600/e8f4f8/1a6b8a?text=GCash+Receipt", uploaded_at: "2025-07-02T14:30:00", status: "Pending_Review", payment_selection: "Online" },
    { id: "p2", reg_id: "r6", full_name: "Miguel Torres", school_id: "2022-1-00987", department: "CAS", image_url: "https://placehold.co/400x600/f0f8e8/2d6a1a?text=Bank+Transfer", uploaded_at: "2025-07-05T09:00:00", status: "Pending_Review", payment_selection: "Online" },
    { id: "p3", reg_id: "r10", full_name: "Daniel Aquino", school_id: "2022-1-00444", department: "CAS", image_url: "https://placehold.co/400x600/f8f0e8/8a4a1a?text=GCash+Receipt", uploaded_at: "2025-07-09T09:20:00", status: "Pending_Review", payment_selection: "Online" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(iso: string) {
    return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Checked In
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            Not Arrived
        </span>
    );
}

function MethodBadge({ method }: { method: PaymentSelection }) {
    const map: Record<PaymentSelection, string> = {
        "Online": "bg-purple-50 text-purple-700 border-purple-200",
        "On-site": "bg-gray-100 text-gray-600 border-gray-200",
        "N/A": "bg-gray-50 text-gray-400 border-gray-100",
    };
    return (
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${map[method]}`}>
            {method}
        </span>
    );
}

function ProofStatusBadge({ status }: { status: ProofStatus }) {
    const map: Record<ProofStatus, string> = {
        Pending_Review: "bg-amber-50 text-amber-700 border-amber-200",
        Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
        Rejected: "bg-red-50 text-red-600 border-red-200",
    };
    const labels: Record<ProofStatus, string> = {
        Pending_Review: "Pending Review",
        Approved: "Approved",
        Rejected: "Rejected",
    };
    return (
        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${map[status]}`}>
            {labels[status]}
        </span>
    );
}

function Avatar({ name }: { name: string }) {
    const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
    const colors = [
        "bg-blue-100 text-blue-700",
        "bg-purple-100 text-purple-700",
        "bg-emerald-100 text-emerald-700",
        "bg-amber-100 text-amber-700",
        "bg-rose-100 text-rose-700",
    ];
    const color = colors[name.charCodeAt(0) % colors.length];
    return (
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${color}`}>
            {initials}
        </div>
    );
}

// ─── Proof Review Modal ───────────────────────────────────────────────────────

function ProofModal({
    proof,
    onClose,
    onApprove,
    onReject,
}: {
    proof: PaymentProof;
    onClose: () => void;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
}) {
    return (
        <div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-[14px] font-semibold text-gray-900">{proof.full_name}</p>
                        <p className="text-[12px] text-gray-400">{proof.school_id} · {proof.department}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                    >
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Proof image */}
                <div className="bg-gray-50 flex items-center justify-center p-4" style={{ minHeight: 280 }}>
                    <img
                        src={proof.image_url}
                        alt="Payment proof"
                        className="max-h-64 max-w-full rounded-lg border border-gray-200 object-contain shadow-sm"
                    />
                </div>

                {/* Meta */}
                <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-[12px] text-gray-400">
                        Uploaded {fmt(proof.uploaded_at)} at {fmtTime(proof.uploaded_at)}
                    </p>
                    <ProofStatusBadge status={proof.status} />
                </div>

                {/* Actions */}
                {proof.status === "Pending_Review" && (
                    <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
                        <button
                            onClick={() => { onReject(proof.id); onClose(); }}
                            className="flex-1 h-10 text-[13px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors"
                        >
                            Reject
                        </button>
                        <button
                            onClick={() => { onApprove(proof.id); onClose(); }}
                            className="flex-1 h-10 text-[13px] font-semibold text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 transition-colors"
                        >
                            Approve Payment
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Tab: All Registrants ─────────────────────────────────────────────────────

function AllRegistrantsTab({ registrants }: { registrants: Registrant[] }) {
    const [search, setSearch] = useState("");
    const [filterPayment, setFilterPayment] = useState<"all" | PaymentStatus>("all");
    const [filterAttendance, setFilterAttendance] = useState<"all" | AttendanceStatus>("all");

    const filtered = useMemo(() => {
        return registrants.filter((r) => {
            const q = search.toLowerCase();
            const matchSearch =
                !q ||
                r.full_name.toLowerCase().includes(q) ||
                r.school_id.toLowerCase().includes(q) ||
                r.department.toLowerCase().includes(q);
            const matchPayment = filterPayment === "all" || r.payment_status === filterPayment;
            const matchAttendance = filterAttendance === "all" || r.attendance_status === filterAttendance;
            return matchSearch && matchPayment && matchAttendance;
        });
    }, [registrants, search, filterPayment, filterAttendance]);

    return (
        <div className="flex flex-col gap-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                    </svg>
                    <input
                        type="text"
                        value={search}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                        placeholder="Search by name, ID, or department…"
                        className="w-full h-10 pl-9 pr-3 text-[13px] text-gray-900 bg-white border border-gray-200 rounded-xl outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all placeholder:text-gray-300"
                    />
                </div>
                <select
                    value={filterPayment}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterPayment(e.target.value as "all" | PaymentStatus)}
                    className="h-10 px-3 text-[13px] text-gray-700 bg-white border border-gray-200 rounded-xl outline-none focus:border-emerald-400 transition-all cursor-pointer"
                >
                    <option value="all">All Payment</option>
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                </select>
                <select
                    value={filterAttendance}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterAttendance(e.target.value as "all" | AttendanceStatus)}
                    className="h-10 px-3 text-[13px] text-gray-700 bg-white border border-gray-200 rounded-xl outline-none focus:border-emerald-400 transition-all cursor-pointer"
                >
                    <option value="all">All Attendance</option>
                    <option value="Checked_In">Checked In</option>
                    <option value="Not_Arrived">Not Arrived</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/60">
                                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Student</th>
                                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Dept</th>
                                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Registered</th>
                                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Method</th>
                                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Payment</th>
                                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Attendance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-[13px] text-gray-400">
                                        No registrants match your filters.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((r) => (
                                    <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <Avatar name={r.full_name} />
                                                <div>
                                                    <p className="text-[13px] font-medium text-gray-900">{r.full_name}</p>
                                                    <p className="text-[11px] text-gray-400 font-mono">{r.school_id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 hidden sm:table-cell">
                                            <span className="text-[12px] text-gray-500">{r.department} · Y{r.year_level}</span>
                                        </td>
                                        <td className="px-4 py-3.5 hidden md:table-cell">
                                            <span className="text-[12px] text-gray-500">{fmt(r.reg_date)}</span>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <MethodBadge method={r.payment_selection} />
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <PaymentBadge status={r.payment_status} />
                                        </td>
                                        <td className="px-4 py-3.5 hidden lg:table-cell">
                                            <AttendanceBadge status={r.attendance_status} />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/40 flex items-center justify-between">
                    <p className="text-[12px] text-gray-400">
                        Showing <span className="font-medium text-gray-600">{filtered.length}</span> of <span className="font-medium text-gray-600">{registrants.length}</span> registrants
                    </p>
                    <button
                        className="text-[12px] font-medium text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1"
                        onClick={() => {
                            const csv = [
                                ["Name", "School ID", "Department", "Year", "Registered", "Method", "Payment", "Attendance"].join(","),
                                ...filtered.map((r) =>
                                    [r.full_name, r.school_id, r.department, r.year_level, fmt(r.reg_date), r.payment_selection, r.payment_status, r.attendance_status].join(",")
                                ),
                            ].join("\n");
                            const blob = new Blob([csv], { type: "text/csv" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = "masterlist.csv";
                            a.click();
                        }}
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        Export CSV
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Tab: Proof Review ────────────────────────────────────────────────────────

function ProofReviewTab({
    proofs,
    onApprove,
    onReject,
}: {
    proofs: PaymentProof[];
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
}) {
    const [selected, setSelected] = useState<PaymentProof | null>(null);
    const pending = proofs.filter((p) => p.status === "Pending_Review");
    const resolved = proofs.filter((p) => p.status !== "Pending_Review");

    return (
        <>
            {selected && (
                <ProofModal
                    proof={selected}
                    onClose={() => setSelected(null)}
                    onApprove={onApprove}
                    onReject={onReject}
                />
            )}

            <div className="flex flex-col gap-6">
                {/* Pending */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <p className="text-[13px] font-semibold text-gray-700">Awaiting Review</p>
                        {pending.length > 0 && (
                            <span className="text-[11px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                {pending.length}
                            </span>
                        )}
                    </div>

                    {pending.length === 0 ? (
                        <div className="bg-white border border-gray-100 rounded-2xl py-10 flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                                <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                            </div>
                            <p className="text-[13px] text-gray-500 font-medium">All proofs reviewed</p>
                            <p className="text-[12px] text-gray-400">No submissions pending your action.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {pending.map((proof) => (
                                <button
                                    key={proof.id}
                                    onClick={() => setSelected(proof)}
                                    className="bg-white border border-gray-100 rounded-2xl overflow-hidden text-left hover:border-emerald-200 hover:shadow-md transition-all group"
                                >
                                    <div className="relative bg-gray-50 h-40 flex items-center justify-center overflow-hidden">
                                        <img
                                            src={proof.image_url}
                                            alt="Proof thumbnail"
                                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                            <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-[12px] font-semibold text-gray-800 px-3 py-1.5 rounded-lg">
                                                Review →
                                            </span>
                                        </div>
                                    </div>
                                    <div className="px-4 py-3.5">
                                        <div className="flex items-center gap-2.5 mb-1">
                                            <Avatar name={proof.full_name} />
                                            <div className="min-w-0">
                                                <p className="text-[13px] font-medium text-gray-900 truncate">{proof.full_name}</p>
                                                <p className="text-[11px] text-gray-400 font-mono">{proof.school_id}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-2.5">
                                            <span className="text-[11px] text-gray-400">{fmt(proof.uploaded_at)}</span>
                                            <ProofStatusBadge status={proof.status} />
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Resolved */}
                {resolved.length > 0 && (
                    <div>
                        <p className="text-[13px] font-semibold text-gray-700 mb-3">Resolved</p>
                        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/60">
                                        <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Student</th>
                                        <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Uploaded</th>
                                        <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Status</th>
                                        <th className="px-4 py-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {resolved.map((proof) => (
                                        <tr key={proof.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <Avatar name={proof.full_name} />
                                                    <div>
                                                        <p className="text-[13px] font-medium text-gray-900">{proof.full_name}</p>
                                                        <p className="text-[11px] text-gray-400 font-mono">{proof.school_id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 hidden sm:table-cell">
                                                <span className="text-[12px] text-gray-500">{fmt(proof.uploaded_at)}</span>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <ProofStatusBadge status={proof.status} />
                                            </td>
                                            <td className="px-4 py-3.5 text-right">
                                                <button
                                                    onClick={() => setSelected(proof)}
                                                    className="text-[12px] text-gray-400 hover:text-gray-700 transition-colors"
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

// ─── Tab: Pending / Unpaid ────────────────────────────────────────────────────

function UnpaidTab({ registrants }: { registrants: Registrant[] }) {
    const unpaid = registrants.filter((r) => r.payment_status === "Pending");

    return (
        <div className="flex flex-col gap-4">
            {unpaid.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-2xl py-14 flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                        <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                    </div>
                    <p className="text-[13px] text-gray-500 font-medium">All payments confirmed</p>
                    <p className="text-[12px] text-gray-400">No pending or unpaid registrations.</p>
                </div>
            ) : (
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-gray-100 bg-amber-50/60 flex items-start gap-3">
                        <svg className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                        <div>
                            <p className="text-[12px] font-semibold text-amber-800">
                                {unpaid.length} registrant{unpaid.length !== 1 ? "s" : ""} with unconfirmed payment
                            </p>
                            <p className="text-[11px] text-amber-600 mt-0.5">
                                On-site payments can be confirmed at the Entrance Panel on event day. Online payments require proof submission.
                            </p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/60">
                                    <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Student</th>
                                    <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Dept</th>
                                    <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Method</th>
                                    <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Registered</th>
                                    <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Proof</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {unpaid.map((r) => (
                                    <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <Avatar name={r.full_name} />
                                                <div>
                                                    <p className="text-[13px] font-medium text-gray-900">{r.full_name}</p>
                                                    <p className="text-[11px] text-gray-400 font-mono">{r.school_id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 hidden sm:table-cell">
                                            <span className="text-[12px] text-gray-500">{r.department} · Y{r.year_level}</span>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <MethodBadge method={r.payment_selection} />
                                        </td>
                                        <td className="px-4 py-3.5 hidden md:table-cell">
                                            <span className="text-[12px] text-gray-500">{fmt(r.reg_date)}</span>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            {r.payment_selection === "Online" ? (
                                                <span className="text-[11px] font-medium text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                                    Awaiting upload
                                                </span>
                                            ) : r.payment_selection === "On-site" ? (
                                                <span className="text-[11px] font-medium text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
                                                    Pay at door
                                                </span>
                                            ) : (
                                                <span className="text-[11px] text-gray-400">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
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
    const [proofs, setProofs] = useState<PaymentProof[]>(MOCK_PROOFS);

    const pendingProofCount = proofs.filter((p) => p.status === "Pending_Review").length;
    const unpaidCount = MOCK_REGISTRANTS.filter((r) => r.payment_status === "Pending").length;

    const confirmedCount = MOCK_REGISTRANTS.filter((r) => r.payment_status === "Paid").length;
    const checkedInCount = MOCK_REGISTRANTS.filter((r) => r.attendance_status === "Checked_In").length;

    const handleApprove = (proofId: string) => {
        setProofs((prev) =>
            prev.map((p) => (p.id === proofId ? { ...p, status: "Approved" as ProofStatus } : p))
        );
    };

    const handleReject = (proofId: string) => {
        setProofs((prev) =>
            prev.map((p) => (p.id === proofId ? { ...p, status: "Rejected" as ProofStatus } : p))
        );
    };

    const tabs: { key: Tab; label: string; count?: number }[] = [
        { key: "all", label: "All Registrants", count: MOCK_REGISTRANTS.length },
        { key: "proof", label: "Proof Review", count: pendingProofCount },
        { key: "unpaid", label: "Pending / Unpaid", count: unpaidCount },
    ];

    return (
        <div className="min-h-screen bg-[#f7f8fa] font-sans">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-white border-b border-gray-100">
                <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.back()}
                            className="text-gray-400 hover:text-gray-700 transition-colors p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                            </svg>
                        </button>
                        <div className="h-4 w-px bg-gray-200" />
                        <div>
                            <p className="text-[11px] text-gray-400 leading-none mb-0.5">Manage / Events</p>
                            <p className="text-[13px] font-semibold text-gray-900 leading-none">Masterlist</p>
                        </div>
                    </div>
                    <button
                        onClick={() => router.push(`/manage/verify/${eventId}`)}
                        className="inline-flex items-center gap-2 h-9 px-4 bg-emerald-500 hover:bg-emerald-600 text-white text-[13px] font-semibold rounded-lg transition-colors"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                        </svg>
                        Entrance Panel
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-6">
                {/* Event info */}
                <div>
                    <h1 className="text-[20px] font-bold text-gray-900 tracking-tight">{MOCK_EVENT.title}</h1>
                    <p className="text-[13px] text-gray-400 mt-1">
                        {fmt(MOCK_EVENT.start_date)} · Event ID:{" "}
                        <span className="font-mono">{eventId}</span>
                    </p>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: "Total Registered", value: MOCK_REGISTRANTS.length, color: "text-gray-900" },
                        { label: "Payment Confirmed", value: confirmedCount, color: "text-emerald-700" },
                        { label: "Pending Payment", value: unpaidCount, color: "text-amber-700" },
                        { label: "Checked In", value: checkedInCount, color: "text-blue-700" },
                    ].map(({ label, value, color }) => (
                        <div key={label} className="bg-white border border-gray-100 rounded-2xl px-4 py-4">
                            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-1">{label}</p>
                            <p className={`text-[26px] font-bold leading-none ${color}`}>{value}</p>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-2xl p-1.5 w-fit">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`relative flex items-center gap-2 h-8 px-4 rounded-xl text-[13px] font-medium transition-all ${activeTab === tab.key
                                    ? "bg-gray-900 text-white shadow-sm"
                                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                                }`}
                        >
                            {tab.label}
                            {tab.count !== undefined && tab.count > 0 && (
                                <span
                                    className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full leading-none ${activeTab === tab.key
                                            ? "bg-white/20 text-white"
                                            : tab.key === "proof"
                                                ? "bg-amber-100 text-amber-700"
                                                : tab.key === "unpaid"
                                                    ? "bg-amber-100 text-amber-700"
                                                    : "bg-gray-100 text-gray-600"
                                        }`}
                                >
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                {activeTab === "all" && <AllRegistrantsTab registrants={MOCK_REGISTRANTS} />}
                {activeTab === "proof" && (
                    <ProofReviewTab proofs={proofs} onApprove={handleApprove} onReject={handleReject} />
                )}
                {activeTab === "unpaid" && <UnpaidTab registrants={MOCK_REGISTRANTS} />}
            </main>
        </div>
    );
}