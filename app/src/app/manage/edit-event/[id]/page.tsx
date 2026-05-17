"use client";

import { useState, useEffect, ReactNode, ChangeEvent, DragEvent } from "react";
import React from "react";
import { useRouter, useParams } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

type AudienceType = "Open" | "CvSU_Only" | "Org_Members_Only";
type PaymentSelection = "Online" | "On-site" | "N/A";
type EventStatus = "Upcoming" | "Open" | "Full" | "Closed" | "Completed" | "Cancelled";

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

// ─── Mock data (replace with real API calls) ───────────────────────────────
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
        value: "Open",
        label: "Open to All",
        description: "Anyone can register, including non-CvSU students.",
        icon: "🌐",
    },
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

const STATUS_OPTIONS = ["Upcoming", "Open", "Full", "Closed", "Completed", "Cancelled"];

// ─── Sub-components ─────────────────────────────────────────────────────────

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
    return (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="text-[15px] font-semibold text-gray-900 tracking-tight">{title}</h2>
                {subtitle && <p className="text-[13px] text-gray-400 mt-0.5">{subtitle}</p>}
            </div>
            <div className="px-6 py-5">{children}</div>
        </div>
    );
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: ReactNode }) {
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

function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement> & { className?: string }) {
    return (
        <input
            className={`w-full h-10 px-3 text-[14px] text-gray-900 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all placeholder:text-gray-300 ${className}`}
            {...props}
        />
    );
}

function Textarea({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { className?: string }) {
    return (
        <textarea
            className={`w-full px-3 py-2.5 text-[14px] text-gray-900 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all resize-none placeholder:text-gray-300 ${className}`}
            {...props}
        />
    );
}

function Select({ className = "", children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { className?: string }) {
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
            className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full border tracking-wide uppercase ${map[status] || map.Closed}`}
        >
            {status}
        </span>
    );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (val: boolean) => void; label: string }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className="flex items-center gap-3 group"
        >
            <div
                className={`relative w-10 h-5.5 rounded-full transition-colors duration-200 ${checked ? "bg-emerald-500" : "bg-gray-200"
                    }`}
                style={{ height: "22px", width: "40px" }}
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

function AudienceCard({ option, selected, onClick }: { option: AudienceOption; selected: boolean; onClick: () => void }) {
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
                    <p className={`text-[12px] mt-0.5 ${selected ? "text-emerald-600" : "text-gray-400"}`}>
                        {option.description}
                    </p>
                </div>
                {selected && (
                    <div className="ml-auto w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
                            <path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                )}
            </div>
        </button>
    );
}

function BannerUpload({ currentUrl, onChange }: { currentUrl: string; onChange: (url: string) => void }) {
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
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`relative w-full h-44 rounded-xl border-2 border-dashed transition-all overflow-hidden ${dragging
                    ? "border-emerald-400 bg-emerald-50"
                    : "border-gray-200 bg-gray-50 hover:border-gray-300"
                }`}
        >
            {currentUrl ? (
                <>
                    <img src={currentUrl} alt="Banner preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <label className="cursor-pointer bg-white text-gray-800 text-[12px] font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                            Change
                            <input type="file" accept="image/*" className="hidden" onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const file = e.target.files?.[0];
                                if (file) onChange(URL.createObjectURL(file));
                            }} />
                        </label>
                        <button
                            type="button"
                            onClick={() => onChange("")}
                            className="bg-red-50 text-red-600 text-[12px] font-medium px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
                        >
                            Remove
                        </button>
                    </div>
                </>
            ) : (
                <label className="flex flex-col items-center justify-center h-full cursor-pointer gap-2">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M9 9.75h.008v.008H9V9.75zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                    </div>
                    <div className="text-center">
                        <p className="text-[13px] font-medium text-gray-600">Drop banner image here</p>
                        <p className="text-[12px] text-gray-400 mt-0.5">or click to browse — PNG, JPG up to 5MB</p>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const file = e.target.files?.[0];
                        if (file) onChange(URL.createObjectURL(file));
                    }} />
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

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function EditEventPage() {
    const router = useRouter();
    const params = useParams();
    const eventId = Array.isArray(params?.id) ? params.id[0] : (params?.id ?? "evt-001");

    const [form, setForm] = useState<EventForm | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [saved, setSaved] = useState<boolean>(false);
    const [isDirty, setIsDirty] = useState<boolean>(false);
    const [errors, setErrors] = useState<Record<string, string | null>>({});

    // Simulate fetch
    useEffect(() => {
        const timer = setTimeout(() => {
            setForm({ ...MOCK_EVENT });
            setLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, [eventId]);

    const update = (field: keyof EventForm, value: EventForm[keyof EventForm]) => {
        setForm((prev) => ({ ...prev!, [field]: value } as EventForm));
        setIsDirty(true);
        setSaved(false);
        setErrors((prev) => ({ ...prev, [field]: null }));
    };

    const validate = (): Record<string, string> => {
        const errs: Record<string, string> = {};
        if (!form!.title?.trim()) errs.title = "Event title is required.";
        if (!form!.description?.trim()) errs.description = "Description is required.";
        if (!form!.start_date) errs.start_date = "Start date is required.";
        if (!form!.end_date) errs.end_date = "End date is required.";
        if (form!.start_date && form!.end_date && form!.end_date <= form!.start_date)
            errs.end_date = "End date must be after start date.";
        if (!form!.capacity || form!.capacity < 1) errs.capacity = "Capacity must be at least 1.";
        if (form!.is_paid && !form!.payment_instructions?.trim())
            errs.payment_instructions = "Payment instructions are required for paid events.";
        return errs;
    };

    const handleSave = async () => {
        const errs = validate();
        if (Object.keys(errs).length) {
            setErrors(errs);
            const firstErr = document.querySelector("[data-error]");
            firstErr?.scrollIntoView({ behavior: "smooth", block: "center" });
            return;
        }
        setSaving(true);
        // Simulate API call
        await new Promise((r) => setTimeout(r, 1200));
        setSaving(false);
        setSaved(true);
        setIsDirty(false);
    };

    if (loading || !form) {
        return (
            <div className="min-h-screen bg-[#f7f8fa] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
                    <p className="text-[13px] text-gray-400">Loading event…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f7f8fa] font-sans">
            {/* Top nav bar */}
            <header className="sticky top-0 z-30 bg-white border-b border-gray-100">
                <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
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
                            <p className="text-[13px] font-semibold text-gray-900 leading-none">Edit Event</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <UnsavedBadge visible={isDirty} />
                        {saved && (
                            <span className="text-[12px] text-emerald-600 font-medium flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                                Saved
                            </span>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="inline-flex items-center gap-2 h-9 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-[13px] font-semibold rounded-lg transition-colors"
                        >
                            {saving ? (
                                <>
                                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    Saving…
                                </>
                            ) : (
                                <>
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* Body */}
            <main className="max-w-5xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left column — primary fields */}
                    <div className="lg:col-span-2 flex flex-col gap-6">

                        {/* Banner */}
                        <SectionCard title="Event Banner" subtitle="Displayed on event cards and the detail page.">
                            <BannerUpload
                                currentUrl={form.banner_url}
                                onChange={(url) => update("banner_url", url)}
                            />
                        </SectionCard>

                        {/* Basic Info */}
                        <SectionCard title="Basic Information" subtitle="Core details shown on the public event listing.">
                            <div className="flex flex-col gap-5">
                                <Field label="Event Title" required>
                                    <Input
                                        value={form.title}
                                        onChange={(e) => update("title", e.target.value)}
                                        placeholder="e.g. Web Development Workshop 2025"
                                        maxLength={120}
                                    />
                                    {errors.title && (
                                        <p data-error className="text-[12px] text-red-500 mt-0.5">{errors.title}</p>
                                    )}
                                </Field>

                                <Field label="Description" required hint="Shown on the event detail page. Markdown is not supported.">
                                    <Textarea
                                        rows={5}
                                        value={form.description}
                                        onChange={(e) => update("description", e.target.value)}
                                        placeholder="Describe what students can expect from this event…"
                                    />
                                    {errors.description && (
                                        <p data-error className="text-[12px] text-red-500 mt-0.5">{errors.description}</p>
                                    )}
                                </Field>

                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Category" required>
                                        <Select
                                            value={form.category_id}
                                            onChange={(e) => update("category_id", Number(e.target.value))}
                                        >
                                            {CATEGORIES.map((c) => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </Select>
                                    </Field>
                                    <Field label="Venue" required>
                                        <Select
                                            value={form.venue_id}
                                            onChange={(e) => update("venue_id", Number(e.target.value))}
                                        >
                                            {VENUES.map((v) => (
                                                <option key={v.id} value={v.id}>{v.name}</option>
                                            ))}
                                        </Select>
                                    </Field>
                                </div>
                            </div>
                        </SectionCard>

                        {/* Schedule & Capacity */}
                        <SectionCard title="Schedule & Capacity" subtitle="Controls registration availability and logistics.">
                            <div className="flex flex-col gap-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Start Date & Time" required>
                                        <Input
                                            type="datetime-local"
                                            value={form.start_date}
                                            onChange={(e) => update("start_date", e.target.value)}
                                        />
                                        {errors.start_date && (
                                            <p data-error className="text-[12px] text-red-500 mt-0.5">{errors.start_date}</p>
                                        )}
                                    </Field>
                                    <Field label="End Date & Time" required>
                                        <Input
                                            type="datetime-local"
                                            value={form.end_date}
                                            onChange={(e) => update("end_date", e.target.value)}
                                        />
                                        {errors.end_date && (
                                            <p data-error className="text-[12px] text-red-500 mt-0.5">{errors.end_date}</p>
                                        )}
                                    </Field>
                                </div>

                                <Field
                                    label="Capacity"
                                    required
                                    hint="Registration closes automatically when confirmed registrants reach this number."
                                >
                                    <Input
                                        type="number"
                                        min={1}
                                        value={form.capacity}
                                        onChange={(e) => update("capacity", parseInt(e.target.value) || "")}
                                        placeholder="e.g. 50"
                                        className="max-w-[160px]"
                                    />
                                    {errors.capacity && (
                                        <p data-error className="text-[12px] text-red-500 mt-0.5">{errors.capacity}</p>
                                    )}
                                </Field>
                            </div>
                        </SectionCard>

                        {/* Payment */}
                        <SectionCard title="Payment Settings" subtitle="Toggle whether this event requires a registration fee.">
                            <div className="flex flex-col gap-5">
                                <Toggle
                                    checked={form.is_paid}
                                    onChange={(val) => update("is_paid", val)}
                                    label="This event requires payment"
                                />

                                {form.is_paid && (
                                    <div className="pl-4 border-l-2 border-emerald-100 flex flex-col gap-4 animate-in fade-in duration-200">
                                        <Field
                                            label="Payment Instructions"
                                            required
                                            hint="Displayed to students when they choose Online payment. Include GCash number, bank details, or walk-in instructions."
                                        >
                                            <Textarea
                                                rows={3}
                                                value={form.payment_instructions}
                                                onChange={(e) => update("payment_instructions", e.target.value)}
                                                placeholder="e.g. Send to GCash 0917-XXX-XXXX (Name). Use your student ID as reference."
                                            />
                                            {errors.payment_instructions && (
                                                <p data-error className="text-[12px] text-red-500 mt-0.5">
                                                    {errors.payment_instructions}
                                                </p>
                                            )}
                                        </Field>
                                    </div>
                                )}
                            </div>
                        </SectionCard>
                    </div>

                    {/* Right column — sidebar */}
                    <div className="flex flex-col gap-6">

                        {/* Status */}
                        <SectionCard title="Event Status">
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[13px] text-gray-500">Current</span>
                                    <StatusBadge status={form.status} />
                                </div>
                                <Field label="Update Status">
                                    <Select
                                        value={form.status}
                                        onChange={(e) => update("status", e.target.value)}
                                    >
                                        {STATUS_OPTIONS.map((s) => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </Select>
                                </Field>
                                <p className="text-[11px] text-gray-400 leading-relaxed">
                                    Only <strong className="font-medium text-gray-500">Open</strong> events accept new registrations.
                                    Setting to <strong className="font-medium text-gray-500">Cancelled</strong> will notify registered students.
                                </p>
                            </div>
                        </SectionCard>

                        {/* Audience */}
                        <SectionCard title="Audience" subtitle="Who is allowed to register.">
                            <div className="flex flex-col gap-2">
                                {AUDIENCE_OPTIONS.map((opt) => (
                                    <AudienceCard
                                        key={opt.value}
                                        option={opt}
                                        selected={form.audience_type === opt.value}
                                        onClick={() => update("audience_type", opt.value)}
                                    />
                                ))}
                            </div>
                        </SectionCard>

                        {/* Danger zone */}
                        <div className="bg-red-50 border border-red-100 rounded-2xl px-6 py-5">
                            <p className="text-[13px] font-semibold text-red-700 mb-1">Danger Zone</p>
                            <p className="text-[12px] text-red-400 mb-4">
                                Deleting an event is permanent and will remove all registrations. This action cannot be undone.
                            </p>
                            <button
                                type="button"
                                className="w-full h-9 text-[13px] font-semibold text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                            >
                                Delete Event
                            </button>
                        </div>

                        {/* Meta */}
                        <div className="bg-white border border-gray-100 rounded-2xl px-6 py-5">
                            <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-widest mb-3">
                                Record Info
                            </p>
                            <div className="flex flex-col gap-2">
                                {[
                                    ["Event ID", eventId],
                                    ["Host Org", "Computer Science Society"],
                                ].map(([k, v]) => (
                                    <div key={k} className="flex justify-between gap-2">
                                        <span className="text-[12px] text-gray-400">{k}</span>
                                        <span className="text-[12px] text-gray-700 font-mono truncate max-w-[120px]" title={v}>
                                            {v}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom save bar */}
                <div className="mt-8 flex items-center justify-between py-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="h-9 px-4 text-[13px] font-medium text-gray-500 hover:text-gray-800 transition-colors rounded-lg hover:bg-gray-100"
                    >
                        Discard Changes
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center gap-2 h-9 px-5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-[13px] font-semibold rounded-lg transition-colors"
                    >
                        {saving ? (
                            <>
                                <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                Saving…
                            </>
                        ) : (
                            "Save Changes"
                        )}
                    </button>
                </div>
            </main>
        </div>
    );
}