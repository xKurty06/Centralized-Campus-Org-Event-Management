"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/AdminShell";

/* ================================================================
   Schema reference
   ================================================================
   Organizations   — id, name, code_name, description, logo_url,
                     adviser, founded_date, category_id,
                     accreditation_status, accredited_by, accredited_at
   Org_Officers    — id, user_id, org_id, position, is_active
   Users           — id, school_id, first_name, last_name,
                     email, course_id, dept_id, year_level, section

   API endpoints:
   POST  /api/admin/organizations
         body: { name, code_name, category_id, founded_date?,
                 description, adviser, logo_url?,
                 officers?: [{ school_id, position }] }
         → 201 { id, name, code_name }

   GET   /api/admin/users/lookup?school_id=:id
         → 200 { user_id, school_id, first_name, last_name,
                 email, course, dept, year_level, section }
         → 404 { message }
================================================================ */

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
type OrgCategory = "Academic" | "Non-Academic" | "Religious";
type FormState = "idle" | "loading" | "success" | "error";
type LookupState = "idle" | "loading" | "found" | "not_found" | "error";
type Step = 1 | 2 | 3;
const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

interface OfficerLookupResult {
    userId: string;
    schoolId: string;
    firstName: string;
    lastName: string;
    email: string;
    course: string;
    dept: string;
    yearLevel: number | string;
    section: number | string;
}

// ── NEW: a committed officer entry (looked-up + position assigned) ──
interface OfficerEntry {
    userId: string;
    schoolId: string;
    firstName: string;
    lastName: string;
    email: string;
    course: string;
    dept: string;
    yearLevel: number | string;
    section: number | string;
    position: string;
}

interface OrgForm {
    // Step 1 — Identity
    name: string;
    codeName: string;
    category: OrgCategory | "";
    foundedDate: string;
    // Step 2 — Profile
    description: string;
    adviser: string;
    logoUrl: string;
}

interface FieldError {
    [key: string]: string;
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const CATEGORY_ID_MAP: Record<OrgCategory, number> = {
    Academic: 1,
    "Non-Academic": 2,
    Religious: 3,
};

const CATEGORIES: {
    value: OrgCategory;
    label: string;
    desc: string;
    color: string;
    bg: string;
}[] = [
        {
            value: "Academic",
            label: "Academic",
            desc: "Aligned with specific academic disciplines, colleges, or programs.",
            color: "var(--color-info)",
            bg: "#eff6ff",
        },
        {
            value: "Non-Academic",
            label: "Non-Academic",
            desc: "Extracurricular and interest-based — arts, sports, student government.",
            color: "var(--color-warning)",
            bg: "#fffbeb",
        },
        {
            value: "Religious",
            label: "Religious",
            desc: "Faith-based communities and campus ministry groups.",
            color: "var(--color-primary)",
            bg: "var(--color-primary-muted)",
        },
    ];

const STEPS = [
    { num: 1 as Step, label: "Identity", short: "Basic Info" },
    { num: 2 as Step, label: "Profile Details", short: "Profile" },
    { num: 3 as Step, label: "Initial Officers", short: "Officers" },
];

const POSITIONS = [
    "President",
    "Vice President",
    "Secretary",
    "Treasurer",
    "Auditor",
    "P.R.O.",
    "Other",
];

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const initials = (f: string, l: string) =>
    ((f?.[0] || "") + (l?.[0] || "")).toUpperCase();

const fullName = (r: Pick<OfficerLookupResult, "firstName" | "lastName">) =>
    `${r.firstName} ${r.lastName}`;

// ─────────────────────────────────────────────────────────────
// Shared micro-components
// ─────────────────────────────────────────────────────────────
function Spinner({ size = 16 }: { size?: number }) {
    return (
        <svg
            className="animate-spin"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
        >
            <path
                d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83
           M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                strokeOpacity=".25"
            />
            <path d="M12 2v4" />
        </svg>
    );
}

function FieldErr({ msg }: { msg?: string }) {
    if (!msg) return null;
    return <p className="form-error animate-fade-in">{msg}</p>;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <p
            className="text-[11px] font-semibold uppercase tracking-widest mb-3"
            style={{ color: "var(--color-text-muted)" }}
        >
            {children}
        </p>
    );
}

function AlertBanner({
    msg,
    type = "error",
}: {
    msg: string;
    type?: "error" | "info";
}) {
    const isError = type === "error";
    return (
        <div
            role="alert"
            className="flex items-start gap-2.5 px-3.5 py-3 rounded-[--radius-md] border animate-fade-in"
            style={{
                background: isError
                    ? "var(--color-error-light)"
                    : "var(--color-primary-muted)",
                borderColor: isError ? "rgba(217,48,37,.15)" : "rgba(34,160,80,.2)",
            }}
        >
            <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke={isError ? "var(--color-error)" : "var(--color-primary)"}
                strokeWidth="2"
                strokeLinecap="round"
                style={{ flexShrink: 0, marginTop: "1px" }}
            >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p
                className="text-sm leading-snug"
                style={{
                    color: isError ? "var(--color-error)" : "var(--color-primary)",
                }}
            >
                {msg}
            </p>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Live Preview Card
// ─────────────────────────────────────────────────────────────
function PreviewCard({
    form,
    officers,
}: {
    form: OrgForm;
    officers: OfficerEntry[];
}) {
    const cat = CATEGORIES.find((c) => c.value === form.category);
    return (
        <div className="sticky top-24 flex flex-col gap-3">
            <div className="flex items-center gap-2">
                <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: "var(--color-primary-light)" }}
                />
                <p
                    className="text-xs font-semibold uppercase tracking-widest"
                    style={{ color: "var(--color-text-muted)" }}
                >
                    Live Preview
                </p>
            </div>

            <div
                className="card overflow-visible"
                style={{ boxShadow: "var(--shadow-md)" }}
            >
                {/* Banner */}
                <div
                    className="h-16 rounded-t-[--radius-lg]"
                    style={{
                        background:
                            "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)",
                    }}
                />

                <div className="relative px-5 pb-5">
                    {/* Logo */}
                    <div
                        className="-mt-8 w-16 h-16 rounded-[--radius-lg] border-2 border-white flex items-center justify-center overflow-hidden"
                        style={{
                            backgroundColor: form.logoUrl
                                ? "transparent"
                                : "var(--color-surface-2)",
                            boxShadow: "var(--shadow-sm)",
                        }}
                    >
                        {form.logoUrl ? (
                            <img
                                src={form.logoUrl}
                                alt="logo"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                }}
                            />
                        ) : (
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="var(--color-text-muted)"
                                strokeWidth="1.5"
                            >
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                        )}
                    </div>

                    <div className="mt-3">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <h3
                                    className="font-bold text-sm leading-tight"
                                    style={{ color: "var(--color-text)" }}
                                >
                                    {form.name || (
                                        <span style={{ color: "var(--color-text-muted)" }}>
                                            Organization Name
                                        </span>
                                    )}
                                </h3>
                            </div>
                            {cat && (
                                <span
                                    className="badge text-[10px] shrink-0 mt-0.5"
                                    style={{ background: cat.bg, color: cat.color }}
                                >
                                    {cat.label}
                                </span>
                            )}
                        </div>

                        {form.description ? (
                            <p
                                className="text-xs mt-2 line-clamp-3 leading-relaxed"
                                style={{ color: "var(--color-text-secondary)" }}
                            >
                                {form.description}
                            </p>
                        ) : (
                            <div className="mt-2 flex flex-col gap-1">
                                {[100, 90, 60].map((w, i) => (
                                    <div
                                        key={i}
                                        className="h-2 rounded-full"
                                        style={{
                                            width: `${w}%`,
                                            backgroundColor: "var(--color-surface-2)",
                                        }}
                                    />
                                ))}
                            </div>
                        )}

                        <hr className="divider" style={{ margin: "12px 0" }} />

                        <div className="flex flex-col gap-1.5">
                            {[
                                {
                                    icon: (
                                        <svg
                                            width="12"
                                            height="12"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                    ),
                                    val: form.adviser || "No adviser assigned",
                                },
                                {
                                    icon: (
                                        <svg
                                            width="12"
                                            height="12"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <rect x="3" y="4" width="18" height="18" rx="2" />
                                            <line x1="16" y1="2" x2="16" y2="6" />
                                            <line x1="8" y1="2" x2="8" y2="6" />
                                            <line x1="3" y1="10" x2="21" y2="10" />
                                        </svg>
                                    ),
                                    val: form.foundedDate
                                        ? `Est. ${new Date(form.foundedDate).getFullYear()}`
                                        : "Founded —",
                                },
                            ].map((row, i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                    <span style={{ color: "var(--color-text-muted)" }}>
                                        {row.icon}
                                    </span>
                                    <span
                                        className="text-xs"
                                        style={{
                                            color:
                                                row.val === "No adviser assigned" ||
                                                    row.val === "Founded —"
                                                    ? "var(--color-text-muted)"
                                                    : "var(--color-text-secondary)",
                                        }}
                                    >
                                        {row.val}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Officer preview in card */}
                        {officers.length > 0 && (
                            <>
                                <hr className="divider" style={{ margin: "12px 0" }} />
                                <p
                                    className="text-[10px] font-semibold uppercase tracking-widest mb-2"
                                    style={{ color: "var(--color-text-muted)" }}
                                >
                                    Officers ({officers.length})
                                </p>
                                <div className="flex flex-col gap-1.5">
                                    {officers.map((o) => (
                                        <div key={o.userId} className="flex items-center gap-2">
                                            <div
                                                className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                                                style={{
                                                    background: "var(--color-primary-light)",
                                                    color: "#fff",
                                                }}
                                            >
                                                {initials(o.firstName, o.lastName)}
                                            </div>
                                            <span
                                                className="text-xs truncate"
                                                style={{ color: "var(--color-text-secondary)" }}
                                            >
                                                {fullName(o)}
                                            </span>
                                            <span
                                                className="text-[10px] ml-auto shrink-0 px-1.5 py-0.5 rounded"
                                                style={{
                                                    background: "var(--color-primary-muted)",
                                                    color: "var(--color-primary)",
                                                }}
                                            >
                                                {o.position}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Status */}
            <div className="card" style={{ boxShadow: "none" }}>
                <div className="card-body py-3 px-4 flex items-center justify-between">
                    <span
                        className="text-xs"
                        style={{ color: "var(--color-text-secondary)" }}
                    >
                        Accreditation Status
                    </span>
                    <span className="badge badge-green">Active</span>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Step 1 — Identity
// ─────────────────────────────────────────────────────────────
function Step1({
    form,
    errors,
    onChange,
}: {
    form: OrgForm;
    errors: FieldError;
    onChange: (k: keyof OrgForm, v: string) => void;
}) {
    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            <SectionLabel>Basic Identity</SectionLabel>

            <div className="form-group">
                <label htmlFor="name" className="form-label">
                    Organization Name{" "}
                    <span style={{ color: "var(--color-error)" }}>*</span>
                </label>
                <input
                    id="name"
                    type="text"
                    placeholder="e.g. Computer Science Student Organization"
                    value={form.name}
                    onChange={(e) => onChange("name", e.target.value)}
                    maxLength={120}
                />
                <p className="form-hint">
                    Use the full official name as it appears in accreditation documents.
                </p>
                <FieldErr msg={errors.name} />
            </div>

            <div className="form-group">
                <label htmlFor="codeName" className="form-label">
                    Code Name / Acronym{" "}
                    <span style={{ color: "var(--color-error)" }}>*</span>
                </label>
                <div className="input-icon-wrapper">
                    <span className="input-icon-left">
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <polyline points="16 18 22 12 16 6" />
                            <polyline points="8 6 2 12 8 18" />
                        </svg>
                    </span>
                    <input
                        id="codeName"
                        type="text"
                        className="input-has-left-icon"
                        placeholder="e.g. ACTS"
                        value={form.codeName}
                        onChange={(e) => onChange("codeName", e.target.value.toUpperCase())}
                        maxLength={12}
                        style={{ fontFamily: "monospace", letterSpacing: "0.05em" }}
                    />
                </div>
                <p className="form-hint">
                    Unique shorthand used in badges and URL routing. Uppercase only.
                </p>
                <FieldErr msg={errors.codeName} />
            </div>

            <div className="form-group">
                <label className="form-label">
                    Organization Category{" "}
                    <span style={{ color: "var(--color-error)" }}>*</span>
                </label>
                <div className="flex flex-col gap-2.5 mt-1">
                    {CATEGORIES.map((cat) => (
                        <label
                            key={cat.value}
                            htmlFor={`cat-${cat.value}`}
                            className="flex items-start gap-3 p-4 rounded-[--radius-md] border cursor-pointer transition-all duration-150"
                            style={{
                                backgroundColor:
                                    form.category === cat.value ? cat.bg : "var(--color-surface)",
                                borderColor:
                                    form.category === cat.value
                                        ? cat.color
                                        : "var(--color-border)",
                                boxShadow:
                                    form.category === cat.value
                                        ? `0 0 0 2px ${cat.color}22`
                                        : undefined,
                            }}
                        >
                            <input
                                type="radio"
                                id={`cat-${cat.value}`}
                                name="category"
                                value={cat.value}
                                checked={form.category === cat.value}
                                onChange={() => onChange("category", cat.value)}
                                style={{
                                    width: "auto",
                                    marginTop: "2px",
                                    accentColor: cat.color,
                                }}
                            />
                            <div>
                                <p
                                    className="text-sm font-semibold"
                                    style={{
                                        color:
                                            form.category === cat.value
                                                ? cat.color
                                                : "var(--color-text)",
                                    }}
                                >
                                    {cat.label}
                                </p>
                                <p
                                    className="text-xs mt-0.5 leading-relaxed"
                                    style={{ color: "var(--color-text-muted)" }}
                                >
                                    {cat.desc}
                                </p>
                            </div>
                        </label>
                    ))}
                </div>
                <FieldErr msg={errors.category} />
            </div>

            <div className="form-group">
                <label htmlFor="foundedDate" className="form-label">
                    Founded Date
                </label>
                <div className="input-icon-wrapper">
                    <span className="input-icon-left">
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <rect x="3" y="4" width="18" height="18" rx="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                    </span>
                    <input
                        id="foundedDate"
                        type="date"
                        className="input-has-left-icon"
                        value={form.foundedDate}
                        onChange={(e) => onChange("foundedDate", e.target.value)}
                        max={new Date().toISOString().split("T")[0]}
                    />
                </div>
                <p className="form-hint">
                    Optional — records when the organization was officially established.
                </p>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Step 2 — Profile Details
// ─────────────────────────────────────────────────────────────
function Step2({
    form,
    errors,
    onChange,
    logoFileError,
    onLogoFileChange,
    selectedLogoName,
    selectedLogoSize,
    selectedLogoDimensions,
}: {
    form: OrgForm;
    errors: FieldError;
    onChange: (k: keyof OrgForm, v: string) => void;
    logoFileError: string;
    onLogoFileChange: (file: File | null) => void;
    selectedLogoName: string;
    selectedLogoSize: string;
    selectedLogoDimensions: string;
}) {
    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            <SectionLabel>Public Profile</SectionLabel>

            <div className="form-group">
                <label htmlFor="description" className="form-label">
                    Description / About Us{" "}
                    <span style={{ color: "var(--color-error)" }}>*</span>
                </label>
                <textarea
                    id="description"
                    rows={5}
                    placeholder="Describe the organization's mission, goals, and what makes it unique on campus…"
                    value={form.description}
                    onChange={(e) => onChange("description", e.target.value)}
                    style={{ resize: "vertical", minHeight: "120px" }}
                    maxLength={1000}
                />
                <div className="flex justify-between items-center mt-1">
                    <p className="form-hint">
                        This is displayed on the organization's public profile page.
                    </p>
                    <p className="form-hint">{form.description.length}/1000</p>
                </div>
                <FieldErr msg={errors.description} />
            </div>

            <div className="form-group">
                <label htmlFor="adviser" className="form-label">
                    Faculty Adviser <span style={{ color: "var(--color-error)" }}>*</span>
                </label>
                <div className="input-icon-wrapper">
                    <span className="input-icon-left">
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                    </span>
                    <input
                        id="adviser"
                        type="text"
                        className="input-has-left-icon"
                        placeholder="e.g. Prof. Maria Santos"
                        value={form.adviser}
                        onChange={(e) => onChange("adviser", e.target.value)}
                    />
                </div>
                <p className="form-hint">
                    Full name of the faculty member officially overseeing this
                    organization.
                </p>
                <FieldErr msg={errors.adviser} />
            </div>

            <div className="form-group">
                <label htmlFor="logoFile" className="form-label">
                    Organization Logo
                </label>
                <input
                    id="logoFile"
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    onChange={(e) => onLogoFileChange(e.target.files?.[0] ?? null)}
                    className="sr-only"
                />
                <label
                    htmlFor="logoFile"
                    className="mt-1 w-[180px] h-[180px] rounded-[--radius-md] border-2 border-dashed p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
                    style={{
                        borderColor: "var(--color-border)",
                        background: "var(--color-surface-2)",
                    }}
                >
                    {form.logoUrl ? (
                        <img
                            src={form.logoUrl}
                            alt="Selected organization logo"
                            className="w-full h-full object-cover rounded-[--radius-sm]"
                        />
                    ) : (
                        <>
                            <svg
                                width="26"
                                height="26"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                style={{ color: "var(--color-text-muted)" }}
                            >
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            <p
                                className="text-sm font-medium text-center"
                                style={{ color: "var(--color-text)" }}
                            >
                                Drag file here or{" "}
                                <span style={{ color: "var(--color-primary)" }}>
                                    Browse image
                                </span>
                            </p>
                            <p
                                className="text-xs text-center"
                                style={{ color: "var(--color-text-muted)" }}
                            >
                                JPG, JPEG, PNG, WEBP up to 5MB
                            </p>
                        </>
                    )}
                </label>
                <p className="form-hint">
                    Optional. Allowed: JPG, JPEG, PNG, WEBP. Max size: 5MB.
                </p>
                {selectedLogoName && (
                    <p className="form-hint">
                        Selected: <strong>{selectedLogoName}</strong>
                        {selectedLogoSize ? ` (${selectedLogoSize})` : ""}
                        {selectedLogoDimensions ? ` - ${selectedLogoDimensions}` : ""}
                    </p>
                )}
                {logoFileError && <FieldErr msg={logoFileError} />}{" "}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Officer Lookup Result Card (inline — shown before adding)
// ─────────────────────────────────────────────────────────────
function OfficerLookupCard({
    result,
    onClear,
}: {
    result: OfficerLookupResult;
    onClear: () => void;
}) {
    return (
        <div
            className="rounded-[--radius-md] p-4 flex items-center gap-3 animate-fade-in"
            style={{
                background: "var(--color-primary-muted)",
                border: "1.5px solid var(--color-primary-light)",
            }}
        >
            <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{ background: "var(--color-primary-light)", color: "#fff" }}
            >
                {initials(result.firstName, result.lastName)}
            </div>
            <div className="flex-1 min-w-0">
                <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--color-text)" }}
                >
                    {fullName(result)}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-primary)" }}>
                    {result.schoolId} · {result.course} {result.yearLevel || "?"}-
                    {result.section || "?"}
                </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 20 20"
                    style={{ color: "var(--color-primary)" }}
                >
                    <path
                        fill="currentColor"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    />
                </svg>
                <button
                    type="button"
                    onClick={onClear}
                    className="btn btn-ghost btn-sm"
                    style={{ padding: "4px", color: "var(--color-text-muted)" }}
                    title="Clear selection"
                >
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                        <path
                            d="M6 6l8 8M14 6l-8 8"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            strokeLinecap="round"
                        />
                    </svg>
                </button>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Officer Row — committed entry in the officers list
// ─────────────────────────────────────────────────────────────
function OfficerRow({
    officer,
    index,
    onRemove,
}: {
    officer: OfficerEntry;
    index: number;
    onRemove: (userId: string) => void;
}) {
    return (
        <div
            className="flex items-center gap-3 p-3 rounded-[--radius-md] border animate-fade-in"
            style={{
                backgroundColor: "var(--color-surface)",
                borderColor: "var(--color-border)",
            }}
        >
            {/* Index badge */}
            <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                style={{
                    background: "var(--color-surface-2)",
                    color: "var(--color-text-muted)",
                }}
            >
                {index + 1}
            </span>

            {/* Avatar */}
            <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: "var(--color-primary-light)", color: "#fff" }}
            >
                {initials(officer.firstName, officer.lastName)}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p
                    className="text-sm font-semibold truncate"
                    style={{ color: "var(--color-text)" }}
                >
                    {fullName(officer)}
                </p>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {officer.schoolId} · {officer.course} {officer.yearLevel || "?"}-
                    {officer.section || "?"}
                </p>
            </div>

            {/* Position badge */}
            <span
                className="text-xs px-2 py-1 rounded-full shrink-0 font-medium"
                style={{
                    background: "var(--color-primary-muted)",
                    color: "var(--color-primary)",
                    border: "1px solid rgba(34,160,80,.2)",
                }}
            >
                {officer.position}
            </span>

            {/* Remove */}
            <button
                type="button"
                onClick={() => onRemove(officer.userId)}
                className="btn btn-ghost btn-sm shrink-0"
                style={{ padding: "5px", color: "var(--color-text-muted)" }}
                title="Remove officer"
            >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                    <path
                        d="M6 6l8 8M14 6l-8 8"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                    />
                </svg>
            </button>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Step 3 — Officers (multi-add with lookup)
// ─────────────────────────────────────────────────────────────
function Step3({
    officers,
    onAddOfficer,
    onRemoveOfficer,
    errors,
}: {
    officers: OfficerEntry[];
    onAddOfficer: (result: OfficerLookupResult, position: string) => void;
    onRemoveOfficer: (userId: string) => void;
    errors: FieldError;
}) {
    // Local state for the lookup input — scoped here so adding resets the form
    const [schoolId, setSchoolId] = useState("");
    const [position, setPosition] = useState("");
    const [customPosition, setCustomPosition] = useState("");
    const [lookupState, setLookupState] = useState<LookupState>("idle");
    const [lookupResult, setLookupResult] = useState<OfficerLookupResult | null>(
        null,
    );
    const [lookupError, setLookupError] = useState("");
    const [addError, setAddError] = useState("");

    // The resolved position to store — either the selected value or the custom text
    const resolvedPosition =
        position === "Other" ? customPosition.trim() : position;

    const STUDENT_ID_PATTERN = /^\d{9}$/;
    const isSearching = lookupState === "loading";

    const handleLookup = useCallback(async () => {
        const queryId = schoolId.trim();
        if (!queryId) {
            setLookupError("Please enter a Student ID to search.");
            return;
        }
        if (!STUDENT_ID_PATTERN.test(queryId)) {
            setLookupError("Student ID must be exactly 9 digits.");
            return;
        }

        setLookupState("loading");
        setLookupError("");
        setLookupResult(null);
        setAddError("");

        try {
            const token =
                window.localStorage.getItem("auth_token") ??
                window.sessionStorage.getItem("auth_token");
            if (!token)
                throw new Error("You are not authenticated. Please sign in again.");

            const res = await fetch(
                `${API_BASE_URL}/admin/users/lookup?school_id=${encodeURIComponent(queryId)}`,
                {
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            if (!res.ok) {
                if (res.status === 401) {
                    throw new Error(
                        "Your session has expired or is invalid. Please sign in again.",
                    );
                }
                if (res.status === 403) {
                    throw new Error("You do not have permission to look up users.");
                }
                if (res.status === 404) {
                    setLookupState("not_found");
                    setLookupError("No active user found with that Student ID.");
                    return;
                }
                const errData = await res.json().catch(() => ({}));
                throw new Error(
                    errData.error ||
                    errData.message ||
                    res.statusText ||
                    "Failed to search user.",
                );
            }

            const rawData = await res.json();
            const user = rawData.data || rawData.user || rawData;

            if (!user || (!user.user_id && !user.id)) {
                throw new Error("Invalid user data received from the server.");
            }

            setLookupResult({
                userId: user.user_id || user.id,
                schoolId: user.school_id,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                course: user.course_code || user.course || "N/A",
                dept: user.dept || user.dept_id || "N/A",
                yearLevel: user.year_level || "N/A",
                section: user.section || "N/A",
            });
            setLookupState("found");
        } catch (error: any) {
            setLookupState("error");
            setLookupError(error.message || "An error occurred during lookup.");
        }
    }, [schoolId]);

    const handleClearLookup = () => {
        setLookupState("idle");
        setLookupResult(null);
        setLookupError("");
        setAddError("");
        setSchoolId("");
        setPosition("");
        setCustomPosition("");
    };

    const handleAdd = () => {
        setAddError("");

        if (!lookupResult) {
            setAddError("Look up a student first.");
            return;
        }
        if (!position) {
            setAddError("Please select a position before adding.");
            return;
        }
        if (position === "Other" && !customPosition.trim()) {
            setAddError("Please specify the custom position title.");
            return;
        }
        // Prevent duplicates by userId
        if (officers.some((o) => o.userId === lookupResult.userId)) {
            setAddError("This student is already added as an officer.");
            return;
        }
        // Prevent duplicate positions (compare against resolved value)
        if (officers.some((o) => o.position === resolvedPosition)) {
            setAddError(
                `A "${resolvedPosition}" has already been assigned. Each position can only be held by one officer.`,
            );
            return;
        }

        onAddOfficer(lookupResult, resolvedPosition);
        // Reset the lookup form for the next entry
        handleClearLookup();
    };

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            <SectionLabel>Officer Assignments</SectionLabel>

            {/* Optional notice */}
            <div
                className="flex items-start gap-3 p-4 rounded-[--radius-md] border"
                style={{
                    backgroundColor: "#eff6ff",
                    borderColor: "rgba(26,115,232,.25)",
                }}
            >
                <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--color-info)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    style={{ flexShrink: 0, marginTop: "2px" }}
                >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <div>
                    <p
                        className="text-sm font-semibold"
                        style={{ color: "var(--color-text)" }}
                    >
                        Optional Step
                    </p>
                    <p
                        className="text-xs mt-0.5 leading-relaxed"
                        style={{ color: "var(--color-text-secondary)" }}
                    >
                        Look up students by ID, assign their position, then click{" "}
                        <strong>Add Officer</strong>. You can add multiple officers. Skip
                        entirely to assign officers later from the management panel.
                    </p>
                </div>
            </div>

            {/* ── Lookup input ── */}
            <div
                className="flex flex-col gap-4 p-4 rounded-[--radius-md] border"
                style={{
                    backgroundColor: "var(--color-surface-2)",
                    borderColor: "var(--color-border)",
                }}
            >
                <p
                    className="text-xs font-semibold uppercase tracking-widest"
                    style={{ color: "var(--color-text-muted)" }}
                >
                    {officers.length === 0 ? "Add First Officer" : "Add Another Officer"}
                </p>

                {/* School ID + Lookup button */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="officerSchoolId" className="form-label">
                        Student ID
                    </label>
                    <div className="flex items-center gap-3 w-full">
                        <div className="input-icon-wrapper flex-1">
                            <span className="input-icon-left">
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <rect x="2" y="5" width="20" height="14" rx="2" />
                                    <circle cx="8" cy="12" r="2" />
                                    <path d="M14 9h4M14 12h4M14 15h2" />
                                </svg>
                            </span>
                            <input
                                id="officerSchoolId"
                                type="text"
                                inputMode="numeric"
                                pattern="\d*"
                                maxLength={9}
                                className="input-has-left-icon w-full"
                                placeholder="e.g. 202405123"
                                value={schoolId}
                                onChange={(e) => {
                                    const digits = e.target.value.replace(/\D/g, "").slice(0, 9);
                                    if (lookupState !== "idle") handleClearLookup();
                                    setSchoolId(digits);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleLookup();
                                    }
                                }}
                                disabled={isSearching}
                            />
                        </div>
                        <button
                            type="button"
                            className="btn btn-outline shrink-0 h-[42px]"
                            onClick={handleLookup}
                            disabled={isSearching || !STUDENT_ID_PATTERN.test(schoolId)}
                        >
                            {isSearching ? (
                                <>
                                    <Spinner size={14} /> Searching...
                                </>
                            ) : (
                                "Look up"
                            )}
                        </button>
                    </div>
                    <p className="form-hint mt-1">
                        Must match an existing, active user account in the system.
                    </p>

                    {lookupError && (
                        <div className="mt-2">
                            <AlertBanner msg={lookupError} type="error" />
                        </div>
                    )}
                    {lookupState === "found" && lookupResult && (
                        <div className="mt-2">
                            <OfficerLookupCard
                                result={lookupResult}
                                onClear={handleClearLookup}
                            />
                        </div>
                    )}
                </div>

                {lookupState === "found" && lookupResult && (
                    <div
                        className="form-group animate-fade-in"
                        style={{ marginBottom: 0 }}
                    >
                        <label htmlFor="officerPosition" className="form-label">
                            Position / Title{" "}
                            <span style={{ color: "var(--color-error)" }}>*</span>
                        </label>
                        <div className="input-icon-wrapper">
                            <span className="input-icon-left">
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                            </span>
                            <select
                                id="officerPosition"
                                className="input-has-left-icon w-full"
                                value={position}
                                onChange={(e) => {
                                    setPosition(e.target.value);
                                    setCustomPosition("");
                                    setAddError("");
                                }}
                            >
                                <option value="">Select a position…</option>
                                {POSITIONS.map((p) => (
                                    <option
                                        key={p}
                                        value={p}
                                        disabled={
                                            p !== "Other" && officers.some((o) => o.position === p)
                                        }
                                    >
                                        {p}
                                        {p !== "Other" && officers.some((o) => o.position === p)
                                            ? " (taken)"
                                            : ""}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Custom position input — shown only when Other is selected */}
                        {position === "Other" && (
                            <div className="mt-2 animate-fade-in">
                                <input
                                    type="text"
                                    placeholder="e.g. Sergeant-at-Arms, Historian…"
                                    value={customPosition}
                                    onChange={(e) => {
                                        setCustomPosition(e.target.value);
                                        setAddError("");
                                    }}
                                    maxLength={60}
                                    autoFocus
                                />
                                <p className="form-hint mt-1">Type the exact position title.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Add error */}
                {addError && (
                    <div className="animate-fade-in">
                        <AlertBanner msg={addError} type="error" />
                    </div>
                )}

                {/* Add Officer button */}
                {lookupState === "found" && lookupResult && (
                    <button
                        type="button"
                        className="btn btn-primary w-full animate-fade-in"
                        onClick={handleAdd}
                        disabled={
                            !position || (position === "Other" && !customPosition.trim())
                        }
                    >
                        <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                        >
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add Officer
                    </button>
                )}
            </div>

            {/* ── Committed officers list ── */}
            {officers.length > 0 && (
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <p
                            className="text-xs font-semibold"
                            style={{ color: "var(--color-text-secondary)" }}
                        >
                            Added Officers
                            <span
                                className="ml-2 px-1.5 py-0.5 rounded-full text-[10px]"
                                style={{
                                    background: "var(--color-primary-muted)",
                                    color: "var(--color-primary)",
                                }}
                            >
                                {officers.length}
                            </span>
                        </p>
                    </div>
                    {officers.map((o, i) => (
                        <OfficerRow
                            key={o.userId}
                            officer={o}
                            index={i}
                            onRemove={onRemoveOfficer}
                        />
                    ))}
                    <hr className="divider my-1" />
                </div>
            )}

            {/* Org_Officers note */}
            <div
                className="rounded-[--radius-md] border p-4"
                style={{
                    backgroundColor: "var(--color-surface-2)",
                    borderColor: "var(--color-border)",
                }}
            >
                <p
                    className="text-xs leading-relaxed"
                    style={{ color: "var(--color-text-secondary)" }}
                >
                    <strong style={{ color: "var(--color-text)" }}>How it works:</strong>{" "}
                    Officer assignments are scoped per organization via the{" "}
                    <code
                        className="px-1 py-0.5 rounded text-[11px]"
                        style={{
                            backgroundColor: "var(--color-border)",
                            color: "var(--color-text)",
                        }}
                    >
                        Org_Officers
                    </code>{" "}
                    table. A user can be an officer in one organization while remaining a
                    regular student in another. Officer access to{" "}
                    <code
                        className="px-1 py-0.5 rounded text-[11px]"
                        style={{
                            backgroundColor: "var(--color-border)",
                            color: "var(--color-text)",
                        }}
                    >
                        /manage
                    </code>{" "}
                    is activated immediately upon assignment.
                </p>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Success State
// ─────────────────────────────────────────────────────────────
function SuccessPanel({
    orgName,
    orgCode,
    officerCount,
}: {
    orgName: string;
    orgCode: string;
    officerCount: number;
}) {
    const router = useRouter();

    return (
        <div className="flex flex-col items-center text-center gap-6 py-10 animate-fade-in">
            <div className="relative">
                <div
                    className="w-20 h-20 rounded-full flex items-center justify-center animate-pulse-green"
                    style={{ backgroundColor: "var(--color-primary-muted)" }}
                >
                    <svg
                        width="36"
                        height="36"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--color-primary)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                    >
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                </div>
                <div
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center border-2 border-white"
                    style={{ backgroundColor: "var(--color-primary-light)" }}
                >
                    <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2.5"
                    >
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                    </svg>
                </div>
            </div>

            <div>
                <p
                    className="text-xs font-semibold uppercase tracking-widest mb-2"
                    style={{ color: "var(--color-primary)" }}
                >
                    Organization Created
                </p>
                <h2
                    className="text-2xl font-bold"
                    style={{ color: "var(--color-text)" }}
                >
                    {orgName}
                </h2>
                <code
                    className="text-sm mt-1 px-2 py-0.5 rounded inline-block"
                    style={{
                        backgroundColor: "var(--color-surface-2)",
                        color: "var(--color-text-secondary)",
                    }}
                >
                    {orgCode}
                </code>
            </div>

            <div
                className="w-full max-w-sm rounded-[--radius-md] border p-4 text-left"
                style={{
                    backgroundColor: "var(--color-primary-muted)",
                    borderColor: "rgba(34,160,80,.2)",
                }}
            >
                <p
                    className="text-sm font-semibold mb-2"
                    style={{ color: "var(--color-primary-dark)" }}
                >
                    Next Steps
                </p>
                <ul className="flex flex-col gap-1.5">
                    {[
                        "Organization is now Active and visible in the directory.",
                        officerCount > 0
                            ? `${officerCount} officer${officerCount > 1 ? "s" : ""} assigned and can access /manage immediately.`
                            : "Officers can be assigned from the organization's management panel.",
                        "The org can now create and publish events.",
                    ].map((item, i) => (
                        <li
                            key={i}
                            className="flex items-start gap-2 text-xs"
                            style={{ color: "var(--color-primary)" }}
                        >
                            <svg
                                width="13"
                                height="13"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                style={{ flexShrink: 0, marginTop: "2px" }}
                            >
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            {item}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="flex gap-3 flex-wrap justify-center">
                <button
                    onClick={() => router.push("/admin/organizations")}
                    className="btn btn-primary"
                >
                    View All Organizations
                </button>
                <button
                    onClick={() => window.location.reload()}
                    className="btn btn-outline"
                >
                    Create Another
                </button>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Page Root
// ─────────────────────────────────────────────────────────────
export default function AdminCreateOrganizationPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [step, setStep] = useState<Step>(1);
    const [formState, setFormState] = useState<FormState>("idle");
    const [errors, setErrors] = useState<FieldError>({});
    const [globalErr, setGlobalErr] = useState("");
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoFileError, setLogoFileError] = useState("");
    const [logoDimensions, setLogoDimensions] = useState("");
    const formTopRef = useRef<HTMLDivElement>(null);

    // ── Officers list (multi-add) ──
    const [officers, setOfficers] = useState<OfficerEntry[]>([]);

    const [form, setForm] = useState<OrgForm>({
        name: "",
        codeName: "",
        category: "",
        foundedDate: "",
        description: "",
        adviser: "",
        logoUrl: "",
    });

    useEffect(() => {
        setMounted(true);
    }, []);

    function update(key: keyof OrgForm, value: string) {
        setForm((f) => ({ ...f, [key]: value }));
        setErrors((e) => {
            const n = { ...e };
            delete n[key];
            return n;
        });
        setGlobalErr("");
    }

    function handleLogoFileChange(file: File | null) {
        setLogoFileError("");
        if (!file) {
            setLogoFile(null);
            setLogoDimensions("");
            setForm((f) => ({ ...f, logoUrl: "" }));
            return;
        }
        const allowed = ["image/jpeg", "image/png", "image/webp"];
        const extOk = /\.(jpg|jpeg|png|webp)$/i.test(file.name);
        if (!allowed.includes(file.type) || !extOk) {
            setLogoFile(null);
            setLogoDimensions("");
            setForm((f) => ({ ...f, logoUrl: "" }));
            setLogoFileError(
                "Invalid file type. Please upload JPG, JPEG, PNG, or WEBP only.",
            );
            return;
        }
        const maxBytes = 5 * 1024 * 1024;
        if (file.size > maxBytes) {
            setLogoFile(null);
            setLogoDimensions("");
            setForm((f) => ({ ...f, logoUrl: "" }));
            setLogoFileError("File is too large. Maximum allowed size is 5MB.");
            return;
        }
        setLogoFile(file);
        const previewUrl = URL.createObjectURL(file);
        setForm((f) => ({ ...f, logoUrl: previewUrl }));
        const img = new Image();
        img.onload = () => {
            setLogoDimensions(`${img.naturalWidth}x${img.naturalHeight}px`);
            URL.revokeObjectURL(previewUrl);
        };
        img.onerror = () => {
            setLogoDimensions("");
            URL.revokeObjectURL(previewUrl);
        };
        img.src = previewUrl;
    }

    // ── Officer list handlers ──
    const handleAddOfficer = useCallback(
        (result: OfficerLookupResult, position: string) => {
            setOfficers((prev) => [
                ...prev,
                {
                    userId: result.userId,
                    schoolId: result.schoolId,
                    firstName: result.firstName,
                    lastName: result.lastName,
                    email: result.email,
                    course: result.course,
                    dept: result.dept,
                    yearLevel: result.yearLevel,
                    section: result.section,
                    position,
                },
            ]);
        },
        [],
    );

    const handleRemoveOfficer = useCallback((userId: string) => {
        setOfficers((prev) => prev.filter((o) => o.userId !== userId));
    }, []);

    // ── Validation per step ──
    function validateStep(s: Step): FieldError {
        const e: FieldError = {};
        if (s === 1) {
            if (!form.name.trim()) e.name = "Organization name is required.";
            if (!form.codeName.trim())
                e.codeName = "Code name / acronym is required.";
            if (!/^[A-Z0-9]+$/.test(form.codeName) && form.codeName)
                e.codeName = "Code name must be uppercase letters and numbers only.";
            if (!form.category) e.category = "Please select a category.";
        }
        if (s === 2) {
            if (!form.description.trim() || form.description.length < 20)
                e.description = "Description must be at least 20 characters.";
            if (!form.adviser.trim()) e.adviser = "Faculty adviser name is required.";
        }
        // Step 3 has no required fields — officers are optional
        return e;
    }

    function handleNext() {
        const e = validateStep(step);
        if (Object.keys(e).length) {
            setErrors(e);
            formTopRef.current?.scrollIntoView({ behavior: "smooth" });
            return;
        }
        setErrors({});
        setStep((s) => (s < 3 ? ((s + 1) as Step) : s));
    }

    function handleBack() {
        setErrors({});
        setStep((s) => (s > 1 ? ((s - 1) as Step) : s));
    }

    async function handleSubmit() {
        const e = validateStep(3);
        if (Object.keys(e).length) {
            setErrors(e);
            return;
        }

        setFormState("loading");
        setErrors({});

        try {
            const categoryId = form.category
                ? CATEGORY_ID_MAP[form.category as OrgCategory]
                : undefined;

            const payload = new FormData();
            payload.append("name", form.name);
            payload.append("code_name", form.codeName);
            if (categoryId) payload.append("category_id", String(categoryId));
            if (form.foundedDate) payload.append("founded_date", form.foundedDate);
            payload.append("description", form.description);
            payload.append("adviser", form.adviser);
            if (logoFile) payload.append("logo_file", logoFile);
            officers.forEach((o, idx) => {
                payload.append(`officers[${idx}][school_id]`, o.schoolId);
                payload.append(`officers[${idx}][position]`, o.position);
            });

            const token =
                window.localStorage.getItem("auth_token") ??
                window.sessionStorage.getItem("auth_token");
            if (!token)
                throw new Error("You are not authenticated. Please sign in again.");

            const res = await fetch(`${API_BASE_URL}/admin/organizations`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: payload,
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(
                    data.error || data.message || "Failed to create organization",
                );
            }

            setFormState("success");
        } catch (error: any) {
            setGlobalErr(error.message || "An unexpected error occurred.");
            setFormState("error");
        }
    }

    if (!mounted) return null;

    if (formState === "success") {
        return (
            <AdminShell>
                <div className="max-w-4xl mx-auto py-8">
                    <SuccessPanel
                        orgName={form.name}
                        orgCode={form.codeName}
                        officerCount={officers.length}
                    />
                </div>
            </AdminShell>
        );
    }

    return (
        <AdminShell>
            <div className="max-w-6xl mx-auto py-6" ref={formTopRef}>
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/admin/organizations"
                        className="text-sm flex items-center gap-1 mb-3"
                        style={{ color: "var(--color-text-secondary)" }}
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Back to Organizations
                    </Link>
                    <h1
                        className="text-2xl font-bold"
                        style={{ color: "var(--color-text)" }}
                    >
                        Create Organization
                    </h1>
                    <p
                        className="text-sm mt-1"
                        style={{ color: "var(--color-text-secondary)" }}
                    >
                        Add a new organization to the campus directory.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Left Form Area */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Steps Indicator */}
                        <div className="step-indicator w-full mb-6 pt-2">
                            {STEPS.map((s, idx) => {
                                const isActive = step === s.num;
                                const isCompleted = step > s.num;
                                return (
                                    <React.Fragment key={s.num}>
                                        <div className="flex flex-col items-center relative z-10">
                                            <div
                                                className={`step-dot ${isActive ? "active" : isCompleted ? "completed" : ""}`}
                                            >
                                                {isCompleted ? (
                                                    <svg
                                                        width="14"
                                                        height="14"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="3"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    >
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                ) : (
                                                    s.num
                                                )}
                                            </div>
                                            <span
                                                className="absolute top-10 text-[11px] font-semibold tracking-wide uppercase whitespace-nowrap"
                                                style={{
                                                    color: isActive
                                                        ? "var(--color-primary-light)"
                                                        : isCompleted
                                                            ? "var(--color-text)"
                                                            : "var(--color-text-muted)",
                                                }}
                                            >
                                                {s.short}
                                                {/* Show officer count badge on step 3 label */}
                                                {s.num === 3 && officers.length > 0 && (
                                                    <span
                                                        className="ml-1 px-1 py-0.5 rounded-full text-[9px]"
                                                        style={{
                                                            background: "var(--color-primary-muted)",
                                                            color: "var(--color-primary)",
                                                        }}
                                                    >
                                                        {officers.length}
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                        {idx < STEPS.length - 1 && (
                                            <div
                                                className={`step-line mx-2 ${isCompleted ? "completed" : ""}`}
                                            />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>

                        {/* Form Panel */}
                        <div className="card mt-12">
                            <div className="card-body">
                                {globalErr && (
                                    <div
                                        className="mb-6 p-4 rounded-[--radius-md] border"
                                        style={{
                                            backgroundColor: "var(--color-error-light)",
                                            borderColor: "rgba(217,48,37,0.2)",
                                        }}
                                    >
                                        <p
                                            className="text-sm"
                                            style={{ color: "var(--color-error)" }}
                                        >
                                            {globalErr}
                                        </p>
                                    </div>
                                )}

                                {step === 1 && (
                                    <Step1 form={form} errors={errors} onChange={update} />
                                )}
                                {step === 2 && (
                                    <Step2
                                        form={form}
                                        errors={errors}
                                        onChange={update}
                                        logoFileError={logoFileError}
                                        onLogoFileChange={handleLogoFileChange}
                                        selectedLogoName={logoFile?.name ?? ""}
                                        selectedLogoSize={
                                            logoFile
                                                ? logoFile.size < 1024 * 1024
                                                    ? `${Math.max(1, Math.round(logoFile.size / 1024))} KB`
                                                    : `${(logoFile.size / (1024 * 1024)).toFixed(2)} MB`
                                                : ""
                                        }
                                        selectedLogoDimensions={logoDimensions}
                                    />
                                )}
                                {step === 3 && (
                                    <Step3
                                        officers={officers}
                                        onAddOfficer={handleAddOfficer}
                                        onRemoveOfficer={handleRemoveOfficer}
                                        errors={errors}
                                    />
                                )}

                                <hr className="divider my-6" />

                                <div className="flex justify-between items-center pt-2">
                                    <button
                                        onClick={handleBack}
                                        disabled={step === 1 || formState === "loading"}
                                        className={`btn btn-outline ${step === 1 ? "opacity-0 pointer-events-none" : ""}`}
                                    >
                                        Back
                                    </button>

                                    {step < 3 ? (
                                        <button onClick={handleNext} className="btn btn-primary">
                                            Next Step
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleSubmit}
                                            disabled={formState === "loading"}
                                            className="btn btn-primary disabled:opacity-70"
                                        >
                                            {formState === "loading" ? (
                                                <>
                                                    <Spinner /> Creating...
                                                </>
                                            ) : (
                                                "Create Organization"
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Preview Area */}
                    <div className="lg:col-span-1">
                        <PreviewCard form={form} officers={officers} />
                    </div>
                </div>
            </div>
        </AdminShell>
    );
}
