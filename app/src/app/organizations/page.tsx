'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

/* ----------------------------------------------------------------
   Types
   ---------------------------------------------------------------- */
type OrgCategory = 'Academic' | 'Non-Academic' | 'Religious';

interface Organization {
  id: string;
  name: string;
  acronym: string;
  category: OrgCategory;
  description: string;
  adviser: string;
  members: number;
  eventsThisYear: number;
  status: 'Active' | 'Suspended';
  color: string;
}

/* ----------------------------------------------------------------
   Mock data
   ---------------------------------------------------------------- */
const MOCK_ORGS: Organization[] = [
  { id: 'csso', name: 'Computer Science Society', acronym: 'CSSO', category: 'Academic', description: 'A community of CS students dedicated to advancing technology, innovation, and professional growth through workshops, competitions, and industry talks.', adviser: 'Prof. Maria Santos', members: 120, eventsThisYear: 8, status: 'Active', color: 'bg-blue-100 text-blue-700' },
  { id: 'gdsc', name: 'Google Developer Student Club', acronym: 'GDSC', category: 'Academic', description: 'Empowering students to bridge the gap between theory and practice through Google technologies, open-source projects, and developer communities.', adviser: 'Prof. Juan Cruz', members: 95, eventsThisYear: 6, status: 'Active', color: 'bg-red-100 text-red-700' },
  { id: 'ite', name: 'IT Educators Society', acronym: 'ITES', category: 'Academic', description: 'Focused on developing future IT educators through seminars, training, and collaborative research on information technology in education.', adviser: 'Dr. Rosa Reyes', members: 60, eventsThisYear: 4, status: 'Active', color: 'bg-indigo-100 text-indigo-700' },
  { id: 'agri', name: 'Agriculture Students Assoc.', acronym: 'ASA', category: 'Academic', description: 'Promoting agricultural sciences, sustainable farming, and rural development through outreach programs, field demonstrations, and academic activities.', adviser: 'Prof. Carlos Lim', members: 80, eventsThisYear: 5, status: 'Active', color: 'bg-green-100 text-green-700' },
  { id: 'usc', name: 'University Student Council', acronym: 'USC', category: 'Non-Academic', description: 'The official governing body of CvSU students, representing the student body in matters of policy, welfare, and campus-wide activities.', adviser: 'Dr. Jose Reyes', members: 200, eventsThisYear: 12, status: 'Active', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'rcy', name: 'Red Cross Youth', acronym: 'RCY', category: 'Non-Academic', description: 'A humanitarian organization training students in first aid, disaster response, and community service. Open to all CvSU students.', adviser: 'Prof. Ana Rivera', members: 150, eventsThisYear: 10, status: 'Active', color: 'bg-red-50 text-red-600' },
  { id: 'vc', name: 'CvSU Volunteers Club', acronym: 'VC', category: 'Non-Academic', description: 'Dedicated to community outreach, environmental advocacy, and social development projects that benefit both the campus and surrounding communities.', adviser: 'Prof. Lea Torres', members: 110, eventsThisYear: 9, status: 'Active', color: 'bg-teal-100 text-teal-700' },
  { id: 'saca', name: 'Sining at Kulturang CvSU', acronym: 'SACA', category: 'Non-Academic', description: 'Celebrating Filipino arts, culture, and heritage through performances, festivals, and cultural immersion activities that showcase CvSU talent.', adviser: 'Dr. Gloria Bautista', members: 85, eventsThisYear: 7, status: 'Active', color: 'bg-pink-100 text-pink-700' },
  { id: 'cwts', name: 'Civic Welfare Training Corps', acronym: 'CWTS', category: 'Non-Academic', description: 'Building socially responsible citizens through civic engagement, disaster preparedness, and community development programs.', adviser: 'Prof. Ramon Garcia', members: 300, eventsThisYear: 6, status: 'Active', color: 'bg-orange-100 text-orange-700' },
  { id: 'ccf', name: 'Campus Christian Fellowship', acronym: 'CCF', category: 'Religious', description: 'A Christ-centered community fostering spiritual growth, fellowship, and service among CvSU students through Bible studies, worship nights, and outreach.', adviser: 'Rev. Pablo Dela Cruz', members: 180, eventsThisYear: 15, status: 'Active', color: 'bg-amber-100 text-amber-700' },
  { id: 'yfc', name: 'Youth for Christ', acronym: 'YFC', category: 'Religious', description: 'Committed to reaching students with the gospel of Jesus Christ through discipleship, leadership formation, and servant evangelism.', adviser: 'Rev. Grace Santos', members: 140, eventsThisYear: 11, status: 'Active', color: 'bg-purple-100 text-purple-700' },
  { id: 'uccp', name: 'United Campus Catholic Parish', acronym: 'UCCP', category: 'Religious', description: 'Serving the Catholic student community through mass, retreats, religious formations, and charitable activities rooted in Catholic social teaching.', adviser: 'Fr. Miguel Ramos', members: 90, eventsThisYear: 8, status: 'Suspended', color: 'bg-gray-100 text-gray-500' },
];

const CATEGORY_TABS: { value: OrgCategory | 'All'; label: string }[] = [
  { value: 'All', label: 'All' },
  { value: 'Academic', label: 'Academic' },
  { value: 'Non-Academic', label: 'Non-Academic' },
  { value: 'Religious', label: 'Religious' },
];

const CATEGORY_META: Record<OrgCategory, { description: string; color: string; bg: string }> = {
  'Academic': { description: 'Department-based and discipline-specific organizations', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  'Non-Academic': { description: 'Student government, civic, cultural, and special interest groups', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  'Religious': { description: 'Faith-based communities and campus ministry organizations', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
};

/* ----------------------------------------------------------------
   Branded dropdown (reusable)
   ---------------------------------------------------------------- */
function FilterDropdown({
  placeholder, options, value, onChange, icon,
}: {
  placeholder: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  icon: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isActive = !!value;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border text-[13px] font-medium transition-all duration-150 cursor-pointer whitespace-nowrap
          ${isActive ? 'bg-green-700 text-white border-green-700' : 'bg-white text-gray-600 border-gray-200 hover:border-green-600 hover:text-green-700'}`}
      >
        <span className={isActive ? 'text-white' : 'text-gray-400'}>{icon}</span>
        <span>{isActive ? selected?.label : placeholder}</span>
        {isActive ? (
          <span onClick={(e) => { e.stopPropagation(); onChange(''); }} className="w-4 h-4 flex items-center justify-center rounded-full bg-white bg-opacity-20 hover:bg-opacity-40">
            <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
          </span>
        ) : (
          <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="none">
            <path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] min-w-[160px] bg-white border border-gray-200 rounded-xl shadow-lg z-30 overflow-hidden py-1">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`flex items-center justify-between w-full px-4 py-2.5 text-[13px] font-medium text-left transition-colors cursor-pointer
                ${opt.value === value ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
            >
              {opt.label}
              {opt.value === value && (
                <svg className="w-3.5 h-3.5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------
   Org Card
   ---------------------------------------------------------------- */
function OrgCard({ org }: { org: Organization }) {
  const isSuspended = org.status === 'Suspended';
  return (
    <Link
      href={`/organizations/${org.id}`}
      className={`group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 no-underline flex flex-col ${isSuspended ? 'opacity-60' : ''}`}
    >
      <div className="px-5 pt-5 pb-4 flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-[13px] font-bold ${org.color}`}>
          {org.acronym.slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[14px] font-semibold text-gray-900 leading-snug group-hover:text-green-700 transition-colors line-clamp-2">
              {org.name}
            </h3>
            {isSuspended && (
              <span className="flex-shrink-0 text-[10px] font-semibold bg-red-50 text-red-500 border border-red-200 px-2 py-0.5 rounded-full">
                Suspended
              </span>
            )}
          </div>
          <span className="text-[11px] text-gray-400 font-medium">{org.acronym}</span>
        </div>
      </div>

      <div className="px-5 pb-4">
        <p className="text-[12px] text-gray-500 leading-relaxed line-clamp-3">{org.description}</p>
      </div>

      <div className="mt-auto px-5 py-3 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[12px] text-gray-400">
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM3 17a7 7 0 1114 0H3z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            {org.members}
          </div>
          <div className="flex items-center gap-1 text-[12px] text-gray-400">
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none">
              <path d="M6 2v2M14 2v2M3 8h14M5 4h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            {org.eventsThisYear} events
          </div>
        </div>
        <svg className="w-4 h-4 text-gray-300 group-hover:text-green-600 group-hover:translate-x-0.5 transition-all" viewBox="0 0 20 20" fill="none">
          <path d="M7 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </Link>
  );
}

/* ----------------------------------------------------------------
   Category section header
   ---------------------------------------------------------------- */
function CategoryHeader({ category }: { category: OrgCategory }) {
  const meta = CATEGORY_META[category];
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${meta.bg} mb-4`}>
      <p className={`text-[14px] font-bold ${meta.color}`}>{category} Organizations</p>
      <span className="text-gray-300">·</span>
      <p className={`text-[12px] ${meta.color} opacity-70`}>{meta.description}</p>
    </div>
  );
}

/* ----------------------------------------------------------------
   Page
   ---------------------------------------------------------------- */
export default function OrganizationsPage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<OrgCategory | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return MOCK_ORGS.filter((o) =>
      (!search || o.name.toLowerCase().includes(q) || o.acronym.toLowerCase().includes(q)) &&
      (activeTab === 'All' || o.category === activeTab) &&
      (!statusFilter || o.status === statusFilter)
    );
  }, [search, activeTab, statusFilter]);

  const grouped = useMemo(() => {
    const cats: OrgCategory[] = ['Academic', 'Non-Academic', 'Religious'];
    return cats.map((cat) => ({ category: cat, orgs: filtered.filter((o) => o.category === cat) })).filter((g) => g.orgs.length > 0);
  }, [filtered]);

  const hasFilters = !!(search || statusFilter || activeTab !== 'All');

  function clearAll() { setSearch(''); setActiveTab('All'); setStatusFilter(''); }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar role="student" user={{ name: 'Juan dela Cruz', schoolId: '2021-00142', department: 'BSCS 3A' }} />

      <main className="flex-1 w-full max-w-[1280px] mx-auto px-6 lg:px-12 py-8 flex flex-col gap-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-bold text-gray-900 tracking-tight">Student Organizations</h1>
            <p className="text-[14px] text-gray-500 mt-1">Discover and join accredited CvSU student organizations.</p>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="flex flex-col items-end">
              <span className="text-[22px] font-bold text-green-700 leading-none">{MOCK_ORGS.filter((o) => o.status === 'Active').length}</span>
              <span className="text-[11px] text-gray-400">Active orgs</span>
            </div>
            <div className="h-8 w-px bg-gray-200" />
            <div className="flex flex-col items-end">
              <span className="text-[22px] font-bold text-gray-700 leading-none">{MOCK_ORGS.length}</span>
              <span className="text-[11px] text-gray-400">Total orgs</span>
            </div>
          </div>
        </div>

        {/* ── Search + filter bar ── */}
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex flex-col gap-3">
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 20 20" fill="none">
              <path d="M9 17A8 8 0 109 1a8 8 0 000 16zM19 19l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Search by organization name or acronym..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 text-[14px] text-gray-900 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-600 focus:bg-white focus:shadow-[0_0_0_3px_#dcfce7] transition-all placeholder:text-gray-400"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-gray-400 mr-1">
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none"><path d="M3 5h14M6 10h8M9 15h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              Filters
            </div>
            <FilterDropdown
              placeholder="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              icon={<svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" /><path d="M10 6v5l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>}
              options={[
                { value: '', label: 'All Status' },
                { value: 'Active', label: 'Active' },
                { value: 'Suspended', label: 'Suspended' },
              ]}
            />
            {hasFilters && (
              <>
                <div className="h-5 w-px bg-gray-200 mx-1" />
                <button onClick={clearAll} className="text-[12px] font-medium text-red-500 hover:text-red-600 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                  Clear
                </button>
              </>
            )}
            <span className="ml-auto text-[12px] text-gray-400">
              {filtered.length} {filtered.length === 1 ? 'organization' : 'organizations'}
            </span>
          </div>
        </div>

        {/* ── Category tabs ── */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit">
          {CATEGORY_TABS.map((tab) => {
            const count = tab.value === 'All' ? filtered.length : filtered.filter((o) => o.category === tab.value).length;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 cursor-pointer whitespace-nowrap
                  ${activeTab === tab.value ? 'bg-green-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
              >
                {tab.label}
                <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full
                  ${activeTab === tab.value ? 'bg-white bg-opacity-20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Content ── */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-300" viewBox="0 0 24 24" fill="none">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-[15px] font-semibold text-gray-700">No organizations found</p>
            <p className="text-[13px] text-gray-400 max-w-xs">Try adjusting your search or clearing the filters.</p>
            <button onClick={clearAll} className="mt-1 text-[13px] font-semibold text-green-700 hover:underline cursor-pointer">Clear all filters</button>
          </div>
        ) : activeTab === 'All' ? (
          <div className="flex flex-col gap-8">
            {grouped.map(({ category, orgs }) => (
              <div key={category}>
                <CategoryHeader category={category} />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {orgs.map((org) => <OrgCard key={org.id} org={org} />)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <CategoryHeader category={activeTab as OrgCategory} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((org) => <OrgCard key={org.id} org={org} />)}
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200 bg-white mt-8">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[12px] text-gray-400">© {new Date().getFullYear()} Cavite State University · Office of Student Affairs</p>
          <div className="flex items-center gap-4">
            <Link href="#" className="text-[12px] text-gray-400 hover:text-gray-600 no-underline">Privacy Policy</Link>
            <Link href="#" className="text-[12px] text-gray-400 hover:text-gray-600 no-underline">Contact Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}