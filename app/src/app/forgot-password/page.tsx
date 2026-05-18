'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────
type Step = 'email' | 'otp';
type FormState = 'idle' | 'loading' | 'error' | 'success';

const EMAIL_REGEX = /^[^\s@]+@cvsu\.edu\.ph$/i;
const OTP_LENGTH = 6;

// ─────────────────────────────────────────────────────────────
// Shared sub-components (mirrored from login page)
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

// ─────────────────────────────────────────────────────────────
// Step 1 — Email Form
// ─────────────────────────────────────────────────────────────
function EmailStep({ onSuccess }: { onSuccess: (email: string) => void }) {
    const [email, setEmail] = useState('');
    const [formState, setFormState] = useState<FormState>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErrorMsg('');

        if (!email) { setErrorMsg('Email address is required.'); return; }
        if (!EMAIL_REGEX.test(email)) {
            setErrorMsg('Only @cvsu.edu.ph email addresses are accepted.');
            return;
        }

        setFormState('loading');
        // TODO: call POST /api/auth/forgot-password { email }
        await new Promise(r => setTimeout(r, 1200));
        setFormState('idle');
        onSuccess(email);
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
                        type="email"
                        className="input-has-left-icon"
                        placeholder="you@cvsu.edu.ph"
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
function OtpStep({ email, onVerified }: { email: string; onVerified: () => void }) {
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
        // TODO: call POST /api/auth/verify-otp { email, otp: code }
        await new Promise(r => setTimeout(r, 1200));
        setFormState('idle');
        // On success: store token / session and navigate
        router.push('/reset-password');
    }

    async function handleResend() {
        if (resendCooldown > 0) return;
        setResendCooldown(60);
        setErrorMsg('');
        setOtp(Array(OTP_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
        // TODO: call POST /api/auth/forgot-password { email } again
        await new Promise(r => setTimeout(r, 800));
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

    useEffect(() => { setMounted(true); }, []);

    const stepMeta = {
        email: { num: 1, label: 'Enter Email' },
        otp: { num: 2, label: 'Verify OTP' },
    };
    const currentStep = stepMeta[step].num;

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
                            ? <EmailStep onSuccess={em => { setEmail(em); setStep('otp'); }} />
                            : <OtpStep email={email} onVerified={() => { }} />
                        }
                    </div>
                </div>

                {/* ── Footer ── */}
                <p className="text-center mt-4 text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                    Access is restricted to enrolled CvSU students and staff.<br />
                    Contact your administrator for account issues.
                </p>
                <p className="text-center mt-2 text-[11px] tracking-wide" style={{ color: 'gray' }}>
                    Salikop v1.0 &nbsp;·&nbsp; {new Date().getFullYear()}
                </p>
            </div>
        </div>
    );
}