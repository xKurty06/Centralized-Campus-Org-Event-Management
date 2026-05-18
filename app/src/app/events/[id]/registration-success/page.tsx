'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';

/* ----------------------------------------------------------------
   Mock — replace with API fetch
   ---------------------------------------------------------------- */
const MOCK_EVENT = {
  id: '1',
  title: 'Web Development Summit 2025',
  date: '2025-03-12',
  time: '8:00 AM',
  endTime: '5:00 PM',
  venue: 'Main Hall, CvSU Indang Campus',
  type: 'Free' as const,
  fee: 0,
  organization: 'Computer Science Society',
};

/* ----------------------------------------------------------------
   Helpers
   ---------------------------------------------------------------- */
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

/* ----------------------------------------------------------------
   Page
   ---------------------------------------------------------------- */
export default function RegistrationSuccessPage() {
  const params       = useParams();
  const searchParams = useSearchParams();
  const isPaid       = searchParams.get('paid') === 'true';
  const isOnsite     = searchParams.get('method') === 'onsite';
  const event        = MOCK_EVENT; // swap for real fetch using params.id

  /* Determine registration state */
  const state: 'confirmed' | 'pending-online' | 'pending-onsite' =
    isPaid ? (isOnsite ? 'pending-onsite' : 'pending-online') : 'confirmed';

  const stateConfig = {
    confirmed: {
      icon: (
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-10 h-10 text-green-600" viewBox="0 0 24 24" fill="none">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      ),
      badge: <span className="text-[12px] font-semibold bg-green-100 text-green-700 px-3 py-1 rounded-full">Confirmed</span>,
      title: 'You\'re registered!',
      message: 'Your registration has been confirmed. See you at the event!',
      color: 'border-green-200',
    },
    'pending-online': {
      icon: (
        <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center">
          <svg className="w-10 h-10 text-amber-500" viewBox="0 0 24 24" fill="none">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      ),
      badge: <span className="text-[12px] font-semibold bg-amber-50 text-amber-600 border border-amber-200 px-3 py-1 rounded-full">Pending payment review</span>,
      title: 'Registration received!',
      message: 'Your proof of payment has been submitted. An officer will verify it and confirm your registration shortly.',
      color: 'border-amber-200',
    },
    'pending-onsite': {
      icon: (
        <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
          <svg className="w-10 h-10 text-blue-500" viewBox="0 0 24 24" fill="none">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      ),
      badge: <span className="text-[12px] font-semibold bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1 rounded-full">Pay on-site</span>,
      title: 'Slot reserved!',
      message: 'Your slot has been reserved. Please pay the entry fee at the venue to confirm your attendance.',
      color: 'border-blue-200',
    },
  };

  const cfg = stateConfig[state];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar role="student" user={{ name: 'Juan dela Cruz', schoolId: '2021-00142', department: 'BSCS 3A' }} />

      <main className="flex-1 w-full max-w-[560px] mx-auto px-6 py-12 flex flex-col gap-6">

        {/* ── Success card ── */}
        <div className={`bg-white rounded-2xl border ${cfg.color} shadow-sm overflow-hidden`}>

          {/* Top section */}
          <div className="flex flex-col items-center text-center px-8 py-10 gap-4">
            {cfg.icon}
            {cfg.badge}
            <div className="flex flex-col gap-2">
              <h1 className="text-[24px] font-bold text-gray-900">{cfg.title}</h1>
              <p className="text-[14px] text-gray-500 leading-relaxed max-w-sm">{cfg.message}</p>
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          {/* Event summary */}
          <div className="px-6 py-5 flex flex-col gap-3">
            <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide">Event details</p>

            <div className="flex flex-col gap-2.5">
              <SummaryRow icon={<IconTitle />} label={event.title} sublabel={event.organization} />
              <SummaryRow icon={<IconCalendar />} label={formatDate(event.date)} sublabel={`${event.time} – ${event.endTime}`} />
              <SummaryRow icon={<IconPin />} label={event.venue} />
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          {/* School ID reminder */}
          <div className="px-6 py-4 bg-gray-50">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-green-700" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2a4 4 0 100 8 4 4 0 000-8zM4 16a6 6 0 1112 0H4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="text-[13px] font-semibold text-gray-800">Bring your School ID</p>
                <p className="text-[12px] text-gray-500 leading-relaxed">
                  Present your CvSU School ID at the entrance for verification. Your registered ID is{' '}
                  <span className="font-semibold text-green-700">2021-00142</span>.
                </p>
              </div>
            </div>
          </div>

          {/* Next steps for pending states */}
          {state !== 'confirmed' && (
            <>
              <div className="h-px bg-gray-100" />
              <div className="px-6 py-4">
                <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide mb-3">Next steps</p>
                <div className="flex flex-col gap-2.5">
                  {state === 'pending-online' && (
                    <>
                      <StepItem number={1} text="An officer will review your payment screenshot." done />
                      <StepItem number={2} text="You'll receive a confirmation once payment is verified." />
                      <StepItem number={3} text="Present your School ID at the entrance on the event day." />
                    </>
                  )}
                  {state === 'pending-onsite' && (
                    <>
                      <StepItem number={1} text="Arrive at the venue on the event day." />
                      <StepItem number={2} text={`Pay the ₱${event.fee} entry fee at the registration table.`} />
                      <StepItem number={3} text="Present your School ID for verification." />
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Actions ── */}
        <div className="flex flex-col gap-3">
          <Link
            href="/my-events"
            className="w-full flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white text-[14px] font-semibold py-3 rounded-xl transition-colors no-underline"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
              <path d="M6 2v2M14 2v2M3 8h14M5 4h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            View in My Events
          </Link>
          <Link
            href="/events"
            className="w-full flex items-center justify-center text-[14px] font-medium text-gray-500 hover:text-gray-700 py-3 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors no-underline"
          >
            Browse more events
          </Link>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200 bg-white mt-4">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[12px] text-gray-400">© {new Date().getFullYear()} Cavite State University · SALIKOP</p>
          <div className="flex items-center gap-4">
            <Link href="#" className="text-[12px] text-gray-400 hover:text-gray-600 no-underline">Privacy Policy</Link>
            <Link href="#" className="text-[12px] text-gray-400 hover:text-gray-600 no-underline">Contact Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ----------------------------------------------------------------
   Sub-components
   ---------------------------------------------------------------- */
function SummaryRow({
  icon, label, sublabel,
}: { icon: React.ReactNode; label: string; sublabel?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-400 mt-0.5">
        {icon}
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-[13px] font-semibold text-gray-800">{label}</span>
        {sublabel && <span className="text-[12px] text-gray-400">{sublabel}</span>}
      </div>
    </div>
  );
}

function StepItem({ number, text, done }: { number: number; text: string; done?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold
        ${done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
        {done
          ? <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
          : number
        }
      </div>
      <p className="text-[13px] text-gray-600 leading-snug pt-0.5">{text}</p>
    </div>
  );
}

/* ----------------------------------------------------------------
   Icons
   ---------------------------------------------------------------- */
function IconTitle() {
  return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none"><rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M7 8h6M7 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
function IconCalendar() {
  return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none"><path d="M6 2v2M14 2v2M3 8h14M5 4h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
function IconPin() {
  return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none"><path d="M10 2C7.24 2 5 4.24 5 7c0 4.5 5 11 5 11s5-6.5 5-11c0-2.76-2.24-5-5-5zm0 7a2 2 0 110-4 2 2 0 010 4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}