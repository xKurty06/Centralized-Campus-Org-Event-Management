'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────
type FormState = 'idle' | 'loading' | 'error';
type Tab       = 'login' | 'guest';

// ─── Config ───────────────────────────────────────────────────
// school_id format: YYYY-D-NNNNN  e.g. 2023-1-00123
const SCHOOL_ID_REGEX = /^\d{4}-\d-\d{5}$/;

// ─────────────────────────────────────────────────────────────
// Sub-components
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

/** Subtle dot-grid + glow decorations */
function BackgroundPattern() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* top-right glow */}
      <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(34,160,80,.13) 0%, transparent 70%)' }} />
      {/* bottom-left glow */}
      <div className="absolute -bottom-24 -left-16 w-80 h-80 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(34,160,80,.08) 0%, transparent 70%)' }} />
      {/* grid */}
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

/** Reusable field wrapper using .form-group + .input-icon-wrapper from globals */
function Field({
  id, label, hint, children,
}: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="form-group">
      <label htmlFor={id} className="form-label">{label}</label>
      {children}
      {hint && <p className="form-hint">{hint}</p>}
    </div>
  );
}

/** Icon slot left inside an input */
function InputIcon({ children }: { children: React.ReactNode }) {
  return <span className="input-icon-left">{children}</span>;
}

// ─────────────────────────────────────────────────────────────
// Icon SVGs
// ─────────────────────────────────────────────────────────────

/** Campus ID card icon */
const IdCardIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <circle cx="8" cy="12" r="2" />
    <path d="M14 9h4M14 12h4M14 15h2" />
  </svg>
);

const LockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);

const AlertIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: '1px' }}>
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const ArrowIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

const GlobeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
  </svg>
);

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Auto-formats a school ID as the user types.
 * Accepts digits only and inserts dashes at positions 4 and 6.
 * Output: YYYY-D-NNNNN
 */
function formatSchoolId(raw: string): string {
  // Strip everything that isn't a digit
  const digits = raw.replace(/\D/g, '');
  if (digits.length <= 4) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 5)}-${digits.slice(5, 10)}`;
}

function validateSchoolId(val: string): string | null {
  if (!val) return 'School ID is required.';
  if (!SCHOOL_ID_REGEX.test(val))
    return 'Enter a valid School ID (e.g. 2023-1-00123).';
  return null;
}

// ─────────────────────────────────────────────────────────────
// Login Tab
// ─────────────────────────────────────────────────────────────
function LoginForm() {
  const [schoolId, setSchoolId]     = useState('');
  const [password, setPassword]     = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formState, setFormState]   = useState<FormState>('idle');
  const [errorMsg, setErrorMsg]     = useState('');

  function handleSchoolIdChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSchoolId(formatSchoolId(e.target.value));
    setErrorMsg('');
    setFormState('idle');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    const idErr = validateSchoolId(schoolId);
    if (idErr) { setErrorMsg(idErr); return; }
    if (!password) { setErrorMsg('Password is required.'); return; }

    setFormState('loading');
    await new Promise(r => setTimeout(r, 1200));
    setFormState('error');
    setErrorMsg('Invalid credentials. Please try again.');
  }

  const isLoading = formState === 'loading';

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">

      {/* Error banner */}
      {errorMsg && (
        <div
          role="alert"
          className="flex items-start gap-2.5 px-3.5 py-3 rounded-[--radius-md] border animate-fade-in"
          style={{
            background: 'var(--color-error-light)',
            borderColor: 'rgba(217,48,37,.2)',
            color: 'var(--color-error)',
          }}
        >
          <AlertIcon />
          <span className="text-sm leading-snug">{errorMsg}</span>
        </div>
      )}

      {/* School ID */}
      <Field
        id="school-id"
        label="School ID"
        hint="Format: YYYYNNNNN (e.g. 202405123)"
      >
        <div className="input-icon-wrapper">
          <InputIcon><IdCardIcon /></InputIcon>
          <input
            id="school-id"
            type="text"
            inputMode="numeric"
            value={schoolId}
            onChange={handleSchoolIdChange}
            placeholder="202405123"
            autoComplete="username"
            disabled={isLoading}
            maxLength={9} /* YYYY-D-NNNNN = 9 chars */
            className="input-has-left-icon"
          />
        </div>
      </Field>

      {/* Password */}
      <div className="form-group">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="form-label">Password</label>
          <Link
            href="/forgot-password"
            className="text-xs font-medium"
            style={{ color: 'var(--color-primary-light)' }}
          >
            Forgot password?
          </Link>
        </div>
        <div className="input-icon-wrapper">
          <InputIcon><LockIcon /></InputIcon>
          <input
            id="password"
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={e => { setPassword(e.target.value); setErrorMsg(''); setFormState('idle'); }}
            placeholder="Enter your password"
            autoComplete="current-password"
            disabled={isLoading}
            className="input-has-left-icon input-has-right-icon"
          />
          <button
            type="button"
            onClick={() => setShowPass(p => !p)}
            aria-label={showPass ? 'Hide password' : 'Show password'}
            className="input-icon-right bg-transparent border-0 cursor-pointer transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <EyeIcon open={showPass} />
          </button>
        </div>
      </div>

      {/* Remember me */}
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox" checked={rememberMe}
          onChange={e => setRememberMe(e.target.checked)}
          disabled={isLoading}
          className="w-4 h-4 cursor-pointer"
          style={{ accentColor: 'var(--color-primary-light)' }}
        />
        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Keep me signed in
        </span>
      </label>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="btn btn-primary btn-full mt-1"
        style={{ opacity: isLoading ? 0.85 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
      >
        {isLoading ? <><Spinner /> Signing in…</> : <>Sign In <ArrowIcon /></>}
      </button>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────
// Guest Tab
// ─────────────────────────────────────────────────────────────
function GuestAccess() {
  return (
    <div className="flex flex-col gap-5">

      {/* Info banner */}
      <div
        className="flex items-start gap-2.5 px-3.5 py-3 rounded-[--radius-md] border"
        style={{
          background: 'var(--color-primary-muted)',
          borderColor: 'rgba(34,160,80,.2)',
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round"
          style={{ flexShrink: 0, marginTop: '1px' }}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <p className="text-sm leading-snug" style={{ color: 'var(--color-primary)' }}>
          Guest access lets you <strong>browse events only</strong>.
          Sign in with your School ID for full access.
        </p>
      </div>

      {/* What guests can / can't do */}
      <div className="flex flex-col gap-2">
        {[
          { can: true,  text: 'Browse all public events' },
          { can: true,  text: 'View event details and schedules' },
          { can: false,  text: 'Register for events' },
          { can: false, text: 'Access student-only or org-exclusive events' },
          { can: false, text: 'View your registration history' },
          { can: false, text: 'Access officer or admin features' },
        ].map(({ can, text }) => (
          <div key={text} className="flex items-center gap-2.5">
            {can ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="var(--color-success)" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="var(--color-text-muted)" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            )}
            <span
              className="text-sm"
              style={{ color: can ? 'var(--color-text)' : 'var(--color-text-muted)' }}
            >
              {text}
            </span>
          </div>
        ))}
      </div>

      <hr className="divider my-0" />

      {/* CTA */}
      <Link href="/events" className="btn btn-outline btn-full">
        <GlobeIcon />
        Browse Public Events
      </Link>

      <p className="text-center text-xs" style={{ color: 'var(--color-text-muted)' }}>
        No account required &nbsp;·&nbsp; Limited access
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Page Root
// ─────────────────────────────────────────────────────────────
export default function LoginPage() {
  const [tab, setTab]         = useState<Tab>('login');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  return (
    <div
      className="page-shell relative flex items-center justify-center px-4 py-8"
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
        {/* ── Brand ── */}
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

          <h1 className="text-2xl font-bold mb-1.5" style={{ color: 'var(--color-text)' }}>
            {tab === 'login' ? 'Welcome back' : 'Continue as Guest'}
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {tab === 'login'
              ? 'Sign in with your CvSU School ID to continue'
              : 'Browse open events without an account'}
          </p>

          {/* Partnership line */}
          <div className="flex items-center justify-center gap-1.5 mt-3">
            <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
              In partnership with
            </span>
            <span
              className="text-[11px] font-semibold"
              style={{ color: 'var(--color-primary-light)' }}
            >
              Dalisay
            </span>
          </div>
        </div>

        {/* ── Card ── */}
        <div className="card" style={{ boxShadow: 'var(--shadow-lg)' }}>

          {/* Tab switcher */}
          <div
            className="flex border-b"
            style={{ borderColor: 'var(--color-border)' }}
          >
            {(['login', 'guest'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={[
                  'flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium border-b-2 transition-all duration-150 bg-transparent',
                  tab === t
                    ? 'border-[--color-primary-light] text-[--color-primary-light]'
                    : 'border-transparent text-[--color-text-muted] hover:text-[--color-text]',
                ].join(' ')}
                style={{ marginBottom: '-1px' }}
              >
                {t === 'login' ? <UserIcon /> : <GlobeIcon />}
                {t === 'login' ? 'Sign In' : 'Guest Access'}
              </button>
            ))}
          </div>

          {/* Tab body */}
          <div className="card-body">
            {tab === 'login' ? <LoginForm /> : <GuestAccess />}
          </div>
        </div>

        {/* ── Sign-up nudge (only on login tab) ── */}
        {tab === 'login' && (
          <p className="text-center mt-5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-semibold" style={{ color: 'var(--color-primary-light)' }}>
              Create one
            </Link>
          </p>
        )}

        {/* ── Footer ── */}
        <p className="text-center mt-3 text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          {tab === 'login'
            ? <>Access is restricted to enrolled CvSU students and staff.<br />Contact your administrator for account issues.</>
            : <>Guest registrations require a valid contact email.<br />You may be asked to show ID at the event entrance.</>
          }
        </p>
        <p className="text-center mt-2.5 text-[11px] tracking-wide" style={{ color: 'gray' }}>
          Salikop v1.0 &nbsp;·&nbsp; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}