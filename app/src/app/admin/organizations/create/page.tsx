'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminShell from '@/components/AdminShell'; // Adjust import path as needed

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
type OrgCategory = 'Academic' | 'Non-Academic' | 'Religious';
type FormState = 'idle' | 'loading' | 'success' | 'error';
type Step = 1 | 2 | 3;

interface OrgForm {
    // Step 1 — Identity
    name: string;
    codeName: string;
    category: OrgCategory | '';
    foundedDate: string;
    // Step 2 — Profile
    description: string;
    adviser: string;
    logoUrl: string;
    // Step 3 — Initial Officer
    officerSchoolId: string;
    officerPosition: string;
}

interface FieldError { [key: string]: string }

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const CATEGORIES: { value: OrgCategory; label: string; desc: string; color: string; bg: string }[] = [
    {
        value: 'Academic',
        label: 'Academic',
        desc: 'Aligned with specific academic disciplines, colleges, or programs.',
        color: 'var(--color-info)',
        bg: '#eff6ff',
    },
    {
        value: 'Non-Academic',
        label: 'Non-Academic',
        desc: 'Extracurricular and interest-based — arts, sports, student government.',
        color: 'var(--color-warning)',
        bg: '#fffbeb',
    },
    {
        value: 'Religious',
        label: 'Religious',
        desc: 'Faith-based communities and campus ministry groups.',
        color: 'var(--color-primary)',
        bg: 'var(--color-primary-muted)',
    },
];

const STEPS = [
    { num: 1 as Step, label: 'Identity', short: 'Basic Info' },
    { num: 2 as Step, label: 'Profile Details', short: 'Profile' },
    { num: 3 as Step, label: 'Initial Officer', short: 'Officer' },
];

// ─────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────

function Spinner() {
    return (
        <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeOpacity=".25" />
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
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>
            {children}
        </p>
    );
}

// ─────────────────────────────────────────────────────────────
// Live Preview Card
// ─────────────────────────────────────────────────────────────
function PreviewCard({ form }: { form: OrgForm }) {
    const cat = CATEGORIES.find(c => c.value === form.category);

    return (
        <div className="sticky top-24 flex flex-col gap-3">
            {/* Label */}
            <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-primary-light)' }} />
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                    Live Preview
                </p>
            </div>

            {/* Card */}
            <div className="card overflow-visible">
                {/* Banner accent */}
                <div className="h-16 rounded-t-[--radius-lg]" style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)' }} />

                {/* Logo bubble */}
                <div className="relative px-5 pb-5">
                    <div className="-mt-8 w-16 h-16 rounded-[--radius-lg] border-2 border-white flex items-center justify-center shadow-md overflow-hidden"
                        style={{ backgroundColor: form.logoUrl ? 'transparent' : 'var(--color-surface-2)', boxShadow: 'var(--shadow-sm)' }}>
                        {form.logoUrl ? (
                            <img src={form.logoUrl} alt="logo" className="w-full h-full object-cover" />
                        ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                        )}
                    </div>

                    <div className="mt-3">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <h3 className="font-bold text-sm leading-tight" style={{ color: 'var(--color-text)' }}>
                                    {form.name || <span style={{ color: 'var(--color-text-muted)' }}>Organization Name</span>}
                                </h3>
                                {form.codeName && (
                                    <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                                        {form.codeName}
                                    </p>
                                )}
                            </div>
                            {cat && (
                                <span className="badge text-[10px] shrink-0 mt-0.5" style={{ background: cat.bg, color: cat.color }}>
                                    {cat.label}
                                </span>
                            )}
                        </div>

                        {form.description ? (
                            <p className="text-xs mt-2 line-clamp-3 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                                {form.description}
                            </p>
                        ) : (
                            <div className="mt-2 flex flex-col gap-1">
                                {[100, 90, 60].map((w, i) => (
                                    <div key={i} className="h-2 rounded-full" style={{ width: `${w}%`, backgroundColor: 'var(--color-surface-2)' }} />
                                ))}
                            </div>
                        )}

                        <hr className="divider" style={{ margin: '12px 0' }} />

                        <div className="flex flex-col gap-1.5">
                            {[
                                {
                                    icon: (
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
                                        </svg>
                                    ),
                                    val: form.adviser || 'No adviser assigned',
                                },
                                {
                                    icon: (
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
                                            <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                                        </svg>
                                    ),
                                    val: form.foundedDate ? `Est. ${new Date(form.foundedDate).getFullYear()}` : 'Founded —',
                                },
                            ].map((row, i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                    <span style={{ color: 'var(--color-text-muted)' }}>{row.icon}</span>
                                    <span className="text-xs" style={{ color: row.val.startsWith('No') || row.val === 'Founded —' ? 'var(--color-text-muted)' : 'var(--color-text-secondary)' }}>
                                        {row.val}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Accreditation badge preview */}
            <div className="card" style={{ boxShadow: 'none' }}>
                <div className="card-body py-3 px-4 flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Accreditation Status</span>
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
    form, errors, onChange,
}: {
    form: OrgForm;
    errors: FieldError;
    onChange: (k: keyof OrgForm, v: string) => void;
}) {
    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            <SectionLabel>Basic Identity</SectionLabel>

            {/* Name */}
            <div className="form-group">
                <label htmlFor="name" className="form-label">
                    Organization Name <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <input
                    id="name"
                    type="text"
                    placeholder="e.g. Association of Computer Technology Students"
                    value={form.name}
                    onChange={e => onChange('name', e.target.value)}
                    maxLength={120}
                />
                <p className="form-hint">Use the full official name as it appears in accreditation documents.</p>
                <FieldErr msg={errors.name} />
            </div>

            {/* Code Name */}
            <div className="form-group">
                <label htmlFor="codeName" className="form-label">
                    Code Name / Acronym <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <div className="input-icon-wrapper">
                    <span className="input-icon-left">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
                        </svg>
                    </span>
                    <input
                        id="codeName"
                        type="text"
                        className="input-has-left-icon"
                        placeholder="e.g. ACTS"
                        value={form.codeName}
                        onChange={e => onChange('codeName', e.target.value.toUpperCase())}
                        maxLength={12}
                        style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}
                    />
                </div>
                <p className="form-hint">Unique shorthand used in badges and URL routing. Uppercase only.</p>
                <FieldErr msg={errors.codeName} />
            </div>

            {/* Category */}
            <div className="form-group">
                <label className="form-label">
                    Organization Category <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <div className="flex flex-col gap-2.5 mt-1">
                    {CATEGORIES.map(cat => (
                        <label
                            key={cat.value}
                            htmlFor={`cat-${cat.value}`}
                            className="flex items-start gap-3 p-4 rounded-[--radius-md] border cursor-pointer transition-all duration-150"
                            style={{
                                backgroundColor: form.category === cat.value ? cat.bg : 'var(--color-surface)',
                                borderColor: form.category === cat.value ? cat.color : 'var(--color-border)',
                                boxShadow: form.category === cat.value ? `0 0 0 2px ${cat.color}22` : undefined,
                            }}
                        >
                            <input
                                type="radio"
                                id={`cat-${cat.value}`}
                                name="category"
                                value={cat.value}
                                checked={form.category === cat.value}
                                onChange={() => onChange('category', cat.value)}
                                style={{ width: 'auto', marginTop: '2px', accentColor: cat.color }}
                            />
                            <div>
                                <p className="text-sm font-semibold" style={{ color: form.category === cat.value ? cat.color : 'var(--color-text)' }}>
                                    {cat.label}
                                </p>
                                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{cat.desc}</p>
                            </div>
                        </label>
                    ))}
                </div>
                <FieldErr msg={errors.category} />
            </div>

            {/* Founded Date */}
            <div className="form-group">
                <label htmlFor="foundedDate" className="form-label">Founded Date</label>
                <div className="input-icon-wrapper">
                    <span className="input-icon-left">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" />
                            <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                    </span>
                    <input
                        id="foundedDate"
                        type="date"
                        className="input-has-left-icon"
                        value={form.foundedDate}
                        onChange={e => onChange('foundedDate', e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                    />
                </div>
                <p className="form-hint">Optional — records when the organization was officially established.</p>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Step 2 — Profile Details
// ─────────────────────────────────────────────────────────────
function Step2({
    form, errors, onChange,
}: {
    form: OrgForm;
    errors: FieldError;
    onChange: (k: keyof OrgForm, v: string) => void;
}) {
    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            <SectionLabel>Public Profile</SectionLabel>

            {/* Description */}
            <div className="form-group">
                <label htmlFor="description" className="form-label">
                    Description / About Us <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <textarea
                    id="description"
                    rows={5}
                    placeholder="Describe the organization's mission, goals, and what makes it unique on campus…"
                    value={form.description}
                    onChange={e => onChange('description', e.target.value)}
                    style={{ resize: 'vertical', minHeight: '120px' }}
                    maxLength={1000}
                />
                <div className="flex justify-between items-center mt-1">
                    <p className="form-hint">This is displayed on the organization's public profile page.</p>
                    <p className="form-hint">{form.description.length}/1000</p>
                </div>
                <FieldErr msg={errors.description} />
            </div>

            {/* Adviser */}
            <div className="form-group">
                <label htmlFor="adviser" className="form-label">
                    Faculty Adviser <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <div className="input-icon-wrapper">
                    <span className="input-icon-left">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
                        </svg>
                    </span>
                    <input
                        id="adviser"
                        type="text"
                        className="input-has-left-icon"
                        placeholder="e.g. Prof. Maria Santos"
                        value={form.adviser}
                        onChange={e => onChange('adviser', e.target.value)}
                    />
                </div>
                <p className="form-hint">Full name of the faculty member officially overseeing this organization.</p>
                <FieldErr msg={errors.adviser} />
            </div>

            {/* Logo URL */}
            <div className="form-group">
                <label htmlFor="logoUrl" className="form-label">Logo URL</label>
                <div className="input-icon-wrapper">
                    <span className="input-icon-left">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                        </svg>
                    </span>
                    <input
                        id="logoUrl"
                        type="url"
                        className="input-has-left-icon"
                        placeholder="https://example.com/logo.png"
                        value={form.logoUrl}
                        onChange={e => onChange('logoUrl', e.target.value)}
                    />
                </div>
                <p className="form-hint">Optional. Enter a publicly accessible image URL for the organization logo. A default will be used if left blank.</p>

                {/* Logo preview */}
                {form.logoUrl && (
                    <div className="mt-2 flex items-center gap-3 p-3 rounded-[--radius-md] border animate-fade-in" style={{ backgroundColor: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}>
                        <div className="w-10 h-10 rounded-[--radius-md] overflow-hidden border shrink-0" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                            <img
                                src={form.logoUrl}
                                alt="preview"
                                className="w-full h-full object-cover"
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                        </div>
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Logo preview (check the Live Preview card)</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Step 3 — Initial Officer
// ─────────────────────────────────────────────────────────────
function Step3({
    form, errors, onChange,
}: {
    form: OrgForm;
    errors: FieldError;
    onChange: (k: keyof OrgForm, v: string) => void;
}) {
    const POSITIONS = ['President', 'Vice President', 'Secretary', 'Treasurer', 'Auditor', 'P.R.O.', 'Other'];

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            <SectionLabel>Initial Officer Assignment</SectionLabel>

            {/* Info notice */}
            <div className="flex items-start gap-3 p-4 rounded-[--radius-md] border" style={{ backgroundColor: '#eff6ff', borderColor: 'var(--color-info)' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-info)" strokeWidth="2"
                    strokeLinecap="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Optional Step</p>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                        You can assign the initial officer now by providing their School ID, or skip this step and assign officers later from the organization's management panel.
                    </p>
                </div>
            </div>

            {/* School ID */}
            <div className="form-group">
                <label htmlFor="officerSchoolId" className="form-label">Officer School ID</label>
                <div className="input-icon-wrapper">
                    <span className="input-icon-left">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="5" width="20" height="14" rx="2" /><circle cx="8" cy="12" r="2" />
                            <path d="M14 9h4M14 12h4M14 15h2" />
                        </svg>
                    </span>
                    <input
                        id="officerSchoolId"
                        type="text"
                        className="input-has-left-icon"
                        placeholder="e.g. 202405123"
                        value={form.officerSchoolId}
                        onChange={e => onChange('officerSchoolId', e.target.value)}
                    />
                </div>
                <p className="form-hint">Must match an existing, active user account in the system.</p>
                <FieldErr msg={errors.officerSchoolId} />
            </div>

            {/* Position */}
            <div className="form-group">
                <label htmlFor="officerPosition" className="form-label">Position / Title</label>
                <div className="input-icon-wrapper">
                    <span className="input-icon-left">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                    </span>
                    <select
                        id="officerPosition"
                        className="input-has-left-icon"
                        value={form.officerPosition}
                        onChange={e => onChange('officerPosition', e.target.value)}
                    >
                        <option value="">Select a position…</option>
                        {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                <FieldErr msg={errors.officerPosition} />
            </div>

            {/* Org_Officers note */}
            <div className="rounded-[--radius-md] border p-4" style={{ backgroundColor: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    <strong style={{ color: 'var(--color-text)' }}>How it works:</strong> Officer assignments are scoped per organization via the{' '}
                    <code className="px-1 py-0.5 rounded text-[11px]" style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                        Org_Officers
                    </code>{' '}
                    table. A user can be an officer in one organization while remaining a regular student in another. Officer access to{' '}
                    <code className="px-1 py-0.5 rounded text-[11px]" style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                        /manage
                    </code>{' '}
                    is activated immediately upon assignment.
                </p>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Success State
// ─────────────────────────────────────────────────────────────
function SuccessPanel({ orgName, orgCode }: { orgName: string; orgCode: string }) {
    const router = useRouter();

    return (
        <div className="flex flex-col items-center text-center gap-6 py-10 animate-fade-in">
            {/* Icon */}
            <div className="relative">
                <div className="w-20 h-20 rounded-full flex items-center justify-center animate-pulse-green" style={{ backgroundColor: 'var(--color-primary-muted)' }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                </div>
                {/* Badge */}
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center border-2 border-white" style={{ backgroundColor: 'var(--color-primary-light)' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                    </svg>
                </div>
            </div>

            <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--color-primary)' }}>
                    Organization Created
                </p>
                <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{orgName}</h2>
                <code className="text-sm mt-1 px-2 py-0.5 rounded inline-block" style={{ backgroundColor: 'var(--color-surface-2)', color: 'var(--color-text-secondary)' }}>
                    {orgCode}
                </code>
            </div>

            <div className="w-full max-w-sm rounded-[--radius-md] border p-4 text-left" style={{ backgroundColor: 'var(--color-primary-muted)', borderColor: 'rgba(34,160,80,.2)' }}>
                <p className="text-sm font-semibold mb-2" style={{ color: 'var(--color-primary-dark)' }}>Next Steps</p>
                <ul className="flex flex-col gap-1.5">
                    {[
                        'Organization is now Active and visible in the directory.',
                        'Officers can log in and access /manage immediately.',
                        'The org can now create and publish events.',
                    ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--color-primary)' }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                                strokeLinecap="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            {item}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="flex gap-3 flex-wrap justify-center">
                <button
                    onClick={() => router.push('/admin/organizations')}
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
    const [formState, setFormState] = useState<FormState>('idle');
    const [errors, setErrors] = useState<FieldError>({});
    const [globalErr, setGlobalErr] = useState('');
    const formTopRef = useRef<HTMLDivElement>(null);

    const [form, setForm] = useState<OrgForm>({
        name: '', codeName: '', category: '', foundedDate: '',
        description: '', adviser: '', logoUrl: '',
        officerSchoolId: '', officerPosition: '',
    });

    useEffect(() => { setMounted(true); }, []);

    function update(key: keyof OrgForm, value: string) {
        setForm(f => ({ ...f, [key]: value }));
        setErrors(e => { const n = { ...e }; delete n[key]; return n; });
        setGlobalErr('');
    }

    // ── Validation per step ──
    function validateStep(s: Step): FieldError {
        const e: FieldError = {};
        if (s === 1) {
            if (!form.name.trim()) e.name = 'Organization name is required.';
            if (!form.codeName.trim()) e.codeName = 'Code name / acronym is required.';
            if (!/^[A-Z0-9]+$/.test(form.codeName) && form.codeName)
                e.codeName = 'Code name must be uppercase letters and numbers only.';
            if (!form.category) e.category = 'Please select a category.';
        }
        if (s === 2) {
            if (!form.description.trim() || form.description.length < 20)
                e.description = 'Description must be at least 20 characters.';
            if (!form.adviser.trim()) e.adviser = 'Faculty adviser name is required.';
        }
        if (s === 3) {
            // Officer is optional — but if they filled one field, validate both
            if (form.officerSchoolId && !form.officerPosition)
                e.officerPosition = 'Please select a position for this officer.';
            if (form.officerPosition && !form.officerSchoolId)
                e.officerSchoolId = 'Please enter the officer\'s School ID.';
        }
        return e;
    }

    function handleNext() {
        const e = validateStep(step);
        if (Object.keys(e).length) { setErrors(e); formTopRef.current?.scrollIntoView({ behavior: 'smooth' }); return; }
        setErrors({});
        setStep(s => (s < 3 ? (s + 1) as Step : s));
    }

    function handleBack() {
        setErrors({});
        setStep(s => (s > 1 ? (s - 1) as Step : s));
    }

    async function handleSubmit() {
        const e = validateStep(3);
        if (Object.keys(e).length) {
            setErrors(e);
            return;
        }

        setFormState('loading');
        setErrors({});

        try {
            // Example API route invocation
            const res = await fetch('/api/admin/organizations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to create organization');
            }

            setFormState('success');
        } catch (error: any) {
            setGlobalErr(error.message || 'An unexpected error occurred.');
            setFormState('error');
        }
    }

    if (!mounted) return null;

    if (formState === 'success') {
        return (
            <AdminShell>
                <div className="max-w-4xl mx-auto py-8">
                    <SuccessPanel orgName={form.name} orgCode={form.codeName} />
                </div>
            </AdminShell>
        );
    }

    return (
        <AdminShell>
            <div className="max-w-full mx-auto py-6" ref={formTopRef}>

                {/* Header */}
                <div className="mb-8">
                    <Link href="/admin/organizations" className="text-sm flex items-center gap-1 mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Back to Organizations
                    </Link>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Create Organization</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Add a new organization to the campus directory.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Left Form Area */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Steps Indicator using Design Tokens from globals.css */}
                        <div className="step-indicator w-full mb-6 pt-2 px-4 flex items-center">
                            {STEPS.map((s, idx) => {
                                const isActive = step === s.num;
                                const isCompleted = step > s.num;
                                return (
                                    <React.Fragment key={s.num}>
                                        <div className="flex flex-col items-center relative z-10">
                                            <div className={`step-dot ${isActive ? 'active' : isCompleted ? 'completed' : ''}`}>
                                                {isCompleted ? (
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                ) : (
                                                    s.num
                                                )}
                                            </div>
                                            <span className="absolute top-10 text-[11px] font-semibold tracking-wide uppercase whitespace-nowrap"
                                                style={{ color: isActive ? 'var(--color-primary-light)' : isCompleted ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
                                                {s.short}
                                            </span>
                                        </div>
                                        {idx < STEPS.length - 1 && (
                                            <div className={`step-line mx-2 ${isCompleted ? 'completed' : ''}`} />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>

                        {/* Form Panel */}
                        <div className="card mt-12">
                            <div className="card-body">
                                {globalErr && (
                                    <div className="mb-6 p-4 rounded-[--radius-md] border" style={{ backgroundColor: 'var(--color-error-light)', borderColor: 'rgba(217,48,37,0.2)' }}>
                                        <p className="text-sm" style={{ color: 'var(--color-error)' }}>{globalErr}</p>
                                    </div>
                                )}

                                {step === 1 && <Step1 form={form} errors={errors} onChange={update} />}
                                {step === 2 && <Step2 form={form} errors={errors} onChange={update} />}
                                {step === 3 && <Step3 form={form} errors={errors} onChange={update} />}

                                <hr className="divider my-6" />

                                <div className="flex justify-between items-center pt-2">
                                    <button
                                        onClick={handleBack}
                                        disabled={step === 1 || formState === 'loading'}
                                        className={`btn btn-outline ${step === 1 ? 'opacity-0 pointer-events-none' : ''}`}
                                    >
                                        Back
                                    </button>

                                    {step < 3 ? (
                                        <button
                                            onClick={handleNext}
                                            className="btn btn-primary"
                                        >
                                            Next Step
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleSubmit}
                                            disabled={formState === 'loading'}
                                            className="btn btn-primary disabled:opacity-70"
                                        >
                                            {formState === 'loading' ? (
                                                <>
                                                    <Spinner /> Creating...
                                                </>
                                            ) : 'Create Organization'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Preview Area */}
                    <div className="lg:col-span-1">
                        <PreviewCard form={form} />
                    </div>
                </div>
            </div>
        </AdminShell>
    );
}