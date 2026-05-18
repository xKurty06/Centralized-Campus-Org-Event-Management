'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

// ─── Types ─────────────────────────────────────────────────────
type FormState = 'idle' | 'loading' | 'success' | 'error';
type Step = 1 | 2 | 3;

interface FormData {
    // Step 1 — Credentials
    school_id: string;
    email: string;
    password: string;
    confirm_password: string;
    // Step 2 — Identity
    first_name: string;
    last_name: string;
    dept_id: string;
    course_id: string;
    year_level: string;
    section: string;
}

// ─── Placeholder Data ──────────────────────────────────────────
// TODO: Replace with API calls to /api/departments and /api/courses
const DEPARTMENTS = [
    { id: '1', name: 'College of Arts and Sciences', code: 'CAS' },
    { id: '2', name: 'College of Engineering', code: 'COE' },
    { id: '3', name: 'College of Education', code: 'COEd' },
    { id: '4', name: 'College of Business Administration', code: 'CBA' },
    { id: '5', name: 'College of Information and Communications Technology', code: 'CICT' },
    { id: '6', name: 'College of Agriculture', code: 'CA' },
];

const COURSES_BY_DEPT: Record<string, { id: string; code: string; name: string }[]> = {
    '5': [
        { id: 'c1', code: 'BSCS', name: 'Bachelor of Science in Computer Science' },
        { id: 'c2', code: 'BSIT', name: 'Bachelor of Science in Information Technology' },
        { id: 'c3', code: 'BSCpE', name: 'Bachelor of Science in Computer Engineering' },
    ],
    '2': [
        { id: 'c4', code: 'BSCE', name: 'Bachelor of Science in Civil Engineering' },
        { id: 'c5', code: 'BSEE', name: 'Bachelor of Science in Electrical Engineering' },
        { id: 'c6', code: 'BSME', name: 'Bachelor of Science in Mechanical Engineering' },
    ],
    '1': [
        { id: 'c7', code: 'BSMATH', name: 'Bachelor of Science in Mathematics' },
        { id: 'c8', code: 'ABCOM', name: 'Bachelor of Arts in Communication' },
    ],
    '3': [
        { id: 'c9', code: 'BEED', name: 'Bachelor of Elementary Education' },
        { id: 'c10', code: 'BSED', name: 'Bachelor of Secondary Education' },
    ],
    '4': [
        { id: 'c11', code: 'BSBA', name: 'Bachelor of Science in Business Administration' },
        { id: 'c12', code: 'BSACC', name: 'Bachelor of Science in Accountancy' },
    ],
    '6': [
        { id: 'c13', code: 'BSA', name: 'Bachelor of Science in Agriculture' },
    ],
};

const SCHOOL_ID_REGEX = /^\d{4}-\d-\d{5}$/;
const EMAIL_DOMAIN = '@cvsu.edu.ph';

// ─── Helpers ──────────────────────────────────────────────────
function formatSchoolId(raw: string): string {
    const digits = raw.replace(/\D/g, '');
    if (digits.length <= 4) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 5)}-${digits.slice(5, 10)}`;
}

function passwordStrength(pw: string): { score: number; label: string; color: string } {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const map = [
        { label: '', color: 'var(--color-border)' },
        { label: 'Weak', color: 'var(--color-error)' },
        { label: 'Fair', color: 'var(--color-warning)' },
        { label: 'Good', color: 'var(--color-info)' },
        { label: 'Strong', color: 'var(--color-success)' },
    ];
    return { score, ...map[score] };
}

// ─── SVG Icons ────────────────────────────────────────────────
function BrandLogo({ size = 40 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
            <path d="M20 2L34.64 10.5V27.5L20 36L5.36 27.5V10.5L20 2Z" fill="#22a050" />
            <path d="M20 6L31.07 12.25V24.75L20 31L8.93 24.75V12.25L20 6Z" fill="#1a7a3c" />
            <path d="M14 20.5L18 24.5L26 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function EyeIcon({ open }: { open: boolean }) {
    return open ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" /><circle cx="12" cy="12" r="3" />
        </svg>
    ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
            <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
    );
}

function Spinner() {
    return (
        <svg className="animate-spin" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeOpacity=".25" />
            <path d="M12 2v4" />
        </svg>
    );
}

function BackgroundPattern() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
            <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(34,160,80,.13) 0%, transparent 70%)' }} />
            <div className="absolute -bottom-24 -left-16 w-80 h-80 rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(34,160,80,.08) 0%, transparent 70%)' }} />
            <div className="absolute inset-0" style={{
                backgroundImage: `linear-gradient(rgba(34,160,80,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(34,160,80,.04) 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
            }} />
        </div>
    );
}

// ─── Step Indicator ───────────────────────────────────────────
const STEPS = [
    { n: 1 as Step, label: 'Credentials' },
    { n: 2 as Step, label: 'Identity' },
    { n: 3 as Step, label: 'Review' },
];

function StepBar({ current }: { current: Step }) {
    return (
        <div className="flex items-center gap-0 mb-7">
            {STEPS.map((s, i) => (
                <div key={s.n} className="flex items-center" style={{ flex: i < STEPS.length - 1 ? '1' : 'none' }}>
                    {/* dot */}
                    <div className="flex flex-col items-center gap-1">
                        <div
                            className={[
                                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300',
                                current > s.n
                                    ? 'bg-[--color-primary-light] text-white border-2 border-[--color-primary-light]'
                                    : current === s.n
                                        ? 'bg-[--color-primary-light] text-white border-2 border-[--color-primary-light] shadow-[0_0_0_4px_rgba(34,160,80,.15)]'
                                        : 'bg-white border-2 border-[--color-border] text-[--color-text-muted]',
                            ].join(' ')}
                        >
                            {current > s.n ? (
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            ) : s.n}
                        </div>
                        <span
                            className="text-[10px] font-medium whitespace-nowrap"
                            style={{ color: current >= s.n ? 'var(--color-primary-light)' : 'var(--color-text-muted)' }}
                        >
                            {s.label}
                        </span>
                    </div>
                    {/* line */}
                    {i < STEPS.length - 1 && (
                        <div
                            className="flex-1 h-0.5 mb-3.5 mx-1 transition-all duration-500"
                            style={{ background: current > s.n ? 'var(--color-primary-light)' : 'var(--color-border)' }}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}

// ─── Reusable Field ───────────────────────────────────────────
function Field({ id, label, hint, error, children }: {
    id: string; label: string; hint?: string; error?: string; children: React.ReactNode;
}) {
    return (
        <div className="form-group">
            <label htmlFor={id} className="form-label">{label}</label>
            {children}
            {error && <p className="form-error">{error}</p>}
            {!error && hint && <p className="form-hint">{hint}</p>}
        </div>
    );
}

// ─── Step 1: Credentials ──────────────────────────────────────
function Step1({
    data,
    onChange,
    onNext,
}: {
    data: FormData;
    onChange: (k: keyof FormData, v: string) => void;
    onNext: () => void;
}) {
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

    const strength = passwordStrength(data.password);

    function validate(): boolean {
        const e: typeof errors = {};
        if (!SCHOOL_ID_REGEX.test(data.school_id))
            e.school_id = 'Enter a valid School ID (e.g. 2023-1-00123).';
        if (!data.email.endsWith(EMAIL_DOMAIN) || data.email === EMAIL_DOMAIN)
            e.email = `Must be a valid ${EMAIL_DOMAIN} address.`;
        if (data.password.length < 8)
            e.password = 'Password must be at least 8 characters.';
        if (data.password !== data.confirm_password)
            e.confirm_password = 'Passwords do not match.';
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    function handleNext() {
        if (validate()) onNext();
    }

    return (
        <div className="flex flex-col gap-4 animate-fade-in">
            {/* School ID */}
            <Field id="school_id" label="School ID" hint="Format: YYYYNNNNN (e.g. 202405123)" error={errors.school_id}>
                <div className="input-icon-wrapper">
                    <span className="input-icon-left">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <rect x="2" y="5" width="20" height="14" rx="2" /><circle cx="8" cy="12" r="2" /><path d="M14 9h4M14 12h4M14 15h2" />
                        </svg>
                    </span>
                    <input
                        id="school_id"
                        type="text"
                        inputMode="numeric"
                        maxLength={13}
                        placeholder="202405123"
                        value={data.school_id}
                        onChange={e => { onChange('school_id', formatSchoolId(e.target.value)); setErrors(p => ({ ...p, school_id: '' })); }}
                        className="input-has-left-icon"
                        style={errors.school_id ? { borderColor: 'var(--color-error)' } : {}}
                    />
                </div>
            </Field>

            {/* Email */}
            <Field id="email" label="Institutional Email" hint={`Must end with ${EMAIL_DOMAIN}`} error={errors.email}>
                <div className="input-icon-wrapper">
                    <span className="input-icon-left">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <polyline points="22,6 12,13 2,6" />
                        </svg>
                    </span>
                    <input
                        id="email"
                        type="email"
                        placeholder={`yourname.lastname${EMAIL_DOMAIN}`}
                        value={data.email}
                        onChange={e => { onChange('email', e.target.value); setErrors(p => ({ ...p, email: '' })); }}
                        className="input-has-left-icon"
                        style={errors.email ? { borderColor: 'var(--color-error)' } : {}}
                    />
                </div>
            </Field>

            {/* Password */}
            <Field id="password" label="Password" error={errors.password}>
                <div className="input-icon-wrapper">
                    <span className="input-icon-left">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                        </svg>
                    </span>
                    <input
                        id="password"
                        type={showPass ? 'text' : 'password'}
                        placeholder="Minimum 8 characters"
                        value={data.password}
                        onChange={e => { onChange('password', e.target.value); setErrors(p => ({ ...p, password: '' })); }}
                        className="input-has-left-icon input-has-right-icon"
                        style={errors.password ? { borderColor: 'var(--color-error)' } : {}}
                    />
                    <button type="button" className="input-icon-right" onClick={() => setShowPass(p => !p)}>
                        <EyeIcon open={showPass} />
                    </button>
                </div>
                {/* Strength bar */}
                {data.password && (
                    <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex gap-1 flex-1">
                            {[1, 2, 3, 4].map(i => (
                                <div
                                    key={i}
                                    className="h-1 flex-1 rounded-full transition-all duration-300"
                                    style={{ background: i <= strength.score ? strength.color : 'var(--color-border)' }}
                                />
                            ))}
                        </div>
                        {strength.label && (
                            <span className="text-[11px] font-medium shrink-0" style={{ color: strength.color }}>
                                {strength.label}
                            </span>
                        )}
                    </div>
                )}
            </Field>

            {/* Confirm Password */}
            <Field id="confirm_password" label="Confirm Password" error={errors.confirm_password}>
                <div className="input-icon-wrapper">
                    <span className="input-icon-left">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                        </svg>
                    </span>
                    <input
                        id="confirm_password"
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="Re-enter your password"
                        value={data.confirm_password}
                        onChange={e => { onChange('confirm_password', e.target.value); setErrors(p => ({ ...p, confirm_password: '' })); }}
                        className="input-has-left-icon input-has-right-icon"
                        style={errors.confirm_password ? { borderColor: 'var(--color-error)' } : {}}
                    />
                    <button type="button" className="input-icon-right" onClick={() => setShowConfirm(p => !p)}>
                        <EyeIcon open={showConfirm} />
                    </button>
                </div>
            </Field>

            <button type="button" className="btn btn-primary btn-full mt-2" onClick={handleNext}>
                Continue
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
            </button>
        </div>
    );
}

// ─── Step 2: Identity ─────────────────────────────────────────
function Step2({
    data,
    onChange,
    onNext,
    onBack,
}: {
    data: FormData;
    onChange: (k: keyof FormData, v: string) => void;
    onNext: () => void;
    onBack: () => void;
}) {
    const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

    const availableCourses = COURSES_BY_DEPT[data.dept_id] ?? [];

    // Reset course when dept changes
    const handleDeptChange = (val: string) => {
        onChange('dept_id', val);
        onChange('course_id', '');
    };

    function validate(): boolean {
        const e: typeof errors = {};
        if (!data.first_name.trim()) e.first_name = 'First name is required.';
        if (!data.last_name.trim()) e.last_name = 'Last name is required.';
        if (!data.dept_id) e.dept_id = 'Select a department.';
        if (!data.course_id) e.course_id = 'Select a course.';
        if (!data.year_level) e.year_level = 'Select your year level.';
        if (!data.section) e.section = 'Enter your section.';
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    function handleNext() {
        if (validate()) onNext();
    }

    return (
        <div className="flex flex-col gap-4 animate-fade-in">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
                <Field id="first_name" label="First Name" error={errors.first_name}>
                    <input
                        id="first_name"
                        type="text"
                        placeholder="Juan"
                        value={data.first_name}
                        onChange={e => { onChange('first_name', e.target.value); setErrors(p => ({ ...p, first_name: '' })); }}
                        style={errors.first_name ? { borderColor: 'var(--color-error)' } : {}}
                    />
                </Field>
                <Field id="last_name" label="Last Name" error={errors.last_name}>
                    <input
                        id="last_name"
                        type="text"
                        placeholder="Dela Cruz"
                        value={data.last_name}
                        onChange={e => { onChange('last_name', e.target.value); setErrors(p => ({ ...p, last_name: '' })); }}
                        style={errors.last_name ? { borderColor: 'var(--color-error)' } : {}}
                    />
                </Field>
            </div>

            {/* Department */}
            <Field id="dept_id" label="Department / College" error={errors.dept_id}>
                <select
                    id="dept_id"
                    value={data.dept_id}
                    onChange={e => { handleDeptChange(e.target.value); setErrors(p => ({ ...p, dept_id: '' })); }}
                    style={errors.dept_id ? { borderColor: 'var(--color-error)' } : {}}
                >
                    <option value="">Select department…</option>
                    {DEPARTMENTS.map(d => (
                        <option key={d.id} value={d.id}>{d.code} — {d.name}</option>
                    ))}
                </select>
            </Field>

            {/* Course */}
            <Field id="course_id" label="Course / Program" error={errors.course_id}>
                <select
                    id="course_id"
                    value={data.course_id}
                    disabled={!data.dept_id}
                    onChange={e => { onChange('course_id', e.target.value); setErrors(p => ({ ...p, course_id: '' })); }}
                    style={errors.course_id ? { borderColor: 'var(--color-error)' } : {}}
                >
                    <option value="">
                        {data.dept_id ? 'Select course…' : 'Select a department first'}
                    </option>
                    {availableCourses.map(c => (
                        <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                    ))}
                </select>
            </Field>

            {/* Year + Section */}
            <div className="grid grid-cols-2 gap-3">
                <Field id="year_level" label="Year Level" error={errors.year_level}>
                    <select
                        id="year_level"
                        value={data.year_level}
                        onChange={e => { onChange('year_level', e.target.value); setErrors(p => ({ ...p, year_level: '' })); }}
                        style={errors.year_level ? { borderColor: 'var(--color-error)' } : {}}
                    >
                        <option value="">Year…</option>
                        {[1, 2, 3, 4, 5].map(y => <option key={y} value={String(y)}>{y}{y === 5 ? ' (5th+)' : ''}</option>)}
                    </select>
                </Field>
                <Field id="section" label="Section" hint="e.g. 1, 2, 3" error={errors.section}>
                    <input
                        id="section"
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={20}
                        placeholder="1"
                        value={data.section}
                        onChange={e => { onChange('section', e.target.value); setErrors(p => ({ ...p, section: '' })); }}
                        style={errors.section ? { borderColor: 'var(--color-error)' } : {}}
                    />
                </Field>
            </div>

            <div className="flex gap-2 mt-2">
                <button type="button" className="btn btn-ghost" onClick={onBack} style={{ flex: '0 0 auto', padding: '10px 18px' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                    </svg>
                    Back
                </button>
                <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={handleNext}>
                    Review
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

// ─── Step 3: Review & Submit ──────────────────────────────────
function Step3({
    data,
    onBack,
    onSubmit,
    formState,
}: {
    data: FormData;
    onBack: () => void;
    onSubmit: () => void;
    formState: FormState;
}) {
    const dept = DEPARTMENTS.find(d => d.id === data.dept_id);
    const courses = COURSES_BY_DEPT[data.dept_id] ?? [];
    const course = courses.find(c => c.id === data.course_id);
    const isLoading = formState === 'loading';

    const rows = [
        { label: 'School ID', value: data.school_id },
        { label: 'Email', value: data.email },
        { label: 'Full Name', value: `${data.first_name} ${data.last_name}` },
        { label: 'Department', value: dept ? `${dept.code} — ${dept.name}` : '—' },
        { label: 'Course', value: course ? `${course.code} — ${course.name}` : '—' },
        { label: 'Year / Section', value: `Year ${data.year_level}, Section ${data.section}` },
    ];

    return (
        <div className="flex flex-col gap-4 animate-fade-in">
            {/* Info note */}
            <div
                className="flex items-start gap-2.5 px-3.5 py-3 rounded-[--radius-md] border"
                style={{ background: 'var(--color-primary-muted)', borderColor: 'rgba(34,160,80,.2)' }}
            >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: '1px' }}>
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <p className="text-xs leading-snug" style={{ color: 'var(--color-primary)' }}>
                    Please verify your details before submitting. Your <strong>name, department, and course</strong> must match your official CvSU records.
                </p>
            </div>

            {/* Summary table */}
            <div className="card" style={{ boxShadow: 'none' }}>
                <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                    {rows.map(r => (
                        <div key={r.label} className="flex gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <span className="text-xs font-medium shrink-0 w-28" style={{ color: 'var(--color-text-secondary)', paddingTop: '1px' }}>
                                {r.label}
                            </span>
                            <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                                {r.value}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex gap-2 mt-1">
                <button type="button" className="btn btn-ghost" onClick={onBack} disabled={isLoading} style={{ flex: '0 0 auto', padding: '10px 18px' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                    </svg>
                    Back
                </button>
                <button
                    type="button"
                    className="btn btn-primary"
                    style={{ flex: 1, opacity: isLoading ? 0.85 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
                    onClick={onSubmit}
                    disabled={isLoading}
                >
                    {isLoading ? <><Spinner /> Creating account…</> : <>Create Account</>}
                </button>
            </div>
        </div>
    );
}

// ─── Success Screen ───────────────────────────────────────────
function SuccessScreen({ name }: { name: string }) {
    return (
        <div className="flex flex-col items-center gap-4 py-4 text-center animate-fade-in">
            <div
                className="w-16 h-16 rounded-full flex items-center justify-center animate-pulse-green"
                style={{ background: 'var(--color-primary-muted)' }}
            >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-light)" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            </div>
            <div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Account Created!</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Welcome to Salikop, <strong>{name}</strong>.<br />
                    You can now sign in with your School ID.
                </p>
            </div>
            <Link href="/" className="btn btn-primary btn-full mt-1">
                Go to Sign In
            </Link>
        </div>
    );
}

// ─── Page Root ────────────────────────────────────────────────
const INITIAL: FormData = {
    school_id: '', email: '', password: '', confirm_password: '',
    first_name: '', last_name: '', dept_id: '', course_id: '',
    year_level: '', section: '',
};

export default function SignupPage() {
    const [mounted, setMounted] = useState(false);
    const [step, setStep] = useState<Step>(1);
    const [formData, setFormData] = useState<FormData>(INITIAL);
    const [formState, setFormState] = useState<FormState>('idle');

    useEffect(() => { setMounted(true); }, []);

    const handleChange = useCallback((k: keyof FormData, v: string) => {
        setFormData(p => ({ ...p, [k]: v }));
    }, []);

    async function handleSubmit() {
        setFormState('loading');
        // TODO: POST /api/auth/signup with formData
        await new Promise(r => setTimeout(r, 1500));
        setFormState('success');
    }

    const stepTitle: Record<Step, string> = {
        1: 'Create your account',
        2: 'Student identity',
        3: 'Review & confirm',
    };
    const stepSub: Record<Step, string> = {
        1: 'Set up your login credentials',
        2: 'Link your academic profile',
        3: 'Almost there — verify your information',
    };

    return (
        <div className="page-shell relative flex items-center justify-center px-4 py-10" style={{ minHeight: '100vh' }}>
            <BackgroundPattern />

            <div
                className="relative z-10 w-full max-w-[480px] transition-all duration-300"
                style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(12px)' }}
            >
                {/* Brand */}
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <BrandLogo size={44} />
                        <div className="text-left">
                            <p className="text-lg font-bold leading-tight" style={{ color: 'var(--color-text)' }}>Salikop</p>
                            <p className="text-[11px] font-medium uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                                Student Events Portal
                            </p>
                        </div>
                    </div>
                    {formState !== 'success' && (
                        <>
                            <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>{stepTitle[step]}</h1>
                            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{stepSub[step]}</p>
                            <div className="flex items-center justify-center gap-1.5 mt-3">
                                <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>In partnership with</span>
                                <span className="text-[11px] font-semibold" style={{ color: 'var(--color-primary-light)' }}>Dalisay</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Card */}
                <div className="card" style={{ boxShadow: 'var(--shadow-lg)' }}>
                    <div className="card-body">
                        {formState === 'success' ? (
                            <SuccessScreen name={formData.first_name} />
                        ) : (
                            <>
                                <StepBar current={step} />
                                {step === 1 && <Step1 data={formData} onChange={handleChange} onNext={() => setStep(2)} />}
                                {step === 2 && <Step2 data={formData} onChange={handleChange} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
                                {step === 3 && <Step3 data={formData} onBack={() => setStep(2)} onSubmit={handleSubmit} formState={formState} />}
                            </>
                        )}
                    </div>
                </div>

                {/* Footer */}
                {formState !== 'success' && (
                    <p className="text-center mt-5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        Already have an account?{' '}
                        <Link href="/" className="font-semibold" style={{ color: 'var(--color-primary-light)' }}>
                            Sign in
                        </Link>
                    </p>
                )}
                <p className="text-center mt-3 text-[11px] tracking-wide" style={{ color: 'gray' }}>
                    Salikop v1.0 &nbsp;·&nbsp; {new Date().getFullYear()}
                </p>
            </div>
        </div>
    );
}