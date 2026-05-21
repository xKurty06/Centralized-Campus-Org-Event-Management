"use client";

import { useState, useEffect, ReactNode } from "react";
import React from "react";
import { useRouter, useParams } from "next/navigation";
import ManageShell from "@/components/ManageShell";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type AudienceType = "CvSU_Only" | "Org_Members_Only";
type EventStatus =
    | "Upcoming"
    | "Open"
    | "Full"
    | "Closed"
    | "Completed"
    | "Cancelled";

interface EventForm {
    id: string;
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    capacity: number | "";
    audience_type: AudienceType;
    is_paid: boolean;
    payment_instructions: string;
    status: EventStatus;
    venue_id: number;
    category_id: number;
    banner_url: string;
}

interface AudienceOption {
    value: AudienceType;
    label: string;
    description: string;
    icon: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_EVENT: EventForm = {
    id: "evt-001",
    title: "Web Development Workshop 2025",
    description:
        "A hands-on workshop covering modern web technologies including React, Next.js, and Tailwind CSS. Participants will build a complete web application from scratch.",
    start_date: "2025-08-15T09:00",
    end_date: "2025-08-15T17:00",
    capacity: 50,
    audience_type: "CvSU_Only",
    is_paid: true,
    payment_instructions:
        "Send payment to GCash: 09XX-XXX-XXXX (John Santos). Include your name and student ID in the reference.",
    status: "Upcoming",
    venue_id: 2,
    category_id: 1,
    banner_url: "",
};
const event = MOCK_EVENT;
function fmt(iso: string) {
    return new Date(iso).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

const VENUES = [
    { id: 1, name: "SMT Hall" },
    { id: 2, name: "AVR 2" },
    { id: 3, name: "Gymnasium" },
    { id: 4, name: "Function Hall" },
    { id: 5, name: "Open Grounds" },
    { id: 6, name: "Library AVR" },
];

const CATEGORIES = [
    { id: 1, name: "Workshop" },
    { id: 2, name: "Seminar" },
    { id: 3, name: "Competition" },
    { id: 4, name: "Activity" },
    { id: 5, name: "Training" },
    { id: 6, name: "Outreach" },
    { id: 7, name: "Cultural" },
    { id: 8, name: "Other" },
];

const AUDIENCE_OPTIONS: AudienceOption[] = [
    {
        value: "CvSU_Only",
        label: "CvSU Students Only",
        description: "Only verified CvSU students with @cvsu.edu.ph accounts.",
        icon: "🎓",
    },
    {
        value: "Org_Members_Only",
        label: "Org Members Only",
        description: "Restricted to members of your organization.",
        icon: "🔒",
    },
];

const STATUS_OPTIONS: EventStatus[] = [
    "Upcoming",
    "Open",
    "Full",
    "Closed",
    "Completed",
    "Cancelled",
];

// ─── Components ───────────────────────────────────────────────────────────────

function SectionCard({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle?: string;
    children: ReactNode;
}) {
    return (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="text-[15px] font-semibold text-gray-900 tracking-tight">
                    {title}
                </h2>
                {subtitle && (
                    <p className="text-[13px] text-gray-400 mt-0.5">{subtitle}</p>
                )}
            </div>
            <div className="px-6 py-5">{children}</div>
        </div>
    );
}

function Field({
    label,
    hint,
    required,
    children,
}: {
    label: string;
    hint?: string;
    required?: boolean;
    children: ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-700">
                {label}
                {required && <span className="text-red-400 ml-0.5">*</span>}
            </label>

            {children}

            {hint && <p className="text-[12px] text-gray-400">{hint}</p>}
        </div>
    );
}

function Input({
    className = "",
    ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
    className?: string;
}) {
    return (
        <input
            className={`w-full h-10 px-3 text-[14px] text-gray-900 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all placeholder:text-gray-300 ${className}`}
            {...props}
        />
    );
}

function Textarea({
    className = "",
    ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    className?: string;
}) {
    return (
        <textarea
            className={`w-full px-3 py-2.5 text-[14px] text-gray-900 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all resize-none placeholder:text-gray-300 ${className}`}
            {...props}
        />
    );
}

function Select({
    className = "",
    children,
    ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
    className?: string;
}) {
    return (
        <select
            className={`w-full h-10 px-3 text-[14px] text-gray-900 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all cursor-pointer ${className}`}
            {...props}
        >
            {children}
        </select>
    );
}

function StatusBadge({ status }: { status: EventStatus }) {
    const map = {
        Upcoming: "bg-blue-50 text-blue-700 border-blue-200",
        Open: "bg-emerald-50 text-emerald-700 border-emerald-200",
        Full: "bg-amber-50 text-amber-700 border-amber-200",
        Closed: "bg-gray-100 text-gray-600 border-gray-200",
        Completed: "bg-purple-50 text-purple-700 border-purple-200",
        Cancelled: "bg-red-50 text-red-600 border-red-200",
    };

    return (
        <span
            className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full border tracking-wide uppercase ${map[status]}`}
        >
            {status}
        </span>
    );
}

function Toggle({
    checked,
    onChange,
    label,
}: {
    checked: boolean;
    onChange: (val: boolean) => void;
    label: string;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className="flex items-center gap-3 group"
        >
            <div
                className={`relative w-10 h-[22px] rounded-full transition-colors duration-200 ${checked ? "bg-emerald-500" : "bg-gray-200"
                    }`}
            >
                <span
                    className={`absolute top-0.5 left-0.5 w-[18px] h-[18px] bg-white rounded-full shadow-sm transition-transform duration-200 ${checked ? "translate-x-[18px]" : "translate-x-0"
                        }`}
                />
            </div>

            <span className="text-[14px] text-gray-700 group-hover:text-gray-900 transition-colors">
                {label}
            </span>
        </button>
    );
}

function AudienceCard({
    option,
    selected,
    onClick,
}: {
    option: AudienceOption;
    selected: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full text-left p-4 rounded-xl border transition-all duration-150 ${selected
                ? "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-100"
                : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white"
                }`}
        >
            <div className="flex items-start gap-3">
                <span className="text-lg mt-0.5">{option.icon}</span>

                <div>
                    <p
                        className={`text-[13px] font-semibold ${selected ? "text-emerald-800" : "text-gray-800"
                            }`}
                    >
                        {option.label}
                    </p>

                    <p
                        className={`text-[12px] mt-0.5 ${selected ? "text-emerald-600" : "text-gray-400"
                            }`}
                    >
                        {option.description}
                    </p>
                </div>
            </div>
        </button>
    );
}

function BannerUpload({
    currentUrl,
    onChange,
}: {
    currentUrl: string;
    onChange: (url: string) => void;
}) {
    const [dragging, setDragging] = useState(false);

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragging(false);

        const file = e.dataTransfer.files[0];

        if (file && file.type.startsWith("image/")) {
            onChange(URL.createObjectURL(file));
        }
    };

    return (
        <div
            onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`relative w-full h-44 rounded-xl border-2 border-dashed transition-all overflow-hidden ${dragging
                ? "border-emerald-400 bg-emerald-50"
                : "border-gray-200 bg-gray-50 hover:border-gray-300"
                }`}
        >
            {currentUrl ? (
                <img
                    src={currentUrl}
                    alt="Banner"
                    className="w-full h-full object-cover"
                />
            ) : (
                <label className="flex flex-col items-center justify-center h-full cursor-pointer gap-2">
                    <div className="text-center">
                        <p className="text-[13px] font-medium text-gray-600">
                            Drop banner image here
                        </p>

                        <p className="text-[12px] text-gray-400 mt-0.5">
                            or click to browse
                        </p>
                    </div>

                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];

                            if (file) {
                                onChange(URL.createObjectURL(file));
                            }
                        }}
                    />
                </label>
            )}
        </div>
    );
}

function UnsavedBadge({ visible }: { visible: boolean }) {
    if (!visible) return null;

    return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Unsaved changes
        </span>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EditEventPage() {
    const router = useRouter();
    const params = useParams();

    const eventId = Array.isArray(params?.["event-id"])
        ? params["event-id"][0]
        : params?.["event-id"] ?? "evt-001";

    const [form, setForm] = useState<EventForm | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const timer = setTimeout(() => {
            setForm({ ...MOCK_EVENT });
            setLoading(false);
        }, 500);

        return () => clearTimeout(timer);
    }, [eventId]);

    const update = (
        field: keyof EventForm,
        value: EventForm[keyof EventForm]
    ) => {
        setForm((prev) => ({ ...prev!, [field]: value }));
        setIsDirty(true);
        setSaved(false);
    };

    const validate = () => {
        const errs: Record<string, string> = {};

        if (!form?.title.trim()) errs.title = "Event title is required.";
        if (!form?.description.trim())
            errs.description = "Description is required.";

        return errs;
    };

    const handleSave = async () => {
        const errs = validate();

        if (Object.keys(errs).length) {
            setErrors(errs);
            return;
        }

        setSaving(true);

        await new Promise((r) => setTimeout(r, 1200));

        setSaving(false);
        setSaved(true);
        setIsDirty(false);
    };

    if (loading || !form) {
        return (
            <div className="min-h-screen bg-[#f7f8fa] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <ManageShell pageTitle="Salikop">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-5 animate-fade-in">
                <div className="flex flex-col gap-3">
                        <nav className="flex items-center gap-2 text-[13px] font-medium text-[var(--color-text-muted)] flex-wrap">
                            <Link
                                href="/manage/events"
                                className="hover:text-[var(--color-primary)] transition-colors no-underline"
                            >
                                Events
                            </Link>
                            <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none">
                                <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <Link
                                href={`/manage/events/${event.id}`}
                                className="hover:text-[var(--color-primary)] transition-colors no-underline truncate max-w-[180px] sm:max-w-xs"
                            >
                                {event.title}
                            </Link>
                            <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none">
                                <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span className="text-[var(--color-text)] font-semibold">Edit Event</span>
                        </nav>

                        <div className="flex items-center gap-2">
                            <div className="flex flex-col">
                            <h1 className="text-[24px] font-bold text-gray-900 tracking-tight">
                                Edit Event
                            </h1>
                            <p className="text-[13px] text-[var(--color-text-muted)] mt-1">
                                {fmt(event.start_date)} · Event ID:{" "}
                                <span className="font-mono">{eventId}</span>
                            </p>

                            </div>

                            <UnsavedBadge visible={isDirty} />

                            {saved && (
                                <span className="text-[12px] text-emerald-600 font-medium">
                                    Saved
                                </span>
                            )}
                        </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 text-[13px] font-semibold bg-green-700 hover:bg-green-800 text-white px-3 py-2 rounded-lg transition-colors no-underline flex-shrink-0"
                >
                    {saving ? "Saving…" : "Save Changes"}
                </button>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <SectionCard
                        title="Event Banner"
                        subtitle="Displayed on event cards and detail page."
                    >
                        <BannerUpload
                            currentUrl={form.banner_url}
                            onChange={(url) => update("banner_url", url)}
                        />
                    </SectionCard>

                    <SectionCard
                        title="Basic Information"
                        subtitle="Core event details."
                    >
                        <div className="flex flex-col gap-5">
                            <Field label="Event Title" required>
                                <Input
                                    value={form.title}
                                    onChange={(e) =>
                                        update("title", e.target.value)
                                    }
                                />

                                {errors.title && (
                                    <p className="text-[12px] text-red-500">
                                        {errors.title}
                                    </p>
                                )}
                            </Field>

                            <Field label="Description" required>
                                <Textarea
                                    rows={5}
                                    value={form.description}
                                    onChange={(e) =>
                                        update(
                                            "description",
                                            e.target.value
                                        )
                                    }
                                />

                                {errors.description && (
                                    <p className="text-[12px] text-red-500">
                                        {errors.description}
                                    </p>
                                )}
                            </Field>

                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Category">
                                    <Select
                                        value={form.category_id}
                                        onChange={(e) =>
                                            update(
                                                "category_id",
                                                Number(e.target.value)
                                            )
                                        }
                                    >
                                        {CATEGORIES.map((c) => (
                                            <option
                                                key={c.id}
                                                value={c.id}
                                            >
                                                {c.name}
                                            </option>
                                        ))}
                                    </Select>
                                </Field>

                                <Field label="Venue">
                                    <Select
                                        value={form.venue_id}
                                        onChange={(e) =>
                                            update(
                                                "venue_id",
                                                Number(e.target.value)
                                            )
                                        }
                                    >
                                        {VENUES.map((v) => (
                                            <option
                                                key={v.id}
                                                value={v.id}
                                            >
                                                {v.name}
                                            </option>
                                        ))}
                                    </Select>
                                </Field>
                            </div>
                        </div>
                    </SectionCard>
                </div>

                {/* Right */}
                <div className="flex flex-col gap-6">
                    <SectionCard title="Event Status">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[13px] text-gray-500">
                                    Current
                                </span>

                                <StatusBadge status={form.status} />
                            </div>

                            <Field label="Update Status">
                                <Select
                                    value={form.status}
                                    onChange={(e) =>
                                        update(
                                            "status",
                                            e.target
                                                .value as EventStatus
                                        )
                                    }
                                >
                                    {STATUS_OPTIONS.map((s) => (
                                        <option key={s} value={s}>
                                            {s}
                                        </option>
                                    ))}
                                </Select>
                            </Field>
                        </div>
                    </SectionCard>

                    <SectionCard
                        title="Audience"
                        subtitle="Who can register."
                    >
                        <div className="flex flex-col gap-2">
                            {AUDIENCE_OPTIONS.map((opt) => (
                                <AudienceCard
                                    key={opt.value}
                                    option={opt}
                                    selected={
                                        form.audience_type === opt.value
                                    }
                                    onClick={() =>
                                        update(
                                            "audience_type",
                                            opt.value
                                        )
                                    }
                                />
                            ))}
                        </div>
                    </SectionCard>
                </div>
            </div>
        </ManageShell>
    );
}