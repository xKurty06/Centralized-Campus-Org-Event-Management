'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────
type FormState = 'idle' | 'loading' | 'success' | 'error';

// ─── Password strength ────────────────────────────────────────
interface StrengthResult {
    score: number;       // 0–4
    label: string;
    color: string;
}

function getStrength(pw: string): StrengthResult {
    if (!pw) return { score: 0, label: '', color: 'var(--color-border)' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    const map: Record<number, { label: string; color: string }> = {
        1: { label: 'Weak', color: 'var(--color-error)' },
        2: { label: 'Fair', color: 'var(--color-warning)' },
        3: { label: 'Good', color: 'var(--color-info)' },
        4: { label: 'Strong', color: 'var(--color-success)' },
    };
    return { score, ...(map[score] ?? { label: 'Weak', color: 'var(--color-error)' }) };
}

// ─────────────────────────────────────────────────────────────
// Shared Icons
// ─────────────────────────────────────────────────────────────

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
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" /><circle cx="12" cy="12" r="3" />
        </svg>
    ) : (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

function LockIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
    );
}

function ShieldCheckIcon() {
    return (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-light)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 12 11 14 15 10" />
        </svg>
    );
}

function CheckCircleIcon() {
    return (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    );
}

function AlertIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: '1px' }}>
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    );
}

function ArrowLeftIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
        </svg>
    );
}

// ─────────────────────────────────────────────────────────────
// Background (same pattern as login)
// ─────────────────────────────────────────────────────────────
function BackgroundPattern() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
            <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(34,160,80,.13) 0%, transparent 70%)' }} />
            <div className="absolute -bottom-24 -left-16 w-80 h-80 rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(34,160,80,.08) 0%, transparent 70%)' }} />
            <div className="absolute inset-0" style={{
                backgroundImage: `
          linear-gradient(rgba(34,160,80,.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(34,160,80,.04) 1px, transparent 1px)
        `,
                backgroundSize: '40px 40px',
            }} />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Password Field
// ─────────────────────────────────────────────────────────────
interface PasswordFieldProps {
    id: string;
    label: string;
    value: string;
    onChange: (v: string) => void;
    disabled?: boolean;
    error?: string;
    hint?: string;
    autoComplete?: string;
}

function PasswordField({
    id, label, value, onChange, disabled, error, hint, autoComplete = 'current-password',
}: PasswordFieldProps) {
    const [show, setShow] = useState(false);

    return (
        <div className="form-group">
            <label htmlFor={id} className="form-label">{label}</label>
            <div className="input-icon-wrapper">
                <span className="input-icon-left"><LockIcon /></span>
                <input
                    id={id}
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    disabled={disabled}
                    autoComplete={autoComplete}
                    className="input-has-left-icon input-has-right-icon"
                    style={error ? { borderColor: 'var(--color-error)', boxShadow: '0 0 0 3px rgba(217,48,37,.1)' } : {}}
                />
                <button
                    type="button"
                    onClick={() => setShow(s => !s)}
                    className="input-icon-right bg-transparent border-0 p-0"
                    tabIndex={-1}
                    aria-label={show ? 'Hide password' : 'Show password'}
                >
                    <EyeIcon open={show} />
                </button>
            </div>
            {error && <p className="form-error">{error}</p>}
            {hint && !error && <p className="form-hint">{hint}</p>}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Strength Bar
// ─────────────────────────────────────────────────────────────
function StrengthBar({ password }: { password: string }) {
    const { score, label, color } = getStrength(password);
    if (!password) return null;

    return (
        <div className="flex flex-col gap-1.5 animate-fade-in">
            {/* Bar segments */}
            <div className="flex gap-1">
                {[1, 2, 3, 4].map(i => (
                    <div
                        key={i}
                        className="flex-1 h-1.5 rounded-full transition-all duration-300"
                        style={{
                            backgroundColor: i <= score ? color : 'var(--color-border)',
                        }}
                    />
                ))}
            </div>
            <p className="text-xs font-medium" style={{ color }}>
                {label} password
            </p>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Requirements Checklist
// ─────────────────────────────────────────────────────────────
function RequirementItem({ met, text }: { met: boolean; text: string }) {
    return (
        <div className="flex items-center gap-2">
            <svg
                width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke={met ? 'var(--color-success)' : 'var(--color-text-muted)'}
                strokeWidth="2.5" strokeLinecap="round"
                style={{ transition: 'stroke 200ms ease', flexShrink: 0 }}
            >
                {met
                    ? <polyline points="20 6 9 17 4 12" />
                    : <circle cx="12" cy="12" r="4" />
                }
            </svg>
            <span
                className="text-xs transition-colors duration-200"
                style={{ color: met ? 'var(--color-text-secondary)' : 'var(--color-text-muted)' }}
            >
                {text}
            </span>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Success State
// ─────────────────────────────────────────────────────────────
function SuccessView() {
    return (
        <div className="flex flex-col items-center text-center gap-5 py-4 animate-fade-in">
            <CheckCircleIcon />
            <div>
                <h2 className="text-lg font-bold mb-1.5" style={{ color: 'var(--color-text)' }}>
                    Password Updated
                </h2>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Your password has been changed successfully. Use your new password the next time you sign in.
                </p>
            </div>
            <Link
                href="/profile"
                className="btn btn-primary btn-full mt-1"
            >
                Back to Profile
            </Link>
            <Link
                href="/my-events"
                className="text-sm font-medium"
                style={{ color: 'var(--color-text-muted)' }}
            >
                Go to My Events
            </Link>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Change Password Form
// ─────────────────────────────────────────────────────────────
function ChangePasswordForm() {
    const [current, setCurrent] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirm, setConfirm] = useState('');
    const [formState, setFormState] = useState<FormState>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const strength = getStrength(newPass);

    // Per-field validation
    function validate(): boolean {
        const errs: Record<string, string> = {};

        if (!current)
            errs.current = 'Current password is required.';

        if (!newPass)
            errs.newPass = 'New password is required.';
        else if (newPass.length < 8)
            errs.newPass = 'Password must be at least 8 characters.';
        else if (newPass === current)
            errs.newPass = 'New password must differ from your current password.';

        if (!confirm)
            errs.confirm = 'Please confirm your new password.';
        else if (confirm !== newPass)
            errs.confirm = 'Passwords do not match.';

        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErrorMsg('');
        if (!validate()) return;

        setFormState('loading');

        // TODO: Replace with real API call
        // await fetch('/api/auth/change-password', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ currentPassword: current, newPassword: newPass }),
        // });

        await new Promise(r => setTimeout(r, 1400)); // placeholder delay

        // Simulate a wrong current-password error for demo — remove in production
        // setFormState('error');
        // setErrorMsg('Your current password is incorrect. Please try again.');
        // return;

        setFormState('success');
    }

    const isLoading = formState === 'loading';

    if (formState === 'success') return <SuccessView />;

    const meetsLength = newPass.length >= 8;
    const meetsUpper = /[A-Z]/.test(newPass);
    const meetsNumber = /[0-9]/.test(newPass);
    const meetsSpecial = /[^A-Za-z0-9]/.test(newPass);
    const passwordsMatch = newPass.length > 0 && confirm === newPass;

    return (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">

            {/* General error banner */}
            {errorMsg && (
                <div
                    role="alert"
                    className="flex items-start gap-2.5 px-3.5 py-3 rounded-[--radius-md] border animate-fade-in"
                    style={{ background: 'var(--color-error-light)', borderColor: 'rgba(217,48,37,.2)' }}
                >
                    <span style={{ color: 'var(--color-error)' }}><AlertIcon /></span>
                    <p className="text-sm leading-snug" style={{ color: 'var(--color-error)' }}>{errorMsg}</p>
                </div>
            )}

            {/* ── Current password ── */}
            <PasswordField
                id="current-password"
                label="Current Password"
                value={current}
                onChange={v => { setCurrent(v); setFieldErrors(fe => ({ ...fe, current: '' })); }}
                disabled={isLoading}
                error={fieldErrors.current}
                autoComplete="current-password"
            />

            <hr className="divider my-0" />

            {/* ── New password ── */}
            <PasswordField
                id="new-password"
                label="New Password"
                value={newPass}
                onChange={v => { setNewPass(v); setFieldErrors(fe => ({ ...fe, newPass: '' })); }}
                disabled={isLoading}
                error={fieldErrors.newPass}
                hint="Minimum 8 characters."
                autoComplete="new-password"
            />

            {/* Strength bar — shown only when user has started typing */}
            {newPass && <StrengthBar password={newPass} />}

            {/* ── Confirm password ── */}
            <PasswordField
                id="confirm-password"
                label="Confirm New Password"
                value={confirm}
                onChange={v => { setConfirm(v); setFieldErrors(fe => ({ ...fe, confirm: '' })); }}
                disabled={isLoading}
                error={fieldErrors.confirm}
                autoComplete="new-password"
            />

            {/* ── Requirements checklist ── */}
            {(newPass || confirm) && (
                <div
                    className="flex flex-col gap-2 px-3.5 py-3 rounded-[--radius-md] animate-fade-in"
                    style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
                >
                    <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                        Password requirements
                    </p>
                    <RequirementItem met={meetsLength} text="At least 8 characters" />
                    <RequirementItem met={meetsUpper} text="At least one uppercase letter" />
                    <RequirementItem met={meetsNumber} text="At least one number" />
                    <RequirementItem met={meetsSpecial} text="At least one special character (recommended)" />
                    {confirm.length > 0 && (
                        <RequirementItem met={passwordsMatch} text="Passwords match" />
                    )}
                </div>
            )}

            {/* ── Submit ── */}
            <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary btn-full mt-1"
                style={{ opacity: isLoading ? 0.85 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
            >
                {isLoading
                    ? <><Spinner /> Updating Password…</>
                    : <>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v14a2 2 0 01-2 2z" />
                            <polyline points="17 21 17 13 7 13 7 21" />
                            <polyline points="7 3 7 8 15 8" />
                        </svg>
                        Update Password
                    </>
                }
            </button>

            {/* ── Forgot link ── */}
            <p className="text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Forgot your current password?{' '}
                <Link href="/forgot-password" className="font-semibold" style={{ color: 'var(--color-primary-light)' }}>
                    Reset it here
                </Link>
            </p>
        </form>
    );
}

// ─────────────────────────────────────────────────────────────
// Page Root
// ─────────────────────────────────────────────────────────────
export default function ChangePasswordPage() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    return (
        <div
            className="page-shell relative flex items-center justify-center px-4 py-10"
            style={{ minHeight: '100vh' }}
        >
            <BackgroundPattern />

            <div
                className="relative z-10 w-full max-w-[440px] transition-all duration-300"
                style={{
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? 'translateY(0)' : 'translateY(12px)',
                }}
            >

                {/* ── Back link ── */}
                <div className="mb-6">
                    <Link
                        href="/profile"
                        className="inline-flex items-center gap-2 text-sm font-medium transition-colors duration-150"
                        style={{ color: 'var(--color-text-secondary)' }}
                    >
                        <ArrowLeftIcon />
                        Back to Profile
                    </Link>
                </div>

                {/* ── Brand header ── */}
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="flex items-center gap-3 mb-5">
                        <BrandLogo size={46} />
                        <div className="text-left">
                            <p className="text-lg font-bold leading-tight" style={{ color: 'var(--color-text)' }}>
                                Salikop
                            </p>
                            <p className="text-[11px] font-medium uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                                Student Events Portal
                            </p>
                        </div>
                    </div>

                    {/* Shield icon */}
                    <div
                        className="mb-4 p-3 rounded-xl"
                        style={{ background: 'var(--color-primary-muted)', border: '1px solid rgba(34,160,80,.2)' }}
                    >
                        <ShieldCheckIcon />
                    </div>

                    <h1 className="text-2xl font-bold mb-1.5" style={{ color: 'var(--color-text)' }}>
                        Change Password
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        Enter your current password to set a new one. You&apos;ll stay signed in after updating.
                    </p>
                </div>

                {/* ── Card ── */}
                <div className="card" style={{ boxShadow: 'var(--shadow-lg)' }}>

                    {/* Card header strip */}
                    <div
                        className="px-6 py-3.5 border-b flex items-center gap-2"
                        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-2)' }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-light)" strokeWidth="2.5" strokeLinecap="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0110 0v4" />
                        </svg>
                        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
                            Account Security
                        </span>
                    </div>

                    <div className="card-body">
                        <ChangePasswordForm />
                    </div>
                </div>

                {/* ── Footer ── */}
                <p className="text-center mt-5 text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                    For account recovery issues, contact your system administrator.
                </p>
                <p className="text-center mt-2.5 text-[11px] tracking-wide" style={{ color: 'gray' }}>
                    Salikop v1.0 &nbsp;·&nbsp; {new Date().getFullYear()}
                </p>
            </div>
        </div>
    );
}