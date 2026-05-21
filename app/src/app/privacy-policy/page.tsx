'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface Section {
    id: string;
    title: string;
    content: React.ReactNode;
}

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

function BackgroundAccent() {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true" style={{ zIndex: 0 }}>
            <div className="absolute top-0 right-0 w-[600px] h-[600px]"
                style={{ background: 'radial-gradient(ellipse at top right, rgba(34,160,80,.07) 0%, transparent 65%)' }} />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px]"
                style={{ background: 'radial-gradient(ellipse at bottom left, rgba(34,160,80,.05) 0%, transparent 65%)' }} />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Policy Content Sections
// ─────────────────────────────────────────────────────────────
const SECTIONS: Section[] = [
    {
        id: 'overview',
        title: 'Overview',
        content: (
            <>
                <p>
                    Salikop is a centralized campus organization and event management system developed exclusively
                    for Cavite State University (CvSU). This Privacy Policy describes how we collect, use, store,
                    and protect personal data submitted by students, organization officers, and platform administrators.
                </p>
                <p className="mt-3">
                    By accessing or using Salikop, you acknowledge and agree to the terms described in this policy.
                    This platform operates solely within the CvSU institutional environment and is not a public-facing
                    commercial service.
                </p>
            </>
        ),
    },
    {
        id: 'data-collected',
        title: 'Information We Collect',
        content: (
            <>
                <p>We collect only the information necessary to operate the platform. This includes:</p>
                <ul className="mt-3 flex flex-col gap-2">
                    {[
                        { label: 'Identity Data', detail: 'Full name, School ID number, year level, section, and academic course — sourced from campus enrollment records.' },
                        { label: 'Contact Data', detail: 'Institutional email address (@cvsu.edu.ph). No personal or external email addresses are accepted or stored.' },
                        { label: 'Authentication Data', detail: 'Hashed account credentials. Passwords are never stored in plain text and are not recoverable by platform staff.' },
                        { label: 'Registration Records', detail: 'Event registrations, payment method selections, payment status updates, and check-in timestamps.' },
                        { label: 'Uploaded Files', detail: 'Payment proof screenshots submitted for online payment verification. These are linked to specific registration records.' },
                        { label: 'Activity Logs', detail: 'Administrative and officer actions such as role assignments, accreditation changes, and event modifications, stored for audit purposes.' },
                    ].map(({ label, detail }) => (
                        <li key={label} className="flex gap-3 items-start">
                            <span className="mt-2 w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--color-primary-light)' }} />
                            <span className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                                <strong style={{ color: 'var(--color-text)' }}>{label}:</strong> {detail}
                            </span>
                        </li>
                    ))}
                </ul>
            </>
        ),
    },
    {
        id: 'how-used',
        title: 'How We Use Your Information',
        content: (
            <>
                <p>Your data is used exclusively for the following institutional purposes:</p>
                <ul className="mt-3 flex flex-col gap-2">
                    {[
                        'Authenticating your identity and controlling platform access based on your enrolled role.',
                        'Pre-filling your registration records for campus events with your verified academic profile.',
                        'Processing and verifying payment submissions for paid events.',
                        'Enabling organization officers to manage participant lists, attendance, and payment status.',
                        'Sending transactional notifications — registration confirmations and payment receipts — to your institutional email.',
                        'Maintaining audit trails for administrative actions to ensure accountability and data integrity.',
                        'Displaying your organization memberships and event history on your personal profile dashboard.',
                    ].map((item, i) => (
                        <li key={i} className="flex gap-3 items-start">
                            <span className="mt-2 w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--color-primary-light)' }} />
                            <span className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{item}</span>
                        </li>
                    ))}
                </ul>
                <p className="mt-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    We do <strong style={{ color: 'var(--color-text)' }}>not</strong> sell, rent, share, or use your
                    data for advertising, analytics profiling, or any purpose outside of the CvSU institutional context.
                </p>
            </>
        ),
    },
    {
        id: 'data-sharing',
        title: 'Data Sharing & Disclosure',
        content: (
            <>
                <p>
                    Salikop is an internal campus system. Your personal data is accessible only to the following
                    parties within the institutional environment:
                </p>
                <ul className="mt-3 flex flex-col gap-2">
                    {[
                        { who: 'Organization Officers', what: 'Can view the name, School ID, course, year level, and payment status of students registered for their organization\'s events.' },
                        { who: 'Platform Administrators (Overseers)', what: 'Have access to all user accounts, organizations, and events for system-wide moderation and account management.' },
                        { who: 'You', what: 'Can view and access all data tied to your own account through your profile and event dashboard.' },
                    ].map(({ who, what }) => (
                        <li key={who} className="flex gap-3 items-start">
                            <span className="mt-2 w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--color-primary-light)' }} />
                            <span className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                                <strong style={{ color: 'var(--color-text)' }}>{who}:</strong> {what}
                            </span>
                        </li>
                    ))}
                </ul>
                <p className="mt-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    We do not disclose any personal data to third parties, external services, or government agencies
                    unless required by applicable law or institutional policy.
                </p>
            </>
        ),
    },
    {
        id: 'data-retention',
        title: 'Data Retention',
        content: (
            <>
                <p>
                    Salikop follows a non-destructive data retention policy. Accounts, registration records, and
                    organizational history are preserved indefinitely rather than hard-deleted. This is intentional:
                </p>
                <ul className="mt-3 flex flex-col gap-2">
                    {[
                        'Deactivated user accounts retain their registration and membership history for institutional audit purposes.',
                        'Removed organization officers retain their historical assignment records to preserve organizational continuity.',
                        'Completed or cancelled events and their associated registration data are archived, not deleted.',
                        'Payment proof uploads remain on record after verification to support dispute resolution.',
                    ].map((item, i) => (
                        <li key={i} className="flex gap-3 items-start">
                            <span className="mt-2 w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--color-primary-light)' }} />
                            <span className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{item}</span>
                        </li>
                    ))}
                </ul>
                <p className="mt-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    If you require account deletion or data removal, please contact your platform administrator
                    through the support channel.
                </p>
            </>
        ),
    },
    {
        id: 'security',
        title: 'Security Measures',
        content: (
            <>
                <p>We implement the following technical measures to protect your data:</p>
                <ul className="mt-3 flex flex-col gap-2">
                    {[
                        'All passwords are hashed using a one-way algorithm. They cannot be read, retrieved, or reversed by anyone — including platform administrators.',
                        'Access to officer and administrator features is role-gated at both the frontend interface and the backend API layer.',
                        'The institutional email domain restriction (@cvsu.edu.ph) prevents unauthorized account creation by external parties.',
                        'OTP-based password recovery ensures account access cannot be reclaimed without access to the registered institutional email.',
                        'Offline attendance queue data is stored temporarily and synced securely once connectivity is restored.',
                    ].map((item, i) => (
                        <li key={i} className="flex gap-3 items-start">
                            <span className="mt-2 w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--color-primary-light)' }} />
                            <span className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{item}</span>
                        </li>
                    ))}
                </ul>
            </>
        ),
    },
    {
        id: 'your-rights',
        title: 'Your Rights',
        content: (
            <>
                <p>As a registered user of Salikop, you have the right to:</p>
                <ul className="mt-3 flex flex-col gap-2">
                    {[
                        'View all personal data tied to your account through your Profile page.',
                        'Update your password at any time through the Change Password page.',
                        'Request a review or correction of your account data by contacting platform support.',
                        'Request account deactivation by submitting a request to a platform administrator.',
                    ].map((item, i) => (
                        <li key={i} className="flex gap-3 items-start">
                            <span className="mt-2 w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--color-primary-light)' }} />
                            <span className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{item}</span>
                        </li>
                    ))}
                </ul>
            </>
        ),
    },
    {
        id: 'changes',
        title: 'Changes to This Policy',
        content: (
            <p>
                This Privacy Policy may be updated as the platform evolves or as institutional requirements change.
                Significant updates will be communicated through the platform's in-app notification system.
                Continued use of Salikop after changes are published constitutes acceptance of the revised policy.
                The effective date at the top of this page will always reflect the most recent revision.
            </p>
        ),
    },
    {
        id: 'contact',
        title: 'Questions & Contact',
        content: (
            <p>
                If you have any questions about this Privacy Policy or how your data is handled, please reach out
                through the{' '}
                <Link href="/support" style={{ color: 'var(--color-primary-light)', fontWeight: 600 }}>
                    Contact Support
                </Link>{' '}
                page. For account-specific issues, your platform administrator can be contacted directly through
                your institution's official channels.
            </p>
        ),
    },
];

// ─────────────────────────────────────────────────────────────
// Page Root
// ─────────────────────────────────────────────────────────────
export default function PrivacyPolicyPage() {
    const [mounted, setMounted] = useState(false);
    const [activeSection, setActiveSection] = useState('overview');
    const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

    useEffect(() => { setMounted(true); }, []);

    // Scroll spy
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) setActiveSection(entry.target.id);
                });
            },
            { rootMargin: '-20% 0px -70% 0px' }
        );
        Object.values(sectionRefs.current).forEach(el => { if (el) observer.observe(el); });
        return () => observer.disconnect();
    }, [mounted]);

    function scrollTo(id: string) {
        sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

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
                        <Link href="/support" className="btn btn-ghost btn-sm text-xs">Contact Support</Link>
                        <Link href="/" className="btn btn-primary btn-sm text-xs">Sign In</Link>
                    </div>
                </div>
            </header>

            <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
                {/* ── Hero ── */}
                <div className="mb-12 max-w-2xl animate-fade-in">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="badge badge-green text-xs">Legal</span>
                        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Effective May 2026</span>
                    </div>
                    <h1 className="text-4xl font-bold mb-3 leading-tight" style={{ color: 'var(--color-text)' }}>
                        Privacy Policy
                    </h1>
                    <p className="text-base" style={{ color: 'var(--color-text-secondary)' }}>
                        How Salikop collects, uses, and protects the personal data of all CvSU students, officers, and administrators on the platform.
                    </p>
                </div>

                <div className="flex gap-10 items-start">

                    {/* ── Sticky Table of Contents (desktop) ── */}
                    <aside className="hidden lg:flex flex-col gap-1 w-56 shrink-0 sticky top-24">
                        <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-muted)' }}>
                            Contents
                        </p>
                        {SECTIONS.map(s => (
                            <button
                                key={s.id}
                                onClick={() => scrollTo(s.id)}
                                className="text-left text-sm px-3 py-1.5 rounded-md transition-all duration-150 bg-transparent border-none"
                                style={{
                                    color: activeSection === s.id ? 'var(--color-primary-light)' : 'var(--color-text-secondary)',
                                    background: activeSection === s.id ? 'var(--color-primary-muted)' : 'transparent',
                                    fontWeight: activeSection === s.id ? 600 : 400,
                                    borderLeft: activeSection === s.id ? '2px solid var(--color-primary-light)' : '2px solid transparent',
                                    borderRadius: 0,
                                    paddingLeft: '12px',
                                }}
                            >
                                {s.title}
                            </button>
                        ))}
                    </aside>

                    {/* ── Main Content ── */}
                    <main className="flex-1 min-w-0">
                        <div className="flex flex-col gap-2">
                            {SECTIONS.map((section, i) => (
                                <section
                                    key={section.id}
                                    id={section.id}
                                    ref={el => { sectionRefs.current[section.id] = el; }}
                                    className="card card-body animate-fade-in"
                                    style={{
                                        animationDelay: `${i * 40}ms`,
                                        scrollMarginTop: '100px',
                                    }}
                                >
                                    {/* Section header */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                                            style={{ background: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}>
                                            {i + 1}
                                        </div>
                                        <h2 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
                                            {section.title}
                                        </h2>
                                    </div>

                                    <div className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                                        {section.content}
                                    </div>
                                </section>
                            ))}
                        </div>

                        {/* ── Footer card ── */}
                        <div className="mt-4 rounded-[--radius-lg] border px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                            style={{ background: 'var(--color-primary-muted)', borderColor: 'rgba(34,160,80,.2)' }}>
                            <div>
                                <p className="text-sm font-semibold" style={{ color: 'var(--color-primary-dark)' }}>Have questions about your data?</p>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--color-primary)' }}>Our support team is ready to help with any privacy concerns.</p>
                            </div>
                            <Link href="/support" className="btn btn-primary btn-sm shrink-0">
                                Contact Support
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                                </svg>
                            </Link>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}