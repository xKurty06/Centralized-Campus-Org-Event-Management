'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';

/* ----------------------------------------------------------------
   Types
   ---------------------------------------------------------------- */
type OrgCategory = 'Academic' | 'Non-Academic' | 'Religious';
type EventCategory = 'Workshop' | 'Seminar' | 'Competition' | 'Training' | 'Outreach' | 'Cultural' | 'Activity' | 'Other';

interface OfficerProfile {
  id: string;
  name: string;
  position: string;
  schoolId: string;
  department: string;
}

interface OrgEvent {
  id: string;
  title: string;
  category: EventCategory;
  date: string;
  venue: string;
  type: 'Free' | 'Paid';
  fee?: number;
  registered: number;
  capacity: number;
  bannerColor: string;
}

interface Organization {
  id: string;
  name: string;
  acronym: string;
  category: OrgCategory;
  description: string;
  mission: string;
  vision: string;
  adviser: string;
  adviserDepartment: string;
  members: number;
  established: string;
  status: 'Active' | 'Suspended';
  color: string;
  officers: OfficerProfile[];
  events: OrgEvent[];
}

/* ----------------------------------------------------------------
   Mock data
   ---------------------------------------------------------------- */
const MOCK_ORGS: Record<string, Organization> = {
  csso: {
    id: 'csso',
    name: 'Computer Science Society',
    acronym: 'CSSO',
    category: 'Academic',
    status: 'Active',
    color: 'bg-blue-100 text-blue-700',
    established: '2010',
    members: 120,
    adviser: 'Prof. Maria Santos',
    adviserDepartment: 'Department of Computer Science',
    description: 'The Computer Science Society (CSSO) is the official academic organization of BS Computer Science students at Cavite State University. We are committed to fostering a culture of innovation, technical excellence, and professional development among our members.\n\nThrough workshops, hackathons, seminars, and industry partnerships, CSSO bridges the gap between academic learning and real-world technology practice. We believe that every CS student deserves a community that challenges, supports, and inspires them to grow.',
    mission: 'To empower CvSU Computer Science students through quality academic programs, technical training, and meaningful industry connections that prepare them for careers in technology.',
    vision: 'A community of technically excellent, socially responsible, and globally competitive computer science professionals.',
    officers: [
      { id: '1', name: 'Maria Clara Santos',   position: 'President',          schoolId: '202405101', department: 'BSCS 4-2' },
      { id: '2', name: 'Jose Ramon Cruz',      position: 'Vice President',     schoolId: '202100102', department: 'BSCS 4-3' },
      { id: '3', name: 'Ana Luisa Reyes',      position: 'Secretary',          schoolId: '202200201', department: 'BSCS 3-2' },
      { id: '4', name: 'Carlo Miguel Torres',  position: 'Treasurer',          schoolId: '202200202', department: 'BSCS 3-1' },
      { id: '5', name: 'Isabella Grace Lim',   position: 'Auditor',            schoolId: '202200203', department: 'BSCS 2-5' },
      { id: '6', name: 'Rafael Juan Garcia',   position: 'Public Relations',   schoolId: '202300301', department: 'BSCS 2-2' },
    ],
    events: [
      { id: '1', title: 'Web Development Summit 2025',  category: 'Workshop',    date: '2025-03-12', venue: 'Main Hall',          type: 'Free',                capacity: 150, registered: 42,  bannerColor: 'bg-blue-100'   },
      { id: '7', title: 'Research Writing Workshop',    category: 'Workshop',    date: '2025-04-05', venue: 'Library AVR',        type: 'Free',                capacity: 50,  registered: 29,  bannerColor: 'bg-blue-50'    },
      { id: '3', title: 'Hackathon 2025',               category: 'Competition', date: '2025-03-20', venue: 'Gymnasium',          type: 'Free',                capacity: 200, registered: 188, bannerColor: 'bg-orange-100' },
    ],
  },
  usc: {
    id: 'usc',
    name: 'University Student Council',
    acronym: 'USC',
    category: 'Non-Academic',
    status: 'Active',
    color: 'bg-yellow-100 text-yellow-700',
    established: '1998',
    members: 200,
    adviser: 'Dr. Jose Reyes',
    adviserDepartment: 'Office of Student Affairs',
    description: 'The University Student Council (USC) is the supreme student governing body of Cavite State University. As the official representative of the entire student population, the USC advocates for student rights, welfare, and development.\n\nThe council oversees campus-wide programs, coordinates inter-organization activities, and serves as the primary liaison between the student body and university administration.',
    mission: 'To serve as the voice of the CvSU student body by promoting student welfare, upholding academic integrity, and fostering a vibrant campus community through inclusive and transparent governance.',
    vision: 'A unified, empowered, and service-oriented student government that champions the rights and welfare of every CvSU student.',
    officers: [
      { id: '1', name: 'Ramon Eduardo Villanueva', position: 'President',      schoolId: '202000050', department: 'BSBA 2-2' },
      { id: '2', name: 'Patricia Anne Flores',     position: 'Vice President', schoolId: '202000051', department: 'BSN 2-2'  },
      { id: '3', name: 'Marco Luis Bautista',      position: 'Secretary',      schoolId: '202100150', department: 'BSED 2-2' },
      { id: '4', name: 'Diana Rose Mendoza',       position: 'Treasurer',      schoolId: '202100151', department: 'BSBA 2-2' },
    ],
    events: [
      { id: '2', title: 'Leadership & Governance Talk', category: 'Seminar',  date: '2025-03-15', venue: 'AVR Building B', type: 'Paid', fee: 50, capacity: 80,   registered: 67,  bannerColor: 'bg-purple-100' },
      { id: '9', title: 'Intramurals 2025',             category: 'Activity', date: '2025-04-10', venue: 'Sports Complex', type: 'Free',         capacity: 1000, registered: 834, bannerColor: 'bg-indigo-100' },
    ],
  },
};

/* ----------------------------------------------------------------
   Helpers
   ---------------------------------------------------------------- */
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

const CATEGORY_COLORS: Record<EventCategory, string> = {
  Workshop:    'bg-blue-50 text-blue-700',
  Seminar:     'bg-purple-50 text-purple-700',
  Competition: 'bg-orange-50 text-orange-700',
  Training:    'bg-yellow-50 text-yellow-800',
  Outreach:    'bg-teal-50 text-teal-700',
  Cultural:    'bg-pink-50 text-pink-700',
  Activity:    'bg-indigo-50 text-indigo-700',
  Other:       'bg-gray-100 text-gray-600',
};

const ORG_CATEGORY_META: Record<OrgCategory, { color: string; bg: string }> = {
  'Academic':     { color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200'     },
  'Non-Academic': { color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  'Religious':    { color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
};

/* ----------------------------------------------------------------
   Page
   ---------------------------------------------------------------- */
export default function OrgProfilePage() {
  const params = useParams();
  const org    = MOCK_ORGS[params.id as string];
  const [activeTab, setActiveTab] = useState<'about' | 'officers' | 'events'>('about');

  /* 404 */
  if (!org) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar role="student" user={{ name: 'Juan dela Cruz', schoolId: '202101142', department: 'BSCS 2-2' }} />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-300" viewBox="0 0 24 24" fill="none">
              <path d="M9.172 14.828L12 12m0 0l2.828-2.828M12 12L9.172 9.172M12 12l2.828 2.828M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-[18px] font-semibold text-gray-700">Organization not found</p>
          <Link href="/organizations" className="text-[14px] font-semibold text-green-700 hover:underline no-underline">← Back to Organizations</Link>
        </div>
      </div>
    );
  }

  const catMeta = ORG_CATEGORY_META[org.category];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar role="student" user={{ name: 'Juan dela Cruz', schoolId: '202101142', department: 'BSCS 2-2' }} />

      <main className="flex-1 w-full max-w-[1280px] mx-auto px-6 lg:px-12 py-8 flex flex-col gap-6">

        {/* ── Breadcrumb ── */}
            <Link
              href="/organizations"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors no-underline w-fit"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 19l-7-7 7-7"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              Back to Organizations
            </Link>

        {/* ── Profile header card ── */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">

          {/* Banner strip */}
          <div className={`h-24 ${org.color.split(' ')[0]} opacity-40`} />

          {/* Info section */}
          <div className="px-6 pb-6">
            {/* Avatar overlapping banner */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-8 mb-5">
              <div className={`w-20 h-20 rounded-2xl border-4 border-white shadow-sm flex items-center justify-center text-[20px] font-bold flex-shrink-0 ${org.color}`}>
                {org.acronym.slice(0, 2)}
              </div>
              {/* Status badge */}
              <div className="flex items-center gap-2 sm:mb-1">
                <span className={`text-[12px] font-semibold px-3 py-1 rounded-full border ${catMeta.bg} ${catMeta.color}`}>
                  {org.category}
                </span>
                {org.status === 'Active' ? (
                  <span className="flex items-center gap-1.5 text-[12px] font-semibold bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                    Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-[12px] font-semibold bg-red-50 text-red-500 border border-red-200 px-3 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                    Suspended
                  </span>
                )}
              </div>
            </div>

            {/* Name + meta */}
            <h1 className="text-[24px] font-bold text-gray-900 leading-tight">{org.name}</h1>
            <p className="text-[14px] text-gray-400 font-medium mt-0.5">{org.acronym} · Est. {org.established}</p>

            {/* Stats row */}
            <div className="flex flex-wrap gap-6 mt-5 pt-5 border-t border-gray-100">
              <StatItem icon={<IconUsers />} value={`${org.members}+`} label="Members" />
              <StatItem icon={<IconCalendar />} value={`${org.events.length}`} label="Events this year" />
              <StatItem icon={<IconAdviser />} value={org.adviser} label="Adviser" sublabel={org.adviserDepartment} />
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit">
          {([
            { key: 'about',   label: 'About'   },
            { key: 'officers',label: 'Officers' },
            { key: 'events',  label: 'Events'   },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 cursor-pointer whitespace-nowrap
                ${activeTab === tab.key ? 'bg-green-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}

        {/* ABOUT */}
        {activeTab === 'about' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Left: description */}
            <div className="lg:col-span-2 flex flex-col gap-5">
              <SectionCard title="About us">
                <div className="flex flex-col gap-3">
                  {org.description.split('\n').filter(Boolean).map((para, i) => (
                    <p key={i} className="text-[14px] text-gray-600 leading-relaxed">{para}</p>
                  ))}
                </div>
              </SectionCard>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <SectionCard title="Mission">
                  <p className="text-[14px] text-gray-600 leading-relaxed">{org.mission}</p>
                </SectionCard>
                <SectionCard title="Vision">
                  <p className="text-[14px] text-gray-600 leading-relaxed">{org.vision}</p>
                </SectionCard>
              </div>
            </div>

            {/* Right: quick info */}
            <div className="flex flex-col gap-4">
              <SectionCard title="Organization info">
                <div className="flex flex-col gap-3">
                  <InfoRow label="Full name"   value={org.name} />
                  <InfoRow label="Acronym"     value={org.acronym} />
                  <InfoRow label="Category"    value={org.category} />
                  <InfoRow label="Established" value={org.established} />
                  <InfoRow label="Status"      value={org.status} valueColor={org.status === 'Active' ? 'text-green-700' : 'text-red-500'} />
                  <InfoRow label="Members"     value={`${org.members}+`} />
                </div>
              </SectionCard>

              <SectionCard title="Adviser">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-green-700" viewBox="0 0 20 20" fill="none">
                      <path d="M10 10a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 1114 0H3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-gray-800">{org.adviser}</p>
                    <p className="text-[12px] text-gray-400">{org.adviserDepartment}</p>
                  </div>
                </div>
              </SectionCard>
            </div>
          </div>
        )}

        {/* OFFICERS */}
        {activeTab === 'officers' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-[14px] font-semibold text-gray-700">
                {org.officers.length} Officers · AY 2024–2025
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {org.officers.map((officer) => (
                <div key={officer.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-[13px] font-bold ${org.color}`}>
                    {officer.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-gray-800 truncate">{officer.name}</p>
                    <p className="text-[12px] font-medium text-green-700">{officer.position}</p>
                    <p className="text-[11px] text-gray-400">{officer.schoolId} · {officer.department}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EVENTS */}
        {activeTab === 'events' && (
          <div className="flex flex-col gap-4">
            <p className="text-[14px] font-semibold text-gray-700">{org.events.length} events this academic year</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {org.events.map((event) => {
                const spots   = event.capacity - event.registered;
                const isFull  = spots <= 0;
                const fillPct = Math.min((event.registered / event.capacity) * 100, 100);
                return (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 no-underline flex flex-col"
                  >
                    {/* Banner */}
                    <div className={`h-28 ${event.bannerColor} relative flex items-center justify-center`}>
                      <svg className="w-8 h-8 text-gray-300" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M8 2v4M16 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      <div className="absolute top-2.5 right-2.5">
                        {event.type === 'Free'
                          ? <span className="text-[10px] font-semibold bg-green-700 text-white px-2 py-0.5 rounded-full">Free</span>
                          : <span className="text-[10px] font-semibold bg-amber-500 text-white px-2 py-0.5 rounded-full">₱{event.fee}</span>
                        }
                      </div>
                    </div>
                    {/* Body */}
                    <div className="p-4 flex flex-col gap-2 flex-1">
                      <span className={`self-start text-[10px] font-semibold px-2 py-0.5 rounded-md ${CATEGORY_COLORS[event.category]}`}>
                        {event.category}
                      </span>
                      <h3 className="text-[13px] font-semibold text-gray-900 group-hover:text-green-700 transition-colors line-clamp-2 leading-snug">
                        {event.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[12px] text-gray-400 mt-auto">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none"><path d="M5 2v2M11 2v2M2 7h12M4 3h8a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                        {formatDate(event.date)} · {event.venue}
                      </div>
                      {/* Capacity bar */}
                      <div className="mt-1.5">
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-gray-400">{event.registered} registered</span>
                          <span className={isFull ? 'text-red-500 font-medium' : 'text-green-700 font-medium'}>
                            {isFull ? 'Full' : `${spots} left`}
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${isFull ? 'bg-red-400' : 'bg-green-600'}`} style={{ width: `${fillPct}%` }} />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* ----------------------------------------------------------------
   Sub-components
   ---------------------------------------------------------------- */
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

function InfoRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-[12px] text-gray-400 flex-shrink-0">{label}</span>
      <span className={`text-[12px] font-semibold text-right ${valueColor ?? 'text-gray-800'}`}>{value}</span>
    </div>
  );
}

function StatItem({ icon, value, label, sublabel }: { icon: React.ReactNode; value: string; label: string; sublabel?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 text-green-700">
        {icon}
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-[15px] font-bold text-gray-900">{value}</span>
        <span className="text-[11px] text-gray-400">{label}</span>
        {sublabel && <span className="text-[11px] text-gray-400">{sublabel}</span>}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------
   Icons
   ---------------------------------------------------------------- */
function IconUsers() {
  return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM3 17a7 7 0 1114 0H3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
function IconCalendar() {
  return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none"><path d="M6 2v2M14 2v2M3 8h14M5 4h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
function IconAdviser() {
  return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none"><path d="M10 10a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 1114 0H3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}