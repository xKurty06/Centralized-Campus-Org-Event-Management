'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
type Category = 'account' | 'event' | 'payment' | 'organization' | 'technical' | 'other';
type FormState = 'idle' | 'loading' | 'success' | 'error';

interface ContactForm {
    name: string;
    email: string;
    schoolId: string;
    category: Category | '';
    subject: string;
    message: string;
}

interface SessionUser {
    name: string;
    email: string;
    schoolId: string;
    avatarUrl?: string;
}

function resolveSessionUser(): SessionUser | null {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem('auth_user') ?? window.sessionStorage.getItem('auth_user');
    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw) as { first_name?: string; last_name?: string; email?: string; school_id?: string };
        const name = `${parsed.first_name ?? ''} ${parsed.last_name ?? ''}`.trim();
        return {
            name: name || parsed.email || 'User',
            email: parsed.email || '',
            schoolId: parsed.school_id || '',
        };
    } catch {
        return null;
    }
}

const CATEGORIES: { value: Category; label: string; icon: React.ReactNode }[] = [
    {
        value: 'account',
        label: 'Account & Access',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
        ),
    },
    {
        value: 'event',
        label: 'Events & Registration',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
        ),
    },
    {
        value: 'payment',
        label: 'Payments & Verification',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
            </svg>
        ),
    },
    {
        value: 'organization',
        label: 'Organization Management',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
        ),
    },
    {
        value: 'technical',
        label: 'Technical / Bug Report',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
        ),
    },
    {
        value: 'other',
        label: 'Other',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
        ),
    },
];

const FAQ_ITEMS = [
    {
        q: 'I forgot my password. How do I reset it?',
        a: 'Go to the login page and click "Forgot Password." Enter your @cvsu.edu.ph email and we\'ll send a 6-digit OTP. Use that code on the reset page to set a new password.',
    },
    {
        q: 'My account was deactivated. What should I do?',
        a: 'Deactivated accounts are managed by platform administrators. Submit a support request using the form below with your Student ID and institutional email and we\'ll investigate.',
    },
    {
        q: 'I submitted payment proof but my status still shows Pending.',
        a: 'Payment proofs are reviewed manually by the event\'s organization officers. Allow 24–48 hours for review. If it\'s been longer, contact support with your registration details.',
    },
    {
        q: 'I registered for an event but don\'t see it in My Events.',
        a: 'Make sure you\'re signed in with the correct account. Check the "Past" tab if the event has already occurred. If the issue persists, contact support with the event name.',
    },
    {
        q: 'I\'m an officer but I can\'t access the manage dashboard.',
        a: 'Officer access is granted per-organization by your platform administrator. Contact your organization\'s admin or submit a support ticket below.',
    },
];

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

function BrandLogo({ size = 32 }: { size?: number }) {
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

function BackgroundAccent() {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true" style={{ zIndex: 0 }}>
            <div className="absolute top-0 right-0 w-[500px] h-[500px]"
                style={{ background: 'radial-gradient(ellipse at top right, rgba(34,160,80,.07) 0%, transparent 65%)' }} />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px]"
                style={{ background: 'radial-gradient(ellipse at bottom left, rgba(34,160,80,.05) 0%, transparent 65%)' }} />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// FAQ Item
// ─────────────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center justify-between gap-4 py-4 text-left bg-transparent border-none"
            >
                <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{q}</span>
                <svg
                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                    style={{ flexShrink: 0, color: 'var(--color-text-muted)', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms ease' }}
                >
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>
            {open && (
                <div className="pb-4 animate-fade-in">
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{a}</p>
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Success State
// ─────────────────────────────────────────────────────────────
function SuccessPanel({ onReset }: { onReset: () => void }) {
    return (
        <div className="flex flex-col items-center text-center gap-5 py-8 animate-fade-in">
            <div className="w-16 h-16 rounded-full flex items-center justify-center animate-pulse-green"
                style={{ background: 'var(--color-primary-muted)' }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            </div>
            <div>
                <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--color-text)' }}>Ticket Submitted</h3>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Your support request has been received. We'll respond to your institutional email within <strong>1–2 business days</strong>.
                </p>
            </div>
            <div className="w-full rounded-[--radius-md] border px-4 py-3"
                style={{ background: 'var(--color-primary-muted)', borderColor: 'rgba(34,160,80,.2)' }}>
                <p className="text-sm" style={{ color: 'var(--color-primary)' }}>
                    Please check your <strong>@cvsu.edu.ph inbox</strong> for a confirmation and follow-up from our support team.
                </p>
            </div>
            <button onClick={onReset} className="btn btn-ghost btn-sm">
                Submit another request
            </button>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Contact Form
// ─────────────────────────────────────────────────────────────
function ContactForm({ initialUser }: { initialUser: SessionUser | null }) {
    const [form, setForm] = useState<ContactForm>({
        name: '', email: '', schoolId: '', category: '', subject: '', message: '',
    });
    const [formState, setFormState] = useState<FormState>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (!initialUser) return;

        setForm((current) => ({
            ...current,
            name: current.name || initialUser.name,
            email: current.email || initialUser.email,
            schoolId: current.schoolId || initialUser.schoolId,
        }));
    }, [initialUser]);

    function update(key: keyof ContactForm, val: string) {
        setForm(f => ({ ...f, [key]: val }));
        setErrorMsg('');
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErrorMsg('');

        if (!form.name.trim()) { setErrorMsg('Your name is required.'); return; }
        if (!form.email.trim() || !form.email.endsWith('@cvsu.edu.ph')) {
            setErrorMsg('A valid @cvsu.edu.ph email address is required.'); return;
        }
        if (!form.category) { setErrorMsg('Please select a support category.'); return; }
        if (!form.subject.trim()) { setErrorMsg('A subject line is required.'); return; }
        if (form.message.trim().length < 20) { setErrorMsg('Please describe your issue in at least 20 characters.'); return; }

        setFormState('loading');
        // TODO: POST /api/support/contact { ...form }
        await new Promise(r => setTimeout(r, 1400));
        setFormState('success');
    }

    const isLoading = formState === 'loading';

    if (formState === 'success') return <SuccessPanel onReset={() => { setForm({ name: '', email: '', schoolId: '', category: '', subject: '', message: '' }); setFormState('idle'); }} />;

    return (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            {/* Name + Email row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group">
                    <label htmlFor="name" className="form-label">Full Name</label>
                    <input
                        id="name" type="text" placeholder="Juan dela Cruz"
                        value={form.name} onChange={e => update('name', e.target.value)}
                        disabled={isLoading}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="email" className="form-label">Institutional Email</label>
                    <div className="input-icon-wrapper">
                        <span className="input-icon-left">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                <polyline points="22,6 12,13 2,6" />
                            </svg>
                        </span>
                        <input
                            id="email" type="email" placeholder="you@cvsu.edu.ph"
                            className="input-has-left-icon"
                            value={form.email} onChange={e => update('email', e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                </div>
            </div>

            {/* Student ID (optional) */}
            <div className="form-group">
                <label htmlFor="schoolId" className="form-label">
                    Student ID <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(optional)</span>
                </label>
                <div className="input-icon-wrapper">
                    <span className="input-icon-left">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <rect x="2" y="5" width="20" height="14" rx="2" /><circle cx="8" cy="12" r="2" />
                            <path d="M14 9h4M14 12h4M14 15h2" />
                        </svg>
                    </span>
                    <input
                        id="schoolId" type="text" placeholder="e.g. 202405123"
                        className="input-has-left-icon"
                        value={form.schoolId} onChange={e => update('schoolId', e.target.value)}
                        disabled={isLoading}
                        maxLength={9}
                    />
                </div>
                <p className="form-hint">Helps us locate your account faster.</p>
            </div>

            {/* Category selector */}
            <div className="form-group">
                <label className="form-label">Support Category</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-0.5">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.value}
                            type="button"
                            onClick={() => update('category', cat.value)}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-3 py-2.5 text-xs font-medium rounded-2xl border transition-all duration-150 text-left hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary"
                            style={{
                                background: form.category === cat.value ? 'var(--color-primary-muted)' : 'var(--color-surface)',
                                borderColor: form.category === cat.value ? 'var(--color-primary-light)' : 'var(--color-border)',
                                color: form.category === cat.value ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                                boxShadow: form.category === cat.value ? '0 0 0 2px rgba(34,160,80,.12)' : undefined,
                            }}
                        >
                            <span style={{ color: form.category === cat.value ? 'var(--color-primary-light)' : 'var(--color-text-muted)' }}>
                                {cat.icon}
                            </span>
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Subject */}
            <div className="form-group">
                <label htmlFor="subject" className="form-label">Subject</label>
                <input
                    id="subject" type="text" placeholder="Brief summary of your concern"
                    value={form.subject} onChange={e => update('subject', e.target.value)}
                    disabled={isLoading}
                    maxLength={120}
                />
            </div>

            {/* Message */}
            <div className="form-group">
                <label htmlFor="message" className="form-label">Message</label>
                <textarea
                    id="message"
                    rows={5}
                    placeholder="Describe your issue in detail. Include any relevant event names, dates, or error messages you encountered."
                    value={form.message}
                    onChange={e => update('message', e.target.value)}
                    disabled={isLoading}
                    style={{ resize: 'vertical', minHeight: '120px' }}
                />
                <p className="form-hint">{form.message.length} / 1000 characters</p>
            </div>

            {/* Submit */}
            <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary btn-full mt-1"
                style={{ opacity: isLoading ? 0.85 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
            >
                {isLoading
                    ? <><Spinner /> Submitting Ticket…</>
                    : <>
                        Submit Support Ticket
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                    </>
                }
            </button>
            {errorMsg && (
                <div role="alert" className="flex items-start gap-2.5 px-3.5 py-3 rounded-full border animate-fade-in"
                    style={{ background: 'var(--color-error-light)', borderColor: 'rgba(217,48,37,.15)' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" strokeWidth="2"
                        strokeLinecap="round" style={{ flexShrink: 0, marginTop: '1px' }}>
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <p className="text-sm leading-snug" style={{ color: 'var(--color-error)' }}>{errorMsg}</p>
                </div>
            )}
        </form>
    );
}

function getInitials(name: string) {
    return name
        .split(' ')
        .map((segment) => segment[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

function DropdownLink({ href, onClick, icon, children }: { href: string; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors no-underline group"
        >
            <span className="text-gray-400 group-hover:text-green-700 transition-colors">{icon}</span>
            {children}
        </Link>
    );
}

function IconCalendar() {
    return (
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
            <path d="M6 2v2M14 2v2M3 8h14M5 4h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

function IconProfile() {
    return (
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
            <path d="M10 10a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 1114 0H3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

function IconKey() {
    return (
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
            <circle cx="8" cy="10" r="4" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11.5 10H18M16 8v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function IconManage() {
    return (
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

function IconAdmin() {
    return (
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
            <path d="M9 12l2 2 4-4m-5 6a8 8 0 110-16 8 8 0 010 16z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function IconLogout() {
    return (
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
            <path d="M13 15l4-5-4-5M17 10H7m6 7H5a2 2 0 01-2-2V5a2 2 0 012-2h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

// ─────────────────────────────────────────────────────────────
// Page Root
// ─────────────────────────────────────────────────────────────
export default function SupportPage() {
    const [mounted, setMounted] = useState(false);
    const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
    const [, setMenuOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [sessionRole, setSessionRole] = useState<'guest' | 'student' | 'officer' | 'admin'>('guest');

    useEffect(() => {
        setMounted(true);
        setSessionUser(resolveSessionUser());

        if (typeof window === 'undefined') return;

        const token = window.localStorage.getItem('auth_token') ?? window.sessionStorage.getItem('auth_token');
        const rawUser = window.localStorage.getItem('auth_user') ?? window.sessionStorage.getItem('auth_user');

        if (!token || !rawUser) {
            setSessionRole('guest');
            return;
        }

        try {
            const parsed = JSON.parse(rawUser) as { global_role?: string };
            setSessionRole(parsed.global_role === 'Overseer' ? 'admin' : parsed.global_role === 'Officer' ? 'officer' : 'student');
        } catch {
            setSessionRole('guest');
        }
    }, []);

    function handleLogout() {
        if (typeof window === 'undefined') return;

        window.localStorage.removeItem('auth_token');
        window.localStorage.removeItem('auth_user');
        window.sessionStorage.removeItem('auth_token');
        window.sessionStorage.removeItem('auth_user');
        document.cookie = 'auth_role=; Path=/; Max-Age=0; SameSite=Lax';
        document.cookie = 'auth_session=; Path=/; Max-Age=0; SameSite=Lax';
        setSessionRole('guest');
        setSessionUser(null);
        setProfileOpen(false);
        window.location.href = '/';
    }

    const isLoggedIn = sessionRole !== 'guest';

    return (
        <div className="page-shell" style={{ opacity: mounted ? 1 : 0, transition: 'opacity 300ms ease' }}>
            <BackgroundAccent />

            {/* ── Top nav bar ── */}
            <header className="sticky top-0 z-50 border-b"
                style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-xs)' }}>
                <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                        <BrandLogo size={35} />
                        <span className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>Salikop</span>
                    </Link>
                    <div className="flex items-center gap-1">
                        <Link href="/privacy-policy" className="btn btn-ghost btn-sm text-xs">Privacy Policy</Link>
                        {isLoggedIn && sessionUser ? (
                            <div className="relative">
                                <button
                                    onClick={() => setProfileOpen((v) => !v)}
                                    className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-gray-200 bg-white hover:border-green-600 hover:shadow-[0_0_0_3px_#dcfce7] transition-all duration-150 cursor-pointer shrink-0"
                                >
                                    <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center overflow-hidden shrink-0 border border-green-100">
                                        {sessionUser.avatarUrl ? (
                                            <img src={sessionUser.avatarUrl} alt={sessionUser.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-[10px] font-bold text-green-700">{getInitials(sessionUser.name)}</span>
                                        )}
                                    </div>
                                    <div className="hidden md:flex flex-col text-left leading-tight flex-1 min-w-0">
                                        <span className="text-[11px] font-semibold text-gray-800 truncate">{sessionUser.name}</span>
                                        <span className="text-[9px] text-gray-400 truncate">{sessionUser.schoolId}</span>
                                    </div>
                                    <svg
                                        className={`w-3 h-3 text-gray-400 hidden md:block transition-transform duration-150 ${profileOpen ? 'rotate-180' : ''}`}
                                        viewBox="0 0 20 20" fill="none"
                                    >
                                        <path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>

                                {profileOpen && (
                                    <>
                                        <div className="fixed inset-0 z-20" onClick={() => setProfileOpen(false)} />
                                        <div className="absolute right-0 top-[calc(100%+8px)] w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-40 overflow-hidden">
                                            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                                                <p className="text-[13px] font-semibold text-gray-800 truncate">{sessionUser.name}</p>
                                                <p className="text-[11px] text-gray-400 truncate">{sessionUser.schoolId}</p>
                                                <span className="mt-1.5 inline-block text-[10px] font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-md uppercase tracking-wide">
                                                    {sessionRole}
                                                </span>
                                            </div>
                                            <div className="py-1">
                                                <DropdownLink href="/my-events" onClick={() => setProfileOpen(false)} icon={<IconCalendar />}>My Events</DropdownLink>
                                                <DropdownLink href="/profile" onClick={() => setProfileOpen(false)} icon={<IconProfile />}>View Profile</DropdownLink>
                                                <DropdownLink href="/change-password" onClick={() => setProfileOpen(false)} icon={<IconKey />}>Change Password</DropdownLink>
                                                {sessionRole === 'officer' && <DropdownLink href="/manage/dashboard" onClick={() => setProfileOpen(false)} icon={<IconManage />}>Manage Org</DropdownLink>}
                                                {sessionRole === 'admin' && <DropdownLink href="/admin/dashboard" onClick={() => setProfileOpen(false)} icon={<IconAdmin />}>Admin Panel</DropdownLink>}
                                            </div>
                                            <div className="h-px bg-gray-100" />
                                            <div className="py-1">
                                                <button onClick={handleLogout} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] font-medium text-red-500 hover:bg-red-50 transition-colors duration-150 cursor-pointer">
                                                    <IconLogout /> Log out
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <Link href="/" className="btn btn-primary btn-sm text-xs">Sign In</Link>
                        )}

                        <button
                            onClick={() => setMenuOpen((v) => !v)}
                            className="md:hidden flex flex-col justify-center gap-1.5 w-8 h-8 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                            aria-label="Toggle menu"
                        >
                            <span className="block w-full h-0.5 bg-gray-500 rounded-full" />
                            <span className="block w-full h-0.5 bg-gray-500 rounded-full" />
                            <span className="block w-full h-0.5 bg-gray-500 rounded-full" />
                        </button>
                    </div>
                </div>
            </header>

            <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">

                {/* ── Hero ── */}
                <div className="mb-12 max-w-2xl animate-fade-in">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="badge badge-green text-xs">Support</span>
                        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Response within 1–2 business days</span>
                    </div>
                    <h1 className="text-4xl font-bold mb-3 leading-tight" style={{ color: 'var(--color-text)' }}>
                        Contact Support
                    </h1>
                    <p className="text-base" style={{ color: 'var(--color-text-secondary)' }}>
                        Need help with your account, a registration, or an event? Check the FAQs below or send us a support ticket directly.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

                    {/* ── Left: FAQ + Info cards ── */}
                    <div className="lg:col-span-2 flex flex-col gap-6">

                        {/* Quick info cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                            {[
                                {
                                    icon: (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                                        </svg>
                                    ),
                                    label: 'Email Support',
                                    value: 'support@cvsu.edu.ph',
                                    sub: 'Institutional inquiries only',
                                },
                                {
                                    icon: (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round">
                                            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                                        </svg>
                                    ),
                                    label: 'Response Time',
                                    value: '1-2 Business Days',
                                    sub: 'Mon-Fri, 8AM-5PM',
                                },
                                {
                                    icon: (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                                        </svg>
                                    ),
                                    label: 'Campus Office',
                                    value: 'OSAS / ICT Office',
                                    sub: 'Cavite State University',
                                },
                            ].map(item => (
                                <div key={item.label} className="card" style={{ boxShadow: 'none' }}>
                                    <div className="card-body py-4 flex items-start gap-3">
                                        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-2"
                                            style={{ background: 'var(--color-primary-muted)' }}>
                                            {item.icon}
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>{item.label}</p>
                                            <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--color-text)' }}>{item.value}</p>
                                            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{item.sub}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* FAQ */}
                        <div className="card animate-fade-in" style={{ animationDelay: '80ms' }}>
                            <div className="px-6 pt-5 pb-2 border-b flex items-center gap-2"
                                style={{ borderColor: 'var(--color-border)' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round">
                                    <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                                <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Frequently Asked Questions</h2>
                            </div>
                            <div className="px-6">
                                {FAQ_ITEMS.map((item, i) => <FaqItem key={i} {...item} />)}
                            </div>
                        </div>
                    </div>

                    {/* ── Right: Contact form ── */}
                    <div className="lg:col-span-3">
                        <div className="card animate-fade-in" style={{ boxShadow: 'var(--shadow-lg)', animationDelay: '40ms' }}>
                            {/* Card header */}
                            <div className="px-6 pt-6 pb-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
                                <h2 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>Submit a Support Ticket</h2>
                                <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                                    Fill out the form below and our support team will get back to you at your institutional email.
                                </p>
                            </div>
                            <div className="card-body">
                                <ContactForm initialUser={sessionUser} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}