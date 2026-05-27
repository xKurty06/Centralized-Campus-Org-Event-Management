'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// --- Types
type FormState = 'idle' | 'loading' | 'error';
type Tab       = 'login' | 'guest';

// --- Config
// school_id format: YYYYMMNNN  e.g. 202405123
const SCHOOL_ID_REGEX = /^\d{9}$/;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v1';

type GlobalRole = 'Overseer' | 'Officer' | 'User' | string;

interface LoginUser {
  id: string;
  school_id: string;
  global_role: GlobalRole;
}

interface LoginApiResponse {
  success?: boolean;
  data?: {
    user?: LoginUser;
    token?: string;
  };
  error?: string;
}

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

/** Interactive campus-grid backdrop for the login screen. */
function BackgroundPattern({ pointer }: { pointer: { x: number; y: number } }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none bg-[#f2f6f4]" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(20,95,46,.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(20,95,46,.08) 1px, transparent 1px)
          `,
          backgroundSize: '44px 44px',
          transform: `translate(${(pointer.x - 50) * -0.08}px, ${(pointer.y - 50) * -0.08}px)`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at ${pointer.x}% ${pointer.y}%, rgba(34,160,80,.22), transparent 30%)`,
          mixBlendMode: 'multiply',
        }}
      />
      <div className="absolute left-[-8%] top-[10%] h-[72%] w-[32%] -rotate-12 border-y border-green-900/10 bg-white/45" />
      <div className="absolute right-[-6%] top-[16%] h-[68%] w-[28%] rotate-12 border-y border-green-900/10 bg-white/55" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white/90 to-transparent" />
    </div>
  );
}

function CampusPreview({ pointer }: { pointer: { x: number; y: number } }) {
  const tiltX = (pointer.y - 50) * -0.05;
  const tiltY = (pointer.x - 50) * 0.05;

  return (
    <section
      className="hidden lg:flex relative min-h-[715px] flex-1 items-center justify-center overflow-hidden rounded-[28px] border border-white/70 bg-white/55 p-8 shadow-[0_24px_80px_rgba(20,95,46,.16)] backdrop-blur"
      style={{ transform: `perspective(1200px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)` }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(20,95,46,.10),rgba(240,165,0,.08),rgba(255,255,255,.30))]" />
      <div className="absolute left-8 top-8 flex max-w-[calc(100%-4rem)] items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-2 text-[12px] font-semibold text-green-800 shadow-sm">
        <span className="h-2 w-2 rounded-full bg-green-600" />
        <span className="truncate">Live campus operations</span>
      </div>

      <div className="relative w-full max-w-[620px] pt-14">
        <div className="mb-7">
          <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.24em] text-green-800/70">Salikop Command Desk</p>
          <h2 className="max-w-[520px] text-[44px] font800 leading-[1.04] tracking-normal text-[#132118]">
            One entry point for events, officers, and campus oversight.
          </h2>
        </div>

        <div className="grid grid-cols-[1.2fr_.8fr] gap-4">
          <div className="rounded-2xl border border-white/70 bg-white/85 p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[13px] font-semibold text-gray-900">Today&apos;s activity</p>
                <p className="text-[11px] text-gray-400">Realtime event flow</p>
              </div>
              <span className="rounded-full bg-green-50 px-3 py-1 text-[11px] font-semibold text-green-700">Open</span>
            </div>
            <div className="space-y-3">
              {[
                ['Org fair registration', '84 participants', '72%'],
                ['Payment proof review', '12 pending', '38%'],
                ['Entrance check-in', 'Live scanning', '56%'],
              ].map(([label, detail, width]) => (
                <div key={label}>
                  <div className="mb-1.5 flex items-center justify-between text-[12px]">
                    <span className="font-semibold text-gray-700">{label}</span>
                    <span className="text-gray-400">{detail}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100">
                    <div className="h-full rounded-full bg-green-600" style={{ width }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/70 bg-[#132118] p-5 text-white shadow-sm">
            <p className="text-[12px] font-semibold text-white/60">Access layers</p>
            <div className="mt-5 space-y-3">
              {['Student', 'Officer', 'Overseer', 'Super Admin'].map((role, index) => (
                <div key={role} className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold">{index + 1}</span>
                  <span className="text-[13px] font-semibold">{role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4">
          {[
            ['Events', '128'],
            ['Organizations', '36'],
            ['Audit-ready', '100%'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm">
              <p className="text-[24px] font-bold text-green-800">{value}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
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

function validateSchoolId(val: string): string | null {
  if (!val) return 'Student ID is required.';
  if (!SCHOOL_ID_REGEX.test(val))
    return 'Enter a valid Student ID (e.g. 202405123).';
  return null;
}

// ─────────────────────────────────────────────────────────────
// Login Tab
// ─────────────────────────────────────────────────────────────
function LoginForm() {
  const router = useRouter();
  const [schoolId, setSchoolId]     = useState('');
  const [password, setPassword]     = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formState, setFormState]   = useState<FormState>('idle');
  const [errorMsg, setErrorMsg]     = useState('');

  function handleSchoolIdChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSchoolId(e.target.value);
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
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          school_id: schoolId.trim(),
          password,
        }),
      });

      const payload = (await res.json().catch(() => null)) as LoginApiResponse | null;
      if (!res.ok || !payload?.success || !payload?.data?.token || !payload?.data?.user) {
        setFormState('error');
        setErrorMsg(payload?.error ?? 'Invalid credentials. Please try again.');
        return;
      }

      const storage = rememberMe ? window.localStorage : window.sessionStorage;
      storage.setItem('auth_token', payload.data.token);
      storage.setItem('auth_user', JSON.stringify(payload.data.user));
      document.cookie = `auth_role=${encodeURIComponent(String(payload.data.user.global_role ?? 'User'))}; Path=/; Max-Age=${60 * 60 * 2}; SameSite=Lax`;
      document.cookie = `auth_session=1; Path=/; Max-Age=${60 * 60 * 2}; SameSite=Lax`;

      const role = payload.data.user.global_role;
      const isOfficer = role === 'Officer';
      if (role === 'Super_Admin' || role === 'Overseer') {
        router.push('/admin/dashboard');
        return;
      }

      if (isOfficer) {
        router.push('/manage/dashboard');
        return;
      }

      router.push('/events');
    } catch {
      setFormState('error');
      setErrorMsg('Unable to sign in right now. Please try again.');
    }
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

      {/* Student ID */}
      <Field
        id="school-id"
        label="Student ID"
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
            maxLength={9} /* YYYYMMNNN = 9 chars */
            className="input-has-left-icon"
          />
        </div>
      </Field>

      {/* Password */}
      <div className="form-group">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="form-label">Password</label>
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
        <Link
            href="/forgot-password"
            className="text-xs font-medium mt-1 self-end"
            style={{ color: 'var(--color-primary-light)' }}
          >
            Forgot password?
          </Link>
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
        {isLoading ? <><Spinner /> Signing in...</> : <>Sign In <ArrowIcon /></>}
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
          Sign in with your Student ID for full access.
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
        No account required &nbsp;-&nbsp; Limited access
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Page Root
// ─────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('login');
  const [mounted, setMounted] = useState(false);
  const [pointer, setPointer] = useState({ x: 50, y: 50 });

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const token = window.localStorage.getItem('auth_token') ?? window.sessionStorage.getItem('auth_token');
    if (token) router.replace('/events');
  }, [router]);

  return (
    <div
      className="page-shell relative min-h-screen overflow-hidden px-4 py-5 sm:px-6 lg:px-8"
      style={{ minHeight: '100vh' }}
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setPointer({
          x: ((event.clientX - rect.left) / rect.width) * 100,
          y: ((event.clientY - rect.top) / rect.height) * 100,
        });
      }}
    >
      <BackgroundPattern pointer={pointer} />

      <div
        className="relative z-10 mx-auto flex min-h-[calc(100vh-40px)] w-full max-w-[1380px] items-center gap-6 transition-all duration-300"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(12px)',
        }}
      >
        <CampusPreview pointer={pointer} />

        <section className="mx-auto flex w-full max-w-[460px] flex-col lg:mx-0">
          <div className="mb-5 flex items-center justify-between">
            <Link href="/events" className="flex items-center gap-3 text-gray-900 no-underline">
              <BrandLogo size={42} />
              <span>
                <span className="block text-[18px] font-bold leading-tight">Salikop</span>
                <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-400">CvSU Events Portal</span>
              </span>
            </Link>
            <Link href="/events" className="rounded-full border border-green-200 bg-white/75 px-3 py-1.5 text-[12px] font-semibold text-green-800 shadow-sm backdrop-blur">
              Browse events
            </Link>
          </div>

          <p className="-mt-2 mb-4 text-center text-[10px] font-medium text-gray-400">
            In partnership with <span className="font-semibold text-green-700">Dalisay</span>
          </p>

          <div className="rounded-[28px] border border-white/70 bg-white/88 shadow-[0_24px_80px_rgba(20,95,46,.18)] backdrop-blur-xl">
            <div className="px-6 pb-4 pt-6 sm:px-7">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-green-800/70">
                {tab === 'login' ? 'Secure campus access' : 'Public browsing mode'}
              </p>
              <h1 className="text-[30px] font-bold leading-tight text-gray-950">
                {tab === 'login' ? 'Welcome back' : 'Continue as Guest'}
              </h1>
              <p className="mt-2 text-[14px] text-gray-500">
                {tab === 'login'
                  ? 'Sign in with your CvSU Student ID to continue.'
                  : 'Browse open events without an account.'}
              </p>
            </div>

            <div className="mx-4 grid grid-cols-2 rounded-2xl bg-gray-100/80 p-1">
              {(['login', 'guest'] as Tab[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={[
                    'flex items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-semibold transition-all duration-200',
                    tab === t
                      ? 'bg-white text-green-800 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900',
                  ].join(' ')}
                >
                  {t === 'login' ? <UserIcon /> : <GlobeIcon />}
                  {t === 'login' ? 'Sign In' : 'Guest'}
                </button>
              ))}
            </div>

            <div className="px-6 py-6 sm:px-7">
              {tab === 'login' ? <LoginForm /> : <GuestAccess />}
            </div>
          </div>

          {tab === 'login' && (
            <p className="mt-5 text-center text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-semibold text-green-700">
                Create one
              </Link>
            </p>
          )}

          <p className="mt-3 text-center text-xs leading-relaxed text-gray-500">
            {tab === 'login'
              ? <>Access is restricted to enrolled CvSU students and staff.<br />Contact your administrator for account issues.</>
              : <>Guest access is read-only.<br />Sign in to register and track participation.</>
            }
          </p>

        </section>
      </div>
    </div>
  );
}
