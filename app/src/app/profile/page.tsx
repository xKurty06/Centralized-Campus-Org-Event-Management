'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';

// ─── Types — aligned to updated DB schema ────────────────────────────────────

type GlobalRole = 'Overseer' | 'User';
type OrgCategory = 'Academic' | 'Non-Academic' | 'Religious';

interface College {
  name: string;
  code: string;
}

interface Course {
  id: string;
  name: string;
  code: string;
}

interface UserProfile {
  id: string;
  school_id: string;
  email: string;
  first_name: string;
  last_name: string;
  college: College;
  course: Course;           // course_id FK → Courses
  year_level: number;       // 1–5
  section: number;          // student's class section
  global_role: GlobalRole;
  is_active: boolean;
}

interface OrgMembership {
  org_id: string;
  org_name: string;
  org_category: OrgCategory;
  org_status: 'Active' | 'Suspended';
  org_color: string;
  position: string;
  is_active: boolean;
}

interface ActivitySummary {
  total_registered: number;
  total_confirmed: number;
  total_attended: number;
  total_upcoming: number;
}

// ─── Mock data — replace with GET /api/me ────────────────────────────────────

const MOCK_USER: UserProfile = {
  id: 'usr_001',
  school_id: '202305123',
  email: 'juandelacruz@cvsu.edu.ph',
  first_name: 'Juan',
  last_name: 'dela Cruz',
  college: { name: 'College of Engineering and Information Technology', code: 'CEIT' },
  course: { id: 'bscs', name: 'Bachelor of Science in Computer Science', code: 'BSCS' },
  year_level: 3,
  section: 2,
  global_role: 'User',
  is_active: true,
};

const MOCK_MEMBERSHIPS: OrgMembership[] = [
  { org_id: 'csso', org_name: 'Computer Science Society', org_category: 'Academic', org_status: 'Active', org_color: 'bg-blue-100 text-blue-700', position: 'Vice President', is_active: true },
  { org_id: 'gdsc', org_name: 'Google Developer Student Club', org_category: 'Academic', org_status: 'Active', org_color: 'bg-red-100 text-red-700', position: 'Member', is_active: true },
  { org_id: 'rcy', org_name: 'Red Cross Youth', org_category: 'Non-Academic', org_status: 'Active', org_color: 'bg-red-50 text-red-600', position: 'Member', is_active: false },
];

const MOCK_ACTIVITY: ActivitySummary = {
  total_registered: 8,
  total_confirmed: 6,
  total_attended: 5,
  total_upcoming: 4,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getYearLabel(year: number): string {
  const labels: Record<number, string> = {
    1: '1st Year', 2: '2nd Year', 3: '3rd Year', 4: '4th Year', 5: '5th Year',
  };
  return labels[year] ?? `Year ${year}`;
}

function getInitials(first: string, last: string): string {
  return `${first[0]}${last[0]}`.toUpperCase();
}

const ORG_CATEGORY_COLORS: Record<OrgCategory, string> = {
  'Academic': 'bg-blue-50 text-blue-700 border-blue-200',
  'Non-Academic': 'bg-orange-50 text-orange-700 border-orange-200',
  'Religious': 'bg-purple-50 text-purple-700 border-purple-200',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100">
        <p className="text-[13px] font-semibold text-gray-700">{title}</p>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-3 border-b border-gray-50 last:border-b-0">
      <span className="text-[12px] font-medium text-gray-400 flex-shrink-0 sm:w-44">{label}</span>
      <span className={`text-[13px] font-semibold text-gray-800 sm:text-right ${mono ? 'font-mono tracking-wide' : ''}`}>
        {value}
      </span>
    </div>
  );
}

function StatCard({ value, label, color = 'text-gray-900', bg = 'bg-white border-gray-200' }: {
  value: number; label: string; color?: string; bg?: string;
}) {
  return (
    <div className={`rounded-xl border ${bg} px-4 py-3.5 flex flex-col gap-0.5`}>
      <span className={`text-[24px] font-bold leading-none ${color}`}>{value}</span>
      <span className="text-[12px] text-gray-500">{label}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const user        = MOCK_USER;
  const memberships = MOCK_MEMBERSHIPS;
  const activity    = MOCK_ACTIVITY;

  const fullName  = `${user.first_name} ${user.last_name}`;
  const initials  = getInitials(user.first_name, user.last_name);
  const yearLabel = getYearLabel(user.year_level);
  const isOfficer = memberships.some((m) => m.is_active && m.position !== 'Member');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar
        role={isOfficer ? 'officer' : 'student'}
        user={{ name: fullName, schoolId: user.school_id, department: `${user.college.code} ${yearLabel}` }}
      />

      <main className="flex-1 w-full max-w-[1280px] mx-auto px-6 lg:px-12 py-8 flex flex-col gap-6 animate-fade-in">

        {/* Page header */}
        <div>
          <h1 className="text-[26px] font-bold text-gray-900 tracking-tight">My Profile</h1>
          <p className="text-[14px] text-gray-500 mt-1">
            Your verified campus identity. This information is pulled from institutional records and cannot be edited here.
          </p>
        </div>

        {/* ── Profile hero card ── */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">

          {/* Banner strip — tall enough so avatar clears it */}
          <div
            className="relative h-28" // FIX: Added relative
            style={{ background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary-light) 100%)' }}
          >
            {/* Subtle grid texture */}
            <div
              className="absolute inset-0 opacity-[0.07] pointer-events-none" // FIX: Added pointer-events-none
              style={{
                backgroundImage: `linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)`,
                backgroundSize: '28px 28px',
              }}
            />
          </div>

          {/* Avatar + header row — sits BELOW the banner, not inside it */}
          <div className="px-6 pb-6">

            {/* Avatar overlapping the banner */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 -mt-11 mb-4">
              <div
                className="relative z-10 w-[84px] h-[84px] rounded-2xl border-4 border-white shadow-md flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--color-primary-muted)' }}
              >
                <span
                  className="text-[26px] font-bold"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {initials}
                </span>
              </div>

              {/* Status badges — aligned to bottom of avatar row on desktop */}
              <div className="flex flex-wrap items-center gap-2 pb-1">
                {user.is_active ? (
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold bg-red-50 text-red-500 border border-red-200 px-3 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    Deactivated
                  </span>
                )}
                <span className="text-[11px] font-semibold bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                  {user.global_role === 'Overseer' ? 'Overseer' : 'Student'}
                </span>
                {isOfficer && (
                  <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full">
                    Officer
                  </span>
                )}
              </div>
            </div>

            {/* Name + subtitle */}
            <h2 className="text-[22px] font-bold text-gray-900 leading-tight">{fullName}</h2>
            <p className="text-[13px] text-gray-400 mt-1">
              {user.college.name}
            </p>
            <p className="text-[13px] text-gray-400 mt-0.5">
              {user.course.name} ({user.course.code} {user.year_level}-{user.section})
            </p>
          </div>
        </div>

        {/* ── Activity summary ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard value={activity.total_registered} label="Registered" />
          <StatCard value={activity.total_confirmed}  label="Confirmed"      color="text-green-700"  bg="bg-green-50 border-green-200"   />
          <StatCard value={activity.total_attended}   label="Attended"       color="text-blue-700"   bg="bg-blue-50 border-blue-200"     />
          <StatCard value={activity.total_upcoming}   label="Upcoming"       color="text-purple-700" bg="bg-purple-50 border-purple-200" />
        </div>

        {/* ── Two-column layout ── */}
        <div className="flex flex-col lg:flex-row gap-5">

          {/* LEFT — Identity details */}
          <div className="flex-1 flex flex-col gap-5">
            <SectionCard title="Identity information">
              <div className="flex flex-col">
                <InfoRow label="Full name"    value={fullName}        />
                <InfoRow label="School ID"    value={user.school_id} mono />
                <InfoRow label="Email"        value={user.email}      />
                <InfoRow label="College"      value={`${user.college.name} (${user.college.code})`} />
                <InfoRow label="Course"       value={`${user.course.name} (${user.course.code})`}   />
                <InfoRow label="Year level"   value={yearLabel}       />
                <InfoRow label="Section"      value={`Section ${user.section}`} />
                <InfoRow label="Account role" value={user.global_role === 'Overseer' ? 'Overseer (Admin)' : 'Student'} />
                <InfoRow label="Account ID"   value={user.id} mono    />
              </div>
            </SectionCard>

            {/* Read-only notice */}
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3.5">
              <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="none">
                <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 4v5m0 3v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <div>
                <p className="text-[13px] font-semibold text-blue-800">View-only profile</p>
                <p className="text-[12px] text-blue-700 mt-0.5 leading-relaxed">
                  Your identity data is sourced from CvSU institutional records. To request changes, contact the{' '}
                  <span className="font-semibold">Office of Student Affairs (OSA)</span>.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT — Org memberships + quick links */}
          <div className="lg:w-[340px] flex flex-col gap-5 flex-shrink-0">

            <SectionCard title={`Organization memberships (${memberships.length})`}>
              {memberships.length === 0 ? (
                <div className="flex flex-col items-center text-center py-6 gap-2">
                  <svg className="w-10 h-10 text-gray-200" viewBox="0 0 24 24" fill="none">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <p className="text-[13px] text-gray-400">Not a member of any organization yet.</p>
                  <Link href="/organizations" className="text-[13px] font-semibold text-green-700 hover:underline no-underline">
                    Browse organizations
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {memberships.map((m) => (
                    <Link
                      key={m.org_id}
                      href={`/organizations/${m.org_id}`}
                      className={`group flex items-center gap-3 p-3 rounded-xl border transition-all duration-150 no-underline
                        ${m.is_active
                          ? 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                          : 'border-gray-100 bg-gray-50 opacity-60'
                        }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-[12px] font-bold ${m.org_color}`}>
                        {m.org_name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-gray-800 group-hover:text-green-700 transition-colors truncate">
                          {m.org_name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${ORG_CATEGORY_COLORS[m.org_category]}`}>
                            {m.org_category}
                          </span>
                          <span className={`text-[11px] font-medium ${m.position !== 'Member' ? 'text-green-700' : 'text-gray-400'}`}>
                            {m.position}
                          </span>
                          {!m.is_active && (
                            <span className="text-[10px] text-gray-400 font-medium">· Inactive</span>
                          )}
                        </div>
                      </div>
                      {m.org_status === 'Suspended' ? (
                        <span className="text-[10px] font-semibold bg-red-50 text-red-500 border border-red-200 px-1.5 py-0.5 rounded-full flex-shrink-0">
                          Suspended
                        </span>
                      ) : (
                        <svg className="w-4 h-4 text-gray-300 group-hover:text-green-500 transition-colors flex-shrink-0" viewBox="0 0 20 20" fill="none">
                          <path d="M7 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Quick links */}
            <SectionCard title="Quick links">
              <div className="flex flex-col gap-2">
                <QuickLink href="/my-events"     icon={<IconCalendar />} label="My Events"     desc="View your registrations"    />
                <QuickLink href="/events"        icon={<IconSearch />}   label="Browse Events"  desc="Discover upcoming events"  />
                <QuickLink href="/organizations"  icon={<IconOrgs />}     label="Organizations"  desc="Explore student orgs"       />
              </div>
            </SectionCard>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Quick link item ──────────────────────────────────────────────────────────

function QuickLink({ href, icon, label, desc }: { href: string; icon: React.ReactNode; label: string; desc: string }) {
  return (
    <Link href={href} className="group flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50 transition-all no-underline">
      <div className="w-8 h-8 rounded-lg bg-green-50 group-hover:bg-green-100 flex items-center justify-center flex-shrink-0 text-green-700 transition-colors">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-gray-800 group-hover:text-green-700 transition-colors">{label}</p>
        <p className="text-[11px] text-gray-400">{desc}</p>
      </div>
      <svg className="w-4 h-4 text-gray-300 group-hover:text-green-500 transition-colors flex-shrink-0" viewBox="0 0 20 20" fill="none">
        <path d="M7 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconCalendar() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
      <path d="M6 2v2M14 2v2M3 8h14M5 4h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function IconSearch() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
      <path d="M9 17A8 8 0 109 1a8 8 0 000 16zM19 19l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function IconOrgs() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM3 17a7 7 0 1114 0H3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}