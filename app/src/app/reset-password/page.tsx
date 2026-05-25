'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { APP_VERSION_LABEL } from '@/components/appVersion';

// ─── Types ────────────────────────────────────────────────────
type FormState = 'idle' | 'loading' | 'error' | 'success';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v1';
const RESET_VERIFIED_KEY = 'password_reset_verified';
const OTP_STORAGE_KEY = 'password_reset_otp';
const RESET_EMAIL_KEY = 'password_reset_email';

// ─────────────────────────────────────────────────────────────
// Shared sub-components
// ─────────────────────────────────────────────────────────────

function BrandLogo({ size = 40 }: { size?: number }) {
    return (
        <img
            src="/Salikop_logo.png"
            alt="Salikop logo"
            width={size}
            height={size}
            className="object-contain"
        />
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
                backgroundImage: `
          linear-gradient(rgba(34,160,80,.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(34,160,80,.04) 1px, transparent 1px)
        `,
                backgroundSize: '40px 40px',
            }} />
        </div>
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

// ─────────────────────────────────────────────────────────────
// Password strength meter
// ─────────────────────────────────────────────────────────────
function getStrength(pw: string): { score: number; label: string; color: string } {
    if (!pw) return { score: 0, label: '', color: 'var(--color-border)' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    const levels = [
        { label: 'Too short', color: 'var(--color-error)' },
        { label: 'Weak', color: 'var(--color-error)' },
        { label: 'Fair', color: 'var(--color-warning)' },
        { label: 'Good', color: '#84cc16' },
        { label: 'Strong', color: 'var(--color-success)' },
    ];
    return { score, ...levels[score] };
}

function StrengthBar({ password }: { password: string }) {
    const { score, label, color } = getStrength(password);
    if (!password) return null;

    return (
        <div className="flex flex-col gap-1.5 mt-1 animate-fade-in">
            <div className="flex gap-1">
                {[1, 2, 3, 4].map(i => (
                    <div
                        key={i}
                        style={{
                            flex: 1,
                            height: '4px',
                            borderRadius: '999px',
                            background: i <= score ? color : 'var(--color-border)',
                            transition: 'background 200ms ease',
                        }}
                    />
                ))}
            </div>
            <p className="text-xs font-medium" style={{ color }}>{label}</p>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────
function validatePassword(pw: string): string | null {
    if (!pw) return 'Password is required.';
    if (pw.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(pw)) return 'Include at least one uppercase letter.';
    if (!/[0-9]/.test(pw)) return 'Include at least one number.';
    return null;
}

// ─────────────────────────────────────────────────────────────
// Success state
// ─────────────────────────────────────────────────────────────
function SuccessState({ countdown }: { countdown: number }) {
    return (
        <div className="flex flex-col items-center gap-4 py-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full flex items-center justify-center animate-pulse-green"
                style={{ background: 'var(--color-primary-muted)' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            </div>
            <div className="text-center">
                <p className="font-semibold text-base" style={{ color: 'var(--color-text)' }}>Password Reset!</p>
                <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Your password has been updated. Redirecting to login in <strong>{countdown}s</strong>…
                </p>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Page Root
// ─────────────────────────────────────────────────────────────
export default function ResetPasswordPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [formState, setFormState] = useState<FormState>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [countdown, setCountdown] = useState(3);

    useEffect(() => { setMounted(true); }, []);
    useEffect(() => {
        const isVerified = sessionStorage.getItem(RESET_VERIFIED_KEY) === 'true';
        if (!isVerified) {
            router.replace('/forgot-password');
        }
    }, [router]);

    // Countdown after success
    useEffect(() => {
        if (formState !== 'success') return;
        if (countdown <= 0) { router.push('/'); return; }
        const t = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [formState, countdown, router]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErrorMsg('');

        const pwErr = validatePassword(newPass);
        if (pwErr) { setErrorMsg(pwErr); return; }
        if (newPass !== confirmPass) { setErrorMsg('Passwords do not match.'); return; }

        setFormState('loading');
        const otp = sessionStorage.getItem(OTP_STORAGE_KEY);
        const email = sessionStorage.getItem(RESET_EMAIL_KEY);
        if (!otp || !email) {
            setFormState('error');
            setErrorMsg('Reset session expired. Please request a new OTP.');
            return;
        }

        const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
                email,
                token: otp,
                password: newPass,
                password_confirmation: confirmPass,
            }),
        }).catch(() => null);
        const payload = await res?.json().catch(() => null) as { success?: boolean; error?: string } | null;
        if (!res || !res.ok || !payload?.success) {
            setFormState('error');
            setErrorMsg(payload?.error ?? 'Unable to reset password right now.');
            return;
        }
        sessionStorage.removeItem(RESET_VERIFIED_KEY);
        sessionStorage.removeItem(OTP_STORAGE_KEY);
        sessionStorage.removeItem(RESET_EMAIL_KEY);
        setFormState('success');
    }

    const isLoading = formState === 'loading';
    const isSuccess = formState === 'success';

    return (
        <div className="page-shell relative flex items-center justify-center px-4 py-8" style={{ minHeight: '100vh' }}>
            <BackgroundPattern />

            <div
                className="relative z-10 w-full max-w-[440px] transition-all duration-300"
                style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(12px)' }}
            >
                {/* ── Brand ── */}
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="flex items-center gap-3 mb-5">
                        <BrandLogo size={46} />
                        <div className="text-left">
                            <p className="text-lg font-bold leading-tight" style={{ color: 'var(--color-text)' }}>Salikop</p>
                            <p className="text-[11px] font-medium uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                                Student Events Portal
                            </p>
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold mb-1.5" style={{ color: 'var(--color-text)' }}>
                        {isSuccess ? 'All Done!' : 'Reset Password'}
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {isSuccess ? 'You can now sign in with your new password' : 'Create a new secure password for your account'}
                    </p>
                </div>

                {/* ── Step indicator ── */}
                <div className="flex items-center mb-6 px-2">
                    {[
                        { num: 1, label: 'Enter Email' },
                        null,
                        { num: 2, label: 'Verify OTP' },
                        null,
                        { num: 3, label: 'Reset Password' },
                    ].map((item, i) => {
                        if (item === null) {
                            return <div key={i} className="step-line flex-1 completed" />;
                        }
                        return (
                            <div key={i} className="flex flex-col items-center gap-1">
                                <div className={`step-dot ${item.num === 3 && !isSuccess ? 'active' : 'completed'}`}>
                                    {(item.num < 3 || isSuccess)
                                        ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                                        : item.num
                                    }
                                </div>
                                <span className="text-[10px] whitespace-nowrap"
                                    style={{ color: item.num === 3 ? 'var(--color-primary-light)' : 'var(--color-text-muted)' }}>
                                    {item.label}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* ── Card ── */}
                <div className="card" style={{ boxShadow: 'var(--shadow-lg)' }}>
                    <div className="card-body">
                        {isSuccess ? (
                            <SuccessState countdown={countdown} />
                        ) : (
                            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">

                                {/* Error banner */}
                                {errorMsg && (
                                    <div role="alert" className="flex items-start gap-2.5 px-3.5 py-3 rounded-[--radius-md] border animate-fade-in"
                                        style={{ background: 'var(--color-error-light)', borderColor: 'rgba(217,48,37,.15)' }}>
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" strokeWidth="2"
                                            strokeLinecap="round" style={{ flexShrink: 0, marginTop: '1px' }}>
                                            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                                        </svg>
                                        <p className="text-sm leading-snug" style={{ color: 'var(--color-error)' }}>{errorMsg}</p>
                                    </div>
                                )}

                                {/* Requirements hint */}
                                <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-[--radius-md] border"
                                    style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)"
                                        strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: '1px' }}>
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="16" x2="12" y2="12" />
                                        <line x1="12" y1="8" x2="12.01" y2="8" />
                                    </svg>
                                    <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                                        Minimum 8 characters &nbsp;·&nbsp; At least one uppercase letter &nbsp;·&nbsp; At least one number
                                    </p>
                                </div>

                                {/* New Password */}
                                <div className="form-group">
                                    <label htmlFor="newPass" className="form-label">New Password</label>
                                    <div className="input-icon-wrapper">
                                        <span className="input-icon-left">
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                <path d="M7 11V7a5 5 0 0110 0v4" />
                                            </svg>
                                        </span>
                                        <input
                                            id="newPass"
                                            type={showNew ? 'text' : 'password'}
                                            className="input-has-left-icon input-has-right-icon"
                                            placeholder="Enter new password"
                                            value={newPass}
                                            onChange={e => { setNewPass(e.target.value); setErrorMsg(''); }}
                                            disabled={isLoading}
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            className="input-icon-right bg-transparent border-none p-0"
                                            onClick={() => setShowNew(v => !v)}
                                            aria-label={showNew ? 'Hide password' : 'Show password'}
                                        >
                                            <EyeIcon open={showNew} />
                                        </button>
                                    </div>
                                    <StrengthBar password={newPass} />
                                </div>

                                {/* Confirm Password */}
                                <div className="form-group">
                                    <label htmlFor="confirmPass" className="form-label">Confirm New Password</label>
                                    <div className="input-icon-wrapper">
                                        <span className="input-icon-left">
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                <path d="M7 11V7a5 5 0 0110 0v4" />
                                            </svg>
                                        </span>
                                        <input
                                            id="confirmPass"
                                            type={showConfirm ? 'text' : 'password'}
                                            className="input-has-left-icon input-has-right-icon"
                                            placeholder="Re-enter new password"
                                            value={confirmPass}
                                            onChange={e => { setConfirmPass(e.target.value); setErrorMsg(''); }}
                                            disabled={isLoading}
                                        />
                                        <button
                                            type="button"
                                            className="input-icon-right bg-transparent border-none p-0"
                                            onClick={() => setShowConfirm(v => !v)}
                                            aria-label={showConfirm ? 'Hide password' : 'Show password'}
                                        >
                                            <EyeIcon open={showConfirm} />
                                        </button>
                                    </div>
                                    {/* Match indicator */}
                                    {confirmPass && (
                                        <p className="form-hint animate-fade-in flex items-center gap-1.5" style={{
                                            color: confirmPass === newPass ? 'var(--color-success)' : 'var(--color-error)',
                                        }}>
                                            {confirmPass === newPass ? (
                                                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                                                    <path d="M4 10.5l4 4L16 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            ) : (
                                                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                                                    <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                </svg>
                                            )}
                                            {confirmPass === newPass ? 'Passwords match' : 'Passwords do not match'}
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="btn btn-primary btn-full mt-1"
                                    style={{ opacity: isLoading ? 0.85 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
                                >
                                    {isLoading
                                        ? <><Spinner /> Updating Password…</>
                                        : <>Reset Password <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg></>
                                    }
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                {/* ── Footer ── */}
                <p className="text-center mt-4 text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                    Access is restricted to enrolled CvSU students and staff.<br />
                    Contact your administrator for account issues.
                </p>
                <p className="text-center mt-2 text-[11px] tracking-wide" style={{ color: 'gray' }}>
                    Salikop {APP_VERSION_LABEL} &nbsp;·&nbsp; {new Date().getFullYear()}
                </p>
            </div>
        </div>
    );
}

