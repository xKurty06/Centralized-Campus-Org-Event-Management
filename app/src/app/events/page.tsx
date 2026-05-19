'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

/* ----------------------------------------------------------------
   Types
   ---------------------------------------------------------------- */
type EventCategory =
  | 'Workshop'
  | 'Seminar'
  | 'Competition'
  | 'Training'
  | 'Outreach'
  | 'Cultural'
  | 'Activity'
  | 'Other';

type AudienceType = 'Public' | 'Org_Members_Only';

type EventType = 'Free' | 'Paid';

interface CampusEvent {
  id: string;
  title: string;
  category: EventCategory;
  organization: string;
  orgCategory: 'Academic' | 'Non-Academic' | 'Religious';
  audience_type: AudienceType;
  is_member: boolean;
  date: string;
  time: string;
  venue: string;
  type: EventType;
  fee?: number;
  capacity: number;
  registered: number;
}

/* ----------------------------------------------------------------
   Mock data
   ---------------------------------------------------------------- */
const MOCK_EVENTS: CampusEvent[] = [
  { id: '1', title: 'Web Development Summit 2025', category: 'Workshop', organization: 'Computer Science Society', orgCategory: 'Academic', audience_type: 'Org_Members_Only', is_member: true, date: '2025-03-12', time: '8:00 AM', venue: 'Main Hall', type: 'Free', capacity: 150, registered: 42 },
  { id: '2', title: 'Leadership & Governance Talk', category: 'Seminar', organization: 'University Student Council', orgCategory: 'Non-Academic', audience_type: 'Org_Members_Only', is_member: true, date: '2025-03-15', time: '1:00 PM', venue: 'AVR Building B', type: 'Paid', fee: 50, capacity: 80, registered: 67 },
  { id: '3', title: 'Hackathon 2025', category: 'Competition', organization: 'GDSC CvSU', orgCategory: 'Academic', audience_type: 'Public', is_member: false, date: '2025-03-20', time: '7:00 AM', venue: 'Gymnasium', type: 'Free', capacity: 200, registered: 188 },
  { id: '4', title: 'Basic First Aid Training', category: 'Training', organization: 'Red Cross Youth', orgCategory: 'Non-Academic', audience_type: 'Org_Members_Only', is_member: true, date: '2025-03-22', time: '8:00 AM', venue: 'Clinic Area', type: 'Free', capacity: 60, registered: 34 },
  { id: '5', title: 'Brigada Eskwela Outreach', category: 'Outreach', organization: 'CvSU Volunteers Club', orgCategory: 'Non-Academic', audience_type: 'Org_Members_Only', is_member: false, date: '2025-03-28', time: '6:00 AM', venue: 'Off-campus', type: 'Free', capacity: 100, registered: 78 },
  { id: '6', title: 'Kultura Festival 2025', category: 'Cultural', organization: 'Sining at Kulturang CvSU', orgCategory: 'Non-Academic', audience_type: 'Public', is_member: true, date: '2025-04-02', time: '3:00 PM', venue: 'Open Court', type: 'Paid', fee: 80, capacity: 500, registered: 312 },
  { id: '7', title: 'Research Writing Workshop', category: 'Workshop', organization: 'Computer Science Society', orgCategory: 'Academic', audience_type: 'Org_Members_Only', is_member: false, date: '2025-04-05', time: '9:00 AM', venue: 'Library AVR', type: 'Free', capacity: 50, registered: 29 },
  { id: '8', title: 'Campus Bible Study', category: 'Activity', organization: 'Campus Christian Fellowship', orgCategory: 'Religious', audience_type: 'Public', is_member: false, date: '2025-04-07', time: '5:00 PM', venue: 'Chapel', type: 'Free', capacity: 80, registered: 41 },
  { id: '9', title: 'Intramurals 2025', category: 'Activity', organization: 'University Student Council', orgCategory: 'Non-Academic', audience_type: 'Public', is_member: false, date: '2025-04-10', time: '8:00 AM', venue: 'Sports Complex', type: 'Paid', fee: 30, capacity: 300, registered: 256 }
];

const CATEGORIES: (EventCategory | '')[] = ['', 'Workshop', 'Seminar', 'Competition', 'Training', 'Outreach', 'Cultural', 'Activity', 'Other'];
const ORGANIZATIONS = ['', ...new Set(MOCK_EVENTS.map((e) => e.organization))];
const VENUES = ['', ...new Set(MOCK_EVENTS.map((e) => e.venue))];
const TYPES = ['', 'Free', 'Paid'];

/* ----------------------------------------------------------------
   Helpers
   ---------------------------------------------------------------- */
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

const CATEGORY_COLORS: Record<EventCategory, string> = {
  Workshop: 'bg-blue-50 text-blue-700',
  Seminar: 'bg-purple-50 text-purple-700',
  Competition: 'bg-orange-50 text-orange-700',
  Training: 'bg-yellow-50 text-yellow-800',
  Outreach: 'bg-teal-50 text-teal-700',
  Cultural: 'bg-pink-50 text-pink-700',
  Activity: 'bg-indigo-50 text-indigo-700',
  Other: 'bg-gray-100 text-gray-600',
};

const BANNER_COLORS: Record<string, string> = {
  '1': 'bg-blue-100', '2': 'bg-purple-100', '3': 'bg-orange-100',
  '4': 'bg-teal-100', '5': 'bg-green-100', '6': 'bg-pink-100',
  '7': 'bg-blue-50', '8': 'bg-yellow-50', '9': 'bg-indigo-100',
  '10': 'bg-orange-50', '11': 'bg-green-50', '12': 'bg-red-50',
};



/* ----------------------------------------------------------------
   Custom branded dropdown
   ---------------------------------------------------------------- */
interface DropdownOption { value: string; label: string; }

function FilterDropdown({
  icon,
  placeholder,
  options,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  placeholder: string;
  options: DropdownOption[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const isActive = !!value;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border text-[13px] font-medium transition-all duration-150 cursor-pointer whitespace-nowrap
          ${isActive
            ? 'bg-green-700 text-white border-green-700'
            : 'bg-white text-gray-600 border-gray-200 hover:border-green-600 hover:text-green-700'
          }`}
      >
        <span className={isActive ? 'text-white' : 'text-gray-400'}>{icon}</span>
        <span>{isActive ? selected?.label : placeholder}</span>
        {isActive ? (
          /* Clear x */
          <span
            onClick={(e) => { e.stopPropagation(); onChange(''); }}
            className="ml-0.5 w-4 h-4 flex items-center justify-center rounded-full bg-white bg-opacity-20 hover:bg-opacity-40 transition-colors"
          >
            <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </span>
        ) : (
          <svg className={`w-3.5 h-3.5 transition-transform duration-150 ${open ? 'rotate-180' : ''} ${isActive ? 'text-white' : 'text-gray-400'}`} viewBox="0 0 20 20" fill="none">
            <path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] min-w-[180px] bg-white border border-gray-200 rounded-xl shadow-lg z-30 overflow-hidden py-1">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`flex items-center justify-between w-full px-4 py-2.5 text-[13px] font-medium text-left transition-colors duration-100 cursor-pointer
                ${opt.value === value
                  ? 'bg-green-50 text-green-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              {opt.label || `All ${placeholder}s`}
              {opt.value === value && (
                <svg className="w-3.5 h-3.5 text-green-600 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
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
   Event Card
   ---------------------------------------------------------------- */
function EventCard({ event, isOrgMembersOnly }: { event: CampusEvent, isOrgMembersOnly?: boolean }) {
  const spots = event.capacity - event.registered;
  const isFull = spots <= 0;

  return (
    <Link
      href={`/events/${event.id}`}
      className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 no-underline flex flex-col"
    >
      {/* Banner */}
      <div className={`h-36 ${BANNER_COLORS[event.id] ?? 'bg-gray-100'} relative flex items-center justify-center`}>
        <svg className="w-10 h-10 text-gray-300" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 2v4M16 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        {/* Type badge */}
        <div className="absolute top-3 right-3">
          {event.type === 'Free'
            ? <span className="text-[11px] font-semibold bg-green-700 text-white px-2.5 py-1 rounded-full">Free</span>
            : <span className="text-[11px] font-semibold bg-amber-500 text-white px-2.5 py-1 rounded-full">₱{event.fee}</span>
          }
        </div>
        {isFull && (
          <div className="absolute top-3 left-3">
            <span className="text-[11px] font-semibold bg-red-500 text-white px-2.5 py-1 rounded-full">Full</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-2">
          <span className={`self-start text-[11px] font-semibold px-2.5 py-0.5 rounded-md ${CATEGORY_COLORS[event.category]}`}>
            {event.category}

          </span>
          {isOrgMembersOnly && (
            <span className="text-[11px] font-semibold bg-blue-500 text-white px-2.5 py-1 rounded-full">Members Only</span>
          )}
        </div>

        <h3 className="text-[14px] font-semibold text-gray-900 leading-snug group-hover:text-green-700 transition-colors line-clamp-2">
          {event.title}
        </h3>

        <div className="flex flex-col gap-1 mt-auto pt-2">
          <div className="flex items-center gap-1.5 text-[12px] text-gray-500">
            <IconClock />
            {formatDate(event.date)} · {event.time}
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-gray-500">
            <IconPin />
            {event.venue}
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-gray-500">
            <IconOrg />
            {event.organization}
          </div>
        </div>

        {/* Capacity bar */}
        <div className="mt-2 flex flex-col gap-1">
          <div className="flex justify-between">
            <span className="text-[11px] text-gray-400">{event.registered} registered</span>
            <span className={`text-[11px] font-medium ${isFull ? 'text-red-500' : 'text-green-700'}`}>
              {isFull ? 'Full' : `${spots} spots left`}
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${isFull ? 'bg-red-400' : 'bg-green-600'}`}
              style={{ width: `${Math.min((event.registered / event.capacity) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ----------------------------------------------------------------
   Page
   ---------------------------------------------------------------- */
export default function EventsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [organization, setOrganization] = useState('');
  const [venue, setVenue] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const filtered = useMemo(() => MOCK_EVENTS.filter((e) => {
    const q = search.toLowerCase();
    return (
      (!search || e.title.toLowerCase().includes(q) || e.organization.toLowerCase().includes(q)) &&
      (!category || e.category === category) &&
      (!organization || e.organization === organization) &&
      (!venue || e.venue === venue) &&
      (!typeFilter || e.type === typeFilter)
    );
  }), [search, category, organization, venue, typeFilter]);

  const activeFilters = [category, organization, venue, typeFilter].filter(Boolean).length;

  function clearAll() {
    setSearch('');
    setCategory('');
    setOrganization('');
    setVenue('');
    setTypeFilter('');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar
        role="student"
        user={{ name: 'Zean Kurt Balboobs', schoolId: '20246769', department: 'BSCS 3A' }}
      />

      <main className="flex-1 w-full max-w-[1280px] mx-auto px-6 lg:px-12 py-8 flex flex-col gap-6 animate-fade-in">

        {/* ── Page header ── */}
        <div className="flex flex-col gap-1">
          <h1 className="text-[26px] font-bold text-gray-900 tracking-tight">Campus Events</h1>
          <p className="text-[14px] text-gray-500">Browse all published events from accredited CvSU organizations.</p>
        </div>

        {/* ── Search + Filter bar ── */}
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex flex-col gap-3">

          {/* Row 1: search */}
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 20 20" fill="none">
              <path d="M9 17A8 8 0 109 1a8 8 0 000 16zM19 19l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Search events by title or organization..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 text-[14px] text-gray-900 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-600 focus:bg-white focus:shadow-[0_0_0_3px_#dcfce7] transition-all placeholder:text-gray-400"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>

          {/* Row 2: filter dropdowns */}
          <div className="flex flex-wrap items-center gap-2">

            {/* Filter icon label */}
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-gray-400 mr-1">
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
                <path d="M3 5h14M6 10h8M9 15h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Filters
            </div>

            {/* Category */}
            <FilterDropdown
              icon={<svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none"><path d="M4 6h12M4 10h8M4 14h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>}
              placeholder="Category"
              value={category}
              onChange={setCategory}
              options={CATEGORIES.map((c) => ({ value: c, label: c || 'All Categories' }))}
            />

            {/* Organization */}
            <FilterDropdown
              icon={<svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM3 17a7 7 0 1114 0H3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>}
              placeholder="Organization"
              value={organization}
              onChange={setOrganization}
              options={ORGANIZATIONS.map((o) => ({ value: o, label: o || 'All Organizations' }))}
            />

            {/* Venue */}
            <FilterDropdown
              icon={<svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none"><path d="M10 2C6.69 2 4 4.69 4 8c0 4.5 6 10 6 10s6-5.5 6-10c0-3.31-2.69-6-6-6zm0 8.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>}
              placeholder="Venue"
              value={venue}
              onChange={setVenue}
              options={VENUES.map((v) => ({ value: v, label: v || 'All Venues' }))}
            />

            {/* Type */}
            <FilterDropdown
              icon={<svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none"><path d="M9 5H7a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h0a2 2 0 002-2M9 5a2 2 0 012-2h0a2 2 0 012 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>}
              placeholder="Type"
              value={typeFilter}
              onChange={setTypeFilter}
              options={TYPES.map((t) => ({ value: t, label: t || 'All Types' }))}
            />

            {/* Divider + clear + count */}
            {activeFilters > 0 && (
              <>
                <div className="h-5 w-px bg-gray-200 mx-1" />
                <button
                  onClick={clearAll}
                  className="text-[12px] font-medium text-red-500 hover:text-red-600 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Clear {activeFilters > 1 ? `(${activeFilters})` : ''}
                </button>
              </>
            )}

            <span className="ml-auto text-[12px] text-gray-400">
              {filtered.length} {filtered.length === 1 ? 'event' : 'events'} found
            </span>
          </div>
        </div>

        {/* ── Event grid ── */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((event) => <EventCard key={event.id} event={event} isOrgMembersOnly={event.audience_type === 'Org_Members_Only'} />)}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-24 gap-3 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-300" viewBox="0 0 24 24" fill="none">
                <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-[15px] font-semibold text-gray-700">No events found</p>
            <p className="text-[13px] text-gray-400 max-w-xs">No events match your current filters. Try adjusting your search or clearing filters.</p>
            <button onClick={clearAll} className="mt-1 text-[13px] font-semibold text-green-700 hover:text-green-800 hover:underline cursor-pointer">
              Clear all filters
            </button>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200 bg-white mt-8">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[12px] text-gray-400">© {new Date().getFullYear()} Cavite State University · SALIKOP</p>
          <div className="flex items-center gap-4">
            <Link href="#" className="text-[12px] text-gray-400 hover:text-gray-600 no-underline transition-colors">Privacy Policy</Link>
            <Link href="#" className="text-[12px] text-gray-400 hover:text-gray-600 no-underline transition-colors">Contact Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ----------------------------------------------------------------
   Inline icons
   ---------------------------------------------------------------- */
function IconClock() {
  return (
    <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 4.5v4l2.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function IconPin() {
  return (
    <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 16 16" fill="none">
      <path d="M8 1C5.24 1 3 3.24 3 6c0 3.75 5 9 5 9s5-5.25 5-9c0-2.76-2.24-5-5-5zm0 6.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function IconOrg() {
  return (
    <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 16 16" fill="none">
      <path d="M8 8a3 3 0 100-6 3 3 0 000 6zm-5 6a5 5 0 0110 0H3z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}