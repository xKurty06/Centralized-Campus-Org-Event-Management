'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { APP_VERSION_LABEL } from '@/components/appVersion';

// ─── Types ────────────────────────────────────────────────────
type Step = 'email' | 'otp';
type FormState = 'idle' | 'loading' | 'error' | 'success';
type ToastMessage = { title: string; description: string };

const EMAIL_REGEX = /^[^\s@]+@cvsu\.edu\.ph$/i;
const OTP_LENGTH = 6;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v1';
const OTP_STORAGE_KEY = 'password_reset_otp';
const RESET_EMAIL_KEY = 'password_reset_email';
const RESET_VERIFIED_KEY = 'password_reset_verified';
type ApiResponse<T> = { success: boolean; data?: T; error?: string };
type ForgotPasswordPayload = { email: string; expires_at: string };

async function requestPasswordReset(email: string): Promise<ForgotPasswordPayload | null> {
    const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email }),
    });
    const payload = (await res.json().catch(() => null)) as ApiResponse<ForgotPasswordPayload> | null;
    if (!res.ok || !payload?.success) return null;
    return payload.data ?? { email, expires_at: '' };
}

async function verifyResetOtp(email: string, token: string): Promise<string | null> {
    const res = await fetch(`${API_BASE_URL}/auth/verify-reset-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, token }),
    });
    const payload = (await res.json().catch(() => null)) as ApiResponse<unknown> | null;
    if (res.ok && payload?.success) return null;
    return payload?.error ?? 'Invalid OTP. Please try again.';
}

// ─────────────────────────────────────────────────────────────
// Shared sub-components (mirrored from login page)
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

function AlertBanner({ msg }: { msg: string }) {
    return (
        <div role="alert" className="flex items-start gap-2.5 px-3.5 py-3 rounded-[--radius-md] border animate-fade-in"
            style={{ background: 'var(--color-error-light)', borderColor: 'rgba(217,48,37,.15)' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" strokeWidth="2"
                strokeLinecap="round" style={{ flexShrink: 0, marginTop: '1px' }}>
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-sm leading-snug" style={{ color: 'var(--color-error)' }}>{msg}</p>
        </div>
    );
}

function ArrowLeftIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
        </svg>
    );
}

function InlineToast({ message }: { message: ToastMessage }) {
    return (
        <div className="fixed top-4 left-1/2 z-[100] w-[min(92vw,420px)] -translate-x-1/2 animate-fade-in">
            <div
                className="rounded-[--radius-md] border px-4 py-3 shadow-lg"
                style={{
                    background: 'var(--color-surface)',
                    borderColor: 'rgba(34,160,80,.2)',
                    boxShadow: 'var(--shadow-green)',
                }}
                role="status"
                aria-live="polite"
            >
                <p className="text-sm font-semibold" style={{ color: 'var(--color-primary-dark)' }}>
                    {message.title}
                </p>
                <p className="mt-1 text-sm leading-snug" style={{ color: 'var(--color-text-secondary)' }}>
                    {message.description}
                </p>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Step 1 — Email Form
// ─────────────────────────────────────────────────────────────
function EmailStep({
    onSuccess,
    onToast,
}: {
    onSuccess: (email: string) => void;
    onToast: (message: ToastMessage) => void;
}) {
    const [email, setEmail] = useState('');
    const [formState, setFormState] = useState<FormState>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErrorMsg('');

        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail) { setErrorMsg('Email address is required.'); return; }
        if (!EMAIL_REGEX.test(normalizedEmail)) {
            setErrorMsg('Only @cvsu.edu.ph email addresses are accepted.');
            return;
        }
        setFormState('loading');
        const reset = await requestPasswordReset(normalizedEmail).catch(() => null);
        if (!reset) {
            setFormState('idle');
            setErrorMsg('No account found for this email address.');
            return;
        }
        sessionStorage.removeItem(OTP_STORAGE_KEY);
        sessionStorage.setItem(RESET_EMAIL_KEY, reset.email);
        sessionStorage.removeItem(RESET_VERIFIED_KEY);
        await new Promise(r => setTimeout(r, 1200));
        setFormState('idle');
        onToast({ title: 'OTP Sent', description: `A reset code was sent to ${reset.email}.` });
        onSuccess(normalizedEmail);
    }

    const isLoading = formState === 'loading';

    return (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            {errorMsg && <AlertBanner msg={errorMsg} />}

            {/* Info notice */}
            <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-[--radius-md] border"
                style={{ background: 'var(--color-primary-muted)', borderColor: 'rgba(34,160,80,.2)' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)"
                    strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: '1px' }}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <p className="text-sm leading-snug" style={{ color: 'var(--color-primary)' }}>
                    Enter the <strong>@cvsu.edu.ph</strong> email address linked to your account. We'll send a one-time code.
                </p>
            </div>

            {/* Email field */}
            <div className="form-group">
                <label htmlFor="email" className="form-label">Institutional Email</label>
                <div className="input-icon-wrapper">
                    <span className="input-icon-left">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            strokeWidth="2" strokeLinecap="round">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <polyline points="22,6 12,13 2,6" />
                        </svg>
                    </span>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        className="input-has-left-icon"
                        placeholder="yourname.lastname@cvsu.edu.ph"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setErrorMsg(''); }}
                        disabled={isLoading}
                        autoComplete="email"
                        autoFocus
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary btn-full mt-1"
                style={{ opacity: isLoading ? 0.85 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
            >
                {isLoading
                    ? <><Spinner /> Sending OTP…</>
                    : <>Send OTP <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg></>
                }
            </button>

            <p className="text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Remember your password?{' '}
                <Link href="/" className="font-semibold" style={{ color: 'var(--color-primary-light)' }}>
                    Sign in
                </Link>
            </p>
        </form>
    );
}

// ─────────────────────────────────────────────────────────────
// Step 2 — OTP Verification Form
// ─────────────────────────────────────────────────────────────
function OtpStep({
    email,
    onVerified,
    onToast,
}: {
    email: string;
    onVerified: () => void;
    onToast: (message: ToastMessage) => void;
}) {
    const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
    const [formState, setFormState] = useState<FormState>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [resendCooldown, setResendCooldown] = useState(60);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const router = useRouter();

    // Countdown timer for resend
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [resendCooldown]);

    function handleChange(index: number, value: string) {
        // Only accept single digit
        const digit = value.replace(/\D/g, '').slice(-1);
        const next = [...otp];
        next[index] = digit;
        setOtp(next);
        setErrorMsg('');

        // Auto-advance
        if (digit && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    }

    function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        // Allow paste via Ctrl+V handled by onPaste
    }

    function handlePaste(e: React.ClipboardEvent) {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
        if (!pasted) return;
        const next = [...otp];
        pasted.split('').forEach((d, i) => { next[i] = d; });
        setOtp(next);
        // Focus last filled or last cell
        const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
        inputRefs.current[focusIdx]?.focus();
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const code = otp.join('');
        if (code.length < OTP_LENGTH) {
            setErrorMsg('Please enter the complete 6-digit code.');
            return;
        }

        setFormState('loading');
        const storedEmail = sessionStorage.getItem(RESET_EMAIL_KEY);
        await new Promise(r => setTimeout(r, 1200));
        if (!storedEmail || storedEmail !== email) {
            setFormState('idle');
            setErrorMsg('Session expired. Please request a new OTP.');
            return;
        }

        const verifyError = await verifyResetOtp(email, code).catch(() => 'Unable to verify OTP. Please try again.');
        if (verifyError) {
            setFormState('idle');
            setErrorMsg(verifyError);
            return;
        }

        setFormState('idle');
        sessionStorage.setItem(OTP_STORAGE_KEY, code);
        sessionStorage.setItem(RESET_VERIFIED_KEY, 'true');
        onVerified();
        router.push('/reset-password');
    }

    async function handleResend() {
        if (resendCooldown > 0) return;
        setResendCooldown(60);
        setErrorMsg('');
        setOtp(Array(OTP_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
        const reset = await requestPasswordReset(email).catch(() => null);
        if (!reset) {
            setErrorMsg('Unable to resend OTP. Please try again.');
            return;
        }
        sessionStorage.removeItem(OTP_STORAGE_KEY);
        sessionStorage.setItem(RESET_EMAIL_KEY, reset.email);
        await new Promise(r => setTimeout(r, 800));
        onToast({ title: 'OTP Resent', description: `A new reset code was sent to ${reset.email}.` });
    }

    const isLoading = formState === 'loading';
    const isFilled = otp.every(d => d !== '');

    return (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            {errorMsg && <AlertBanner msg={errorMsg} />}

            {/* Sent-to notice */}
            <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-[--radius-md] border"
                style={{ background: 'var(--color-primary-muted)', borderColor: 'rgba(34,160,80,.2)' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)"
                    strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: '1px' }}>
                    <polyline points="20 6 9 17 4 12" />
                </svg>
                <p className="text-sm leading-snug" style={{ color: 'var(--color-primary)' }}>
                    A 6-digit code was sent to <strong>{email}</strong>. Check your inbox (and spam folder).
                </p>
            </div>

            {/* OTP boxes */}
            <div className="form-group">
                <label className="form-label">One-Time Code</label>
                <div className="flex gap-2 justify-between" onPaste={handlePaste}>
                    {otp.map((digit, i) => (
                        <input
                            key={i}
                            ref={el => { inputRefs.current[i] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={e => handleChange(i, e.target.value)}
                            onKeyDown={e => handleKeyDown(i, e)}
                            disabled={isLoading}
                            style={{
                                width: '44px',
                                height: '52px',
                                textAlign: 'center',
                                fontSize: '1.25rem',
                                fontWeight: 600,
                                padding: '0',
                                borderColor: digit ? 'var(--color-primary-light)' : undefined,
                                borderRadius: 'var(--radius-md)',
                                letterSpacing: 0,
                            }}
                            aria-label={`OTP digit ${i + 1}`}
                        />
                    ))}
                </div>
                <p className="form-hint">Code expires in 10 minutes.</p>
            </div>

            <button
                type="submit"
                disabled={isLoading || !isFilled}
                className="btn btn-primary btn-full mt-1"
                style={{ opacity: (isLoading || !isFilled) ? 0.75 : 1, cursor: (isLoading || !isFilled) ? 'not-allowed' : 'pointer' }}
            >
                {isLoading
                    ? <><Spinner /> Verifying…</>
                    : <>Verify Code <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg></>
                }
            </button>

            {/* Resend */}
            <p className="text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Didn't receive it?{' '}
                {resendCooldown > 0
                    ? <span style={{ color: 'var(--color-text-muted)' }}>Resend in {resendCooldown}s</span>
                    : (
                        <button
                            type="button"
                            onClick={handleResend}
                            className="font-semibold bg-transparent border-none p-0"
                            style={{ color: 'var(--color-primary-light)' }}
                        >
                            Resend OTP
                        </button>
                    )
                }
            </p>
        </form>
    );
}

// ─────────────────────────────────────────────────────────────
// Page Root
// ─────────────────────────────────────────────────────────────
export default function ForgotPasswordPage() {
    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [mounted, setMounted] = useState(false);
    const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);

    useEffect(() => { setMounted(true); }, []);
    useEffect(() => {
        if (!toastMessage) return;
        const timeout = setTimeout(() => setToastMessage(null), 4500);
        return () => clearTimeout(timeout);
    }, [toastMessage]);

    const stepMeta = {
        email: { num: 1, label: 'Enter Email' },
        otp: { num: 2, label: 'Verify OTP' },
    };
    const currentStep = stepMeta[step].num;

    return (
        <div className="page-shell relative flex items-center justify-center px-4 py-8" style={{ minHeight: '100vh' }}>
            {toastMessage && <InlineToast message={toastMessage} />}
            <BackgroundPattern />

            <div
                className="relative z-10 w-full max-w-[440px] transition-all duration-300"
                style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(12px)' }}
            >
                <div className="mb-6">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm font-medium transition-colors duration-150"
                        style={{ color: 'var(--color-text-secondary)' }}
                    >
                        <ArrowLeftIcon />
                        Back to Log In
                    </Link>
                </div>
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
                        {step === 'email' ? 'Forgot Password' : 'Enter Your OTP'}
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {step === 'email'
                            ? "We'll send a verification code to your CvSU email"
                            : 'Check your email for the 6-digit code'}
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
                            const isCompleted = (i === 1 && currentStep > 1);
                            return (
                                <div key={i} className={`step-line flex-1 ${isCompleted ? 'completed' : ''}`} />
                            );
                        }
                        const isActive = item.num === currentStep;
                        const isCompleted = item.num < currentStep;
                        return (
                            <div key={i} className="flex flex-col items-center gap-1">
                                <div className={`step-dot ${isActive ? 'active' : isCompleted ? 'completed' : ''}`}>
                                    {isCompleted
                                        ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                                        : item.num
                                    }
                                </div>
                                <span className="text-[10px] whitespace-nowrap" style={{ color: isActive ? 'var(--color-primary-light)' : 'var(--color-text-muted)' }}>
                                    {item.label}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* ── Card ── */}
                <div className="card" style={{ boxShadow: 'var(--shadow-lg)' }}>
                    <div className="card-body">
                        {step === 'email'
                            ? <EmailStep onSuccess={em => { setEmail(em); setStep('otp'); }} onToast={setToastMessage} />
                            : <OtpStep email={email} onVerified={() => { }} onToast={setToastMessage} />
                        }
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

